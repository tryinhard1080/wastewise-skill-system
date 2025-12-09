/**
 * Database Repositories Index
 *
 * Exports all repository classes for easy import throughout the application.
 *
 * Usage:
 * ```typescript
 * import { InvoiceRepository, HaulLogRepository, ProjectRepository } from '@/lib/db'
 *
 * const invoiceRepo = new InvoiceRepository()
 * const haulsRepo = new HaulLogRepository()
 * const projectRepo = new ProjectRepository()
 * ```
 */

// Project Repository
export { ProjectRepository } from './project-repository'
export type {
  ProjectRecord,
  ProjectStatus,
  EquipmentType,
  PropertyType,
} from './project-repository'

// Project Files Repository
export { ProjectFilesRepository } from './project-files-repository'
export type {
  ProjectFileRecord,
  FileType,
  ProcessingStatus,
} from './project-files-repository'

// Invoice Repository
export { InvoiceRepository } from './invoice-repository'
export type { InvoiceRecord, InvoiceCharges, BatchInsertResult as InvoiceBatchResult } from './invoice-repository'

// Haul Log Repository
export { HaulLogRepository } from './haul-log-repository'
export type { HaulLogRecord, BatchInsertResult as HaulLogBatchResult } from './haul-log-repository'

// Contract Repository
export { ContractRepository } from './contract-repository'
export type {
  ContractRecord,
  ContractClauses,
  CalendarReminder,
} from './contract-repository'

// Optimization Repository
export { OptimizationRepository } from './optimization-repository'
export type {
  OptimizationRecord,
  OpportunityType,
  Confidence,
  CalculationBreakdown,
  ContactInfo,
} from './optimization-repository'

// Regulatory Repository
export { RegulatoryRepository } from './regulatory-repository'
export type {
  RegulatoryRecord,
  OrdinanceRecord,
  ConfidenceLevel,
  WasteRequirements,
  RecyclingRequirements,
  CompostingRequirements,
  Penalties,
  LicensedHauler,
  RegulatoryContact,
} from './regulatory-repository'

// Skills Config Repository
export { SkillsConfigRepository } from './skills-config-repository'
export type {
  SkillsConfigRecord,
  ConversionRates,
  Thresholds,
} from './skills-config-repository'

// Analysis Jobs Repository
export { AnalysisJobsRepository } from './analysis-jobs-repository'
export type {
  AnalysisJobRecord,
  JobStatus,
  JobType,
  AIUsage,
} from './analysis-jobs-repository'
