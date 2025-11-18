/**
 * Excel Report Generator
 *
 * Main orchestrator for generating complete Excel workbooks with all tabs:
 * - Executive Summary
 * - Expense Analysis
 * - Haul Log (compactor only)
 * - Optimization Opportunities
 * - Contract Terms (if available)
 *
 * Features:
 * - Generates in-memory workbook (Buffer)
 * - Professional styling throughout
 * - Tab ordering and conditional inclusion
 * - Error handling and graceful degradation
 */

import ExcelJS from 'exceljs'
import type {
  WasteWiseAnalyticsCompleteResult,
  ProjectRow,
  InvoiceDataRow,
  HaulLogRow,
} from '@/lib/skills/types'
import { generateExecutiveSummary } from './excel-tabs/executive-summary'
import { generateExpenseAnalysis } from './excel-tabs/expense-analysis'
import { generateHaulLog } from './excel-tabs/haul-log'
import { generateOptimization } from './excel-tabs/optimization'
import { generateContractTerms } from './excel-tabs/contract-terms'
import { logger } from '@/lib/observability/logger'

export interface ExcelGeneratorInput {
  /** Complete analysis result from WasteWise Analytics */
  result: WasteWiseAnalyticsCompleteResult

  /** Project information */
  project: ProjectRow

  /** Invoice data rows */
  invoices: InvoiceDataRow[]

  /** Haul log data (compactor projects only) */
  haulLogs?: HaulLogRow[]
}

export interface ExcelGeneratorOutput {
  /** Excel workbook as a buffer (ready to save or send) */
  buffer: Buffer

  /** File size in bytes */
  size: number

  /** Suggested filename */
  filename: string

  /** Metadata about generated workbook */
  metadata: {
    tabsGenerated: string[]
    totalTabs: number
    generatedAt: string
  }
}

/**
 * Generate complete Excel workbook with all analysis tabs
 */
export async function generateExcelReport(
  input: ExcelGeneratorInput
): Promise<ExcelGeneratorOutput> {
  const startTime = Date.now()

  logger.info('Starting Excel report generation', {
    projectId: input.project.id,
    propertyName: input.project.property_name,
  })

  try {
    // Create new workbook
    const workbook = new ExcelJS.Workbook()

    // Set workbook properties
    workbook.creator = 'WasteWise by THE Trash Hub'
    workbook.lastModifiedBy = 'WasteWise'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.properties.date1904 = false

    const tabsGenerated: string[] = []

    // ========== TAB 1: EXECUTIVE SUMMARY ==========
    try {
      const executiveSummarySheet = workbook.addWorksheet('Executive Summary')
      generateExecutiveSummary(executiveSummarySheet, input.result, input.project)
      tabsGenerated.push('Executive Summary')
      logger.debug('Generated Executive Summary tab')
    } catch (error) {
      logger.error('Failed to generate Executive Summary tab', error as Error)
      // Continue - don't fail entire report for one tab
    }

    // ========== TAB 2: EXPENSE ANALYSIS ==========
    try {
      const expenseAnalysisSheet = workbook.addWorksheet('Expense Analysis')
      generateExpenseAnalysis(
        expenseAnalysisSheet,
        input.result,
        input.project,
        input.invoices
      )
      tabsGenerated.push('Expense Analysis')
      logger.debug('Generated Expense Analysis tab')
    } catch (error) {
      logger.error('Failed to generate Expense Analysis tab', error as Error)
    }

    // ========== TAB 3: HAUL LOG (COMPACTOR ONLY) ==========
    if (input.project.equipment_type === 'COMPACTOR' && input.haulLogs && input.haulLogs.length > 0) {
      try {
        const haulLogSheet = workbook.addWorksheet('Haul Log')
        generateHaulLog(haulLogSheet, input.haulLogs, input.project)
        tabsGenerated.push('Haul Log')
        logger.debug('Generated Haul Log tab')
      } catch (error) {
        logger.error('Failed to generate Haul Log tab', error as Error)
      }
    }

    // ========== TAB 4: OPTIMIZATION OPPORTUNITIES ==========
    try {
      const optimizationSheet = workbook.addWorksheet('Optimization')
      generateOptimization(optimizationSheet, input.result)
      tabsGenerated.push('Optimization')
      logger.debug('Generated Optimization tab')
    } catch (error) {
      logger.error('Failed to generate Optimization tab', error as Error)
    }

    // ========== TAB 5: CONTRACT TERMS (IF AVAILABLE) ==========
    if (input.result.contractTerms && input.result.contractTerms.contracts.length > 0) {
      try {
        const contractTermsSheet = workbook.addWorksheet('Contract Terms')
        generateContractTerms(contractTermsSheet, input.result.contractTerms)
        tabsGenerated.push('Contract Terms')
        logger.debug('Generated Contract Terms tab')
      } catch (error) {
        logger.error('Failed to generate Contract Terms tab', error as Error)
      }
    }

    // ========== GENERATE BUFFER ==========
    const buffer = await workbook.xlsx.writeBuffer()

    const executionTime = Date.now() - startTime

    // Generate filename
    const filename = generateFilename(input.project)

    logger.info('Excel report generation complete', {
      projectId: input.project.id,
      tabsGenerated: tabsGenerated.length,
      size: buffer.byteLength,
      executionTime,
    })

    return {
      buffer: Buffer.from(buffer),
      size: buffer.byteLength,
      filename,
      metadata: {
        tabsGenerated,
        totalTabs: tabsGenerated.length,
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logger.error('Excel report generation failed', error as Error, {
      projectId: input.project.id,
    })
    throw new Error(
      `Failed to generate Excel report: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate standardized filename for Excel report
 */
function generateFilename(project: ProjectRow): string {
  const propertyName = project.property_name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50)

  const date = new Date().toISOString().split('T')[0]

  return `WasteWise_Analysis_${propertyName}_${date}.xlsx`
}

/**
 * Validate minimum requirements for Excel generation
 */
export function validateExcelInput(input: ExcelGeneratorInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!input.result) {
    errors.push('Analysis result is required')
  }

  if (!input.project) {
    errors.push('Project information is required')
  }

  if (!input.invoices || input.invoices.length === 0) {
    errors.push('At least one invoice is required')
  }

  if (input.project?.equipment_type === 'COMPACTOR' && (!input.haulLogs || input.haulLogs.length === 0)) {
    logger.warn('Compactor project missing haul log data - Haul Log tab will be empty')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
