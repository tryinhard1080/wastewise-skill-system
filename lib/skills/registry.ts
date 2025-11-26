/**
 * Skill Registry
 *
 * Simple registry for skill registration and retrieval.
 * Phase 2.1: Basic implementation
 * Future: Add validation, versioning, dynamic loading
 */

import { Skill, SkillConfig, RegisteredSkill } from './types'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'


import fs from 'fs'
fs.appendFileSync('debug-worker.txt', '!!! LOADING REGISTRY.TS - VERSION WITH FIX - ' + new Date().toISOString() + ' !!!\n')
console.log('!!! LOADING REGISTRY.TS - VERSION WITH FIX - ' + new Date().toISOString() + ' !!!')


class SkillRegistry {
  private skills = new Map<string, Skill>()

  constructor() {
    fs.appendFileSync('debug-worker.txt', 'DEBUG: SkillRegistry constructor called\n')
    console.log('DEBUG: SkillRegistry constructor called')
  }

  /**
   * Register a skill
   *
   * @param skill - Skill instance to register
   */
  register(skill: Skill): void {
    if (this.skills.has(skill.name)) {
      logger.warn(`Skill '${skill.name}' is already registered. Overwriting.`)
    }

    this.skills.set(skill.name, skill)
    logger.debug(`Registered skill: ${skill.name} (v${skill.version})`)
  }

  /**
   * Get a skill by name
   *
   * @param name - Skill name
   * @returns Skill instance or undefined
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name)
  }

  /**
   * Get all registered skills
   *
   * @returns Array of all registered skills
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get skill configuration from database
   *
   * @param name - Skill name
   * @returns Skill configuration
   */
  async getConfig(name: string, client?: any): Promise<SkillConfig> {
    try {
      fs.appendFileSync('debug-worker.txt', `DEBUG: getConfig called for '${name}'\n`)
      console.log(`DEBUG: getConfig called for '${name}'`)
      const supabase = client || await createClient()

      let data, error
      try {
        fs.appendFileSync('debug-worker.txt', `DEBUG: Querying supabase for '${name}'\n`)
        console.log(`DEBUG: Querying supabase for '${name}'`)
        const result = await supabase
          .from('skills_config')
          .select('*')
          .eq('skill_name', name)
          .eq('skill_name', name)

        data = result.data
        error = result.error
      } catch (err: any) {
        fs.appendFileSync('debug-worker.txt', `DEBUG: Supabase query threw error: ${err.message}\n`)
        logger.error(`Supabase query threw error for skill '${name}'`, err)
        throw new Error(`DEBUG: Supabase query threw: ${err.message}`)
      }

      if (error) {
        logger.error(`Failed to get config for skill '${name}'`, new Error(error.message))
        throw new Error(`DEBUG: Failed to get config for skill '${name}': ${error.message}`)
      }

      if (!data || data.length === 0) {
        logger.error(`No configuration found for skill '${name}'`)
        throw new Error(`DEBUG: No configuration found for skill '${name}'`)
      }

      if (data.length > 1) {
        logger.warn(`Found ${data.length} configs for skill '${name}'. Using the first one.`, undefined, { ids: data.map((d: any) => d.id) })
      }

      const configData = data[0]

      // Parse JSONB fields
      const conversionRates = configData.conversion_rates as any
      const thresholds = configData.thresholds as any

      return {
        conversionRates: {
          compactorYpd: conversionRates.compactor_ypd,
          dumpsterYpd: conversionRates.dumpster_ypd,
          targetCapacity: conversionRates.target_capacity,
        },
        thresholds: {
          compactorTons: thresholds.compactor_tons,
          contaminationPct: thresholds.contamination_pct,
          bulkMonthly: thresholds.bulk_monthly,
          leaseupVariance: thresholds.leaseup_variance,
        },
      }
    } catch (err: any) {
      fs.appendFileSync('debug-worker.txt', `DEBUG: getConfig TOP LEVEL CATCH: ${err.message}\n`)
      throw err
    }
  }

  /**
   * @param name - Skill name
   * @returns True if registered
   */
  has(name: string): boolean {
    return this.skills.has(name)
  }

  /**
   * Get count of registered skills
   *
   * @returns Number of registered skills
   */
  count(): number {
    return this.skills.size
  }

  /**
   * List all registered skill names
   *
   * @returns Array of skill names
   */
  list(): string[] {
    return Array.from(this.skills.keys())
  }
}

// Export class and singleton instance
export { SkillRegistry }
export const skillRegistry = new SkillRegistry()
