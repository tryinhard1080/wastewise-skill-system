/**
 * Compactor Optimization Skill
 *
 * Analyzes compactor performance and recommends waste monitoring systems
 * when capacity utilization is low (average tons per haul < 6.0).
 *
 * CANONICAL CRITERIA (ALL 3 must be true):
 * - average_tons_per_haul < 6.0 (NOT 7.0!)
 * - max_days_between_pickups <= 14
 * - property_has_compactor == true
 *
 * @see WASTE_FORMULAS_REFERENCE.md v2.0, lines 201-232
 */

import { BaseSkill } from "../base-skill";
import {
  SkillContext,
  SkillResult,
  ValidationResult,
  CompactorOptimizationResult,
} from "../types";
import {
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_TARGET_TONS,
  COMPACTOR_MAX_DAYS_BETWEEN,
  DSQ_MONITOR_INSTALL,
  DSQ_MONITOR_MONTHLY,
  MONTHS_PER_YEAR,
  calculateTonsPerHaul,
  calculateCapacityUtilization,
  shouldRecommendMonitoring,
} from "@/lib/constants/formulas";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { InsufficientDataError, ValidationError } from "@/lib/types/errors";

export class CompactorOptimizationSkill extends BaseSkill<CompactorOptimizationResult> {
  readonly name = "compactor-optimization";
  readonly version = "1.0.0";
  readonly description =
    "Analyzes compactor performance and recommends waste monitoring systems when utilization is low";

  /**
   * Validate that we have sufficient haul log data
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const validationLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    });

    validationLogger.debug("Starting validation");

    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check for haul log data
    if (!context.haulLog || context.haulLog.length === 0) {
      errors.push({
        field: "haulLog",
        message:
          "No haul log data found. Compactor optimization requires haul records.",
        code: "MISSING_HAUL_LOG",
      });
    } else if (context.haulLog.length < 3) {
      errors.push({
        field: "haulLog",
        message: `Insufficient haul log data. Need at least 3 records, found ${context.haulLog.length}.`,
        code: "INSUFFICIENT_HAUL_LOG",
      });
    }

    // Check equipment type
    if (context.project.equipment_type !== "COMPACTOR") {
      errors.push({
        field: "equipment_type",
        message: `Equipment type must be COMPACTOR, found ${context.project.equipment_type}`,
        code: "INVALID_EQUIPMENT_TYPE",
      });
    }

    if (errors.length > 0) {
      validationLogger.warn("Validation failed", { errors });
      return { valid: false, errors };
    }

    validationLogger.debug("Validation passed");
    return { valid: true };
  }

  /**
   * Execute compactor optimization analysis
   */
  protected async executeInternal(
    context: SkillContext,
  ): Promise<CompactorOptimizationResult> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    });

    executionLogger.info("Starting compactor optimization analysis");

    // Validate formulas match config
    this.validateFormulas(context);

    // Safety check (should be caught by validate, but belt-and-suspenders)
    if (!context.haulLog || context.haulLog.length === 0) {
      throw new InsufficientDataError("compactor-optimization", ["haulLog"], {
        message: "No haul log data found",
      });
    }

    await this.updateProgress(context, {
      percent: 10,
      step: "Analyzing haul log data",
    });

    // Calculate metrics from haul log
    const haulLog = context.haulLog;
    const totalHauls = haulLog.length;

    const totalTons = haulLog.reduce((sum, haul) => {
      const tonnage =
        typeof haul.tonnage === "string"
          ? parseFloat(haul.tonnage)
          : haul.tonnage;
      return sum + tonnage;
    }, 0);

    const avgTonsPerHaul = calculateTonsPerHaul(totalTons, totalHauls);

    executionLogger.debug("Haul log metrics calculated", {
      totalHauls,
      totalTons,
      avgTonsPerHaul,
    });

    await this.updateProgress(context, {
      percent: 30,
      step: "Calculating pickup intervals",
    });

    // Calculate max days between pickups
    const daysBetween = haulLog.slice(1).map((haul, index) => {
      const prevDate = new Date(haulLog[index].haul_date);
      const currDate = new Date(haul.haul_date);
      const diffMs = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    });

    const maxDaysBetween = Math.max(...daysBetween, 0);

    executionLogger.debug("Pickup intervals calculated", {
      maxDaysBetween,
      avgDaysBetween:
        daysBetween.length > 0
          ? daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length
          : 0,
    });

    await this.updateProgress(context, {
      percent: 50,
      step: "Checking optimization criteria",
    });

    // Check if monitoring should be recommended
    const hasCompactor = context.project.equipment_type === "COMPACTOR";
    const recommend = shouldRecommendMonitoring(
      avgTonsPerHaul,
      maxDaysBetween,
      hasCompactor,
    );

    executionLogger.info("Optimization criteria evaluated", {
      avgTonsPerHaul,
      threshold: COMPACTOR_OPTIMIZATION_THRESHOLD,
      maxDaysBetween,
      maxAllowed: COMPACTOR_MAX_DAYS_BETWEEN,
      recommend,
    });

    await this.updateProgress(context, {
      percent: 70,
      step: "Calculating ROI",
    });

    // Calculate ROI if recommending monitors
    let result: CompactorOptimizationResult;

    if (recommend) {
      executionLogger.debug("Calculating savings for recommended monitoring");

      // Calculate current capacity utilization
      const capacityUtilization = calculateCapacityUtilization(avgTonsPerHaul);

      // Assume monitoring will get us to target capacity (8.5 tons)
      const targetTonsPerHaul = COMPACTOR_TARGET_TONS;

      // Calculate how many hauls we can eliminate
      const currentAnnualHauls = Math.round(
        (totalHauls / haulLog.length) * 365,
      );

      // With optimized capacity, we need fewer hauls
      const optimizedAnnualHauls = Math.round(
        (totalTons * 365) / (haulLog.length * targetTonsPerHaul),
      );

      const haulsEliminated = currentAnnualHauls - optimizedAnnualHauls;

      // Calculate cost per haul from invoice data
      const totalInvoiceAmount = context.invoices.reduce((sum, invoice) => {
        const amount =
          typeof invoice.total_amount === "string"
            ? parseFloat(invoice.total_amount)
            : invoice.total_amount;
        return sum + amount;
      }, 0);

      const avgCostPerHaul =
        context.invoices.length > 0
          ? totalInvoiceAmount /
            context.invoices.reduce((sum, inv) => sum + (inv.hauls || 0), 0)
          : 850; // Industry average fallback

      // Calculate savings
      const grossAnnualSavings = haulsEliminated * avgCostPerHaul;

      // Subtract monitoring costs
      const installationCost = DSQ_MONITOR_INSTALL;
      const annualMonitoringCost = DSQ_MONITOR_MONTHLY * MONTHS_PER_YEAR;

      const netYear1Savings =
        grossAnnualSavings - installationCost - annualMonitoringCost;
      const netAnnualSavingsYear2Plus =
        grossAnnualSavings - annualMonitoringCost;

      // Calculate ROI
      const totalInvestment = installationCost + annualMonitoringCost;
      const roiPercent =
        totalInvestment > 0 ? (netYear1Savings / totalInvestment) * 100 : 0;

      // Calculate payback period
      const paybackMonths =
        totalInvestment > 0
          ? totalInvestment / (grossAnnualSavings / MONTHS_PER_YEAR)
          : 0;

      executionLogger.info("ROI calculation complete", {
        grossAnnualSavings,
        netYear1Savings,
        netAnnualSavingsYear2Plus,
        roiPercent,
        paybackMonths,
      });

      metrics.increment("compactor.optimization.recommended", 1, {
        projectId: context.projectId,
      });

      result = {
        recommend: true,
        avgTonsPerHaul,
        targetTonsPerHaul,
        currentAnnualHauls,
        optimizedAnnualHauls,
        haulsEliminated,
        grossAnnualSavings,
        netYear1Savings,
        netAnnualSavingsYear2Plus,
        roiPercent,
        paybackMonths,
      };
    } else {
      executionLogger.info("No monitoring recommendation", {
        reason:
          avgTonsPerHaul >= COMPACTOR_OPTIMIZATION_THRESHOLD
            ? "Average tons per haul meets threshold"
            : "Max days between pickups exceeds limit",
      });

      metrics.increment("compactor.optimization.not_recommended", 1, {
        projectId: context.projectId,
      });

      result = {
        recommend: false,
        avgTonsPerHaul,
        targetTonsPerHaul: COMPACTOR_TARGET_TONS,
        currentAnnualHauls: 0,
        optimizedAnnualHauls: 0,
        haulsEliminated: 0,
        grossAnnualSavings: 0,
        netYear1Savings: 0,
        netAnnualSavingsYear2Plus: 0,
        roiPercent: 0,
        paybackMonths: 0,
      };
    }

    await this.updateProgress(context, {
      percent: 100,
      step: "Analysis complete",
    });

    executionLogger.info("Compactor optimization analysis complete", {
      recommend: result.recommend,
      avgTonsPerHaul: result.avgTonsPerHaul,
    });

    return result;
  }
}
