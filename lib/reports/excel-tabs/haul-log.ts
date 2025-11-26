/**
 * Haul Log Tab Generator
 *
 * COMPACTOR PROJECTS ONLY
 *
 * Creates detailed haul tracking with:
 * - Individual haul events (date, tonnage, days since last)
 * - Capacity utilization analysis
 * - Statistical summary (avg, min, max tonnage)
 * - Visual indicators for under/over-utilization
 *
 * Layout:
 * 1. Header
 * 2. Summary Statistics (avg tons, haul count, capacity util)
 * 3. Haul Log Table (date, tonnage, days since last, utilization %, status)
 * 4. Utilization Analysis
 */

import type { Worksheet, Font, Fill, Alignment, Borders } from 'exceljs'
import type { HaulLogRow } from '@/lib/skills/types'
import type { ProjectRow } from '@/lib/skills/types'
import {
  applyHeaderStyle,
  applyTableHeaderStyle,
  applyAlternatingRows,
  mergeCells,
  formatNumber,
  formatDate,
  formatPercentage,
  autoSizeColumns,
  addFooter,
  FONTS,
  FILLS,
  ALIGNMENTS,
  BORDERS,
  COLORS,
} from '../formatters'

/** Target compactor capacity: 8.5 tons (industry standard) */
const TARGET_CAPACITY = 8.5

/** Optimization threshold: 6.0 tons (per WASTE_FORMULAS_REFERENCE.md v2.0) */
const OPTIMIZATION_THRESHOLD = 6.0

/**
 * Generate Haul Log worksheet
 *
 * Only for compactor projects - dumpster/open top projects don't have haul logs
 */
export function generateHaulLog(
  worksheet: Worksheet,
  haulLogs: HaulLogRow[],
  project: ProjectRow
): void {
  worksheet.name = 'Haul Log'

  // Validate this is a compactor project
  if (project.equipment_type !== 'COMPACTOR') {
    worksheet.getRow(1).getCell(1).value =
      'Haul log tracking is only available for compactor projects.'
    worksheet.getRow(1).getCell(1).font = FONTS.body as Font
    return
  }

  if (haulLogs.length === 0) {
    worksheet.getRow(1).getCell(1).value = 'No haul log data available for this project.'
    worksheet.getRow(1).getCell(1).font = FONTS.body as Font
    return
  }

  let currentRow = 1

  // ========== HEADER ==========
  const headerRow = worksheet.getRow(currentRow)
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Compactor Haul Log', 'header')
  applyHeaderStyle(headerRow)
  currentRow += 2

  // ========== SUMMARY STATISTICS ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Summary Statistics', 'section')
  currentRow++

  const stats = calculateStats(haulLogs)

  const statsRow1 = worksheet.getRow(currentRow++)
  statsRow1.getCell(1).value = 'Total Hauls:'
  statsRow1.getCell(1).font = FONTS.bodyBold as Font
  statsRow1.getCell(2).value = haulLogs.length
  statsRow1.getCell(2).font = FONTS.body as Font

  statsRow1.getCell(3).value = 'Average Tons/Haul:'
  statsRow1.getCell(3).font = FONTS.bodyBold as Font
  formatNumber(statsRow1.getCell(4), stats.avgTonnage)

  statsRow1.getCell(5).value = 'Target Capacity:'
  statsRow1.getCell(5).font = FONTS.bodyBold as Font
  formatNumber(statsRow1.getCell(6), TARGET_CAPACITY)
  statsRow1.getCell(6).value = `${TARGET_CAPACITY} tons`
  statsRow1.getCell(6).font = FONTS.body as Font

  const statsRow2 = worksheet.getRow(currentRow++)
  statsRow2.getCell(1).value = 'Min Tonnage:'
  statsRow2.getCell(1).font = FONTS.bodyBold as Font
  formatNumber(statsRow2.getCell(2), stats.minTonnage)

  statsRow2.getCell(3).value = 'Max Tonnage:'
  statsRow2.getCell(3).font = FONTS.bodyBold as Font
  formatNumber(statsRow2.getCell(4), stats.maxTonnage)

  statsRow2.getCell(5).value = 'Avg Capacity Utilization:'
  statsRow2.getCell(5).font = FONTS.bodyBold as Font
  formatPercentage(statsRow2.getCell(6), stats.avgUtilization)

  // Utilization status
  if (stats.avgTonnage < OPTIMIZATION_THRESHOLD) {
    statsRow2.getCell(6).fill = FILLS.highlightYellow as Fill
    statsRow2.getCell(7).value = '⚠️ Below optimization threshold'
    statsRow2.getCell(7).font = { ...FONTS.body, italic: true } as Font
  } else if (stats.avgUtilization >= 90) {
    statsRow2.getCell(6).fill = FILLS.highlightGreen as Fill
    statsRow2.getCell(7).value = '✓ Excellent utilization'
    statsRow2.getCell(7).font = { ...FONTS.body, italic: true, color: { argb: COLORS.success } } as Font
  } else {
    statsRow2.getCell(6).fill = FILLS.highlightGreen as Fill
  }

  const statsRow3 = worksheet.getRow(currentRow++)
  statsRow3.getCell(1).value = 'Date Range:'
  statsRow3.getCell(1).font = FONTS.bodyBold as Font
  statsRow3.getCell(2).value = `${stats.firstDate} to ${stats.lastDate}`
  statsRow3.getCell(2).font = FONTS.body as Font
  mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 4, '', 'section')

  statsRow3.getCell(5).value = 'Avg Days Between Hauls:'
  statsRow3.getCell(5).font = FONTS.bodyBold as Font
  statsRow3.getCell(6).value = stats.avgDaysBetween.toFixed(1)
  statsRow3.getCell(6).font = FONTS.body as Font

  currentRow += 2

  // ========== HAUL LOG TABLE ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Detailed Haul History', 'section')
  currentRow++

  const tableStartRow = currentRow

  // Table headers
  const tableHeaderRow = worksheet.getRow(currentRow++)
  const headers = ['Haul Date', 'Tonnage', 'Days Since Last', 'Utilization %', 'Status', 'Invoice #', 'Notes']
  headers.forEach((header, index) => {
    tableHeaderRow.getCell(index + 1).value = header
  })
  applyTableHeaderStyle(tableHeaderRow)

  // Sort hauls by date (newest first)
  const sortedHauls = [...haulLogs].sort(
    (a, b) => new Date(b.haul_date).getTime() - new Date(a.haul_date).getTime()
  )

  // Add haul rows
  sortedHauls.forEach((haul) => {
    const row = worksheet.getRow(currentRow++)

    // Date
    formatDate(row.getCell(1), haul.haul_date)

    // Tonnage
    const tonnage = haul.tonnage || 0
    formatNumber(row.getCell(2), tonnage)

    // Days since last
    if (haul.days_since_last) {
      row.getCell(3).value = haul.days_since_last
      row.getCell(3).numFmt = '#,##0'
      row.getCell(3).alignment = ALIGNMENTS.center as Alignment

      // Highlight long intervals (>14 days)
      if (haul.days_since_last > 14) {
        row.getCell(3).fill = FILLS.highlightYellow as Fill
      }
    } else {
      row.getCell(3).value = '-'
      row.getCell(3).alignment = ALIGNMENTS.center as Alignment
    }

    // Utilization %
    const utilization = (tonnage / TARGET_CAPACITY) * 100
    formatPercentage(row.getCell(4), utilization)

    // Status
    const status = getUtilizationStatus(tonnage, utilization)
    row.getCell(5).value = status.label
    row.getCell(5).font = FONTS.body as Font
    row.getCell(5).fill = status.fill as Fill
    row.getCell(5).alignment = ALIGNMENTS.center as Alignment

    // Invoice #
    if (haul.invoice_id) {
      row.getCell(6).value = haul.invoice_id
      row.getCell(6).font = FONTS.small as Font
    }

    // Notes (from status field or other metadata)
    if (haul.status) {
      row.getCell(7).value = haul.status
      row.getCell(7).font = FONTS.small as Font
    }
  })

  // Apply alternating rows
  applyAlternatingRows(worksheet, tableStartRow + 1, currentRow - 1, 1, 7)

  currentRow += 2

  // ========== UTILIZATION ANALYSIS ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Utilization Analysis', 'section')
  currentRow++

  const utilizationStats = calculateUtilizationStats(haulLogs)

  const optimalRow = worksheet.getRow(currentRow++)
  optimalRow.getCell(1).value = 'Optimal Hauls (≥85% capacity):'
  optimalRow.getCell(1).font = FONTS.bodyBold as Font
  optimalRow.getCell(2).value = utilizationStats.optimal
  optimalRow.getCell(2).font = FONTS.body as Font

  formatPercentage(optimalRow.getCell(3), (utilizationStats.optimal / haulLogs.length) * 100)
  optimalRow.getCell(3).fill = FILLS.highlightGreen as Fill

  const goodRow = worksheet.getRow(currentRow++)
  goodRow.getCell(1).value = 'Good Hauls (70-84% capacity):'
  goodRow.getCell(1).font = FONTS.bodyBold as Font
  goodRow.getCell(2).value = utilizationStats.good
  goodRow.getCell(2).font = FONTS.body as Font

  formatPercentage(goodRow.getCell(3), (utilizationStats.good / haulLogs.length) * 100)

  const lowRow = worksheet.getRow(currentRow++)
  lowRow.getCell(1).value = 'Low Utilization (<70% capacity):'
  lowRow.getCell(1).font = FONTS.bodyBold as Font
  lowRow.getCell(2).value = utilizationStats.low
  lowRow.getCell(2).font = FONTS.body as Font

  formatPercentage(lowRow.getCell(3), (utilizationStats.low / haulLogs.length) * 100)
  lowRow.getCell(3).fill = FILLS.highlightYellow as Fill

  currentRow += 2

  // Recommendation
  if (stats.avgTonnage < OPTIMIZATION_THRESHOLD) {
    const recRow = worksheet.getRow(currentRow++)
    recRow.getCell(1).value = '💡 Recommendation:'
    recRow.getCell(1).font = FONTS.bodyBold as Font

    recRow.getCell(2).value =
      `Average tonnage (${stats.avgTonnage.toFixed(2)} tons) is below the ${OPTIMIZATION_THRESHOLD} ton threshold. ` +
      'Consider installing compactor monitors to optimize pickup frequency and reduce costs.'
    recRow.getCell(2).font = FONTS.body as Font
    recRow.getCell(2).alignment = ALIGNMENTS.wrapText as Alignment
    recRow.height = 40
    mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 7, '', 'section')
    recRow.getCell(2).fill = FILLS.highlightYellow as Fill
  }

  // Add footer
  addFooter(worksheet, 1, 7)

  // Auto-size columns
  autoSizeColumns(worksheet, 12, 40)
}

/**
 * Calculate summary statistics
 */
function calculateStats(haulLogs: HaulLogRow[]): {
  avgTonnage: number
  minTonnage: number
  maxTonnage: number
  avgUtilization: number
  avgDaysBetween: number
  firstDate: string
  lastDate: string
} {
  const tonnages = haulLogs.map((h) => h.tonnage || 0)
  const avgTonnage = tonnages.reduce((sum, t) => sum + t, 0) / tonnages.length
  const minTonnage = Math.min(...tonnages)
  const maxTonnage = Math.max(...tonnages)
  const avgUtilization = (avgTonnage / TARGET_CAPACITY) * 100

  const daysWithValues = haulLogs.filter((h) => h.days_since_last).map((h) => h.days_since_last!)
  const avgDaysBetween = daysWithValues.length > 0
    ? daysWithValues.reduce((sum, d) => sum + d, 0) / daysWithValues.length
    : 0

  const sortedByDate = [...haulLogs].sort(
    (a, b) => new Date(a.haul_date).getTime() - new Date(b.haul_date).getTime()
  )

  return {
    avgTonnage,
    minTonnage,
    maxTonnage,
    avgUtilization,
    avgDaysBetween,
    firstDate: sortedByDate[0].haul_date,
    lastDate: sortedByDate[sortedByDate.length - 1].haul_date,
  }
}

/**
 * Calculate utilization statistics
 */
function calculateUtilizationStats(haulLogs: HaulLogRow[]): {
  optimal: number
  good: number
  low: number
} {
  const stats = {
    optimal: 0,
    good: 0,
    low: 0,
  }

  haulLogs.forEach((haul) => {
    const tonnage = haul.tonnage || 0
    const utilization = (tonnage / TARGET_CAPACITY) * 100

    if (utilization >= 85) {
      stats.optimal++
    } else if (utilization >= 70) {
      stats.good++
    } else {
      stats.low++
    }
  })

  return stats
}

/**
 * Get utilization status with color coding
 */
function getUtilizationStatus(tonnage: number, utilization: number): {
  label: string
  fill: Fill
} {
  if (utilization >= 85) {
    return {
      label: 'Optimal',
      fill: FILLS.highlightGreen,
    }
  } else if (utilization >= 70) {
    return {
      label: 'Good',
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }, // White/no fill
    }
  } else if (tonnage < OPTIMIZATION_THRESHOLD) {
    return {
      label: 'Low',
      fill: FILLS.highlightYellow,
    }
  } else {
    return {
      label: 'Fair',
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
    }
  }
}
