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

class SkillRegistry {
  private skills = new Map<string, Skill>()

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
  async getConfig(name: string): Promise<SkillConfig> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('skills_config')
      .select('*')
      .eq('skill_name', name)
      .single()

    if (error) {
      throw new Error(`Failed to get config for skill '${name}': ${error.message}`)
    }

    if (!data) {
      throw new Error(`No configuration found for skill '${name}'`)
    }

    // Parse JSONB fields
    const conversionRates = data.conversion_rates as any
    const thresholds = data.thresholds as any

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
  }

  /**
   * Check if a skill is registered
   *
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
