/**
 * Skills Index
 *
 * Registers all available skills with the skill registry.
 * Import this file to initialize all skills.
 */

import { CompactorOptimizationSkill } from "./compactor-optimization";
import { WasteWiseAnalyticsSkill } from "./wastewise-analytics";
import { BatchExtractorSkill } from "./batch-extractor";
import { ContractExtractorSkill } from "./contract-extractor";
import { RegulatoryResearchSkill } from "./regulatory-research";
import { skillRegistry } from "../registry";
import { logger } from "@/lib/observability/logger";

/**
 * Register all skills with the registry
 *
 * Call this function during app initialization to make all skills available.
 */
export function registerAllSkills(): void {
  logger.info("Registering all skills...");

  // Phase 2.1: Compactor optimization
  const compactorSkill = new CompactorOptimizationSkill();
  skillRegistry.register(compactorSkill);

  // Phase 2.2: WasteWise Analytics Orchestrator
  const wastewiseSkill = new WasteWiseAnalyticsSkill();
  skillRegistry.register(wastewiseSkill);

  // Phase 4: Batch Extractor
  const batchExtractorSkill = new BatchExtractorSkill();
  skillRegistry.register(batchExtractorSkill);

  // Phase 5: Contract Extractor
  const contractExtractorSkill = new ContractExtractorSkill();
  skillRegistry.register(contractExtractorSkill);

  // Phase 9: Regulatory Research
  const regulatorySkill = new RegulatoryResearchSkill();
  skillRegistry.register(regulatorySkill);

  logger.info(`Registered ${skillRegistry.count()} skill(s)`, {
    skills: skillRegistry.list(),
  });
}

// Export skills for direct use if needed
export {
  CompactorOptimizationSkill,
  WasteWiseAnalyticsSkill,
  BatchExtractorSkill,
  ContractExtractorSkill,
  RegulatoryResearchSkill,
};
