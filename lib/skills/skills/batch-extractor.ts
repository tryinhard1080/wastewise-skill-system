/**
 * Batch Extractor Skill
 *
 * Extracts structured data from multiple invoices, haul logs, and other
 * waste management documents using Claude Vision API.
 *
 * Supports:
 * - PDF, PNG, JPG, JPEG files (via Claude Vision)
 * - Excel files (direct parsing)
 * - CSV files (direct parsing)
 *
 * Features:
 * - Batch processing of multiple files
 * - Progress tracking per file
 * - Graceful error handling (continues on file failures)
 * - Data validation and normalization
 * - AI usage tracking
 */

import { BaseSkill } from '../base-skill'
import type {
  SkillContext,
  ValidationResult,
  BatchExtractorResult,
  InvoiceData,
  HaulLogEntry,
  ProcessingDetail,
} from '../types'
import {
  extractInvoiceWithVision,
  extractHaulLogWithVision,
  detectDocumentType,
  calculateAnthropicCost,
} from '@/lib/ai/vision-extractor'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'
import { metrics } from '@/lib/observability/metrics'
import { SkillExecutionError, ValidationError } from '@/lib/types/errors'

/**
 * Container type validation
 */
const VALID_CONTAINER_TYPES = ['COMPACTOR', 'DUMPSTER', 'OPEN_TOP', 'OTHER'] as const
const VALID_SERVICE_TYPES = ['PICKUP', 'DELIVERY', 'EXCHANGE', 'OTHER'] as const

export class BatchExtractorSkill extends BaseSkill<BatchExtractorResult> {
  readonly name = 'batch-extractor'
  readonly version = '1.0.0'
  readonly description =
    'Extracts structured data from waste management documents using Claude Vision API'

  /**
   * Validate that we have files to process
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const validationLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    validationLogger.debug('Starting validation')

    const errors: Array<{ field: string; message: string; code: string }> = []

    // Get files from database
    const supabase = await createClient()
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', context.projectId)

    if (filesError) {
      errors.push({
        field: 'project_files',
        message: `Failed to fetch project files: ${filesError.message}`,
        code: 'DATABASE_ERROR',
      })
    } else if (!files || files.length === 0) {
      errors.push({
        field: 'project_files',
        message: 'No files found for this project. Upload files before running extraction.',
        code: 'NO_FILES',
      })
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      errors.push({
        field: 'anthropic_api_key',
        message: 'ANTHROPIC_API_KEY environment variable is not set',
        code: 'MISSING_API_KEY',
      })
    }

    if (errors.length > 0) {
      validationLogger.warn('Validation failed', { errors })
      return { valid: false, errors }
    }

    validationLogger.debug('Validation passed', { fileCount: files?.length })
    return { valid: true }
  }

  /**
   * Execute batch extraction
   */
  protected async executeInternal(context: SkillContext): Promise<BatchExtractorResult> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    executionLogger.info('Starting batch extraction')

    // Initialize result containers
    const invoices: InvoiceData[] = []
    const haulLogs: HaulLogEntry[] = []
    const processingDetails: ProcessingDetail[] = []
    let totalRequests = 0
    let totalTokensInput = 0
    let totalTokensOutput = 0

    // Get files from database
    await this.updateProgress(context, {
      percent: 5,
      step: 'Fetching project files',
    })

    const supabase = await createClient()
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', context.projectId)

    if (filesError || !files || files.length === 0) {
      throw new SkillExecutionError(
        this.name,
        'NO_FILES',
        'No files found to process'
      )
    }

    executionLogger.info('Files retrieved', { fileCount: files.length })

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const percentComplete = Math.round(((i + 1) / files.length) * 85) + 10 // 10-95%

      this.checkCancellation(context)

      await this.updateProgress(context, {
        percent: percentComplete,
        step: `Processing file ${i + 1}/${files.length}: ${file.file_name}`,
        stepNumber: i + 1,
        totalSteps: files.length,
      })

      try {
        executionLogger.debug('Processing file', {
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          mimeType: file.mime_type,
        })

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('project-files')
          .download(file.storage_path)

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message}`)
        }

        // Convert Blob to Buffer
        const arrayBuffer = await fileData.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // Process based on file type
        const processedData = await this.processFile(
          file,
          fileBuffer,
          executionLogger
        )

        // Add to results
        if (processedData.invoices) {
          invoices.push(...processedData.invoices)
        }
        if (processedData.haulLogs) {
          haulLogs.push(...processedData.haulLogs)
        }

        // Track AI usage
        if (processedData.usage) {
          totalRequests++
          totalTokensInput += processedData.usage.input_tokens
          totalTokensOutput += processedData.usage.output_tokens
        }

        // Record success
        processingDetails.push({
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          status: 'success',
          extractedRecords:
            (processedData.invoices?.length || 0) +
            (processedData.haulLogs?.length || 0),
        })

        metrics.increment('batch_extractor.file.success', 1, {
          projectId: context.projectId,
          fileType: file.file_type,
        })

        executionLogger.info('File processed successfully', {
          fileId: file.id,
          invoicesExtracted: processedData.invoices?.length || 0,
          haulLogsExtracted: processedData.haulLogs?.length || 0,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'

        executionLogger.error(`Failed to process file: ${file.file_name}`, error as Error)

        processingDetails.push({
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          status: 'failed',
          extractedRecords: 0,
          error: errorMessage,
        })

        metrics.increment('batch_extractor.file.failed', 1, {
          projectId: context.projectId,
          fileType: file.file_type,
        })

        // Continue processing other files
      }
    }

    // Validate all extracted data
    await this.updateProgress(context, {
      percent: 95,
      step: 'Validating extracted data',
    })

    executionLogger.debug('Validating extracted data')

    const validatedInvoices = invoices
      .map((invoice) => this.validateInvoiceData(invoice, executionLogger))
      .filter((inv): inv is InvoiceData => inv !== null)

    const validatedHaulLogs = haulLogs
      .map((log) => this.validateHaulLogEntry(log, executionLogger))
      .filter((log): log is HaulLogEntry => log !== null)

    // Calculate total cost
    const totalCostUsd = calculateAnthropicCost({
      input_tokens: totalTokensInput,
      output_tokens: totalTokensOutput,
    })

    executionLogger.info('Batch extraction complete', {
      totalFiles: files.length,
      successfulFiles: processingDetails.filter((d) => d.status === 'success').length,
      failedFiles: processingDetails.filter((d) => d.status === 'failed').length,
      invoicesExtracted: validatedInvoices.length,
      haulLogsExtracted: validatedHaulLogs.length,
      totalCostUsd,
    })

    metrics.record('batch_extractor.ai_cost_usd', totalCostUsd, 'usd', {
      projectId: context.projectId,
    })

    await this.updateProgress(context, {
      percent: 100,
      step: 'Extraction complete',
    })

    return {
      summary: {
        totalFilesProcessed: files.length,
        invoicesExtracted: validatedInvoices.length,
        haulLogsExtracted: validatedHaulLogs.length,
        failedFiles: processingDetails.filter((d) => d.status === 'failed').length,
      },
      invoices: validatedInvoices,
      haulLogs: validatedHaulLogs,
      processingDetails,
      aiUsage: {
        totalRequests,
        totalTokensInput,
        totalTokensOutput,
        totalCostUsd,
      },
    }
  }

  /**
   * Process a single file based on its type
   */
  private async processFile(
    file: any,
    fileBuffer: Buffer,
    executionLogger: any
  ): Promise<{
    invoices?: InvoiceData[]
    haulLogs?: HaulLogEntry[]
    usage?: { input_tokens: number; output_tokens: number }
  }> {
    const mimeType = file.mime_type || 'application/octet-stream'

    // Handle image/PDF files with Vision API
    if (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf'
    ) {
      return this.processWithVision(file, fileBuffer, mimeType, executionLogger)
    }

    // Handle Excel files (TODO: Implement Excel parsing)
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      executionLogger.warn('Excel parsing not yet implemented', {
        fileName: file.file_name,
      })
      throw new Error('Excel file processing not yet implemented')
    }

    // Handle CSV files (TODO: Implement CSV parsing)
    if (mimeType === 'text/csv') {
      executionLogger.warn('CSV parsing not yet implemented', {
        fileName: file.file_name,
      })
      throw new Error('CSV file processing not yet implemented')
    }

    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  /**
   * Process file using Claude Vision API
   */
  private async processWithVision(
    file: any,
    fileBuffer: Buffer,
    mimeType: string,
    executionLogger: any
  ): Promise<{
    invoices?: InvoiceData[]
    haulLogs?: HaulLogEntry[]
    usage?: { input_tokens: number; output_tokens: number }
  }> {
    // Detect document type
    const docType = detectDocumentType(file.file_name)

    executionLogger.debug('Processing with Vision API', {
      fileName: file.file_name,
      detectedType: docType,
    })

    if (docType === 'invoice') {
      const result = await extractInvoiceWithVision(
        fileBuffer,
        mimeType,
        file.file_name
      )
      return {
        invoices: [result.invoice],
        usage: result.usage,
      }
    } else if (docType === 'haul-log') {
      const result = await extractHaulLogWithVision(
        fileBuffer,
        mimeType,
        file.file_name
      )
      return {
        haulLogs: result.haulLogs,
        usage: result.usage,
      }
    } else {
      // Default to invoice extraction if type is unknown
      executionLogger.warn('Unknown document type, defaulting to invoice extraction', {
        fileName: file.file_name,
      })
      const result = await extractInvoiceWithVision(
        fileBuffer,
        mimeType,
        file.file_name
      )
      return {
        invoices: [result.invoice],
        usage: result.usage,
      }
    }
  }

  /**
   * Validate invoice data
   */
  private validateInvoiceData(
    invoice: InvoiceData,
    executionLogger: any
  ): InvoiceData | null {
    try {
      // Required fields
      if (!invoice.propertyName) {
        throw new Error('Missing property name')
      }

      if (!invoice.vendorName) {
        throw new Error('Missing vendor name')
      }

      if (!invoice.lineItems || invoice.lineItems.length === 0) {
        throw new Error('No line items found')
      }

      // Validate container types
      for (const item of invoice.lineItems) {
        if (!VALID_CONTAINER_TYPES.includes(item.containerType)) {
          executionLogger.warn('Invalid container type, defaulting to OTHER', {
            original: item.containerType,
            fileName: invoice.sourceFile,
          })
          item.containerType = 'OTHER'
        }
      }

      // Validate totals (warn if mismatch, don't fail)
      const calculatedSubtotal = invoice.lineItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      )

      if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
        executionLogger.warn('Subtotal mismatch', {
          calculated: calculatedSubtotal,
          extracted: invoice.subtotal,
          fileName: invoice.sourceFile,
        })
      }

      return invoice
    } catch (error) {
      executionLogger.error(
        `Invoice validation failed: ${invoice.sourceFile}`,
        error as Error
      )
      return null
    }
  }

  /**
   * Validate haul log entry
   */
  private validateHaulLogEntry(
    log: HaulLogEntry,
    executionLogger: any
  ): HaulLogEntry | null {
    try {
      // Required fields
      if (!log.date) {
        throw new Error('Missing date')
      }

      // Validate container type
      if (!VALID_CONTAINER_TYPES.includes(log.containerType)) {
        executionLogger.warn('Invalid container type, defaulting to OTHER', {
          original: log.containerType,
          fileName: log.sourceFile,
        })
        log.containerType = 'OTHER'
      }

      // Validate service type
      if (!VALID_SERVICE_TYPES.includes(log.serviceType)) {
        executionLogger.warn('Invalid service type, defaulting to OTHER', {
          original: log.serviceType,
          fileName: log.sourceFile,
        })
        log.serviceType = 'OTHER'
      }

      // Ensure at least weight or volume is present
      if (!log.weight && !log.volume) {
        executionLogger.warn('Missing both weight and volume', {
          fileName: log.sourceFile,
        })
      }

      return log
    } catch (error) {
      executionLogger.error(`Haul log validation failed: ${log.sourceFile}`, error as Error)
      return null
    }
  }
}
