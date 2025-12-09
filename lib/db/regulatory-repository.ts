/**
 * Regulatory Compliance Repository
 *
 * Handles database operations for regulatory_compliance and ordinance_database tables.
 * Manages caching and research of waste management ordinances by location.
 *
 * Features:
 * - Two-tier caching (ordinance_database + regulatory_compliance)
 * - Location-based ordinance lookup
 * - Source tracking for transparency
 * - Type-safe JSONB requirement storage
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type RegulatoryRow = Database['public']['Tables']['regulatory_compliance']['Row']
type RegulatoryInsert = Database['public']['Tables']['regulatory_compliance']['Insert']
type RegulatoryUpdate = Database['public']['Tables']['regulatory_compliance']['Update']

type OrdinanceRow = Database['public']['Tables']['ordinance_database']['Row']
type OrdinanceInsert = Database['public']['Tables']['ordinance_database']['Insert']
type OrdinanceUpdate = Database['public']['Tables']['ordinance_database']['Update']

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface WasteRequirements {
  mandatory?: boolean
  threshold_units?: number
  capacity_requirement?: string
  service_frequency?: string
  [key: string]: any
}

export interface RecyclingRequirements {
  mandatory?: boolean
  threshold_units?: number
  materials?: string[]
  container_requirements?: string
  [key: string]: any
}

export interface CompostingRequirements {
  required?: boolean
  effective_date?: string
  threshold_units?: number
  accepted_materials?: string[]
  [key: string]: any
}

export interface Penalties {
  violation_type?: string
  fine_amount?: string
  enforcement_authority?: string
  [key: string]: any
}

export interface LicensedHauler {
  name: string
  phone?: string
  email?: string
  website?: string
  license_number?: string
}

export interface RegulatoryContact {
  department?: string
  phone?: string
  email?: string
  website?: string
}

export interface RegulatoryRecord {
  id?: string
  project_id: string
  city: string
  state: string
  confidence_score?: ConfidenceLevel
  sources_consulted?: string[]
  waste_requirements?: WasteRequirements
  recycling_requirements?: RecyclingRequirements
  composting_requirements?: CompostingRequirements
  penalties?: Penalties
  licensed_haulers?: LicensedHauler[]
  regulatory_contacts?: RegulatoryContact
  cached_data?: boolean
}

export interface OrdinanceRecord {
  id?: string
  city: string
  state: string
  location_key: string // Format: "city_state"
  confidence?: ConfidenceLevel
  primary_source?: string
  recycling_mandatory?: boolean
  threshold_units?: number
  capacity_requirement?: string
  service_frequency?: string
  composting_required?: boolean
  composting_effective_date?: string
  composting_threshold_units?: number
  accepted_materials?: string[]
  penalties?: Penalties
  licensed_haulers?: LicensedHauler[]
  contacts?: RegulatoryContact
}

export class RegulatoryRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Get regulatory compliance for a project
   */
  async getByProjectId(
    projectId: string
  ): Promise<{ data: RegulatoryRecord | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('regulatory_compliance')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch regulatory compliance', new Error(error.message), {
          project_id: projectId,
        })
        return { data: null, error: error.message }
      }

      if (!data) {
        return { data: null, error: null }
      }

      const record: RegulatoryRecord = this.rowToRecord(data)
      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Regulatory compliance fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Create regulatory compliance record for a project
   */
  async create(
    regulatory: RegulatoryRecord
  ): Promise<{ data: RegulatoryRecord | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('regulatory_compliance')
        .insert(this.toInsert(regulatory))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create regulatory compliance', new Error(error.message), {
          project_id: regulatory.project_id,
          location: `${regulatory.city}, ${regulatory.state}`,
        })
        return { data: null, error: error.message }
      }

      const record: RegulatoryRecord = this.rowToRecord(data)

      logger.info('Regulatory compliance created', {
        id: record.id,
        project_id: regulatory.project_id,
        location: `${regulatory.city}, ${regulatory.state}`,
        cached: regulatory.cached_data,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Regulatory compliance creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Update regulatory compliance
   */
  async update(
    projectId: string,
    updates: Partial<RegulatoryRecord>
  ): Promise<{ data: RegulatoryRecord | null; error: string | null }> {
    try {
      const updateData: RegulatoryUpdate = {}

      if (updates.confidence_score !== undefined) updateData.confidence_score = updates.confidence_score
      if (updates.sources_consulted !== undefined)
        updateData.sources_consulted = updates.sources_consulted as any
      if (updates.waste_requirements !== undefined)
        updateData.waste_requirements = updates.waste_requirements as any
      if (updates.recycling_requirements !== undefined)
        updateData.recycling_requirements = updates.recycling_requirements as any
      if (updates.composting_requirements !== undefined)
        updateData.composting_requirements = updates.composting_requirements as any
      if (updates.penalties !== undefined) updateData.penalties = updates.penalties as any
      if (updates.licensed_haulers !== undefined)
        updateData.licensed_haulers = updates.licensed_haulers as any
      if (updates.regulatory_contacts !== undefined)
        updateData.regulatory_contacts = updates.regulatory_contacts as any
      if (updates.cached_data !== undefined) updateData.cached_data = updates.cached_data

      updateData.last_updated = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('regulatory_compliance')
        .update(updateData)
        .eq('project_id', projectId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update regulatory compliance', new Error(error.message), {
          project_id: projectId,
        })
        return { data: null, error: error.message }
      }

      const record: RegulatoryRecord = this.rowToRecord(data)

      logger.info('Regulatory compliance updated', {
        project_id: projectId,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Regulatory compliance update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get ordinance from cache by location
   */
  async getOrdinanceByLocation(
    city: string,
    state: string
  ): Promise<{ data: OrdinanceRecord | null; error: string | null }> {
    try {
      const locationKey = this.generateLocationKey(city, state)

      const { data, error } = await this.supabase
        .from('ordinance_database')
        .select('*')
        .eq('location_key', locationKey)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch ordinance', new Error(error.message), {
          location: `${city}, ${state}`,
        })
        return { data: null, error: error.message }
      }

      if (!data) {
        logger.debug('No cached ordinance found', { location: `${city}, ${state}` })
        return { data: null, error: null }
      }

      const record: OrdinanceRecord = this.ordinanceRowToRecord(data)

      logger.info('Ordinance loaded from cache', {
        location: `${city}, ${state}`,
        last_verified: data.last_verified,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Ordinance fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Cache ordinance data
   * Requires service_role permissions
   */
  async cacheOrdinance(
    ordinance: OrdinanceRecord
  ): Promise<{ data: OrdinanceRecord | null; error: string | null }> {
    try {
      // Upsert: update if exists, insert if not
      const { data, error } = await this.supabase
        .from('ordinance_database')
        .upsert(this.ordinanceToInsert(ordinance), {
          onConflict: 'location_key',
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to cache ordinance', new Error(error.message), {
          location: `${ordinance.city}, ${ordinance.state}`,
        })
        return { data: null, error: error.message }
      }

      const record: OrdinanceRecord = this.ordinanceRowToRecord(data)

      logger.info('Ordinance cached', {
        location: `${ordinance.city}, ${ordinance.state}`,
        location_key: ordinance.location_key,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Ordinance cache exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Generate location key from city and state
   */
  generateLocationKey(city: string, state: string): string {
    return `${city.toLowerCase().replace(/\s+/g, '_')}_${state.toLowerCase()}`
  }

  /**
   * Convert database row to RegulatoryRecord
   */
  private rowToRecord(row: RegulatoryRow): RegulatoryRecord {
    return {
      id: row.id,
      project_id: row.project_id,
      city: row.city,
      state: row.state,
      confidence_score: (row.confidence_score as ConfidenceLevel) || undefined,
      sources_consulted: (row.sources_consulted as string[]) || undefined,
      waste_requirements: (row.waste_requirements as WasteRequirements) || undefined,
      recycling_requirements: (row.recycling_requirements as RecyclingRequirements) || undefined,
      composting_requirements: (row.composting_requirements as CompostingRequirements) || undefined,
      penalties: (row.penalties as Penalties) || undefined,
      licensed_haulers: (row.licensed_haulers as LicensedHauler[]) || undefined,
      regulatory_contacts: (row.regulatory_contacts as RegulatoryContact) || undefined,
      cached_data: row.cached_data ?? undefined,
    }
  }

  /**
   * Convert RegulatoryRecord to database insert format
   */
  private toInsert(regulatory: RegulatoryRecord): RegulatoryInsert {
    return {
      project_id: regulatory.project_id,
      city: regulatory.city,
      state: regulatory.state,
      confidence_score: regulatory.confidence_score,
      sources_consulted: regulatory.sources_consulted as any,
      waste_requirements: regulatory.waste_requirements as any,
      recycling_requirements: regulatory.recycling_requirements as any,
      composting_requirements: regulatory.composting_requirements as any,
      penalties: regulatory.penalties as any,
      licensed_haulers: regulatory.licensed_haulers as any,
      regulatory_contacts: regulatory.regulatory_contacts as any,
      cached_data: regulatory.cached_data,
    }
  }

  /**
   * Convert ordinance database row to OrdinanceRecord
   */
  private ordinanceRowToRecord(row: OrdinanceRow): OrdinanceRecord {
    return {
      id: row.id,
      city: row.city,
      state: row.state,
      location_key: row.location_key,
      confidence: (row.confidence as ConfidenceLevel) || undefined,
      primary_source: row.primary_source ?? undefined,
      recycling_mandatory: row.recycling_mandatory ?? undefined,
      threshold_units: row.threshold_units ?? undefined,
      capacity_requirement: row.capacity_requirement ?? undefined,
      service_frequency: row.service_frequency ?? undefined,
      composting_required: row.composting_required ?? undefined,
      composting_effective_date: row.composting_effective_date ?? undefined,
      composting_threshold_units: row.composting_threshold_units ?? undefined,
      accepted_materials: (row.accepted_materials as string[]) || undefined,
      penalties: (row.penalties as Penalties) || undefined,
      licensed_haulers: (row.licensed_haulers as LicensedHauler[]) || undefined,
      contacts: (row.contacts as RegulatoryContact) || undefined,
    }
  }

  /**
   * Convert OrdinanceRecord to database insert format
   */
  private ordinanceToInsert(ordinance: OrdinanceRecord): OrdinanceInsert {
    return {
      city: ordinance.city,
      state: ordinance.state,
      location_key: ordinance.location_key,
      confidence: ordinance.confidence,
      primary_source: ordinance.primary_source,
      recycling_mandatory: ordinance.recycling_mandatory,
      threshold_units: ordinance.threshold_units,
      capacity_requirement: ordinance.capacity_requirement,
      service_frequency: ordinance.service_frequency,
      composting_required: ordinance.composting_required,
      composting_effective_date: ordinance.composting_effective_date,
      composting_threshold_units: ordinance.composting_threshold_units,
      accepted_materials: ordinance.accepted_materials as any,
      penalties: ordinance.penalties as any,
      licensed_haulers: ordinance.licensed_haulers as any,
      contacts: ordinance.contacts as any,
    }
  }
}
