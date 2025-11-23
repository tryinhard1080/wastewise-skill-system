/**
 * Executive Summary Tab Generator
 *
 * Creates the first tab of the Excel report with high-level property
 * information, key metrics, benchmarks, and top recommendations.
 *
 * Layout:
 * 1. Header: Property name and analysis date
 * 2. Property Info: Address, units, equipment type
 * 3. Key Metrics: YPD, cost/door, total spend
 * 4. Benchmark Comparison: vs industry standards
 * 5. Top 3 Recommendations: Highest priority savings opportunities
 * 6. Savings Summary: Total potential savings
 */

import type { Worksheet } from "exceljs";
import type { WasteWiseAnalyticsCompleteResult } from "@/lib/skills/types";
import type { ProjectRow } from "@/lib/skills/types";
import {
  applyHeaderStyle,
  applySubheaderStyle,
  mergeCells,
  addKeyValueRow,
  formatCurrency,
  formatPercentage,
  formatNumber,
  autoSizeColumns,
  addFooter,
  FONTS,
  FILLS,
  ALIGNMENTS,
  BORDERS,
  COLORS,
} from "../formatters";

/**
 * Benchmark data by property type
 */
const BENCHMARKS = {
  "Garden-Style": {
    yardsPerDoor: { min: 2.0, max: 2.5 },
    costPerDoor: { min: 15, max: 25 },
  },
  "Mid-Rise": {
    yardsPerDoor: { min: 1.8, max: 2.3 },
    costPerDoor: { min: 12, max: 22 },
  },
  "High-Rise": {
    yardsPerDoor: { min: 1.5, max: 2.0 },
    costPerDoor: { min: 10, max: 20 },
  },
} as const;

/**
 * Generate Executive Summary worksheet
 */
export function generateExecutiveSummary(
  worksheet: Worksheet,
  result: WasteWiseAnalyticsCompleteResult,
  project: ProjectRow,
): void {
  // Set worksheet name
  worksheet.name = "Executive Summary";

  let currentRow = 1;

  // ========== HEADER ==========
  const headerRow = worksheet.getRow(currentRow);
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    project.property_name,
    "header",
  );
  applyHeaderStyle(headerRow);
  currentRow += 2;

  // Analysis date
  const subtitleRow = worksheet.getRow(currentRow);
  subtitleRow.getCell(1).value =
    `WasteWise Analysis - Generated ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  subtitleRow.getCell(1).font = FONTS.subheader as any;
  subtitleRow.getCell(1).alignment = ALIGNMENTS.left as any;
  currentRow += 2;

  // ========== PROPERTY INFORMATION ==========
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    "Property Information",
    "section",
  );
  currentRow++;

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Property Name:",
    project.property_name,
  );
  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Address:",
    (project as any).property_address || "N/A",
  );
  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Units:",
    project.units.toString(),
  );
  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Property Type:",
    project.property_type || "N/A",
  );
  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Equipment Type:",
    project.equipment_type || "N/A",
  );
  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Analysis Period:",
    `${result.summary.dateRange.start} - ${result.summary.dateRange.end}`,
  );

  currentRow += 2;

  // ========== KEY METRICS ==========
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    "Key Performance Metrics",
    "section",
  );
  currentRow++;

  // Calculate yards per door from invoice data
  const yardsPerDoor = calculateYardsPerDoor(result, project);
  const costPerDoor = result.summary.currentMonthlyCost / project.units;

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Yards Per Door (Weekly):",
    yardsPerDoor,
    "number",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Cost Per Door (Monthly):",
    costPerDoor,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Total Monthly Cost:",
    result.summary.currentMonthlyCost,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Invoices Analyzed:",
    result.summary.totalInvoices.toString(),
  );

  if (result.summary.totalHauls) {
    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      "Total Hauls Tracked:",
      result.summary.totalHauls.toString(),
    );
  }

  currentRow += 2;

  // ========== BENCHMARK COMPARISON ==========
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    "Benchmark Comparison",
    "section",
  );
  currentRow++;

  const benchmark = getBenchmark(project.property_type || "Garden-Style");

  if (benchmark) {
    // YPD Benchmark
    const ypdRow = worksheet.getRow(currentRow++);
    ypdRow.getCell(1).value = "Yards Per Door:";
    ypdRow.getCell(1).font = FONTS.bodyBold as any;

    ypdRow.getCell(2).value = yardsPerDoor;
    formatNumber(ypdRow.getCell(2), yardsPerDoor);

    ypdRow.getCell(3).value = "Benchmark Range:";
    ypdRow.getCell(3).font = FONTS.body as any;

    ypdRow.getCell(4).value =
      `${benchmark.yardsPerDoor.min} - ${benchmark.yardsPerDoor.max}`;
    ypdRow.getCell(4).font = FONTS.body as any;

    ypdRow.getCell(5).value = "Status:";
    ypdRow.getCell(5).font = FONTS.body as any;

    const ypdStatus = getStatusText(
      yardsPerDoor,
      benchmark.yardsPerDoor.min,
      benchmark.yardsPerDoor.max,
    );
    ypdRow.getCell(6).value = ypdStatus;
    ypdRow.getCell(6).font = FONTS.bodyBold as any;
    ypdRow.getCell(6).fill =
      ypdStatus === "Within Range"
        ? FILLS.highlightGreen
        : ypdStatus === "Above Range"
          ? FILLS.highlightRed
          : (FILLS.highlightYellow as any);

    // Cost/Door Benchmark
    const costRow = worksheet.getRow(currentRow++);
    costRow.getCell(1).value = "Cost Per Door:";
    costRow.getCell(1).font = FONTS.bodyBold as any;

    formatCurrency(costRow.getCell(2), costPerDoor);

    costRow.getCell(3).value = "Benchmark Range:";
    costRow.getCell(3).font = FONTS.body as any;

    costRow.getCell(4).value =
      `$${benchmark.costPerDoor.min} - $${benchmark.costPerDoor.max}`;
    costRow.getCell(4).font = FONTS.body as any;

    costRow.getCell(5).value = "Status:";
    costRow.getCell(5).font = FONTS.body as any;

    const costStatus = getStatusText(
      costPerDoor,
      benchmark.costPerDoor.min,
      benchmark.costPerDoor.max,
    );
    costRow.getCell(6).value = costStatus;
    costRow.getCell(6).font = FONTS.bodyBold as any;
    costRow.getCell(6).fill =
      costStatus === "Within Range"
        ? FILLS.highlightGreen
        : costStatus === "Above Range"
          ? FILLS.highlightRed
          : (FILLS.highlightYellow as any);

    currentRow += 2;
  }

  // ========== TOP 3 RECOMMENDATIONS ==========
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    "Top Recommendations",
    "section",
  );
  currentRow++;

  const topRecommendations = result.recommendations
    .filter((r) => r.recommend)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  if (topRecommendations.length === 0) {
    const noRecsRow = worksheet.getRow(currentRow++);
    noRecsRow.getCell(1).value =
      "No optimization recommendations at this time.";
    noRecsRow.getCell(1).font = FONTS.body as any;
    noRecsRow.getCell(1).alignment = ALIGNMENTS.left as any;

    if (result.leaseUpDetected) {
      const leaseUpRow = worksheet.getRow(currentRow++);
      leaseUpRow.getCell(1).value =
        "Note: Property appears to be in lease-up. Optimization analysis should be performed once occupancy stabilizes.";
      leaseUpRow.getCell(1).font = { ...FONTS.body, italic: true } as any;
      leaseUpRow.getCell(1).alignment = ALIGNMENTS.wrapText as any;
      mergeCells(
        worksheet,
        currentRow - 1,
        1,
        currentRow - 1,
        6,
        "",
        "section",
      );
    }
  } else {
    topRecommendations.forEach((rec, index) => {
      // Recommendation title
      const titleRow = worksheet.getRow(currentRow++);
      mergeCells(
        worksheet,
        currentRow - 1,
        1,
        currentRow - 1,
        6,
        `${index + 1}. ${rec.title}`,
        "section",
      );
      titleRow.getCell(1).font = FONTS.sectionTitle as any;
      titleRow.getCell(1).fill = FILLS.subheader as any;

      // Description
      const descRow = worksheet.getRow(currentRow++);
      descRow.getCell(1).value = rec.description;
      descRow.getCell(1).font = FONTS.body as any;
      descRow.getCell(1).alignment = ALIGNMENTS.wrapText as any;
      descRow.height = 40;
      mergeCells(
        worksheet,
        currentRow - 1,
        1,
        currentRow - 1,
        6,
        "",
        "section",
      );

      // Savings potential
      if (rec.savings) {
        const savingsRow = worksheet.getRow(currentRow++);
        savingsRow.getCell(1).value = "Estimated Annual Savings:";
        savingsRow.getCell(1).font = FONTS.bodyBold as any;

        formatCurrency(savingsRow.getCell(2), rec.savings);
        savingsRow.getCell(2).font = {
          ...FONTS.bodyBold,
          color: { argb: COLORS.success },
        } as any;
      }

      // Implementation timeline
      if (rec.implementation) {
        const implRow = worksheet.getRow(currentRow++);
        implRow.getCell(1).value = "Implementation:";
        implRow.getCell(1).font = FONTS.bodyBold as any;

        implRow.getCell(2).value = rec.implementation;
        implRow.getCell(2).font = FONTS.body as any;
        mergeCells(
          worksheet,
          currentRow - 1,
          2,
          currentRow - 1,
          6,
          "",
          "section",
        );
      }

      currentRow++;
    });
  }

  currentRow += 2;

  // ========== SAVINGS SUMMARY ==========
  mergeCells(
    worksheet,
    currentRow,
    1,
    currentRow,
    6,
    "Total Savings Potential",
    "section",
  );
  currentRow++;

  const summaryStartRow = currentRow;

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Current Monthly Cost:",
    result.summary.currentMonthlyCost,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Optimized Monthly Cost:",
    result.summary.optimizedMonthlyCost,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Monthly Savings:",
    result.summary.currentMonthlyCost - result.summary.optimizedMonthlyCost,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Annual Savings:",
    result.summary.totalSavingsPotential,
    "currency",
  );

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    "Savings Percentage:",
    result.summary.savingsPercentage,
    "percentage",
  );

  // Highlight savings
  for (let i = summaryStartRow; i < currentRow; i++) {
    const row = worksheet.getRow(i);
    row.getCell(2).fill = FILLS.highlightGreen as any;
    row.getCell(2).font = {
      ...FONTS.bodyBold,
      color: { argb: COLORS.success },
    } as any;
  }

  // Add footer
  addFooter(worksheet, 1, 6);

  // Auto-size columns
  autoSizeColumns(worksheet, 15, 60);
}

/**
 * Calculate yards per door from invoice/haul data
 */
function calculateYardsPerDoor(
  result: WasteWiseAnalyticsCompleteResult,
  project: ProjectRow,
): number {
  // If we have compactor optimization data, use that
  if (result.compactorOptimization) {
    // Convert tons to yards: tons * 14.49 (compactor conversion)
    const avgTons = result.compactorOptimization.avgTonsPerHaul;
    const yardsPerHaul = avgTons * 14.49;
    const totalHauls = result.summary.totalHauls || 1;
    const weeksInPeriod = calculateWeeks(
      result.summary.dateRange.start,
      result.summary.dateRange.end,
    );
    const yardsPerWeek = (yardsPerHaul * totalHauls) / weeksInPeriod;
    return yardsPerWeek / project.units;
  }

  // Otherwise estimate from total spend and equipment type
  // This is a rough estimate - actual calculation would need more invoice details
  return 2.0; // Default placeholder
}

/**
 * Calculate number of weeks between two dates
 */
function calculateWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays / 7, 1);
}

/**
 * Get benchmark for property type
 */
function getBenchmark(
  propertyType: string,
): (typeof BENCHMARKS)[keyof typeof BENCHMARKS] | null {
  if (propertyType in BENCHMARKS) {
    return BENCHMARKS[propertyType as keyof typeof BENCHMARKS];
  }
  return null;
}

/**
 * Get status text based on value vs benchmark range
 */
function getStatusText(value: number, min: number, max: number): string {
  if (value < min) return "Below Range";
  if (value > max) return "Above Range";
  return "Within Range";
}
