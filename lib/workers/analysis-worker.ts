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
import fs from 'fs'

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
   * Uses atomic job claiming to prevent race conditions between multiple workers
   */
  private async run(): Promise<void> {
    logger.info('Worker polling loop started')

    let backoff = this.pollInterval // Start with configured interval

    while (this.isRunning) {
      try {
        // Atomically claim jobs using database function to prevent race conditions
        const processingPromises: Promise<void>[] = []

        for (let i = 0; i < this.maxConcurrentJobs; i++) {
          // Use RPC to call claim_next_analysis_job() function
          const { data: claimedJob, error: claimError } = await this.supabase.rpc(
            'claim_next_analysis_job'
          )

          if (claimError) {
            logger.error('Failed to claim job', claimError as Error)
            break
          }

          // Check if job is null or has null id (no jobs available)
          // Note: RPC returns an object with null fields when no rows match, not null itself
          if (!claimedJob || !claimedJob.id) {
            // No more pending jobs available
            break
          }

          // Process claimed job
          const jobLogger = logger.child({ jobId: claimedJob.id })

          const processingPromise = (async () => {
            try {
              jobLogger.info('Starting job processing', {
                jobType: claimedJob.job_type,
                projectId: claimedJob.project_id,
              })

              jobLogger.info('Claimed job', { jobId: claimedJob.id, type: claimedJob.job_type })

              try { fs.appendFileSync('debug-worker.txt', `DEBUG: AnalysisWorker calling processJob for ${claimedJob.id}\n`) } catch (e) { }
              console.log(`DEBUG: AnalysisWorker calling processJob for ${claimedJob.id}`)

              await this.processor.processJob(claimedJob.id)

              jobLogger.info('Job processing completed successfully')
            } catch (error) {
              jobLogger.error('Job processing failed', error as Error, {
                jobType: claimedJob.job_type,
                projectId: claimedJob.project_id,
              })
              // Continue processing other jobs even if one fails
            }
          })()

          processingPromises.push(processingPromise)
        }

        // Wait for all claimed jobs to complete
        if (processingPromises.length > 0) {
          logger.info('Processing claimed jobs', undefined, { count: processingPromises.length })
          await Promise.all(processingPromises)
          backoff = this.pollInterval // Reset backoff on successful job processing
        } else {
          // No jobs found - use exponential backoff to reduce database load
          await this.sleep(backoff)
          backoff = Math.min(backoff * 1.5, 30000) // Max 30 seconds
          continue
        }

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
