import { skillRegistry } from "./registry";
import { SkillContext, SkillResult } from "./types";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { NotFoundError, AppError } from "@/lib/types/errors";
import { HaulLogRepository, InvoiceRepository } from "@/lib/db";

/**
 * Map job type to skill name
 *
 * @param jobType - Job type from analysis_jobs.job_type
 * @returns Skill name to execute
 * @throws AppError if job type is unknown
 */
function mapJobTypeToSkill(jobType: string): string {
  const mapping: Record<string, string> = {
    complete_analysis: "wastewise-analytics",
    invoice_extraction: "batch-extractor",
    regulatory_research: "regulatory-research",
    report_generation: "wastewise-analytics",
  };

  const skillName = mapping[jobType];
  if (!skillName) {
    throw new AppError(`Unknown job type: ${jobType}`, "INVALID_JOB_TYPE", 400);
  }

  return skillName;
}

/**
 * Build skill execution context with data from repositories
 *
 * @param projectId - Project UUID
 * @param userId - User UUID
 * @param skillName - Name of the skill to configure
 * @param onProgress - Optional progress callback
 * @returns Populated SkillContext
 */
export async function buildSkillContext(
  projectId: string,
  userId: string,
  skillName: string,
  onProgress?: (percent: number, step: string) => Promise<void>,
  supabaseClient?: ReturnType<typeof createClient> | any, // Accept injected client
): Promise<SkillContext> {
  const contextLogger = logger.child({ projectId, skillName });

  // Use injected client (service role) or create default client (user session)
  const supabase = supabaseClient || (await createClient());

  // Initialize repositories
  const haulLogRepo = new HaulLogRepository(supabase);
  const invoiceRepo = new InvoiceRepository(supabase);

  contextLogger.debug("Loading project data", { userId });

  // Load project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    const error = new NotFoundError("Project", projectId);
    contextLogger.error("Project not found", error);
    throw error;
  }

  // Load invoices
  const { data: invoices, error: invoicesError } =
    await invoiceRepo.getByProjectId(projectId);

  if (invoicesError) {
    contextLogger.error("Failed to load invoices", new Error(invoicesError));
    throw new Error(`Failed to load invoices: ${invoicesError}`);
  }

  // Load haul log (optional - specific skills will validate if they need it)
  const { data: haulLog, error: haulLogError } =
    await haulLogRepo.getByProjectId(projectId);

  if (haulLogError) {
    // Log warning but don't fail - haul logs might not exist for non-compactor projects
    contextLogger.warn("Failed to load haul log", new Error(haulLogError));
  }

  contextLogger.debug("Data loaded successfully", {
    invoicesCount: invoices?.length || 0,
    haulLogCount: haulLog?.length || 0,
  });

  // Get skill config from registry (backed by database)
  const config = await skillRegistry.getConfig(skillName);

  contextLogger.debug("Skill config loaded", {
    compactorYpd: config.conversionRates.compactorYpd,
    targetCapacity: config.conversionRates.targetCapacity,
  });

  // Build SkillContext
  return {
    projectId,
    userId,
    project,
    invoices: invoices || [],
    haulLog: haulLog || [],
    config,
    onProgress: onProgress
      ? async (p) => {
          await onProgress(p.percent, p.step);
        }
      : undefined,
  };
}

/**
 * Execute a skill for a given project
 *
 * Dynamically routes to the appropriate skill based on job type.
 * Loads all necessary data and builds SkillContext.
 *
 * @param projectId - Project UUID
 * @param jobType - Job type from analysis_jobs.job_type
 * @returns SkillResult with success/failure and data
 * @throws AppError if job type is unknown
 */
export async function executeSkill(
  projectId: string,
  jobType: string,
): Promise<SkillResult> {
  const executionLogger = logger.child({ projectId, jobType });

  // Dynamic skill routing based on job type
  const skillName = mapJobTypeToSkill(jobType);

  executionLogger.info(`Starting skill execution: ${skillName}`);

  // Get skill from registry
  const skill = skillRegistry.get(skillName);

  if (!skill) {
    const error = new NotFoundError("Skill", skillName);
    executionLogger.error("Skill not found in registry", error, { skillName });
    throw error;
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = new NotFoundError("User");
    executionLogger.error("Authentication failed", error);
    throw error;
  }

  // Build context
  const context = await buildSkillContext(projectId, user.id, skillName);

  // Execute skill with metrics tracking
  const timerId = metrics.startTimer("skill.execution", { skill: skillName });

  try {
    executionLogger.info("Executing skill", { skillName });

    const result = await skill.execute(context);

    const duration = metrics.stopTimer(timerId);

    // Record metrics
    metrics.recordSkillExecution(
      skillName,
      result.success,
      duration,
      result.metadata.aiUsage?.requests,
      result.metadata.aiUsage?.costUsd,
    );

    executionLogger.info("Skill execution completed", {
      skillName,
      success: result.success,
      durationMs: duration,
      aiRequests: result.metadata.aiUsage?.requests || 0,
      aiCostUsd: result.metadata.aiUsage?.costUsd || 0,
    });

    return result;
  } catch (error) {
    metrics.stopTimer(timerId);

    executionLogger.error("Skill execution failed", error as Error, {
      skillName,
    });

    throw error;
  }
}

/**
 * Execute skill with progress callback
 *
 * Useful for long-running operations that need progress updates.
 * Dynamically routes to the appropriate skill based on job type.
 *
 * @param projectId - Project UUID
 * @param jobType - Job type from analysis_jobs.job_type
 * @param onProgress - Callback for progress updates
 * @param userId - Optional user ID (for worker context). If not provided, gets from auth session.
 * @returns SkillResult
 * @throws AppError if job type is unknown
 */
export async function executeSkillWithProgress(
  projectId: string,
  jobType: string,
  onProgress: (percent: number, step: string) => Promise<void>,
  userId?: string,
): Promise<SkillResult> {
  const executionLogger = logger.child({ projectId, jobType });

  // Dynamic skill routing based on job type
  const skillName = mapJobTypeToSkill(jobType);

  const skill = skillRegistry.get(skillName);

  if (!skill) {
    throw new NotFoundError("Skill", skillName);
  }

  // Get user ID: use provided userId (worker context) or get from auth session (web context)
  let currentUserId: string;
  let supabaseClient = undefined;

  if (userId) {
    // Worker context: use provided user ID and Service Role client
    currentUserId = userId;
    // Create service role client to bypass RLS since we don't have a user session
    supabaseClient = createServiceClient();
    executionLogger.info(
      "Using provided user ID and Service Role client (worker context)",
      { userId: currentUserId },
    );
    console.log("Worker context detected, creating service client");
  } else {
    // Web context: get from authenticated session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new NotFoundError("User");
    }
    currentUserId = user.id;
    executionLogger.info("Using authenticated user ID (web context)", {
      userId: currentUserId,
    });
    console.log("User context detected, creating regular client");
  }

  console.log("Building skill context...");
  // Build context with progress callback
  const context = await buildSkillContext(
    projectId,
    currentUserId,
    skillName,
    onProgress,
    supabaseClient,
  );
  console.log("Skill context built successfully");

  const timerId = metrics.startTimer("skill.execution", { skill: skillName });

  try {
    console.log(`Executing skill ${skillName}...`);
    const result = await skill.execute(context);
    console.log("Skill execution completed");

    const duration = metrics.stopTimer(timerId);

    metrics.recordSkillExecution(
      skillName,
      result.success,
      duration,
      result.metadata.aiUsage?.requests,
      result.metadata.aiUsage?.costUsd,
    );

    executionLogger.info("Skill execution with progress completed", {
      skillName,
      success: result.success,
      durationMs: duration,
    });

    return result;
  } catch (error) {
    console.error("Skill execution failed:", error);
    metrics.stopTimer(timerId);
    executionLogger.error(
      "Skill execution with progress failed",
      error as Error,
      { skillName },
    );
    throw error;
  }
}
