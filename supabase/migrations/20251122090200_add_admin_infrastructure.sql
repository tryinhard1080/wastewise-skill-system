-- WasteWise Admin Infrastructure
-- Created: 2025-11-22
-- Description: Adds admin roles, user status management, and audit logging

-- ===========================
-- ADMIN ROLES SYSTEM
-- ===========================

-- Create user role enum
create type user_role as enum ('user', 'admin', 'super_admin');

-- User roles table
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

-- RLS Policies for user_roles
alter table user_roles enable row level security;

-- Users can view their own role
create policy "Users can view own role"
  on user_roles for select
  using (auth.uid() = user_id);

-- Admins can view all roles
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

-- ===========================
-- USER STATUS MANAGEMENT
-- ===========================

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

-- RLS Policies for user_status
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

-- ===========================
-- ADMIN AUDIT LOG
-- ===========================

create table admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid references auth.users not null,
  action text not null,
  resource_type text not null,
  resource_id text,
  changes jsonb,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

create index idx_audit_log_admin_id on admin_audit_log(admin_user_id);
create index idx_audit_log_resource on admin_audit_log(resource_type, resource_id);
create index idx_audit_log_action on admin_audit_log(action);
create index idx_audit_log_created_at on admin_audit_log(created_at desc);

-- RLS Policies for admin_audit_log
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

create policy "Service role can insert audit logs"
  on admin_audit_log for insert
  to service_role
  with check (true);

-- ===========================
-- HELPER FUNCTIONS
-- ===========================

-- Function to automatically create user_status and user_roles on signup
-- Note: This will be called from the application since we can't directly
-- trigger on auth.users (managed by Supabase Auth)
create or replace function initialize_user_metadata(target_user_id uuid)
returns void as $$
begin
  -- Create user_status record
  insert into user_status (user_id, is_active)
  values (target_user_id, true)
  on conflict (user_id) do nothing;

  -- Create user_roles record (default to 'user')
  insert into user_roles (user_id, role)
  values (target_user_id, 'user')
  on conflict (user_id) do nothing;
end;
$$ language plpgsql security definer;

-- Function to check if user is admin
create or replace function is_admin(check_user_id uuid)
returns boolean as $$
declare
  user_role_value text;
begin
  select role into user_role_value
  from user_roles
  where user_id = check_user_id;

  return user_role_value in ('admin', 'super_admin');
end;
$$ language plpgsql security definer;

-- Function to check if user is super admin
create or replace function is_super_admin(check_user_id uuid)
returns boolean as $$
declare
  user_role_value text;
begin
  select role into user_role_value
  from user_roles
  where user_id = check_user_id;

  return user_role_value = 'super_admin';
end;
$$ language plpgsql security definer;

-- Trigger function to update updated_at
create trigger update_user_roles_updated_at before update on user_roles
  for each row execute function update_updated_at_column();

create trigger update_user_status_updated_at before update on user_status
  for each row execute function update_updated_at_column();

-- ===========================
-- COMMENTS FOR DOCUMENTATION
-- ===========================

comment on table user_roles is 'User role assignments for admin access control';
comment on table user_status is 'User account status tracking (active/disabled)';
comment on table admin_audit_log is 'Audit trail of all admin actions';

comment on function initialize_user_metadata is 'Initialize user_status and user_roles for new users';
comment on function is_admin is 'Check if user has admin or super_admin role';
comment on function is_super_admin is 'Check if user has super_admin role';

-- ===========================
-- NOTES
-- ===========================

-- To create the first super admin, run this SQL after first user signs up:
--
-- insert into user_roles (user_id, role, notes)
-- values ('[USER_ID]', 'super_admin', 'Initial super admin')
-- on conflict (user_id) do update
-- set role = 'super_admin';
--
-- insert into user_status (user_id, is_active)
-- values ('[USER_ID]', true)
-- on conflict (user_id) do nothing;
