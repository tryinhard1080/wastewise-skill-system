/**
 * Invoice Data Repository
 *
 * Handles all database operations for invoice_data table with
 * proper error handling, batch operations, and type safety.
 *
 * Features:
 * - Batch insert optimization (max 1000 rows)
 * - Graceful unique constraint handling
 * - Type-safe query builders
 * - Comprehensive error handling
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type InvoiceRow = Database['public']['Tables']['invoice_data']['Row']
type InvoiceInsert = Database['public']['Tables']['invoice_data']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoice_data']['Update']

export interface InvoiceCharges {
  disposal?: number
  pickup_fees?: number
  rental?: number
  contamination?: number
  bulk_service?: number
  other?: number
}

export interface InvoiceRecord {
  id?: string
  project_id: string
  source_file_id?: string
  invoice_number?: string
  invoice_date: string // YYYY-MM-DD
  vendor_name: string
  service_type?: string
  total_amount: number
  tonnage?: number
  hauls?: number
  charges?: InvoiceCharges
  notes?: string
}

export interface BatchInsertResult {
  success: boolean
  inserted: number
  failed: number
  errors: Array<{ record: InvoiceRecord; error: string }>
}

export class InvoiceRepository {
  private supabase: SupabaseClient<Database>
  private readonly BATCH_SIZE = 1000

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Create a single invoice record
   */
  async create(invoice: InvoiceRecord): Promise<{ data: InvoiceRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_data')
        .insert(this.toInsert(invoice))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create invoice', new Error(error.message), {
          invoice_number: invoice.invoice_number,
          project_id: invoice.project_id,
        })
        return { data: null, error: error.message }
      }

      logger.debug('Invoice created', {
        id: data.id,
        invoice_number: invoice.invoice_number,
        project_id: invoice.project_id,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Batch insert invoices with optimized chunking and error handling
   *
   * Splits large batches into chunks of BATCH_SIZE to avoid
   * database timeouts and memory issues.
   */
  async batchInsert(invoices: InvoiceRecord[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      success: true,
      inserted: 0,
      failed: 0,
      errors: [],
    }

    if (invoices.length === 0) {
      return result
    }

    logger.info(`Starting batch invoice insert`, {
      total_count: invoices.length,
      batch_size: this.BATCH_SIZE,
    })

    // Process in chunks
    for (let i = 0; i < invoices.length; i += this.BATCH_SIZE) {
      const chunk = invoices.slice(i, Math.min(i + this.BATCH_SIZE, invoices.length))

      const chunkResult = await this.insertChunk(chunk)

      result.inserted += chunkResult.inserted
      result.failed += chunkResult.failed
      result.errors.push(...chunkResult.errors)
    }

    result.success = result.failed === 0

    logger.info('Batch invoice insert completed', {
      total: invoices.length,
      inserted: result.inserted,
      failed: result.failed,
    })

    return result
  }

  /**
   * Insert a single chunk of invoices
   */
  private async insertChunk(chunk: InvoiceRecord[]): Promise<{
    inserted: number
    failed: number
    errors: Array<{ record: InvoiceRecord; error: string }>
  }> {
    const errors: Array<{ record: InvoiceRecord; error: string }> = []

    try {
      const inserts = chunk.map((invoice) => this.toInsert(invoice))

      const { data, error } = await this.supabase
        .from('invoice_data')
        .insert(inserts)
        .select('id')

      if (error) {
        // If bulk insert fails, try individual inserts for better error reporting
        logger.warn('Chunk insert failed, falling back to individual inserts', {
          error: error.message,
          chunk_size: chunk.length,
        })

        let inserted = 0
        for (const invoice of chunk) {
          const { error: individualError } = await this.create(invoice)
          if (individualError) {
            errors.push({ record: invoice, error: individualError })
          } else {
            inserted++
          }
        }

        return {
          inserted,
          failed: chunk.length - inserted,
          errors,
        }
      }

      return {
        inserted: data?.length || 0,
        failed: 0,
        errors: [],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Chunk insert exception', error as Error)

      // Mark all records in chunk as failed
      chunk.forEach((record) => {
        errors.push({ record, error: message })
      })

      return {
        inserted: 0,
        failed: chunk.length,
        errors,
      }
    }
  }

  /**
   * Get all invoices for a project
   */
  async getByProjectId(projectId: string): Promise<{ data: InvoiceRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_data')
        .select('*')
        .eq('project_id', projectId)
        .order('invoice_date', { ascending: true })

      if (error) {
        logger.error('Failed to fetch invoices', new Error(error.message), { project_id: projectId })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get invoices for a project within a date range
   */
  async getByProjectIdAndDateRange(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: InvoiceRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date', { ascending: true })

      if (error) {
        logger.error('Failed to fetch invoices by date range', new Error(error.message), {
          project_id: projectId,
          start_date: startDate,
          end_date: endDate,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice date range fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Update an invoice record
   */
  async update(
    id: string,
    updates: Partial<InvoiceRecord>
  ): Promise<{ data: InvoiceRow | null; error: string | null }> {
    try {
      const updateData: InvoiceUpdate = {}

      if (updates.invoice_number !== undefined) updateData.invoice_number = updates.invoice_number
      if (updates.invoice_date !== undefined) updateData.invoice_date = updates.invoice_date
      if (updates.vendor_name !== undefined) updateData.vendor_name = updates.vendor_name
      if (updates.service_type !== undefined) updateData.service_type = updates.service_type
      if (updates.total_amount !== undefined) updateData.total_amount = updates.total_amount
      if (updates.tonnage !== undefined) updateData.tonnage = updates.tonnage
      if (updates.hauls !== undefined) updateData.hauls = updates.hauls
      if (updates.charges !== undefined) updateData.charges = updates.charges as any
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { data, error } = await this.supabase
        .from('invoice_data')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update invoice', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      logger.debug('Invoice updated', { id })
      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Delete an invoice record
   */
  async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('invoice_data').delete().eq('id', id)

      if (error) {
        logger.error('Failed to delete invoice', new Error(error.message), { id })
        return { success: false, error: error.message }
      }

      logger.debug('Invoice deleted', { id })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Delete all invoices for a project
   */
  async deleteByProjectId(projectId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('invoice_data').delete().eq('project_id', projectId)

      if (error) {
        logger.error('Failed to delete project invoices', new Error(error.message), { project_id: projectId })
        return { success: false, error: error.message }
      }

      logger.info('Project invoices deleted', { project_id: projectId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project invoice delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Get invoice count for a project
   */
  async getCountByProjectId(projectId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('invoice_data')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if (error) {
        logger.error('Failed to count invoices', new Error(error.message), { project_id: projectId })
        return { count: 0, error: error.message }
      }

      return { count: count || 0, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Invoice count exception', error as Error)
      return { count: 0, error: message }
    }
  }

  /**
   * Convert InvoiceRecord to database insert format
   */
  private toInsert(invoice: InvoiceRecord): InvoiceInsert {
    return {
      project_id: invoice.project_id,
      source_file_id: invoice.source_file_id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      vendor_name: invoice.vendor_name,
      service_type: invoice.service_type,
      total_amount: invoice.total_amount,
      tonnage: invoice.tonnage,
      hauls: invoice.hauls,
      charges: invoice.charges as any,
      notes: invoice.notes,
    }
  }
}
