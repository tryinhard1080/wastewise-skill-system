/**
 * Contract Terms Tab Generator
 *
 * Creates detailed contract analysis with:
 * - Contract dates and term information
 * - Service specifications
 * - Pricing structure
 * - Terms and obligations
 * - Calendar reminders for key dates
 *
 * Layout:
 * 1. Header
 * 2. Contract Overview (dates, term length, auto-renewal)
 * 3. Service Details
 * 4. Pricing Structure
 * 5. Key Terms & Obligations
 * 6. Calendar Reminders
 */

import type { Worksheet } from 'exceljs'
import type { ContractExtractorResult } from '@/lib/skills/types'
import {
  applyHeaderStyle,
  applySubheaderStyle,
  applyTableHeaderStyle,
  applyAlternatingRows,
  mergeCells,
  addKeyValueRow,
  formatCurrency,
  formatDate,
  autoSizeColumns,
  addFooter,
  FONTS,
  FILLS,
  ALIGNMENTS,
  BORDERS,
  COLORS,
} from '../formatters'

/**
 * Generate Contract Terms worksheet
 */
export function generateContractTerms(
  worksheet: Worksheet,
  contractResult: ContractExtractorResult | undefined
): void {
  worksheet.name = 'Contract Terms'

  if (!contractResult || contractResult.contracts.length === 0) {
    worksheet.getRow(1).getCell(1).value = 'No contract data available.'
    worksheet.getRow(1).getCell(1).font = FONTS.body as any
    return
  }

  // Use first contract (typically there's only one per project)
  const contract = contractResult.contracts[0]

  let currentRow = 1

  // ========== HEADER ==========
  const headerRow = worksheet.getRow(currentRow)
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Service Contract Terms', 'header')
  applyHeaderStyle(headerRow)
  currentRow += 2

  // ========== CONTRACT OVERVIEW ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Contract Overview', 'section')
  currentRow++

  addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Property:', contract.property.name)

  if (contract.property.address) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Address:', contract.property.address)
  }

  if (contract.property.units) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Units:', contract.property.units.toString())
  }

  addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Vendor:', contract.vendor.name)

  if (contract.vendor.contact) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Contact:', contract.vendor.contact)
  }

  if (contract.vendor.phone) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Phone:', contract.vendor.phone)
  }

  if (contract.vendor.email) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Email:', contract.vendor.email)
  }

  currentRow++

  // ========== CONTRACT DATES ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Contract Dates & Term', 'section')
  currentRow++

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Effective Date:',
    contract.contractDates.effectiveDate,
    'date'
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Expiration Date:',
    contract.contractDates.expirationDate,
    'date'
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Term Length:',
    `${contract.contractDates.termMonths} months`
  )

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Auto-Renewal:',
    contract.contractDates.autoRenew ? 'Yes' : 'No'
  )

  // Highlight expiration date if approaching
  const expirationDate = new Date(contract.contractDates.expirationDate)
  const today = new Date()
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiration < 90 && daysUntilExpiration > 0) {
    const expRow = worksheet.getRow(currentRow - 3)
    expRow.getCell(2).fill = FILLS.highlightYellow as any
    expRow.getCell(2).font = { ...FONTS.bodyBold, color: { argb: COLORS.warning } } as any
  } else if (daysUntilExpiration <= 0) {
    const expRow = worksheet.getRow(currentRow - 3)
    expRow.getCell(2).fill = FILLS.highlightRed as any
    expRow.getCell(2).font = { ...FONTS.bodyBold, color: { argb: COLORS.danger } } as any
  }

  currentRow++

  // ========== SERVICE DETAILS ==========
  if (contract.services && contract.services.length > 0) {
    mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Service Details', 'section')
    currentRow++

    const tableStartRow = currentRow

    // Table headers
    const tableHeaderRow = worksheet.getRow(currentRow++)
    const headers = ['Container Type', 'Size (yards)', 'Frequency', 'Service Days']
    headers.forEach((header, index) => {
      tableHeaderRow.getCell(index + 1).value = header
    })
    applyTableHeaderStyle(tableHeaderRow)

    // Service rows
    contract.services.forEach((service) => {
      const row = worksheet.getRow(currentRow++)

      row.getCell(1).value = service.containerType
      row.getCell(1).font = FONTS.body as any

      row.getCell(2).value = service.containerSize
      row.getCell(2).numFmt = '#,##0.0'
      row.getCell(2).alignment = ALIGNMENTS.center as any

      row.getCell(3).value = service.frequency
      row.getCell(3).font = FONTS.body as any
      row.getCell(3).alignment = ALIGNMENTS.center as any

      if (service.serviceDays) {
        row.getCell(4).value = service.serviceDays
        row.getCell(4).font = FONTS.body as any
      }
    })

    applyAlternatingRows(worksheet, tableStartRow + 1, currentRow - 1, 1, 4)

    currentRow++
  }

  // ========== PRICING STRUCTURE ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Pricing Structure', 'section')
  currentRow++

  if (contract.pricing.monthlyBase) {
    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Monthly Base Rate:',
      contract.pricing.monthlyBase,
      'currency'
    )
  }

  if (contract.pricing.perPickup) {
    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Per Pickup Fee:',
      contract.pricing.perPickup,
      'currency'
    )
  }

  if (contract.pricing.perTon) {
    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Per Ton Rate:',
      contract.pricing.perTon,
      'currency'
    )
  }

  if (contract.pricing.fuelSurcharge) {
    addKeyValueRow(
      worksheet,
      worksheet.getRow(currentRow++),
      'Fuel Surcharge:',
      contract.pricing.fuelSurcharge,
      'currency'
    )
  }

  if (contract.pricing.escalationClause) {
    const escalationRow = worksheet.getRow(currentRow++)
    escalationRow.getCell(1).value = 'Escalation Clause:'
    escalationRow.getCell(1).font = FONTS.bodyBold as any

    escalationRow.getCell(2).value = contract.pricing.escalationClause
    escalationRow.getCell(2).font = FONTS.body as any
    escalationRow.getCell(2).alignment = ALIGNMENTS.wrapText as any
    escalationRow.height = 30
    mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 6, '', 'section')
  }

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'CPI Adjustment:',
    contract.pricing.cpiAdjustment ? 'Yes' : 'No'
  )

  if (contract.pricing.otherFees && contract.pricing.otherFees.length > 0) {
    currentRow++
    const otherFeesRow = worksheet.getRow(currentRow++)
    otherFeesRow.getCell(1).value = 'Other Fees:'
    otherFeesRow.getCell(1).font = FONTS.bodyBold as any

    contract.pricing.otherFees.forEach((fee) => {
      const feeRow = worksheet.getRow(currentRow++)
      feeRow.getCell(1).value = `  • ${fee.description}`
      feeRow.getCell(1).font = FONTS.body as any

      formatCurrency(feeRow.getCell(2), fee.amount)
    })
  }

  currentRow++

  // ========== KEY TERMS & OBLIGATIONS ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Key Terms & Obligations', 'section')
  currentRow++

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Termination Notice Period:',
    `${contract.terms.terminationNoticeDays} days`
  )

  if (contract.terms.earlyTerminationPenalty) {
    const penaltyRow = worksheet.getRow(currentRow++)
    penaltyRow.getCell(1).value = 'Early Termination Penalty:'
    penaltyRow.getCell(1).font = FONTS.bodyBold as any

    penaltyRow.getCell(2).value = contract.terms.earlyTerminationPenalty
    penaltyRow.getCell(2).font = FONTS.body as any
    penaltyRow.getCell(2).alignment = ALIGNMENTS.wrapText as any
    penaltyRow.height = 30
    mergeCells(worksheet, currentRow - 1, 2, currentRow - 1, 6, '', 'section')
    penaltyRow.getCell(2).fill = FILLS.highlightYellow as any
  }

  addKeyValueRow(
    worksheet,
    worksheet.getRow(currentRow++),
    'Insurance Required:',
    contract.terms.insuranceRequired ? 'Yes' : 'No'
  )

  addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Payment Terms:', contract.terms.paymentTerms)

  if (contract.terms.latePenalty) {
    addKeyValueRow(worksheet, worksheet.getRow(currentRow++), 'Late Payment Penalty:', contract.terms.latePenalty)
  }

  currentRow += 2

  // ========== CALENDAR REMINDERS ==========
  mergeCells(worksheet, currentRow, 1, currentRow, 6, 'Important Calendar Reminders', 'section')
  currentRow++

  const reminderRow1 = worksheet.getRow(currentRow++)
  reminderRow1.getCell(1).value = '⏰ 90 days before expiration:'
  reminderRow1.getCell(1).font = FONTS.bodyBold as any

  const reminder90Date = new Date(expirationDate)
  reminder90Date.setDate(reminder90Date.getDate() - 90)
  formatDate(reminderRow1.getCell(2), reminder90Date.toISOString().split('T')[0])

  reminderRow1.getCell(3).value = 'Begin contract renewal negotiation or vendor RFP process'
  reminderRow1.getCell(3).font = FONTS.body as any
  reminderRow1.getCell(3).alignment = ALIGNMENTS.wrapText as any
  mergeCells(worksheet, currentRow - 1, 3, currentRow - 1, 6, '', 'section')

  const reminderRow2 = worksheet.getRow(currentRow++)
  reminderRow2.getCell(1).value = '⏰ 30 days before expiration:'
  reminderRow2.getCell(1).font = FONTS.bodyBold as any

  const reminder30Date = new Date(expirationDate)
  reminder30Date.setDate(reminder30Date.getDate() - 30)
  formatDate(reminderRow2.getCell(2), reminder30Date.toISOString().split('T')[0])

  reminderRow2.getCell(3).value = 'Finalize contract renewal or transition plan'
  reminderRow2.getCell(3).font = FONTS.body as any
  reminderRow2.getCell(3).alignment = ALIGNMENTS.wrapText as any
  mergeCells(worksheet, currentRow - 1, 3, currentRow - 1, 6, '', 'section')

  const reminderRow3 = worksheet.getRow(currentRow++)
  reminderRow3.getCell(1).value = '⏰ 7 days before expiration:'
  reminderRow3.getCell(1).font = FONTS.bodyBold as any

  const reminder7Date = new Date(expirationDate)
  reminder7Date.setDate(reminder7Date.getDate() - 7)
  formatDate(reminderRow3.getCell(2), reminder7Date.toISOString().split('T')[0])

  reminderRow3.getCell(3).value = 'Confirm service transition or renewal is complete'
  reminderRow3.getCell(3).font = FONTS.body as any
  reminderRow3.getCell(3).alignment = ALIGNMENTS.wrapText as any
  mergeCells(worksheet, currentRow - 1, 3, currentRow - 1, 6, '', 'section')

  // Add footer
  addFooter(worksheet, 1, 6)

  // Auto-size columns
  autoSizeColumns(worksheet, 20, 60)
}
