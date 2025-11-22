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
import { executeSkillWithProgress } from '@/lib/skills/executor'
import type { SkillResult } from '@/lib/skills/types'
import { JobRetryManager } from './job-retry-manager'
import { JobAlertManager } from '@/lib/alerts/job-alerts'

type AnalysisJob = Tables<'analysis_jobs'>

interface AnalysisJobInput {
  projectId: string
  [key: string]: any
}

export class JobProcessor {
  private supabase: ReturnType<typeof createClient<Database>>
  private retryManager: JobRetryManager
  private alertManager: JobAlertManager
  private workerId: string

  constructor(supabaseUrl: string, supabaseServiceKey: string, workerId?: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    this.retryManager = new JobRetryManager(supabaseUrl, supabaseServiceKey)
    this.alertManager = new JobAlertManager(supabaseUrl, supabaseServiceKey)
    this.workerId = workerId || `worker-${process.pid}-${Date.now()}`
  }

  /**
   * Get next job from priority queue
   *
   * Uses database function to atomically claim highest priority pending job.
   * Returns null if no jobs available.
   */
  async getNextJob(): Promise<string | null> {
    try {
      const { data: jobId, error } = await this.supabase.rpc('get_next_job', {
        worker_identifier: this.workerId,
      })

      if (error) {
        logger.error('Failed to get next job from queue', error as Error)
        return null
      }

      return jobId || null
    } catch (error) {
      logger.error('Failed to get next job', error as Error)
      return null
    }
  }

  /**
   * Process a single job by ID
   *
   * Fetches job details, routes to appropriate handler, and manages status updates
   */
  async processJob(jobId: string): Promise<void> {
    const jobLogger = logger.child({ jobId })

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

      // Accept jobs in 'pending' or 'processing' status
      // (RPC claim function may have already set to 'processing')
      if (job.status !== 'pending' && job.status !== 'processing') {
        jobLogger.warn('Job is not in processable state, skipping', { status: job.status })
        return
      }

      // Mark job as processing (skip if already processing from RPC claim)
      if (job.status === 'pending') {
        jobLogger.info('Marking job as processing')
        try {
          const { error: startError } = await this.supabase.rpc('start_analysis_job', {
            job_id: jobId,
          })

          if (startError) {
            if (startError.message && (startError.message.includes('function') || startError.code === '42883')) {
              throw new Error('RPC_MISSING')
            }
            throw new Error(`Failed to start job: ${startError.message}`)
          }
        } catch (err) {
          if ((err as Error).message === 'RPC_MISSING') {
            jobLogger.warn('RPC function not found, falling back to manual update')
            const { error: updateError } = await this.supabase
              .from('analysis_jobs')
              .update({
                status: 'processing',
              })
              .eq('id', jobId)

            if (updateError) throw new Error(`Failed to start job (fallback): ${updateError.message}`)
          } else {
            throw err
          }
        }
      } else {
        jobLogger.info('Job already processing, skipping status update')
      }

      // Route to appropriate handler based on job type
      jobLogger.info('Routing to job handler', { jobType: job.job_type })

      switch (job.job_type) {
        case 'complete_analysis':
          await this.processCompleteAnalysis(job)
          break

        case 'invoice_extraction':
          await this.processInvoiceExtraction(job)
          break

        case 'regulatory_research':
          await this.processRegulatoryResearch(job)
          break

        case 'report_generation':
          await this.processReportGeneration(job)
          break

        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      jobLogger.info('Job completed successfully')
    } catch (error) {
      jobLogger.error('Job processing failed', error as Error)

      // Handle job failure with retry logic
      await this.handleJobFailure(jobId, error as Error)

      throw error
    }
  }

  /**
   * Handle job failure with retry logic and alerting
   */
  private async handleJobFailure(jobId: string, error: Error): Promise<void> {
    const failureLogger = logger.child({ jobId })

    try {
      // Fetch current job state
      const { data: job, error: fetchError } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (fetchError || !job) {
        failureLogger.error('Failed to fetch job for failure handling', fetchError as Error)
        return
      }

      // Check if job should be retried
      const shouldRetry = await this.retryManager.shouldRetry(job, error)

      if (shouldRetry) {
        failureLogger.info('Scheduling job retry', {
          currentRetry: job.retry_count,
          maxRetries: job.max_retries,
        })

        // Schedule retry with exponential backoff
        await this.retryManager.scheduleRetry(job, error)
      } else {
        failureLogger.warn('Job permanently failed - no more retries', {
          currentRetry: job.retry_count,
          maxRetries: job.max_retries,
        })

        // Mark as permanently failed
        await this.retryManager.markPermanentlyFailed(job, error)

        // Send failure alert
        await this.alertManager.sendJobFailedAlert(job, error)
      }
    } catch (handlerError) {
      failureLogger.error('Error in failure handler', handlerError as Error)

      // Fallback: use old RPC method
      const errorMessage = error.message
      const errorCode =
        (error as any).code ||
        (errorMessage.includes('not found') ? 'NOT_FOUND' : 'PROCESSING_ERROR')

      try {
        await this.supabase.rpc('fail_analysis_job', {
          job_id: jobId,
          error_msg: errorMessage,
          error_cd: errorCode,
        })
      } catch (rpcError) {
        // Final fallback: direct update
        await this.supabase
          .from('analysis_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            error_code: errorCode,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId)
      }
    }
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

        try {
          const { error: progressError } = await this.supabase.rpc('update_job_progress', {
            job_id: job.id,
            new_progress: percent,
            step_name: step,
          })

          if (progressError) {
            if (progressError.message && (progressError.message.includes('function') || progressError.code === '42883')) {
              throw new Error('RPC_MISSING')
            }
            jobLogger.warn('Failed to update job progress', undefined, {
              error: progressError.message,
            })
          }
        } catch (err) {
          if ((err as Error).message === 'RPC_MISSING') {
            await this.supabase
              .from('analysis_jobs')
              .update({
                progress_percent: percent,
                current_step: step
              })
              .eq('id', job.id)
          }
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

    try {
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
        if (completeError.message && (completeError.message.includes('function') || completeError.code === '42883')) {
          throw new Error('RPC_MISSING')
        }
        throw new Error(`Failed to complete job: ${completeError.message}`)
      }
    } catch (err) {
      if ((err as Error).message === 'RPC_MISSING') {
        jobLogger.warn('RPC function not found, falling back to manual completion')
        const { error: updateError } = await this.supabase
          .from('analysis_jobs')
          .update({
            status: 'completed',
            result_data: result.data as any,
            completed_at: new Date().toISOString(),
            progress_percent: 100,
            current_step: 'Completed'
          })
          .eq('id', job.id)

        if (updateError) throw new Error(`Failed to complete job (fallback): ${updateError.message}`)
      } else {
        throw err
      }
    }

    jobLogger.info('Job marked as complete successfully')
  }

  /**
   * Process invoice extraction job
   *
   * Extracts invoice and haul log data from uploaded files using Claude Vision API.
   */
  private async processInvoiceExtraction(job: AnalysisJob): Promise<void> {
    const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

    jobLogger.info('Starting invoice extraction processing')

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

        try {
          const { error: progressError } = await this.supabase.rpc('update_job_progress', {
            job_id: job.id,
            new_progress: percent,
            step_name: step,
          })

          if (progressError) {
            if (progressError.message && (progressError.message.includes('function') || progressError.code === '42883')) {
              throw new Error('RPC_MISSING')
            }
            jobLogger.warn('Failed to update job progress', undefined, {
              error: progressError.message,
            })
          }
        } catch (err) {
          if ((err as Error).message === 'RPC_MISSING') {
            await this.supabase
              .from('analysis_jobs')
              .update({
                progress_percent: percent,
                current_step: step
              })
              .eq('id', job.id)
          }
        }
      },
      job.user_id // Pass user_id from job record for worker context
    )

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Invoice extraction failed without error message'
      throw new Error(errorMessage)
    }

    jobLogger.info('Invoice extraction completed successfully', {
      executionTime: result.metadata.durationMs,
      invoicesExtracted: result.data.summary?.invoicesExtracted || 0,
      haulLogsExtracted: result.data.summary?.haulLogsExtracted || 0,
    })

    // Mark job as complete with result data
    jobLogger.info('Marking job as complete')

    try {
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
        if (completeError.message && (completeError.message.includes('function') || completeError.code === '42883')) {
          throw new Error('RPC_MISSING')
        }
        throw new Error(`Failed to complete job: ${completeError.message}`)
      }
    } catch (err) {
      if ((err as Error).message === 'RPC_MISSING') {
        jobLogger.warn('RPC function not found, falling back to manual completion')
        const { error: updateError } = await this.supabase
          .from('analysis_jobs')
          .update({
            status: 'completed',
            result_data: result.data as any,
            completed_at: new Date().toISOString(),
            progress_percent: 100,
            current_step: 'Completed'
          })
          .eq('id', job.id)

        if (updateError) throw new Error(`Failed to complete job (fallback): ${updateError.message}`)
      } else {
        throw err
      }
    }

    jobLogger.info('Job marked as complete successfully')
  }

  /**
   * Process regulatory research job
   *
   * Researches municipal ordinances and compliance requirements for property location.
   */
  private async processRegulatoryResearch(job: AnalysisJob): Promise<void> {
    const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

    jobLogger.info('Starting regulatory research processing')

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

        try {
          const { error: progressError } = await this.supabase.rpc('update_job_progress', {
            job_id: job.id,
            new_progress: percent,
            step_name: step,
          })

          if (progressError) {
            if (progressError.message && (progressError.message.includes('function') || progressError.code === '42883')) {
              throw new Error('RPC_MISSING')
            }
            jobLogger.warn('Failed to update job progress', undefined, {
              error: progressError.message,
            })
          }
        } catch (err) {
          if ((err as Error).message === 'RPC_MISSING') {
            await this.supabase
              .from('analysis_jobs')
              .update({
                progress_percent: percent,
                current_step: step
              })
              .eq('id', job.id)
          }
        }
      },
      job.user_id // Pass user_id from job record for worker context
    )

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Regulatory research failed without error message'
      throw new Error(errorMessage)
    }

    jobLogger.info('Regulatory research completed successfully', {
      executionTime: result.metadata.durationMs,
      ordinancesFound: result.data.ordinances?.length || 0,
    })

    // Mark job as complete with result data
    jobLogger.info('Marking job as complete')

    try {
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
        if (completeError.message && (completeError.message.includes('function') || completeError.code === '42883')) {
          throw new Error('RPC_MISSING')
        }
        throw new Error(`Failed to complete job: ${completeError.message}`)
      }
    } catch (err) {
      if ((err as Error).message === 'RPC_MISSING') {
        jobLogger.warn('RPC function not found, falling back to manual completion')
        const { error: updateError } = await this.supabase
          .from('analysis_jobs')
          .update({
            status: 'completed',
            result_data: result.data as any,
            completed_at: new Date().toISOString(),
            progress_percent: 100,
            current_step: 'Completed'
          })
          .eq('id', job.id)

        if (updateError) throw new Error(`Failed to complete job (fallback): ${updateError.message}`)
      } else {
        throw err
      }
    }

    jobLogger.info('Job marked as complete successfully')
  }

  /**
   * Process report generation job
   *
   * Generates Excel and HTML reports from existing analysis data.
   */
  private async processReportGeneration(job: AnalysisJob): Promise<void> {
    const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

    jobLogger.info('Starting report generation processing')

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

        try {
          const { error: progressError } = await this.supabase.rpc('update_job_progress', {
            job_id: job.id,
            new_progress: percent,
            step_name: step,
          })

          if (progressError) {
            if (progressError.message && (progressError.message.includes('function') || progressError.code === '42883')) {
              throw new Error('RPC_MISSING')
            }
            jobLogger.warn('Failed to update job progress', undefined, {
              error: progressError.message,
            })
          }
        } catch (err) {
          if ((err as Error).message === 'RPC_MISSING') {
            await this.supabase
              .from('analysis_jobs')
              .update({
                progress_percent: percent,
                current_step: step
              })
              .eq('id', job.id)
          }
        }
      },
      job.user_id // Pass user_id from job record for worker context
    )

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Report generation failed without error message'
      throw new Error(errorMessage)
    }

    jobLogger.info('Report generation completed successfully', {
      executionTime: result.metadata.durationMs,
    })

    // Mark job as complete with result data
    jobLogger.info('Marking job as complete')

    try {
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
        if (completeError.message && (completeError.message.includes('function') || completeError.code === '42883')) {
          throw new Error('RPC_MISSING')
        }
        throw new Error(`Failed to complete job: ${completeError.message}`)
      }
    } catch (err) {
      if ((err as Error).message === 'RPC_MISSING') {
        jobLogger.warn('RPC function not found, falling back to manual completion')
        const { error: updateError } = await this.supabase
          .from('analysis_jobs')
          .update({
            status: 'completed',
            result_data: result.data as any,
            completed_at: new Date().toISOString(),
            progress_percent: 100,
            current_step: 'Completed'
          })
          .eq('id', job.id)

        if (updateError) throw new Error(`Failed to complete job (fallback): ${updateError.message}`)
      } else {
        throw err
      }
    }

    jobLogger.info('Job marked as complete successfully')
  }
}
