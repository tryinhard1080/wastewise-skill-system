/**
 * Job Processor
 *
 * Orchestrates execution of different job types for the background worker.
 * Handles fetching data, executing skills, and updating job status.
 *
 * Phase 1.5: Basic job processing with complete_analysis support
 * Future: Additional job types (invoice_extraction, regulatory_research, etc.)
 */

import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database.types'
import { logger } from '@/lib/observability/logger'

import fs from 'fs'
try { fs.appendFileSync('debug-worker.txt', '!!! LOADING JOB-PROCESSOR.TS !!!\n') } catch (e) { }
console.log('!!! LOADING JOB-PROCESSOR.TS !!!')

import { executeSkillWithProgress } from '@/lib/skills/executor'
import type { SkillResult } from '@/lib/skills/types'
import { JOB_TYPES } from '@/lib/constants/job-types'
import {
  TimeoutError,
  RateLimitError,
  ExternalServiceError,
  AIServiceError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '@/lib/types/errors'

type AnalysisJob = Tables<'analysis_jobs'>

interface AnalysisJobInput {
  projectId: string
  [key: string]: any
}

/**
 * Classify error as transient (retry-able) vs permanent
 *
 * Transient errors should be retried (network issues, rate limits, external service failures).
 * Permanent errors should fail immediately (validation errors, not found, authentication).
 *
 * @param error - Error to classify
 * @returns True if error is transient and should be retried
 */
function isTransientError(error: Error): boolean {
  // Transient: Timeout errors
  if (error instanceof TimeoutError) {
    return true
  }

  // Transient: Rate limit errors (AI API, external services)
  if (error instanceof RateLimitError) {
    return true
  }

  // Transient: External service errors (502, 503, 504)
  if (error instanceof ExternalServiceError) {
    return true
  }

  // Transient: AI service errors (Claude API failures)
  if (error instanceof AIServiceError) {
    return true
  }

  // Permanent: Validation errors (bad input data)
  if (error instanceof ValidationError) {
    return false
  }

  // Permanent: Authentication errors (invalid credentials)
  if (error instanceof AuthenticationError) {
    return false
  }

  // Permanent: Not found errors (project, skill, etc.)
  if (error instanceof NotFoundError) {
    return false
  }

  // Check error messages for network issues (transient)
  const message = error.message.toLowerCase()
  if (
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('network error') ||
    message.includes('socket hang up') ||
    message.includes('enotfound')
  ) {
    return true
  }

  // Check for database connection errors (transient)
  if (
    message.includes('connection') &&
    (message.includes('refused') || message.includes('timeout'))
  ) {
    return true
  }

  // Default: treat as permanent to avoid infinite retries
  return false
}

export class JobProcessor {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Process a single job by ID
   *
   * Fetches job details, routes to appropriate handler, and manages status updates
   */
  async processJob(jobId: string): Promise<void> {
    const jobLogger = logger.child({ jobId })
    try { fs.appendFileSync('debug-worker.txt', `DEBUG: processJob called for ${jobId}\n`) } catch (e) { }
    console.log(`DEBUG: processJob called for ${jobId}`)

    try {
      jobLogger.info('Fetching job details')

      // Fetch job details
      const { data: job, error: fetchError } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (fetchError || !job) {
        throw new Error(`Job not found: ${jobId}`)
      }

      jobLogger.info('Job fetched successfully', {
        jobType: job.job_type,
        projectId: job.project_id,
        status: job.status,
      })

      // Job should already be marked as 'processing' by claim_next_analysis_job()
      // If it's not in 'processing' status, something went wrong
      if (job.status !== 'processing') {
        jobLogger.warn('Job is not in processing status, skipping', { status: job.status })
        return
      }

      // Route to appropriate handler based on job type
      jobLogger.info('Routing to job handler', { jobType: job.job_type })

      switch (job.job_type) {
        case JOB_TYPES.COMPLETE_ANALYSIS:
          await this.processCompleteAnalysis(job)
          break

        case JOB_TYPES.INVOICE_EXTRACTION:
          // TODO: Implement invoice extraction job
          throw new Error('Invoice extraction not yet implemented')

        case JOB_TYPES.REGULATORY_RESEARCH:
          // TODO: Implement regulatory research job
          throw new Error('Regulatory research not yet implemented')

        case JOB_TYPES.REPORT_GENERATION:
          // TODO: Implement report-only generation job
          throw new Error('Report generation not yet implemented')

        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      jobLogger.info('Job completed successfully')
    } catch (error) {
      const err = error as Error
      jobLogger.error('Job processing failed', err)

      try {
        const fs = require('fs')
        fs.appendFileSync('debug-worker.txt', `DEBUG: JobProcessor caught error: ${err.message}\n`)
      } catch (e) { }

      // Classify error to determine retry strategy
      const isTransient = isTransientError(err)

      // Extract error details
      const errorMessage = err.message
      const errorCode = (err as any).code || this.getErrorCode(err, errorMessage)

      if (isTransient) {
        // Transient error: let database retry logic handle it
        jobLogger.warn('Transient error detected - will retry', undefined, {
          errorCode,
          errorMessage,
          errorType: err.constructor.name,
        })
      } else {
        // Permanent error: mark as failed immediately
        jobLogger.error('Permanent error detected - marking as failed', err, {
          errorCode,
          errorType: err.constructor.name,
        })
      }

      // Call fail_analysis_job RPC function
      // - If transient + retries remain: Sets status back to 'pending' and increments retry_count
      // - If transient + no retries: Sets status to 'failed'
      // - If permanent: Sets status to 'failed' immediately
      const { error: failError } = await this.supabase.rpc('fail_analysis_job', {
        job_id: jobId,
        error_msg: errorMessage,
        error_cd: errorCode,
      })

      if (failError) {
        jobLogger.error('Failed to update job status', failError as Error)
      }

      throw error
    }
  }

  /**
   * Extract error code from error instance or message
   *
   * @param error - Error instance
   * @param message - Error message
   * @returns Error code for database storage
   */
  private getErrorCode(error: Error, message: string): string {
    // Check if error has explicit error type
    if (error instanceof ValidationError) return 'VALIDATION_ERROR'
    if (error instanceof AuthenticationError) return 'AUTHENTICATION_ERROR'
    if (error instanceof NotFoundError) return 'NOT_FOUND'
    if (error instanceof TimeoutError) return 'TIMEOUT'
    if (error instanceof RateLimitError) return 'RATE_LIMIT'
    if (error instanceof AIServiceError) return 'AI_SERVICE_ERROR'
    if (error instanceof ExternalServiceError) return 'EXTERNAL_SERVICE_ERROR'

    // Infer from message
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('not found')) return 'NOT_FOUND'
    if (lowerMessage.includes('validation')) return 'VALIDATION_ERROR'
    if (lowerMessage.includes('timeout')) return 'TIMEOUT'
    if (lowerMessage.includes('rate limit')) return 'RATE_LIMIT'
    if (lowerMessage.includes('network')) return 'NETWORK_ERROR'

    // Default
    return 'PROCESSING_ERROR'
  }

  /**
   * Process complete analysis job
   *
   * Delegates to the skill executor which handles data loading and execution.
   */
  private async processCompleteAnalysis(job: AnalysisJob): Promise<void> {
    const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

    jobLogger.info('Starting complete analysis processing')

    // Extract project ID from input data
    const inputData = job.input_data as unknown as AnalysisJobInput
    const projectId = inputData?.projectId || job.project_id

    if (!projectId) {
      throw new Error('Missing projectId in job input data')
    }

    // Execute skill via centralized executor
    const result = await executeSkillWithProgress(
      projectId,
      job.job_type,
      async (percent, step) => {
        jobLogger.debug('Updating job progress', { percent, step })

        const { error: progressError } = await this.supabase.rpc('update_job_progress', {
          job_id: job.id,
          new_progress: percent,
          step_name: step,
        })

        if (progressError) {
          jobLogger.warn('Failed to update job progress', undefined, {
            error: progressError.message,
          })
        }
      },
      job.user_id // Pass user_id from job record for worker context
    )

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Analysis failed without error message'
      throw new Error(errorMessage)
    }

    jobLogger.info('Skill execution completed successfully', {
      executionTime: result.metadata.durationMs,
    })

    // Mark job as complete with result data
    jobLogger.info('Marking job as complete')

    const { error: completeError } = await this.supabase.rpc('complete_analysis_job', {
      job_id: job.id,
      result: result.data as any, // JSONB
      ai_usage: result.metadata.aiUsage
        ? {
          requests: result.metadata.aiUsage.requests,
          tokens_input: result.metadata.aiUsage.tokensInput,
          tokens_output: result.metadata.aiUsage.tokensOutput,
          cost_usd: result.metadata.aiUsage.costUsd,
        }
        : null,
    })

    if (completeError) {
      throw new Error(`Failed to complete job: ${completeError.message}`)
    }

    jobLogger.info('Job marked as complete successfully')
  }
}
