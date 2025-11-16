/**
 * Database Repositories Index
 *
 * Exports all repository classes for easy import throughout the application.
 *
 * Usage:
 * ```typescript
 * import { InvoiceRepository, HaulLogRepository } from '@/lib/db'
 *
 * const invoiceRepo = new InvoiceRepository()
 * const haulsRepo = new HaulLogRepository()
 * ```
 */

export { InvoiceRepository } from './invoice-repository'
export type { InvoiceRecord, InvoiceCharges, BatchInsertResult as InvoiceBatchResult } from './invoice-repository'

export { HaulLogRepository } from './haul-log-repository'
export type { HaulLogRecord, BatchInsertResult as HaulLogBatchResult } from './haul-log-repository'

export { ContractRepository } from './contract-repository'
export type {
  ContractRecord,
  ContractClauses,
  CalendarReminder,
} from './contract-repository'

export { OptimizationRepository } from './optimization-repository'
export type {
  OptimizationRecord,
  OpportunityType,
  Confidence,
  CalculationBreakdown,
  ContactInfo,
} from './optimization-repository'
