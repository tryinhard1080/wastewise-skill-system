/**
 * Skill Executor Tests
 *
 * Tests for skill execution with data loading and context building
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executeSkill } from '@/lib/skills/executor'
import { skillRegistry } from '@/lib/skills/registry'
import { Skill, SkillContext, SkillResult } from '@/lib/skills/types'
import { NotFoundError, InsufficientDataError } from '@/lib/types/errors'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (table === 'projects') {
              return {
                data: {
                  id: 'project-123',
                  user_id: 'user-123',
                  property_name: 'Test Property',
                  units: 200,
                  city: 'Atlanta',
                  state: 'GA',
                  equipment_type: 'COMPACTOR',
                  status: 'processing',
                },
                error: null,
              }
            }
            return { data: null, error: new Error('Not found') }
          }),
          order: vi.fn(() => ({
            then: vi.fn(async (callback: any) => {
              if (table === 'haul_log') {
                return callback({
                  data: [
                    {
                      id: 'haul-1',
                      project_id: 'project-123',
                      haul_date: '2025-01-01',
                      tonnage: 5.2,
                    },
                    {
                      id: 'haul-2',
                      project_id: 'project-123',
                      haul_date: '2025-01-08',
                      tonnage: 5.4,
                    },
                    {
                      id: 'haul-3',
                      project_id: 'project-123',
                      haul_date: '2025-01-15',
                      tonnage: 5.1,
                    },
                  ],
                  error: null,
                })
              } else if (table === 'invoice_data') {
                return callback({
                  data: [
                    {
                      id: 'invoice-1',
                      project_id: 'project-123',
                      total_amount: 850,
                      hauls: 1,
                    },
                  ],
                  error: null,
                })
              }
              return callback({ data: [], error: null })
            }),
          })),
        })),
        // For invoice_data query
        then: vi.fn(async (callback: any) =>
          callback({
            data: [
              {
                id: 'invoice-1',
                project_id: 'project-123',
                total_amount: 850,
                hauls: 1,
              },
            ],
            error: null,
          })
        ),
      })),
    })),
  })),
}))

// Mock skill registry getConfig
vi.mock('@/lib/skills/registry', () => ({
  skillRegistry: {
    get: vi.fn(),
    getConfig: vi.fn(async () => ({
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
    })),
  },
}))

// Mock skill for testing
class MockSuccessSkill implements Skill<string> {
  readonly name = 'compactor-optimization'
  readonly version = '1.0.0'
  readonly description = 'Mock skill'

  async execute(context: SkillContext): Promise<SkillResult<string>> {
    return {
      success: true,
      data: 'success',
      metadata: {
        skillName: this.name,
        skillVersion: this.version,
        durationMs: 100,
        executedAt: new Date().toISOString(),
      },
    }
  }
}

class MockFailSkill implements Skill<string> {
  readonly name = 'compactor-optimization'
  readonly version = '1.0.0'
  readonly description = 'Mock fail skill'

  async execute(context: SkillContext): Promise<SkillResult<string>> {
    throw new Error('Skill execution failed')
  }
}

describe('executeSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('happy path', () => {
    it('should execute skill successfully', async () => {
      const mockSkill = new MockSuccessSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      const result = await executeSkill('project-123', 'complete_analysis')

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.metadata.skillName).toBe('compactor-optimization')
    })

    it('should load project data correctly', async () => {
      const mockSkill = new MockSuccessSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      const executeSpy = vi.spyOn(mockSkill, 'execute')

      await executeSkill('project-123', 'complete_analysis')

      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-123',
          userId: 'user-123',
          project: expect.objectContaining({
            id: 'project-123',
            property_name: 'Test Property',
          }),
        })
      )
    })

    it('should load invoices and haul log', async () => {
      const mockSkill = new MockSuccessSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      const executeSpy = vi.spyOn(mockSkill, 'execute')

      await executeSkill('project-123', 'complete_analysis')

      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          invoices: expect.arrayContaining([
            expect.objectContaining({
              id: 'invoice-1',
            }),
          ]),
          haulLog: expect.arrayContaining([
            expect.objectContaining({
              id: 'haul-1',
            }),
            expect.objectContaining({
              id: 'haul-2',
            }),
            expect.objectContaining({
              id: 'haul-3',
            }),
          ]),
        })
      )
    })

    it('should load skill config from database', async () => {
      const mockSkill = new MockSuccessSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      const executeSpy = vi.spyOn(mockSkill, 'execute')

      await executeSkill('project-123', 'complete_analysis')

      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
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
        })
      )
    })
  })

  describe('error handling', () => {
    it('should throw NotFoundError when skill not in registry', async () => {
      vi.mocked(skillRegistry.get).mockReturnValue(undefined)

      await expect(executeSkill('project-123', 'complete_analysis')).rejects.toThrow(NotFoundError)
      await expect(executeSkill('project-123', 'complete_analysis')).rejects.toThrow(
        "Skill 'wastewise-analytics' not found"
      )
    })

    it('should propagate skill execution errors', async () => {
      const mockSkill = new MockFailSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      await expect(executeSkill('project-123', 'complete_analysis')).rejects.toThrow(
        'Skill execution failed'
      )
    })
  })

  describe('metrics and logging', () => {
    it('should record metrics for successful execution', async () => {
      const mockSkill = new MockSuccessSkill()
      vi.mocked(skillRegistry.get).mockReturnValue(mockSkill)

      const result = await executeSkill('project-123', 'complete_analysis')

      expect(result.metadata.durationMs).toBeGreaterThan(0)
      expect(result.metadata.executedAt).toBeDefined()
    })
  })
})
