/**
 * Skill System Type Definitions
 *
 * Defines the core interfaces and types for the WasteWise skills system.
 * All skills must conform to these interfaces to ensure consistency.
 */

import { Database } from '@/types/database.types'

// Database type aliases
export type SkillConfigRow = Database['public']['Tables']['skills_config']['Row']
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type InvoiceDataRow = Database['public']['Tables']['invoice_data']['Row']
export type HaulLogRow = Database['public']['Tables']['haul_log']['Row']

/**
 * Skill execution result
 *
 * All skills must return this shape to maintain consistency across
 * the skill system.
 */
export interface SkillResult<TData = any> {
  /** Indicates if skill execution was successful */
  success: boolean

  /** Skill-specific result data */
  data: TData | null

  /** Error information if execution failed */
  error?: {
    message: string
    code: string
    details?: any
  }

  /** Execution metadata */
  metadata: {
    /** Skill name that produced this result */
    skillName: string

    /** Skill version */
    skillVersion: string

    /** Execution duration in milliseconds */
    durationMs: number

    /** Timestamp when execution started */
    executedAt: string

    /** AI API usage for this execution */
    aiUsage?: {
      requests: number
      tokensInput: number
      tokensOutput: number
      costUsd: number
    }
  }
}

/**
 * Skill execution context
 *
 * Provides all necessary context for a skill to execute, including
 * project data, configuration, and progress callbacks.
 */
export interface SkillContext {
  /** Project ID being analyzed */
  projectId: string

  /** User ID executing the skill */
  userId: string

  /** Project data from database */
  project: ProjectRow

  /** Invoice data for the project */
  invoices: InvoiceDataRow[]

  /** Haul log data (for compactor projects) */
  haulLog?: HaulLogRow[]

  /** Skill configuration from skills_config table */
  config: SkillConfig

  /** Optional progress callback for long-running operations */
  onProgress?: (progress: SkillProgress) => Promise<void>

  /** Optional cancellation signal */
  signal?: AbortSignal
}

/**
 * Progress update during skill execution
 */
export interface SkillProgress {
  /** Progress percentage (0-100) */
  percent: number

  /** Human-readable description of current step */
  step: string

  /** Optional step number (if known) */
  stepNumber?: number

  /** Optional total steps (if known) */
  totalSteps?: number
}

/**
 * Skill configuration
 *
 * Configuration values specific to each skill, loaded from the
 * skills_config table and validated against formulas.ts constants.
 */
export interface SkillConfig {
  /** Conversion rates (must match formulas.ts) */
  conversionRates: {
    /** Compactor YPD conversion: 14.49 */
    compactorYpd: number

    /** Dumpster YPD conversion: 4.33 */
    dumpsterYpd: number

    /** Target compactor capacity: 8.5 tons */
    targetCapacity: number
  }

  /** Optimization thresholds (must match formulas.ts) */
  thresholds: {
    /** Compactor optimization threshold: 6.0 tons */
    compactorTons: number

    /** Contamination threshold: 3.0% */
    contaminationPct: number

    /** Bulk subscription threshold: $500 */
    bulkMonthly: number

    /** Lease-up variance threshold: -40% */
    leaseupVariance: number
  }
}

/**
 * Core Skill interface
 *
 * All skills MUST implement this interface. This ensures:
 * - Consistent execution pattern
 * - Proper error handling
 * - Progress tracking
 * - Metadata collection
 */
export interface Skill<TResult = any> {
  /** Unique skill identifier (matches skills_config.skill_name) */
  name: string

  /** Skill version (semantic versioning) */
  version: string

  /** Human-readable description */
  description: string

  /**
   * Execute the skill
   *
   * @param context - All data and config needed for execution
   * @returns Promise resolving to skill result
   *
   * @throws {SkillExecutionError} If execution fails
   */
  execute(context: SkillContext): Promise<SkillResult<TResult>>

  /**
   * Validate input before execution (optional)
   *
   * Allows skills to check prerequisites before starting long-running
   * operations. Should be fast (<100ms).
   *
   * @param context - Execution context to validate
   * @returns Validation result with error details if invalid
   */
  validate?(context: SkillContext): Promise<ValidationResult>
}

/**
 * Validation result from skill.validate()
 */
export interface ValidationResult {
  /** Is the context valid for execution? */
  valid: boolean

  /** Validation errors (if any) */
  errors?: Array<{
    field: string
    message: string
    code: string
  }>
}

/**
 * Skill registry entry
 */
export interface RegisteredSkill {
  /** Skill instance */
  skill: Skill

  /** Is this skill enabled? */
  enabled: boolean

  /** When was this skill last validated against formulas.ts? */
  lastValidated?: Date

  /** Skill configuration from database */
  config: SkillConfig
}

/**
 * Skill type enumeration
 *
 * Matches job_type in analysis_jobs table
 */
export enum SkillType {
  WASTEWISE_ANALYTICS = 'wastewise-analytics',
  COMPACTOR_OPTIMIZATION = 'compactor-optimization',
  CONTRACT_EXTRACTOR = 'contract-extractor',
  REGULATORY_RESEARCH = 'regulatory-research',
  BATCH_EXTRACTOR = 'batch-extractor',
}

/**
 * Request analyzer result
 *
 * Determines which skill should handle a given user request.
 */
export interface AnalysisRequest {
  /** User's original request/question */
  query: string

  /** Detected intent/skill type */
  skillType: SkillType

  /** Confidence score (0-1) */
  confidence: number

  /** Extracted parameters for skill execution */
  parameters?: Record<string, any>
}

/**
 * Skill-specific result types
 */

export interface CompactorOptimizationResult {
  recommend: boolean
  avgTonsPerHaul: number
  targetTonsPerHaul: number
  currentAnnualHauls: number
  optimizedAnnualHauls: number
  haulsEliminated: number
  grossAnnualSavings: number
  netYear1Savings: number
  netAnnualSavingsYear2Plus: number
  roiPercent: number
  paybackMonths: number
}

export interface WastewiseAnalyticsResult {
  metrics: {
    yardsPerDoor: number
    costPerDoor: number
    totalSpend: number
    dateRange: {
      start: string
      end: string
    }
  }
  optimizations: Array<{
    type: string
    recommend: boolean
    savings?: number
    details?: any
  }>
  leaseUp: boolean
  totalSavings: number
}

export interface ContractExtractorResult {
  vendor: {
    name: string
    contact?: string
    phone?: string
    email?: string
  }
  serviceType: string
  term: {
    startDate: string
    endDate: string
    lengthMonths: number
  }
  pricing: {
    baseRate: number
    frequency: string
    additionalFees: Array<{
      name: string
      amount: number
    }>
  }
  clauses: Array<{
    type: string
    text: string
    favorable: boolean
  }>
}

export interface RegulatoryResearchResult {
  city: string
  state: string
  ordinances: Array<{
    title: string
    requirement: string
    compliance: 'compliant' | 'non-compliant' | 'unknown'
    source: string
    url?: string
  }>
  recyclingRequired: boolean
  contaminationLimits?: {
    percentage: number
    penalties: string
  }
  reportingRequired: boolean
}

export interface BatchExtractorResult {
  filesProcessed: number
  filesSuccess: number
  filesFailed: number
  totalInvoices: number
  totalSpend: number
  dateRange: {
    start: string
    end: string
  }
  validationReport: {
    duplicates: number
    missingDates: number
    missingVendors: number
    warnings: string[]
  }
}
