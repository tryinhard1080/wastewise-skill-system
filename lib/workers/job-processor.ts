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
import type { SupabaseClient } from '@supabase/supabase-js'
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
  private supabase: SupabaseClient<Database>

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

      // Skip if job is not in pending status
      if (job.status !== 'pending') {
        jobLogger.warn('Job is not pending, skipping', { status: job.status })
        return
      }

      // Mark job as processing
      jobLogger.info('Marking job as processing')
      const { error: startError } = await this.supabase.rpc('start_analysis_job', {
        job_id: jobId,
      })

      if (startError) {
        throw new Error(`Failed to start job: ${startError.message}`)
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

      const { error: failError } = await this.supabase.rpc('fail_analysis_job', {
        job_id: jobId,
        error_msg: errorMessage,
        error_cd: errorCode,
      })

      if (failError) {
        jobLogger.error('Failed to mark job as failed', failError as Error)
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
      job.user_id, // Pass user_id from job record for worker context
      this.supabase
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
