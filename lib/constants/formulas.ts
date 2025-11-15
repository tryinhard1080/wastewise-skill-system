/**
 * Waste Management Formulas - TypeScript Constants
 *
 * CANONICAL SOURCE: WASTE_FORMULAS_REFERENCE.md v2.0
 * Last Updated: 2025-11-14
 *
 * CRITICAL: All calculations MUST use these constants to ensure consistency.
 * These values are synchronized with the database skills_config table.
 *
 * @see WASTE_FORMULAS_REFERENCE.md for complete specifications
 */

// ============================================================================
// CONVERSION CONSTANTS
// ============================================================================

/**
 * Weight to Volume Conversions
 */
export const EPA_DENSITY = 138; // lbs per cubic yard (standard for mixed MSW)
export const TONS_TO_YARDS = 14.49; // cubic yards per ton (2000 / 138)
export const LBS_TO_TONS = 2000; // pounds per ton
export const LBS_TO_CY = 138; // pounds per cubic yard

/**
 * Compaction Ratios
 */
export const COMPACTION_RATIO_STANDARD = 4.0; // 4:1 for stationary compactors
export const COMPACTION_RATIO_SELFCONTAINED = 3.5; // 3.5:1 for self-contained
export const COMPACTION_RATIO_COMMERCIAL = 5.0; // 5:1 for commercial-grade

/**
 * Time Constants
 */
export const WEEKS_PER_MONTH = 4.33; // Industry standard
export const DAYS_PER_WEEK = 7;
export const MONTHS_PER_YEAR = 12;

// ============================================================================
// OPTIMIZATION THRESHOLDS
// ============================================================================

/**
 * Compactor Monitoring Recommendation Criteria
 *
 * CANONICAL: average_tons_per_haul < 6.0 (NOT 7.0!)
 * Source: WASTE_FORMULAS_REFERENCE.md v2.0, lines 204-209
 */
export const COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0; // tons per haul
export const COMPACTOR_MAX_DAYS_BETWEEN = 14; // days
export const COMPACTOR_TARGET_TONS = 8.5; // tons (industry standard midpoint of 8-9)

/**
 * Contamination Reduction Recommendation
 */
export const CONTAMINATION_THRESHOLD_PCT = 0.03; // 3% of total spend
export const CONTAMINATION_HIGH_PCT = 0.05; // 5% (strong recommendation)

/**
 * Bulk Subscription Recommendation
 */
export const BULK_SUBSCRIPTION_THRESHOLD = 500; // monthly charges in dollars

/**
 * Lease-up Detection (prevents over-optimization)
 */
export const LEASEUP_VARIANCE_THRESHOLD = -40; // percent below benchmark

// ============================================================================
// WASTE GENERATION RATES
// ============================================================================

/**
 * Residential Generation Rates (per unit per week)
 */
export const WASTE_PER_UNIT = 0.16; // cubic yards
export const RECYCLING_PER_UNIT = 0.16; // cubic yards (assumes 1:1 ratio)
export const COMPOST_PER_UNIT = 0.012; // cubic yards (for mandatory programs)

/**
 * Commercial Generation Rates (per SF per week)
 */
export const RESTAURANT_WASTE = 1.25; // lbs/SF/week
export const RETAIL_WASTE = 0.07; // lbs/SF/week
export const OFFICE_WASTE = 0.1; // lbs/SF/week

/**
 * Diversion Rates
 */
export const RESTAURANT_RECYCLING = 0.4; // 40% diversion to recycling
export const RESTAURANT_COMPOST = 0.25; // 25% diversion to compost
export const RETAIL_RECYCLING = 0.3; // 30% diversion

// ============================================================================
// COST CONSTANTS
// ============================================================================

/**
 * Labor Costs
 */
export const LABOR_RATE = 21.0; // $/hour (industry average for property staff)
export const TIME_TO_MOVE_BINS = 0.5; // hours (one-time per collection day)
export const TIME_PER_BIN = 0.15; // hours to rake/rotate each bin
export const TIME_CARDBOARD_BREAKDOWN = 0.25; // hours per pickup
export const COMPACTOR_LABOR_HOURS_WEEK = 1; // minimal labor for compactors

/**
 * Equipment Costs
 */
export const COMPACTOR_STANDARD = 43796.9; // Wastequip A-Series 500
export const COMPACTOR_SELFCONTAINED = 52000; // Self-contained unit
export const WASTE_CADDY = 10093.0; // Handling equipment
export const PALLET_JACK = 7907.0; // For container movement
export const COMPACTOR_MAINTENANCE_ANNUAL = 2500; // Annual service contract

/**
 * Monitoring Systems
 */
export const DSQ_MONITOR_INSTALL = 300; // One-time installation
export const DSQ_MONITOR_MONTHLY = 200; // Recurring monthly cost

/**
 * Typical Service Costs (for reference)
 */
export const ALLY_WASTE_SERVICE_COST = 150; // monthly (contamination reduction)
export const BULK_SUBSCRIPTION_COST = 200; // monthly (varies by provider)

// ============================================================================
// CONTAINER SPECIFICATIONS
// ============================================================================

/**
 * Standard Container Sizes (cubic yards)
 */
export const CONTAINER_SIZES = {
  toter_96gal: 0.5, // 96-gallon toter = 0.5 CY
  toter_3cy: 3,
  toter_6cy: 6,
  open_8cy: 8,
  open_10cy: 10,
  open_20cy: 20,
  open_30cy: 30,
  open_40cy: 40,
} as const;

/**
 * Compactor Container Specifications
 */
export const COMPACTOR_CONTAINER = 30; // Standard 30 CY roll-off
export const COMPACTOR_CAPACITY_COMPACTED = 30; // After 4:1 compaction
export const COMPACTOR_CAPACITY_LOOSE = 7.5; // Before compaction (30 / 4)

/**
 * Container Rental Costs (typical)
 */
export const CONTAINER_RENTAL = {
  toter_3cy: 300,
  toter_6cy: 400,
  open_10cy: 150,
  open_20cy: 200,
  compactor_30cy: 500, // monthly rental
} as const;

// ============================================================================
// VALIDATION RANGES
// ============================================================================

/**
 * Data Quality Check Ranges
 */
export const VALIDATION_RANGES = {
  costPerDoor: { min: 10, max: 100 },
  yardsPerDoor: { min: 1.0, max: 5.0 },
  tonsPerHaul: { min: 2.0, max: 15.0 },
  pickupsPerWeek: { min: 1, max: 7 },
} as const;

/**
 * Capacity Utilization Benchmarks (percent)
 */
export const UTILIZATION_BENCHMARKS = {
  excellent: 90, // 90-100%
  good: 70, // 70-89%
  fair: 50, // 50-69%
  poor: 0, // <50%
} as const;

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate yards per door for COMPACTED service
 *
 * CANONICAL FORMULA: yards_per_door = (total_tons × 14.49) / unit_count
 * Source: WASTE_FORMULAS_REFERENCE.md lines 50-65
 *
 * @param totalTons - Total tons hauled in the month
 * @param unitCount - Total residential units
 * @returns Yards per door per month
 */
export function calculateCompactorYardsPerDoor(
  totalTons: number,
  unitCount: number
): number {
  return (totalTons * TONS_TO_YARDS) / unitCount;
}

/**
 * Calculate yards per door for NON-COMPACTED service (open tops)
 *
 * CANONICAL FORMULA: yards_per_door = (qty × size × freq × 4.33) / unit_count
 * Source: WASTE_FORMULAS_REFERENCE.md lines 30-46
 *
 * @param containerQty - Number of containers
 * @param containerSize - Size in cubic yards
 * @param frequency - Pickups per week
 * @param unitCount - Total residential units
 * @returns Yards per door per month
 */
export function calculateDumpsterYardsPerDoor(
  containerQty: number,
  containerSize: number,
  frequency: number,
  unitCount: number
): number {
  return (containerQty * containerSize * frequency * WEEKS_PER_MONTH) / unitCount;
}

/**
 * Calculate cost per door
 *
 * CANONICAL FORMULA: cost_per_door = total_monthly_cost / unit_count
 * Source: WASTE_FORMULAS_REFERENCE.md lines 15-28
 *
 * @param totalMonthlyCost - Sum of all waste services
 * @param unitCount - Total residential units
 * @returns Cost per door per month
 */
export function calculateCostPerDoor(
  totalMonthlyCost: number,
  unitCount: number
): number {
  return totalMonthlyCost / unitCount;
}

/**
 * Calculate tons per haul (compactors only)
 *
 * CANONICAL FORMULA: tons_per_haul = total_tons / total_hauls
 * Source: WASTE_FORMULAS_REFERENCE.md lines 67-80
 *
 * @param totalTons - Sum of tonnage for the period
 * @param totalHauls - Count of compactor pickups
 * @returns Average tons per haul
 */
export function calculateTonsPerHaul(
  totalTons: number,
  totalHauls: number
): number {
  return totalTons / totalHauls;
}

/**
 * Calculate capacity utilization (compactors)
 *
 * CANONICAL FORMULA: utilization = (tons_per_haul / 8.5) × 100
 * Source: WASTE_FORMULAS_REFERENCE.md lines 96-110
 *
 * @param tonsPerHaul - Actual tons hauled
 * @returns Utilization percentage
 */
export function calculateCapacityUtilization(tonsPerHaul: number): number {
  return (tonsPerHaul / COMPACTOR_TARGET_TONS) * 100;
}

/**
 * Check if compactor monitoring should be recommended
 *
 * CANONICAL CRITERIA (ALL 3 must be true):
 * - average_tons_per_haul < 6.0 (NOT 7.0!)
 * - max_days_between_pickups <= 14
 * - property_has_compactor == true
 *
 * Source: WASTE_FORMULAS_REFERENCE.md lines 201-232
 *
 * @param avgTonsPerHaul - Average tons per haul
 * @param maxDaysBetween - Maximum days between pickups
 * @param hasCompactor - Whether property has a compactor
 * @returns Whether to recommend monitoring
 */
export function shouldRecommendMonitoring(
  avgTonsPerHaul: number,
  maxDaysBetween: number,
  hasCompactor: boolean
): boolean {
  return (
    avgTonsPerHaul < COMPACTOR_OPTIMIZATION_THRESHOLD &&
    maxDaysBetween <= COMPACTOR_MAX_DAYS_BETWEEN &&
    hasCompactor
  );
}

// ============================================================================
// VALIDATION ASSERTIONS
// ============================================================================

/**
 * Runtime validation to ensure constants are consistent
 *
 * This should be called during app initialization to catch any discrepancies
 */
export function validateFormulaConstants(): void {
  // Verify conversion factor is correct
  const calculatedTonsToYards = LBS_TO_TONS / EPA_DENSITY;
  const tolerance = 0.01;

  if (Math.abs(TONS_TO_YARDS - calculatedTonsToYards) > tolerance) {
    throw new Error(
      `Formula constant mismatch: TONS_TO_YARDS (${TONS_TO_YARDS}) ` +
      `does not match calculated value (${calculatedTonsToYards})`
    );
  }

  // Verify weeks per month matches industry standard
  if (WEEKS_PER_MONTH !== 4.33) {
    throw new Error(
      `Formula constant mismatch: WEEKS_PER_MONTH must be 4.33, got ${WEEKS_PER_MONTH}`
    );
  }

  // Verify optimization threshold is canonical 6.0
  if (COMPACTOR_OPTIMIZATION_THRESHOLD !== 6.0) {
    throw new Error(
      `Formula constant mismatch: COMPACTOR_OPTIMIZATION_THRESHOLD must be 6.0 ` +
      `(per WASTE_FORMULAS_REFERENCE.md v2.0), got ${COMPACTOR_OPTIMIZATION_THRESHOLD}`
    );
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Property type classifications with associated benchmarks
 */
export type PropertyType = 'Garden-Style' | 'Mid-Rise' | 'High-Rise';

/**
 * Service type classifications
 */
export type ServiceType = 'compactor' | 'dumpster' | 'toter';

/**
 * Recommendation strength levels
 */
export type RecommendationStrength = 'STRONGLY RECOMMEND' | 'RECOMMEND' | 'CONSIDER' | 'NOT RECOMMENDED';

/**
 * Utilization level classifications
 */
export type UtilizationLevel = 'excellent' | 'good' | 'fair' | 'poor';
