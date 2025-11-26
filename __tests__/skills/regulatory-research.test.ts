/**
 * Regulatory Research Skill Tests
 *
 * Comprehensive coverage: Validation, execution, error handling, and integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RegulatoryResearchSkill } from '@/lib/skills/skills/regulatory-research'
import type { SkillContext, RegulatoryResearchResult } from '@/lib/skills/types'
import type { Database } from '@/types/database.types'

type ProjectRow = Database['public']['Tables']['projects']['Row']

// Create mock functions
const mockSearchOrdinances = vi.fn()
const mockGetContents = vi.fn()
const mockAnthropicCreate = vi.fn()
const mockSupabaseInsert = vi.fn()

// Mock dependencies
vi.mock('@/lib/api/exa-client', () => ({
  getExaClient: () => ({
    searchOrdinances: mockSearchOrdinances,
    getContents: mockGetContents,
  }),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mockAnthropicCreate,
    }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  }),
}))

describe('RegulatoryResearchSkill', () => {
  let skill: RegulatoryResearchSkill
  let baseContext: SkillContext

  beforeEach(() => {
    skill = new RegulatoryResearchSkill()

    const mockProject: ProjectRow = {
      id: 'project-123',
      user_id: 'user-123',
      property_name: 'Test Property',
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

    baseContext = {
      projectId: 'project-123',
      userId: 'user-123',
      project: mockProject,
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

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('skill metadata', () => {
    it('should have correct skill metadata', () => {
      expect(skill.name).toBe('regulatory-research')
      expect(skill.version).toBe('1.0.0')
      expect(skill.description).toContain('municipal ordinances')
    })
  })

  describe('validation', () => {
    it('should pass validation with city and state', async () => {
      const result = await skill.validate(baseContext)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation without city', async () => {
      const context: SkillContext = {
        ...baseContext,
        project: {
          ...baseContext.project,
          city: '',
        },
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.code === 'MISSING_CITY')).toBe(true)
    })

    it('should fail validation without state', async () => {
      const context: SkillContext = {
        ...baseContext,
        project: {
          ...baseContext.project,
          state: '',
        },
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.code === 'MISSING_STATE')).toBe(true)
    })
  })

  describe('ordinance search', () => {
    it('should search for ordinances and return results', async () => {
      const mockSearchResults = {
        results: [
          {
            url: 'https://library.municode.com/tx/austin/codes/code_of_ordinances',
            title: 'Austin Municipal Code - Chapter 15 Solid Waste',
            text: 'Regulations for waste collection and disposal in multifamily properties',
          },
        ],
      }

      const mockContents = [
        {
          url: 'https://library.municode.com/tx/austin/codes/code_of_ordinances',
          title: 'Austin Municipal Code - Chapter 15 Solid Waste',
          text: 'Commercial properties must provide recycling services for residents...',
          highlights: [
            'Recycling required for multifamily 50+ units',
            'Minimum 2x per week collection',
          ],
        },
      ]

      mockSearchOrdinances.mockResolvedValue(mockSearchResults)
      mockGetContents.mockResolvedValue(mockContents)

      // Access private method via any casting for testing
      const searchResults = await (skill as any).searchOrdinances('Austin', 'TX')

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].title).toContain('Austin')
      expect(searchResults[0].url).toContain('municode.com')
      expect(searchResults[0].relevantExcerpts).toHaveLength(2)
    })

    it('should return empty array when no ordinances found', async () => {
      mockSearchOrdinances.mockResolvedValue({ results: [] })

      const searchResults = await (skill as any).searchOrdinances('SmallTown', 'TX')

      expect(searchResults).toEqual([])
    })

    it('should handle search errors gracefully', async () => {
      mockSearchOrdinances.mockRejectedValue(new Error('Exa API error'))

      const searchResults = await (skill as any).searchOrdinances('Austin', 'TX')

      // Should return empty array instead of throwing
      expect(searchResults).toEqual([])
    })
  })

  describe('requirement extraction', () => {
    it('should extract requirements from ordinances using Claude', async () => {
      const mockOrdinances = [
        {
          title: 'Austin Municipal Code - Chapter 15',
          url: 'https://library.municode.com/tx/austin/codes',
          jurisdiction: 'City of Austin',
          summary: 'Waste management regulations',
          fullText: 'Commercial properties must provide recycling...',
          relevantExcerpts: ['Recycling required for multifamily 50+ units'],
        },
      ]

      const mockClaudeResponse = {
        wasteRequirements: [
          {
            requirement: 'Minimum 2x per week collection for properties 100+ units',
            mandatory: true,
            frequency: '2x per week',
            source: 'Chapter 15, Section 15-3',
          },
        ],
        recyclingRequirements: [
          {
            requirement: 'Recycling program required for multifamily 50+ units',
            mandatory: true,
            materials: ['cardboard', 'plastic', 'metal', 'glass'],
            source: 'Chapter 15, Section 15-10',
          },
        ],
        compostingRequirements: [],
      }

      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockClaudeResponse),
          },
        ],
      } as any)

      const requirements = await (skill as any).extractRequirements(
        mockOrdinances,
        baseContext.project
      )

      expect(requirements.waste).toHaveLength(1)
      expect(requirements.recycling).toHaveLength(1)
      expect(requirements.composting).toHaveLength(0)
      expect(requirements.waste[0].mandatory).toBe(true)
      expect(requirements.recycling[0].materials).toContain('cardboard')
    })

    it('should return empty requirements when no ordinances provided', async () => {
      const requirements = await (skill as any).extractRequirements(
        [],
        baseContext.project
      )

      expect(requirements.waste).toEqual([])
      expect(requirements.recycling).toEqual([])
      expect(requirements.composting).toEqual([])
    })
  })

  describe('compliance assessment', () => {
    it('should mark as UNKNOWN when mandatory requirements exist', async () => {
      const mockRequirements = {
        waste: [
          {
            requirement: 'Minimum 2x per week collection',
            mandatory: true,
            frequency: '2x per week',
            source: 'Chapter 15',
          },
        ],
        recycling: [],
        composting: [],
      }

      const compliance = await (skill as any).assessCompliance(
        baseContext.project,
        mockRequirements
      )

      expect(compliance.status).toBe('UNKNOWN')
      expect(compliance.issues).toHaveLength(1)
      expect(compliance.issues[0].severity).toBe('MEDIUM')
      expect(compliance.recommendations).toContain(
        'Verify current service meets requirement: Minimum 2x per week collection'
      )
    })

    it('should mark as COMPLIANT when no mandatory requirements', async () => {
      const mockRequirements = {
        waste: [],
        recycling: [],
        composting: [],
      }

      const compliance = await (skill as any).assessCompliance(
        baseContext.project,
        mockRequirements
      )

      expect(compliance.status).toBe('COMPLIANT')
      expect(compliance.issues).toHaveLength(0)
      expect(compliance.recommendations).toHaveLength(0)
    })

    it('should flag recycling requirements as MEDIUM severity', async () => {
      const mockRequirements = {
        waste: [],
        recycling: [
          {
            requirement: 'Recycling required for 50+ units',
            mandatory: true,
            materials: ['cardboard', 'plastic'],
            source: 'Chapter 15',
          },
        ],
        composting: [],
      }

      const compliance = await (skill as any).assessCompliance(
        baseContext.project,
        mockRequirements
      )

      expect(compliance.status).toBe('UNKNOWN')
      expect(compliance.issues).toHaveLength(1)
      expect(compliance.issues[0].severity).toBe('MEDIUM')
      expect(compliance.recommendations.some((r: string) => r.includes('cardboard, plastic'))).toBe(true)
    })

    it('should flag composting requirements as LOW severity', async () => {
      const mockRequirements = {
        waste: [],
        recycling: [],
        composting: [
          {
            requirement: 'Composting program recommended',
            mandatory: true,
            materials: ['food waste', 'yard waste'],
            source: 'Chapter 15',
          },
        ],
      }

      const compliance = await (skill as any).assessCompliance(
        baseContext.project,
        mockRequirements
      )

      expect(compliance.status).toBe('UNKNOWN')
      expect(compliance.issues).toHaveLength(1)
      expect(compliance.issues[0].severity).toBe('LOW')
    })
  })

  describe('confidence calculation', () => {
    it('should return HIGH confidence with 3+ ordinances and 5+ requirements', () => {
      const mockOrdinances = Array(3).fill({
        title: 'Test Ordinance',
        url: 'https://example.com',
        jurisdiction: 'Test City',
        summary: 'Test',
        relevantExcerpts: [],
      })

      const mockRequirements = {
        waste: Array(3).fill({ requirement: 'Test', mandatory: true }),
        recycling: Array(2).fill({ requirement: 'Test', mandatory: true }),
        composting: [],
      }

      const confidence = (skill as any).calculateConfidence(
        mockOrdinances,
        mockRequirements
      )

      expect(confidence).toBe('HIGH')
    })

    it('should return MEDIUM confidence with 1-2 ordinances and some requirements', () => {
      const mockOrdinances = Array(2).fill({
        title: 'Test Ordinance',
        url: 'https://example.com',
        jurisdiction: 'Test City',
        summary: 'Test',
        relevantExcerpts: [],
      })

      const mockRequirements = {
        waste: Array(2).fill({ requirement: 'Test', mandatory: true }),
        recycling: [],
        composting: [],
      }

      const confidence = (skill as any).calculateConfidence(
        mockOrdinances,
        mockRequirements
      )

      expect(confidence).toBe('MEDIUM')
    })

    it('should return LOW confidence with few results', () => {
      const mockOrdinances: any[] = []
      const mockRequirements = {
        waste: [],
        recycling: [],
        composting: [],
      }

      const confidence = (skill as any).calculateConfidence(
        mockOrdinances,
        mockRequirements
      )

      expect(confidence).toBe('LOW')
    })
  })

  describe('database persistence', () => {
    it('should save research results to database', async () => {
      const mockResult: RegulatoryResearchResult = {
        location: { city: 'Austin', state: 'TX' },
        ordinances: [],
        requirements: {
          waste: [],
          recycling: [],
          composting: [],
        },
        compliance: {
          status: 'COMPLIANT',
          issues: [],
          recommendations: [],
        },
        penalties: [],
        licensedHaulers: [],
        contacts: [],
        confidence: 'MEDIUM',
        sources: [],
        researchDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }

      await expect(
        (skill as any).saveToDatabase('project-123', mockResult)
      ).resolves.not.toThrow()
    })
  })

  describe('full execution', () => {
    it('should execute successfully with mocked dependencies', async () => {
      // Mock Exa client
      mockSearchOrdinances.mockResolvedValue({
        results: [
          {
            url: 'https://library.municode.com/tx/austin/codes',
            title: 'Austin Municipal Code',
            text: 'Waste regulations',
          },
        ],
      })

      mockGetContents.mockResolvedValue([
        {
          url: 'https://library.municode.com/tx/austin/codes',
          title: 'Austin Municipal Code - Chapter 15',
          text: 'Commercial properties must provide recycling...',
          highlights: ['Recycling required'],
        },
      ])

      // Mock Claude
      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              wasteRequirements: [
                {
                  requirement: 'Test requirement',
                  mandatory: true,
                  source: 'Test',
                },
              ],
              recyclingRequirements: [],
              compostingRequirements: [],
            }),
          },
        ],
      } as any)

      const result = await skill.execute(baseContext)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.location.city).toBe('Austin')
      expect(result.data?.location.state).toBe('TX')
      expect(result.data?.ordinances).toHaveLength(1)
      expect(result.metadata.skillName).toBe('regulatory-research')
      expect(result.metadata.skillVersion).toBe('1.0.0')
    })
  })

  describe('jurisdiction extraction', () => {
    it('should extract city name from ordinance title', () => {
      const jurisdiction = (skill as any).extractJurisdiction(
        'City of Austin Municipal Code',
        'Austin',
        'TX'
      )

      expect(jurisdiction).toContain('Austin')
    })

    it('should default to city + state when not found in title', () => {
      const jurisdiction = (skill as any).extractJurisdiction(
        'Some Ordinance',
        'Austin',
        'TX'
      )

      expect(jurisdiction).toBe('Austin, TX')
    })
  })
})
