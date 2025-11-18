-- Add performance indexes for hot query paths
-- PERFORMANCE FIX: Improves query performance for job polling and data retrieval

-- Composite index for pending job queue (used by worker)
-- Partial index only on pending jobs for efficiency
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_pending_queue
ON analysis_jobs(status, created_at)
WHERE status = 'pending';

-- Index for user's job lookups
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_status
ON analysis_jobs(user_id, status, created_at DESC);

-- Index for project-based queries
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project
ON analysis_jobs(project_id, created_at DESC);

-- Index for haul log date range queries
CREATE INDEX IF NOT EXISTS idx_haul_log_project_date
ON haul_log(project_id, haul_date DESC);

-- Index for invoice date range queries
CREATE INDEX IF NOT EXISTS idx_invoice_data_project_date
ON invoice_data(project_id, invoice_date DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_analysis_jobs_pending_queue IS
'Composite index for worker polling - optimizes "WHERE status = pending ORDER BY created_at" queries';

COMMENT ON INDEX idx_analysis_jobs_user_status IS
'Optimizes user dashboard queries filtering by user_id and status';

COMMENT ON INDEX idx_analysis_jobs_project IS
'Optimizes project history queries';

COMMENT ON INDEX idx_haul_log_project_date IS
'Optimizes haul log retrieval for analysis skills';

COMMENT ON INDEX idx_invoice_data_project_date IS
'Optimizes invoice retrieval for analysis skills';
