/**
 * Formula Constant Validator
 *
 * Ensures all formula constants match WASTE_FORMULAS_REFERENCE.md v2.0
 * Run this during app initialization or in CI/CD pipeline
 */

import {
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_TARGET_TONS,
  COMPACTOR_MAX_DAYS_BETWEEN,
  DSQ_MONITOR_INSTALL,
  DSQ_MONITOR_MONTHLY,
  TONS_TO_YARDS,
  WEEKS_PER_MONTH,
  EPA_DENSITY,
  LBS_TO_TONS,
  CONTAMINATION_THRESHOLD_PCT,
  BULK_SUBSCRIPTION_THRESHOLD,
} from '@/lib/constants/formulas'

/**
 * Expected values from WASTE_FORMULAS_REFERENCE.md v2.0
 */
const CANONICAL_VALUES = {
  // Compactor Optimization (lines 201-232)
  COMPACTOR_OPTIMIZATION_THRESHOLD: 6.0,
  COMPACTOR_TARGET_TONS: 8.5,
  COMPACTOR_MAX_DAYS_BETWEEN: 14,

  // Equipment Costs (lines 319-336)
  DSQ_MONITOR_INSTALL: 300,
  DSQ_MONITOR_MONTHLY: 200,

  // Conversion Constants (lines 138-153)
  TONS_TO_YARDS: 14.49,
  WEEKS_PER_MONTH: 4.33,
  EPA_DENSITY: 138,
  LBS_TO_TONS: 2000,

  // Other Thresholds
  CONTAMINATION_THRESHOLD_PCT: 0.03,
  BULK_SUBSCRIPTION_THRESHOLD: 500,
} as const

/**
 * Validation result for a single constant
 */
interface ConstantValidation {
  name: string
  expected: number
  actual: number
  match: boolean
  source: string
}

/**
 * Complete validation report
 */
interface ValidationReport {
  allMatch: boolean
  totalConstants: number
  matching: number
  mismatches: ConstantValidation[]
  validatedAt: Date
}

/**
 * Validate all formula constants against canonical values
 *
 * @throws Error if any constants don't match canonical values
 * @returns Validation report
 */
export function validateFormulaConstants(): ValidationReport {
  const validations: ConstantValidation[] = []

  // Validate each constant
  validations.push(
    validateConstant(
      'COMPACTOR_OPTIMIZATION_THRESHOLD',
      CANONICAL_VALUES.COMPACTOR_OPTIMIZATION_THRESHOLD,
      COMPACTOR_OPTIMIZATION_THRESHOLD,
      'WASTE_FORMULAS_REFERENCE.md v2.0 lines 204-209'
    ),
    validateConstant(
      'COMPACTOR_TARGET_TONS',
      CANONICAL_VALUES.COMPACTOR_TARGET_TONS,
      COMPACTOR_TARGET_TONS,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 103'
    ),
    validateConstant(
      'COMPACTOR_MAX_DAYS_BETWEEN',
      CANONICAL_VALUES.COMPACTOR_MAX_DAYS_BETWEEN,
      COMPACTOR_MAX_DAYS_BETWEEN,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 92'
    ),
    validateConstant(
      'DSQ_MONITOR_INSTALL',
      CANONICAL_VALUES.DSQ_MONITOR_INSTALL,
      DSQ_MONITOR_INSTALL,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 332'
    ),
    validateConstant(
      'DSQ_MONITOR_MONTHLY',
      CANONICAL_VALUES.DSQ_MONITOR_MONTHLY,
      DSQ_MONITOR_MONTHLY,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 333'
    ),
    validateConstant(
      'TONS_TO_YARDS',
      CANONICAL_VALUES.TONS_TO_YARDS,
      TONS_TO_YARDS,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 140'
    ),
    validateConstant(
      'WEEKS_PER_MONTH',
      CANONICAL_VALUES.WEEKS_PER_MONTH,
      WEEKS_PER_MONTH,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 150'
    ),
    validateConstant(
      'EPA_DENSITY',
      CANONICAL_VALUES.EPA_DENSITY,
      EPA_DENSITY,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 139'
    ),
    validateConstant(
      'LBS_TO_TONS',
      CANONICAL_VALUES.LBS_TO_TONS,
      LBS_TO_TONS,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 141'
    ),
    validateConstant(
      'CONTAMINATION_THRESHOLD_PCT',
      CANONICAL_VALUES.CONTAMINATION_THRESHOLD_PCT,
      CONTAMINATION_THRESHOLD_PCT,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 239'
    ),
    validateConstant(
      'BULK_SUBSCRIPTION_THRESHOLD',
      CANONICAL_VALUES.BULK_SUBSCRIPTION_THRESHOLD,
      BULK_SUBSCRIPTION_THRESHOLD,
      'WASTE_FORMULAS_REFERENCE.md v2.0 line 262'
    )
  )

  // Validate derived constants
  validations.push(
    validateDerivedConstant(
      'TONS_TO_YARDS (derived)',
      LBS_TO_TONS / EPA_DENSITY,
      TONS_TO_YARDS,
      'Must equal LBS_TO_TONS / EPA_DENSITY'
    )
  )

  const mismatches = validations.filter(v => !v.match)
  const matching = validations.length - mismatches.length
  const allMatch = mismatches.length === 0

  const report: ValidationReport = {
    allMatch,
    totalConstants: validations.length,
    matching,
    mismatches,
    validatedAt: new Date(),
  }

  // Throw error if any mismatches
  if (!allMatch) {
    const errorMessage = formatValidationError(report)
    throw new Error(errorMessage)
  }

  return report
}

/**
 * Validate a single constant
 */
function validateConstant(
  name: string,
  expected: number,
  actual: number,
  source: string
): ConstantValidation {
  return {
    name,
    expected,
    actual,
    match: expected === actual,
    source,
  }
}

/**
 * Validate a derived constant (calculated from other constants)
 */
function validateDerivedConstant(
  name: string,
  calculated: number,
  actual: number,
  source: string
): ConstantValidation {
  const tolerance = 0.01 // Allow small floating point differences
  const match = Math.abs(calculated - actual) < tolerance

  return {
    name,
    expected: calculated,
    actual,
    match,
    source,
  }
}

/**
 * Format validation error message
 */
function formatValidationError(report: ValidationReport): string {
  const lines: string[] = []

  lines.push('❌ FORMULA CONSTANT VALIDATION FAILED')
  lines.push('')
  lines.push(`${report.mismatches.length} constant(s) do not match WASTE_FORMULAS_REFERENCE.md v2.0:`)
  lines.push('')

  for (const mismatch of report.mismatches) {
    lines.push(`  ❌ ${mismatch.name}`)
    lines.push(`     Expected: ${mismatch.expected}`)
    lines.push(`     Actual:   ${mismatch.actual}`)
    lines.push(`     Source:   ${mismatch.source}`)
    lines.push('')
  }

  lines.push('CRITICAL: All formula constants must match the canonical reference.')
  lines.push('Please update lib/constants/formulas.ts to match WASTE_FORMULAS_REFERENCE.md v2.0')

  return lines.join('\n')
}

/**
 * Format validation success message
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = []

  lines.push('='.repeat(80))
  lines.push('FORMULA CONSTANT VALIDATION REPORT')
  lines.push('='.repeat(80))
  lines.push('')
  lines.push(`Validated: ${report.validatedAt.toISOString()}`)
  lines.push(`Total Constants: ${report.totalConstants}`)
  lines.push(`Matching: ${report.matching}`)
  lines.push(`Mismatches: ${report.mismatches.length}`)
  lines.push('')

  if (report.allMatch) {
    lines.push('✓ ALL CONSTANTS MATCH CANONICAL REFERENCE')
    lines.push('')
    lines.push('All formula constants in lib/constants/formulas.ts match')
    lines.push('WASTE_FORMULAS_REFERENCE.md v2.0 exactly.')
  } else {
    lines.push('❌ VALIDATION FAILED')
    lines.push('')

    for (const mismatch of report.mismatches) {
      lines.push(`  ❌ ${mismatch.name}`)
      lines.push(`     Expected: ${mismatch.expected}`)
      lines.push(`     Actual:   ${mismatch.actual}`)
      lines.push(`     Source:   ${mismatch.source}`)
      lines.push('')
    }
  }

  lines.push('='.repeat(80))

  return lines.join('\n')
}

/**
 * Assert that formula constants are valid
 * Throws an error if validation fails
 *
 * Use this in app initialization or tests:
 *
 * @example
 * import { assertFormulaConstants } from '@/lib/evals/formula-validator'
 *
 * // In app initialization
 * assertFormulaConstants()
 */
export function assertFormulaConstants(): void {
  validateFormulaConstants()
}

/**
 * Standalone function to run validator and print results
 */
export function runAndPrintValidation(): void {
  try {
    const report = validateFormulaConstants()
    console.log(formatValidationReport(report))
    process.exit(0)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Allow running directly
if (require.main === module) {
  runAndPrintValidation()
}
