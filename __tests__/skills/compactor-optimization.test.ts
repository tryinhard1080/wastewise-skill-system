/**
 * Compactor Optimization Skill Tests
 *
 * Medium coverage: Happy path + error cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CompactorOptimizationSkill } from '@/lib/skills/skills/compactor-optimization'
import { SkillContext } from '@/lib/skills/types'
import { InsufficientDataError } from '@/lib/types/errors'
import type { Database } from '@/types/database.types'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type HaulLogRow = Database['public']['Tables']['haul_log']['Row']
type InvoiceDataRow = Database['public']['Tables']['invoice_data']['Row']

describe('CompactorOptimizationSkill', () => {
  let skill: CompactorOptimizationSkill
  let baseContext: SkillContext

  beforeEach(() => {
    skill = new CompactorOptimizationSkill()

    const mockProject: ProjectRow = {
      id: 'project-123',
      user_id: 'user-123',
      property_name: 'Test Property',
      units: 200,
      city: 'Atlanta',
      state: 'GA',
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
  })

  describe('validation', () => {
    it('should pass validation with sufficient haul log data', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
          createHaulLogEntry('2025-01-15', 5.1),
        ],
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation with no haul log data', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: undefined,
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].code).toBe('MISSING_HAUL_LOG')
    })

    it('should fail validation with fewer than 3 haul records', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
        ],
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].code).toBe('INSUFFICIENT_HAUL_LOG')
    })

    it('should fail validation for non-compactor equipment', async () => {
      const context: SkillContext = {
        ...baseContext,
        project: {
          ...baseContext.project,
          equipment_type: 'DUMPSTER',
        },
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
          createHaulLogEntry('2025-01-15', 5.1),
        ],
      }

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors?.some(e => e.code === 'INVALID_EQUIPMENT_TYPE')).toBe(true)
    })
  })

  describe('execute', () => {
    it('should recommend monitoring when avg tons < 6.0 (happy path)', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
          createHaulLogEntry('2025-01-15', 5.1),
          createHaulLogEntry('2025-01-22', 5.3),
        ],
        invoices: [
          createInvoiceEntry('2025-01-01', 850, 1),
          createInvoiceEntry('2025-01-08', 850, 1),
          createInvoiceEntry('2025-01-15', 850, 1),
          createInvoiceEntry('2025-01-22', 850, 1),
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.recommend).toBe(true)
      expect(result.data?.avgTonsPerHaul).toBeCloseTo(5.25, 2)
      expect(result.data?.targetTonsPerHaul).toBe(8.5)
      expect(result.data?.grossAnnualSavings).toBeGreaterThan(0)
      expect(result.metadata.skillName).toBe('compactor-optimization')
    })

    it('should NOT recommend when avg tons >= 6.0', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 6.1),
          createHaulLogEntry('2025-01-08', 6.2),
          createHaulLogEntry('2025-01-15', 6.3),
          createHaulLogEntry('2025-01-22', 6.0),
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data?.recommend).toBe(false)
      expect(result.data?.avgTonsPerHaul).toBeCloseTo(6.15, 2)
      expect(result.data?.grossAnnualSavings).toBe(0)
    })

    it('should handle edge case: 5.8 tons → recommend=true', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.8),
          createHaulLogEntry('2025-01-08', 5.8),
          createHaulLogEntry('2025-01-15', 5.8),
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data?.recommend).toBe(true)
      expect(result.data?.avgTonsPerHaul).toBe(5.8)
    })

    it('should handle edge case: 6.1 tons → recommend=false', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 6.1),
          createHaulLogEntry('2025-01-08', 6.1),
          createHaulLogEntry('2025-01-15', 6.1),
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data?.recommend).toBe(false)
      expect(result.data?.avgTonsPerHaul).toBe(6.1)
    })

    it('should throw InsufficientDataError when no haul log (bypassing validation)', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: undefined,
      }

      // Execute will call validate first, which should catch this
      const result = await skill.execute(context)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should throw error when formula config mismatches', async () => {
      const context: SkillContext = {
        ...baseContext,
        config: {
          conversionRates: {
            compactorYpd: 14.49,
            dumpsterYpd: 4.33,
            targetCapacity: 7.0, // WRONG! Should be 8.5
          },
          thresholds: {
            compactorTons: 6.0,
            contaminationPct: 3.0,
            bulkMonthly: 500,
            leaseupVariance: -40,
          },
        },
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
          createHaulLogEntry('2025-01-15', 5.1),
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('FORMULA_VALIDATION_ERROR')
    })

    it('should calculate ROI correctly with realistic data', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: createMockHaulLog(52, 5.2), // 52 weeks, 5.2 tons avg
        invoices: [
          createInvoiceEntry('2025-01-01', 44200, 52), // $850/haul × 52 hauls
        ],
      }

      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data?.recommend).toBe(true)
      expect(result.data?.avgTonsPerHaul).toBeCloseTo(5.2, 1)
      expect(result.data?.currentAnnualHauls).toBeGreaterThan(0)
      expect(result.data?.optimizedAnnualHauls).toBeLessThan(result.data!.currentAnnualHauls)
      expect(result.data?.haulsEliminated).toBeGreaterThan(0)
      expect(result.data?.netYear1Savings).toBeGreaterThan(0)
      expect(result.data?.roiPercent).toBeGreaterThan(0)
      expect(result.data?.paybackMonths).toBeGreaterThan(0)
      expect(result.data?.paybackMonths).toBeLessThan(12) // Should pay back in less than a year
    })
  })

  describe('metadata', () => {
    it('should include correct metadata in result', async () => {
      const context: SkillContext = {
        ...baseContext,
        haulLog: [
          createHaulLogEntry('2025-01-01', 5.2),
          createHaulLogEntry('2025-01-08', 5.4),
          createHaulLogEntry('2025-01-15', 5.1),
        ],
      }

      const result = await skill.execute(context)

      expect(result.metadata.skillName).toBe('compactor-optimization')
      expect(result.metadata.skillVersion).toBe('1.0.0')
      expect(result.metadata.durationMs).toBeGreaterThan(0)
      expect(result.metadata.executedAt).toBeDefined()
    })
  })
})

// Helper functions to create test data

function createHaulLogEntry(date: string, tonnage: number): HaulLogRow {
  return {
    id: `haul-${date}`,
    project_id: 'project-123',
    invoice_id: null,
    haul_date: date,
    tonnage,
    days_since_last: null,
    status: 'normal',
    created_at: '2025-01-01T00:00:00Z',
  }
}

function createInvoiceEntry(
  date: string,
  amount: number,
  hauls: number
): InvoiceDataRow {
  return {
    id: `invoice-${date}`,
    project_id: 'project-123',
    source_file_id: null,
    invoice_number: `INV-${date}`,
    invoice_date: date,
    vendor_name: 'Test Vendor',
    service_type: 'Compactor Service',
    total_amount: amount,
    tonnage: null,
    hauls,
    charges: {},
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
  }
}

function createMockHaulLog(count: number, avgTons: number): HaulLogRow[] {
  const entries: HaulLogRow[] = []
  const startDate = new Date('2025-01-01')

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i * 7) // Weekly pickups

    // Add some variance (±10%)
    const variance = (Math.random() - 0.5) * 0.2 * avgTons
    const tonnage = Math.round((avgTons + variance) * 10) / 10

    entries.push(createHaulLogEntry(date.toISOString().split('T')[0], tonnage))
  }

  return entries
}
