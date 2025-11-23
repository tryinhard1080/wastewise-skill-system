# Formula Validation & Evals Framework

## Overview

WasteWise formula validation ensures that all calculations are accurate, consistent, and production-ready. The evals framework validates TypeScript implementations against canonical formulas documented in `WASTE_FORMULAS_REFERENCE.md` and Python reference implementations.

**Critical Requirement**: All calculations MUST be within **<0.01% tolerance** of reference implementations.

---

## Why Evals Are Critical

### Business Impact

- **Financial Accuracy**: Incorrect calculations lead to wrong savings estimates
- **Customer Trust**: Inaccurate reports damage credibility
- **Legal Compliance**: Billing calculations must be precise
- **Data Integrity**: Metrics drive business decisions

### Technical Benefits

- **Prevent Regressions**: Catch calculation changes before production
- **Enforce Consistency**: All implementations use same formulas
- **Enable Refactoring**: Confidently restructure code
- **Document Behavior**: Test cases serve as executable specifications

---

## Formula Constants

### Single Source of Truth

All formulas MUST use constants from `lib/constants/formulas.ts`:

```typescript
import {
  COMPACTOR_YPD_CONVERSION, // 14.49 (cubic yards per ton)
  DUMPSTER_YPD_CONVERSION, // 4.33 (weeks per month)
  COMPACTOR_TARGET_TONS, // 8.5 (target tons per haul)
  COMPACTOR_OPTIMIZATION_THRESHOLD, // 6.0 (tons threshold for monitoring)
  WEEKS_PER_MONTH, // 4.33 (industry standard)
} from "@/lib/constants/formulas";
```

### NEVER Hardcode Values

❌ **WRONG**:

```typescript
// Hardcoded value - will break validation
const yardsPerDoor = (totalTons * 14.49) / units;
```

✅ **CORRECT**:

```typescript
import { COMPACTOR_YPD_CONVERSION } from "@/lib/constants/formulas";

const yardsPerDoor = (totalTons * COMPACTOR_YPD_CONVERSION) / units;
```

---

## Running Evals

### Locally

```bash
# Run all formula validation evals
pnpm eval

# Expected output:
# ✅ Formula constants validated
# ✅ All calculation evals passed
# ✅ Production-ready!
```

### In CI/CD

Evals run automatically on:

- Pull requests to `master`
- Pushes to `master`
- Changes to calculation files

**PR will be blocked** if evals fail.

---

## Understanding Eval Output

### Successful Run

```
🧪 WasteWise Formula Validation Evals
================================================================================

📋 Step 1: Validating Formula Constants...
--------------------------------------------------------------------------------
✅ COMPACTOR_YPD_CONVERSION: 14.49 (matches WASTE_FORMULAS_REFERENCE.md)
✅ DUMPSTER_YPD_CONVERSION: 4.33 (matches WASTE_FORMULAS_REFERENCE.md)
✅ COMPACTOR_TARGET_TONS: 8.5 (matches WASTE_FORMULAS_REFERENCE.md)
✅ COMPACTOR_OPTIMIZATION_THRESHOLD: 6.0 (matches WASTE_FORMULAS_REFERENCE.md)
✅ All formula constants validated

📋 Step 2: Running Skill Calculation Evals...
--------------------------------------------------------------------------------

✅ Skill: Compactor Optimization
   Tests: 8/8 passed

================================================================================
📊 OVERALL EVAL RESULTS
================================================================================
Total Tests:  8
Passed:       8 ✅
Failed:       0
Pass Rate:    100.00%
================================================================================

✅ ALL EVALS PASSED!
   All calculations are accurate and match reference implementations.

✅ Validation complete. All calculations are production-ready!
```

### Failed Run

```
❌ Skill: Compactor Optimization
   Tests: 6/8 passed
   Failed tests:
     - test-01-low-utilization: Standard 250-unit property with low utilization
       avgTonsPerHaul: 5.05 vs 5.04 (0.1980% diff)
     - test-04-edge-case-6.0: Edge case: exactly 6.0 tons/haul
       recommend: 1 vs 0 (boolean mismatch)

❌ EVALS FAILED!
   Calculations do not match reference implementation within tolerance.
```

---

## Troubleshooting Failed Evals

### 1. Check Hardcoded Values

**Symptom**: Constant mismatch errors

**Solution**: Replace all hardcoded formula values with imports

```bash
# Find hardcoded values
grep -r "14.49" lib/skills/ lib/calculations/
grep -r "4.33" lib/skills/ lib/calculations/
grep -r "8.5" lib/skills/ lib/calculations/
```

### 2. Verify Formula Implementation

**Symptom**: Calculation results differ

**Solution**: Compare your implementation to canonical formulas

```typescript
// ❌ WRONG - Missing parentheses
const ypd = (totalTons * COMPACTOR_YPD_CONVERSION) / units;

// ✅ CORRECT - Proper order of operations
const ypd = (totalTons * COMPACTOR_YPD_CONVERSION) / units;
```

### 3. Check Rounding

**Symptom**: Small percentage differences accumulate

**Solution**: Round at appropriate points (usually final output only)

```typescript
// ❌ WRONG - Rounding intermediate values
const avgTons = Math.round(totalTons / hauls);
const utilization = (avgTons / COMPACTOR_TARGET_TONS) * 100;

// ✅ CORRECT - Preserve precision until final output
const avgTons = totalTons / hauls;
const utilization = Number(
  ((avgTons / COMPACTOR_TARGET_TONS) * 100).toFixed(2),
);
```

### 4. Verify Logic Conditions

**Symptom**: Boolean recommendation mismatches

**Solution**: Ensure ALL criteria are checked correctly

```typescript
// CANONICAL CRITERIA (ALL 3 must be true)
const recommend =
  avgTonsPerHaul < COMPACTOR_OPTIMIZATION_THRESHOLD && // < 6.0
  maxDaysBetween <= COMPACTOR_MAX_DAYS_BETWEEN && // <= 14
  hasCompactor; // true
```

---

## Adding New Eval Test Cases

### 1. Create Test Fixture

Add to `lib/evals/fixtures/[skill-name].json`:

```json
{
  "name": "My new test case",
  "description": "Test description explaining what is being validated",
  "input": {
    "units": 200,
    "totalTons": 50.0,
    "numberOfHauls": 10
  },
  "expectedOutput": {
    "avgTonsPerHaul": 5.0,
    "needsOptimization": true
  }
}
```

### 2. Calculate Expected Values

Use Python reference implementation or canonical formulas:

```python
# Python reference (if available)
avg_tons = total_tons / number_of_hauls
# 50.0 / 10 = 5.00

recommend = avg_tons < 6.0 and max_days <= 14
# 5.0 < 6.0 = True
```

### 3. Run Eval to Verify

```bash
pnpm eval
```

---

## Updating Formulas

**CRITICAL**: Formula changes require comprehensive validation!

### Step-by-Step Process

1. **Update Documentation**

   ```markdown
   # WASTE_FORMULAS_REFERENCE.md

   - Document new formula value
   - Explain why change is needed
   - Show derivation/source
   ```

2. **Update Constants**

   ```typescript
   // lib/constants/formulas.ts
   export const NEW_CONSTANT = 10.5; // Updated value with comment
   ```

3. **Update Test Fixtures**

   ```json
   // Recalculate all expected values
   "expectedOutput": {
     "newMetric": 10.5  // Based on new constant
   }
   ```

4. **Run Validation**

   ```bash
   pnpm eval  # Must pass
   pnpm test  # All tests must pass
   ```

5. **Update All Documentation**
   - Agent documentation
   - User guides
   - API documentation
   - README files

6. **Create PR with Checklist**
   - Include rationale for change
   - Show before/after comparisons
   - Document impact analysis
   - Link to approval/decision

### Formula Change Checklist

Use `FORMULA_CHANGE_CHECKLIST.md` for complete validation steps.

---

## Tolerance Explanation

### Why <0.01%?

- **Financial Precision**: $0.01 difference on $10,000 = $1 error
- **Industry Standard**: Waste management billing precision
- **Floating Point**: JavaScript number precision limits
- **Accumulation**: Small errors compound across calculations

### Calculating Tolerance

```typescript
const tolerance = 0.0001; // 0.01%

// Example: Expected 5.04, Actual 5.05
const percentDiff = Math.abs((5.05 - 5.04) / 5.04);
// 0.001984 = 0.1984% (FAILS - exceeds 0.01%)

// Example: Expected 5.04, Actual 5.040005
const percentDiff = Math.abs((5.040005 - 5.04) / 5.04);
// 0.000000992 = 0.000992% (PASSES - within 0.01%)
```

---

## Integration with CI/CD

### Automated Checks

1. **Hardcoded Value Detection**: Scans diffs for formula constants
2. **Calculation Tests**: Unit tests for all calculation functions
3. **Formula Evals**: Compare TS output to reference implementations
4. **Build Test**: Ensure code compiles and builds

### PR Workflow

```
Developer → Create Branch → Write Code
                              ↓
                         Run pnpm eval locally
                              ↓
                         Commit & Push
                              ↓
                    GitHub Actions Runs:
                    - Type checking
                    - Linting
                    - Unit tests
                    - Formula validation ← EVALS HERE
                    - Build test
                              ↓
                    All checks pass? → Merge allowed
                    Any check fails? → PR blocked
```

### Required Checks

All PRs MUST pass:

- ✅ TypeScript compilation
- ✅ ESLint
- ✅ Unit tests
- ✅ **Formula validation evals** ← CRITICAL
- ✅ Build test

---

## Best Practices

### 1. Test-Driven Development

Write eval test case BEFORE implementing calculation:

```typescript
// 1. Add test case to fixtures
{
  "input": { "units": 200, "tons": 60 },
  "expectedOutput": { "ypd": 4.35 }
}

// 2. Run eval (will fail)
pnpm eval

// 3. Implement calculation
const ypd = (tons * COMPACTOR_YPD_CONVERSION) / units

// 4. Run eval (should pass)
pnpm eval
```

### 2. Validate Against Multiple Sources

- **Canonical formulas**: WASTE_FORMULAS_REFERENCE.md
- **Python reference**: waste-skills-complete/
- **Manual calculation**: Spreadsheet verification
- **Historical data**: Compare to known-good results

### 3. Document Edge Cases

```typescript
// Edge case: exactly at threshold (6.0 tons)
{
  "name": "Edge case: 6.0 tons/haul",
  "description": "Boundary test - exactly at threshold, should NOT recommend (>= 6.0)",
  "input": { ... },
  "expectedOutput": { "recommend": false }
}
```

### 4. Version Control Fixtures

- Commit test fixtures with code changes
- Include fixture updates in PRs
- Document why expected values changed

---

## FAQ

### Q: Why are my evals failing with "0.001% difference"?

**A**: Even tiny differences can indicate logic errors. Check:

- Order of operations (parentheses)
- Intermediate rounding
- Floating point precision
- Off-by-one errors in loops

### Q: Can I increase the tolerance?

**A**: No. The 0.01% tolerance is required for financial accuracy. If your calculations consistently exceed this, the implementation is incorrect.

### Q: What if the Python reference is wrong?

**A**: Use WASTE_FORMULAS_REFERENCE.md as the single source of truth. If Python differs, update Python AND create an issue documenting the discrepancy.

### Q: Do evals run on every commit?

**A**: Only when calculation-related files change:

- `lib/calculations/**`
- `lib/constants/formulas.ts`
- `lib/skills/**`
- `lib/evals/**`

### Q: Can I skip evals for a "minor" change?

**A**: **NO.** There is no such thing as a "minor" calculation change. All formula changes require eval validation.

---

## Additional Resources

- **Canonical Formulas**: `WASTE_FORMULAS_REFERENCE.md`
- **Formula Constants**: `lib/constants/formulas.ts`
- **Eval Framework**: `lib/evals/README.md`
- **Test Fixtures**: `lib/evals/fixtures/`
- **Python Reference**: `waste-skills-complete/`

---

**Last Updated**: 2025-11-21
**Framework Version**: 1.0.0
**Tolerance**: <0.01% (0.0001)
