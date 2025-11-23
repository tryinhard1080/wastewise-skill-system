/**
 * Job Monitoring API Endpoint
 *
 * GET /api/admin/jobs/monitoring
 *
 * Returns comprehensive metrics about the job queue:
 * - Jobs in queue by priority
 * - Average processing time
 * - Error rates (1h, 24h, 7d)
 * - Stuck jobs count
 * - Queue health indicators
 *
 * Phase 7: Production monitoring and alerting
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request) {
  try {
    logger.info("Fetching job monitoring metrics");

    const supabase = await createClient();

    // Check if user is authenticated and has admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user (will add role check in Phase 8)

    // Get queue metrics from database function
    const { data: metrics, error: metricsError } =
      await supabase.rpc("get_queue_metrics");

    if (metricsError) {
      logger.error("Failed to fetch queue metrics", metricsError as Error);
      return NextResponse.json(
        { error: "Failed to fetch metrics", details: metricsError.message },
        { status: 500 },
      );
    }

    const metricsData = metrics as Record<string, any> | null;
    logger.info("Queue metrics fetched successfully", {
      pending: metricsData?.total_pending || 0,
      processing: metricsData?.total_processing || 0,
      stuckJobs: metricsData?.stuck_jobs || 0,
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in job monitoring endpoint", error as Error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 },
    );
  }
}
