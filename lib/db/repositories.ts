/**
 * Repository Factory
 *
 * Provides convenient factory functions to instantiate repositories
 * with the appropriate Supabase client based on the context.
 *
 * Usage:
 * ```typescript
 * import { createServerRepositories } from '@/lib/db/repositories'
 *
 * const repos = await createServerRepositories()
 * const projects = await repos.projects.getByUserId(userId)
 * ```
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

import { ProjectRepository } from './project-repository'
import { ProjectFilesRepository } from './project-files-repository'
import { InvoiceRepository } from './invoice-repository'
import { HaulLogRepository } from './haul-log-repository'
import { ContractRepository } from './contract-repository'
import { OptimizationRepository } from './optimization-repository'
import { RegulatoryRepository } from './regulatory-repository'
import { SkillsConfigRepository } from './skills-config-repository'
import { AnalysisJobsRepository } from './analysis-jobs-repository'

export interface Repositories {
  projects: ProjectRepository
  projectFiles: ProjectFilesRepository
  invoices: InvoiceRepository
  haulLogs: HaulLogRepository
  contracts: ContractRepository
  optimizations: OptimizationRepository
  regulatory: RegulatoryRepository
  skillsConfig: SkillsConfigRepository
  analysisJobs: AnalysisJobsRepository
}

/**
 * Create repositories for server-side usage
 * Uses server Supabase client with proper auth context
 */
export async function createServerRepositories(): Promise<Repositories> {
  const supabase = await createServerClient()

  return {
    projects: new ProjectRepository(supabase),
    projectFiles: new ProjectFilesRepository(supabase),
    invoices: new InvoiceRepository(supabase),
    haulLogs: new HaulLogRepository(supabase),
    contracts: new ContractRepository(supabase),
    optimizations: new OptimizationRepository(supabase),
    regulatory: new RegulatoryRepository(supabase),
    skillsConfig: new SkillsConfigRepository(supabase),
    analysisJobs: new AnalysisJobsRepository(supabase),
  }
}

/**
 * Create repositories for client-side usage
 * Uses browser Supabase client
 */
export function createClientRepositories(): Repositories {
  const supabase = createBrowserClient()

  return {
    projects: new ProjectRepository(supabase),
    projectFiles: new ProjectFilesRepository(supabase),
    invoices: new InvoiceRepository(supabase),
    haulLogs: new HaulLogRepository(supabase),
    contracts: new ContractRepository(supabase),
    optimizations: new OptimizationRepository(supabase),
    regulatory: new RegulatoryRepository(supabase),
    skillsConfig: new SkillsConfigRepository(supabase),
    analysisJobs: new AnalysisJobsRepository(supabase),
  }
}

/**
 * Create repositories with a custom Supabase client
 * Useful for workers, tests, or special contexts
 */
export function createRepositoriesWithClient(
  supabase: SupabaseClient<Database>
): Repositories {
  return {
    projects: new ProjectRepository(supabase),
    projectFiles: new ProjectFilesRepository(supabase),
    invoices: new InvoiceRepository(supabase),
    haulLogs: new HaulLogRepository(supabase),
    contracts: new ContractRepository(supabase),
    optimizations: new OptimizationRepository(supabase),
    regulatory: new RegulatoryRepository(supabase),
    skillsConfig: new SkillsConfigRepository(supabase),
    analysisJobs: new AnalysisJobsRepository(supabase),
  }
}

/**
 * Get a single repository instance for server-side usage
 *
 * Example:
 * ```typescript
 * const projectRepo = await getServerRepository('projects')
 * ```
 */
export async function getServerRepository<K extends keyof Repositories>(
  key: K
): Promise<Repositories[K]> {
  const repos = await createServerRepositories()
  return repos[key]
}

/**
 * Get a single repository instance for client-side usage
 *
 * Example:
 * ```typescript
 * const projectRepo = getClientRepository('projects')
 * ```
 */
export function getClientRepository<K extends keyof Repositories>(
  key: K
): Repositories[K] {
  const repos = createClientRepositories()
  return repos[key]
}
