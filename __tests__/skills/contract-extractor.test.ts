/**
 * Contract Extractor Skill Tests
 *
 * Tests for the ContractExtractorSkill class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContractExtractorSkill } from '@/lib/skills/skills/contract-extractor'
import type { SkillContext, ContractData } from '@/lib/skills/types'

// Create mock functions using vi.hoisted() for proper hoisting
const { mockExtractContractData, mockCalculateAnthropicCost } = vi.hoisted(() => ({
  mockExtractContractData: vi.fn(),
  mockCalculateAnthropicCost: vi.fn(),
}))

// Mock vision-extractor module (the skill uses these functions)
vi.mock('@/lib/ai/vision-extractor', () => ({
  extractContractData: mockExtractContractData,
  calculateAnthropicCost: mockCalculateAnthropicCost,
}))

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              {
                id: 'file-1',
                file_name: 'contract.pdf',
                file_type: 'contract',
                mime_type: 'application/pdf',
                storage_path: 'contracts/contract.pdf',
              },
            ],
            error: null,
          })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(() => ({
          data: new Blob([Buffer.from('mock pdf content')], {
            type: 'application/pdf',
          }),
          error: null,
        })),
      })),
    },
  })),
}))

vi.mock('@/lib/observability/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}))

vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    increment: vi.fn(),
    record: vi.fn(),
  },
}))

describe('ContractExtractorSkill', () => {
  let skill: ContractExtractorSkill
  let mockContext: SkillContext

  const mockContractData = {
    property: {
      name: 'Oak Ridge Apartments',
      address: '123 Main St, Austin, TX 78701',
      units: 200,
    },
    vendor: {
      name: 'Waste Management Inc.',
      contact: 'John Smith',
      phone: '512-555-0100',
      email: 'john.smith@wm.com',
    },
    contractDates: {
      effectiveDate: '2024-01-01',
      expirationDate: '2026-12-31',
      termMonths: 36,
      autoRenew: true,
    },
    services: [
      {
        containerType: 'COMPACTOR',
        containerSize: 30,
        frequency: '2x/week',
        serviceDays: 'Monday, Thursday',
      },
    ],
    pricing: {
      monthlyBase: 1200,
      perPickup: 150,
      perTon: 85,
      fuelSurcharge: 0.05,
      otherFees: [
        { description: 'Admin Fee', amount: 25 },
        { description: 'Disposal Fee', amount: 50 },
      ],
      escalationClause: '3% annual increase',
      cpiAdjustment: true,
    },
    terms: {
      terminationNoticeDays: 90,
      earlyTerminationPenalty: '3 months of service fees',
      insuranceRequired: true,
      paymentTerms: 'Net 30',
      latePenalty: '1.5% per month',
    },
  }

  beforeEach(() => {
    skill = new ContractExtractorSkill()

    mockContext = {
      projectId: 'project-123',
      userId: 'user-123',
      project: {
        id: 'project-123',
        user_id: 'user-123',
        property_name: 'Oak Ridge Apartments',
        units: 200,
        city: 'Austin',
        state: 'TX',
        property_type: 'Garden-Style',
        equipment_type: 'COMPACTOR',
        status: 'draft',
        progress: 0,
        total_savings: 0,
        analysis_period_months: 12,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
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

    // Reset mocks
    vi.clearAllMocks()

    // Set up API key
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
  })

  describe('Basic Properties', () => {
    it('should have correct skill metadata', () => {
      expect(skill.name).toBe('contract-extractor')
      expect(skill.version).toBe('1.0.0')
      expect(skill.description).toContain('waste management service agreements')
    })
  })

  describe('Validation', () => {
    it('should pass validation when contract files exist', async () => {
      const result = await skill.validate(mockContext)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation when no contract files exist', async () => {
      // Mock no files
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValueOnce({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      } as any)

      const result = await skill.validate(mockContext)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].code).toBe('NO_CONTRACT_FILES')
    })

    it('should fail validation when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await skill.validate(mockContext)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some((e) => e.code === 'MISSING_API_KEY')).toBe(true)

      // Restore
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
    })
  })

  describe('Contract Extraction', () => {
    beforeEach(() => {
      // Mock contract extraction
      mockExtractContractData.mockResolvedValue({
        contract: {
          sourceFile: 'contract.pdf',
          extractionDate: new Date().toISOString(),
          property: mockContractData.property,
          vendor: mockContractData.vendor,
          contractDates: mockContractData.contractDates,
          services: mockContractData.services,
          pricing: mockContractData.pricing,
          terms: mockContractData.terms,
        },
        usage: {
          input_tokens: 2500,
          output_tokens: 1200,
        },
      })

      // Mock cost calculation
      mockCalculateAnthropicCost.mockReturnValue(15.0)
    })

    it('should extract contract data from PDF', async () => {
      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.contracts).toHaveLength(1)

      const contract = result.data!.contracts[0]
      expect(contract.property.name).toBe('Oak Ridge Apartments')
      expect(contract.vendor.name).toBe('Waste Management Inc.')
      expect(contract.services).toHaveLength(1)
      expect(contract.services[0].containerType).toBe('COMPACTOR')
    })

    it('should track AI usage correctly', async () => {
      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.aiUsage).toBeDefined()
      expect(result.data?.aiUsage.totalRequests).toBe(1)
      expect(result.data?.aiUsage.totalTokensInput).toBe(2500)
      expect(result.data?.aiUsage.totalTokensOutput).toBe(1200)
      expect(result.data?.aiUsage.totalCostUsd).toBeGreaterThan(0)
    })

    it('should track progress during extraction', async () => {
      const progressUpdates: any[] = []

      await skill.execute({
        ...mockContext,
        onProgress: async (progress) => {
          progressUpdates.push(progress)
        },
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].percent).toBeGreaterThanOrEqual(0)
      expect(progressUpdates[progressUpdates.length - 1].percent).toBe(100)
    })

    it('should validate and normalize container types', async () => {
      // Mock response with lowercase container type
      mockExtractContractData.mockResolvedValue({
        contract: {
          sourceFile: 'contract.pdf',
          extractionDate: new Date().toISOString(),
          property: mockContractData.property,
          vendor: mockContractData.vendor,
          contractDates: mockContractData.contractDates,
          services: [
            {
              containerType: 'compactor' as any, // lowercase - should be normalized
              containerSize: 30,
              frequency: '2x/week',
              serviceDays: undefined,
            },
          ],
          pricing: mockContractData.pricing,
          terms: mockContractData.terms,
        },
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      const contract = result.data!.contracts[0]

      // Should be normalized to uppercase or OTHER
      expect(['COMPACTOR', 'DUMPSTER', 'OPEN_TOP', 'OTHER']).toContain(
        contract.services[0].containerType
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      // Mock extraction that will fail validation due to missing property name
      mockExtractContractData.mockResolvedValue({
        contract: {
          sourceFile: 'contract.pdf',
          extractionDate: new Date().toISOString(),
          property: { name: '', address: '123 Main St', units: undefined }, // Empty name will fail validation
          vendor: { name: 'WM', contact: undefined, phone: undefined, email: undefined },
          contractDates: {
            effectiveDate: '2024-01-01',
            expirationDate: '2026-12-31',
            termMonths: 36,
            autoRenew: false,
          },
          services: [],
          pricing: {
            monthlyBase: undefined,
            perPickup: undefined,
            perTon: undefined,
            fuelSurcharge: undefined,
            otherFees: undefined,
            escalationClause: undefined,
            cpiAdjustment: false,
          },
          terms: {
            terminationNoticeDays: 30,
            earlyTerminationPenalty: undefined,
            insuranceRequired: false,
            paymentTerms: 'Net 30',
            latePenalty: undefined,
          },
        },
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      // Should still succeed but filter out invalid contract
      // Note: Validation failures don't count as failed extractions (extraction succeeded, validation failed)
      expect(result.success).toBe(true)
      expect(result.data?.contracts).toHaveLength(0)
      expect(result.data?.summary.failedExtractions).toBe(0)
    })

    it('should continue processing after individual file failures', async () => {
      // Mock extraction to fail (simulating API error during extraction)
      mockExtractContractData.mockRejectedValueOnce(new Error('Vision API error'))

      const result = await skill.execute(mockContext)

      // Should still succeed overall even though extraction failed
      expect(result.success).toBe(true)
      expect(result.data?.summary.contractsProcessed).toBe(1)
      expect(result.data?.processingDetails).toHaveLength(1)
      expect(result.data?.processingDetails[0].status).toBe('failed')
      expect(result.data?.processingDetails[0].error).toContain('Vision API error')
      expect(result.data?.summary.failedExtractions).toBe(1)
    })
  })

  describe('Data Validation', () => {
    it('should validate contract dates', async () => {
      // Mock response with dates where expiration is before effective (invalid)
      mockExtractContractData.mockResolvedValue({
        contract: {
          sourceFile: 'contract.pdf',
          extractionDate: new Date().toISOString(),
          property: mockContractData.property,
          vendor: mockContractData.vendor,
          contractDates: {
            effectiveDate: '2026-12-31', // After expiration date
            expirationDate: '2024-01-01', // Before effective date - invalid!
            termMonths: 36,
            autoRenew: false,
          },
          services: mockContractData.services,
          pricing: mockContractData.pricing,
          terms: mockContractData.terms,
        },
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      // Should succeed and log warning about invalid dates, but not filter out
      // (validation only throws for missing/unparseable dates, warns for illogical dates)
      expect(result.success).toBe(true)
      expect(result.data?.contracts).toHaveLength(1)
    })

    it('should provide defaults for missing optional fields', async () => {
      // Mock response with minimal data
      mockExtractContractData.mockResolvedValue({
        contract: {
          sourceFile: 'contract.pdf',
          extractionDate: new Date().toISOString(),
          property: { name: 'Test Property', address: '123 Main St', units: undefined },
          vendor: { name: 'Test Vendor', contact: undefined, phone: undefined, email: undefined },
          contractDates: {
            effectiveDate: '2024-01-01',
            expirationDate: '2026-12-31',
            termMonths: 36,
            autoRenew: false,
          },
          services: [],
          pricing: {
            monthlyBase: undefined,
            perPickup: undefined,
            perTon: undefined,
            fuelSurcharge: undefined,
            otherFees: undefined,
            escalationClause: undefined,
            cpiAdjustment: false,
          },
          terms: {
            terminationNoticeDays: 0, // Will be defaulted to 30
            earlyTerminationPenalty: undefined,
            insuranceRequired: false,
            paymentTerms: '', // Will be defaulted to 'Net 30'
            latePenalty: undefined,
          },
        },
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      const contract = result.data!.contracts[0]

      // Should have defaults
      expect(contract.terms.terminationNoticeDays).toBe(30)
      expect(contract.terms.paymentTerms).toBe('Net 30')
      expect(contract.terms.insuranceRequired).toBe(false)
      expect(contract.pricing.cpiAdjustment).toBe(false)
      expect(contract.contractDates.autoRenew).toBe(false)
    })
  })
})
