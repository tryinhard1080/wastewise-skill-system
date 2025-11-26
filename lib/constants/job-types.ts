/**
 * Job Type Constants
 *
 * CANONICAL SOURCE OF TRUTH for analysis job types.
 *
 * This file defines all valid job types and their corresponding skill mappings.
 * Any changes here should be reflected in the database CHECK constraint.
 *
 * Referenced by:
 * - Database CHECK constraint (supabase/migrations/20251114000002_analysis_jobs.sql:16-23)
 * - API route validation (app/api/analyze/route.ts:17-23)
 * - Skill executor mapping (lib/skills/executor.ts:15-32)
 * - Worker job processing (lib/workers/job-processor.ts:75-96)
 *
 * @see {@link https://github.com/wastewise/docs/job-types.md Job Types Documentation}
 */

/**
 * Valid job types for analysis jobs
 *
 * Each job type represents a different workflow:
 * - COMPLETE_ANALYSIS: Full WasteWise analysis (invoices + optimization + reports)
 * - INVOICE_EXTRACTION: Extract data from uploaded invoices only
 * - REGULATORY_RESEARCH: Research local waste ordinances for a property
 * - REPORT_GENERATION: Generate reports from existing analysis data
 */
export const JOB_TYPES = {
  COMPLETE_ANALYSIS: 'complete_analysis',
  INVOICE_EXTRACTION: 'invoice_extraction',
  REGULATORY_RESEARCH: 'regulatory_research',
  REPORT_GENERATION: 'report_generation',
} as const

/**
 * Job type string literal union
 */
export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES]

/**
 * Mapping of job types to skill names
 *
 * Each job type routes to a specific skill implementation.
 * Skills must be registered in lib/skills/registry.ts
 */
export const JOB_TYPE_SKILL_MAPPING: Record<JobType, string> = {
  [JOB_TYPES.COMPLETE_ANALYSIS]: 'wastewise-analytics',
  [JOB_TYPES.INVOICE_EXTRACTION]: 'batch-extractor',
  [JOB_TYPES.REGULATORY_RESEARCH]: 'regulatory-research',
  [JOB_TYPES.REPORT_GENERATION]: 'wastewise-analytics',
}

/**
 * All valid job types as array
 *
 * Useful for validation in Zod schemas and error messages
 */
export const VALID_JOB_TYPES = Object.values(JOB_TYPES) as [JobType, ...JobType[]]

/**
 * Type guard to check if a string is a valid job type
 *
 * @param value - String to check
 * @returns True if value is a valid job type
 */
export function isValidJobType(value: string): value is JobType {
  return VALID_JOB_TYPES.includes(value as JobType)
}

/**
 * Get skill name for a job type
 *
 * @param jobType - Job type to map
 * @returns Skill name
 * @throws Error if job type is invalid
 */
export function getSkillForJobType(jobType: string): string {
  if (!isValidJobType(jobType)) {
    throw new Error(
      `Invalid job type: ${jobType}. Valid types: ${VALID_JOB_TYPES.join(', ')}`
    )
  }
  return JOB_TYPE_SKILL_MAPPING[jobType]
}
