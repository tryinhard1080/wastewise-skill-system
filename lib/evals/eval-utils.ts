/**
 * Eval Framework Utilities
 *
 * Reusable helper functions for comparing TypeScript vs Python implementations
 */

import type { EvalComparison, EvalResult, EvalSummary } from "./types";

/**
 * Default tolerance for calculations (0.01% = 0.0001)
 */
export const DEFAULT_TOLERANCE = 0.0001;

/**
 * Compare two numeric values and generate a comparison result
 *
 * @param metric - Name of the metric being compared
 * @param tsValue - TypeScript implementation value
 * @param pythonValue - Python reference value
 * @param tolerance - Acceptable percentage difference (default: 0.0001 = 0.01%)
 * @returns Comparison result with pass/fail status
 */
export function compareValues(
  metric: string,
  tsValue: number,
  pythonValue: number,
  tolerance: number = DEFAULT_TOLERANCE,
): EvalComparison {
  const difference = tsValue - pythonValue;
  const percentDiff =
    pythonValue !== 0
      ? Math.abs(difference / pythonValue)
      : Math.abs(difference);
  const pass = percentDiff <= tolerance;

  return {
    metric,
    tsValue,
    pythonValue,
    difference,
    percentDiff,
    pass,
    tolerance,
  };
}

/**
 * Compare multiple metrics between TS and Python implementations
 *
 * @param metrics - Object mapping metric names to [tsValue, pythonValue] tuples
 * @param tolerance - Acceptable percentage difference
 * @returns Array of comparison results
 */
export function compareMetrics(
  metrics: Record<string, [number, number]>,
  tolerance: number = DEFAULT_TOLERANCE,
): EvalComparison[] {
  return Object.entries(metrics).map(([metric, [tsValue, pythonValue]]) =>
    compareValues(metric, tsValue, pythonValue, tolerance),
  );
}

/**
 * Format a number for display in eval reports
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format percentage for display
 *
 * @param value - Percentage value (0.0001 = 0.01%)
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string with % symbol
 */
export function formatPercent(value: number, decimals: number = 4): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Generate a text report from eval results
 *
 * @param summary - Eval summary to format
 * @returns Formatted text report
 */
export function formatEvalReport(summary: EvalSummary): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("EVAL VALIDATION REPORT");
  lines.push("=".repeat(80));
  lines.push("");
  lines.push(`Executed: ${summary.executedAt.toISOString()}`);
  lines.push(`Total Tests: ${summary.totalTests}`);
  lines.push(`Passing: ${summary.passing}`);
  lines.push(`Failing: ${summary.failing}`);
  lines.push(`Pass Rate: ${formatPercent(summary.passRate / 100, 2)}`);
  lines.push("");

  if (summary.failing > 0) {
    lines.push("⚠️  FAILURES DETECTED");
    lines.push("");
  }

  for (const result of summary.results) {
    lines.push("-".repeat(80));
    lines.push(`Test: ${result.testCaseId}`);
    lines.push(`Description: ${result.description}`);
    lines.push(`Status: ${result.pass ? "✓ PASS" : "✗ FAIL"}`);

    if (result.error) {
      lines.push(`Error: ${result.error}`);
    }

    lines.push("");
    lines.push("Metric Comparisons:");

    for (const comp of result.comparisons) {
      const status = comp.pass ? "✓" : "✗";
      lines.push(`  ${status} ${comp.metric}`);
      lines.push(`    TypeScript:  ${formatNumber(comp.tsValue, 4)}`);
      lines.push(`    Python:      ${formatNumber(comp.pythonValue, 4)}`);
      lines.push(`    Difference:  ${formatNumber(comp.difference, 6)}`);
      lines.push(`    % Diff:      ${formatPercent(comp.percentDiff, 4)}`);
      lines.push(`    Tolerance:   ${formatPercent(comp.tolerance, 4)}`);

      if (!comp.pass) {
        lines.push(`    ⚠️  EXCEEDS TOLERANCE`);
      }

      lines.push("");
    }
  }

  lines.push("=".repeat(80));

  if (summary.failing === 0) {
    lines.push("✓ ALL TESTS PASSED");
  } else {
    lines.push(`✗ ${summary.failing} TEST(S) FAILED`);
  }

  lines.push("=".repeat(80));

  return lines.join("\n");
}

/**
 * Generate a summary from multiple eval results
 *
 * @param results - Array of eval results
 * @returns Summary statistics
 */
export function generateEvalSummary(results: EvalResult[]): EvalSummary {
  const totalTests = results.length;
  const passing = results.filter((r) => r.pass).length;
  const failing = totalTests - passing;
  const passRate = totalTests > 0 ? (passing / totalTests) * 100 : 0;

  return {
    totalTests,
    passing,
    failing,
    passRate,
    results,
    executedAt: new Date(),
  };
}

/**
 * Assert that a value is within tolerance of expected value
 * Throws an error if not within tolerance
 *
 * @param actual - Actual value
 * @param expected - Expected value
 * @param metric - Name of metric for error message
 * @param tolerance - Acceptable percentage difference
 */
export function assertWithinTolerance(
  actual: number,
  expected: number,
  metric: string,
  tolerance: number = DEFAULT_TOLERANCE,
): void {
  const comparison = compareValues(metric, actual, expected, tolerance);

  if (!comparison.pass) {
    throw new Error(
      `${metric} exceeds tolerance:\n` +
        `  Expected: ${formatNumber(expected, 4)}\n` +
        `  Actual:   ${formatNumber(actual, 4)}\n` +
        `  Diff:     ${formatNumber(comparison.difference, 6)} (${formatPercent(comparison.percentDiff, 4)})\n` +
        `  Max:      ${formatPercent(tolerance, 4)}`,
    );
  }
}
