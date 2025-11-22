/**
 * Enhance Job Management Migration
 *
 * Adds enterprise features to analysis_jobs:
 * - Exponential backoff retry logic
 * - Priority queue system
 * - Alert infrastructure
 * - Job monitoring capabilities
 *
 * Phase 7: Production readiness enhancements
 */

-- ============================================================================
-- 1. Add retry and priority columns to analysis_jobs
-- ============================================================================

-- Add retry_after for exponential backoff scheduling
alter table analysis_jobs
add column if not exists retry_after timestamp with time zone,
add column if not exists retry_error_log jsonb default '[]'::jsonb;

-- Add priority queue columns
alter table analysis_jobs
add column if not exists priority integer default 5 check (priority >= 1 and priority <= 10),
add column if not exists priority_reason text;

-- Add worker assignment tracking
alter table analysis_jobs
add column if not exists worker_id text,
add column if not exists claimed_at timestamp with time zone;

-- ============================================================================
-- 2. Create job_alerts table
-- ============================================================================

create table if not exists job_alerts (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references analysis_jobs(id) on delete cascade,

  -- Alert classification
  alert_type text not null check (
    alert_type in ('job_failed', 'job_stuck', 'high_error_rate', 'worker_down')
  ),
  severity text not null check (
    severity in ('warning', 'error', 'critical')
  ),

  -- Alert content
  message text not null,
  details jsonb,

  -- Notification tracking
  notified_at timestamp with time zone,
  notification_channels jsonb, -- ['email', 'slack', 'pagerduty']

  -- Acknowledgment tracking
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid references auth.users(id),

  -- Metadata
  created_at timestamp with time zone default now()
);

-- Indexes for job_alerts
create index idx_job_alerts_job_id on job_alerts(job_id);
create index idx_job_alerts_created_at on job_alerts(created_at desc);
create index idx_job_alerts_severity on job_alerts(severity);
create index idx_job_alerts_acknowledged on job_alerts(acknowledged_at) where acknowledged_at is null;

-- ============================================================================
-- 3. Update indexes for priority queue
-- ============================================================================

-- Drop old status index, add composite index for priority queue
drop index if exists idx_analysis_jobs_status;
create index idx_analysis_jobs_queue on analysis_jobs(status, priority asc, created_at asc)
  where status = 'pending' and (retry_after is null or retry_after < now());

-- Index for stuck job detection
create index idx_analysis_jobs_processing on analysis_jobs(status, started_at)
  where status = 'processing';

-- Index for error rate monitoring
create index idx_analysis_jobs_failed on analysis_jobs(status, failed_at desc)
  where status = 'failed';

-- ============================================================================
-- 4. RLS policies for job_alerts
-- ============================================================================

alter table job_alerts enable row level security;

-- Users can view alerts for their own jobs
create policy "Users can view their job alerts"
  on job_alerts for select
  using (
    exists (
      select 1 from analysis_jobs
      where analysis_jobs.id = job_alerts.job_id
      and analysis_jobs.user_id = auth.uid()
    )
  );

-- Service role can manage all alerts
create policy "Service role can manage all alerts"
  on job_alerts for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 5. Helper functions for retry logic
-- ============================================================================

-- Function: Calculate exponential backoff delay
create or replace function calculate_retry_delay(attempt_number integer)
returns interval
language plpgsql
immutable
as $$
begin
  -- Exponential backoff: 1min, 5min, 15min
  case attempt_number
    when 1 then return interval '1 minute';
    when 2 then return interval '5 minutes';
    when 3 then return interval '15 minutes';
    else return interval '30 minutes'; -- Max backoff
  end case;
end;
$$;

-- Function: Schedule retry with exponential backoff
create or replace function schedule_job_retry(
  job_id uuid,
  error_msg text,
  error_cd text default 'RETRY_ERROR'
)
returns boolean
language plpgsql
security definer
as $$
declare
  current_retries integer;
  max_retry integer;
  retry_delay interval;
  error_entry jsonb;
begin
  -- Get current retry count and max retries
  select retry_count, max_retries
  into current_retries, max_retry
  from analysis_jobs
  where id = job_id;

  -- Check if retries remaining
  if current_retries >= max_retry then
    return false; -- No retries left
  end if;

  -- Calculate delay based on next attempt number
  retry_delay := calculate_retry_delay(current_retries + 1);

  -- Build error log entry
  error_entry := jsonb_build_object(
    'attempt', current_retries + 1,
    'timestamp', now(),
    'error_message', error_msg,
    'error_code', error_cd
  );

  -- Update job for retry
  update analysis_jobs
  set
    status = 'pending',
    retry_count = retry_count + 1,
    retry_after = now() + retry_delay,
    retry_error_log = retry_error_log || error_entry,
    error_message = error_msg,
    error_code = error_cd,
    updated_at = now()
  where id = job_id;

  return true; -- Retry scheduled
end;
$$;

-- Function: Enhanced fail job with retry logic
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
  retry_scheduled boolean;
begin
  select started_at into job_started
  from analysis_jobs
  where id = job_id;

  -- Try to schedule retry
  retry_scheduled := schedule_job_retry(job_id, error_msg, error_cd);

  -- If no retry scheduled, mark as permanently failed
  if not retry_scheduled then
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

-- ============================================================================
-- 6. Helper functions for priority queue
-- ============================================================================

-- Function: Get next job from priority queue
create or replace function get_next_job(worker_identifier text default null)
returns uuid
language plpgsql
security definer
as $$
declare
  next_job_id uuid;
begin
  -- Find highest priority pending job ready for processing
  select id into next_job_id
  from analysis_jobs
  where status = 'pending'
    and (retry_after is null or retry_after <= now())
  order by priority asc, created_at asc
  limit 1
  for update skip locked;

  -- Mark job as claimed if found
  if next_job_id is not null and worker_identifier is not null then
    update analysis_jobs
    set
      worker_id = worker_identifier,
      claimed_at = now()
    where id = next_job_id;
  end if;

  return next_job_id;
end;
$$;

-- Function: Assign priority based on context
create or replace function assign_job_priority(
  user_id uuid,
  job_type text
)
returns integer
language plpgsql
security definer
as $$
declare
  user_job_count integer;
  priority integer;
begin
  -- Count user's completed jobs
  select count(*)
  into user_job_count
  from analysis_jobs
  where analysis_jobs.user_id = assign_job_priority.user_id
    and status = 'completed';

  -- Priority assignment logic
  case
    -- First-time user's first analysis: High priority
    when user_job_count = 0 then
      priority := 3;

    -- Regular analysis: Normal priority
    when job_type = 'complete_analysis' then
      priority := 5;

    -- Report regeneration: Low priority
    when job_type = 'report_generation' then
      priority := 7;

    -- Default: Normal priority
    else
      priority := 5;
  end case;

  return priority;
end;
$$;

-- ============================================================================
-- 7. Monitoring and alerting functions
-- ============================================================================

-- Function: Detect stuck jobs (processing > 30 minutes)
create or replace function detect_stuck_jobs()
returns table(
  job_id uuid,
  started_at timestamp with time zone,
  duration_minutes integer,
  job_type text,
  user_id uuid
)
language sql
security definer
as $$
  select
    id,
    started_at,
    extract(epoch from (now() - started_at))::integer / 60 as duration_minutes,
    job_type,
    user_id
  from analysis_jobs
  where status = 'processing'
    and started_at is not null
    and started_at < now() - interval '30 minutes';
$$;

-- Function: Calculate error rate
create or replace function calculate_error_rate(time_window interval default '1 hour')
returns numeric
language sql
security definer
as $$
  select
    case
      when count(*) = 0 then 0.0
      else round(
        (count(*) filter (where status = 'failed')::numeric / count(*)) * 100,
        2
      )
    end as error_rate_percent
  from analysis_jobs
  where created_at >= now() - time_window;
$$;

-- Function: Get queue metrics
create or replace function get_queue_metrics()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'total_pending', count(*) filter (where status = 'pending'),
    'total_processing', count(*) filter (where status = 'processing'),
    'total_failed_today', count(*) filter (where status = 'failed' and failed_at >= current_date),
    'total_completed_today', count(*) filter (where status = 'completed' and completed_at >= current_date),
    'by_priority', (
      select jsonb_object_agg(priority::text, cnt)
      from (
        select priority, count(*) as cnt
        from analysis_jobs
        where status = 'pending'
        group by priority
        order by priority
      ) priority_counts
    ),
    'avg_duration_seconds', (
      select round(avg(duration_seconds))
      from analysis_jobs
      where status = 'completed'
        and completed_at >= now() - interval '1 hour'
    ),
    'error_rate_1h', calculate_error_rate('1 hour'),
    'error_rate_24h', calculate_error_rate('24 hours'),
    'stuck_jobs', (
      select count(*)
      from detect_stuck_jobs()
    )
  )
  from analysis_jobs
  where created_at >= current_date;
$$;

-- ============================================================================
-- 8. Comments for documentation
-- ============================================================================

comment on column analysis_jobs.retry_after is 'Timestamp when job is eligible for retry (exponential backoff)';
comment on column analysis_jobs.retry_error_log is 'Array of error objects from previous retry attempts';
comment on column analysis_jobs.priority is 'Job priority (1=highest, 10=lowest) for queue ordering';
comment on column analysis_jobs.priority_reason is 'Human-readable explanation of priority assignment';
comment on column analysis_jobs.worker_id is 'Identifier of worker that claimed this job';
comment on column analysis_jobs.claimed_at is 'Timestamp when job was claimed by worker';

comment on table job_alerts is 'System alerts for job failures, stuck jobs, and high error rates';
comment on column job_alerts.alert_type is 'Type of alert: job_failed, job_stuck, high_error_rate, worker_down';
comment on column job_alerts.severity is 'Alert severity: warning, error, critical';
comment on column job_alerts.notification_channels is 'Channels notified: email, slack, pagerduty';

comment on function get_next_job is 'Returns next job ID from priority queue with optional worker claim';
comment on function schedule_job_retry is 'Schedules job retry with exponential backoff, returns true if retry scheduled';
comment on function detect_stuck_jobs is 'Returns jobs processing longer than 30 minutes';
comment on function calculate_error_rate is 'Calculates failure rate percentage over time window';
comment on function get_queue_metrics is 'Returns comprehensive queue health metrics';
