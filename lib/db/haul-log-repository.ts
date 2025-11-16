/**
 * Haul Log Repository
 *
 * Handles database operations for haul_log table (compactor projects only).
 * Tracks tonnage and frequency for capacity utilization analysis.
 *
 * Features:
 * - Batch insert optimization
 * - Automatic days-since-last calculation
 * - Status classification (normal/low/high utilization)
 * - Type-safe query builders
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type HaulLogRow = Database['public']['Tables']['haul_log']['Row']
type HaulLogInsert = Database['public']['Tables']['haul_log']['Insert']

export interface HaulLogRecord {
  id?: string
  project_id: string
  invoice_id?: string
  haul_date: string // YYYY-MM-DD
  tonnage: number
  days_since_last?: number
  status?: 'normal' | 'low_utilization' | 'high_utilization'
}

export interface BatchInsertResult {
  success: boolean
  inserted: number
  failed: number
  errors: Array<{ record: HaulLogRecord; error: string }>
}

export class HaulLogRepository {
  private supabase: SupabaseClient<Database>
  private readonly BATCH_SIZE = 1000

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Create a single haul log entry
   */
  async create(haul: HaulLogRecord): Promise<{ data: HaulLogRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('haul_log')
        .insert(this.toInsert(haul))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create haul log entry', new Error(error.message), {
          project_id: haul.project_id,
          haul_date: haul.haul_date,
        })
        return { data: null, error: error.message }
      }

      logger.debug('Haul log entry created', {
        id: data.id,
        project_id: haul.project_id,
        tonnage: haul.tonnage,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Haul log creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Batch insert haul log entries with automatic days-since-last calculation
   *
   * Entries should be pre-sorted by date (ascending) for accurate calculation
   */
  async batchInsert(hauls: HaulLogRecord[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      success: true,
      inserted: 0,
      failed: 0,
      errors: [],
    }

    if (hauls.length === 0) {
      return result
    }

    logger.info('Starting batch haul log insert', {
      total_count: hauls.length,
      batch_size: this.BATCH_SIZE,
    })

    // Calculate days-since-last for each haul
    const enrichedHauls = this.calculateDaysSinceLast(hauls)

    // Process in chunks
    for (let i = 0; i < enrichedHauls.length; i += this.BATCH_SIZE) {
      const chunk = enrichedHauls.slice(i, Math.min(i + this.BATCH_SIZE, enrichedHauls.length))

      const chunkResult = await this.insertChunk(chunk)

      result.inserted += chunkResult.inserted
      result.failed += chunkResult.failed
      result.errors.push(...chunkResult.errors)
    }

    result.success = result.failed === 0

    logger.info('Batch haul log insert completed', {
      total: hauls.length,
      inserted: result.inserted,
      failed: result.failed,
    })

    return result
  }

  /**
   * Insert a single chunk of haul logs
   */
  private async insertChunk(chunk: HaulLogRecord[]): Promise<{
    inserted: number
    failed: number
    errors: Array<{ record: HaulLogRecord; error: string }>
  }> {
    const errors: Array<{ record: HaulLogRecord; error: string }> = []

    try {
      const inserts = chunk.map((haul) => this.toInsert(haul))

      const { data, error } = await this.supabase.from('haul_log').insert(inserts).select('id')

      if (error) {
        // Fallback to individual inserts
        logger.warn('Chunk insert failed, falling back to individual inserts', {
          error: error.message,
          chunk_size: chunk.length,
        })

        let inserted = 0
        for (const haul of chunk) {
          const { error: individualError } = await this.create(haul)
          if (individualError) {
            errors.push({ record: haul, error: individualError })
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
      logger.error('Haul log chunk insert exception', error as Error)

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
   * Calculate days since last haul for each entry
   *
   * Assumes hauls are sorted by date (ascending)
   */
  private calculateDaysSinceLast(hauls: HaulLogRecord[]): HaulLogRecord[] {
    // Sort by date just in case
    const sorted = [...hauls].sort(
      (a, b) => new Date(a.haul_date).getTime() - new Date(b.haul_date).getTime()
    )

    const enriched: HaulLogRecord[] = []

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i]

      if (i === 0) {
        // First haul has no previous haul
        enriched.push({ ...current, days_since_last: undefined })
      } else {
        const previous = sorted[i - 1]
        const currentDate = new Date(current.haul_date)
        const previousDate = new Date(previous.haul_date)

        const daysDiff = Math.floor(
          (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        enriched.push({
          ...current,
          days_since_last: daysDiff > 0 ? daysDiff : undefined,
        })
      }
    }

    return enriched
  }

  /**
   * Get all haul logs for a project
   */
  async getByProjectId(projectId: string): Promise<{ data: HaulLogRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('haul_log')
        .select('*')
        .eq('project_id', projectId)
        .order('haul_date', { ascending: true })

      if (error) {
        logger.error('Failed to fetch haul logs', new Error(error.message), { project_id: projectId })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Haul log fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get haul logs for a project within a date range
   */
  async getByProjectIdAndDateRange(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: HaulLogRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('haul_log')
        .select('*')
        .eq('project_id', projectId)
        .gte('haul_date', startDate)
        .lte('haul_date', endDate)
        .order('haul_date', { ascending: true })

      if (error) {
        logger.error('Failed to fetch haul logs by date range', new Error(error.message), {
          project_id: projectId,
          start_date: startDate,
          end_date: endDate,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Haul log date range fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get haul count for a project
   */
  async getCountByProjectId(projectId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('haul_log')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if (error) {
        logger.error('Failed to count haul logs', new Error(error.message), { project_id: projectId })
        return { count: 0, error: error.message }
      }

      return { count: count || 0, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Haul log count exception', error as Error)
      return { count: 0, error: message }
    }
  }

  /**
   * Calculate average tonnage per haul for a project
   */
  async getAverageTonnage(projectId: string): Promise<{ average: number; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('haul_log')
        .select('tonnage')
        .eq('project_id', projectId)

      if (error) {
        logger.error('Failed to calculate average tonnage', new Error(error.message), { project_id: projectId })
        return { average: 0, error: error.message }
      }

      if (!data || data.length === 0) {
        return { average: 0, error: null }
      }

      const total = data.reduce((sum: number, haul: { tonnage: number | null }) => sum + (haul.tonnage || 0), 0)
      const average = total / data.length

      return { average, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Average tonnage calculation exception', error as Error)
      return { average: 0, error: message }
    }
  }

  /**
   * Delete all haul logs for a project
   */
  async deleteByProjectId(projectId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('haul_log').delete().eq('project_id', projectId)

      if (error) {
        logger.error('Failed to delete project haul logs', new Error(error.message), { project_id: projectId })
        return { success: false, error: error.message }
      }

      logger.info('Project haul logs deleted', { project_id: projectId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project haul log delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Convert HaulLogRecord to database insert format
   */
  private toInsert(haul: HaulLogRecord): HaulLogInsert {
    return {
      project_id: haul.project_id,
      invoice_id: haul.invoice_id,
      haul_date: haul.haul_date,
      tonnage: haul.tonnage,
      days_since_last: haul.days_since_last,
      status: haul.status,
    }
  }
}
