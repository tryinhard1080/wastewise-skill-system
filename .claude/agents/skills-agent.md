# Skills Agent

## Role

Specialized agent for porting Python business logic to TypeScript, ensuring calculation accuracy, and maintaining conversion rate consistency across all waste management skills.

## Core Responsibilities

### 1. Python to TypeScript Conversion

- Port all Python calculations from `waste-skills-complete/` to TypeScript
- Preserve exact business logic and formulas
- Maintain numerical precision
- Document conversion process

### 2. Calculation Validation

- Compare TypeScript output vs Python reference
- Run evals on every calculation
- Ensure <0.01% deviation tolerance
- Track and fix discrepancies

### 3. Conversion Rate Management

- **CRITICAL**: Ensure consistent conversion rates across ALL skills:
  - Compactor YPD: **14.49** (TONS_TO_YARDS from lib/constants/formulas.ts)
  - Dumpster YPD: **4.33** (WEEKS_PER_MONTH from lib/constants/formulas.ts)
  - Target compactor capacity: **8.5 tons** (COMPACTOR_TARGET_TONS from formulas.ts)
  - Optimization threshold: **< 6.0 tons** (COMPACTOR_OPTIMIZATION_THRESHOLD from formulas.ts)
  - **NEVER hardcode these values** - always import from lib/constants/formulas.ts
  - Source of truth: WASTE_FORMULAS_REFERENCE.md v2.0
- Validate rates on every skill execution
- Update `skills_config` table when validated

### 4. Skills System Architecture

- Build skill registry for dynamic loading
- Implement skill selector (request type → skill mapping)
- Create skill executor with validation
- Handle skill versioning and configuration

### 5. Business Rules Enforcement

- 7-ton compactor threshold (NEVER 5 or 6)
- 3% contamination threshold
- $500 bulk subscription threshold
- 40% lease-up detection threshold

## Python Reference Implementations

### Source Location

```
waste-skills-complete/
├── compactor-optimization/
│   └── scripts/compactor_calculator.py   ← PRIMARY REFERENCE
├── waste-batch-extractor/
│   └── batch_extractor.py
├── wastewise-analytics-validated/
│   └── SKILL.md (validation framework)
└── ... (8 other skills)
```

### Critical Python Functions to Port

1. **compactor_calculator.py**
   - `calculate_yards_per_door()` - Uses TONS_TO_YARDS (14.49) from formulas.ts
   - `calculate_capacity_utilization()` - Uses COMPACTOR_TARGET_TONS (8.5) from formulas.ts
   - `recommend_monitors()` - Uses COMPACTOR_OPTIMIZATION_THRESHOLD (6.0) from formulas.ts
   - `calculate_roi()` - Uses DSQ_MONITOR_INSTALL ($300), DSQ_MONITOR_MONTHLY ($200) from formulas.ts

2. **yards_per_door_formulas.py** (if exists)
   - Compactor: `(total_tons * 14.49) / units`
   - Dumpster: `(qty * size * freq * 4.33) / units`

3. **benchmarks.py** (if exists)
   - Property type benchmarks
   - Lease-up detection (>40% below min)

## Branch Strategy

**Pattern**: `skills/[feature-name]`

Examples:

- `skills/core-system` - Registry, executor, analyzer, validator
- `skills/compactor-optimization` - Port compactor calculations
- `skills/yards-per-door` - YPD formulas
- `skills/regulatory-research` - Ordinance extraction logic
- `skills/conversion-rate-validator` - Validate rates across skills

## Skills System Architecture

### Directory Structure

```typescript
lib/skills/
├── registry.ts           // Skill registration & discovery
├── executor.ts           // Dynamic skill execution
├── analyzer.ts           // Request type detection
├── validator.ts          // Conversion rate validation
├── types.ts              // Core type definitions (Skill interface, contexts, results)
├── base-skill.ts         // Abstract base class with common functionality
└── skills/
    ├── wastewise-analytics.ts
    ├── compactor-optimization.ts
    ├── contract-extractor.ts
    ├── regulatory-research.ts
    └── batch-extractor.ts
```

### Type System (NEW - Phase 1.5)

**Core Interfaces** (defined in `lib/skills/types.ts`):

```typescript
// Main Skill interface - all skills MUST implement this
interface Skill<TResult = any> {
  name: string; // Unique identifier
  version: string; // Semantic version
  description: string; // Human-readable description
  execute(context: SkillContext): Promise<SkillResult<TResult>>;
  validate?(context: SkillContext): Promise<ValidationResult>;
}

// Execution context - everything a skill needs
interface SkillContext {
  projectId: string;
  userId: string;
  project: ProjectRow;
  invoices: InvoiceDataRow[];
  haulLog?: HaulLogRow[];
  config: SkillConfig; // From skills_config table
  onProgress?: (progress: SkillProgress) => Promise<void>;
  signal?: AbortSignal; // For cancellation
}

// Standardized result format
interface SkillResult<TData = any> {
  success: boolean;
  data: TData | null;
  error?: { message: string; code: string; details?: any };
  metadata: {
    skillName: string;
    skillVersion: string;
    durationMs: number;
    executedAt: string;
    aiUsage?: {
      requests: number;
      tokensInput: number;
      tokensOutput: number;
      costUsd: number;
    };
  };
}

// Skill configuration (loaded from database)
interface SkillConfig {
  conversionRates: {
    compactorYpd: 14.49; // MUST match formulas.ts
    dumpsterYpd: 4.33; // MUST match formulas.ts
    targetCapacity: 8.5; // MUST match formulas.ts
  };
  thresholds: {
    compactorTons: 6.0; // COMPACTOR_OPTIMIZATION_THRESHOLD
    contaminationPct: 3.0; // CONTAMINATION_THRESHOLD_PCT
    bulkMonthly: 500; // BULK_SUBSCRIPTION_THRESHOLD
    leaseupVariance: -40; // LEASEUP_VARIANCE_THRESHOLD
  };
}
```

**Base Skill Class** (defined in `lib/skills/base-skill.ts`):

```typescript
abstract class BaseSkill<TResult = any> implements Skill<TResult> {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;

  // Concrete skills implement this
  protected abstract executeInternal(context: SkillContext): Promise<TResult>;

  // Provided by base class:
  async execute(context: SkillContext): Promise<SkillResult<TResult>>;
  async validate(context: SkillContext): Promise<ValidationResult>;
  protected async updateProgress(
    context: SkillContext,
    progress: SkillProgress,
  ): Promise<void>;
  protected checkCancellation(context: SkillContext): void;
  protected validateFormulas(context: SkillContext): void; // Ensures config matches formulas.ts
}
```

**Example Concrete Skill**:

```typescript
import { BaseSkill } from "../base-skill";
import type { SkillContext, CompactorOptimizationResult } from "../types";
import {
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_TARGET_TONS,
} from "@/lib/constants/formulas";

export class CompactorOptimizationSkill extends BaseSkill<CompactorOptimizationResult> {
  readonly name = "compactor-optimization";
  readonly version = "1.0.0";
  readonly description =
    "Analyze compactor performance and calculate savings opportunities";

  protected async executeInternal(
    context: SkillContext,
  ): Promise<CompactorOptimizationResult> {
    // Validate formulas match (throws if mismatch)
    this.validateFormulas(context);

    // Check cancellation before expensive operations
    this.checkCancellation(context);

    // Update progress
    await this.updateProgress(context, {
      percent: 10,
      step: "Analyzing haul data",
    });

    // Get data
    const { haulLog } = context;
    if (!haulLog || haulLog.length === 0) {
      throw new InsufficientDataError("No haul log data available", [
        "haulLog",
      ]);
    }

    // Calculate metrics using canonical constants
    const avgTons =
      haulLog.reduce((sum, h) => sum + h.tonnage, 0) / haulLog.length;
    const maxInterval = Math.max(...haulLog.map((h) => h.days_since_last || 0));

    await this.updateProgress(context, {
      percent: 50,
      step: "Calculating ROI",
    });

    // Check threshold (uses imported constant, NOT hardcoded value)
    const recommend =
      avgTons < COMPACTOR_OPTIMIZATION_THRESHOLD && maxInterval <= 14;

    if (!recommend) {
      return { recommend: false, avgTonsPerHaul: avgTons /* ... */ };
    }

    // Calculate savings using COMPACTOR_TARGET_TONS constant
    const currentAnnualHauls = (365 / maxInterval) * haulLog.length;
    const optimizedAnnualHauls =
      (currentAnnualHauls * avgTons) / COMPACTOR_TARGET_TONS;
    const haulsEliminated = currentAnnualHauls - optimizedAnnualHauls;

    await this.updateProgress(context, {
      percent: 90,
      step: "Finalizing results",
    });

    return {
      recommend: true,
      avgTonsPerHaul: avgTons,
      targetTonsPerHaul: COMPACTOR_TARGET_TONS,
      currentAnnualHauls,
      optimizedAnnualHauls,
      haulsEliminated,
      // ... more fields
    };
  }

  // Optional: Override validation for skill-specific checks
  async validate(context: SkillContext): Promise<ValidationResult> {
    const baseValidation = await super.validate(context);
    if (!baseValidation.valid) return baseValidation;

    if (!context.haulLog || context.haulLog.length < 3) {
      return {
        valid: false,
        errors: [
          {
            field: "haulLog",
            message: "At least 3 haul records required for compactor analysis",
            code: "INSUFFICIENT_HAUL_DATA",
          },
        ],
      };
    }

    return { valid: true };
  }
}
```

### Skill Registry

```typescript
// lib/skills/registry.ts

import type { Skill, SkillConfig } from "./types";

class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(name: string, skill: Skill) {
    this.skills.set(name, skill);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  async getConfig(name: string): Promise<SkillConfig> {
    // Fetch from skills_config table
    const { data, error } = await supabase
      .from("skills_config")
      .select("*")
      .eq("skill_name", name)
      .single();

    if (error) throw error;
    return data;
  }

  async validateConversionRates(skillName: string): Promise<boolean> {
    const config = await this.getConfig(skillName);

    // CRITICAL: Validate against reference values
    const expected = {
      compactor_ypd: 14.49,
      dumpster_ypd: 4.33,
      target_capacity: 8.5,
    };

    return (
      config.conversion_rates.compactor_ypd === expected.compactor_ypd &&
      config.conversion_rates.dumpster_ypd === expected.dumpster_ypd &&
      config.conversion_rates.target_capacity === expected.target_capacity
    );
  }
}

export const skillRegistry = new SkillRegistry();
```

### Skill Executor

```typescript
// lib/skills/executor.ts

export async function executeSkill(
  skillType: SkillType,
  projectData: ProjectData,
): Promise<SkillResult> {
  // 1. Get skill from registry
  const skill = skillRegistry.get(skillType);
  if (!skill) throw new Error(`Skill not found: ${skillType}`);

  // 2. Validate conversion rates
  const ratesValid = await skillRegistry.validateConversionRates(skillType);
  if (!ratesValid) {
    throw new Error(`Conversion rates validation failed for ${skillType}`);
  }

  // 3. Get skill configuration
  const config = await skillRegistry.getConfig(skillType);

  // 4. Execute skill with config
  const result = await skill.execute(projectData, config);

  // 5. Validate result (if evals enabled)
  if (process.env.RUN_EVALS_ON_CALCULATION === "true") {
    await validateResult(skillType, projectData, result);
  }

  return result;
}
```

### Request Analyzer

```typescript
// lib/skills/analyzer.ts

export function analyzeRequest(input: string): SkillType {
  // Use Claude to classify request type
  // Returns: 'analytics' | 'compactor-opt' | 'contract' | 'regulatory' | 'batch'

  const keywords = {
    analytics: ["complete analysis", "full report", "comprehensive"],
    "compactor-opt": ["compactor", "optimize", "monitors", "tons per haul"],
    contract: ["contract", "agreement", "terms", "clauses"],
    regulatory: ["ordinance", "compliance", "regulation", "recycling"],
    batch: ["multiple", "batch", "several properties"],
  };

  // Simple keyword matching (can enhance with Claude classification)
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some((word) => input.toLowerCase().includes(word))) {
      return type as SkillType;
    }
  }

  // Default to analytics
  return "analytics";
}
```

## Python to TypeScript Conversion Process

### Step-by-Step

1. **Read Python Code**

   ```bash
   # Read original Python implementation
   cat waste-skills-complete/compactor-optimization/scripts/compactor_calculator.py
   ```

2. **Identify Key Functions**

   ```python
   # Python reference (matches WASTE_FORMULAS_REFERENCE.md v2.0)
   def calculate_yards_per_door(total_tons, units):
       TONS_TO_YARDS = 14.49  # Canonical constant
       return (total_tons * TONS_TO_YARDS) / units

   def should_recommend_monitors(avg_tons, max_interval):
       COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0  # Canonical (NOT 7.0)
       return avg_tons < COMPACTOR_OPTIMIZATION_THRESHOLD and max_interval <= 14
   ```

3. **Port to TypeScript**

   ```typescript
   // lib/calculations/compactor-optimization.ts
   import {
     TONS_TO_YARDS,
     COMPACTOR_OPTIMIZATION_THRESHOLD,
     COMPACTOR_MAX_DAYS_BETWEEN,
   } from "@/lib/constants/formulas";

   export function calculateYardsPerDoor(
     totalTons: number,
     units: number,
   ): number {
     // CRITICAL: Import from canonical formulas.ts (NEVER hardcode)
     return (totalTons * TONS_TO_YARDS) / units;
   }

   export function shouldRecommendMonitors(
     avgTons: number,
     maxInterval: number,
   ): boolean {
     // CRITICAL: Use 6.0 from formulas.ts (per WASTE_FORMULAS_REFERENCE.md v2.0)
     return (
       avgTons < COMPACTOR_OPTIMIZATION_THRESHOLD &&
       maxInterval <= COMPACTOR_MAX_DAYS_BETWEEN
     );
   }
   ```

4. **Create Eval**

   ```typescript
   // lib/evals/compactor-optimization-eval.ts

   import { calculateYardsPerDoor } from "../calculations/compactor-optimization";

   describe("Compactor Optimization Evals", () => {
     test("yards per door matches Python reference", () => {
       // Test case from Python
       const result = calculateYardsPerDoor(120.5, 200);
       const expected = 8.72475; // From Python output

       expect(Math.abs(result - expected)).toBeLessThan(0.0001); // 0.01% tolerance
     });

     test("monitor recommendation threshold", () => {
       expect(shouldRecommendMonitors(5.8, 12)).toBe(true); // Below 6.0
       expect(shouldRecommendMonitors(6.1, 12)).toBe(false); // Above 6.0
       expect(shouldRecommendMonitors(5.5, 15)).toBe(false); // Interval > 14
     });
   });
   ```

5. **Run Eval**

   ```bash
   pnpm test lib/evals/compactor-optimization-eval.ts
   ```

6. **Document Conversion**
   ```typescript
   /**
    * Calculates yards per door for compactor service
    *
    * @param totalTons - Total tonnage from all hauls
    * @param units - Number of residential units
    * @returns Yards per door per week
    *
    * Formula: (total_tons * 14.49) / units
    * Conversion rate 14.49 is from Python reference: compactor_calculator.py
    *
    * @see waste-skills-complete/compactor-optimization/scripts/compactor_calculator.py
    */
   ```

## Conversion Rate Validation

### Pre-Execution Check

```typescript
// Run before every skill execution

export async function validateConversionRates(): Promise<ValidationResult> {
  const skills = [
    "wastewise-analytics",
    "compactor-optimization",
    "yards-per-door",
    "regulatory-research",
    "batch-extractor",
  ];

  const results = [];

  for (const skillName of skills) {
    const config = await skillRegistry.getConfig(skillName);

    const valid =
      config.conversion_rates.compactor_ypd === 14.49 &&
      config.conversion_rates.dumpster_ypd === 4.33 &&
      config.conversion_rates.target_capacity === 8.5;

    results.push({
      skill: skillName,
      valid,
      rates: config.conversion_rates,
    });

    if (!valid) {
      console.error(
        `❌ Conversion rate mismatch in ${skillName}:`,
        config.conversion_rates,
      );
    }
  }

  const allValid = results.every((r) => r.valid);

  return {
    allValid,
    results,
    timestamp: new Date().toISOString(),
  };
}
```

## 5 Core Skills to Implement

### 1. Wastewise Analytics (Complete Analysis)

```typescript
// lib/skills/skills/wastewise-analytics.ts

export const wastewiseAnalytics: Skill = {
  name: "wastewise-analytics-validated",
  version: "1.0.0",

  async execute(projectData: ProjectData, config: SkillConfig) {
    // 1. Extract invoice data (Backend Agent handles)
    // 2. Calculate metrics
    const ypd = calculateYardsPerDoor(projectData.totalTons, projectData.units);
    const costPerDoor = projectData.totalSpend / projectData.units;

    // 3. Run all optimizations
    const compactorOpt = await runCompactorOptimization(projectData, config);
    const contaminationOpt = checkContamination(projectData, config);
    const bulkOpt = checkBulkSubscription(projectData, config);

    // 4. Check lease-up
    const leaseUp = detectLeaseUp(ypd, projectData.propertyType);

    // 5. Regulatory research (Backend Agent handles)
    // 6. Generate reports (Backend Agent handles)

    return {
      metrics: { ypd, costPerDoor },
      optimizations: [compactorOpt, contaminationOpt, bulkOpt],
      leaseUp,
      totalSavings: calculateTotalSavings([
        compactorOpt,
        contaminationOpt,
        bulkOpt,
      ]),
    };
  },
};
```

### 2. Compactor Optimization

```typescript
// lib/skills/skills/compactor-optimization.ts

export const compactorOptimization: Skill = {
  name: "compactor-optimization",
  version: "1.0.0",

  async execute(projectData: ProjectData, config: SkillConfig) {
    const { haul_log, units } = projectData;

    // Calculate average tons per haul
    const avgTons =
      haul_log.reduce((sum, h) => sum + h.tonnage, 0) / haul_log.length;

    // Get max interval
    const maxInterval = Math.max(
      ...haul_log.map((h) => h.days_since_last || 0),
    );

    // Check threshold (CRITICAL: Use COMPACTOR_OPTIMIZATION_THRESHOLD (6.0) from formulas.ts - per WASTE_FORMULAS_REFERENCE.md v2.0)
    const recommend =
      avgTons < config.thresholds.compactor_tons && maxInterval <= 14;

    if (!recommend) {
      return { recommend: false };
    }

    // Calculate ROI
    const targetTons = 8.5;
    const currentAnnualHauls = (365 / maxInterval) * haul_log.length;
    const optimizedAnnualHauls = (currentAnnualHauls * avgTons) / targetTons;
    const haulsEliminated = currentAnnualHauls - optimizedAnnualHauls;

    const costPerHaul = projectData.avgHaulCost;
    const grossAnnualSavings = haulsEliminated * costPerHaul;

    const installationCost = 300;
    const annualMonitoringCost = 2400;

    const netYear1Savings =
      grossAnnualSavings - installationCost - annualMonitoringCost;
    const netAnnualSavingsYear2Plus = grossAnnualSavings - annualMonitoringCost;

    const roi =
      (netYear1Savings / (installationCost + annualMonitoringCost)) * 100;
    const paybackMonths =
      (installationCost + annualMonitoringCost) / (grossAnnualSavings / 12);

    return {
      recommend: true,
      avgTons,
      targetTons,
      currentAnnualHauls,
      optimizedAnnualHauls,
      haulsEliminated,
      grossAnnualSavings,
      netYear1Savings,
      netAnnualSavingsYear2Plus,
      roi,
      paybackMonths,
    };
  },
};
```

### 3-5. Contract Extractor, Regulatory Research, Batch Extractor

- Similar structure with `execute()` method
- Port from Python SKILL.md files
- Validate outputs

## Acceptance Criteria (Every Task)

### Conversion Accuracy

- [ ] TypeScript output matches Python within 0.01%
- [ ] All evals passing
- [ ] Conversion rates validated (14.49, 4.33, 8.5)
- [ ] Thresholds correct (6.0 tons per COMPACTOR_OPTIMIZATION_THRESHOLD, 3%, $500, -40%)

### Code Quality

- [ ] TypeScript strict mode
- [ ] All functions documented with Python reference
- [ ] No hardcoded values (use config)
- [ ] Proper error handling

### Skills System

- [ ] Registry working correctly
- [ ] Executor validates rates before execution
- [ ] Analyzer correctly identifies request types (>95%)
- [ ] All 5 skills implemented

### Testing

- [ ] Unit tests for each calculation
- [ ] Evals comparing TypeScript vs Python
- [ ] Integration tests for skill execution
- [ ] Performance tests (execution time)

---

**Skills Agent v1.0**
**Specialized in**: Python → TypeScript conversion, calculation accuracy, conversion rate consistency
**Works with**: Backend Agent (API integration), Testing Agent (evals), Orchestrator (validation)
