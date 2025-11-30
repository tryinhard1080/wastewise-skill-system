/**
 * Analysis Jobs List API
 *
 * GET /api/jobs - List all jobs for authenticated user
 *
 * Query parameters:
 * - status: Filter by status (pending, processing, completed, failed, cancelled)
 * - jobType: Filter by job type
 * - projectId: Filter by project ID
 * - limit: Number of items per page (default: 20, max: 100)
 * - offset: Number of items to skip (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route uses cookies for auth
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { validatePagination, isValidUUID } from '@/lib/api/validation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const jobType = searchParams.get('jobType')
    const projectId = searchParams.get('projectId')
    const { limit, offset } = validatePagination(
      searchParams.get('limit') ?? undefined,
      searchParams.get('offset') ?? undefined
    )

    // Validate projectId if provided
    if (projectId && !isValidUUID(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
          },
          { status: 400 }
        )
      }
      query = query.eq('status', status)
    }

    if (jobType) {
      const validJobTypes = [
        'invoice_extraction',
        'regulatory_research',
        'complete_analysis',
        'report_generation',
      ]
      if (!validJobTypes.includes(jobType)) {
        return NextResponse.json(
          {
            error: 'Invalid job type. Must be one of: ' + validJobTypes.join(', '),
          },
          { status: 400 }
        )
      }
      query = query.eq('job_type', jobType)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    // Execute query
    const { data: jobs, error, count } = await query

    if (error) {
      throw error
    }

    // Format response
    const formattedJobs = (jobs || []).map((job) => ({
      id: job.id,
      projectId: job.project_id,
      jobType: job.job_type,
      status: job.status,
      progress: {
        percent: job.progress_percent,
        currentStep: job.current_step,
      },
      timing: {
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        durationSeconds: job.duration_seconds,
      },
      hasError: !!job.error_message,
      hasResult: !!job.result_data,
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
