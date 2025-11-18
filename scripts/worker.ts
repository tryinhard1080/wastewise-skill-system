/**
 * WasteWise Analysis Worker
 *
 * Simple polling worker that processes pending analysis jobs.
 *
 * Usage:
 *   pnpm worker
 *
 * Environment Variables:
 *   POLL_INTERVAL_MS - How often to poll for jobs (default: 5000ms)
 *   WORKER_CONCURRENCY - Max concurrent jobs (default: 1)
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env.local file
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { executeSkillWithProgress } from '@/lib/skills/executor'
import { registerAllSkills } from '@/lib/skills/skills'
import { logger } from '@/lib/observability/logger'
import { metrics } from '@/lib/observability/metrics'
import type { Database } from '@/types/database.types'

type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row']

// Configuration
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10)
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '1', 10)

// Supabase client (using service key for backend operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Track active jobs
const activeJobs = new Set<string>()

/**
 * Poll for pending jobs and process them
 */
async function pollJobs(): Promise<void> {
  try {
    // Query for pending jobs
    const { data: jobs, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(WORKER_CONCURRENCY - activeJobs.size)

    if (error) {
      logger.error('Failed to query pending jobs', error as Error)
      return
    }

    if (!jobs || jobs.length === 0) {
      // No pending jobs
      return
    }

    logger.info(`Found ${jobs.length} pending job(s)`)

    // Process each job
    for (const job of jobs) {
      if (activeJobs.size >= WORKER_CONCURRENCY) {
        logger.debug('Worker at max concurrency, skipping remaining jobs')
        break
      }

      // Skip if already processing
      if (activeJobs.has(job.id)) {
        continue
      }

      // Start processing job (non-blocking)
      processJob(job).catch(error => {
        logger.error('Unhandled error processing job', error as Error, { jobId: job.id })
      })
    }
  } catch (error) {
    logger.error('Error in pollJobs', error as Error)
  }
}

/**
 * Process a single analysis job
 */
async function processJob(job: AnalysisJob): Promise<void> {
  const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

  activeJobs.add(job.id)

  try {
    jobLogger.info('Starting job processing', {
      jobType: job.job_type,
      userId: job.user_id,
    })

    // Mark job as processing
    await updateJobStatus(job.id, 'processing', 0, 'Initializing...')

    // Execute skill with progress tracking
  const result = await executeSkillWithProgress(
    job.project_id,
    job.job_type,
    async (percent: number, step: string) => {
      await updateJobStatus(job.id, 'processing', percent, step)
    },
    job.user_id,
    supabase
  )

    if (result.success) {
      jobLogger.info('Job completed successfully', {
        durationMs: result.metadata.durationMs,
        aiCost: result.metadata.aiUsage?.costUsd || 0,
      })

      // Update job as completed
      await supabase
        .from('analysis_jobs')
        .update({
          status: 'completed',
          progress_percent: 100,
          current_step: 'Completed',
          result_data: result.data,
          ai_requests: result.metadata.aiUsage?.requests || 0,
          ai_tokens_input: result.metadata.aiUsage?.tokensInput || 0,
          ai_tokens_output: result.metadata.aiUsage?.tokensOutput || 0,
          ai_cost_usd: result.metadata.aiUsage?.costUsd || 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      metrics.increment('worker.job.completed', 1, {
        jobType: job.job_type,
      })
    } else {
      // Job failed with error result
      const errorMessage = result.error?.message || 'Unknown error'

      jobLogger.error('Job failed', new Error(errorMessage), {
        errorCode: result.error?.code,
        errorDetails: result.error?.details,
      })

      await supabase
        .from('analysis_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          error_details: result.error?.details,
          failed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      metrics.increment('worker.job.failed', 1, {
        jobType: job.job_type,
        errorCode: result.error?.code || 'unknown',
      })
    }
  } catch (error) {
    jobLogger.error('Job processing error', error as Error)

    // Update job as failed
    await supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: error instanceof Error ? { stack: error.stack } : {},
        failed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    metrics.increment('worker.job.error', 1, {
      jobType: job.job_type,
    })
  } finally {
    activeJobs.delete(job.id)
  }
}

/**
 * Update job status and progress
 */
async function updateJobStatus(
  jobId: string,
  status: string,
  progressPercent: number,
  currentStep: string
): Promise<void> {
  const { error } = await supabase
    .from('analysis_jobs')
    .update({
      status,
      progress_percent: progressPercent,
      current_step: currentStep,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    logger.error('Failed to update job status', error as Error, { jobId })
  }
}

/**
 * Graceful shutdown handler
 */
let isShuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Already shutting down, forcing exit')
    process.exit(1)
  }

  isShuttingDown = true

  logger.info(`Received ${signal}, starting graceful shutdown...`)

  // Wait for active jobs to complete (with timeout)
  const shutdownTimeout = setTimeout(() => {
    logger.warn('Shutdown timeout reached, forcing exit')
    process.exit(1)
  }, 30000) // 30 second timeout

  while (activeJobs.size > 0) {
    logger.info(`Waiting for ${activeJobs.size} active job(s) to complete...`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  clearTimeout(shutdownTimeout)

  logger.info('All jobs completed, exiting')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

/**
 * Main worker loop
 */
async function main(): Promise<void> {
  logger.info('WasteWise Analysis Worker starting', {
    pollIntervalMs: POLL_INTERVAL_MS,
    workerConcurrency: WORKER_CONCURRENCY,
  })

  // Register all skills
  registerAllSkills()

  // Start polling loop
  while (!isShuttingDown) {
    await pollJobs()
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}

// Start worker
main().catch(error => {
  logger.error('Worker crashed', error as Error)
  process.exit(1)
})
