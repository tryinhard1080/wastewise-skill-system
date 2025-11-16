/**
 * Contract Extractor Skill Tests
 *
 * Tests for the ContractExtractorSkill class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContractExtractorSkill } from '@/lib/skills/skills/contract-extractor'
import type { SkillContext, ContractData } from '@/lib/skills/types'
import Anthropic from '@anthropic-ai/sdk'

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

// Mock Anthropic API
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn()
  return {
    default: vi.fn(() => ({
      messages: {
        create: mockCreate,
      },
    })),
    __mockCreate: mockCreate,
  }
})

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
      // Mock Anthropic API response
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockContractData),
          },
        ],
        usage: {
          input_tokens: 2500,
          output_tokens: 1200,
        },
      })
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
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...mockContractData,
              services: [
                {
                  containerType: 'compactor', // lowercase - should be normalized
                  containerSize: 30,
                  frequency: '2x/week',
                },
              ],
            }),
          },
        ],
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
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      // Mock response with missing property name
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              property: { address: '123 Main St' }, // Missing name
              vendor: { name: 'WM' },
              contractDates: {
                effectiveDate: '2024-01-01',
                expirationDate: '2026-12-31',
                termMonths: 36,
              },
              services: [],
              pricing: {},
              terms: {},
            }),
          },
        ],
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      // Should still succeed but filter out invalid contract
      expect(result.success).toBe(true)
      expect(result.data?.contracts).toHaveLength(0)
      expect(result.data?.summary.failedExtractions).toBeGreaterThan(0)
    })

    it('should continue processing after individual file failures', async () => {
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      // First call fails, second succeeds
      mockCreate
        .mockRejectedValueOnce(new Error('Vision API error'))
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(mockContractData) }],
          usage: { input_tokens: 2500, output_tokens: 1200 },
        })

      // Mock multiple files
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValueOnce({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [
                  {
                    id: 'file-1',
                    file_name: 'contract1.pdf',
                    file_type: 'contract',
                    mime_type: 'application/pdf',
                    storage_path: 'contracts/contract1.pdf',
                  },
                  {
                    id: 'file-2',
                    file_name: 'contract2.pdf',
                    file_type: 'contract',
                    mime_type: 'application/pdf',
                    storage_path: 'contracts/contract2.pdf',
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
              data: new Blob([Buffer.from('mock pdf content')]),
              error: null,
            })),
          })),
        },
      } as any)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.summary.contractsProcessed).toBe(2)
      expect(result.data?.processingDetails).toHaveLength(2)
      expect(
        result.data?.processingDetails.filter((d) => d.status === 'success')
      ).toHaveLength(1)
      expect(
        result.data?.processingDetails.filter((d) => d.status === 'failed')
      ).toHaveLength(1)
    })
  })

  describe('Data Validation', () => {
    it('should validate contract dates', async () => {
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      // Mock response with invalid dates
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...mockContractData,
              contractDates: {
                effectiveDate: 'invalid-date',
                expirationDate: '2026-12-31',
                termMonths: 36,
              },
            }),
          },
        ],
        usage: { input_tokens: 2500, output_tokens: 1200 },
      })

      const result = await skill.execute(mockContext)

      // Should filter out contract with invalid dates
      expect(result.success).toBe(true)
      expect(result.data?.contracts).toHaveLength(0)
    })

    it('should provide defaults for missing optional fields', async () => {
      const Anthropic = require('@anthropic-ai/sdk')
      const mockCreate = Anthropic.__mockCreate

      // Mock response with minimal data
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              property: { name: 'Test Property', address: '123 Main St' },
              vendor: { name: 'Test Vendor' },
              contractDates: {
                effectiveDate: '2024-01-01',
                expirationDate: '2026-12-31',
                termMonths: 36,
              },
              services: [],
              pricing: {},
              terms: {}, // Missing all term details
            }),
          },
        ],
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
