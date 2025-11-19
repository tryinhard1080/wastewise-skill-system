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

// Create mock functions using vi.hoisted() for proper hoisting
const { mockExtractInvoiceWithVision, mockExtractHaulLogWithVision, mockDetectDocumentType, mockCalculateAnthropicCost } = vi.hoisted(() => ({
  mockExtractInvoiceWithVision: vi.fn(),
  mockExtractHaulLogWithVision: vi.fn(),
  mockDetectDocumentType: vi.fn(),
  mockCalculateAnthropicCost: vi.fn(),
}))

// Mock vision-extractor module (the skill uses these functions)
vi.mock('@/lib/ai/vision-extractor', () => ({
  extractInvoiceWithVision: mockExtractInvoiceWithVision,
  extractHaulLogWithVision: mockExtractHaulLogWithVision,
  detectDocumentType: mockDetectDocumentType,
  calculateAnthropicCost: mockCalculateAnthropicCost,
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({
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
    }),
    storage: {
      from: vi.fn().mockReturnThis(),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['mock file data']),
        error: null,
      }),
    },
  }),
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
  })

  describe('Invoice Extraction', () => {
    it('should extract invoice data from PDF using vision API', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invoice data
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-2024-01.pdf',
        extractionDate: new Date().toISOString(),
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
      }

      // Mock vision extraction
      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: {
          input_tokens: 1500,
          output_tokens: 800,
        },
      })

      // Mock cost calculation
      mockCalculateAnthropicCost.mockReturnValue(10.5)

      const result = await skill.execute(mockContext)

      // Debug: log error if test fails
      if (!result.success) {
        console.error('Skill execution failed:', result.error)
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.invoices).toHaveLength(1)
      expect(result.data?.invoices[0].propertyName).toBe('Sunset Apartments')
      expect(result.data?.aiUsage.totalTokensInput).toBe(1500)
      expect(result.data?.aiUsage.totalTokensOutput).toBe(800)
      expect(result.data?.aiUsage.totalCostUsd).toBeGreaterThan(0)
    })

    it('should handle extraction failures gracefully', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock extraction failure
      mockExtractInvoiceWithVision.mockRejectedValue(new Error('API error'))

      // Mock cost calculation (won't be called but needed for type safety)
      mockCalculateAnthropicCost.mockReturnValue(0)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true) // Should succeed overall
      expect(result.data?.summary.failedFiles).toBe(1)
      expect(result.data?.processingDetails[0].status).toBe('failed')
      expect(result.data?.processingDetails[0].error).toBeDefined()
    })
  })

  describe('Data Validation', () => {
    it('should validate container types', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invoice with invalid container type
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-001.pdf',
        extractionDate: new Date().toISOString(),
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
            containerType: 'INVALID_TYPE' as any, // Invalid type
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
      }

      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockCalculateAnthropicCost.mockReturnValue(5.0)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices[0].lineItems[0].containerType).toBe('OTHER')
    })

    it('should warn about subtotal mismatches', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invoice with subtotal mismatch
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-001.pdf',
        extractionDate: new Date().toISOString(),
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
      }

      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockCalculateAnthropicCost.mockReturnValue(5.0)

      const result = await skill.execute(mockContext)

      // Should still succeed but log warning
      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(1)
    })

    it('should filter out invalid invoices', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invalid invoice (missing required fields)
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-001.pdf',
        extractionDate: new Date().toISOString(),
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
      }

      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      })

      mockCalculateAnthropicCost.mockReturnValue(5.0)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.invoices).toHaveLength(0) // Filtered out
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress throughout execution', async () => {
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invoice data
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-001.pdf',
        extractionDate: new Date().toISOString(),
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
        subtotal: 500.0,
        tax: 40.0,
        total: 540.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
      }

      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: { input_tokens: 1000, output_tokens: 500 },
      })

      mockCalculateAnthropicCost.mockReturnValue(5.0)

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
      // Mock document type detection
      mockDetectDocumentType.mockReturnValue('invoice')

      // Mock invoice data
      const mockInvoice: InvoiceData = {
        sourceFile: 'invoice-001.pdf',
        extractionDate: new Date().toISOString(),
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
        subtotal: 500.0,
        tax: 40.0,
        total: 540.0,
        vendorName: 'Vendor',
        vendorContact: undefined,
      }

      mockExtractInvoiceWithVision.mockResolvedValue({
        invoice: mockInvoice,
        usage: {
          input_tokens: 1000000, // 1M tokens
          output_tokens: 500000, // 500k tokens
        },
      })

      // Mock cost calculation: (1M * $3/M) + (500k * $15/M) = $3 + $7.5 = $10.50
      mockCalculateAnthropicCost.mockReturnValue(10.5)

      const result = await skill.execute(mockContext)

      expect(result.success).toBe(true)
      expect(result.data?.aiUsage.totalCostUsd).toBeCloseTo(10.5, 2) // $3 + $7.5 = $10.50
    })
  })
})
