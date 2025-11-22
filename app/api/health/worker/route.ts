import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WorkerHealthResult {
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  jobStats: {
    pending: number
    processing: number
    completed_last_hour: number
    failed_last_hour: number
    avg_processing_time_minutes: number
  }
  concerns?: string[]
}

/**
 * Worker Health Check Endpoint
 *
 * Monitors the background worker job queue health.
 * Checks for:
 * - Pending job backlog
 * - Processing job count
 * - Recent failures
 * - Average processing time
 *
 * @returns Job queue statistics and health status
 */
export async function GET() {
  const supabase = await createClient()
  const concerns: string[] = []
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  try {
    // Count pending jobs
    const { count: pendingCount } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Count processing jobs
    const { count: processingCount } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')

    // Count completed jobs in last hour
    const { count: completedCount } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', oneHourAgo)

    // Count failed jobs in last hour
    const { count: failedCount } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('updated_at', oneHourAgo)

    // Get average processing time
    const { data: completedJobs } = await supabase
      .from('analysis_jobs')
      .select('created_at, updated_at')
      .eq('status', 'completed')
      .gte('updated_at', oneHourAgo)
      .limit(50)

    let avgProcessingTime = 0
    if (completedJobs && completedJobs.length > 0) {
      const times = completedJobs
        .filter((job) => job.created_at && job.updated_at)
        .map((job) => {
          const created = new Date(job.created_at!).getTime()
          const updated = new Date(job.updated_at!).getTime()
          return updated - created
        })

      if (times.length > 0) {
        avgProcessingTime = times.reduce((a, b) => a + b, 0) / times.length / 1000 / 60 // minutes
      }
    }

    // Analyze concerns
    if ((pendingCount || 0) > 10) {
      concerns.push(`High pending job count: ${pendingCount}`)
    }

    if ((processingCount || 0) > 5) {
      concerns.push(`Many jobs processing simultaneously: ${processingCount}`)
    }

    if ((failedCount || 0) > 5) {
      concerns.push(`High failure rate: ${failedCount} failures in last hour`)
    }

    if (avgProcessingTime > 10) {
      concerns.push(`Slow processing time: ${avgProcessingTime.toFixed(1)} minutes average`)
    }

    const result: WorkerHealthResult = {
      status: concerns.length === 0 ? 'healthy' : concerns.length <= 2 ? 'warning' : 'critical',
      timestamp: new Date().toISOString(),
      jobStats: {
        pending: pendingCount || 0,
        processing: processingCount || 0,
        completed_last_hour: completedCount || 0,
        failed_last_hour: failedCount || 0,
        avg_processing_time_minutes: Number(avgProcessingTime.toFixed(1)),
      },
      ...(concerns.length > 0 && { concerns }),
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
