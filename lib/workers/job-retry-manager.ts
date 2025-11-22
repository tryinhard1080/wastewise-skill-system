/**
 * Job Retry Manager
 *
 * Implements exponential backoff retry logic for failed analysis jobs.
 * Classifies errors as retryable vs permanent and schedules retries accordingly.
 *
 * Retry Strategy:
 * - Attempt 1: Immediate (job already failed)
 * - Attempt 2: 1 minute delay
 * - Attempt 3: 5 minutes delay
 * - Attempt 4: 15 minutes delay
 * - After 4 attempts: Permanently failed
 *
 * Phase 7: Production readiness - enterprise job management
 */

import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database.types'
import { logger } from '@/lib/observability/logger'

type AnalysisJob = Tables<'analysis_jobs'>

/**
 * Error classification for retry decisions
 */
export enum ErrorCategory {
  RETRYABLE = 'retryable', // Network, timeout, rate limit - retry
  PERMANENT = 'permanent', // Invalid input, permissions - don't retry
  UNKNOWN = 'unknown', // Unclassified - retry with caution
}

interface RetryableError {
  category: ErrorCategory
  shouldRetry: boolean
  reason: string
}

/**
 * Retry delay configuration (in milliseconds)
 */
const RETRY_DELAYS = {
  1: 60 * 1000, // 1 minute
  2: 5 * 60 * 1000, // 5 minutes
  3: 15 * 60 * 1000, // 15 minutes
  4: 30 * 60 * 1000, // 30 minutes (max backoff)
} as const

/**
 * Error patterns for classification
 */
const RETRYABLE_ERROR_PATTERNS = [
  /timeout/i,
  /network/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /rate.*limit/i,
  /429/i, // HTTP 429 Too Many Requests
  /502/i, // HTTP 502 Bad Gateway
  /503/i, // HTTP 503 Service Unavailable
  /504/i, // HTTP 504 Gateway Timeout
  /temporary/i,
  /unavailable/i,
]

const PERMANENT_ERROR_PATTERNS = [
  /invalid.*input/i,
  /validation.*failed/i,
  /unauthorized/i,
  /forbidden/i,
  /not.*found/i,
  /permission.*denied/i,
  /401/i, // HTTP 401 Unauthorized
  /403/i, // HTTP 403 Forbidden
  /404/i, // HTTP 404 Not Found
  /missing.*required/i,
  /schema.*mismatch/i,
]

export class JobRetryManager {
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
   * Classify error to determine if it should be retried
   */
  classifyError(error: Error | string): RetryableError {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorCode = typeof error === 'object' ? (error as any).code : undefined

    // Check permanent error patterns first
    for (const pattern of PERMANENT_ERROR_PATTERNS) {
      if (pattern.test(errorMessage)) {
        return {
          category: ErrorCategory.PERMANENT,
          shouldRetry: false,
          reason: `Permanent error detected: ${errorMessage}`,
        }
      }
    }

    // Check retryable error patterns
    for (const pattern of RETRYABLE_ERROR_PATTERNS) {
      if (pattern.test(errorMessage)) {
        return {
          category: ErrorCategory.RETRYABLE,
          shouldRetry: true,
          reason: `Retryable error detected: ${errorMessage}`,
        }
      }
    }

    // Check specific error codes
    if (errorCode) {
      const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'RATE_LIMIT']
      if (retryableCodes.includes(errorCode)) {
        return {
          category: ErrorCategory.RETRYABLE,
          shouldRetry: true,
          reason: `Retryable error code: ${errorCode}`,
        }
      }
    }

    // Default: treat as unknown and retry (with caution)
    return {
      category: ErrorCategory.UNKNOWN,
      shouldRetry: true,
      reason: `Unknown error type: ${errorMessage}`,
    }
  }

  /**
   * Calculate retry delay based on attempt number
   */
  getRetryDelay(attemptNumber: number): number {
    if (attemptNumber in RETRY_DELAYS) {
      return RETRY_DELAYS[attemptNumber as keyof typeof RETRY_DELAYS]
    }
    return RETRY_DELAYS[4] // Max backoff for attempts beyond 4
  }

  /**
   * Check if job should be retried
   *
   * Considers:
   * - Error classification (retryable vs permanent)
   * - Current retry count vs max retries
   * - Job configuration
   */
  async shouldRetry(job: AnalysisJob, error: Error | string): Promise<boolean> {
    const retryLogger = logger.child({
      jobId: job.id,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
    })

    // Check if max retries reached
    if (job.retry_count >= job.max_retries) {
      retryLogger.warn('Max retries reached, will not retry')
      return false
    }

    // Classify error
    const classification = this.classifyError(error)
    retryLogger.info('Error classified', {
      category: classification.category,
      shouldRetry: classification.shouldRetry,
      reason: classification.reason,
    })

    return classification.shouldRetry
  }

  /**
   * Schedule job retry with exponential backoff
   *
   * Updates job record with:
   * - Status back to 'pending'
   * - Incremented retry count
   * - Calculated retry_after timestamp
   * - Error logged in retry_error_log
   */
  async scheduleRetry(job: AnalysisJob, error: Error | string): Promise<void> {
    const retryLogger = logger.child({
      jobId: job.id,
      currentRetry: job.retry_count,
      nextRetry: job.retry_count + 1,
    })

    const errorMessage = typeof error === 'string' ? error : error.message
    const errorCode =
      typeof error === 'object' ? (error as any).code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR'

    retryLogger.info('Scheduling job retry', {
      errorMessage,
      errorCode,
    })

    // Call database function to schedule retry
    const { error: scheduleError } = await this.supabase.rpc('schedule_job_retry', {
      job_id: job.id,
      error_msg: errorMessage,
      error_cd: errorCode,
    })

    if (scheduleError) {
      retryLogger.error('Failed to schedule retry', scheduleError as Error)
      throw new Error(`Failed to schedule retry: ${scheduleError.message}`)
    }

    const nextAttempt = job.retry_count + 1
    const delay = this.getRetryDelay(nextAttempt)

    retryLogger.info('Retry scheduled successfully', {
      nextAttempt,
      delayMs: delay,
      retryAfter: new Date(Date.now() + delay).toISOString(),
    })
  }

  /**
   * Mark job as permanently failed (no more retries)
   */
  async markPermanentlyFailed(job: AnalysisJob, error: Error | string): Promise<void> {
    const failLogger = logger.child({ jobId: job.id })

    const errorMessage = typeof error === 'string' ? error : error.message
    const errorCode =
      typeof error === 'object' ? (error as any).code || 'PERMANENT_FAILURE' : 'PERMANENT_FAILURE'

    failLogger.info('Marking job as permanently failed', {
      errorMessage,
      errorCode,
      totalAttempts: job.retry_count + 1,
    })

    // Update job status directly to 'failed'
    const { error: updateError } = await this.supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        error_code: errorCode,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    if (updateError) {
      failLogger.error('Failed to mark job as permanently failed', updateError as Error)
      throw new Error(`Failed to mark job as failed: ${updateError.message}`)
    }

    failLogger.warn('Job permanently failed', {
      totalAttempts: job.retry_count + 1,
      errorHistory: job.retry_error_log,
    })
  }

  /**
   * Get retry statistics for a job
   */
  getRetryStatistics(job: AnalysisJob): {
    attemptsRemaining: number
    totalAttempts: number
    errorHistory: any[]
    nextRetryTime: Date | null
  } {
    const attemptsRemaining = Math.max(0, job.max_retries - job.retry_count)
    const errorHistory = Array.isArray(job.retry_error_log) ? job.retry_error_log : []
    const nextRetryTime = job.retry_after ? new Date(job.retry_after) : null

    return {
      attemptsRemaining,
      totalAttempts: job.retry_count,
      errorHistory,
      nextRetryTime,
    }
  }

  /**
   * Check if job is ready for retry (retry_after has passed)
   */
  isReadyForRetry(job: AnalysisJob): boolean {
    if (!job.retry_after) return true

    const retryTime = new Date(job.retry_after)
    return retryTime <= new Date()
  }
}
