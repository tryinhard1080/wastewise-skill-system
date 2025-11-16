/**
 * Contract Extractor Skill
 *
 * Extracts structured contract terms and pricing data from waste management
 * service agreements using Claude Vision API.
 *
 * Supports:
 * - PDF and image files (via Claude Vision)
 * - Property and vendor information
 * - Contract dates and terms
 * - Service specifications
 * - Pricing structures
 * - Terms and obligations
 *
 * Features:
 * - Batch processing of multiple contracts
 * - Progress tracking per file
 * - Graceful error handling (continues on file failures)
 * - Data validation and normalization
 * - AI usage tracking
 */

import { BaseSkill } from '../base-skill'
import type {
  SkillContext,
  ValidationResult,
  ContractExtractorResult,
  ContractData,
  ProcessingDetail,
} from '../types'
import {
  extractContractData,
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

export class ContractExtractorSkill extends BaseSkill<ContractExtractorResult> {
  readonly name = 'contract-extractor'
  readonly version = '1.0.0'
  readonly description =
    'Extracts structured data from waste management service agreements using Claude Vision API'

  /**
   * Validate that we have contract files to process
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const validationLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    validationLogger.debug('Starting validation')

    const errors: Array<{ field: string; message: string; code: string }> = []

    // Get contract files from database
    const supabase = await createClient()
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', context.projectId)
      .eq('file_type', 'contract')

    if (filesError) {
      errors.push({
        field: 'project_files',
        message: `Failed to fetch contract files: ${filesError.message}`,
        code: 'DATABASE_ERROR',
      })
    } else if (!files || files.length === 0) {
      errors.push({
        field: 'project_files',
        message: 'No contract files found for this project. Upload contract files before running extraction.',
        code: 'NO_CONTRACT_FILES',
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
   * Execute contract extraction
   */
  protected async executeInternal(context: SkillContext): Promise<ContractExtractorResult> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    executionLogger.info('Starting contract extraction')

    // Initialize result containers
    const contracts: ContractData[] = []
    const processingDetails: ProcessingDetail[] = []
    let totalRequests = 0
    let totalTokensInput = 0
    let totalTokensOutput = 0

    // Get contract files from database
    await this.updateProgress(context, {
      percent: 5,
      step: 'Fetching contract files',
    })

    const supabase = await createClient()
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', context.projectId)
      .eq('file_type', 'contract')

    if (filesError || !files || files.length === 0) {
      throw new SkillExecutionError(
        this.name,
        'NO_CONTRACT_FILES',
        'No contract files found to process'
      )
    }

    executionLogger.info('Contract files retrieved', { fileCount: files.length })

    // Process each contract file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const percentComplete = Math.round(((i + 1) / files.length) * 85) + 10 // 10-95%

      this.checkCancellation(context)

      await this.updateProgress(context, {
        percent: percentComplete,
        step: `Extracting contract ${i + 1}/${files.length}: ${file.file_name}`,
        stepNumber: i + 1,
        totalSteps: files.length,
      })

      try {
        executionLogger.debug('Processing contract file', {
          fileId: file.id,
          fileName: file.file_name,
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

        // Extract contract data with Vision API
        const processedData = await this.processContract(
          file,
          fileBuffer,
          executionLogger
        )

        // Add to results
        contracts.push(processedData.contract)

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
          extractedRecords: 1,
        })

        metrics.increment('contract_extractor.file.success', 1, {
          projectId: context.projectId,
        })

        executionLogger.info('Contract file processed successfully', {
          fileId: file.id,
          contractName: processedData.contract.property.name,
          vendorName: processedData.contract.vendor.name,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'

        executionLogger.error(`Failed to process contract: ${file.file_name}`, error as Error)

        processingDetails.push({
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          status: 'failed',
          extractedRecords: 0,
          error: errorMessage,
        })

        metrics.increment('contract_extractor.file.failed', 1, {
          projectId: context.projectId,
        })

        // Continue processing other files
      }
    }

    // Validate all extracted data
    await this.updateProgress(context, {
      percent: 95,
      step: 'Validating extracted contract data',
    })

    executionLogger.debug('Validating extracted contract data')

    const validatedContracts = contracts
      .map((contract) => this.validateContractData(contract, executionLogger))
      .filter((contract): contract is ContractData => contract !== null)

    // Calculate total cost
    const totalCostUsd = calculateAnthropicCost({
      input_tokens: totalTokensInput,
      output_tokens: totalTokensOutput,
    })

    // Count total terms extracted
    const termsExtracted = validatedContracts.reduce((count, contract) => {
      // Count various contract components
      const serviceCount = contract.services.length
      const pricingCount = contract.pricing.monthlyBase ? 1 : 0
      const termsCount = 1 // Always have at least basic terms
      return count + serviceCount + pricingCount + termsCount
    }, 0)

    executionLogger.info('Contract extraction complete', {
      totalFiles: files.length,
      successfulFiles: processingDetails.filter((d) => d.status === 'success').length,
      failedFiles: processingDetails.filter((d) => d.status === 'failed').length,
      contractsExtracted: validatedContracts.length,
      termsExtracted,
      totalCostUsd,
    })

    metrics.record('contract_extractor.ai_cost_usd', totalCostUsd, 'usd', {
      projectId: context.projectId,
    })

    await this.updateProgress(context, {
      percent: 100,
      step: 'Contract extraction complete',
    })

    return {
      summary: {
        contractsProcessed: files.length,
        termsExtracted,
        failedExtractions: processingDetails.filter((d) => d.status === 'failed').length,
      },
      contracts: validatedContracts,
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
   * Process a single contract file using Claude Vision API
   */
  private async processContract(
    file: any,
    fileBuffer: Buffer,
    executionLogger: any
  ): Promise<{
    contract: ContractData
    usage?: { input_tokens: number; output_tokens: number }
  }> {
    const mimeType = file.mime_type || 'application/octet-stream'

    // Handle image/PDF files with Vision API
    if (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf'
    ) {
      executionLogger.debug('Processing contract with Vision API', {
        fileName: file.file_name,
        mimeType,
      })

      const result = await extractContractData(
        fileBuffer,
        mimeType,
        file.file_name
      )

      return {
        contract: result.contract,
        usage: result.usage,
      }
    }

    throw new Error(`Unsupported file type for contract extraction: ${mimeType}`)
  }

  /**
   * Validate contract data
   */
  private validateContractData(
    contract: ContractData,
    executionLogger: any
  ): ContractData | null {
    try {
      // Required fields
      if (!contract.property?.name) {
        throw new Error('Missing property name')
      }

      if (!contract.vendor?.name) {
        throw new Error('Missing vendor name')
      }

      if (!contract.contractDates?.effectiveDate) {
        throw new Error('Missing contract effective date')
      }

      if (!contract.contractDates?.expirationDate) {
        throw new Error('Missing contract expiration date')
      }

      // Validate dates
      const effectiveDate = new Date(contract.contractDates.effectiveDate)
      const expirationDate = new Date(contract.contractDates.expirationDate)

      if (isNaN(effectiveDate.getTime())) {
        throw new Error('Invalid contract effective date')
      }

      if (isNaN(expirationDate.getTime())) {
        throw new Error('Invalid contract expiration date')
      }

      if (expirationDate <= effectiveDate) {
        executionLogger.warn('Contract expiration date is before or equal to effective date', {
          fileName: contract.sourceFile,
          effectiveDate: contract.contractDates.effectiveDate,
          expirationDate: contract.contractDates.expirationDate,
        })
      }

      // Validate container types
      for (const service of contract.services) {
        if (!VALID_CONTAINER_TYPES.includes(service.containerType)) {
          executionLogger.warn('Invalid container type, defaulting to OTHER', {
            original: service.containerType,
            fileName: contract.sourceFile,
          })
          service.containerType = 'OTHER'
        }
      }

      // Validate pricing (warn if missing, don't fail)
      if (!contract.pricing.monthlyBase && !contract.pricing.perPickup && !contract.pricing.perTon) {
        executionLogger.warn('No pricing information found in contract', {
          fileName: contract.sourceFile,
        })
      }

      // Ensure required term defaults
      if (!contract.terms.terminationNoticeDays) {
        executionLogger.warn('Missing termination notice period, defaulting to 30 days', {
          fileName: contract.sourceFile,
        })
        contract.terms.terminationNoticeDays = 30
      }

      if (!contract.terms.paymentTerms) {
        executionLogger.warn('Missing payment terms, defaulting to Net 30', {
          fileName: contract.sourceFile,
        })
        contract.terms.paymentTerms = 'Net 30'
      }

      return contract
    } catch (error) {
      executionLogger.error(
        `Contract validation failed: ${contract.sourceFile}`,
        error as Error
      )
      return null
    }
  }
}
