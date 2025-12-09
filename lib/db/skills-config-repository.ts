/**
 * Skills Configuration Repository
 *
 * Handles database operations for skills_config table.
 * CRITICAL: Ensures consistent conversion rates and thresholds across all skills.
 *
 * Features:
 * - Configuration loading and caching
 * - Version management
 * - Type-safe JSONB config access
 * - Enable/disable skill toggles
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type SkillsConfigRow = Database['public']['Tables']['skills_config']['Row']
type SkillsConfigInsert = Database['public']['Tables']['skills_config']['Insert']
type SkillsConfigUpdate = Database['public']['Tables']['skills_config']['Update']

export interface ConversionRates {
  compactor_ypd: number // yards per dumpster (compactor equivalent)
  dumpster_ypd: number // yards per dumpster
  target_capacity: number // target tons per haul
}

export interface Thresholds {
  compactor_tons: number // minimum tons for compactor optimization
  contamination_pct: number // contamination percentage threshold
  bulk_monthly: number // monthly bulk service cost threshold
  leaseup_variance: number // lease-up occupancy variance threshold
}

export interface SkillsConfigRecord {
  id?: string
  skill_name: string
  skill_version: string
  conversion_rates: ConversionRates
  thresholds: Thresholds
  enabled?: boolean
  last_validated?: string
}

// In-memory cache for skills config
const configCache = new Map<string, SkillsConfigRecord>()
const cacheExpiry = new Map<string, number>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class SkillsConfigRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Get configuration for a specific skill
   * Uses caching to minimize database queries
   */
  async getBySkillName(
    skillName: string
  ): Promise<{ data: SkillsConfigRecord | null; error: string | null }> {
    // Check cache first
    const cached = this.getCached(skillName)
    if (cached) {
      logger.debug('Skills config loaded from cache', { skill_name: skillName })
      return { data: cached, error: null }
    }

    try {
      const { data, error } = await this.supabase
        .from('skills_config')
        .select('*')
        .eq('skill_name', skillName)
        .eq('enabled', true)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch skill config', new Error(error.message), {
          skill_name: skillName,
        })
        return { data: null, error: error.message }
      }

      if (!data) {
        logger.warn('Skill config not found', { skill_name: skillName })
        return { data: null, error: 'Skill configuration not found' }
      }

      const record: SkillsConfigRecord = {
        id: data.id,
        skill_name: data.skill_name,
        skill_version: data.skill_version,
        conversion_rates: data.conversion_rates as ConversionRates,
        thresholds: data.thresholds as Thresholds,
        enabled: data.enabled ?? true,
        last_validated: data.last_validated ?? undefined,
      }

      // Cache the result
      this.setCached(skillName, record)

      logger.info('Skills config loaded', {
        skill_name: skillName,
        version: record.skill_version,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Skill config fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get all enabled skills configurations
   */
  async getAllEnabled(): Promise<{ data: SkillsConfigRecord[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('skills_config')
        .select('*')
        .eq('enabled', true)
        .order('skill_name', { ascending: true })

      if (error) {
        logger.error('Failed to fetch enabled skills configs', new Error(error.message))
        return { data: [], error: error.message }
      }

      const records: SkillsConfigRecord[] = (data || []).map((row) => ({
        id: row.id,
        skill_name: row.skill_name,
        skill_version: row.skill_version,
        conversion_rates: row.conversion_rates as ConversionRates,
        thresholds: row.thresholds as Thresholds,
        enabled: row.enabled ?? true,
        last_validated: row.last_validated ?? undefined,
      }))

      return { data: records, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Enabled skills configs fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Create a new skill configuration
   * Requires service_role permissions
   */
  async create(
    config: SkillsConfigRecord
  ): Promise<{ data: SkillsConfigRecord | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('skills_config')
        .insert(this.toInsert(config))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create skill config', new Error(error.message), {
          skill_name: config.skill_name,
        })
        return { data: null, error: error.message }
      }

      const record: SkillsConfigRecord = {
        id: data.id,
        skill_name: data.skill_name,
        skill_version: data.skill_version,
        conversion_rates: data.conversion_rates as ConversionRates,
        thresholds: data.thresholds as Thresholds,
        enabled: data.enabled ?? true,
        last_validated: data.last_validated ?? undefined,
      }

      // Clear cache on create
      this.clearCache(config.skill_name)

      logger.info('Skill config created', {
        skill_name: config.skill_name,
        version: config.skill_version,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Skill config creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Update skill configuration
   * Requires service_role permissions
   */
  async update(
    skillName: string,
    updates: Partial<SkillsConfigRecord>
  ): Promise<{ data: SkillsConfigRecord | null; error: string | null }> {
    try {
      const updateData: SkillsConfigUpdate = {}

      if (updates.skill_version !== undefined) updateData.skill_version = updates.skill_version
      if (updates.conversion_rates !== undefined)
        updateData.conversion_rates = updates.conversion_rates as any
      if (updates.thresholds !== undefined) updateData.thresholds = updates.thresholds as any
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled
      if (updates.last_validated !== undefined) updateData.last_validated = updates.last_validated

      const { data, error } = await this.supabase
        .from('skills_config')
        .update(updateData)
        .eq('skill_name', skillName)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update skill config', new Error(error.message), {
          skill_name: skillName,
        })
        return { data: null, error: error.message }
      }

      const record: SkillsConfigRecord = {
        id: data.id,
        skill_name: data.skill_name,
        skill_version: data.skill_version,
        conversion_rates: data.conversion_rates as ConversionRates,
        thresholds: data.thresholds as Thresholds,
        enabled: data.enabled ?? true,
        last_validated: data.last_validated ?? undefined,
      }

      // Clear cache on update
      this.clearCache(skillName)

      logger.info('Skill config updated', {
        skill_name: skillName,
      })

      return { data: record, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Skill config update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Enable or disable a skill
   */
  async setEnabled(
    skillName: string,
    enabled: boolean
  ): Promise<{ data: SkillsConfigRecord | null; error: string | null }> {
    return this.update(skillName, { enabled })
  }

  /**
   * Clear cache for a specific skill
   */
  clearCache(skillName: string): void {
    configCache.delete(skillName)
    cacheExpiry.delete(skillName)
    logger.debug('Skill config cache cleared', { skill_name: skillName })
  }

  /**
   * Clear all cached configurations
   */
  clearAllCache(): void {
    configCache.clear()
    cacheExpiry.clear()
    logger.debug('All skill configs cache cleared')
  }

  /**
   * Get cached config if still valid
   */
  private getCached(skillName: string): SkillsConfigRecord | null {
    const expiry = cacheExpiry.get(skillName)
    if (!expiry || Date.now() > expiry) {
      configCache.delete(skillName)
      cacheExpiry.delete(skillName)
      return null
    }

    return configCache.get(skillName) || null
  }

  /**
   * Cache a config
   */
  private setCached(skillName: string, config: SkillsConfigRecord): void {
    configCache.set(skillName, config)
    cacheExpiry.set(skillName, Date.now() + CACHE_TTL)
  }

  /**
   * Convert SkillsConfigRecord to database insert format
   */
  private toInsert(config: SkillsConfigRecord): SkillsConfigInsert {
    return {
      skill_name: config.skill_name,
      skill_version: config.skill_version,
      conversion_rates: config.conversion_rates as any,
      thresholds: config.thresholds as any,
      enabled: config.enabled,
      last_validated: config.last_validated,
    }
  }
}
