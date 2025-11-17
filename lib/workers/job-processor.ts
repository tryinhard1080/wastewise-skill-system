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
import { WasteWiseAnalyticsSkill } from '@/lib/skills/skills/wastewise-analytics'
import type { SkillContext } from '@/lib/skills/types'
import {
  TONS_TO_YARDS,
  WEEKS_PER_MONTH,
  COMPACTOR_TARGET_TONS,
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  CONTAMINATION_THRESHOLD_PCT,
  BULK_SUBSCRIPTION_THRESHOLD,
  LEASEUP_VARIANCE_THRESHOLD,
} from '@/lib/constants/formulas'

type AnalysisJob = Tables<'analysis_jobs'>

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
   * Fetches all required data, builds SkillContext, executes WasteWiseAnalyticsSkill,
   * and saves results to database
   */
  private async processCompleteAnalysis(job: AnalysisJob): Promise<void> {
    const jobLogger = logger.child({ jobId: job.id, projectId: job.project_id })

    jobLogger.info('Starting complete analysis processing')

    // Extract project ID from input data
    const inputData = job.input_data as any
    const projectId = inputData?.projectId || job.project_id

    if (!projectId) {
      throw new Error('Missing projectId in job input data')
    }

    // Fetch project data
    jobLogger.info('Fetching project data')
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    jobLogger.info('Project fetched successfully', {
      propertyName: project.property_name,
      equipmentType: project.equipment_type,
      units: project.units,
    })

    // Fetch related data in parallel
    jobLogger.info('Fetching related data (invoices, haul logs, contract terms)')

    const [invoicesResult, haulLogResult, contractResult, skillConfigResult] = await Promise.all([
      // Fetch invoices (REQUIRED)
      this.supabase
        .from('invoice_data')
        .select('*')
        .eq('project_id', projectId)
        .order('invoice_date', { ascending: true }),

      // Fetch haul log (optional - only for compactors)
      this.supabase
        .from('haul_log')
        .select('*')
        .eq('project_id', projectId)
        .order('haul_date', { ascending: true }),

      // Fetch contract terms (optional)
      this.supabase.from('contract_terms').select('*').eq('project_id', projectId).maybeSingle(),

      // Fetch skill configuration
      this.supabase
        .from('skills_config')
        .select('*')
        .eq('skill_name', 'wastewise-analytics')
        .eq('enabled', true)
        .single(),
    ])

    // Check for invoice data errors
    if (invoicesResult.error) {
      throw new Error(`Failed to fetch invoices: ${invoicesResult.error.message}`)
    }

    if (!invoicesResult.data || invoicesResult.data.length === 0) {
      throw new Error('No invoice data found for project')
    }

    jobLogger.info('Related data fetched successfully', {
      invoiceCount: invoicesResult.data.length,
      haulLogCount: haulLogResult.data?.length || 0,
      hasContractTerms: !!contractResult.data,
    })

    // Build skill configuration from database or use defaults
    const skillConfig = skillConfigResult.data
      ? {
          conversionRates: skillConfigResult.data.conversion_rates as any,
          thresholds: skillConfigResult.data.thresholds as any,
        }
      : {
          // Default configuration (fallback if database config not found)
          conversionRates: {
            compactorYpd: TONS_TO_YARDS,
            dumpsterYpd: WEEKS_PER_MONTH,
            targetCapacity: COMPACTOR_TARGET_TONS,
          },
          thresholds: {
            compactorTons: COMPACTOR_OPTIMIZATION_THRESHOLD,
            contaminationPct: CONTAMINATION_THRESHOLD_PCT,
            bulkMonthly: BULK_SUBSCRIPTION_THRESHOLD,
            leaseupVariance: LEASEUP_VARIANCE_THRESHOLD,
          },
        }

    // Build skill context
    const context: SkillContext = {
      projectId,
      userId: job.user_id,
      project,
      invoices: invoicesResult.data,
      haulLog: haulLogResult.data && haulLogResult.data.length > 0 ? haulLogResult.data : undefined,
      config: skillConfig,
      onProgress: async (progress) => {
        // Update job progress in database
        jobLogger.debug('Updating job progress', {
          percent: progress.percent,
          step: progress.step,
        })

        const { error: progressError } = await this.supabase.rpc('update_job_progress', {
          job_id: job.id,
          new_progress: progress.percent,
          step_name: progress.step,
          step_num: progress.stepNumber || undefined,
        })

        if (progressError) {
          jobLogger.warn('Failed to update job progress', undefined, {
            error: progressError.message,
          })
        }
      },
    }

    jobLogger.info('Executing WasteWiseAnalyticsSkill')

    // Execute analytics skill
    const skill = new WasteWiseAnalyticsSkill()
    const result = await skill.execute(context)

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Analysis failed without error message'
      throw new Error(errorMessage)
    }

    jobLogger.info('Skill execution completed successfully', {
      totalSavings: result.data.summary.totalSavingsPotential,
      recommendationsCount: result.data.recommendations.length,
      executionTime: result.metadata.durationMs,
    })

    // Mark job as complete with result data
    jobLogger.info('Marking job as complete')

    const { error: completeError } = await this.supabase.rpc('complete_analysis_job', {
      job_id: job.id,
      result: result.data as any,
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
