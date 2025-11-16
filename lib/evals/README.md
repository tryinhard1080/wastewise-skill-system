# Eval Framework

**Purpose**: Validate TypeScript skill implementations against Python reference calculations to ensure formula accuracy within 0.01% tolerance.

## Overview

This directory contains the evaluation framework for comparing TypeScript implementations against Python reference code. All skills that perform calculations MUST have corresponding eval tests to ensure accuracy.

## Directory Structure

```
lib/evals/
├── README.md (this file)
├── types.ts (TypeScript type definitions)
├── eval-utils.ts (Reusable comparison utilities)
├── compactor-optimization-eval.ts (Example eval implementation)
└── [skill-name]-eval.ts (Future eval files)
```

## Core Components

### 1. Types (`types.ts`)

Defines the standard interfaces used across all evals:

- `EvalComparison` - Single metric comparison result
- `EvalResult` - Complete test case result
- `EvalSummary` - Summary of all test results
- `TestCase<TInput, TExpected>` - Generic test case structure

### 2. Utilities (`eval-utils.ts`)

Reusable helper functions:

- `compareValues()` - Compare two numeric values with tolerance
- `compareMetrics()` - Compare multiple metrics in batch
- `formatEvalReport()` - Generate human-readable text report
- `generateEvalSummary()` - Aggregate multiple test results
- `assertWithinTolerance()` - Throw error if outside tolerance (for unit tests)

### 3. Skill Evals (`[skill-name]-eval.ts`)

Individual eval files for each skill. See `compactor-optimization-eval.ts` for reference implementation.

## Creating a New Eval

### Step 1: Define Test Cases

Extract expected values from the Python reference implementation:

```typescript
import type { TestCase } from './types'

interface MySkillInput {
  // Define input structure matching Python function
  propertyUnits: number
  containerSize: number
  // ... other inputs
}

interface MySkillExpectedOutput {
  // Define expected outputs from Python
  calculatedMetric: number
  recommendation: boolean
  // ... other outputs
}

const TEST_CASES: TestCase<MySkillInput, MySkillExpectedOutput>[] = [
  {
    id: 'test-01-basic',
    description: 'Basic calculation with standard inputs',
    input: {
      propertyUnits: 200,
      containerSize: 30,
      // ... other inputs
    },
    expected: {
      calculatedMetric: 5.25,
      recommendation: true,
      // ... expected outputs from Python
    },
  },
  // ... more test cases
]
```

### Step 2: Implement Test Runner

```typescript
import { MySkill } from '@/lib/skills/skills/my-skill'
import { compareMetrics, generateEvalSummary } from './eval-utils'
import type { EvalResult, EvalSummary } from './types'

export async function runMySkillEval(): Promise<EvalSummary> {
  const results: EvalResult[] = []

  for (const testCase of TEST_CASES) {
    try {
      const result = await runSingleTest(testCase)
      results.push(result)
    } catch (error) {
      results.push({
        testCaseId: testCase.id,
        description: testCase.description,
        pass: false,
        comparisons: [],
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return generateEvalSummary(results)
}

async function runSingleTest(
  testCase: TestCase<MySkillInput, MySkillExpectedOutput>
): Promise<EvalResult> {
  const skill = new MySkill()

  // Build SkillContext from test input
  const context = buildSkillContext(testCase.input)

  // Execute skill
  const skillResult = await skill.execute(context)

  if (!skillResult.success || !skillResult.data) {
    return {
      testCaseId: testCase.id,
      description: testCase.description,
      pass: false,
      comparisons: [],
      error: skillResult.error?.message || 'Skill execution failed',
    }
  }

  // Compare outputs
  const comparisons = compareMetrics({
    calculatedMetric: [
      skillResult.data.calculatedMetric,
      testCase.expected.calculatedMetric,
    ],
    // ... other metrics
  })

  const pass = comparisons.every(c => c.pass)

  return {
    testCaseId: testCase.id,
    description: testCase.description,
    pass,
    comparisons,
  }
}
```

### Step 3: Run the Eval

```bash
# Option 1: Run directly
npx tsx lib/evals/my-skill-eval.ts

# Option 2: Add to package.json scripts
npm run eval:my-skill

# Option 3: Import and run programmatically
import { runMySkillEval, formatEvalReport } from '@/lib/evals/my-skill-eval'

const summary = await runMySkillEval()
console.log(formatEvalReport(summary))
```

## Tolerance Requirements

**CRITICAL**: All calculations must match Python reference within **0.01% tolerance** (0.0001 as a decimal).

```typescript
import { DEFAULT_TOLERANCE } from './eval-utils'

// DEFAULT_TOLERANCE = 0.0001 (0.01%)

const comparison = compareValues('myMetric', tsValue, pythonValue, DEFAULT_TOLERANCE)

if (!comparison.pass) {
  console.error(`Calculation exceeds tolerance!`)
  console.error(`Expected: ${pythonValue}`)
  console.error(`Actual: ${tsValue}`)
  console.error(`Difference: ${comparison.difference}`)
  console.error(`% Diff: ${comparison.percentDiff * 100}%`)
}
```

## Best Practices

### 1. Test Edge Cases

Always include edge cases in your test suite:

```typescript
const TEST_CASES = [
  // Happy path
  { id: 'test-01', description: 'Standard case', input: {...}, expected: {...} },

  // Edge cases
  { id: 'test-02', description: 'Boundary: exactly at threshold', input: {...}, expected: {...} },
  { id: 'test-03', description: 'Boundary: just below threshold', input: {...}, expected: {...} },
  { id: 'test-04', description: 'Boundary: just above threshold', input: {...}, expected: {...} },

  // Zero/null cases
  { id: 'test-05', description: 'Zero value handling', input: {...}, expected: {...} },

  // Large values
  { id: 'test-06', description: 'Large property (1000+ units)', input: {...}, expected: {...} },
]
```

### 2. Document Python Reference

Always include a comment linking to the Python reference:

```typescript
/**
 * My Skill Eval
 *
 * Validates TypeScript implementation against Python reference
 * Source: waste-skills-complete/my-skill/scripts/calculator.py
 *
 * Python function: analyze_property() (lines 160-270)
 *
 * Test case derivation:
 * - Test 01: Example usage from line 387
 * - Test 02: Edge case from SKILL.md documentation
 */
```

### 3. Extract Expected Values from Python

Run the Python reference to get exact expected values:

```bash
cd waste-skills-complete/my-skill
python3 scripts/calculator.py

# Or run in Python REPL
python3
>>> from scripts.calculator import analyze_property
>>> result = analyze_property(units=200, container_size_cy=30, ...)
>>> print(result)
```

### 4. Compare Formula Constants

Before running evals, validate that constants match:

```typescript
import {
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_TARGET_TONS,
  DSQ_MONITOR_INSTALL,
  DSQ_MONITOR_MONTHLY,
} from '@/lib/constants/formulas'

// Verify these match Python constants
// Python: OPTIMIZATION_THRESHOLD = 6.0
// TypeScript: COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0
```

## Integration with CI/CD

Evals should run automatically before merges:

```yaml
# .github/workflows/validate-merge.yml
- name: Run calculation evals
  run: |
    npm run eval:compactor-optimization
    npm run eval:contract-extractor
    npm run eval:wastewise-analytics
    # ... other evals
```

## Troubleshooting

### Eval Fails: Tolerance Exceeded

1. Check if TypeScript is using correct formula constants
2. Verify Python reference is using canonical formulas
3. Compare intermediate calculation steps
4. Check for rounding differences

### Eval Fails: Boolean Mismatch

1. Verify threshold constants match exactly
2. Check boundary conditions (< vs <=, > vs >=)
3. Ensure all criteria are evaluated in same order

### Eval Fails: Missing Data

1. Ensure test context includes all required data
2. Verify skill validation passes before execution
3. Check for null/undefined handling differences

## Example Output

```
================================================================================
EVAL VALIDATION REPORT
================================================================================

Executed: 2025-11-16T12:00:00.000Z
Total Tests: 5
Passing: 5
Failing: 0
Pass Rate: 100.00%

--------------------------------------------------------------------------------
Test: test-01-low-utilization
Description: Property with low utilization (5.2 tons/haul) - should recommend monitoring
Status: ✓ PASS

Metric Comparisons:
  ✓ avgTonsPerHaul
    TypeScript:  5.2500
    Python:      5.2500
    Difference:  0.000000
    % Diff:      0.0000%
    Tolerance:   0.0100%

  ✓ recommend
    TypeScript:  1.0000
    Python:      1.0000
    Difference:  0.000000
    % Diff:      0.0000%
    Tolerance:   0.0000%

--------------------------------------------------------------------------------
...

================================================================================
✓ ALL TESTS PASSED
================================================================================
```

## Future Enhancements

- [ ] Add support for visual diffs (charts comparing TS vs Python)
- [ ] Generate HTML reports with interactive filtering
- [ ] Add performance benchmarking alongside accuracy checks
- [ ] Support for fuzzy matching on text outputs (recommendations, descriptions)
- [ ] Automatic test case generation from Python docstrings

---

**Questions?** See existing evals for reference patterns or consult WASTE_FORMULAS_REFERENCE.md for canonical formulas.
