/**
 * Expense Analysis Tab Generator
 *
 * Creates detailed expense breakdown with:
 * - Monthly invoice summary table
 * - Charges breakdown by category
 * - Trend analysis (if multiple months)
 * - Per-unit cost metrics
 *
 * Layout:
 * 1. Header
 * 2. Monthly Summary Table (invoice date, number, vendor, total)
 * 3. Charges Breakdown (disposal, pickup, rental, contamination, bulk, other)
 * 4. Category Analysis (% of total, per-unit costs)
 * 5. Trend Charts (if applicable)
 */

import type { Worksheet, Font, Fill, Alignment, Borders } from 'exceljs'
import type { WasteWiseAnalyticsCompleteResult, InvoiceData } from '@/lib/skills/types'
import type { InvoiceDataRow } from '@/lib/skills/types'
import type { ProjectRow } from '@/lib/skills/types'
import {
  applyHeaderStyle,
  applyTableHeaderStyle,
  applyAlternatingRows,
  mergeCells,
  formatCurrency,
  formatPercentage,
  formatDate,
  autoSizeColumns,
  addFooter,
  FONTS,
  FILLS,
  ALIGNMENTS,
  BORDERS,
} from '../formatters'

interface ChargesSummary {
  disposal: number
  pickupFees: number
  rental: number
  contamination: number
  bulkService: number
  other: number
  total: number
}

/**
 * Generate Expense Analysis worksheet
 */
export function generateExpenseAnalysis(
  worksheet: Worksheet,
  result: WasteWiseAnalyticsCompleteResult,
  project: ProjectRow,
  invoices: InvoiceDataRow[]
): void {
  worksheet.name = 'Expense Analysis'

  let currentRow = 1

  // ========== HEADER ==========
  const headerRow = worksheet.getRow(currentRow)
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Expense Analysis', 'header')
  applyHeaderStyle(headerRow)
  currentRow += 2

  // ========== MONTHLY INVOICE SUMMARY ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Invoice Summary', 'section')
  currentRow++

  const tableStartRow = currentRow

  // Table headers
  const tableHeaderRow = worksheet.getRow(currentRow++)
  const headers = ['Invoice Date', 'Invoice #', 'Vendor', 'Service Type', 'Tonnage', 'Hauls', 'Total']
  headers.forEach((header, index) => {
    tableHeaderRow.getCell(index + 1).value = header
  })
  applyTableHeaderStyle(tableHeaderRow)

  // Sort invoices by date (newest first)
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
  )

  // Add invoice rows
  sortedInvoices.forEach((invoice) => {
    const row = worksheet.getRow(currentRow++)

    formatDate(row.getCell(1), invoice.invoice_date)
    row.getCell(2).value = invoice.invoice_number
    row.getCell(2).font = FONTS.body as Font

    row.getCell(3).value = invoice.vendor_name
    row.getCell(3).font = FONTS.body as Font

    row.getCell(4).value = invoice.service_type || 'N/A'
    row.getCell(4).font = FONTS.body as Font

    if (invoice.tonnage) {
      row.getCell(5).value = invoice.tonnage
      row.getCell(5).numFmt = '#,##0.00'
      row.getCell(5).alignment = ALIGNMENTS.right as Alignment
    }

    if (invoice.hauls) {
      row.getCell(6).value = invoice.hauls
      row.getCell(6).numFmt = '#,##0'
      row.getCell(6).alignment = ALIGNMENTS.right as Alignment
    }

    formatCurrency(row.getCell(7), invoice.total_amount)
  })

  // Apply alternating row colors
  applyAlternatingRows(worksheet, tableStartRow + 1, currentRow - 1, 1, 7)

  // Add total row
  const totalRow = worksheet.getRow(currentRow++)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(1).font = FONTS.bodyBold as Font

  const totalAmount = sortedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
  formatCurrency(totalRow.getCell(7), totalAmount)
  totalRow.getCell(7).font = FONTS.bodyBold as Font
  totalRow.getCell(7).fill = FILLS.highlightYellow as Fill

  // Add border to total row
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = BORDERS.top as Partial<Borders>
  })

  currentRow += 2

  // ========== CHARGES BREAKDOWN ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Charges Breakdown by Category', 'section')
  currentRow++

  const chargesSummary = calculateChargesSummary(invoices)

  const chargesStartRow = currentRow

  // Charges table headers
  const chargesHeaderRow = worksheet.getRow(currentRow++)
  const chargesHeaders = ['Category', 'Total Amount', '% of Total', 'Monthly Average', 'Per Unit']
  chargesHeaders.forEach((header, index) => {
    chargesHeaderRow.getCell(index + 1).value = header
  })
  applyTableHeaderStyle(chargesHeaderRow)

  const monthsInPeriod = calculateMonths(result.summary.dateRange.start, result.summary.dateRange.end)

  // Disposal
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Disposal',
    chargesSummary.disposal,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Pickup Fees
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Pickup Fees',
    chargesSummary.pickupFees,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Rental
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Rental',
    chargesSummary.rental,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Contamination
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Contamination',
    chargesSummary.contamination,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Bulk Service
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Bulk Service',
    chargesSummary.bulkService,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Other
  addChargeRow(
    worksheet.getRow(currentRow++),
    'Other',
    chargesSummary.other,
    chargesSummary.total,
    monthsInPeriod,
    project.units
  )

  // Apply alternating rows
  applyAlternatingRows(worksheet, chargesStartRow + 1, currentRow - 1, 1, 5)

  // Total row
  const chargesTotalRow = worksheet.getRow(currentRow++)
  chargesTotalRow.getCell(1).value = 'TOTAL'
  chargesTotalRow.getCell(1).font = FONTS.bodyBold as Font

  formatCurrency(chargesTotalRow.getCell(2), chargesSummary.total)
  chargesTotalRow.getCell(2).font = FONTS.bodyBold as Font
  chargesTotalRow.getCell(2).fill = FILLS.highlightYellow as Fill

  formatPercentage(chargesTotalRow.getCell(3), 100)
  chargesTotalRow.getCell(3).font = FONTS.bodyBold as Font

  formatCurrency(chargesTotalRow.getCell(4), chargesSummary.total / monthsInPeriod)
  chargesTotalRow.getCell(4).font = FONTS.bodyBold as Font

  formatCurrency(chargesTotalRow.getCell(5), chargesSummary.total / monthsInPeriod / project.units)
  chargesTotalRow.getCell(5).font = FONTS.bodyBold as Font

  chargesTotalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = BORDERS.top as Partial<Borders>
  })

  currentRow += 2

  // ========== KEY INSIGHTS ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 7, 'Key Insights', 'section')
  currentRow++

  // Contamination percentage
  const contaminationPct = (chargesSummary.contamination / chargesSummary.total) * 100
  const contaminationRow = worksheet.getRow(currentRow++)
  contaminationRow.getCell(1).value = 'Contamination as % of Total:'
  contaminationRow.getCell(1).font = FONTS.bodyBold as Font

  formatPercentage(contaminationRow.getCell(2), contaminationPct)
  if (contaminationPct > 3) {
    contaminationRow.getCell(2).fill = FILLS.highlightRed as Fill
    contaminationRow.getCell(3).value = 'Above 3% threshold - consider contamination reduction program'
    contaminationRow.getCell(3).font = { ...FONTS.body, italic: true } as Font
    mergeCells(worksheet, currentRow - 1, 3, currentRow - 1, 7, '', 'section')
  } else {
    contaminationRow.getCell(2).fill = FILLS.highlightGreen as Fill
  }

  // Bulk service analysis
  const avgBulkMonthly = chargesSummary.bulkService / monthsInPeriod
  if (avgBulkMonthly > 0) {
    const bulkRow = worksheet.getRow(currentRow++)
    bulkRow.getCell(1).value = 'Average Monthly Bulk Service:'
    bulkRow.getCell(1).font = FONTS.bodyBold as Font

    formatCurrency(bulkRow.getCell(2), avgBulkMonthly)
    if (avgBulkMonthly > 500) {
      bulkRow.getCell(2).fill = FILLS.highlightYellow as Fill
      bulkRow.getCell(3).value = 'Consider bulk subscription to reduce costs'
      bulkRow.getCell(3).font = { ...FONTS.body, italic: true } as Font
      mergeCells(worksheet, currentRow - 1, 3, currentRow - 1, 7, '', 'section')
    }
  }

  // Largest expense category
  const largestCategory = getLargestCategory(chargesSummary)
  const largestRow = worksheet.getRow(currentRow++)
  largestRow.getCell(1).value = 'Largest Expense Category:'
  largestRow.getCell(1).font = FONTS.bodyBold as Font

  largestRow.getCell(2).value = largestCategory.name
  largestRow.getCell(2).font = FONTS.body as Font

  formatCurrency(largestRow.getCell(3), largestCategory.amount)

  formatPercentage(largestRow.getCell(4), largestCategory.percentage)

  // Add footer
  addFooter(worksheet, 1, 7)

  // Auto-size columns
  autoSizeColumns(worksheet, 12, 50)
}

/**
 * Calculate charges summary from invoice data
 */
function calculateChargesSummary(invoices: InvoiceDataRow[]): ChargesSummary {
  const summary: ChargesSummary = {
    disposal: 0,
    pickupFees: 0,
    rental: 0,
    contamination: 0,
    bulkService: 0,
    other: 0,
    total: 0,
  }

  invoices.forEach((invoice) => {
    const charges = invoice.charges as any

    if (charges) {
      summary.disposal += charges.disposal || 0
      summary.pickupFees += charges.pickup_fees || 0
      summary.rental += charges.rental || 0
      summary.contamination += charges.contamination || 0
      summary.bulkService += charges.bulk_service || 0
      summary.other += charges.other || 0
    }

    summary.total += invoice.total_amount
  })

  return summary
}

/**
 * Add a charge category row
 */
function addChargeRow(
  row: import('exceljs').Row,
  category: string,
  amount: number,
  total: number,
  months: number,
  units: number
): void {
  row.getCell(1).value = category
  row.getCell(1).font = FONTS.body as Font

  formatCurrency(row.getCell(2), amount)

  const percentage = total > 0 ? (amount / total) * 100 : 0
  formatPercentage(row.getCell(3), percentage)

  const monthlyAvg = amount / months
  formatCurrency(row.getCell(4), monthlyAvg)

  const perUnit = monthlyAvg / units
  formatCurrency(row.getCell(5), perUnit)
}

/**
 * Calculate number of months in period
 */
function calculateMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const monthsDiff =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

  return Math.max(monthsDiff, 1)
}

/**
 * Get largest expense category
 */
function getLargestCategory(summary: ChargesSummary): { name: string; amount: number; percentage: number } {
  const categories = [
    { name: 'Disposal', amount: summary.disposal },
    { name: 'Pickup Fees', amount: summary.pickupFees },
    { name: 'Rental', amount: summary.rental },
    { name: 'Contamination', amount: summary.contamination },
    { name: 'Bulk Service', amount: summary.bulkService },
    { name: 'Other', amount: summary.other },
  ]

  const largest = categories.reduce((max, cat) => (cat.amount > max.amount ? cat : max))

  return {
    name: largest.name,
    amount: largest.amount,
    percentage: summary.total > 0 ? (largest.amount / summary.total) * 100 : 0,
  }
}
