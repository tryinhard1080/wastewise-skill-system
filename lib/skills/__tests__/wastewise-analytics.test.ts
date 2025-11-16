/**
 * WasteWise Analytics Orchestrator Tests
 *
 * Comprehensive unit tests for the main orchestration skill.
 *
 * Test Coverage:
 * - Orchestration flow executes all steps
 * - Progress updates called at correct intervals
 * - Error handling for sub-skill failures
 * - Results aggregation
 * - AI usage tracking
 * - Report generation
 * - Lease-up detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WasteWiseAnalyticsSkill } from '../skills/wastewise-analytics'
import type { SkillContext, SkillProgress } from '../types'

// Mock the compactor optimization skill
vi.mock('../skills/compactor-optimization', () => ({
  CompactorOptimizationSkill: vi.fn().mockImplementation(() => ({
    name: 'compactor-optimization',
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: {
        recommend: true,
        avgTonsPerHaul: 5.2,
        targetTonsPerHaul: 8.5,
        currentAnnualHauls: 156,
        optimizedAnnualHauls: 95,
        haulsEliminated: 61,
        grossAnnualSavings: 51850.0,
        netYear1Savings: 49150.0,
        netAnnualSavingsYear2Plus: 49450.0,
        roiPercent: 1819.44,
        paybackMonths: 0.7,
      },
      metadata: {
        skillName: 'compactor-optimization',
        skillVersion: '1.0.0',
        durationMs: 1000,
        executedAt: new Date().toISOString(),
        aiUsage: {
          requests: 0,
          tokensInput: 0,
          tokensOutput: 0,
          costUsd: 0,
        },
      },
    }),
  })),
}))

// Helper to create mock context
function createMockContext(overrides?: Partial<SkillContext>): SkillContext {
  return {
    projectId: 'test-project-123',
    userId: 'test-user-456',
    project: {
      id: 'test-project-123',
      user_id: 'test-user-456',
      property_name: 'Test Garden Apartments',
      units: 250,
      city: 'Austin',
      state: 'TX',
      property_type: 'Garden-Style',
      status: 'processing',
      progress: 0,
      total_savings: 0,
      equipment_type: 'COMPACTOR',
      analysis_period_months: 12,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    invoices: [
      {
        id: 'inv-1',
        project_id: 'test-project-123',
        source_file_id: null,
        invoice_number: 'INV-001',
        invoice_date: '2024-01-15',
        vendor_name: 'Waste Management',
        service_type: 'Compactor Service',
        total_amount: 2500.0,
        tonnage: 15.2,
        hauls: 3,
        charges: {
          disposal: 1800.0,
          pickup_fees: 600.0,
          contamination: 50.0,
          bulk_service: 50.0,
        },
        notes: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        project_id: 'test-project-123',
        source_file_id: null,
        invoice_number: 'INV-002',
        invoice_date: '2024-02-15',
        vendor_name: 'Waste Management',
        service_type: 'Compactor Service',
        total_amount: 2600.0,
        tonnage: 16.8,
        hauls: 3,
        charges: {
          disposal: 1900.0,
          pickup_fees: 600.0,
          contamination: 100.0,
        },
        notes: null,
        created_at: new Date().toISOString(),
      },
    ],
    haulLog: [
      {
        id: 'haul-1',
        project_id: 'test-project-123',
        invoice_id: 'inv-1',
        haul_date: '2024-01-05',
        tonnage: 5.1,
        days_since_last: null,
        status: 'low_utilization',
        created_at: new Date().toISOString(),
      },
      {
        id: 'haul-2',
        project_id: 'test-project-123',
        invoice_id: 'inv-1',
        haul_date: '2024-01-12',
        tonnage: 5.0,
        days_since_last: 7,
        status: 'low_utilization',
        created_at: new Date().toISOString(),
      },
      {
        id: 'haul-3',
        project_id: 'test-project-123',
        invoice_id: 'inv-1',
        haul_date: '2024-01-19',
        tonnage: 5.1,
        days_since_last: 7,
        status: 'low_utilization',
        created_at: new Date().toISOString(),
      },
    ],
    config: {
      conversionRates: {
        compactorYpd: 14.49,
        dumpsterYpd: 4.33,
        targetCapacity: 8.5,
      },
      thresholds: {
        compactorTons: 6.0,
        contaminationPct: 0.03,
        bulkMonthly: 500,
        leaseupVariance: -40,
      },
    },
    onProgress: vi.fn(),
    signal: undefined,
    ...overrides,
  }
}

describe('WasteWiseAnalyticsSkill', () => {
  let skill: WasteWiseAnalyticsSkill

  beforeEach(() => {
    skill = new WasteWiseAnalyticsSkill()
    vi.clearAllMocks()
  })

  describe('Metadata', () => {
    it('should have correct skill metadata', () => {
      expect(skill.name).toBe('wastewise-analytics')
      expect(skill.version).toBe('1.0.0')
      expect(skill.description).toBeTruthy()
    })
  })

  describe('Validation', () => {
    it('should pass validation with valid context', async () => {
      const context = createMockContext()
      const result = await skill.validate(context)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation without invoices', async () => {
      const context = createMockContext({ invoices: [] })
      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].code).toBe('MISSING_INVOICES')
    })

    it('should fail validation with invalid unit count', async () => {
      const context = createMockContext()
      context.project.units = 5 // Below minimum of 10

      const result = await skill.validate(context)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].code).toBe('INVALID_UNIT_COUNT')
    })
  })

  describe('Execution Flow', () => {
    it('should orchestrate complete analysis successfully', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.summary).toBeDefined()
      expect(result.data?.recommendations).toBeDefined()
      expect(result.data?.reports).toBeDefined()
    })

    it('should track progress through all steps', async () => {
      const context = createMockContext()
      const progressUpdates: SkillProgress[] = []

      context.onProgress = vi.fn(async (progress) => {
        progressUpdates.push(progress)
      })

      await skill.execute(context)

      // Should have multiple progress updates (at least 5 major steps)
      expect(progressUpdates.length).toBeGreaterThanOrEqual(5)

      // First update should be 0%
      expect(progressUpdates[0].percent).toBe(0)

      // Last update should be 100%
      const lastUpdate = progressUpdates[progressUpdates.length - 1]
      expect(lastUpdate.percent).toBe(100)
    })

    it('should calculate summary metrics correctly', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.data?.summary.totalInvoices).toBe(2)
      expect(result.data?.summary.currentMonthlyCost).toBeGreaterThan(0)
      expect(result.data?.summary.dateRange.start).toBeTruthy()
      expect(result.data?.summary.dateRange.end).toBeTruthy()
    })

    it('should include compactor optimization when applicable', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.data?.compactorOptimization).toBeDefined()
      expect(result.data?.compactorOptimization?.recommend).toBe(true)
    })

    it('should skip compactor optimization for non-compactor equipment', async () => {
      const context = createMockContext()
      context.project.equipment_type = 'DUMPSTER'

      const result = await skill.execute(context)

      expect(result.data?.compactorOptimization).toBeUndefined()
    })

    it('should generate reports with correct structure', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.data?.reports.excelWorkbook).toBeDefined()
      expect(result.data?.reports.excelWorkbook.fileName).toBeTruthy()
      expect(result.data?.reports.excelWorkbook.storagePath).toBeTruthy()

      expect(result.data?.reports.htmlDashboard).toBeDefined()
      expect(result.data?.reports.htmlDashboard.fileName).toBeTruthy()
      expect(result.data?.reports.htmlDashboard.storagePath).toBeTruthy()
    })
  })

  describe('Recommendations', () => {
    it('should add compactor monitoring recommendation when applicable', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      const compactorRec = result.data?.recommendations.find(
        (r) => r.type === 'compactor_monitors'
      )

      expect(compactorRec).toBeDefined()
      expect(compactorRec?.recommend).toBe(true)
      expect(compactorRec?.priority).toBe(1)
      expect(compactorRec?.savings).toBeGreaterThan(0)
    })

    it('should add contamination recommendation when threshold exceeded', async () => {
      const context = createMockContext()
      // Increase contamination charges to exceed 3% threshold
      context.invoices[0].charges = {
        disposal: 1500.0,
        contamination: 500.0, // High contamination
      }
      context.invoices[0].total_amount = 2000.0

      const result = await skill.execute(context)

      const contaminationRec = result.data?.recommendations.find(
        (r) => r.type === 'contamination_reduction'
      )

      expect(contaminationRec).toBeDefined()
      expect(contaminationRec?.recommend).toBe(true)
    })

    it('should add bulk subscription recommendation when threshold exceeded', async () => {
      const context = createMockContext()
      // Increase bulk service charges
      context.invoices[0].charges = {
        disposal: 1500.0,
        bulk_service: 600.0, // Exceeds $500 threshold
      }
      context.invoices[0].total_amount = 2100.0

      const result = await skill.execute(context)

      const bulkRec = result.data?.recommendations.find(
        (r) => r.type === 'bulk_subscription'
      )

      expect(bulkRec).toBeDefined()
      expect(bulkRec?.recommend).toBe(true)
    })

    it('should not recommend optimizations during lease-up', async () => {
      const context = createMockContext()
      // Set low tonnage to trigger lease-up detection
      context.invoices[0].tonnage = 2.0
      context.invoices[1].tonnage = 2.5

      const result = await skill.execute(context)

      expect(result.data?.leaseUpDetected).toBe(true)

      // Should have fewer recommendations during lease-up
      const recommendedCount = result.data?.recommendations.filter(r => r.recommend).length || 0
      expect(recommendedCount).toBeLessThanOrEqual(1) // Only compactor if very strong case
    })
  })

  describe('AI Usage Tracking', () => {
    it('should track AI usage from sub-skills', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.data?.aiUsage).toBeDefined()
      expect(result.data?.aiUsage.totalRequests).toBeGreaterThanOrEqual(0)
      expect(result.data?.aiUsage.totalCostUsd).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle sub-skill failures gracefully', async () => {
      // Mock compactor skill to fail
      const { CompactorOptimizationSkill } = await import('../skills/compactor-optimization')
      vi.mocked(CompactorOptimizationSkill).mockImplementationOnce(() => ({
        name: 'compactor-optimization',
        execute: vi.fn().mockRejectedValue(new Error('Compactor analysis failed')),
      }) as any)

      const context = createMockContext()
      const result = await skill.execute(context)

      // Should still succeed with partial results
      expect(result.success).toBe(true)
      expect(result.data?.compactorOptimization).toBeUndefined()
      expect(result.data?.summary).toBeDefined() // Other results still available
    })

    it('should include execution time in results', async () => {
      const context = createMockContext()
      const result = await skill.execute(context)

      expect(result.data?.executionTime).toBeGreaterThan(0)
      expect(result.metadata.durationMs).toBeGreaterThan(0)
    })
  })

  describe('Lease-up Detection', () => {
    it('should detect lease-up when yards per door is significantly below benchmark', async () => {
      const context = createMockContext()
      // Set very low tonnage to simulate lease-up
      context.invoices[0].tonnage = 1.5
      context.invoices[1].tonnage = 1.8

      const result = await skill.execute(context)

      expect(result.data?.leaseUpDetected).toBe(true)
    })

    it('should not detect lease-up when yards per door is normal', async () => {
      const context = createMockContext()
      // Normal tonnage
      context.invoices[0].tonnage = 15.2
      context.invoices[1].tonnage = 16.8

      const result = await skill.execute(context)

      expect(result.data?.leaseUpDetected).toBe(false)
    })
  })
})
