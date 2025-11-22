/**
 * Worker Health Check API Endpoint
 *
 * GET /api/admin/workers/health
 *
 * Returns worker health metrics:
 * - Active workers count
 * - Last job processed timestamp
 * - Worker uptime
 * - Memory usage (if available)
 * - CPU usage (if available)
 *
 * Note: This is a basic implementation that tracks job processing.
 * For full worker monitoring (heartbeats, resource usage), additional
 * infrastructure would be needed (e.g., Redis, worker registration table).
 *
 * Phase 7: Production monitoring and alerting
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'

export async function GET(request: Request) {
  try {
    logger.info('Fetching worker health metrics')

    const supabase = createClient()

    // Check if user is authenticated and has admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user (will add role check in Phase 8)

    // Get last processed job timestamp and active worker count
    const { data: recentJobs, error: jobsError } = await supabase
      .from('analysis_jobs')
      .select('completed_at, worker_id, status')
      .in('status', ['processing', 'completed'])
      .order('completed_at', { ascending: false })
      .limit(100)

    if (jobsError) {
      logger.error('Failed to fetch recent jobs', jobsError as Error)
      return NextResponse.json(
        { error: 'Failed to fetch worker health', details: jobsError.message },
        { status: 500 }
      )
    }

    // Calculate metrics
    const now = new Date()
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const activeWorkerIds = new Set(
      recentJobs
        ?.filter((job) => job.status === 'processing' && job.worker_id)
        .map((job) => job.worker_id) || []
    )

    const recentCompletedJobs = recentJobs?.filter(
      (job) => job.status === 'completed' && job.completed_at
    ) || []

    const lastJobProcessed = recentCompletedJobs[0]?.completed_at || null
    const lastJobTimestamp = lastJobProcessed ? new Date(lastJobProcessed) : null

    const jobsLastHour = recentCompletedJobs.filter(
      (job) => new Date(job.completed_at!) >= lastHour
    ).length

    const jobsLastDay = recentCompletedJobs.filter(
      (job) => new Date(job.completed_at!) >= lastDay
    ).length

    // Calculate time since last job
    const minutesSinceLastJob = lastJobTimestamp
      ? Math.floor((now.getTime() - lastJobTimestamp.getTime()) / 1000 / 60)
      : null

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (activeWorkerIds.size === 0) {
      healthStatus = 'unhealthy' // No active workers
    } else if (minutesSinceLastJob !== null && minutesSinceLastJob > 10) {
      healthStatus = 'degraded' // No jobs processed in last 10 minutes
    } else {
      healthStatus = 'healthy'
    }

    const metrics = {
      status: healthStatus,
      activeWorkers: activeWorkerIds.size,
      workerIds: Array.from(activeWorkerIds),
      lastJobProcessed: lastJobTimestamp?.toISOString() || null,
      minutesSinceLastJob,
      jobsProcessedLastHour: jobsLastHour,
      jobsProcessedLastDay: jobsLastDay,
      throughput: {
        perHour: jobsLastHour,
        perDay: jobsLastDay,
      },
    }

    logger.info('Worker health metrics calculated', {
      status: healthStatus,
      activeWorkers: activeWorkerIds.size,
      minutesSinceLastJob,
    })

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Error in worker health endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
