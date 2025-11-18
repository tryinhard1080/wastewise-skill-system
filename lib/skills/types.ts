/**
 * Skill System Type Definitions
 *
 * Defines the core interfaces and types for the WasteWise skills system.
 * All skills must conform to these interfaces to ensure consistency.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
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

  /** Supabase client scoped to this execution */
  supabase: SupabaseClient<Database>

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
  // Summary
  summary: {
    contractsProcessed: number
    termsExtracted: number
    failedExtractions: number
  }

  // Extracted contract data
  contracts: ContractData[]

  // Processing details
  processingDetails: ProcessingDetail[]

  // AI usage
  aiUsage: {
    totalRequests: number
    totalTokensInput: number
    totalTokensOutput: number
    totalCostUsd: number
  }
}

export interface ContractData {
  // Source
  sourceFile: string
  extractionDate: string

  // Property & Vendor
  property: {
    name: string
    address: string
    units?: number
  }
  vendor: {
    name: string
    contact?: string
    phone?: string
    email?: string
  }

  // Contract Dates
  contractDates: {
    effectiveDate: string
    expirationDate: string
    termMonths: number
    autoRenew: boolean
  }

  // Services
  services: ContractService[]

  // Pricing
  pricing: {
    monthlyBase?: number
    perPickup?: number
    perTon?: number
    fuelSurcharge?: number
    otherFees?: { description: string; amount: number }[]
    escalationClause?: string
    cpiAdjustment: boolean
  }

  // Terms & Obligations
  terms: {
    terminationNoticeDays: number
    earlyTerminationPenalty?: string
    insuranceRequired: boolean
    paymentTerms: string
    latePenalty?: string
  }
}

export interface ContractService {
  containerType: 'COMPACTOR' | 'DUMPSTER' | 'OPEN_TOP' | 'OTHER'
  containerSize: number // cubic yards
  frequency: string // e.g., "2x/week", "monthly"
  serviceDays?: string // e.g., "Mon, Thu"
}

export interface BatchExtractorResult {
  // Summary
  summary: {
    totalFilesProcessed: number
    invoicesExtracted: number
    haulLogsExtracted: number
    failedFiles: number
  }

  // Extracted data
  invoices: InvoiceData[]
  haulLogs: HaulLogEntry[]

  // Processing details
  processingDetails: ProcessingDetail[]

  // AI usage
  aiUsage: {
    totalRequests: number
    totalTokensInput: number
    totalTokensOutput: number
    totalCostUsd: number
  }
}

export interface InvoiceData {
  // Source
  sourceFile: string
  extractionDate: string

  // Property
  propertyName: string
  propertyAddress: string
  units?: number

  // Service
  servicePeriodStart: string
  servicePeriodEnd: string
  invoiceNumber: string
  billingDate: string

  // Line items
  lineItems: InvoiceLineItem[]

  // Totals
  subtotal: number
  tax: number
  total: number

  // Vendor
  vendorName: string
  vendorContact?: string
}

export interface InvoiceLineItem {
  description: string
  containerType: 'COMPACTOR' | 'DUMPSTER' | 'OPEN_TOP' | 'OTHER'
  containerSize: number // cubic yards or tons
  quantity: number
  frequency: string // e.g., "2x/week", "1x/month"
  unitPrice: number
  totalPrice: number
}

export interface HaulLogEntry {
  // Source
  sourceFile: string

  // Service details
  date: string
  time?: string
  containerType: 'COMPACTOR' | 'DUMPSTER' | 'OPEN_TOP' | 'OTHER'
  containerSize: number
  weight?: number // tons
  volume?: number // cubic yards
  serviceType: 'PICKUP' | 'DELIVERY' | 'EXCHANGE' | 'OTHER'
  notes?: string
}

export interface ProcessingDetail {
  fileId: string
  fileName: string
  fileType: string
  status: 'success' | 'failed'
  extractedRecords: number
  error?: string
}

/**
 * WasteWise Analytics Complete Result
 *
 * Result from the main orchestrator that coordinates all sub-skills
 * to deliver a complete waste management analysis.
 */
export interface WasteWiseAnalyticsCompleteResult {
  /** Summary metrics across all analyses */
  summary: {
    /** Total potential savings identified */
    totalSavingsPotential: number
    /** Current monthly cost */
    currentMonthlyCost: number
    /** Optimized monthly cost (after recommendations) */
    optimizedMonthlyCost: number
    /** Savings percentage */
    savingsPercentage: number
    /** Analysis date range */
    dateRange: {
      start: string
      end: string
    }
    /** Total invoices analyzed */
    totalInvoices: number
    /** Total hauls tracked (if compactor) */
    totalHauls?: number
  }

  /** Invoice data extraction results */
  invoiceData?: BatchExtractorResult

  /** Contract terms extraction results (if contract provided) */
  contractTerms?: ContractExtractorResult

  /** Compactor optimization results (if applicable) */
  compactorOptimization?: CompactorOptimizationResult

  /** Regulatory compliance results (if location provided) */
  regulatoryCompliance?: RegulatoryResearchResult

  /** All optimization recommendations */
  recommendations: Array<{
    type: 'compactor_monitors' | 'contamination_reduction' | 'bulk_subscription' | 'regulatory_compliance' | 'other'
    priority: 1 | 2 | 3 | 4 | 5
    title: string
    description: string
    recommend: boolean
    savings?: number
    implementation?: string
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  }>

  /** Generated reports */
  reports: {
    excelWorkbook: {
      fileName: string
      storagePath: string
      downloadUrl: string
      size: number
    }
    htmlDashboard: {
      fileName: string
      storagePath: string
      downloadUrl: string
      size: number
    }
  }

  /** Execution metadata */
  executionTime: number
  aiUsage: {
    totalRequests: number
    totalTokensInput: number
    totalTokensOutput: number
    totalCostUsd: number
  }

  /** Property is in lease-up (prevents optimization recommendations) */
  leaseUpDetected: boolean
}

/**
 * Regulatory Research Result
 *
 * Contains municipal ordinance information and compliance assessment
 * for a specific property location.
 */
export interface RegulatoryResearchResult {
  /** Property location */
  location: {
    city: string
    state: string
    county?: string
  }

  /** Ordinances found and analyzed */
  ordinances: OrdinanceInfo[]

  /** Waste management requirements extracted from ordinances */
  requirements: {
    waste: WasteRequirement[]
    recycling: RecyclingRequirement[]
    composting: CompostingRequirement[]
  }

  /** Compliance assessment */
  compliance: {
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN'
    issues: ComplianceIssue[]
    recommendations: string[]
  }

  /** Penalties for non-compliance */
  penalties: {
    type: string
    description: string
    amount?: string
  }[]

  /** Licensed haulers (if applicable) */
  licensedHaulers: {
    name: string
    licenseNumber?: string
    contact?: string
  }[]

  /** Regulatory contacts */
  contacts: {
    department: string
    phone?: string
    email?: string
    website?: string
  }[]

  /** Confidence in the research results */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'

  /** Sources consulted */
  sources: {
    title: string
    url: string
    accessedDate: string
    relevance: number
  }[]

  /** Metadata */
  researchDate: string
  expirationDate: string // When research should be refreshed
}

export interface OrdinanceInfo {
  title: string
  url: string
  jurisdiction: string // e.g., "City of Austin"
  chapter?: string
  section?: string
  effectiveDate?: string
  summary: string
  fullText?: string
  relevantExcerpts: string[]
}

export interface WasteRequirement {
  requirement: string
  mandatory: boolean
  frequency?: string // e.g., "2x per week minimum"
  containerType?: string
  source: string // Which ordinance/section
}

export interface RecyclingRequirement {
  requirement: string
  mandatory: boolean
  materials: string[] // e.g., ["cardboard", "plastic", "metal"]
  frequency?: string
  containerType?: string
  source: string
}

export interface CompostingRequirement {
  requirement: string
  mandatory: boolean
  materials: string[] // e.g., ["food waste", "yard waste"]
  frequency?: string
  source: string
}

export interface ComplianceIssue {
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  issue: string
  requirement: string
  currentStatus: string
  recommendation: string
}
