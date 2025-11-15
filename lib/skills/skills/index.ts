/**
 * Skills Index
 *
 * Registers all available skills with the skill registry.
 * Import this file to initialize all skills.
 */

import { CompactorOptimizationSkill } from './compactor-optimization'
import { skillRegistry } from '../registry'
import { logger } from '@/lib/observability/logger'

/**
 * Register all skills with the registry
 *
 * Call this function during app initialization to make all skills available.
 */
export function registerAllSkills(): void {
  logger.info('Registering all skills...')

  // Phase 2.1: Only compactor optimization
  const compactorSkill = new CompactorOptimizationSkill()
  skillRegistry.register(compactorSkill)

  // Future: Register other skills here as they are implemented
  // skillRegistry.register(new WastewiseAnalyticsSkill())
  // skillRegistry.register(new ContractExtractorSkill())
  // skillRegistry.register(new RegulatoryResearchSkill())
  // skillRegistry.register(new BatchExtractorSkill())

  logger.info(`Registered ${skillRegistry.count()} skill(s)`, {
    skills: skillRegistry.list(),
  })
}

// Export skills for direct use if needed
export { CompactorOptimizationSkill }
