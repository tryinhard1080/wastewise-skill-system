/**
 * Eval Framework Type Definitions
 *
 * Reusable types for validating TypeScript implementations against Python references
 */

/**
 * Single comparison result
 */
export interface EvalComparison {
  /** Name of the metric being compared */
  metric: string
  /** TypeScript implementation value */
  tsValue: number
  /** Python reference value */
  pythonValue: number
  /** Absolute difference (tsValue - pythonValue) */
  difference: number
  /** Percentage difference relative to Python value */
  percentDiff: number
  /** Whether difference is within tolerance */
  pass: boolean
  /** Tolerance threshold used */
  tolerance: number
}

/**
 * Complete eval result for a test case
 */
export interface EvalResult {
  /** Test case identifier */
  testCaseId: string
  /** Human-readable description */
  description: string
  /** Whether all comparisons passed */
  pass: boolean
  /** Individual metric comparisons */
  comparisons: EvalComparison[]
  /** Any errors encountered during execution */
  error?: string
}

/**
 * Summary of all eval results
 */
export interface EvalSummary {
  /** Total number of test cases */
  totalTests: number
  /** Number of passing tests */
  passing: number
  /** Number of failing tests */
  failing: number
  /** Overall pass rate (0-100) */
  passRate: number
  /** Individual test results */
  results: EvalResult[]
  /** Timestamp of eval execution */
  executedAt: Date
}

/**
 * Test case input data
 */
export interface TestCase<TInput, TExpected> {
  /** Unique identifier */
  id: string
  /** Human-readable description */
  description: string
  /** Input data for the test */
  input: TInput
  /** Expected output values from Python reference */
  expected: TExpected
}
