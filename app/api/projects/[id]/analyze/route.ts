/**
 * POST /api/projects/[id]/analyze
 *
 * Start a complete analysis job for a project
 *
 * This endpoint creates a background job that will:
 * 1. Fetch project data and related records (invoices, haul logs, contracts)
 * 2. Execute WasteWise Complete Analysis skill
 * 3. Generate Excel and HTML reports
 * 4. Upload reports to Supabase Storage
 * 5. Return analysis results with download URLs
 *
 * Client should poll /api/jobs/[id] for status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const projectId = params.id;

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Unauthorized analysis request", { projectId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, property_name, status")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      logger.warn("Project not found or access denied", {
        projectId,
        userId: user.id,
        error: projectError?.message,
      });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify project has data ready for analysis
    const { count: invoiceCount } = await supabase
      .from("invoice_data")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (!invoiceCount || invoiceCount === 0) {
      logger.warn("No invoice data for analysis", {
        projectId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "No invoice data available. Please upload invoices first." },
        { status: 400 },
      );
    }

    // Check if there's already a pending/processing job for this project
    const { data: existingJob } = await supabase
      .from("analysis_jobs")
      .select("id, status")
      .eq("project_id", projectId)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (existingJob) {
      logger.info("Analysis job already in progress", {
        jobId: existingJob.id,
        projectId,
        userId: user.id,
      });
      return NextResponse.json({
        jobId: existingJob.id,
        status: existingJob.status,
        message: "Analysis already in progress. Use job ID to check progress.",
      });
    }

    // Create analysis job
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: "complete_analysis",
        status: "pending",
        progress_percent: 0,
        total_steps: 5, // Invoice analysis, optimization, recommendations, reports, upload
        steps_completed: 0,
        input_data: { projectId },
      })
      .select()
      .single();

    if (jobError || !job) {
      logger.error("Failed to create analysis job", jobError as Error, {
        projectId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to create analysis job" },
        { status: 500 },
      );
    }

    logger.info("Analysis job created", {
      jobId: job.id,
      projectId,
      userId: user.id,
      propertyName: project.property_name,
      invoiceCount,
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: "Analysis started. Use job ID to check progress.",
    });
  } catch (error) {
    logger.error("Analysis endpoint error", error as Error, { projectId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
