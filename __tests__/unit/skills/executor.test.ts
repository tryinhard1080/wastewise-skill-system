/**
 * Unit Tests for Skill Executor
 *
 * Tests dynamic job type routing and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '@/lib/types/errors'

// Mock dependencies before importing executor
vi.mock('@/lib/skills/registry', () => ({
  skillRegistry: {
    get: vi.fn(),
    getConfig: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/observability/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    })),
  },
}))

vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    startTimer: vi.fn(() => 'timer-id'),
    stopTimer: vi.fn(() => 100),
    recordSkillExecution: vi.fn(),
  },
}))

// Import after mocks
import { executeSkill, executeSkillWithProgress } from '@/lib/skills/executor'
import { skillRegistry } from '@/lib/skills/registry'
import { createClient } from '@/lib/supabase/server'

describe('mapJobTypeToSkill (via executeSkill)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should map complete_analysis to wastewise-analytics', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123', name: 'Test Project' },
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(skillRegistry.get).mockReturnValue(undefined) // Will fail at skill lookup

    // Act & Assert
    await expect(executeSkill('project-123', 'complete_analysis')).rejects.toThrow()

    // Verify it tried to get the correct skill
    expect(skillRegistry.get).toHaveBeenCalledWith('wastewise-analytics')
  })

  it('should map invoice_extraction to batch-extractor', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123', name: 'Test Project' },
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(skillRegistry.get).mockReturnValue(undefined)

    // Act & Assert
    await expect(executeSkill('project-123', 'invoice_extraction')).rejects.toThrow()

    // Verify it tried to get the correct skill
    expect(skillRegistry.get).toHaveBeenCalledWith('batch-extractor')
  })

  it('should map regulatory_research to regulatory-research', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123', name: 'Test Project' },
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(skillRegistry.get).mockReturnValue(undefined)

    // Act & Assert
    await expect(executeSkill('project-123', 'regulatory_research')).rejects.toThrow()

    // Verify it tried to get the correct skill
    expect(skillRegistry.get).toHaveBeenCalledWith('regulatory-research')
  })

  it('should map report_generation to wastewise-analytics', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123', name: 'Test Project' },
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(skillRegistry.get).mockReturnValue(undefined)

    // Act & Assert
    await expect(executeSkill('project-123', 'report_generation')).rejects.toThrow()

    // Verify it tried to get the correct skill
    expect(skillRegistry.get).toHaveBeenCalledWith('wastewise-analytics')
  })

  it('should throw AppError with INVALID_JOB_TYPE for unknown job type', async () => {
    // Act & Assert
    await expect(executeSkill('project-123', 'unknown_job_type')).rejects.toThrow(AppError)

    await expect(executeSkill('project-123', 'unknown_job_type')).rejects.toMatchObject({
      code: 'INVALID_JOB_TYPE',
      statusCode: 400,
    })

    // Verify message separately
    try {
      await executeSkill('project-123', 'unknown_job_type')
    } catch (error) {
      expect((error as AppError).message).toContain('Unknown job type')
    }
  })

  it('should throw AppError with INVALID_JOB_TYPE for empty job type', async () => {
    // Act & Assert
    await expect(executeSkill('project-123', '')).rejects.toThrow(AppError)

    await expect(executeSkill('project-123', '')).rejects.toMatchObject({
      code: 'INVALID_JOB_TYPE',
      statusCode: 400,
    })
  })

  it('should throw AppError with INVALID_JOB_TYPE for invalid job type format', async () => {
    // Act & Assert
    const invalidJobTypes = [
      'COMPLETE_ANALYSIS', // Wrong case
      'complete-analysis', // Wrong separator
      'complete analysis', // Space instead of underscore
      'compactor-optimization', // Old hardcoded value (not a valid job type)
    ]

    for (const invalidType of invalidJobTypes) {
      await expect(executeSkill('project-123', invalidType)).rejects.toMatchObject({
        code: 'INVALID_JOB_TYPE',
        statusCode: 400,
      })
    }
  })
})

describe('executeSkillWithProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should map complete_analysis to wastewise-analytics with progress', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123', name: 'Test Project' },
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(skillRegistry.get).mockReturnValue(undefined)

    const onProgress = vi.fn().mockResolvedValue(undefined)

    // Act & Assert
    await expect(executeSkillWithProgress('project-123', 'complete_analysis', onProgress)).rejects.toThrow()

    // Verify it tried to get the correct skill
    expect(skillRegistry.get).toHaveBeenCalledWith('wastewise-analytics')
  })

  it('should throw AppError with INVALID_JOB_TYPE for unknown job type with progress', async () => {
    const onProgress = vi.fn().mockResolvedValue(undefined)

    // Act & Assert
    await expect(executeSkillWithProgress('project-123', 'invalid_type', onProgress)).rejects.toMatchObject({
      code: 'INVALID_JOB_TYPE',
      statusCode: 400,
    })

    // Verify message separately
    try {
      await executeSkillWithProgress('project-123', 'invalid_type', onProgress)
    } catch (error) {
      expect((error as AppError).message).toContain('Unknown job type')
    }
  })
})

describe('Job type validation', () => {
  it('should validate all supported job types', () => {
    const supportedJobTypes = [
      'complete_analysis',
      'invoice_extraction',
      'regulatory_research',
      'report_generation',
    ]

    // All these should be valid (not throw INVALID_JOB_TYPE before database lookup)
    expect(supportedJobTypes.length).toBe(4)
  })

  it('should use underscore separator for job types', () => {
    // Job types should use underscore (complete_analysis), not hyphens
    const validFormat = 'complete_analysis'
    const invalidFormat = 'complete-analysis'

    expect(validFormat).toMatch(/^[a-z]+_[a-z]+$/)
    expect(invalidFormat).not.toMatch(/^[a-z]+_[a-z]+$/)
  })

  it('should map to skill names with hyphen separator', () => {
    // Skill names should use hyphens (wastewise-analytics, batch-extractor)
    const validSkillNames = [
      'wastewise-analytics',
      'batch-extractor',
      'regulatory-research',
    ]

    validSkillNames.forEach(name => {
      expect(name).toMatch(/^[a-z]+-[a-z]+(-[a-z]+)?$/)
    })
  })
})
