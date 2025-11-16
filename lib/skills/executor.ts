/**
 * Skill Executor
 *
 * Executes skills with proper data loading and context building.
 * Supports dynamic skill routing based on job type.
 */

import { skillRegistry } from './registry'
import { SkillContext, SkillResult } from './types'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'
import { metrics } from '@/lib/observability/metrics'
import { NotFoundError, InsufficientDataError, AppError } from '@/lib/types/errors'

/**
 * Map job type to skill name
 *
 * @param jobType - Job type from analysis_jobs.job_type
 * @returns Skill name to execute
 * @throws AppError if job type is unknown
 */
function mapJobTypeToSkill(jobType: string): string {
  const mapping: Record<string, string> = {
    complete_analysis: 'wastewise-analytics',
    invoice_extraction: 'batch-extractor',
    regulatory_research: 'regulatory-research',
    report_generation: 'wastewise-analytics',
  }

  const skillName = mapping[jobType]
  if (!skillName) {
    throw new AppError(
      `Unknown job type: ${jobType}`,
      'INVALID_JOB_TYPE',
      400
    )
  }

  return skillName
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
export async function executeSkill(projectId: string, jobType: string): Promise<SkillResult> {
  const executionLogger = logger.child({ projectId, jobType })

  // Dynamic skill routing based on job type
  const skillName = mapJobTypeToSkill(jobType)

  executionLogger.info(`Starting skill execution: ${skillName}`)

  // 1. Get skill from registry
  const skill = skillRegistry.get(skillName)

  if (!skill) {
    const error = new NotFoundError('Skill', skillName)
    executionLogger.error('Skill not found in registry', error, { skillName })
    throw error
  }

  // 2. Load data from database
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    const error = new NotFoundError('User')
    executionLogger.error('Authentication failed', error)
    throw error
  }

  executionLogger.debug('Loading project data', { userId: user.id })

  // Load project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    const error = new NotFoundError('Project', projectId)
    executionLogger.error('Project not found', error)
    throw error
  }

  // Load invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoice_data')
    .select('*')
    .eq('project_id', projectId)

  if (invoicesError) {
    executionLogger.error('Failed to load invoices', invoicesError as Error)
    throw invoicesError
  }

  // Load haul log (required for compactor optimization)
  const { data: haulLog, error: haulLogError } = await supabase
    .from('haul_log')
    .select('*')
    .eq('project_id', projectId)
    .order('haul_date', { ascending: true })

  if (haulLogError) {
    executionLogger.error('Failed to load haul log', haulLogError as Error)
    throw haulLogError
  }

  if (!haulLog || haulLog.length === 0) {
    const error = new InsufficientDataError(
      'compactor-optimization',
      ['haulLog'],
      { message: 'No haul log data found for compactor optimization' }
    )
    executionLogger.error('Missing haul log data', error)
    throw error
  }

  executionLogger.debug('Data loaded successfully', {
    invoicesCount: invoices?.length || 0,
    haulLogCount: haulLog?.length || 0,
  })

  // 3. Get skill config from database
  const config = await skillRegistry.getConfig(skillName)

  executionLogger.debug('Skill config loaded', {
    compactorYpd: config.conversionRates.compactorYpd,
    targetCapacity: config.conversionRates.targetCapacity,
    compactorThreshold: config.thresholds.compactorTons,
  })

  // 4. Build SkillContext
  const context: SkillContext = {
    projectId,
    userId: user.id,
    project,
    invoices: invoices || [],
    haulLog,
    config,
  }

  // 5. Execute skill with metrics tracking
  const timerId = metrics.startTimer('skill.execution', { skill: skillName })

  try {
    executionLogger.info('Executing skill', { skillName })

    const result = await skill.execute(context)

    const duration = metrics.stopTimer(timerId)

    // Record metrics
    metrics.recordSkillExecution(
      skillName,
      result.success,
      duration,
      result.metadata.aiUsage?.requests,
      result.metadata.aiUsage?.costUsd
    )

    executionLogger.info('Skill execution completed', {
      skillName,
      success: result.success,
      durationMs: duration,
      aiRequests: result.metadata.aiUsage?.requests || 0,
      aiCostUsd: result.metadata.aiUsage?.costUsd || 0,
    })

    return result
  } catch (error) {
    metrics.stopTimer(timerId)

    executionLogger.error('Skill execution failed', error as Error, {
      skillName,
    })

    throw error
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
 * @returns SkillResult
 * @throws AppError if job type is unknown
 */
export async function executeSkillWithProgress(
  projectId: string,
  jobType: string,
  onProgress: (percent: number, step: string) => Promise<void>
): Promise<SkillResult> {
  const executionLogger = logger.child({ projectId, jobType })

  // Dynamic skill routing based on job type
  const skillName = mapJobTypeToSkill(jobType)

  const skill = skillRegistry.get(skillName)

  if (!skill) {
    throw new NotFoundError('Skill', skillName)
  }

  // Load data (same as executeSkill)
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new NotFoundError('User')
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    throw new NotFoundError('Project', projectId)
  }

  const { data: invoices } = await supabase
    .from('invoice_data')
    .select('*')
    .eq('project_id', projectId)

  const { data: haulLog } = await supabase
    .from('haul_log')
    .select('*')
    .eq('project_id', projectId)
    .order('haul_date', { ascending: true })

  if (!haulLog || haulLog.length === 0) {
    throw new InsufficientDataError(
      'compactor-optimization',
      ['haulLog'],
      { message: 'No haul log data found for compactor optimization' }
    )
  }

  const config = await skillRegistry.getConfig(skillName)

  // Build context with progress callback
  const context: SkillContext = {
    projectId,
    userId: user.id,
    project,
    invoices: invoices || [],
    haulLog,
    config,
    onProgress: async progress => {
      await onProgress(progress.percent, progress.step)
    },
  }

  const timerId = metrics.startTimer('skill.execution', { skill: skillName })

  try {
    const result = await skill.execute(context)

    const duration = metrics.stopTimer(timerId)

    metrics.recordSkillExecution(
      skillName,
      result.success,
      duration,
      result.metadata.aiUsage?.requests,
      result.metadata.aiUsage?.costUsd
    )

    executionLogger.info('Skill execution with progress completed', {
      skillName,
      success: result.success,
      durationMs: duration,
    })

    return result
  } catch (error) {
    metrics.stopTimer(timerId)
    executionLogger.error(
      'Skill execution with progress failed',
      error as Error,
      { skillName }
    )
    throw error
  }
}
