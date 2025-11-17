/**
 * Report Generation Exports
 *
 * Central export point for Excel and HTML report generation
 */

// Excel generation
export {
  generateExcelReport,
  validateExcelInput,
  type ExcelGeneratorInput,
  type ExcelGeneratorOutput,
} from './excel-generator'

// Excel formatters (for custom tab creation)
export * from './formatters'

// Individual tab generators (for testing or custom workflows)
export { generateExecutiveSummary } from './excel-tabs/executive-summary'
export { generateExpenseAnalysis } from './excel-tabs/expense-analysis'
export { generateHaulLog } from './excel-tabs/haul-log'
export { generateOptimization } from './excel-tabs/optimization'
export { generateContractTerms } from './excel-tabs/contract-terms'

// HTML generation
export {
  generateHtmlDashboard,
  type HtmlGeneratorInput,
  type HtmlGeneratorOutput,
} from './html-generator'

// Report storage
export {
  uploadReport,
  uploadReports,
  deleteOldReports,
  type UploadReportInput,
  type UploadReportOutput,
} from './storage'
