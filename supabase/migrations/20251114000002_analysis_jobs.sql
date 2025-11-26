/**
 * Analysis Jobs Table Migration
 *
 * Purpose: Support long-running async analysis operations
 * - Invoice extraction (Claude Vision): 30s - 2 min
 * - Regulatory research (Claude + Search): 1-5 min
 * - Complete analysis workflows: 2-10 min
 *
 * Pattern: Client polls /api/jobs/[id] for status updates
 */

-- Analysis Jobs Table
create table analysis_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,

  -- Job metadata
  -- IMPORTANT: job_type values must match lib/constants/job-types.ts (canonical source)
  job_type text not null check (
    job_type in (
      'invoice_extraction',
      'regulatory_research',
      'complete_analysis',
      'report_generation'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),

  -- Progress tracking
  progress_percent integer default 0 check (progress_percent >= 0 and progress_percent <= 100),
  current_step text,
  total_steps integer,
  steps_completed integer default 0,

  -- Timing
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  estimated_completion timestamp with time zone,
  duration_seconds integer,

  -- Input/Output
  input_data jsonb not null default '{}'::jsonb,
  result_data jsonb,

  -- Error handling
  error_message text,
  error_code text,
  error_details jsonb,
  failed_at timestamp with time zone,
  retry_count integer default 0,
  max_retries integer default 3,

  -- AI usage tracking
  ai_requests integer default 0,
  ai_tokens_input integer default 0,
  ai_tokens_output integer default 0,
  ai_cost_usd numeric(10, 6) default 0.00,

  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index idx_analysis_jobs_user_id on analysis_jobs(user_id);
create index idx_analysis_jobs_project_id on analysis_jobs(project_id);
create index idx_analysis_jobs_status on analysis_jobs(status);
create index idx_analysis_jobs_created_at on analysis_jobs(created_at desc);
create index idx_analysis_jobs_user_status on analysis_jobs(user_id, status);

-- Updated_at trigger
create trigger set_analysis_jobs_updated_at
  before update on analysis_jobs
  for each row
  execute function update_updated_at_column();

-- Row Level Security (RLS)
alter table analysis_jobs enable row level security;

-- Users can only see their own jobs
create policy "Users can view their own jobs"
  on analysis_jobs for select
  using (auth.uid() = user_id);

-- Users can create jobs for their own projects
create policy "Users can create jobs"
  on analysis_jobs for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

-- Users can update their own jobs (for cancellation)
create policy "Users can update their own jobs"
  on analysis_jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can manage all jobs (for background workers)
create policy "Service role can manage all jobs"
  on analysis_jobs for all
  to service_role
  using (true)
  with check (true);

-- Helper function: Mark job as processing
create or replace function start_analysis_job(job_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update analysis_jobs
  set
    status = 'processing',
    started_at = now(),
    updated_at = now()
  where id = job_id
  and status = 'pending';
end;
$$;

-- Helper function: Update job progress
create or replace function update_job_progress(
  job_id uuid,
  new_progress integer,
  step_name text default null,
  step_num integer default null
)
returns void
language plpgsql
security definer
as $$
begin
  update analysis_jobs
  set
    progress_percent = new_progress,
    current_step = coalesce(step_name, current_step),
    steps_completed = coalesce(step_num, steps_completed),
    updated_at = now()
  where id = job_id;
end;
$$;

-- Helper function: Complete job successfully
create or replace function complete_analysis_job(
  job_id uuid,
  result jsonb,
  ai_usage jsonb default null
)
returns void
language plpgsql
security definer
as $$
declare
  job_started timestamp with time zone;
begin
  select started_at into job_started
  from analysis_jobs
  where id = job_id;

  update analysis_jobs
  set
    status = 'completed',
    progress_percent = 100,
    completed_at = now(),
    duration_seconds = extract(epoch from (now() - job_started))::integer,
    result_data = result,
    ai_requests = coalesce((ai_usage->>'requests')::integer, ai_requests),
    ai_tokens_input = coalesce((ai_usage->>'tokens_input')::integer, ai_tokens_input),
    ai_tokens_output = coalesce((ai_usage->>'tokens_output')::integer, ai_tokens_output),
    ai_cost_usd = coalesce((ai_usage->>'cost_usd')::numeric, ai_cost_usd),
    updated_at = now()
  where id = job_id;
end;
$$;

-- Helper function: Fail job with error
create or replace function fail_analysis_job(
  job_id uuid,
  error_msg text,
  error_cd text default 'UNKNOWN_ERROR'
)
returns void
language plpgsql
security definer
as $$
declare
  job_started timestamp with time zone;
  current_retries integer;
  max_retry integer;
begin
  select started_at, retry_count, max_retries
  into job_started, current_retries, max_retry
  from analysis_jobs
  where id = job_id;

  -- If retries remaining, set back to pending
  if current_retries < max_retry then
    update analysis_jobs
    set
      status = 'pending',
      retry_count = retry_count + 1,
      error_message = error_msg,
      error_code = error_cd,
      updated_at = now()
    where id = job_id;
  else
    -- No retries left, mark as failed
    update analysis_jobs
    set
      status = 'failed',
      completed_at = now(),
      duration_seconds = case
        when job_started is not null
        then extract(epoch from (now() - job_started))::integer
        else null
      end,
      error_message = error_msg,
      error_code = error_cd,
      updated_at = now()
    where id = job_id;
  end if;
end;
$$;

-- Cleanup function: Delete old completed/failed jobs
create or replace function cleanup_old_analysis_jobs(days_to_keep integer default 30)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from analysis_jobs
    where status in ('completed', 'failed')
    and completed_at < now() - (days_to_keep || ' days')::interval
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;

-- Comments for documentation
comment on table analysis_jobs is 'Tracks long-running AI analysis operations with progress and error handling';
comment on column analysis_jobs.job_type is 'Type of analysis: invoice_extraction, regulatory_research, complete_analysis, report_generation';
comment on column analysis_jobs.status is 'Current job status: pending, processing, completed, failed, cancelled';
comment on column analysis_jobs.progress_percent is 'Progress percentage (0-100)';
comment on column analysis_jobs.current_step is 'Human-readable description of current processing step';
comment on column analysis_jobs.ai_cost_usd is 'Estimated cost of AI API calls for this job';
