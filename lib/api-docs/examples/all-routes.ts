/**
 * Complete API Route Documentation for WasteWise
 *
 * This file contains JSDoc annotations for all API routes.
 * Routes are organized by category for easy reference.
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API health check
 *     description: Check if the API is responding. Does not require authentication.
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */

/**
 * @swagger
 * /api/health/worker:
 *   get:
 *     summary: Worker health check
 *     description: Check if background workers are running and processing jobs
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       200:
 *         description: Worker health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 workersRunning:
 *                   type: integer
 *                   description: Number of active workers
 *                 pendingJobs:
 *                   type: integer
 *                   description: Number of pending jobs in queue
 *                 processingJobs:
 *                   type: integer
 *                   description: Number of jobs currently processing
 *                 lastJobProcessed:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of last processed job
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job status
 *     description: |
 *       Poll this endpoint to check the status of an analysis job.
 *
 *       **Polling Pattern**:
 *       - Poll every 2 seconds while `status === "pending"` or `status === "processing"`
 *       - Stop polling when `status === "completed"` or `status === "failed"`
 *       - Use `progress_percent` and `current_step` to show progress to users
 *     tags:
 *       - Jobs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobIdParam'
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisJob'
 *             examples:
 *               pending:
 *                 summary: Job pending in queue
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   user_id: "u123"
 *                   project_id: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                   job_type: "complete_analysis"
 *                   status: "pending"
 *                   progress_percent: 0
 *                   current_step: "Waiting in queue"
 *                   created_at: "2025-01-15T10:00:00Z"
 *               processing:
 *                 summary: Job in progress
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   user_id: "u123"
 *                   project_id: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                   job_type: "complete_analysis"
 *                   status: "processing"
 *                   progress_percent: 45
 *                   current_step: "Extracting invoice data (3/6 files)"
 *                   started_at: "2025-01-15T10:01:00Z"
 *                   created_at: "2025-01-15T10:00:00Z"
 *               completed:
 *                 summary: Job completed successfully
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   user_id: "u123"
 *                   project_id: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                   job_type: "complete_analysis"
 *                   status: "completed"
 *                   progress_percent: 100
 *                   current_step: "Completed"
 *                   started_at: "2025-01-15T10:01:00Z"
 *                   completed_at: "2025-01-15T10:04:30Z"
 *                   result_data:
 *                     yardsPerDoor: 0.12
 *                     costPerDoor: 18.50
 *                     optimizations:
 *                       - type: "compactor_monitors"
 *                         savings: 1200
 *                   ai_usage:
 *                     input_tokens: 15000
 *                     output_tokens: 3000
 *                     total_cost: 0.45
 *                   created_at: "2025-01-15T10:00:00Z"
 *               failed:
 *                 summary: Job failed with error
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   user_id: "u123"
 *                   project_id: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                   job_type: "complete_analysis"
 *                   status: "failed"
 *                   progress_percent: 30
 *                   current_step: "Failed during invoice extraction"
 *                   error_message: "Invalid invoice format: missing required fields"
 *                   error_code: "EXTRACTION_ERROR"
 *                   started_at: "2025-01-15T10:01:00Z"
 *                   completed_at: "2025-01-15T10:02:00Z"
 *                   created_at: "2025-01-15T10:00:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List user's jobs
 *     description: Get paginated list of analysis jobs for the authenticated user
 *     tags:
 *       - Jobs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         description: Filter by job status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - name: jobType
 *         in: query
 *         description: Filter by job type
 *         schema:
 *           type: string
 *           enum: [invoice_extraction, regulatory_research, complete_analysis, report_generation]
 *     responses:
 *       200:
 *         description: Jobs list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AnalysisJob'
 *             example:
 *               data:
 *                 - id: "job1"
 *                   status: "completed"
 *                   job_type: "complete_analysis"
 *                   created_at: "2025-01-15T10:00:00Z"
 *                 - id: "job2"
 *                   status: "processing"
 *                   job_type: "invoice_extraction"
 *                   created_at: "2025-01-15T11:00:00Z"
 *               total: 15
 *               page: 1
 *               limit: 20
 *               totalPages: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/projects/{id}/analyze:
 *   post:
 *     summary: Analyze specific project
 *     description: Shortcut endpoint to create complete_analysis job for a project
 *     tags:
 *       - Projects
 *       - Analysis
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeRegulatory:
 *                 type: boolean
 *                 description: Include regulatory compliance research
 *                 default: true
 *               generateReports:
 *                 type: boolean
 *                 description: Generate Excel and HTML reports
 *                 default: true
 *     responses:
 *       201:
 *         description: Analysis job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: "pending"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: List all jobs (admin)
 *     description: Get paginated list of all analysis jobs across all users. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Jobs list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AnalysisJob'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   get:
 *     summary: Get job details (admin)
 *     description: Get detailed information about any job. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobIdParam'
 *     responses:
 *       200:
 *         description: Job details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisJob'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/admin/jobs/{id}/retry:
 *   post:
 *     summary: Retry failed job (admin)
 *     description: Create a new job with the same parameters as a failed job. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobIdParam'
 *     responses:
 *       201:
 *         description: Retry job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                 originalJobId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: "pending"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/admin/jobs/monitoring:
 *   get:
 *     summary: Get job queue metrics (admin)
 *     description: Real-time metrics about job queue health and performance. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Queue metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queue:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: integer
 *                       description: Jobs waiting to be processed
 *                     processing:
 *                       type: integer
 *                       description: Jobs currently being processed
 *                     completed_last_hour:
 *                       type: integer
 *                     failed_last_hour:
 *                       type: integer
 *                     avg_processing_time_seconds:
 *                       type: number
 *                       description: Average processing time
 *                 workers:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                       description: Number of active workers
 *                     idle:
 *                       type: integer
 *                       description: Number of idle workers
 *                 performance:
 *                   type: object
 *                   properties:
 *                     jobs_per_minute:
 *                       type: number
 *                       description: Current throughput
 *                     avg_wait_time_seconds:
 *                       type: number
 *                       description: Average time jobs spend waiting
 *             example:
 *               queue:
 *                 pending: 5
 *                 processing: 2
 *                 completed_last_hour: 45
 *                 failed_last_hour: 1
 *                 avg_processing_time_seconds: 135.5
 *               workers:
 *                 active: 2
 *                 idle: 1
 *               performance:
 *                 jobs_per_minute: 0.5
 *                 avg_wait_time_seconds: 15.3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/jobs/stats:
 *   get:
 *     summary: Get job statistics (admin)
 *     description: Historical statistics and trends for job processing. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Time period for statistics
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Job statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 total_jobs:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 success_rate:
 *                   type: number
 *                   description: Percentage of successful jobs
 *                 by_type:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       avg_duration_seconds:
 *                         type: number
 *                 by_hour:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       count:
 *                         type: integer
 *             example:
 *               period: "day"
 *               total_jobs: 120
 *               completed: 115
 *               failed: 5
 *               success_rate: 95.83
 *               by_type:
 *                 complete_analysis:
 *                   count: 80
 *                   avg_duration_seconds: 145.2
 *                 invoice_extraction:
 *                   count: 40
 *                   avg_duration_seconds: 45.8
 *               by_hour: [{"hour": 0, "count": 5}, {"hour": 1, "count": 3}]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/workers/health:
 *   get:
 *     summary: Get worker health status (admin)
 *     description: Detailed health information for all background workers. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Worker health retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 workers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, idle, stuck, crashed]
 *                       current_job_id:
 *                         type: string
 *                         format: uuid
 *                       uptime_seconds:
 *                         type: integer
 *                       jobs_processed:
 *                         type: integer
 *                       last_heartbeat:
 *                         type: string
 *                         format: date-time
 *             example:
 *               status: "healthy"
 *               workers:
 *                 - id: "worker-1"
 *                   status: "active"
 *                   current_job_id: "job123"
 *                   uptime_seconds: 3600
 *                   jobs_processed: 25
 *                   last_heartbeat: "2025-01-15T10:00:00Z"
 *                 - id: "worker-2"
 *                   status: "idle"
 *                   current_job_id: null
 *                   uptime_seconds: 3600
 *                   jobs_processed: 30
 *                   last_heartbeat: "2025-01-15T10:00:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/system/health:
 *   get:
 *     summary: Get system health (admin)
 *     description: Overall system health including all services. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemHealth'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/system/metrics:
 *   get:
 *     summary: Get system metrics (admin)
 *     description: Performance and usage metrics for the system. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 api:
 *                   type: object
 *                   properties:
 *                     requests_per_minute:
 *                       type: number
 *                     avg_response_time_ms:
 *                       type: number
 *                     error_rate:
 *                       type: number
 *                       description: Percentage of requests that errored
 *                 database:
 *                   type: object
 *                   properties:
 *                     connections_active:
 *                       type: integer
 *                     avg_query_time_ms:
 *                       type: number
 *                     slow_queries:
 *                       type: integer
 *                       description: Queries taking >1s in last minute
 *                 storage:
 *                   type: object
 *                   properties:
 *                     total_files:
 *                       type: integer
 *                     total_size_mb:
 *                       type: number
 *                     uploads_last_hour:
 *                       type: integer
 *                 ai:
 *                   type: object
 *                   properties:
 *                     requests_last_hour:
 *                       type: integer
 *                     total_tokens_last_hour:
 *                       type: integer
 *                     total_cost_last_hour:
 *                       type: number
 *             example:
 *               timestamp: "2025-01-15T10:00:00Z"
 *               api:
 *                 requests_per_minute: 45.2
 *                 avg_response_time_ms: 125.5
 *                 error_rate: 0.5
 *               database:
 *                 connections_active: 12
 *                 avg_query_time_ms: 15.3
 *                 slow_queries: 2
 *               storage:
 *                 total_files: 1250
 *                 total_size_mb: 5420.5
 *                 uploads_last_hour: 35
 *               ai:
 *                 requests_last_hour: 120
 *                 total_tokens_last_hour: 250000
 *                 total_cost_last_hour: 7.50
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (admin)
 *     description: Get paginated list of all users. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: search
 *         in: query
 *         description: Search by email or name
 *         schema:
 *           type: string
 *       - name: role
 *         in: query
 *         description: Filter by role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *     responses:
 *       200:
 *         description: Users list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details (admin)
 *     description: Get detailed information about a specific user. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     projects_count:
 *                       type: integer
 *                     jobs_count:
 *                       type: integer
 *                     total_ai_cost:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Update user (admin)
 *     description: Update user role or status. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/admin/skills:
 *   get:
 *     summary: List all skills (admin)
 *     description: Get configuration for all available skills. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Skills list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       skill_name:
 *                         type: string
 *                       skill_version:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *                       conversion_rates:
 *                         type: object
 *                       thresholds:
 *                         type: object
 *             example:
 *               skills:
 *                 - id: "skill1"
 *                   skill_name: "compactor-optimization"
 *                   skill_version: "1.0.0"
 *                   enabled: true
 *                   conversion_rates:
 *                     compactorYPD: 14.49
 *                     dumpsterYPD: 4.33
 *                   thresholds:
 *                     optimizationThreshold: 6.0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   patch:
 *     summary: Update skill configuration (admin)
 *     description: Update conversion rates or thresholds for a skill. Admin only. USE WITH CAUTION.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversion_rates:
 *                 type: object
 *                 description: Updated conversion rates
 *               thresholds:
 *                 type: object
 *                 description: Updated thresholds
 *               enabled:
 *                 type: boolean
 *                 description: Enable/disable skill
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skill_name:
 *                   type: string
 *                 skill_version:
 *                   type: string
 *                 enabled:
 *                   type: boolean
 *                 conversion_rates:
 *                   type: object
 *                 thresholds:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/admin/audit:
 *   get:
 *     summary: Get audit log (admin)
 *     description: Retrieve audit log of admin actions. Admin only.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: action
 *         in: query
 *         description: Filter by action type
 *         schema:
 *           type: string
 *       - name: userId
 *         in: query
 *         description: Filter by user who performed action
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit log retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           action:
 *                             type: string
 *                           resource_type:
 *                             type: string
 *                           resource_id:
 *                             type: string
 *                           changes:
 *                             type: object
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
