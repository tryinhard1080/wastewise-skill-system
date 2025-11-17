/**
 * Optimization Opportunities Tab Generator
 *
 * Creates detailed breakdown of all optimization recommendations with:
 * - Recommended vs not recommended opportunities
 * - Detailed calculation breakdowns
 * - Savings potential and ROI analysis
 * - Implementation timelines and contact information
 *
 * Layout:
 * 1. Header
 * 2. Summary (total savings, recommendation count)
 * 3. Recommended Opportunities (detailed breakdowns)
 * 4. Other Opportunities Considered (not recommended, with reasoning)
 */

import type { Worksheet } from 'exceljs'
import type { WasteWiseAnalyticsCompleteResult } from '@/lib/skills/types'
import {
  applyHeaderStyle,
  applySubheaderStyle,
  applyTableHeaderStyle,
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
} from '../formatters'

/**
 * Generate Optimization Opportunities worksheet
 */
export function generateOptimization(
  worksheet: Worksheet,
  result: WasteWiseAnalyticsCompleteResult
): void {
  worksheet.name = 'Optimization'

  let currentRow = 1

  // ========== HEADER ==========
  const headerRow = worksheet.getRow(currentRow)
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Optimization Opportunities', 'header')
  applyHeaderStyle(headerRow)
  currentRow += 2

  // ========== SUMMARY ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Summary', 'section')
  currentRow++

  const recommended = result.recommendations.filter((r) => r.recommend)
  const notRecommended = result.recommendations.filter((r) => !r.recommend)

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Total Opportunities Identified:',
    result.recommendations.length.toString()
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Recommended Actions:',
    recommended.length.toString()
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Total Annual Savings Potential:',
    result.summary.totalSavingsPotential,
    'currency'
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Savings as % of Current Spend:',
    result.summary.savingsPercentage,
    'percentage'
  )

  // Highlight total savings
  const savingsRow = worksheet.getRow(currentRow - 2)
  savingsRow.getCell(2).fill = FILLS.highlightGreen as any
  savingsRow.getCell(2).font = { ...FONTS.bodyBold, color: { argb: COLORS.success } } as any

  currentRow += 2

  // ========== RECOMMENDED OPPORTUNITIES ==========
  if (recommended.length > 0) {
    mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Recommended Opportunities', 'section')
    currentRow++

    // Sort by priority
    const sortedRecs = [...recommended].sort((a, b) => a.priority - b.priority)

    sortedRecs.forEach((rec, index) => {
      // Opportunity header
      const recHeaderRow = worksheet.getRow(currentRow++)
      mergeCells(
        worksheet,
        currentRow - 1,
        1,
        currentRow - 1,
        6,
        `${index + 1}. ${rec.title} (Priority ${rec.priority})`,
        'subheader'
      )
      applySubheaderStyle(recHeaderRow)

      // Description
      const descRow = worksheet.getRow(currentRow++)
      descRow.getCell(1).value = 'Description:'
      descRow.getCell(1).font = FONTS.bodyBold as any

      descRow.getCell(2).value = rec.description
      descRow.getCell(2).font = FONTS.body as any
      descRow.getCell(2).alignment = ALIGNMENTS.wrapText as any
      descRow.height = 40
      mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 6, '', 'section')

      // Type and confidence
      const metaRow = worksheet.getRow(currentRow++)
      metaRow.getCell(1).value = 'Type:'
      metaRow.getCell(1).font = FONTS.bodyBold as any
      metaRow.getCell(2).value = formatOpportunityType(rec.type)
      metaRow.getCell(2).font = FONTS.body as any

      if (rec.confidence) {
        metaRow.getCell(3).value = 'Confidence:'
        metaRow.getCell(3).font = FONTS.bodyBold as any
        metaRow.getCell(4).value = rec.confidence
        metaRow.getCell(4).font = FONTS.body as any

        // Color code confidence
        if (rec.confidence === 'HIGH') {
          metaRow.getCell(4).fill = FILLS.highlightGreen as any
        } else if (rec.confidence === 'MEDIUM') {
          metaRow.getCell(4).fill = FILLS.highlightYellow as any
        }
      }

      // Savings
      if (rec.savings) {
        const savingsDetailRow = worksheet.getRow(currentRow++)
        savingsDetailRow.getCell(1).value = 'Annual Savings:'
        savingsDetailRow.getCell(1).font = FONTS.bodyBold as any

        formatCurrency(savingsDetailRow.getCell(2), rec.savings)
        savingsDetailRow.getCell(2).font = { ...FONTS.bodyBold, color: { argb: COLORS.success } } as any
        savingsDetailRow.getCell(2).fill = FILLS.highlightGreen as any
      }

      // Implementation timeline
      if (rec.implementation) {
        const implRow = worksheet.getRow(currentRow++)
        implRow.getCell(1).value = 'Implementation:'
        implRow.getCell(1).font = FONTS.bodyBold as any

        implRow.getCell(2).value = rec.implementation
        implRow.getCell(2).font = FONTS.body as any
        mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 6, '', 'section')
      }

      // Add spacing between opportunities
      currentRow++
    })

    currentRow++
  }

  // ========== COMPACTOR OPTIMIZATION DETAILS ==========
  if (result.compactorOptimization && result.compactorOptimization.recommend) {
    mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Compactor Optimization - Detailed Breakdown', 'section')
    currentRow++

    const comp = result.compactorOptimization

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Current Avg Tons/Haul:',
      comp.avgTonsPerHaul,
      'number'
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Target Tons/Haul:',
      comp.targetTonsPerHaul,
      'number'
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Current Annual Hauls:',
      comp.currentAnnualHauls.toString()
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Optimized Annual Hauls:',
      comp.optimizedAnnualHauls.toString()
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Hauls Eliminated:',
      comp.haulsEliminated.toString()
    )

    currentRow++

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Gross Annual Savings:',
      comp.grossAnnualSavings,
      'currency'
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Net Year 1 Savings:',
      comp.netYear1Savings,
      'currency'
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Net Annual Savings (Year 2+):',
      comp.netAnnualSavingsYear2Plus,
      'currency'
    )

    currentRow++

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'ROI Percentage:',
      comp.roiPercent,
      'percentage'
    )

    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Payback Period:',
      `${comp.paybackMonths} months`
    )

    // Highlight key metrics
    const netSavingsRow = worksheet.getRow(currentRow - 4)
    netSavingsRow.getCell(2).fill = FILLS.highlightGreen as any
    netSavingsRow.getCell(2).font = { ...FONTS.bodyBold, color: { argb: COLORS.success } } as any

    const roiRow = worksheet.getRow(currentRow - 2)
    roiRow.getCell(2).fill = FILLS.highlightGreen as any

    currentRow += 2
  }

  // ========== OTHER OPPORTUNITIES CONSIDERED ==========
  if (notRecommended.length > 0) {
    mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Other Opportunities Considered', 'section')
    currentRow++

    const noteRow = worksheet.getRow(currentRow++)
    noteRow.getCell(1).value = 'The following opportunities were evaluated but are not recommended at this time:'
    noteRow.getCell(1).font = { ...FONTS.body, italic: true } as any
    noteRow.getCell(1).alignment = ALIGNMENTS.wrapText as any
    mergeCells(worksheet, currentRow - 1, 1, currentRow - 1, 6, '', 'section')

    currentRow++

    notRecommended.forEach((opp) => {
      const oppRow = worksheet.getRow(currentRow++)
      oppRow.getCell(1).value = `• ${opp.title}`
      oppRow.getCell(1).font = FONTS.bodyBold as any

      oppRow.getCell(2).value = opp.description
      oppRow.getCell(2).font = FONTS.body as any
      oppRow.getCell(2).alignment = ALIGNMENTS.wrapText as any
      mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 6, '', 'section')
      oppRow.height = 30
    })

    currentRow++
  }

  // ========== LEASE-UP NOTICE ==========
  if (result.leaseUpDetected) {
    mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Important Note: Lease-Up Property', 'section')
    currentRow++

    const leaseUpRow = worksheet.getRow(currentRow++)
    leaseUpRow.getCell(1).value =
      'This property appears to be in lease-up (waste generation significantly below benchmarks). ' +
      'Optimization recommendations should be re-evaluated once occupancy stabilizes to ensure accurate analysis.'
    leaseUpRow.getCell(1).font = { ...FONTS.body, italic: true } as any
    leaseUpRow.getCell(1).alignment = ALIGNMENTS.wrapText as any
    leaseUpRow.getCell(1).fill = FILLS.highlightYellow as any
    leaseUpRow.height = 50
    mergeCells(worksheet, currentRow - 1, 1, currentRow - 1, 6, '', 'section')

    currentRow += 2
  }

  // Add footer
  addFooter(worksheet, 1, 6)

  // Auto-size columns
  autoSizeColumns(worksheet, 20, 70)
}

/**
 * Format opportunity type to readable text
 */
function formatOpportunityType(type: string): string {
  const typeMap: Record<string, string> = {
    compactor_monitors: 'Compactor Monitors',
    contamination_reduction: 'Contamination Reduction',
    bulk_subscription: 'Bulk Service Subscription',
    other: 'Other',
  }

  return typeMap[type] || type
}
