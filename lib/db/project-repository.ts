/**
 * Project Repository
 *
 * Handles database operations for projects table.
 * Projects are the main entity that owns all analysis data.
 *
 * Features:
 * - CRUD operations with RLS enforcement
 * - Status and progress tracking
 * - User ownership validation
 * - Type-safe query builders
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type EquipmentType = 'COMPACTOR' | 'DUMPSTER' | 'MIXED'
export type PropertyType = 'Garden-Style' | 'Mid-Rise' | 'High-Rise'

export interface ProjectRecord {
  id?: string
  user_id: string
  property_name: string
  units: number
  city: string
  state: string
  property_type?: PropertyType
  status?: ProjectStatus
  progress?: number
  total_savings?: number
  equipment_type?: EquipmentType
  analysis_period_months?: number
  error_message?: string
}

export class ProjectRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Create a new project
   */
  async create(project: ProjectRecord): Promise<{ data: ProjectRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert(this.toInsert(project))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create project', new Error(error.message), {
          property_name: project.property_name,
          user_id: project.user_id,
        })
        return { data: null, error: error.message }
      }

      logger.info('Project created', {
        id: data.id,
        property_name: project.property_name,
        user_id: project.user_id,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get a project by ID
   */
  async getById(id: string): Promise<{ data: ProjectRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch project', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get all projects for a user
   */
  async getByUserId(userId: string): Promise<{ data: ProjectRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch user projects', new Error(error.message), { user_id: userId })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('User projects fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    updates: Partial<ProjectRecord>
  ): Promise<{ data: ProjectRow | null; error: string | null }> {
    try {
      const updateData: ProjectUpdate = {}

      if (updates.property_name !== undefined) updateData.property_name = updates.property_name
      if (updates.units !== undefined) updateData.units = updates.units
      if (updates.city !== undefined) updateData.city = updates.city
      if (updates.state !== undefined) updateData.state = updates.state
      if (updates.property_type !== undefined) updateData.property_type = updates.property_type
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.progress !== undefined) updateData.progress = updates.progress
      if (updates.total_savings !== undefined) updateData.total_savings = updates.total_savings
      if (updates.equipment_type !== undefined) updateData.equipment_type = updates.equipment_type
      if (updates.analysis_period_months !== undefined)
        updateData.analysis_period_months = updates.analysis_period_months
      if (updates.error_message !== undefined) updateData.error_message = updates.error_message

      const { data, error } = await this.supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update project', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      logger.debug('Project updated', { id })
      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Update project status
   */
  async updateStatus(
    id: string,
    status: ProjectStatus,
    progress?: number,
    errorMessage?: string
  ): Promise<{ data: ProjectRow | null; error: string | null }> {
    const updates: Partial<ProjectRecord> = { status }
    if (progress !== undefined) updates.progress = progress
    if (errorMessage !== undefined) updates.error_message = errorMessage

    return this.update(id, updates)
  }

  /**
   * Update project savings
   */
  async updateSavings(
    id: string,
    totalSavings: number
  ): Promise<{ data: ProjectRow | null; error: string | null }> {
    return this.update(id, { total_savings: totalSavings })
  }

  /**
   * Delete a project (and cascade to related data via FK constraints)
   */
  async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('projects').delete().eq('id', id)

      if (error) {
        logger.error('Failed to delete project', new Error(error.message), { id })
        return { success: false, error: error.message }
      }

      logger.info('Project deleted', { id })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: ProjectStatus): Promise<{ data: ProjectRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch projects by status', new Error(error.message), { status })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Projects by status fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get project count for a user
   */
  async getCountByUserId(userId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to count projects', new Error(error.message), { user_id: userId })
        return { count: 0, error: error.message }
      }

      return { count: count || 0, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project count exception', error as Error)
      return { count: 0, error: message }
    }
  }

  /**
   * Convert ProjectRecord to database insert format
   */
  private toInsert(project: ProjectRecord): ProjectInsert {
    return {
      user_id: project.user_id,
      property_name: project.property_name,
      units: project.units,
      city: project.city,
      state: project.state,
      property_type: project.property_type,
      status: project.status,
      progress: project.progress,
      total_savings: project.total_savings,
      equipment_type: project.equipment_type,
      analysis_period_months: project.analysis_period_months,
      error_message: project.error_message,
    }
  }
}
