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

type AnalysisJob = Tables<'analysis_jobs'>

interface AnalysisJobInput {
  projectId: string
  [key: string]: any
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
          // TODO: Implement invoice extraction job
          throw new Error('Invoice extraction not yet implemented')

        case 'regulatory_research':
          // TODO: Implement regulatory research job
          throw new Error('Regulatory research not yet implemented')

        case 'report_generation':
          // TODO: Implement report-only generation job
          throw new Error('Report generation not yet implemented')

        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      jobLogger.info('Job completed successfully')
    } catch (error) {
      jobLogger.error('Job processing failed', error as Error)

      // Mark job as failed with error details
      const errorMessage = (error as Error).message
      const errorCode =
        (error as any).code ||
        (errorMessage.includes('not found') ? 'NOT_FOUND' : 'PROCESSING_ERROR')

      jobLogger.info('Marking job as failed', { errorCode, errorMessage })

      try {
        const { error: failError } = await this.supabase.rpc('fail_analysis_job', {
          job_id: jobId,
          error_msg: errorMessage,
          error_cd: errorCode,
        })

        if (failError) {
          if (failError.message && (failError.message.includes('function') || failError.code === '42883')) {
            throw new Error('RPC_MISSING')
          }
          jobLogger.error('Failed to mark job as failed', failError as Error)
        }
      } catch (err) {
        if ((err as Error).message === 'RPC_MISSING') {
          await this.supabase
            .from('analysis_jobs')
            .update({
              status: 'failed',
              error_message: errorMessage,
              completed_at: new Date().toISOString()
            })
            .eq('id', jobId)
        }
      }

      throw error
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
}
