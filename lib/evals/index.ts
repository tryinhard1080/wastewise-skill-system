/**
 * Eval Framework - Public API
 *
 * Central export point for all eval framework components
 */

// Type definitions
export type {
  EvalComparison,
  EvalResult,
  EvalSummary,
  TestCase,
} from "./types";

// Utilities
export {
  DEFAULT_TOLERANCE,
  compareValues,
  compareMetrics,
  formatNumber,
  formatPercent,
  formatEvalReport,
  generateEvalSummary,
  assertWithinTolerance,
} from "./eval-utils";

// Formula validation - import for local use
import {
  validateFormulaConstants,
  formatValidationReport,
} from "./formula-validator";

// Formula validation - re-export for external consumers
export {
  validateFormulaConstants,
  formatValidationReport,
  assertFormulaConstants,
  runAndPrintValidation,
} from "./formula-validator";

// Skill-specific evals - import for local use
import { runCompactorOptimizationEval } from "./compactor-optimization-eval";

// Skill-specific evals - re-export for external consumers
export {
  runCompactorOptimizationEval,
  runAndPrintEval as runAndPrintCompactorEval,
} from "./compactor-optimization-eval";

// Import types for type annotations
import type { EvalSummary } from "./types";

/**
 * Run all evals and return summary
 */
export async function runAllEvals() {
  const results = await Promise.all([
    runCompactorOptimizationEval(),
    // Add more skill evals here as they're created:
    // runContractExtractorEval(),
    // runRegulatoryResearchEval(),
    // runWasteWiseAnalyticsEval(),
  ]);

  const totalTests = results.reduce(
    (sum: number, r: EvalSummary) => sum + r.totalTests,
    0,
  );
  const passing = results.reduce(
    (sum: number, r: EvalSummary) => sum + r.passing,
    0,
  );
  const failing = results.reduce(
    (sum: number, r: EvalSummary) => sum + r.failing,
    0,
  );

  return {
    totalTests,
    passing,
    failing,
    passRate: totalTests > 0 ? (passing / totalTests) * 100 : 0,
    skillResults: results,
    executedAt: new Date(),
  };
}

/**
 * Run all validations (formula constants + skill evals)
 */
export async function runAllValidations() {
  console.log("Running formula constant validation...\n");
  const constantReport = validateFormulaConstants();
  console.log(formatValidationReport(constantReport));
  console.log("\n");

  console.log("Running skill evals...\n");
  const evalResults = await runAllEvals();

  console.log("=".repeat(80));
  console.log("COMPLETE VALIDATION SUMMARY");
  console.log("=".repeat(80));
  console.log(
    `Formula Constants: ${constantReport.matching}/${constantReport.totalConstants} match`,
  );
  console.log(
    `Skill Tests: ${evalResults.passing}/${evalResults.totalTests} pass`,
  );
  console.log(`Overall Pass Rate: ${evalResults.passRate.toFixed(2)}%`);
  console.log("=".repeat(80));

  if (constantReport.mismatches.length > 0 || evalResults.failing > 0) {
    process.exit(1);
  }
}
