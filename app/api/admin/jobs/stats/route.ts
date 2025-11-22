import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, type AdminRequest } from '@/lib/middleware/admin-auth'
import { createClient } from '@/lib/supabase/server'

async function handleGET(req: AdminRequest) {
  try {
    const supabase = await createClient()

    // Get job counts by status
    const { data: statusCounts } = await supabase
      .from('analysis_jobs')
      .select('status')

    const stats = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter((j: any) => j.status === 'pending').length || 0,
      processing: statusCounts?.filter((j: any) => j.status === 'processing').length || 0,
      completed: statusCounts?.filter((j: any) => j.status === 'completed').length || 0,
      failed: statusCounts?.filter((j: any) => j.status === 'failed').length || 0,
      cancelled: statusCounts?.filter((j: any) => j.status === 'cancelled').length || 0
    }

    // Get average processing time (completed jobs only)
    const { data: completedJobs } = await supabase
      .from('analysis_jobs')
      .select('created_at, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)

    const avgProcessingTime = completedJobs && completedJobs.length > 0
      ? completedJobs.reduce((sum: number, job: any) => {
          const start = new Date(job.created_at).getTime()
          const end = new Date(job.completed_at!).getTime()
          return sum + (end - start)
        }, 0) / completedJobs.length
      : 0

    // Get jobs by type
    const { data: jobTypes } = await supabase
      .from('analysis_jobs')
      .select('job_type')

    const jobTypeCounts = jobTypes?.reduce((acc: Record<string, number>, job: any) => {
      acc[job.job_type] = (acc[job.job_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent failures
    const { data: recentFailures } = await supabase
      .from('analysis_jobs')
      .select('id, job_type, error_message, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      statusCounts: stats,
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      jobTypeCounts,
      recentFailures: recentFailures || []
    })

  } catch (error) {
    console.error('Admin job stats error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch job stats',
        code: 'JOB_STATS_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
