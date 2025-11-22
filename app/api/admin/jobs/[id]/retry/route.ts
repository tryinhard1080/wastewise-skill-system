import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, type AdminRequest } from '@/lib/middleware/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handlePOST(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get job details
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      return NextResponse.json(
        {
          error: 'Only failed or cancelled jobs can be retried',
          code: 'INVALID_JOB_STATUS'
        },
        { status: 400 }
      )
    }

    // Reset job to pending
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({
        status: 'pending',
        error_message: null,
        error_code: null,
        started_at: null,
        completed_at: null,
        progress_percent: 0,
        current_step: null,
        retry_count: (job.retry_count || 0) + 1
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Log action
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.retry',
      resourceType: 'job',
      resourceId: id,
      metadata: {
        previousStatus: job.status,
        retryCount: (job.retry_count || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      jobId: id,
      retryCount: (job.retry_count || 0) + 1
    })

  } catch (error) {
    console.error('Admin job retry error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry job',
        code: 'JOB_RETRY_FAILED'
      },
      { status: 500 }
    )
  }
}

export const POST = requireAdmin(handlePOST)
