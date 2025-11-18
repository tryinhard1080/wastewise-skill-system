-- Add atomic job claiming function to prevent race conditions
-- PERFORMANCE FIX: Prevents duplicate job processing by multiple workers

-- Drop function if exists
DROP FUNCTION IF EXISTS claim_next_analysis_job();

-- Create atomic job claiming function using row-level locking
CREATE OR REPLACE FUNCTION claim_next_analysis_job()
RETURNS analysis_jobs
LANGUAGE plpgsql
AS $$
DECLARE
  claimed_job analysis_jobs;
BEGIN
  -- Use FOR UPDATE SKIP LOCKED to claim job atomically
  -- This ensures only one worker can claim a specific job
  UPDATE analysis_jobs
  SET
    status = 'processing',
    started_at = NOW()
  WHERE id = (
    SELECT id
    FROM analysis_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING * INTO claimed_job;

  RETURN claimed_job;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION claim_next_analysis_job() TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION claim_next_analysis_job() IS
'Atomically claims the next pending analysis job using row-level locking to prevent race conditions between multiple workers';
