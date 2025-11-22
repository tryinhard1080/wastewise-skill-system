import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, type AdminRequest } from '@/lib/middleware/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handleGET(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Enrich with user and project info
    const { data: { user } } = await supabase.auth.admin.getUserById(job.user_id)

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', job.project_id)
      .single()

    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.view',
      resourceType: 'job',
      resourceId: id
    })

    return NextResponse.json({
      job: {
        ...job,
        user_email: user?.email,
        project
      }
    })

  } catch (error) {
    console.error('Admin job detail error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch job',
        code: 'JOB_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

async function handleDELETE(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get job details first
    const { data: job } = await supabase
      .from('analysis_jobs')
      .select('status, job_type, user_id')
      .eq('id', id)
      .single()

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Don't delete processing jobs
    if (job.status === 'processing') {
      return NextResponse.json(
        {
          error: 'Cannot delete jobs that are currently processing',
          code: 'JOB_IN_PROGRESS'
        },
        { status: 400 }
      )
    }

    // Delete job
    const { error } = await supabase
      .from('analysis_jobs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Log action
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.delete',
      resourceType: 'job',
      resourceId: id,
      metadata: {
        jobType: job.job_type,
        status: job.status,
        userId: job.user_id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin job delete error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete job',
        code: 'JOB_DELETE_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
export const DELETE = requireAdmin(handleDELETE)
