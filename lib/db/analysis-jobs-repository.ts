/**
 * Analysis Jobs Repository
 *
 * Handles database operations for analysis_jobs table.
 * Manages background job processing with atomic claiming and status tracking.
 *
 * Features:
 * - Atomic job claiming for worker processes
 * - Progress tracking with step management
 * - AI usage metrics tracking
 * - Retry logic support
 * - Database functions for concurrency control
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type AnalysisJobRow = Database['public']['Tables']['analysis_jobs']['Row']
type AnalysisJobInsert = Database['public']['Tables']['analysis_jobs']['Insert']
type AnalysisJobUpdate = Database['public']['Tables']['analysis_jobs']['Update']

export type JobStatus = 'pending' | 'claimed' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type JobType = 'full_analysis' | 'invoice_extraction' | 'contract_extraction' | 'regulatory_research'

export interface AIUsage {
  requests: number
  tokens_input: number
  tokens_output: number
  cost_usd: number
}

export interface AnalysisJobRecord {
  id?: string
  project_id: string
  user_id: string
  job_type: JobType
  status?: JobStatus
  input_data?: any
  result_data?: any
  progress_percent?: number
  current_step?: string
  steps_completed?: number
  total_steps?: number
  estimated_completion?: string
  error_code?: string
  error_message?: string
  error_details?: any
  retry_count?: number
  max_retries?: number
  ai_requests?: number
  ai_tokens_input?: number
  ai_tokens_output?: number
  ai_cost_usd?: number
  duration_seconds?: number
}

export class AnalysisJobsRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Create a new analysis job
   */
  async create(
    job: AnalysisJobRecord
  ): Promise<{ data: AnalysisJobRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_jobs')
        .insert(this.toInsert(job))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create analysis job', new Error(error.message), {
          project_id: job.project_id,
          job_type: job.job_type,
        })
        return { data: null, error: error.message }
      }

      logger.info('Analysis job created', {
        id: data.id,
        project_id: job.project_id,
        job_type: job.job_type,
        status: data.status,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Analysis job creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get job by ID
   */
  async getById(id: string): Promise<{ data: AnalysisJobRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch analysis job', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Analysis job fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get all jobs for a project
   */
  async getByProjectId(projectId: string): Promise<{ data: AnalysisJobRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch project jobs', new Error(error.message), {
          project_id: projectId,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project jobs fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get latest job for a project
   */
  async getLatestByProjectId(
    projectId: string
  ): Promise<{ data: AnalysisJobRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch latest job', new Error(error.message), {
          project_id: projectId,
        })
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Latest job fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Claim next pending job atomically (for worker processes)
   * Uses database function for concurrency control
   */
  async claimNextJob(): Promise<{ data: AnalysisJobRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.rpc('claim_next_analysis_job')

      if (error) {
        logger.error('Failed to claim next job', new Error(error.message))
        return { data: null, error: error.message }
      }

      if (!data) {
        logger.debug('No pending jobs available to claim')
        return { data: null, error: null }
      }

      logger.info('Job claimed', {
        id: data.id,
        project_id: data.project_id,
        job_type: data.job_type,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job claim exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Start a job (mark as processing)
   * Uses database function
   */
  async startJob(jobId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.rpc('start_analysis_job', {
        job_id: jobId,
      })

      if (error) {
        logger.error('Failed to start job', new Error(error.message), { job_id: jobId })
        return { success: false, error: error.message }
      }

      logger.info('Job started', { job_id: jobId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job start exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Update job progress
   * Uses database function
   */
  async updateProgress(
    jobId: string,
    progress: number,
    stepName?: string,
    stepNum?: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.rpc('update_job_progress', {
        job_id: jobId,
        new_progress: progress,
        step_name: stepName,
        step_num: stepNum,
      })

      if (error) {
        logger.error('Failed to update job progress', new Error(error.message), {
          job_id: jobId,
          progress,
        })
        return { success: false, error: error.message }
      }

      logger.debug('Job progress updated', { job_id: jobId, progress })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job progress update exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Complete a job with results
   * Uses database function
   */
  async completeJob(
    jobId: string,
    result: any,
    aiUsage?: AIUsage
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.rpc('complete_analysis_job', {
        job_id: jobId,
        result: result,
        ai_usage: aiUsage || null,
      })

      if (error) {
        logger.error('Failed to complete job', new Error(error.message), { job_id: jobId })
        return { success: false, error: error.message }
      }

      logger.info('Job completed', { job_id: jobId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job completion exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Fail a job with error details
   * Uses database function
   */
  async failJob(
    jobId: string,
    errorMessage: string,
    errorCode?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.rpc('fail_analysis_job', {
        job_id: jobId,
        error_msg: errorMessage,
        error_cd: errorCode || null,
      })

      if (error) {
        logger.error('Failed to mark job as failed', new Error(error.message), { job_id: jobId })
        return { success: false, error: error.message }
      }

      logger.info('Job marked as failed', { job_id: jobId, error_message: errorMessage })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job fail exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('analysis_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)

      if (error) {
        logger.error('Failed to cancel job', new Error(error.message), { job_id: jobId })
        return { success: false, error: error.message }
      }

      logger.info('Job cancelled', { job_id: jobId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job cancel exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Get jobs by status
   */
  async getByStatus(status: JobStatus): Promise<{ data: AnalysisJobRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('Failed to fetch jobs by status', new Error(error.message), { status })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Jobs by status fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Clean up old completed/failed jobs
   * Uses database function
   */
  async cleanupOldJobs(daysToKeep: number = 30): Promise<{ count: number; error: string | null }> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_old_analysis_jobs', {
        days_to_keep: daysToKeep,
      })

      if (error) {
        logger.error('Failed to cleanup old jobs', new Error(error.message), { days_to_keep: daysToKeep })
        return { count: 0, error: error.message }
      }

      logger.info('Old jobs cleaned up', { count: data, days_to_keep: daysToKeep })
      return { count: data || 0, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job cleanup exception', error as Error)
      return { count: 0, error: message }
    }
  }

  /**
   * Convert AnalysisJobRecord to database insert format
   */
  private toInsert(job: AnalysisJobRecord): AnalysisJobInsert {
    return {
      project_id: job.project_id,
      user_id: job.user_id,
      job_type: job.job_type,
      status: job.status,
      input_data: job.input_data,
      result_data: job.result_data,
      progress_percent: job.progress_percent,
      current_step: job.current_step,
      steps_completed: job.steps_completed,
      total_steps: job.total_steps,
      estimated_completion: job.estimated_completion,
      error_code: job.error_code,
      error_message: job.error_message,
      error_details: job.error_details,
      retry_count: job.retry_count,
      max_retries: job.max_retries,
      ai_requests: job.ai_requests,
      ai_tokens_input: job.ai_tokens_input,
      ai_tokens_output: job.ai_tokens_output,
      ai_cost_usd: job.ai_cost_usd,
      duration_seconds: job.duration_seconds,
    }
  }
}
