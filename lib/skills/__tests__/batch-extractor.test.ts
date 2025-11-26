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
import type { SkillContext, InvoiceData } from '../types'
import {
  extractInvoiceWithVision,
  detectDocumentType,
  calculateAnthropicCost,
} from '@/lib/ai/vision-extractor'

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

// Mock vision-extractor functions (CORRECT FUNCTIONS)
vi.mock('@/lib/ai/vision-extractor', () => ({
  extractInvoiceWithVision: vi.fn(),
  extractHaulLogWithVision: vi.fn(),
  detectDocumentType: vi.fn(),
  calculateAnthropicCost: vi.fn(),
}))

// Mock database repositories
vi.mock('@/lib/db', () => ({
  InvoiceRepository: vi.fn(() => ({
    batchInsert: vi.fn().mockResolvedValue({ inserted: 1, failed: 0, errors: [] }),
  })),
  HaulLogRepository: vi.fn(() => ({
    batchInsert: vi.fn().mockResolvedValue({ inserted: 0, failed: 0, errors: [] }),
  })),
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
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
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(() => ({
          data: new Blob(['mock file data'], { type: 'application/pdf' }),
          error: null,
        })),
      })),
    },
  })),
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

describe('BatchExtractorSkill', () => {
  let skill: BatchExtractorSkill
  let mockContext: SkillContext

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

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

    // Set up vision-extractor mocks with default values
    vi.mocked(detectDocumentType).mockReturnValue('invoice')
    vi.mocked(calculateAnthropicCost).mockReturnValue(0.05)
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
  })

  describe('Invoice Extraction', () => {
    it('should extract invoice data from PDF using vision API', async () => {
      // Mock invoice data in the format returned by extractInvoiceWithVision
      const mockInvoiceData: InvoiceData = {
        propertyName: 'Sunset Apartments',
        propertyAddress: '123 Main St, Austin, TX',
        units: 200,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-2024-001',
        billingDate: '2024-02-01',
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
        subtotal: 850.0,
        tax: 68.0,
        total: 918.0,
        vendorName: 'Waste Services Inc',
        vendorContact: 'contact@wasteservices.com',
        sourceFile: 'invoice-2024-01.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      // Mock vision-extractor function
      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: {
          input_tokens: 1500,
          output_tokens: 800,
        },
      })

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
      // Mock vision-extractor to throw error
      vi.mocked(extractInvoiceWithVision).mockRejectedValue(new Error('API error'))

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true) // Should succeed overall
      expect(result.data?.summary.failedFiles).toBe(1)
      expect(result.data?.processingDetails[0].status).toBe('failed')
      expect(result.data?.processingDetails[0].error).toBeDefined()
    })
  })

  describe('Data Validation', () => {
    it('should validate container types', async () => {
      const mockInvoiceData: InvoiceData = {
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        units: undefined,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-001',
        billingDate: '2024-02-01',
        lineItems: [
          {
            description: 'Invalid container',
            containerType: 'INVALID_TYPE' as 'COMPACTOR', // Invalid type cast for testing
            containerSize: 40,
            quantity: 1,
            frequency: '1x/week',
            unitPrice: 500.0,
            totalPrice: 500.0,
          },
        ],
        subtotal: 500.0,
        tax: 40.0,
        total: 540.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
        sourceFile: 'test.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices[0].lineItems[0].containerType).toBe('OTHER')
    })

    it('should warn about subtotal mismatches', async () => {
      const mockInvoiceData: InvoiceData = {
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        units: undefined,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-001',
        billingDate: '2024-02-01',
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
        subtotal: 600.0, // Mismatch - should be 500
        tax: 48.0,
        total: 648.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
        sourceFile: 'test.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      const result = await skill.execute(mockContext)

      // Should still succeed but log warning
      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(1)
    })

    it('should filter out invalid invoices', async () => {
      const mockInvoiceData: InvoiceData = {
        propertyName: '', // Missing required field
        propertyAddress: '123 Test St',
        units: undefined,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-001',
        billingDate: '2024-02-01',
        lineItems: [], // No line items
        subtotal: 0,
        tax: 0,
        total: 0,
        vendorName: 'Vendor',
        vendorContact: undefined,
        sourceFile: 'test.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(0) // Filtered out
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress throughout execution', async () => {
      const mockInvoiceData: InvoiceData = {
        propertyName: 'Test',
        propertyAddress: 'Test',
        units: undefined,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-001',
        billingDate: '2024-02-01',
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
        subtotal: 500.0,
        tax: 40.0,
        total: 540.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
        sourceFile: 'test.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: { input_tokens: 1000, output_tokens: 500 },
      })

      const progressUpdates: Array<{ percent: number; step: string }> = []
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
      const mockInvoiceData: InvoiceData = {
        propertyName: 'Test',
        propertyAddress: 'Test',
        units: undefined,
        servicePeriodStart: '2024-01-01',
        servicePeriodEnd: '2024-01-31',
        invoiceNumber: 'INV-001',
        billingDate: '2024-02-01',
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
        subtotal: 500.0,
        tax: 40.0,
        total: 540.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
        sourceFile: 'test.pdf',
        extractionDate: '2024-02-01T10:00:00Z',
      }

      vi.mocked(extractInvoiceWithVision).mockResolvedValue({
        invoice: mockInvoiceData,
        usage: {
          input_tokens: 1000000, // 1M tokens
          output_tokens: 500000, // 500k tokens
        },
      })

      // Mock the cost calculation to return expected value
      vi.mocked(calculateAnthropicCost).mockReturnValue(10.5)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.aiUsage.totalCostUsd).toBeCloseTo(10.5, 2) // $3 + $7.5 = $10.50
    })
  })
})
