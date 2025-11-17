/**
 * WasteWise Analytics Orchestrator Skill
 *
 * Main orchestration skill that coordinates all sub-skills to deliver
 * a complete waste management analysis with comprehensive reports.
 *
 * Orchestration Flow:
 * 1. Data Extraction (30%) - Invoice data, contract terms
 * 2. Analysis (60%) - Compactor optimization, benchmarks, compliance
 * 3. Report Generation (90%) - Excel workbook + HTML dashboard
 * 4. Result Assembly (100%) - Aggregate findings, calculate total savings
 *
 * CRITICAL: This skill coordinates other skills but does NOT duplicate their logic.
 * All calculations must be delegated to appropriate sub-skills.
 *
 * @see WASTE_FORMULAS_REFERENCE.md v2.0
 */

import { BaseSkill } from '../base-skill'
import {
  SkillContext,
  SkillResult,
  ValidationResult,
  WasteWiseAnalyticsCompleteResult,
  CompactorOptimizationResult,
} from '../types'
import {
  calculateCostPerDoor,
  calculateCompactorYardsPerDoor,
  calculateDumpsterYardsPerDoor,
  LEASEUP_VARIANCE_THRESHOLD,
  CONTAMINATION_THRESHOLD_PCT,
  BULK_SUBSCRIPTION_THRESHOLD,
} from '@/lib/constants/formulas'
import { logger } from '@/lib/observability/logger'
import { metrics } from '@/lib/observability/metrics'
import { InsufficientDataError, ValidationError } from '@/lib/types/errors'

/**
 * Invoice metrics calculated from invoice data
 */
interface InvoiceMetrics {
  totalSpend: number
  dateRange: {
    start: string
    end: string
  }
  costPerDoor: number
  yardsPerDoor: number
  contaminationSpend: number
  contaminationPercent: number
  bulkSpend: number
  avgBulkMonthly: number
}

export class WasteWiseAnalyticsSkill extends BaseSkill<WasteWiseAnalyticsCompleteResult> {
  readonly name = 'wastewise-analytics'
  readonly version = '1.0.0'
  readonly description =
    'Complete waste management analysis orchestrator coordinating all sub-skills'

  /**
   * Validate that we have minimum required data for analysis
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const validationLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    validationLogger.debug('Starting validation')

    const errors: Array<{ field: string; message: string; code: string }> = []

    // Check for invoice data (minimum requirement)
    if (!context.invoices || context.invoices.length === 0) {
      errors.push({
        field: 'invoices',
        message: 'No invoice data found. At least one invoice is required for analysis.',
        code: 'MISSING_INVOICES',
      })
    }

    // Check for property data
    if (!context.project.units || context.project.units < 10) {
      errors.push({
        field: 'units',
        message: 'Invalid unit count. Property must have at least 10 units.',
        code: 'INVALID_UNIT_COUNT',
      })
    }

    if (errors.length > 0) {
      validationLogger.warn('Validation failed', { errors })
      return { valid: false, errors }
    }

    validationLogger.debug('Validation passed')
    return { valid: true }
  }

  /**
   * Execute complete WasteWise analytics workflow
   */
  protected async executeInternal(
    context: SkillContext
  ): Promise<WasteWiseAnalyticsCompleteResult> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    executionLogger.info('Starting WasteWise complete analysis')

    const startTime = Date.now()
    const aiUsageTracker = {
      totalRequests: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      totalCostUsd: 0,
    }

    // ========================================================================
    // STEP 1: DATA EXTRACTION (0-30%)
    // ========================================================================
    await this.updateProgress(context, {
      percent: 5,
      step: 'Analyzing invoice data',
      stepNumber: 1,
      totalSteps: 5,
    })

    // Calculate basic metrics from invoice data
    const invoiceMetrics = this.calculateInvoiceMetrics(context)
    executionLogger.debug('Invoice metrics calculated', invoiceMetrics)

    await this.updateProgress(context, {
      percent: 20,
      step: 'Checking for lease-up conditions',
      stepNumber: 1,
      totalSteps: 5,
    })

    // Check for lease-up (prevents optimization recommendations)
    const leaseUpDetected = this.detectLeaseUp(context, invoiceMetrics)
    if (leaseUpDetected) {
      executionLogger.warn('Lease-up detected - limiting optimization recommendations')
    }

    await this.updateProgress(context, {
      percent: 30,
      step: 'Data extraction complete',
      stepNumber: 1,
      totalSteps: 5,
    })

    // ========================================================================
    // STEP 2: OPTIMIZATION ANALYSIS (30-60%)
    // ========================================================================
    await this.updateProgress(context, {
      percent: 35,
      step: 'Running optimization analyses',
      stepNumber: 2,
      totalSteps: 5,
    })

    const recommendations: WasteWiseAnalyticsCompleteResult['recommendations'] = []
    let compactorOptimization: CompactorOptimizationResult | undefined

    // Run compactor optimization if applicable
    if (this.shouldRunCompactorOptimization(context)) {
      executionLogger.info('Running compactor optimization analysis')

      try {
        await this.updateProgress(context, {
          percent: 40,
          step: 'Analyzing compactor efficiency',
          stepNumber: 2,
          totalSteps: 5,
        })

        const { CompactorOptimizationSkill } = await import('./compactor-optimization')
        const compactorSkill = new CompactorOptimizationSkill()

        const result = await compactorSkill.execute(context)

        if (result.success && result.data) {
          compactorOptimization = result.data

          // Add to recommendations if recommended
          if (compactorOptimization.recommend && !leaseUpDetected) {
            recommendations.push({
              type: 'compactor_monitors',
              priority: 1,
              title: 'Install DSQ Waste Monitoring System',
              description: `Reduce pickups by optimizing compactor fill levels. Current average: ${compactorOptimization.avgTonsPerHaul.toFixed(2)} tons/haul. Target: ${compactorOptimization.targetTonsPerHaul} tons/haul.`,
              recommend: true,
              savings: compactorOptimization.netYear1Savings,
              implementation: `${compactorOptimization.paybackMonths.toFixed(1)} month payback period`,
              confidence: 'HIGH',
            })
          }

          // Track AI usage if present
          if (result.metadata.aiUsage) {
            aiUsageTracker.totalRequests += result.metadata.aiUsage.requests
            aiUsageTracker.totalTokensInput += result.metadata.aiUsage.tokensInput
            aiUsageTracker.totalTokensOutput += result.metadata.aiUsage.tokensOutput
            aiUsageTracker.totalCostUsd += result.metadata.aiUsage.costUsd
          }
        }
      } catch (error) {
        executionLogger.error('Compactor optimization failed', error as Error)
        // Continue with analysis - this is non-blocking
      }
    }

    await this.updateProgress(context, {
      percent: 50,
      step: 'Checking for additional optimization opportunities',
      stepNumber: 2,
      totalSteps: 5,
    })

    // Check for contamination reduction opportunities
    const contaminationOpportunity = this.checkContaminationReduction(
      context,
      invoiceMetrics,
      leaseUpDetected
    )
    if (contaminationOpportunity) {
      recommendations.push(contaminationOpportunity)
    }

    // Check for bulk subscription opportunities
    const bulkOpportunity = this.checkBulkSubscription(
      context,
      invoiceMetrics,
      leaseUpDetected
    )
    if (bulkOpportunity) {
      recommendations.push(bulkOpportunity)
    }

    await this.updateProgress(context, {
      percent: 60,
      step: 'Analysis complete',
      stepNumber: 2,
      totalSteps: 5,
    })

    // ========================================================================
    // STEP 3: REPORT GENERATION (60-90%)
    // ========================================================================
    await this.updateProgress(context, {
      percent: 65,
      step: 'Generating Excel workbook',
      stepNumber: 3,
      totalSteps: 5,
    })

    // Generate reports (placeholder for now - will be implemented in next phase)
    const reports = await this.generateReports(
      context,
      {
        invoiceMetrics,
        compactorOptimization,
        recommendations,
        leaseUpDetected,
      }
    )

    await this.updateProgress(context, {
      percent: 80,
      step: 'Generating HTML dashboard',
      stepNumber: 3,
      totalSteps: 5,
    })

    // HTML dashboard generation happens in generateReports

    await this.updateProgress(context, {
      percent: 90,
      step: 'Reports generated',
      stepNumber: 3,
      totalSteps: 5,
    })

    // ========================================================================
    // STEP 4: RESULT ASSEMBLY (90-100%)
    // ========================================================================
    await this.updateProgress(context, {
      percent: 95,
      step: 'Assembling final results',
      stepNumber: 4,
      totalSteps: 5,
    })

    // Calculate total savings
    const totalSavingsPotential = recommendations.reduce(
      (sum, rec) => sum + (rec.savings || 0),
      0
    )

    const currentMonthlyCost = invoiceMetrics.totalSpend
    const optimizedMonthlyCost = currentMonthlyCost - totalSavingsPotential / 12 // Annual to monthly
    const savingsPercentage =
      currentMonthlyCost > 0 ? (totalSavingsPotential / (currentMonthlyCost * 12)) * 100 : 0

    const result: WasteWiseAnalyticsCompleteResult = {
      summary: {
        totalSavingsPotential,
        currentMonthlyCost,
        optimizedMonthlyCost,
        savingsPercentage,
        dateRange: invoiceMetrics.dateRange,
        totalInvoices: context.invoices.length,
        totalHauls: context.haulLog?.length,
      },
      compactorOptimization,
      recommendations,
      reports,
      executionTime: Date.now() - startTime,
      aiUsage: aiUsageTracker,
      leaseUpDetected,
    }

    await this.updateProgress(context, {
      percent: 100,
      step: 'Analysis complete',
      stepNumber: 5,
      totalSteps: 5,
    })

    executionLogger.info('WasteWise complete analysis finished', {
      totalSavings: totalSavingsPotential,
      recommendations: recommendations.length,
      executionTime: result.executionTime,
    })

    metrics.increment('wastewise.complete.success', 1, {
      projectId: context.projectId,
      leaseUpDetected: leaseUpDetected.toString(),
    })

    return result
  }

  /**
   * Calculate basic metrics from invoice data
   */
  private calculateInvoiceMetrics(context: SkillContext): InvoiceMetrics {
    const invoices = context.invoices

    // Calculate total spend
    const totalSpend = invoices.reduce((sum, invoice) => {
      const amount =
        typeof invoice.total_amount === 'string'
          ? parseFloat(invoice.total_amount)
          : invoice.total_amount
      return sum + amount
    }, 0)

    // Calculate date range
    const dates = invoices
      .map((inv) => new Date(inv.invoice_date))
      .sort((a, b) => a.getTime() - b.getTime())

    const dateRange = {
      start: dates[0]?.toISOString().split('T')[0] || '',
      end: dates[dates.length - 1]?.toISOString().split('T')[0] || '',
    }

    // Calculate cost per door
    const costPerDoor = calculateCostPerDoor(totalSpend / invoices.length, context.project.units)

    // Calculate yards per door (equipment type dependent)
    let yardsPerDoor = 0
    if (context.project.equipment_type === 'COMPACTOR') {
      const totalTons = invoices.reduce((sum, inv) => {
        const tons = typeof inv.tonnage === 'string' ? parseFloat(inv.tonnage) : inv.tonnage || 0
        return sum + tons
      }, 0)
      yardsPerDoor = calculateCompactorYardsPerDoor(totalTons, context.project.units)
    } else {
      // Simplified calculation for dumpsters (would need container size data)
      // This is a placeholder - actual implementation would parse invoice details
      yardsPerDoor = 2.2 // Industry average
    }

    // Calculate contamination spend
    const contaminationSpend = invoices.reduce((sum, invoice) => {
      const charges = invoice.charges as any
      const contamination = charges?.contamination || 0
      return sum + contamination
    }, 0)

    const contaminationPercent = totalSpend > 0 ? (contaminationSpend / totalSpend) * 100 : 0

    // Calculate bulk service spend
    const bulkSpend = invoices.reduce((sum, invoice) => {
      const charges = invoice.charges as any
      const bulk = charges?.bulk_service || 0
      return sum + bulk
    }, 0)

    const avgBulkMonthly = bulkSpend / invoices.length

    return {
      totalSpend,
      dateRange,
      costPerDoor,
      yardsPerDoor,
      contaminationSpend,
      contaminationPercent,
      bulkSpend,
      avgBulkMonthly,
    }
  }

  /**
   * Detect if property is in lease-up phase
   *
   * Lease-up prevents optimization recommendations because waste generation
   * is abnormally low due to low occupancy.
   */
  private detectLeaseUp(
    context: SkillContext,
    metrics: InvoiceMetrics
  ): boolean {
    // Industry benchmark for yards per door
    const benchmarkYardsPerDoor = 2.2

    // Calculate variance from benchmark
    const variance = ((metrics.yardsPerDoor - benchmarkYardsPerDoor) / benchmarkYardsPerDoor) * 100

    // If more than 40% below benchmark, likely in lease-up
    return variance < LEASEUP_VARIANCE_THRESHOLD
  }

  /**
   * Determine if compactor optimization should run
   */
  private shouldRunCompactorOptimization(context: SkillContext): boolean {
    return (
      context.project.equipment_type === 'COMPACTOR' &&
      context.haulLog !== undefined &&
      context.haulLog.length >= 3
    )
  }

  /**
   * Check for contamination reduction opportunities
   */
  private checkContaminationReduction(
    context: SkillContext,
    metrics: InvoiceMetrics,
    leaseUpDetected: boolean
  ): WasteWiseAnalyticsCompleteResult['recommendations'][0] | null {
    if (leaseUpDetected) {
      return null // Skip during lease-up
    }

    const contaminationPct = metrics.contaminationPercent / 100

    if (contaminationPct > CONTAMINATION_THRESHOLD_PCT) {
      // Estimate savings: 50% reduction in contamination fees
      const annualSavings = metrics.contaminationSpend * 0.5 * 12

      return {
        type: 'contamination_reduction',
        priority: 2,
        title: 'Implement Contamination Reduction Program',
        description: `Contamination fees represent ${metrics.contaminationPercent.toFixed(1)}% of total waste spend. Implementing resident education and signage can reduce these fees significantly.`,
        recommend: true,
        savings: annualSavings,
        implementation: 'Partner with Ally Waste or similar service for resident education',
        confidence: 'MEDIUM',
      }
    }

    return null
  }

  /**
   * Check for bulk subscription opportunities
   */
  private checkBulkSubscription(
    context: SkillContext,
    metrics: InvoiceMetrics,
    leaseUpDetected: boolean
  ): WasteWiseAnalyticsCompleteResult['recommendations'][0] | null {
    if (leaseUpDetected) {
      return null // Skip during lease-up
    }

    if (metrics.avgBulkMonthly > BULK_SUBSCRIPTION_THRESHOLD) {
      // Estimate savings: 30% reduction with subscription vs on-demand
      const annualSavings = metrics.bulkSpend * 0.3 * 12

      return {
        type: 'bulk_subscription',
        priority: 3,
        title: 'Switch to Bulk Subscription Service',
        description: `Average bulk service charges of $${metrics.avgBulkMonthly.toFixed(2)}/month exceed threshold. Switching from on-demand to subscription pricing can reduce costs.`,
        recommend: true,
        savings: annualSavings,
        implementation: 'Negotiate subscription pricing with current vendor',
        confidence: 'MEDIUM',
      }
    }

    return null
  }

  /**
   * Generate Excel and HTML reports
   *
   * Generates professional Excel workbook and interactive HTML dashboard
   * with all analysis results, charts, and recommendations.
   */
  private async generateReports(
    context: SkillContext,
    analysisData: {
      invoiceMetrics: InvoiceMetrics
      compactorOptimization?: CompactorOptimizationResult
      recommendations: WasteWiseAnalyticsCompleteResult['recommendations']
      leaseUpDetected: boolean
    }
  ): Promise<WasteWiseAnalyticsCompleteResult['reports']> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    })

    executionLogger.info('Starting report generation', {
      hasCompactorData: !!analysisData.compactorOptimization,
      hasHaulLog: !!context.haulLog && context.haulLog.length > 0,
      recommendationsCount: analysisData.recommendations.length,
    })

    try {
      // Import report generators
      const { generateExcelReport, generateHtmlDashboard, uploadReports } = await import(
        '@/lib/reports'
      )

      // Build complete result object for report generation
      const totalSavingsPotential = analysisData.recommendations.reduce(
        (sum, rec) => sum + (rec.savings || 0),
        0
      )

      const result: WasteWiseAnalyticsCompleteResult = {
        summary: {
          totalSavingsPotential,
          currentMonthlyCost: analysisData.invoiceMetrics.totalSpend,
          optimizedMonthlyCost:
            analysisData.invoiceMetrics.totalSpend - totalSavingsPotential / 12,
          savingsPercentage:
            analysisData.invoiceMetrics.totalSpend > 0
              ? (totalSavingsPotential / (analysisData.invoiceMetrics.totalSpend * 12)) * 100
              : 0,
          dateRange: analysisData.invoiceMetrics.dateRange,
          totalInvoices: context.invoices.length,
          totalHauls: context.haulLog?.length,
        },
        compactorOptimization: analysisData.compactorOptimization,
        recommendations: analysisData.recommendations,
        reports: {
          excelWorkbook: { fileName: '', storagePath: '', downloadUrl: '', size: 0 },
          htmlDashboard: { fileName: '', storagePath: '', downloadUrl: '', size: 0 },
        },
        executionTime: 0,
        aiUsage: {
          totalRequests: 0,
          totalTokensInput: 0,
          totalTokensOutput: 0,
          totalCostUsd: 0,
        },
        leaseUpDetected: analysisData.leaseUpDetected,
      }

      // Generate Excel workbook
      executionLogger.info('Generating Excel workbook')
      const excelOutput = await generateExcelReport({
        result,
        project: context.project,
        invoices: context.invoices,
        haulLogs: context.haulLog,
      })

      executionLogger.info('Excel workbook generated', {
        size: excelOutput.size,
        tabsGenerated: excelOutput.metadata.tabsGenerated,
      })

      // Generate HTML dashboard
      executionLogger.info('Generating HTML dashboard')
      const htmlOutput = await generateHtmlDashboard({
        result,
        project: context.project,
        invoices: context.invoices,
        haulLogs: context.haulLog,
      })

      executionLogger.info('HTML dashboard generated', {
        size: htmlOutput.size,
        tabsIncluded: htmlOutput.metadata.tabsIncluded,
      })

      // Upload both reports to Supabase Storage
      executionLogger.info('Uploading reports to storage')
      const uploadedReports = await uploadReports(
        excelOutput.buffer,
        excelOutput.filename,
        htmlOutput.html,
        htmlOutput.filename,
        context.projectId
      )

      executionLogger.info('Reports uploaded successfully', {
        excelUrl: uploadedReports.excel.downloadUrl,
        htmlUrl: uploadedReports.html.downloadUrl,
      })

      // Return report metadata
      return {
        excelWorkbook: {
          fileName: uploadedReports.excel.filename,
          storagePath: uploadedReports.excel.storagePath,
          downloadUrl: uploadedReports.excel.downloadUrl,
          size: uploadedReports.excel.size,
        },
        htmlDashboard: {
          fileName: uploadedReports.html.filename,
          storagePath: uploadedReports.html.storagePath,
          downloadUrl: uploadedReports.html.downloadUrl,
          size: uploadedReports.html.size,
        },
      }
    } catch (error) {
      executionLogger.error('Report generation failed', error as Error, {
        projectId: context.projectId,
      })

      // Report generation failure should not fail entire analysis
      // Return placeholder data so analysis can still complete
      executionLogger.warn('Returning placeholder report data due to generation failure')

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const projectName = context.project.property_name.replace(/[^a-zA-Z0-9]/g, '_')

      return {
        excelWorkbook: {
          fileName: `${projectName}_Analysis_${timestamp}.xlsx`,
          storagePath: `reports/${context.projectId}/workbook_${timestamp}.xlsx`,
          downloadUrl: '', // Empty URL indicates generation failed
          size: 0,
        },
        htmlDashboard: {
          fileName: `${projectName}_Dashboard_${timestamp}.html`,
          storagePath: `reports/${context.projectId}/dashboard_${timestamp}.html`,
          downloadUrl: '', // Empty URL indicates generation failed
          size: 0,
        },
      }
    }
  }
}
