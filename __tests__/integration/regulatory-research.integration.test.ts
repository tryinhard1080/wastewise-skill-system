/**
 * Regulatory Research Skill Integration Tests
 *
 * These tests call the REAL Exa and Anthropic APIs.
 * Only run when API keys are available.
 *
 * Run with: pnpm test:integration __tests__/integration/regulatory-research.integration.test.ts
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { RegulatoryResearchSkill } from '@/lib/skills/skills/regulatory-research'
import type { SkillContext } from '@/lib/skills/types'
import type { Database } from '@/types/database.types'

type ProjectRow = Database['public']['Tables']['projects']['Row']

// Skip these tests if API keys are not configured
const runIntegrationTests = process.env.EXA_API_KEY && process.env.ANTHROPIC_API_KEY

describe.skipIf(!runIntegrationTests)('RegulatoryResearchSkill - Integration Tests', () => {
  let skill: RegulatoryResearchSkill
  let austinContext: SkillContext
  let chicagoContext: SkillContext

  beforeAll(() => {
    if (!runIntegrationTests) {
      console.log('⚠️  Skipping integration tests - API keys not configured')
      console.log('   Set EXA_API_KEY and ANTHROPIC_API_KEY to run these tests')
    }
  })

  beforeEach(() => {
    skill = new RegulatoryResearchSkill()

    const austinProject: ProjectRow = {
      id: 'austin-test',
      user_id: 'user-123',
      property_name: 'Austin Test Property',
      units: 250,
      city: 'Austin',
      state: 'TX',
      property_type: 'Garden-Style',
      equipment_type: 'COMPACTOR',
      status: 'processing',
      progress: 0,
      total_savings: null,
      analysis_period_months: null,
      error_message: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const chicagoProject: ProjectRow = {
      id: 'chicago-test',
      user_id: 'user-123',
      property_name: 'Chicago Test Property',
      units: 300,
      city: 'Chicago',
      state: 'IL',
      property_type: 'Mid-Rise',
      equipment_type: 'COMPACTOR',
      status: 'processing',
      progress: 0,
      total_savings: null,
      analysis_period_months: null,
      error_message: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    austinContext = {
      projectId: 'austin-test',
      userId: 'user-123',
      project: austinProject,
      invoices: [],
      haulLog: [],
      config: {
        conversionRates: {
          compactorYpd: 14.49,
          dumpsterYpd: 4.33,
          targetCapacity: 8.5,
        },
        thresholds: {
          compactorTons: 6.0,
          contaminationPct: 3.0,
          bulkMonthly: 500,
          leaseupVariance: -40,
        },
      },
    }

    chicagoContext = {
      projectId: 'chicago-test',
      userId: 'user-123',
      project: chicagoProject,
      invoices: [],
      haulLog: [],
      config: {
        conversionRates: {
          compactorYpd: 14.49,
          dumpsterYpd: 4.33,
          targetCapacity: 8.5,
        },
        thresholds: {
          compactorTons: 6.0,
          contaminationPct: 3.0,
          bulkMonthly: 500,
          leaseupVariance: -40,
        },
      },
    }
  })

  describe('Austin, TX ordinances', () => {
    it('should find and extract Austin waste management ordinances', { timeout: 60000 }, async () => {
        console.log('\n🔍 Searching for Austin, TX ordinances...')

        const result = await skill.execute(austinContext)

        console.log('\n📊 Results:')
        console.log(`   Success: ${result.success}`)
        console.log(`   Ordinances found: ${result.data?.ordinances.length || 0}`)
        console.log(`   Waste requirements: ${result.data?.requirements.waste.length || 0}`)
        console.log(`   Recycling requirements: ${result.data?.requirements.recycling.length || 0}`)
        console.log(`   Compliance status: ${result.data?.compliance.status}`)
        console.log(`   Confidence: ${result.data?.confidence}`)

        // Assertions
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.location.city).toBe('Austin')
        expect(result.data?.location.state).toBe('TX')

        // Should find at least some ordinances for a major city like Austin
        expect(result.data?.ordinances.length).toBeGreaterThan(0)

        // Log ordinance details
        if (result.data?.ordinances && result.data.ordinances.length > 0) {
          console.log('\n📜 Ordinances:')
          result.data.ordinances.forEach((ord, idx) => {
            console.log(`   ${idx + 1}. ${ord.title}`)
            console.log(`      URL: ${ord.url}`)
            console.log(`      Excerpts: ${ord.relevantExcerpts.slice(0, 2).join('; ')}`)
          })
        }

        // Log requirements
        if (result.data?.requirements.waste.length) {
          console.log('\n♻️  Waste Requirements:')
          result.data.requirements.waste.forEach((req, idx) => {
            console.log(`   ${idx + 1}. ${req.requirement}`)
            console.log(`      Mandatory: ${req.mandatory}`)
            console.log(`      Source: ${req.source}`)
          })
        }

        // Log compliance issues
        if (result.data?.compliance.issues.length) {
          console.log('\n⚠️  Compliance Issues:')
          result.data.compliance.issues.forEach((issue, idx) => {
            console.log(`   ${idx + 1}. [${issue.severity}] ${issue.issue}`)
            console.log(`      ${issue.recommendation}`)
          })
        }

        // Metadata checks
        expect(result.metadata.skillName).toBe('regulatory-research')
        expect(result.metadata.durationMs).toBeGreaterThan(0)
        expect(result.metadata.executedAt).toBeDefined()
      })
  })

  describe('Chicago, IL ordinances', () => {
    it('should find and extract Chicago waste management ordinances', { timeout: 60000 }, async () => {
        console.log('\n🔍 Searching for Chicago, IL ordinances...')

        const result = await skill.execute(chicagoContext)

        console.log('\n📊 Results:')
        console.log(`   Success: ${result.success}`)
        console.log(`   Ordinances found: ${result.data?.ordinances.length || 0}`)
        console.log(`   Waste requirements: ${result.data?.requirements.waste.length || 0}`)
        console.log(`   Recycling requirements: ${result.data?.requirements.recycling.length || 0}`)
        console.log(`   Compliance status: ${result.data?.compliance.status}`)
        console.log(`   Confidence: ${result.data?.confidence}`)

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.location.city).toBe('Chicago')
        expect(result.data?.location.state).toBe('IL')

        // Chicago is a major city - should find ordinances
        expect(result.data?.ordinances.length).toBeGreaterThan(0)
      })
  })

  describe('edge cases', () => {
    it('should handle small town with no ordinances gracefully', { timeout: 60000 }, async () => {
        const smallTownContext: SkillContext = {
          ...austinContext,
          project: {
            ...austinContext.project,
            city: 'Tiny Town',
            state: 'WY',
          },
        }

        console.log('\n🔍 Searching for Tiny Town, WY ordinances...')

        const result = await skill.execute(smallTownContext)

        console.log('\n📊 Results:')
        console.log(`   Success: ${result.success}`)
        console.log(`   Ordinances found: ${result.data?.ordinances.length || 0}`)
        console.log(`   Confidence: ${result.data?.confidence}`)

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        // May find no ordinances - should gracefully handle
        if (result.data?.ordinances.length === 0) {
          console.log('   ✅ Gracefully handled no ordinances found')
          expect(result.data?.confidence).toBe('LOW')
          expect(result.data?.compliance.status).toBe('COMPLIANT') // No requirements = compliant
        }
      })
  })

  describe('performance', () => {
    it('should complete within reasonable time (<90 seconds)', { timeout: 120000 }, async () => {
        const startTime = Date.now()

        await skill.execute(austinContext)

        const duration = Date.now() - startTime
        console.log(`\n⏱️  Total execution time: ${duration}ms`)

        expect(duration).toBeLessThan(90000) // Should complete in < 90 seconds
      })
  })
})
