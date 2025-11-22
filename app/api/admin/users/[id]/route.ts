import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireSuperAdmin, type AdminRequest } from '@/lib/middleware/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { z } from 'zod'

const updateSchema = z.object({
  action: z.enum(['disable', 'enable', 'change_role']),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
})

async function handleGET(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch user details from auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(id)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch role and status
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', id)
      .single()

    const { data: userStatus } = await supabase
      .from('user_status')
      .select('*')
      .eq('user_id', id)
      .single()

    // Fetch user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, property_name, status, created_at, total_savings')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch user's jobs
    const { data: jobs } = await supabase
      .from('analysis_jobs')
      .select('id, job_type, status, created_at, completed_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch audit logs for this user (as subject, not actor)
    const { data: auditLogs } = await supabase
      .from('admin_audit_log')
      .select('action, created_at, admin_user_id')
      .eq('resource_id', id)
      .eq('resource_type', 'user')
      .order('created_at', { ascending: false })
      .limit(10)

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'user.view',
      resourceType: 'user',
      resourceId: id
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        confirmed_at: user.confirmed_at,
        role: userRole?.role || 'user',
        role_granted_at: userRole?.granted_at,
        role_granted_by: userRole?.granted_by,
        role_notes: userRole?.notes,
        is_active: userStatus?.is_active ?? true,
        disabled_at: userStatus?.disabled_at,
        disabled_by: userStatus?.disabled_by,
        disabled_reason: userStatus?.disabled_reason,
        status_notes: userStatus?.notes
      },
      recentProjects: projects || [],
      recentJobs: jobs || [],
      auditHistory: auditLogs || []
    })

  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        code: 'USER_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

async function handlePATCH(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const update = updateSchema.parse(body)

    const supabase = await createClient()

    if (update.action === 'disable') {
      // Disable user
      const { error } = await supabase
        .from('user_status')
        .update({
          is_active: false,
          disabled_at: new Date().toISOString(),
          disabled_by: req.adminUserId,
          disabled_reason: update.reason,
          notes: update.notes
        })
        .eq('user_id', id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.disable',
        resourceType: 'user',
        resourceId: id,
        changes: {
          is_active: { from: true, to: false },
          reason: update.reason
        }
      })

    } else if (update.action === 'enable') {
      // Re-enable user
      const { error } = await supabase
        .from('user_status')
        .update({
          is_active: true,
          disabled_at: null,
          disabled_by: null,
          disabled_reason: null,
          notes: update.notes
        })
        .eq('user_id', id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.enable',
        resourceType: 'user',
        resourceId: id,
        changes: {
          is_active: { from: false, to: true }
        }
      })

    } else if (update.action === 'change_role') {
      // Change user role (super_admin only)
      if (req.adminRole !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only super admins can change roles', code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        )
      }

      if (!update.role) {
        return NextResponse.json(
          { error: 'Role is required', code: 'MISSING_ROLE' },
          { status: 400 }
        )
      }

      // Get current role
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id)
        .single()

      // Update role
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: update.role,
          granted_by: req.adminUserId,
          granted_at: new Date().toISOString(),
          notes: update.notes
        })
        .eq('user_id', id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.role_change',
        resourceType: 'user',
        resourceId: id,
        changes: {
          role: {
            from: currentRole?.role,
            to: update.role
          }
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update user',
        code: 'USER_UPDATE_FAILED'
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

    // Check for existing projects (warn before cascade delete)
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', id)

    if (projectError) throw projectError

    const projectCount = projects?.length || 0

    // Check for existing jobs
    const { data: jobs, error: jobError } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('user_id', id)

    if (jobError) throw jobError

    const jobCount = jobs?.length || 0

    // Log before deletion
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'user.delete',
      resourceType: 'user',
      resourceId: id,
      metadata: {
        projectCount,
        jobCount,
        cascadeWarning: `Deleting user will cascade delete ${projectCount} projects and ${jobCount} jobs`
      }
    })

    // Delete user (cascades to projects, jobs, files, etc.)
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      deleted: {
        userId: id,
        projectCount,
        jobCount
      }
    })

  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete user',
        code: 'USER_DELETE_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
export const PATCH = requireAdmin(handlePATCH)
export const DELETE = requireSuperAdmin(handleDELETE)
