# Admin Dashboard - Phase 1: Backend Infrastructure

## Task Overview
Create the complete backend infrastructure for the WasteWise admin dashboard, including admin authentication, API routes for user/job/system management, database schema updates, and audit logging.

## Context
- **Project**: WasteWise SaaS (waste management optimization platform)
- **Phase**: 7D Task 13 - Admin Dashboard
- **Current State**: No admin infrastructure exists
- **Database**: Supabase PostgreSQL with RLS
- **Tech Stack**: Next.js 14 API Routes, TypeScript, Zod validation

## Part 1: Database Schema Updates

### 1.1 Add Admin Role to Users Table
Create migration: `supabase/migrations/[timestamp]_add_admin_roles.sql`

```sql
-- Add role column to auth.users via metadata
-- Since auth.users is managed by Supabase Auth, we'll use a custom table

create type user_role as enum ('user', 'admin', 'super_admin');

create table user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null unique,
  role user_role default 'user' not null,
  granted_by uuid references auth.users,
  granted_at timestamp with time zone default now(),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_user_roles_user_id on user_roles(user_id);
create index idx_user_roles_role on user_roles(role);

-- RLS Policies
alter table user_roles enable row level security;

-- Users can view their own role
create policy "Users can view own role"
  on user_roles for select
  using (auth.uid() = user_id);

-- Only admins can view all roles
create policy "Admins can view all roles"
  on user_roles for select
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Only super_admins can modify roles
create policy "Super admins can modify roles"
  on user_roles for all
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'super_admin'
    )
  );

-- Seed first super admin (IMPORTANT: Update with actual user ID after signup)
-- This will be done via Supabase dashboard or SQL after first user is created
```

### 1.2 Create Admin Audit Log Table
Create migration: `supabase/migrations/[timestamp]_create_audit_log.sql`

```sql
create table admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid references auth.users not null,
  action text not null, -- 'user.disable', 'user.delete', 'job.retry', 'skill.update', etc.
  resource_type text not null, -- 'user', 'job', 'skill', 'project', 'system'
  resource_id text, -- UUID or identifier of affected resource
  changes jsonb, -- Before/after values for updates
  metadata jsonb, -- Additional context (IP, user agent, etc.)
  created_at timestamp with time zone default now()
);

create index idx_audit_log_admin_id on admin_audit_log(admin_user_id);
create index idx_audit_log_resource on admin_audit_log(resource_type, resource_id);
create index idx_audit_log_action on admin_audit_log(action);
create index idx_audit_log_created_at on admin_audit_log(created_at desc);

-- RLS: Only admins can view audit logs
alter table admin_audit_log enable row level security;

create policy "Admins can view audit logs"
  on admin_audit_log for select
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Trigger function to auto-populate metadata
create or replace function set_audit_metadata()
returns trigger as $$
begin
  if new.metadata is null then
    new.metadata = '{}'::jsonb;
  end if;

  new.metadata = new.metadata || jsonb_build_object(
    'timestamp', now(),
    'user_id', auth.uid()
  );

  return new;
end;
$$ language plpgsql;

create trigger set_audit_metadata_trigger
  before insert on admin_audit_log
  for each row
  execute function set_audit_metadata();
```

### 1.3 Add User Status Management
Create migration: `supabase/migrations/[timestamp]_add_user_status.sql`

```sql
-- Add disabled status to track deactivated users
create table user_status (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null unique,
  is_active boolean default true not null,
  disabled_at timestamp with time zone,
  disabled_by uuid references auth.users,
  disabled_reason text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_user_status_user_id on user_status(user_id);
create index idx_user_status_active on user_status(is_active);

-- RLS
alter table user_status enable row level security;

create policy "Users can view own status"
  on user_status for select
  using (auth.uid() = user_id);

create policy "Admins can view all status"
  on user_status for select
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can modify status"
  on user_status for all
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Auto-create status record for new users
create or replace function create_user_status()
returns trigger as $$
begin
  insert into user_status (user_id)
  values (new.id);

  insert into user_roles (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql;

-- This trigger would need to be created on auth.users which we can't modify directly
-- Instead, we'll create status/role records via API when users sign up
```

## Part 2: Admin Middleware

### 2.1 Create Admin Auth Middleware
File: `lib/middleware/admin-auth.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

export type AdminAuthResult = {
  authorized: boolean
  userId?: string
  role?: 'user' | 'admin' | 'super_admin'
  error?: string
}

export async function checkAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  const supabase = createServerClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Not authenticated'
    }
  }

  // Check user role
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleError || !roleData) {
    return {
      authorized: false,
      error: 'No role found'
    }
  }

  if (roleData.role !== 'admin' && roleData.role !== 'super_admin') {
    // Log unauthorized access attempt
    await logAdminAction({
      adminUserId: user.id,
      action: 'admin.unauthorized_access_attempt',
      resourceType: 'system',
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method
      }
    })

    return {
      authorized: false,
      role: roleData.role,
      error: 'Insufficient permissions'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    role: roleData.role
  }
}

export function requireAdmin(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const authResult = await checkAdminAuth(req)

    if (!authResult.authorized) {
      return NextResponse.json(
        {
          error: authResult.error || 'Unauthorized',
          code: 'ADMIN_AUTH_REQUIRED'
        },
        { status: 403 }
      )
    }

    // Attach admin info to request (TypeScript safe way)
    const adminReq = req as NextRequest & {
      adminUserId: string
      adminRole: string
    }
    adminReq.adminUserId = authResult.userId!
    adminReq.adminRole = authResult.role!

    return handler(adminReq, context)
  }
}

export function requireSuperAdmin(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const authResult = await checkAdminAuth(req)

    if (!authResult.authorized || authResult.role !== 'super_admin') {
      return NextResponse.json(
        {
          error: 'Super admin access required',
          code: 'SUPER_ADMIN_REQUIRED'
        },
        { status: 403 }
      )
    }

    const adminReq = req as NextRequest & {
      adminUserId: string
      adminRole: string
    }
    adminReq.adminUserId = authResult.userId!
    adminReq.adminRole = authResult.role!

    return handler(adminReq, context)
  }
}
```

### 2.2 Create Audit Logger Utility
File: `lib/admin/audit-logger.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'user.view'
  | 'user.disable'
  | 'user.enable'
  | 'user.delete'
  | 'user.role_change'
  | 'job.view'
  | 'job.retry'
  | 'job.cancel'
  | 'job.delete'
  | 'skill.view'
  | 'skill.update'
  | 'system.health_check'
  | 'system.metrics_view'
  | 'admin.unauthorized_access_attempt'

export type AuditLogEntry = {
  adminUserId: string
  action: AuditAction
  resourceType: 'user' | 'job' | 'skill' | 'project' | 'system'
  resourceId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
}

export async function logAdminAction(entry: AuditLogEntry) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('admin_audit_log')
    .insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      changes: entry.changes || null,
      metadata: entry.metadata || null
    })

  if (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - audit logging failures shouldn't break admin operations
  }
}

export async function getAuditLog(filters: {
  adminUserId?: string
  resourceType?: string
  resourceId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = createServerClient()

  let query = supabase
    .from('admin_audit_log')
    .select('*, admin:admin_user_id(email)')
    .order('created_at', { ascending: false })

  if (filters.adminUserId) {
    query = query.eq('admin_user_id', filters.adminUserId)
  }

  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType)
  }

  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId)
  }

  if (filters.action) {
    query = query.eq('action', filters.action)
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}
```

## Part 3: Admin API Routes

### 3.1 User Management Routes

#### GET /api/admin/users
File: `app/api/admin/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { z } from 'zod'

const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const { searchParams } = req.nextUrl
    const params = querySchema.parse({
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0'
    })

    const supabase = createServerClient()

    // Build query
    let query = supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        user_roles!inner (role),
        user_status!inner (is_active, disabled_at, disabled_reason),
        projects (count)
      `)

    // Apply filters
    if (params.search) {
      query = query.ilike('email', `%${params.search}%`)
    }

    if (params.role) {
      query = query.eq('user_roles.role', params.role)
    }

    if (params.status === 'active') {
      query = query.eq('user_status.is_active', true)
    } else if (params.status === 'inactive') {
      query = query.eq('user_status.is_active', false)
    }

    // Pagination
    query = query
      .range(params.offset, params.offset + params.limit - 1)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'user.view',
      resourceType: 'user',
      metadata: { filters: params }
    })

    return NextResponse.json({
      users: data,
      total: count,
      limit: params.limit,
      offset: params.offset
    })

  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        code: 'USERS_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
```

#### GET /api/admin/users/[id]
File: `app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handleGET(
  req: NextRequest & { adminUserId: string },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Fetch user details
    const { data: user, error } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        confirmed_at,
        user_roles (role, granted_at, granted_by, notes),
        user_status (is_active, disabled_at, disabled_by, disabled_reason, notes),
        projects (
          id,
          property_name,
          status,
          created_at,
          total_savings
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch user's jobs
    const { data: jobs } = await supabase
      .from('analysis_jobs')
      .select('id, job_type, status, created_at, completed_at')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch audit logs for this user (as subject, not actor)
    const { data: auditLogs } = await supabase
      .from('admin_audit_log')
      .select('action, created_at, admin_user_id')
      .eq('resource_id', params.id)
      .eq('resource_type', 'user')
      .order('created_at', { ascending: false })
      .limit(10)

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'user.view',
      resourceType: 'user',
      resourceId: params.id
    })

    return NextResponse.json({
      user,
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

export const GET = requireAdmin(handleGET)
```

#### PATCH /api/admin/users/[id]
File: `app/api/admin/users/[id]/route.ts` (add to existing)

```typescript
import { z } from 'zod'

const updateSchema = z.object({
  action: z.enum(['disable', 'enable', 'change_role']),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
})

async function handlePATCH(
  req: NextRequest & { adminUserId: string; adminRole: string },
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const update = updateSchema.parse(body)

    const supabase = createServerClient()

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
        .eq('user_id', params.id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.disable',
        resourceType: 'user',
        resourceId: params.id,
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
        .eq('user_id', params.id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.enable',
        resourceType: 'user',
        resourceId: params.id,
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
        .eq('user_id', params.id)
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
        .eq('user_id', params.id)

      if (error) throw error

      await logAdminAction({
        adminUserId: req.adminUserId,
        action: 'user.role_change',
        resourceType: 'user',
        resourceId: params.id,
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

export const PATCH = requireAdmin(handlePATCH)
```

#### DELETE /api/admin/users/[id]
File: `app/api/admin/users/[id]/route.ts` (add to existing)

```typescript
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'

async function handleDELETE(
  req: NextRequest & { adminUserId: string },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Check for existing projects (warn before cascade delete)
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', params.id)

    if (projectError) throw projectError

    const projectCount = projects?.length || 0

    // Check for existing jobs
    const { data: jobs, error: jobError } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('user_id', params.id)

    if (jobError) throw jobError

    const jobCount = jobs?.length || 0

    // Log before deletion
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'user.delete',
      resourceType: 'user',
      resourceId: params.id,
      metadata: {
        projectCount,
        jobCount,
        cascadeWarning: `Deleting user will cascade delete ${projectCount} projects and ${jobCount} jobs`
      }
    })

    // Delete user (cascades to projects, jobs, files, etc.)
    const { error } = await supabase.auth.admin.deleteUser(params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      deleted: {
        userId: params.id,
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

export const DELETE = requireSuperAdmin(handleDELETE)
```

### 3.2 Job Management Routes

#### GET /api/admin/jobs
File: `app/api/admin/jobs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { z } from 'zod'

const querySchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  userId: z.string().uuid().optional(),
  jobType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const { searchParams } = req.nextUrl
    const params = querySchema.parse({
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      jobType: searchParams.get('jobType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0'
    })

    const supabase = createServerClient()

    let query = supabase
      .from('analysis_jobs')
      .select(`
        *,
        user:user_id (email),
        project:project_id (property_name, units)
      `, { count: 'exact' })

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.userId) {
      query = query.eq('user_id', params.userId)
    }

    if (params.jobType) {
      query = query.eq('job_type', params.jobType)
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate)
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate)
    }

    // Pagination
    query = query
      .range(params.offset, params.offset + params.limit - 1)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.view',
      resourceType: 'job',
      metadata: { filters: params }
    })

    return NextResponse.json({
      jobs: data,
      total: count,
      limit: params.limit,
      offset: params.offset
    })

  } catch (error) {
    console.error('Admin jobs list error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
        code: 'JOBS_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
```

#### GET /api/admin/jobs/stats
File: `app/api/admin/jobs/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const supabase = createServerClient()

    // Get job counts by status
    const { data: statusCounts } = await supabase
      .from('analysis_jobs')
      .select('status')

    const stats = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter(j => j.status === 'pending').length || 0,
      processing: statusCounts?.filter(j => j.status === 'processing').length || 0,
      completed: statusCounts?.filter(j => j.status === 'completed').length || 0,
      failed: statusCounts?.filter(j => j.status === 'failed').length || 0,
      cancelled: statusCounts?.filter(j => j.status === 'cancelled').length || 0
    }

    // Get average processing time (completed jobs only)
    const { data: completedJobs } = await supabase
      .from('analysis_jobs')
      .select('created_at, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)

    const avgProcessingTime = completedJobs && completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const start = new Date(job.created_at).getTime()
          const end = new Date(job.completed_at!).getTime()
          return sum + (end - start)
        }, 0) / completedJobs.length
      : 0

    // Get jobs by type
    const { data: jobTypes } = await supabase
      .from('analysis_jobs')
      .select('job_type')

    const jobTypeCounts = jobTypes?.reduce((acc, job) => {
      acc[job.job_type] = (acc[job.job_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      statusCounts: stats,
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      jobTypeCounts
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
```

#### POST /api/admin/jobs/[id]/retry
File: `app/api/admin/jobs/[id]/retry/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handlePOST(
  req: NextRequest & { adminUserId: string },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Get job details
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', params.id)
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
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    // Log action
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.retry',
      resourceType: 'job',
      resourceId: params.id,
      metadata: {
        previousStatus: job.status,
        retryCount: (job.retry_count || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      jobId: params.id
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
```

#### DELETE /api/admin/jobs/[id]
File: `app/api/admin/jobs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handleDELETE(
  req: NextRequest & { adminUserId: string },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Get job details first
    const { data: job } = await supabase
      .from('analysis_jobs')
      .select('status, job_type, user_id')
      .eq('id', params.id)
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
      .eq('id', params.id)

    if (error) {
      throw error
    }

    // Log action
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'job.delete',
      resourceType: 'job',
      resourceId: params.id,
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

export const DELETE = requireAdmin(handleDELETE)
```

### 3.3 System Health & Metrics Routes

#### GET /api/admin/system/health
File: `app/api/admin/system/health/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const supabase = createServerClient()
    const checks = []

    // Database connectivity
    try {
      const { error } = await supabase.from('projects').select('count').limit(1)
      checks.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Storage
    try {
      const { data, error } = await supabase.storage.listBuckets()
      checks.push({
        service: 'storage',
        status: error ? 'unhealthy' : 'healthy',
        bucketsAvailable: data?.length || 0,
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'storage',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Auth
    try {
      const { data, error } = await supabase.auth.getSession()
      checks.push({
        service: 'auth',
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'auth',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // API (Anthropic)
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    checks.push({
      service: 'anthropic_api',
      status: anthropicKey ? 'configured' : 'missing',
      error: anthropicKey ? undefined : 'API key not configured'
    })

    const overallStatus = checks.every(c => c.status === 'healthy' || c.status === 'configured')
      ? 'healthy'
      : 'degraded'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
```

#### GET /api/admin/system/metrics
File: `app/api/admin/system/metrics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  period: z.enum(['24h', '7d', '30d', '90d']).default('7d')
})

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const { searchParams } = req.nextUrl
    const params = querySchema.parse({
      period: searchParams.get('period') || '7d'
    })

    const supabase = createServerClient()

    // Calculate date range
    const now = new Date()
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }
    const daysAgo = periodMap[params.period]
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Active users (users with recent activity)
    const { data: activeUsers } = await supabase
      .from('analysis_jobs')
      .select('user_id')
      .gte('created_at', startDate.toISOString())

    const uniqueActiveUsers = new Set(activeUsers?.map(j => j.user_id)).size

    // Jobs processed
    const { data: jobs } = await supabase
      .from('analysis_jobs')
      .select('status, created_at, ai_usage')
      .gte('created_at', startDate.toISOString())

    const jobStats = {
      total: jobs?.length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      failed: jobs?.filter(j => j.status === 'failed').length || 0,
      pending: jobs?.filter(j => j.status === 'pending').length || 0
    }

    // AI usage (aggregate token counts and costs)
    const aiUsage = jobs?.reduce((acc, job) => {
      if (job.ai_usage) {
        const usage = typeof job.ai_usage === 'string'
          ? JSON.parse(job.ai_usage)
          : job.ai_usage

        acc.totalTokens += (usage.totalTokens || 0)
        acc.totalCost += (usage.totalCost || 0)
      }
      return acc
    }, { totalTokens: 0, totalCost: 0 }) || { totalTokens: 0, totalCost: 0 }

    // Storage usage
    const { data: files } = await supabase
      .from('project_files')
      .select('file_size')

    const storageUsage = {
      totalFiles: files?.length || 0,
      totalBytes: files?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0
    }

    // Database size (requires admin access to pg_total_relation_size)
    // This would need a database function to expose safely

    return NextResponse.json({
      period: params.period,
      activeUsers: uniqueActiveUsers,
      jobs: jobStats,
      aiUsage,
      storage: storageUsage
    })

  } catch (error) {
    console.error('System metrics error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        code: 'METRICS_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
```

### 3.4 Skills Configuration Routes

#### GET /api/admin/skills
File: `app/api/admin/skills/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

async function handleGET(req: NextRequest & { adminUserId: string }) {
  try {
    const supabase = createServerClient()

    const { data: skills, error } = await supabase
      .from('skills_config')
      .select('*')
      .order('skill_name')

    if (error) {
      throw error
    }

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'skill.view',
      resourceType: 'skill'
    })

    return NextResponse.json({ skills })

  } catch (error) {
    console.error('Admin skills list error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch skills',
        code: 'SKILLS_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
```

#### PATCH /api/admin/skills/[id]
File: `app/api/admin/skills/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { z } from 'zod'

const updateSchema = z.object({
  conversion_rates: z.record(z.number()).optional(),
  thresholds: z.record(z.number()).optional(),
  enabled: z.boolean().optional()
})

async function handlePATCH(
  req: NextRequest & { adminUserId: string },
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const update = updateSchema.parse(body)

    const supabase = createServerClient()

    // Get current config
    const { data: current, error: fetchError } = await supabase
      .from('skills_config')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { error: 'Skill config not found', code: 'SKILL_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (update.conversion_rates) {
      updateData.conversion_rates = update.conversion_rates
    }

    if (update.thresholds) {
      updateData.thresholds = update.thresholds
    }

    if (update.enabled !== undefined) {
      updateData.enabled = update.enabled
    }

    // Update config
    const { error: updateError } = await supabase
      .from('skills_config')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    // Log action with changes
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: 'skill.update',
      resourceType: 'skill',
      resourceId: params.id,
      changes: {
        conversion_rates: {
          from: current.conversion_rates,
          to: update.conversion_rates || current.conversion_rates
        },
        thresholds: {
          from: current.thresholds,
          to: update.thresholds || current.thresholds
        },
        enabled: {
          from: current.enabled,
          to: update.enabled !== undefined ? update.enabled : current.enabled
        }
      },
      metadata: {
        skillName: current.skill_name,
        warning: 'CRITICAL: Skill configuration changed. Run evals to validate calculations!'
      }
    })

    return NextResponse.json({
      success: true,
      warning: 'Skill configuration updated. IMPORTANT: Run calculation evals to ensure formulas still match reference implementation.'
    })

  } catch (error) {
    console.error('Admin skill update error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update skill',
        code: 'SKILL_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

export const PATCH = requireSuperAdmin(handlePATCH)
```

## Acceptance Criteria

### Database
- [x] user_roles table created with RLS policies
- [x] admin_audit_log table created with indexes
- [x] user_status table created for tracking disabled users
- [x] All migrations run successfully
- [x] Seed super admin documented (manual step)

### Middleware
- [x] checkAdminAuth() function validates admin role
- [x] requireAdmin() wrapper protects admin routes
- [x] requireSuperAdmin() wrapper for elevated permissions
- [x] Unauthorized access attempts logged

### Audit Logging
- [x] logAdminAction() utility created
- [x] getAuditLog() query function created
- [x] All admin actions logged automatically
- [x] Audit log queryable with filters

### API Routes - User Management
- [x] GET /api/admin/users (list with filters)
- [x] GET /api/admin/users/[id] (detailed view)
- [x] PATCH /api/admin/users/[id] (disable, enable, change role)
- [x] DELETE /api/admin/users/[id] (cascade delete with warnings)

### API Routes - Job Management
- [x] GET /api/admin/jobs (list with filters)
- [x] GET /api/admin/jobs/stats (aggregated statistics)
- [x] POST /api/admin/jobs/[id]/retry (retry failed jobs)
- [x] DELETE /api/admin/jobs/[id] (delete non-processing jobs)

### API Routes - System
- [x] GET /api/admin/system/health (service health checks)
- [x] GET /api/admin/system/metrics (usage metrics by period)

### API Routes - Skills
- [x] GET /api/admin/skills (list skill configs)
- [x] PATCH /api/admin/skills/[id] (update formulas - super admin only)

### Security
- [x] All routes protected with admin middleware
- [x] RLS policies enforce data isolation
- [x] Zod validation on all inputs
- [x] Audit logging on all actions
- [x] Super admin required for sensitive operations

### Code Quality
- [x] TypeScript strict mode (no any)
- [x] Proper error handling with try/catch
- [x] Logging for debugging
- [x] No hardcoded secrets

## Testing Instructions

After implementation, test with:

1. Create first super admin (manual SQL):
```sql
-- After first user signs up, get their user_id
insert into user_roles (user_id, role, notes)
values ('[USER_ID]', 'super_admin', 'Initial super admin')
on conflict (user_id) do update
set role = 'super_admin';

insert into user_status (user_id, is_active)
values ('[USER_ID]', true)
on conflict (user_id) do nothing;
```

2. Test admin middleware:
   - Try accessing `/api/admin/users` as regular user (should 403)
   - Try accessing as admin (should succeed)

3. Test user management:
   - List users
   - View user detail
   - Disable user
   - Re-enable user
   - Change user role (super admin only)

4. Test job management:
   - List all jobs
   - Filter by status/user
   - Retry failed job
   - Delete cancelled job

5. Test system metrics:
   - View health status
   - View metrics for different periods

6. Test audit logging:
   - Query audit log
   - Verify all actions logged

7. Validate security:
   - Non-admin blocked from admin routes
   - Regular admin blocked from super admin operations
   - RLS policies enforced

## Notes

- **Super Admin Setup**: First super admin must be created manually after initial user signup
- **Formula Changes**: Skill config updates REQUIRE running evals before production deployment
- **Cascade Deletes**: User deletion cascades to projects, jobs, files - warn before executing
- **Audit Log**: Cannot be tampered with (insert-only for regular admins)
- **Performance**: All queries use indexes for fast filtering
