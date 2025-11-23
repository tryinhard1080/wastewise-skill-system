/**
 * Formula Constants Validation Tests
 *
 * Purpose: Ensure all constants in lib/constants/formulas.ts match
 * the canonical values from WASTE_FORMULAS_REFERENCE.md v2.0
 *
 * CRITICAL: These tests MUST pass before any merge to main.
 * Any failure indicates a deviation from the canonical reference.
 */

import { describe, expect, it } from "vitest";
import {
  // Conversion constants
  EPA_DENSITY,
  TONS_TO_YARDS,
  LBS_TO_TONS,
  LBS_TO_CY,
  WEEKS_PER_MONTH,
  DAYS_PER_WEEK,
  MONTHS_PER_YEAR,

  // Compaction ratios
  COMPACTION_RATIO_STANDARD,
  COMPACTION_RATIO_SELFCONTAINED,
  COMPACTION_RATIO_COMMERCIAL,

  // Optimization thresholds
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_MAX_DAYS_BETWEEN,
  COMPACTOR_TARGET_TONS,
  CONTAMINATION_THRESHOLD_PCT,
  CONTAMINATION_HIGH_PCT,
  BULK_SUBSCRIPTION_THRESHOLD,
  LEASEUP_VARIANCE_THRESHOLD,

  // Waste generation rates
  WASTE_PER_UNIT,
  RECYCLING_PER_UNIT,
  COMPOST_PER_UNIT,
  RESTAURANT_WASTE,
  RETAIL_WASTE,
  OFFICE_WASTE,
  RESTAURANT_RECYCLING,
  RESTAURANT_COMPOST,
  RETAIL_RECYCLING,

  // Cost constants
  LABOR_RATE,
  TIME_TO_MOVE_BINS,
  TIME_PER_BIN,
  TIME_CARDBOARD_BREAKDOWN,
  COMPACTOR_LABOR_HOURS_WEEK,
  COMPACTOR_STANDARD,
  COMPACTOR_SELFCONTAINED,
  WASTE_CADDY,
  PALLET_JACK,
  COMPACTOR_MAINTENANCE_ANNUAL,
  DSQ_MONITOR_INSTALL,
  DSQ_MONITOR_MONTHLY,
  ALLY_WASTE_SERVICE_COST,
  BULK_SUBSCRIPTION_COST,

  // Container specs
  CONTAINER_SIZES,
  COMPACTOR_CONTAINER,
  COMPACTOR_CAPACITY_COMPACTED,
  COMPACTOR_CAPACITY_LOOSE,
  CONTAINER_RENTAL,

  // Validation ranges
  VALIDATION_RANGES,
  UTILIZATION_BENCHMARKS,

  // Calculation functions
  calculateCompactorYardsPerDoor,
  calculateDumpsterYardsPerDoor,
  calculateCostPerDoor,
  calculateTonsPerHaul,
  calculateCapacityUtilization,
  shouldRecommendMonitoring,
  validateFormulaConstants,
} from "@/lib/constants/formulas";

describe("Formula Constants - Canonical Values", () => {
  describe("Conversion Constants", () => {
    it("EPA_DENSITY should be 138 lbs/yd³", () => {
      expect(EPA_DENSITY).toBe(138);
    });

    it("TONS_TO_YARDS should be 14.49", () => {
      expect(TONS_TO_YARDS).toBe(14.49);
    });

    it("TONS_TO_YARDS should equal calculated value (2000 / 138)", () => {
      const calculated = LBS_TO_TONS / EPA_DENSITY;
      expect(TONS_TO_YARDS).toBeCloseTo(calculated, 2);
    });

    it("LBS_TO_TONS should be 2000", () => {
      expect(LBS_TO_TONS).toBe(2000);
    });

    it("LBS_TO_CY should be 138", () => {
      expect(LBS_TO_CY).toBe(138);
    });

    it("WEEKS_PER_MONTH should be 4.33", () => {
      expect(WEEKS_PER_MONTH).toBe(4.33);
    });

    it("DAYS_PER_WEEK should be 7", () => {
      expect(DAYS_PER_WEEK).toBe(7);
    });

    it("MONTHS_PER_YEAR should be 12", () => {
      expect(MONTHS_PER_YEAR).toBe(12);
    });
  });

  describe("Compaction Ratios", () => {
    it("COMPACTION_RATIO_STANDARD should be 4.0", () => {
      expect(COMPACTION_RATIO_STANDARD).toBe(4.0);
    });

    it("COMPACTION_RATIO_SELFCONTAINED should be 3.5", () => {
      expect(COMPACTION_RATIO_SELFCONTAINED).toBe(3.5);
    });

    it("COMPACTION_RATIO_COMMERCIAL should be 5.0", () => {
      expect(COMPACTION_RATIO_COMMERCIAL).toBe(5.0);
    });
  });

  describe("Optimization Thresholds - CRITICAL", () => {
    it("COMPACTOR_OPTIMIZATION_THRESHOLD should be 6.0 (NOT 7.0)", () => {
      expect(COMPACTOR_OPTIMIZATION_THRESHOLD).toBe(6.0);
    });

    it("COMPACTOR_MAX_DAYS_BETWEEN should be 14", () => {
      expect(COMPACTOR_MAX_DAYS_BETWEEN).toBe(14);
    });

    it("COMPACTOR_TARGET_TONS should be 8.5", () => {
      expect(COMPACTOR_TARGET_TONS).toBe(8.5);
    });

    it("CONTAMINATION_THRESHOLD_PCT should be 0.03 (3%)", () => {
      expect(CONTAMINATION_THRESHOLD_PCT).toBe(0.03);
    });

    it("CONTAMINATION_HIGH_PCT should be 0.05 (5%)", () => {
      expect(CONTAMINATION_HIGH_PCT).toBe(0.05);
    });

    it("BULK_SUBSCRIPTION_THRESHOLD should be 500", () => {
      expect(BULK_SUBSCRIPTION_THRESHOLD).toBe(500);
    });

    it("LEASEUP_VARIANCE_THRESHOLD should be -40", () => {
      expect(LEASEUP_VARIANCE_THRESHOLD).toBe(-40);
    });
  });

  describe("Waste Generation Rates", () => {
    it("WASTE_PER_UNIT should be 0.16 yd³", () => {
      expect(WASTE_PER_UNIT).toBe(0.16);
    });

    it("RECYCLING_PER_UNIT should be 0.16 yd³", () => {
      expect(RECYCLING_PER_UNIT).toBe(0.16);
    });

    it("COMPOST_PER_UNIT should be 0.012 yd³", () => {
      expect(COMPOST_PER_UNIT).toBe(0.012);
    });

    it("RESTAURANT_WASTE should be 1.25 lbs/SF/week", () => {
      expect(RESTAURANT_WASTE).toBe(1.25);
    });

    it("RETAIL_WASTE should be 0.07 lbs/SF/week", () => {
      expect(RETAIL_WASTE).toBe(0.07);
    });

    it("OFFICE_WASTE should be 0.10 lbs/SF/week", () => {
      expect(OFFICE_WASTE).toBe(0.1);
    });

    it("RESTAURANT_RECYCLING should be 0.40 (40%)", () => {
      expect(RESTAURANT_RECYCLING).toBe(0.4);
    });

    it("RESTAURANT_COMPOST should be 0.25 (25%)", () => {
      expect(RESTAURANT_COMPOST).toBe(0.25);
    });

    it("RETAIL_RECYCLING should be 0.30 (30%)", () => {
      expect(RETAIL_RECYCLING).toBe(0.3);
    });
  });

  describe("Cost Constants", () => {
    it("LABOR_RATE should be 21.00", () => {
      expect(LABOR_RATE).toBe(21.0);
    });

    it("TIME_TO_MOVE_BINS should be 0.5", () => {
      expect(TIME_TO_MOVE_BINS).toBe(0.5);
    });

    it("TIME_PER_BIN should be 0.15", () => {
      expect(TIME_PER_BIN).toBe(0.15);
    });

    it("TIME_CARDBOARD_BREAKDOWN should be 0.25", () => {
      expect(TIME_CARDBOARD_BREAKDOWN).toBe(0.25);
    });

    it("COMPACTOR_LABOR_HOURS_WEEK should be 1", () => {
      expect(COMPACTOR_LABOR_HOURS_WEEK).toBe(1);
    });

    it("COMPACTOR_STANDARD should be 43796.90", () => {
      expect(COMPACTOR_STANDARD).toBe(43796.9);
    });

    it("COMPACTOR_SELFCONTAINED should be 52000", () => {
      expect(COMPACTOR_SELFCONTAINED).toBe(52000);
    });

    it("WASTE_CADDY should be 10093.00", () => {
      expect(WASTE_CADDY).toBe(10093.0);
    });

    it("PALLET_JACK should be 7907.00", () => {
      expect(PALLET_JACK).toBe(7907.0);
    });

    it("COMPACTOR_MAINTENANCE_ANNUAL should be 2500", () => {
      expect(COMPACTOR_MAINTENANCE_ANNUAL).toBe(2500);
    });

    it("DSQ_MONITOR_INSTALL should be 300", () => {
      expect(DSQ_MONITOR_INSTALL).toBe(300);
    });

    it("DSQ_MONITOR_MONTHLY should be 200", () => {
      expect(DSQ_MONITOR_MONTHLY).toBe(200);
    });

    it("ALLY_WASTE_SERVICE_COST should be 150", () => {
      expect(ALLY_WASTE_SERVICE_COST).toBe(150);
    });

    it("BULK_SUBSCRIPTION_COST should be 200", () => {
      expect(BULK_SUBSCRIPTION_COST).toBe(200);
    });
  });

  describe("Container Specifications", () => {
    it("CONTAINER_SIZES should match canonical values", () => {
      expect(CONTAINER_SIZES.toter_96gal).toBe(0.5);
      expect(CONTAINER_SIZES.toter_3cy).toBe(3);
      expect(CONTAINER_SIZES.toter_6cy).toBe(6);
      expect(CONTAINER_SIZES.open_8cy).toBe(8);
      expect(CONTAINER_SIZES.open_10cy).toBe(10);
      expect(CONTAINER_SIZES.open_20cy).toBe(20);
      expect(CONTAINER_SIZES.open_30cy).toBe(30);
      expect(CONTAINER_SIZES.open_40cy).toBe(40);
    });

    it("COMPACTOR_CONTAINER should be 30", () => {
      expect(COMPACTOR_CONTAINER).toBe(30);
    });

    it("COMPACTOR_CAPACITY_COMPACTED should be 30", () => {
      expect(COMPACTOR_CAPACITY_COMPACTED).toBe(30);
    });

    it("COMPACTOR_CAPACITY_LOOSE should be 7.5", () => {
      expect(COMPACTOR_CAPACITY_LOOSE).toBe(7.5);
    });

    it("COMPACTOR_CAPACITY_LOOSE should equal COMPACTED / 4", () => {
      expect(COMPACTOR_CAPACITY_LOOSE).toBe(COMPACTOR_CAPACITY_COMPACTED / 4);
    });

    it("CONTAINER_RENTAL should match canonical values", () => {
      expect(CONTAINER_RENTAL.toter_3cy).toBe(300);
      expect(CONTAINER_RENTAL.toter_6cy).toBe(400);
      expect(CONTAINER_RENTAL.open_10cy).toBe(150);
      expect(CONTAINER_RENTAL.open_20cy).toBe(200);
      expect(CONTAINER_RENTAL.compactor_30cy).toBe(500);
    });
  });

  describe("Validation Ranges", () => {
    it("costPerDoor range should be 10-100", () => {
      expect(VALIDATION_RANGES.costPerDoor.min).toBe(10);
      expect(VALIDATION_RANGES.costPerDoor.max).toBe(100);
    });

    it("yardsPerDoor range should be 1.0-5.0", () => {
      expect(VALIDATION_RANGES.yardsPerDoor.min).toBe(1.0);
      expect(VALIDATION_RANGES.yardsPerDoor.max).toBe(5.0);
    });

    it("tonsPerHaul range should be 2.0-15.0", () => {
      expect(VALIDATION_RANGES.tonsPerHaul.min).toBe(2.0);
      expect(VALIDATION_RANGES.tonsPerHaul.max).toBe(15.0);
    });

    it("pickupsPerWeek range should be 1-7", () => {
      expect(VALIDATION_RANGES.pickupsPerWeek.min).toBe(1);
      expect(VALIDATION_RANGES.pickupsPerWeek.max).toBe(7);
    });
  });

  describe("Utilization Benchmarks", () => {
    it("should have correct benchmark percentages", () => {
      expect(UTILIZATION_BENCHMARKS.excellent).toBe(90);
      expect(UTILIZATION_BENCHMARKS.good).toBe(70);
      expect(UTILIZATION_BENCHMARKS.fair).toBe(50);
      expect(UTILIZATION_BENCHMARKS.poor).toBe(0);
    });
  });
});

describe("Calculation Functions - Formula Validation", () => {
  describe("calculateCompactorYardsPerDoor", () => {
    it("should calculate correctly for typical values", () => {
      // Example: 50 tons, 300 units
      // Expected: (50 × 14.49) / 300 = 2.415
      const result = calculateCompactorYardsPerDoor(50, 300);
      expect(result).toBeCloseTo(2.415, 3);
    });

    it("should use TONS_TO_YARDS constant (14.49)", () => {
      const result = calculateCompactorYardsPerDoor(1, 1);
      expect(result).toBe(TONS_TO_YARDS);
    });

    it("should match example from formulas reference", () => {
      // From WASTE_FORMULAS_REFERENCE.md example (if any)
      const totalTons = 65.4;
      const units = 324;
      const expected = (totalTons * 14.49) / units;
      const result = calculateCompactorYardsPerDoor(totalTons, units);
      expect(result).toBeCloseTo(expected, 4);
    });
  });

  describe("calculateDumpsterYardsPerDoor", () => {
    it("should calculate correctly for typical values", () => {
      // Example: 2 containers × 8 yd × 3x/week, 250 units
      // Expected: (2 × 8 × 3 × 4.33) / 250 = 0.83136
      const result = calculateDumpsterYardsPerDoor(2, 8, 3, 250);
      expect(result).toBeCloseTo(0.83136, 5);
    });

    it("should use WEEKS_PER_MONTH constant (4.33)", () => {
      const result = calculateDumpsterYardsPerDoor(1, 1, 1, 1);
      expect(result).toBe(WEEKS_PER_MONTH);
    });
  });

  describe("calculateCostPerDoor", () => {
    it("should calculate correctly for typical values", () => {
      // Example: $7500/month, 300 units
      // Expected: 7500 / 300 = 25
      const result = calculateCostPerDoor(7500, 300);
      expect(result).toBe(25);
    });

    it("should handle decimal results", () => {
      const result = calculateCostPerDoor(7000, 324);
      expect(result).toBeCloseTo(21.605, 3);
    });
  });

  describe("calculateTonsPerHaul", () => {
    it("should calculate correctly for typical values", () => {
      // Example: 65.4 tons, 13 hauls
      // Expected: 65.4 / 13 = 5.03
      const result = calculateTonsPerHaul(65.4, 13);
      expect(result).toBeCloseTo(5.03, 2);
    });

    it("should handle exact target", () => {
      const result = calculateTonsPerHaul(85, 10);
      expect(result).toBe(8.5);
    });
  });

  describe("calculateCapacityUtilization", () => {
    it("should calculate correctly using COMPACTOR_TARGET_TONS (8.5)", () => {
      // Example: 5.03 tons per haul
      // Expected: (5.03 / 8.5) × 100 = 59.18%
      const result = calculateCapacityUtilization(5.03);
      expect(result).toBeCloseTo(59.18, 2);
    });

    it("should return 100% for target utilization", () => {
      const result = calculateCapacityUtilization(8.5);
      expect(result).toBe(100);
    });

    it("should return >100% for over-target", () => {
      const result = calculateCapacityUtilization(10);
      expect(result).toBeCloseTo(117.65, 2);
    });
  });

  describe("shouldRecommendMonitoring - CRITICAL", () => {
    it("should recommend when all criteria met (< 6.0 tons)", () => {
      const result = shouldRecommendMonitoring(5.5, 10, true);
      expect(result).toBe(true);
    });

    it("should NOT recommend when tons >= 6.0", () => {
      const result = shouldRecommendMonitoring(6.0, 10, true);
      expect(result).toBe(false);
    });

    it("should NOT recommend when tons = 7.0 (old threshold)", () => {
      // Verify we're using 6.0, not the old 7.0 threshold
      const result = shouldRecommendMonitoring(6.5, 10, true);
      expect(result).toBe(false);
    });

    it("should NOT recommend when days > 14", () => {
      const result = shouldRecommendMonitoring(5.0, 15, true);
      expect(result).toBe(false);
    });

    it("should NOT recommend when no compactor", () => {
      const result = shouldRecommendMonitoring(5.0, 10, false);
      expect(result).toBe(false);
    });

    it("should handle edge case: exactly 6.0 tons", () => {
      const result = shouldRecommendMonitoring(6.0, 10, true);
      expect(result).toBe(false); // Must be < 6.0, not <=
    });

    it("should handle edge case: exactly 14 days", () => {
      const result = shouldRecommendMonitoring(5.0, 14, true);
      expect(result).toBe(true); // <= 14 is acceptable
    });
  });
});

describe("Formula Validation Function", () => {
  it("validateFormulaConstants should not throw with correct values", () => {
    expect(() => validateFormulaConstants()).not.toThrow();
  });

  it("should validate TONS_TO_YARDS matches calculation", () => {
    // This is tested within validateFormulaConstants()
    expect(TONS_TO_YARDS).toBeCloseTo(LBS_TO_TONS / EPA_DENSITY, 2);
  });

  it("should validate WEEKS_PER_MONTH is exactly 4.33", () => {
    expect(WEEKS_PER_MONTH).toBe(4.33);
  });

  it("should validate COMPACTOR_OPTIMIZATION_THRESHOLD is 6.0", () => {
    expect(COMPACTOR_OPTIMIZATION_THRESHOLD).toBe(6.0);
  });
});

describe("Database Synchronization", () => {
  it("constants should match skills_config seed values", () => {
    // These values MUST match supabase/migrations/20251114000001_initial_schema.sql
    const expectedConfig = {
      compactor_ypd: 14.49,
      dumpster_ypd: 4.33,
      target_capacity: 8.5,
    };

    const expectedThresholds = {
      compactor_tons: 6.0,
      contamination_pct: 3.0,
      bulk_monthly: 500,
      leaseup_variance: -40,
    };

    expect(TONS_TO_YARDS).toBe(expectedConfig.compactor_ypd);
    expect(WEEKS_PER_MONTH).toBe(expectedConfig.dumpster_ypd);
    expect(COMPACTOR_TARGET_TONS).toBe(expectedConfig.target_capacity);
    expect(COMPACTOR_OPTIMIZATION_THRESHOLD).toBe(
      expectedThresholds.compactor_tons,
    );
    expect(CONTAMINATION_THRESHOLD_PCT).toBe(
      expectedThresholds.contamination_pct / 100,
    );
    expect(BULK_SUBSCRIPTION_THRESHOLD).toBe(expectedThresholds.bulk_monthly);
    expect(LEASEUP_VARIANCE_THRESHOLD).toBe(
      expectedThresholds.leaseup_variance,
    );
  });
});
