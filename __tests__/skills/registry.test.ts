/**
 * Skill Registry Tests
 *
 * Tests for skill registration and retrieval
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SkillRegistry } from '@/lib/skills/registry'
import { Skill, SkillContext, SkillResult } from '@/lib/skills/types'

// Mock skill for testing
class MockSkill implements Skill<string> {
  constructor(
    public readonly name: string = 'mock-skill',
    public readonly version: string = '1.0.0',
    public readonly description: string = 'A mock skill for testing'
  ) {}

  async execute(context: SkillContext): Promise<SkillResult<string>> {
    return {
      success: true,
      data: 'mock-result',
      metadata: {
        skillName: this.name,
        skillVersion: this.version,
        durationMs: 100,
        executedAt: new Date().toISOString(),
      },
    }
  }
}

describe('SkillRegistry', () => {
  let registry: SkillRegistry

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new SkillRegistry()
  })

  describe('register', () => {
    it('should register a skill', () => {
      const skill = new MockSkill()

      registry.register(skill)

      expect(registry.has('mock-skill')).toBe(true)
      expect(registry.count()).toBe(1)
    })

    it('should register multiple skills', () => {
      const skill1 = new MockSkill('skill-1')
      const skill2 = new MockSkill('skill-2')
      const skill3 = new MockSkill('skill-3')

      registry.register(skill1)
      registry.register(skill2)
      registry.register(skill3)

      expect(registry.count()).toBe(3)
      expect(registry.has('skill-1')).toBe(true)
      expect(registry.has('skill-2')).toBe(true)
      expect(registry.has('skill-3')).toBe(true)
    })

    it('should overwrite existing skill with same name', () => {
      const skill1 = new MockSkill('test-skill', '1.0.0', 'First version')
      const skill2 = new MockSkill('test-skill', '2.0.0', 'Second version')

      registry.register(skill1)
      registry.register(skill2)

      expect(registry.count()).toBe(1)

      const retrieved = registry.get('test-skill')
      expect(retrieved?.version).toBe('2.0.0')
      expect(retrieved?.description).toBe('Second version')
    })
  })

  describe('get', () => {
    it('should retrieve registered skill', () => {
      const skill = new MockSkill('test-skill')
      registry.register(skill)

      const retrieved = registry.get('test-skill')

      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('test-skill')
      expect(retrieved?.version).toBe('1.0.0')
    })

    it('should return undefined for non-existent skill', () => {
      const retrieved = registry.get('non-existent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('has', () => {
    it('should return true for registered skill', () => {
      const skill = new MockSkill()
      registry.register(skill)

      expect(registry.has('mock-skill')).toBe(true)
    })

    it('should return false for non-registered skill', () => {
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('count', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.count()).toBe(0)
    })

    it('should return correct count after registrations', () => {
      registry.register(new MockSkill('skill-1'))
      registry.register(new MockSkill('skill-2'))
      registry.register(new MockSkill('skill-3'))

      expect(registry.count()).toBe(3)
    })

    it('should not increase count when overwriting', () => {
      registry.register(new MockSkill('test-skill', '1.0.0'))
      registry.register(new MockSkill('test-skill', '2.0.0'))

      expect(registry.count()).toBe(1)
    })
  })

  describe('list', () => {
    it('should return empty array for empty registry', () => {
      expect(registry.list()).toEqual([])
    })

    it('should return all skill names', () => {
      registry.register(new MockSkill('skill-1'))
      registry.register(new MockSkill('skill-2'))
      registry.register(new MockSkill('skill-3'))

      const names = registry.list()

      expect(names).toHaveLength(3)
      expect(names).toContain('skill-1')
      expect(names).toContain('skill-2')
      expect(names).toContain('skill-3')
    })
  })

  describe('getAll', () => {
    it('should return empty array for empty registry', () => {
      expect(registry.getAll()).toEqual([])
    })

    it('should return all registered skills', () => {
      const skill1 = new MockSkill('skill-1')
      const skill2 = new MockSkill('skill-2')

      registry.register(skill1)
      registry.register(skill2)

      const skills = registry.getAll()

      expect(skills).toHaveLength(2)
      expect(skills).toContainEqual(skill1)
      expect(skills).toContainEqual(skill2)
    })
  })

  describe('integration', () => {
    it('should handle full lifecycle: register, get, execute', async () => {
      const skill = new MockSkill('integration-test')

      // Register
      registry.register(skill)

      // Retrieve
      const retrieved = registry.get('integration-test')
      expect(retrieved).toBeDefined()

      // Execute
      const mockContext = {
        projectId: 'test-project',
        userId: 'test-user',
        project: {} as any,
        invoices: [],
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

      const result = await retrieved!.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data).toBe('mock-result')
    })
  })
})
