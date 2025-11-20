/**
 * Unit tests for BatchExtractorSkill
 *
 * Tests:
 * - File format detection
 * - Vision extraction with mock Anthropic API
 * - Data validation
 * - Error handling for corrupt files
 * - Progress tracking
 * - AI usage calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BatchExtractorSkill } from '../skills/batch-extractor'
import type { SkillContext, InvoiceData, HaulLogEntry } from '../types'
import Anthropic from '@anthropic-ai/sdk'

const {
  mockSupabaseEq,
  mockSupabaseFrom,
  mockSupabaseSelect,
  mockStorageFrom,
  mockStorageDownload,
  mockCreateClient,
} = vi.hoisted(() => {
  const eq = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'file-1',
        file_name: 'invoice-2024-01.pdf',
        file_type: 'invoice',
        mime_type: 'application/pdf',
        storage_path: 'projects/proj-1/invoice-2024-01.pdf',
      },
    ],
    error: null,
  })
  const from = vi.fn().mockReturnThis()
  const select = vi.fn().mockReturnThis()
  const storageFrom = vi.fn().mockReturnThis()
  const storageDownload = vi.fn().mockResolvedValue({
    data: new Blob(['mock file data']),
    error: null,
  })

  const supabaseClient = {
    from,
    select,
    eq,
    storage: {
      from: storageFrom,
      download: storageDownload,
    },
  }

  const createClient = vi.fn().mockResolvedValue(supabaseClient)

  return {
    mockSupabaseEq: eq,
    mockSupabaseFrom: from,
    mockSupabaseSelect: select,
    mockStorageFrom: storageFrom,
    mockStorageDownload: storageDownload,
    mockCreateClient: createClient,
  }
})

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  }
})

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// Mock logger
vi.mock('@/lib/observability/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock metrics
vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    increment: vi.fn(),
    gauge: vi.fn(),
    record: vi.fn(),
  },
}))

function mockAnthropicWithCreate(mockCreate: ReturnType<typeof vi.fn>) {
  // @ts-ignore - Mocking the SDK constructor behavior
  Anthropic.mockImplementation(function () {
    return {
      messages: {
        create: mockCreate,
      },
    }
  })
}

describe('BatchExtractorSkill', () => {
  let skill: BatchExtractorSkill
  let mockContext: SkillContext

  beforeEach(() => {
    mockSupabaseEq.mockClear()
    mockSupabaseFrom.mockClear()
    mockSupabaseSelect.mockClear()
    mockStorageFrom.mockClear()
    mockStorageDownload.mockClear()
    mockCreateClient.mockClear()

    skill = new BatchExtractorSkill()

    // Setup mock context
    mockContext = {
      projectId: 'test-project-123',
      userId: 'test-user-123',
      project: {
        id: 'test-project-123',
        user_id: 'test-user-123',
        property_name: 'Test Property',
        units: 200,
        city: 'Austin',
        state: 'TX',
        property_type: 'Garden-Style',
        status: 'processing',
        equipment_type: 'COMPACTOR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0,
        total_savings: null,
        analysis_period_months: null,
        error_message: null,
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
      onProgress: vi.fn(),
    }

    // Set environment variable
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
  })

  describe('Metadata', () => {
    it('should have correct skill metadata', () => {
      expect(skill.name).toBe('batch-extractor')
      expect(skill.version).toBe('1.0.0')
      expect(skill.description).toContain('Claude Vision')
    })
  })

  describe('Validation', () => {
    it('should pass validation when files exist', async () => {
      const result = await skill.validate(mockContext)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation when API key is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await skill.validate(mockContext)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].code).toBe('MISSING_API_KEY')

      // Restore API key
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
    })

    it('should only fetch project files once per execution', async () => {
      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(mockSupabaseEq).toHaveBeenCalledTimes(1)
    })
  })

  describe('Invoice Extraction', () => {
    it('should extract invoice data from PDF using vision API', async () => {
      // Mock invoice data response
      const mockInvoiceData = {
        property: {
          name: 'Sunset Apartments',
          address: '123 Main St, Austin, TX',
          units: 200,
        },
        service: {
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          invoiceNumber: 'INV-2024-001',
          billingDate: '2024-02-01',
        },
        lineItems: [
          {
            description: 'Compactor Service',
            containerType: 'COMPACTOR',
            containerSize: 40,
            quantity: 1,
            frequency: '2x/week',
            unitPrice: 850.0,
            totalPrice: 850.0,
          },
        ],
        totals: {
          subtotal: 850.0,
          tax: 68.0,
          total: 918.0,
        },
        vendor: {
          name: 'Waste Services Inc',
          contact: 'contact@wasteservices.com',
        },
      }

      // Mock Anthropic API response
      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockInvoiceData),
          },
        ],
        usage: {
          input_tokens: 1500,
          output_tokens: 800,
        },
      })

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.invoices).toHaveLength(1)
      expect(result.data?.invoices[0].propertyName).toBe('Sunset Apartments')
      expect(result.data?.aiUsage.totalTokensInput).toBe(1500)
      expect(result.data?.aiUsage.totalTokensOutput).toBe(800)
      expect(result.data?.aiUsage.totalCostUsd).toBeGreaterThan(0)
    })

    it('should handle extraction failures gracefully', async () => {
      // Mock API failure
      const mockCreate = vi.fn().mockRejectedValue(new Error('API error'))

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true) // Should succeed overall
      expect(result.data?.summary.failedFiles).toBe(1)
      expect(result.data?.processingDetails[0].status).toBe('failed')
      expect(result.data?.processingDetails[0].error).toBeDefined()
    })
  })

  describe('Data Validation', () => {
    it('should validate container types', async () => {
      const mockInvoiceData = {
        property: {
          name: 'Test Property',
          address: '123 Test St',
          units: null,
        },
        service: {
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          invoiceNumber: 'INV-001',
          billingDate: '2024-02-01',
        },
        lineItems: [
          {
            description: 'Invalid container',
            containerType: 'INVALID_TYPE', // Invalid type
            containerSize: 40,
            quantity: 1,
            frequency: '1x/week',
            unitPrice: 500.0,
            totalPrice: 500.0,
          },
        ],
        totals: {
          subtotal: 500.0,
          tax: 40.0,
          total: 540.0,
        },
        vendor: {
          name: 'Vendor',
          contact: null,
        },
      }

      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockInvoiceData),
          },
        ],
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices[0].lineItems[0].containerType).toBe('OTHER')
    })

    it('should warn about subtotal mismatches', async () => {
      const mockInvoiceData = {
        property: {
          name: 'Test Property',
          address: '123 Test St',
          units: null,
        },
        service: {
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          invoiceNumber: 'INV-001',
          billingDate: '2024-02-01',
        },
        lineItems: [
          {
            description: 'Service',
            containerType: 'COMPACTOR',
            containerSize: 40,
            quantity: 1,
            frequency: '1x/week',
            unitPrice: 500.0,
            totalPrice: 500.0,
          },
        ],
        totals: {
          subtotal: 600.0, // Mismatch - should be 500
          tax: 48.0,
          total: 648.0,
        },
        vendor: {
          name: 'Vendor',
          contact: null,
        },
      }

      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockInvoiceData),
          },
        ],
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      // Should still succeed but log warning
      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(1)
    })

    it('should filter out invalid invoices', async () => {
      const mockInvoiceData = {
        property: {
          name: '', // Missing required field
          address: '123 Test St',
          units: null,
        },
        service: {
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          invoiceNumber: 'INV-001',
          billingDate: '2024-02-01',
        },
        lineItems: [], // No line items
        totals: {
          subtotal: 0,
          tax: 0,
          total: 0,
        },
        vendor: {
          name: 'Vendor',
          contact: null,
        },
      }

      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockInvoiceData),
          },
        ],
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(0) // Filtered out
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress throughout execution', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              property: { name: 'Test', address: 'Test', units: null },
              service: {
                periodStart: '2024-01-01',
                periodEnd: '2024-01-31',
                invoiceNumber: 'INV-001',
                billingDate: '2024-02-01',
              },
              lineItems: [
                {
                  description: 'Service',
                  containerType: 'COMPACTOR',
                  containerSize: 40,
                  quantity: 1,
                  frequency: '1x/week',
                  unitPrice: 500.0,
                  totalPrice: 500.0,
                },
              ],
              totals: { subtotal: 500.0, tax: 40.0, total: 540.0 },
              vendor: { name: 'Vendor', contact: null },
            }),
          },
        ],
        usage: { input_tokens: 1000, output_tokens: 500 },
      })

      mockAnthropicWithCreate(mockCreate)

      const progressUpdates: any[] = []
      mockContext.onProgress = vi.fn((progress) => {
        progressUpdates.push(progress)
        return Promise.resolve()
      })

      await skill.execute(mockContext)

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].percent).toBeGreaterThanOrEqual(0)
      expect(progressUpdates[progressUpdates.length - 1].percent).toBe(100)
    })
  })

  describe('Cost Calculation', () => {
    it('should calculate AI usage costs accurately', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              property: { name: 'Test', address: 'Test', units: null },
              service: {
                periodStart: '2024-01-01',
                periodEnd: '2024-01-31',
                invoiceNumber: 'INV-001',
                billingDate: '2024-02-01',
              },
              lineItems: [
                {
                  description: 'Service',
                  containerType: 'COMPACTOR',
                  containerSize: 40,
                  quantity: 1,
                  frequency: '1x/week',
                  unitPrice: 500.0,
                  totalPrice: 500.0,
                },
              ],
              totals: { subtotal: 500.0, tax: 40.0, total: 540.0 },
              vendor: { name: 'Vendor', contact: null },
            }),
          },
        ],
        usage: {
          input_tokens: 1000000, // 1M tokens
          output_tokens: 500000, // 500k tokens
        },
      })

      mockAnthropicWithCreate(mockCreate)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.aiUsage.totalCostUsd).toBeCloseTo(10.5, 2) // $3 + $7.5 = $10.50
    })
  })
})
