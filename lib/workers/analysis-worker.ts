/**
 * Analysis Worker
 *
 * Background worker that continuously polls the database for pending analysis jobs
 * and processes them using the JobProcessor.
 *
 * Phase 1.5: Single-job processing with basic polling
 * Future: Multi-job processing, priority queues, health checks
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { JobProcessor } from './job-processor'
import { logger } from '@/lib/observability/logger'

export interface AnalysisWorkerConfig {
  /** How often to poll for new jobs (milliseconds) */
  pollInterval?: number

  /** Maximum number of jobs to process concurrently */
  maxConcurrentJobs?: number

  /** Supabase URL */
  supabaseUrl: string

  /** Supabase service role key */
  supabaseServiceKey: string
}

export class AnalysisWorker {
  private processor: JobProcessor
  private supabase: ReturnType<typeof createClient<Database>>
  private isRunning = false
  private pollInterval: number
  private maxConcurrentJobs: number

  constructor(config: AnalysisWorkerConfig) {
    this.pollInterval = config.pollInterval || 2000 // Default 2 seconds
    this.maxConcurrentJobs = config.maxConcurrentJobs || 1 // Default 1 job at a time

    this.processor = new JobProcessor(config.supabaseUrl, config.supabaseServiceKey)

    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Start the worker polling loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker already running')
      return
    }

    this.isRunning = true
    logger.info('Starting analysis worker', {
      pollInterval: this.pollInterval,
      maxConcurrentJobs: this.maxConcurrentJobs,
    })

    // Start polling loop
    await this.run()
  }

  /**
   * Stop the worker polling loop
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Worker not running')
      return
    }

    this.isRunning = false
    logger.info('Stopping analysis worker')
  }

  /**
   * Main polling loop
   *
   * Continuously checks database for pending jobs and processes them
   */
  private async run(): Promise<void> {
    logger.info('Worker polling loop started')

    while (this.isRunning) {
      try {
        // Fetch pending jobs from database
        const { data: jobs, error: fetchError } = await this.supabase
          .from('analysis_jobs')
          .select('id, job_type, project_id, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(this.maxConcurrentJobs)

        if (fetchError) {
          logger.error('Failed to fetch pending jobs', fetchError as Error)
          await this.sleep(this.pollInterval)
          continue
        }

        if (!jobs || jobs.length === 0) {
          // No pending jobs - wait before checking again
          await this.sleep(this.pollInterval)
          continue
        }

        logger.info('Found pending jobs', undefined, { count: jobs.length })

        // Process each job
        const processingPromises = jobs.map(async (job) => {
          const jobLogger = logger.child({ jobId: job.id })

          try {
            jobLogger.info('Starting job processing', {
              jobType: job.job_type,
              projectId: job.project_id,
            })

            await this.processor.processJob(job.id)

            jobLogger.info('Job processing completed successfully')
          } catch (error) {
            jobLogger.error('Job processing failed', error as Error, {
              jobType: job.job_type,
              projectId: job.project_id,
            })
            // Continue processing other jobs even if one fails
          }
        })

        // Wait for all jobs to complete
        await Promise.all(processingPromises)

        // Brief pause before next poll
        await this.sleep(this.pollInterval)
      } catch (error) {
        logger.error('Worker loop error', error as Error)
        // Wait before retrying
        await this.sleep(this.pollInterval)
      }
    }

    logger.info('Worker polling loop stopped')
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    pollInterval: number
    maxConcurrentJobs: number
  } {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      maxConcurrentJobs: this.maxConcurrentJobs,
    }
  }
}
