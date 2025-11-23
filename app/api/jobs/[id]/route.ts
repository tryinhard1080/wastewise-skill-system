/**
 * Job Status API Routes
 *
 * GET /api/jobs/[id]
 * Retrieve status, progress, and results of an analysis job
 *
 * DELETE /api/jobs/[id]
 * Cancel a running job
 *
 * Jobs are protected by RLS - users can only access their own jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";

/**
 * GET /api/jobs/[id]
 *
 * Get status and progress of an analysis job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const jobId = params.id;

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get job (RLS ensures user can only see their own jobs)
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      logger.warn("Job not found or access denied", {
        jobId,
        userId: user.id,
        error: jobError?.message,
      });
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Return structured job status
    const response = {
      id: job.id,
      projectId: job.project_id,
      jobType: job.job_type,
      status: job.status,
      progress: {
        percent: job.progress_percent,
        currentStep: job.current_step,
        stepsCompleted: job.steps_completed,
        totalSteps: job.total_steps,
      },
      timing: {
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        estimatedCompletion: job.estimated_completion,
        durationSeconds: job.duration_seconds,
      },
      result: job.result_data,
      error: job.error_message
        ? {
            message: job.error_message,
            code: job.error_code,
            details: job.error_details,
          }
        : null,
      aiUsage: {
        requests: job.ai_requests,
        tokensInput: job.ai_tokens_input,
        tokensOutput: job.ai_tokens_output,
        costUsd: job.ai_cost_usd || 0,
      },
      retryInfo: {
        retryCount: job.retry_count,
        maxRetries: job.max_retries,
      },
      updatedAt: job.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Job status endpoint error", error as Error, { jobId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 *
 * Cancel a running job
 *
 * Can only cancel jobs that are pending or processing.
 * Completed, failed, or already cancelled jobs cannot be cancelled.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const jobId = params.id;

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current job status first
    const { data: job, error: fetchError } = await supabase
      .from("analysis_jobs")
      .select("id, status, job_type, project_id")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      logger.warn("Job not found for cancellation", {
        jobId,
        userId: user.id,
        error: fetchError?.message,
      });
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if job can be cancelled
    if (!["pending", "processing"].includes(job.status)) {
      logger.warn("Cannot cancel job in current status", {
        jobId,
        status: job.status,
        userId: user.id,
      });
      return NextResponse.json(
        {
          error: `Cannot cancel job with status '${job.status}'. Only pending or processing jobs can be cancelled.`,
        },
        { status: 400 },
      );
    }

    // Cancel job
    const { error: updateError } = await supabase
      .from("analysis_jobs")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .in("status", ["pending", "processing"]);

    if (updateError) {
      logger.error("Failed to cancel job", updateError as Error, {
        jobId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to cancel job" },
        { status: 500 },
      );
    }

    logger.info("Job cancelled", {
      jobId,
      jobType: job.job_type,
      projectId: job.project_id,
      userId: user.id,
    });

    return NextResponse.json({
      message: "Job cancelled successfully",
      jobId,
    });
  } catch (error) {
    logger.error("Job cancellation error", error as Error, { jobId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
