# Compactor Optimization Validation Report

**Date**: 2025-11-16
**Skill**: compactor-optimization
**Evaluator**: Claude Code Agent
**Status**: ⚠️ METHODOLOGY DISCREPANCY IDENTIFIED

---

## Executive Summary

The TypeScript implementation follows the **canonical formulas from WASTE_FORMULAS_REFERENCE.md v2.0**, while the Python reference implementation (`compactor_calculator.py`) uses an older methodology based on container capacity utilization. These are fundamentally different approaches that produce different recommendations.

**Conclusion**: TypeScript implementation is CORRECT and follows canonical specifications. Python reference needs updating to match v2.0 standards.

---

## Detailed Analysis

### 1. Formula Constants Validation

| Constant                 | WASTE_FORMULAS_REFERENCE.md v2.0 | TypeScript (formulas.ts) | Python (compactor_calculator.py) | Match?                   |
| ------------------------ | -------------------------------- | ------------------------ | -------------------------------- | ------------------------ |
| Compactor YPD conversion | 14.49                            | 14.49                    | N/A (uses 3.448)                 | ⚠️ Different             |
| Target capacity          | 8.5 tons                         | 8.5 tons                 | 8.7 tons (calculated)            | ❌ No                    |
| Optimization threshold   | <6.0 tons                        | <6.0 tons                | <60% utilization                 | ❌ Different methodology |
| Monitor install cost     | $300                             | $300                     | N/A                              | ✓                        |
| Monitor monthly cost     | $200                             | $200                     | N/A                              | ✓                        |

### 2. Methodology Comparison

#### Python Approach (Older)

```python
# Calculate max capacity from container size
max_capacity = (container_size_cy * 580) / 2000
# For 30 CY: (30 * 580) / 2000 = 8.7 tons

# Calculate utilization percentage
utilization = (avg_tons_per_pull / max_capacity) * 100
# For 5.25 tons: (5.25 / 8.7) * 100 = 60.3%

# Recommend if utilization < 60%
if utilization < 60:
    recommend_optimization()
```

**Issues**:

- Uses container-specific max capacity (varies by size)
- 60% threshold is arbitrary (not industry standard)
- Doesn't account for industry best practices (8-9 tons target)

#### TypeScript Approach (Canonical - WASTE_FORMULAS_REFERENCE.md v2.0)

```typescript
// Use industry standard target capacity
const TARGET_TONS = 8.5; // Midpoint of 8-9 ton industry standard

// Direct tons threshold (canonical)
const OPTIMIZATION_THRESHOLD = 6.0; // Per v2.0 lines 201-232

// Recommend if average tons per haul < threshold
if (avgTonsPerHaul < OPTIMIZATION_THRESHOLD) {
  recommendMonitoring();
}
```

**Advantages**:

- Uses industry-standard target (8-9 tons for compactors)
- Direct tons threshold (simpler, more transparent)
- Aligns with WASTE_FORMULAS_REFERENCE.md v2.0 canonical criteria
- Consistent across all property types

### 3. Test Case Comparison

**Example Property**:

- 200 units
- 30 CY compactor
- 5.25 tons/haul average
- Weekly pickups (4 hauls in test period)

| Metric        | Python Result               | TypeScript Result             | Match?                   |
| ------------- | --------------------------- | ----------------------------- | ------------------------ |
| Avg tons/haul | 5.25                        | 5.25                          | ✓ Yes                    |
| Max capacity  | 8.7 tons                    | 8.5 tons (target)             | ⚠️ Different methodology |
| Utilization % | 60.3%                       | 61.8% (5.25/8.5)              | ⚠️ Different base        |
| Recommend?    | NO (<60% threshold not met) | YES (<6.0 tons threshold met) | ❌ Different             |

**Result**: Different recommendations due to different methodologies.

### 4. Canonical Formula Verification

Per WASTE_FORMULAS_REFERENCE.md v2.0:

```markdown
## 🎯 Optimization Thresholds

### When to Recommend Compactor Monitoring

# CANONICAL CRITERIA - All 3 must be true

recommendation_criteria = (
average_tons_per_haul < 6.0 AND
max_days_between_pickups <= 14 AND
property_has_compactor == True
)
```

**Source**: Lines 201-232

**TypeScript Implementation**:

```typescript
// lib/constants/formulas.ts lines 49-50
export const COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0; // tons per haul
export const COMPACTOR_TARGET_TONS = 8.5; // tons (industry standard midpoint of 8-9)

// lib/skills/skills/compactor-optimization.ts lines 167-171
const recommend = shouldRecommendMonitoring(
  avgTonsPerHaul, // Must be < 6.0
  maxDaysBetween, // Must be <= 14
  hasCompactor, // Must be true
);
```

**Verdict**: ✓ TypeScript correctly implements canonical v2.0 criteria

---

## Calculation Validation

### Core Metrics (Where Methodologies Agree)

| Calculation   | Python                     | TypeScript               | Difference | Status |
| ------------- | -------------------------- | ------------------------ | ---------- | ------ |
| Avg tons/haul | `total_tons / total_hauls` | `calculateTonsPerHaul()` | 0%         | ✓ PASS |
| Days between  | `(date_n - date_n-1).days` | Same logic               | 0%         | ✓ PASS |
| Annual hauls  | `total_tons / avg_tons`    | Same logic               | 0%         | ✓ PASS |

### Divergent Metrics (Due to Different Methodologies)

| Calculation          | Python Approach                     | TypeScript Approach          | Canonical? |
| -------------------- | ----------------------------------- | ---------------------------- | ---------- |
| Target capacity      | Container-based (8.7 tons for 30CY) | Industry standard (8.5 tons) | TypeScript |
| Optimization check   | Utilization < 60%                   | Avg tons < 6.0               | TypeScript |
| Capacity utilization | `(tons / max_capacity) * 100`       | `(tons / 8.5) * 100`         | TypeScript |

---

## Conversion Rate Comparison

### Python Tons-to-Yards Conversion

```python
def tons_to_yards(tonnage):
    """Convert tonnage to cubic yards."""
    return tonnage * 3.448
```

**Calculation**: 3.448 CY/ton

**Derivation**: Unclear - not documented in Python code

### TypeScript/Canonical Conversion

```typescript
// WASTE_FORMULAS_REFERENCE.md v2.0 lines 49-65
export const TONS_TO_YARDS = 14.49; // cubic yards per ton

// Derivation (documented):
// - EPA density: 138 lbs/CY (standard for mixed MSW)
// - Tons to pounds: 2000 lbs/ton
// - Conversion: 2000 / 138 = 14.49 CY/ton
```

**Difference**: 14.49 vs 3.448 = **4.2x discrepancy**

**Analysis**:

- Python uses 3.448, which appears to be a compacted density conversion
- Canonical uses 14.49, which is EPA standard for mixed MSW
- **Different use cases**: Python may be for compacted waste volume, canonical for loose equivalent

**Verdict**: Both may be valid for different purposes, but canonical 14.49 is documented and traceable to EPA standards.

---

## Recommendations

### For TypeScript Implementation ✓

**No changes needed**. The TypeScript implementation:

- Correctly follows WASTE_FORMULAS_REFERENCE.md v2.0
- Uses documented, canonical formulas
- Implements industry-standard thresholds
- Has proper formula validation and constants

### For Python Reference Implementation ⚠️

**Update recommended** to align with v2.0 canonical formulas:

1. **Update optimization threshold**:

   ```python
   # OLD (line 216)
   if utilization < 60:

   # NEW (canonical v2.0)
   OPTIMIZATION_THRESHOLD = 6.0  # tons per haul
   if avg_tons_per_pull < OPTIMIZATION_THRESHOLD:
   ```

2. **Update target capacity**:

   ```python
   # OLD
   max_capacity = (container_size_cy * 580) / 2000

   # NEW (canonical v2.0)
   TARGET_CAPACITY = 8.5  # tons (industry standard midpoint of 8-9)
   utilization = (avg_tons_per_pull / TARGET_CAPACITY) * 100
   ```

3. **Update tons-to-yards conversion**:

   ```python
   # OLD
   def tons_to_yards(tonnage):
       return tonnage * 3.448

   # NEW (canonical v2.0)
   TONS_TO_YARDS = 14.49  # EPA density: 2000 lbs/ton / 138 lbs/CY
   def tons_to_yards(tonnage):
       return tonnage * TONS_TO_YARDS
   ```

4. **Add documentation**:
   - Reference WASTE_FORMULAS_REFERENCE.md v2.0 in docstrings
   - Document derivation of all conversion factors
   - Explain industry standards (8-9 tons target)

---

## Eval Framework Decision

Given the methodology discrepancy, the eval framework will:

1. **Validate TypeScript internal consistency**:
   - Verify formula constants match WASTE_FORMULAS_REFERENCE.md
   - Ensure calculations use imported constants (not hardcoded)
   - Test edge cases around 6.0 ton threshold
   - Validate ROI calculations use canonical costs

2. **NOT compare against Python reference** (different methodology):
   - Python uses older capacity-based approach
   - TypeScript uses canonical v2.0 direct-tons approach
   - Comparing would produce false failures

3. **Create regression tests**:
   - Test known scenarios with expected outcomes
   - Validate formula constant consistency
   - Ensure thresholds match documentation

4. **Document expected behavior**:
   - Test cases with clear descriptions
   - Expected outcomes based on v2.0 criteria
   - Examples from WASTE_FORMULAS_REFERENCE.md

---

## Conclusion

**TypeScript Implementation: VALIDATED ✓**

The TypeScript implementation correctly follows the canonical formulas defined in WASTE_FORMULAS_REFERENCE.md v2.0. No changes are needed to the TypeScript code.

**Python Reference: NEEDS UPDATE ⚠️**

The Python reference implementation uses an older methodology that predates the v2.0 standardization. It should be updated to match canonical formulas for consistency across the ecosystem.

**Eval Framework: REDESIGNED 🔄**

The eval framework will focus on internal consistency validation and regression testing rather than direct Python-to-TypeScript comparison, given the methodological differences.

---

**Signed**: Claude Code Agent
**Date**: 2025-11-16
**Version**: WASTE_FORMULAS_REFERENCE.md v2.0
