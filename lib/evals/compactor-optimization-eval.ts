/**
 * Compactor Optimization Eval
 *
 * Validates TypeScript implementation internal consistency and adherence to canonical formulas
 * Reference: WASTE_FORMULAS_REFERENCE.md v2.0 (lines 201-232)
 *
 * NOTE: Python reference (compactor_calculator.py) uses different methodology (capacity-based)
 * This eval validates TypeScript follows v2.0 canonical criteria (tons-based threshold)
 *
 * CRITICAL: All calculations must follow WASTE_FORMULAS_REFERENCE.md v2.0
 */

import { CompactorOptimizationSkill } from "@/lib/skills/skills/compactor-optimization";
import type { SkillContext } from "@/lib/skills/types";
import type { Database } from "@/types/database.types";
import {
  compareMetrics,
  formatEvalReport,
  generateEvalSummary,
  DEFAULT_TOLERANCE,
} from "./eval-utils";
import type { EvalResult, EvalSummary, TestCase } from "./types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type HaulLogRow = Database["public"]["Tables"]["haul_log"]["Row"];
type InvoiceDataRow = Database["public"]["Tables"]["invoice_data"]["Row"];

/**
 * Input data for compactor optimization test
 */
interface CompactorTestInput {
  units: number;
  containerSizeCy: number;
  haulLogData: Array<{ date: string; tonnage: number }>;
  invoiceData: Array<{ date: string; amount: number; hauls: number }>;
}

/**
 * Expected output based on WASTE_FORMULAS_REFERENCE.md v2.0
 */
interface CompactorExpectedOutput {
  avgTonsPerHaul: number;
  recommend: boolean;
  // Optional: validate against known calculations
  currentAnnualHauls?: number;
  optimizedAnnualHauls?: number;
  haulsEliminated?: number;
  grossAnnualSavings?: number;
}

/**
 * Test cases based on WASTE_FORMULAS_REFERENCE.md v2.0 canonical criteria
 *
 * Optimization criteria (ALL 3 must be true):
 * - average_tons_per_haul < 6.0
 * - max_days_between_pickups <= 14
 * - property_has_compactor == true
 *
 * Source: WASTE_FORMULAS_REFERENCE.md v2.0, lines 201-232
 */
const TEST_CASES: TestCase<CompactorTestInput, CompactorExpectedOutput>[] = [
  {
    id: "test-01-low-utilization",
    description:
      "Property with low utilization (5.2 tons/haul) - should recommend monitoring",
    input: {
      units: 200,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 5.2 },
        { date: "2025-01-08", tonnage: 5.4 },
        { date: "2025-01-15", tonnage: 5.1 },
        { date: "2025-01-22", tonnage: 5.3 },
      ],
      invoiceData: [
        { date: "2025-01-01", amount: 850, hauls: 1 },
        { date: "2025-01-08", amount: 850, hauls: 1 },
        { date: "2025-01-15", amount: 850, hauls: 1 },
        { date: "2025-01-22", amount: 850, hauls: 1 },
      ],
    },
    expected: {
      avgTonsPerHaul: 5.25,
      recommend: true,
      // Additional expected values would be calculated from Python reference
      // For now, we'll focus on core calculation validation
    },
  },
  {
    id: "test-02-good-utilization",
    description:
      "Property with good utilization (6.5 tons/haul) - should NOT recommend",
    input: {
      units: 200,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 6.5 },
        { date: "2025-01-08", tonnage: 6.4 },
        { date: "2025-01-15", tonnage: 6.6 },
        { date: "2025-01-22", tonnage: 6.5 },
      ],
      invoiceData: [],
    },
    expected: {
      avgTonsPerHaul: 6.5,
      recommend: false,
    },
  },
  {
    id: "test-03-edge-case-5.8",
    description:
      "Edge case: 5.8 tons/haul (< 6.0 threshold) - should recommend",
    input: {
      units: 150,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 5.8 },
        { date: "2025-01-08", tonnage: 5.8 },
        { date: "2025-01-15", tonnage: 5.8 },
      ],
      invoiceData: [],
    },
    expected: {
      avgTonsPerHaul: 5.8,
      recommend: true,
    },
  },
  {
    id: "test-04-edge-case-6.0",
    description:
      "Edge case: 6.0 tons/haul (exactly at threshold) - should NOT recommend",
    input: {
      units: 180,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 6.0 },
        { date: "2025-01-08", tonnage: 6.0 },
        { date: "2025-01-15", tonnage: 6.0 },
      ],
      invoiceData: [],
    },
    expected: {
      avgTonsPerHaul: 6.0,
      recommend: false,
    },
  },
  {
    id: "test-05-formula-constant-validation",
    description:
      "Verify formula constants match WASTE_FORMULAS_REFERENCE.md v2.0",
    input: {
      units: 200,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 5.0 },
        { date: "2025-01-08", tonnage: 5.0 },
        { date: "2025-01-15", tonnage: 5.0 },
      ],
      invoiceData: [],
    },
    expected: {
      avgTonsPerHaul: 5.0,
      recommend: true, // 5.0 < 6.0 threshold
    },
  },
  {
    id: "test-06-max-days-constraint",
    description:
      "Verify max days between constraint (>14 days should NOT recommend)",
    input: {
      units: 200,
      containerSizeCy: 30,
      haulLogData: [
        { date: "2025-01-01", tonnage: 5.5 },
        { date: "2025-01-16", tonnage: 5.5 }, // 15 days later (exceeds 14-day limit)
        { date: "2025-01-31", tonnage: 5.5 }, // 15 days later
      ],
      invoiceData: [],
    },
    expected: {
      avgTonsPerHaul: 5.5,
      recommend: false, // Even though 5.5 < 6.0, max days > 14 fails criteria
    },
  },
];

/**
 * Run compactor optimization eval suite
 *
 * @returns Eval summary with all test results
 */
export async function runCompactorOptimizationEval(): Promise<EvalSummary> {
  const results: EvalResult[] = [];

  for (const testCase of TEST_CASES) {
    try {
      const result = await runSingleTest(testCase);
      results.push(result);
    } catch (error) {
      results.push({
        testCaseId: testCase.id,
        description: testCase.description,
        pass: false,
        comparisons: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return generateEvalSummary(results);
}

/**
 * Run a single test case
 */
async function runSingleTest(
  testCase: TestCase<CompactorTestInput, CompactorExpectedOutput>,
): Promise<EvalResult> {
  const skill = new CompactorOptimizationSkill();

  // Build context from test input
  const context = buildSkillContext(testCase.input);

  // Execute skill
  const skillResult = await skill.execute(context);

  if (!skillResult.success || !skillResult.data) {
    return {
      testCaseId: testCase.id,
      description: testCase.description,
      pass: false,
      comparisons: [],
      error: skillResult.error?.message || "Skill execution failed",
    };
  }

  const tsOutput = skillResult.data;

  // Compare core metrics
  const comparisons = compareMetrics(
    {
      avgTonsPerHaul: [
        tsOutput.avgTonsPerHaul,
        testCase.expected.avgTonsPerHaul,
      ],
    },
    DEFAULT_TOLERANCE,
  );

  // Validate boolean recommendation
  const recommendMatch = tsOutput.recommend === testCase.expected.recommend;

  if (!recommendMatch) {
    comparisons.push({
      metric: "recommend",
      tsValue: tsOutput.recommend ? 1 : 0,
      pythonValue: testCase.expected.recommend ? 1 : 0,
      difference: tsOutput.recommend === testCase.expected.recommend ? 0 : 1,
      percentDiff: 1,
      pass: false,
      tolerance: 0,
    });
  }

  // Compare additional metrics if present
  if (
    testCase.expected.currentAnnualHauls !== undefined &&
    tsOutput.currentAnnualHauls
  ) {
    comparisons.push(
      ...compareMetrics({
        currentAnnualHauls: [
          tsOutput.currentAnnualHauls,
          testCase.expected.currentAnnualHauls,
        ],
      }),
    );
  }

  if (
    testCase.expected.optimizedAnnualHauls !== undefined &&
    tsOutput.optimizedAnnualHauls
  ) {
    comparisons.push(
      ...compareMetrics({
        optimizedAnnualHauls: [
          tsOutput.optimizedAnnualHauls,
          testCase.expected.optimizedAnnualHauls,
        ],
      }),
    );
  }

  if (
    testCase.expected.grossAnnualSavings !== undefined &&
    tsOutput.grossAnnualSavings
  ) {
    comparisons.push(
      ...compareMetrics({
        grossAnnualSavings: [
          tsOutput.grossAnnualSavings,
          testCase.expected.grossAnnualSavings,
        ],
      }),
    );
  }

  const pass = comparisons.every((c) => c.pass);

  return {
    testCaseId: testCase.id,
    description: testCase.description,
    pass,
    comparisons,
  };
}

/**
 * Build SkillContext from test input data
 */
function buildSkillContext(input: CompactorTestInput): SkillContext {
  const mockProject: ProjectRow = {
    id: "test-project",
    user_id: "test-user",
    property_name: "Test Property",
    units: input.units,
    city: "Test City",
    state: "GA",
    property_type: "Garden-Style",
    equipment_type: "COMPACTOR",
    status: "processing",
    progress: 0,
    total_savings: null,
    analysis_period_months: null,
    error_message: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const haulLog: HaulLogRow[] = input.haulLogData.map((haul, index) => ({
    id: `haul-${index}`,
    project_id: "test-project",
    invoice_id: null,
    haul_date: haul.date,
    tonnage: haul.tonnage,
    days_since_last: null,
    status: "normal",
    created_at: "2025-01-01T00:00:00Z",
  }));

  const invoices: InvoiceDataRow[] = input.invoiceData.map(
    (invoice, index) => ({
      id: `invoice-${index}`,
      project_id: "test-project",
      source_file_id: null,
      invoice_number: `INV-${invoice.date}`,
      invoice_date: invoice.date,
      vendor_name: "Test Vendor",
      service_type: "Compactor Service",
      total_amount: invoice.amount,
      tonnage: null,
      hauls: invoice.hauls,
      charges: {},
      notes: null,
      created_at: "2025-01-01T00:00:00Z",
    }),
  );

  return {
    projectId: "test-project",
    userId: "test-user",
    project: mockProject,
    invoices,
    haulLog,
    config: {
      conversionRates: {
        compactorYpd: 14.49,
        dumpsterYpd: 4.33,
        targetCapacity: 8.5,
      },
      thresholds: {
        compactorTons: 6.0,
        contaminationPct: 3.0,
        bulkMonthly: 500,
        leaseupVariance: -40,
      },
    },
  };
}

/**
 * Generate weekly haul log data for testing
 */
function generateWeeklyHauls(
  weeks: number,
  avgTons: number,
): Array<{ date: string; tonnage: number }> {
  const hauls: Array<{ date: string; tonnage: number }> = [];
  const startDate = new Date("2025-01-01");

  for (let i = 0; i < weeks; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 7);

    // Add small variance (±5%)
    const variance = (Math.random() - 0.5) * 0.1 * avgTons;
    const tonnage = Math.round((avgTons + variance) * 10) / 10;

    hauls.push({
      date: date.toISOString().split("T")[0],
      tonnage,
    });
  }

  return hauls;
}

/**
 * Standalone function to run eval and print results
 */
export async function runAndPrintEval(): Promise<void> {
  console.log("Running Compactor Optimization Eval...\n");

  const summary = await runCompactorOptimizationEval();
  const report = formatEvalReport(summary);

  console.log(report);

  if (summary.failing > 0) {
    process.exit(1);
  }
}

// Allow running directly
if (require.main === module) {
  runAndPrintEval().catch((error) => {
    console.error("Eval execution failed:", error);
    process.exit(1);
  });
}
