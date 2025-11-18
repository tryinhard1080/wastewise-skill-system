# Formula Change Checklist

**Purpose**: Ensure all affected areas are updated when a formula constant or threshold changes.

**Last Updated**: 2025-11-14
**Current Version**: WASTE_FORMULAS_REFERENCE.md v2.0

---

## When to Use This Checklist

Use this checklist whenever you need to change:
- Conversion rates (e.g., TONS_TO_YARDS, WEEKS_PER_MONTH)
- Optimization thresholds (e.g., COMPACTOR_OPTIMIZATION_THRESHOLD)
- Target values (e.g., COMPACTOR_TARGET_TONS)
- Any other calculation constants

---

## Pre-Change Requirements

Before making any formula changes, document:

- [ ] **Business justification**: Why is this value changing?
- [ ] **Impact assessment**: Which calculations are affected?
- [ ] **Python reference**: Has the Python reference been updated?
- [ ] **Stakeholder approval**: Has this change been approved?

---

## Change Process

### Step 1: Update Documentation

- [ ] Update `WASTE_FORMULAS_REFERENCE.md` with:
  - New value
  - Derivation/justification
  - Version number increment
  - Change date
  - Impact notes

- [ ] Add entry to `CHANGELOG.md` (if exists) or git commit message:
  ```
  feat(formulas): Update COMPACTOR_OPTIMIZATION_THRESHOLD from X to Y

  Justification: [Explain why]
  Impact: [List affected calculations]

  BREAKING CHANGE: Optimization recommendations will change for existing data
  ```

### Step 2: Update Code Constants

- [ ] Update `lib/constants/formulas.ts`:
  ```typescript
  // Before
  export const COMPACTOR_OPTIMIZATION_THRESHOLD = 7.0

  // After (with comment explaining change)
  export const COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0 // Updated 2025-11-14: Per industry analysis
  ```

- [ ] Verify all imports are using the constant (no hardcoded values):
  ```bash
  # Search for hardcoded old value (e.g., 7.0)
  grep -r "7\.0" lib/calculations/
  grep -r "7\.0" lib/skills/
  grep -r "7\.0" app/api/
  ```

### Step 3: Update Database

- [ ] Update seed data in `supabase/seed.sql`:
  ```sql
  update skills_config
  set thresholds = jsonb_set(
    thresholds,
    '{compactor_tons}',
    '6.0'
  )
  where skill_name = 'compactor-optimization';
  ```

- [ ] Create migration if schema/seed data changes:
  ```bash
  supabase migration new update_compactor_threshold
  ```

- [ ] Test migration on local database:
  ```bash
  supabase db reset
  pnpm run verify-database
  ```

### Step 4: Update Tests & Evals

- [ ] Update test fixtures in `__tests__/fixtures/`:
  - Input data
  - Expected outputs
  - Boundary test cases

- [ ] Update eval test cases:
  ```typescript
  // Before
  expect(shouldRecommendMonitors(6.8, 12)).toBe(true);  // Below 7.0
  expect(shouldRecommendMonitors(7.0, 12)).toBe(false); // At 7.0

  // After
  expect(shouldRecommendMonitors(5.8, 12)).toBe(true);  // Below 6.0
  expect(shouldRecommendMonitors(6.0, 12)).toBe(false); // At 6.0
  ```

- [ ] Run full test suite:
  ```bash
  pnpm test
  pnpm test:unit
  pnpm test:integration
  ```

- [ ] Run calculation evals:
  ```bash
  pnpm eval
  ```

- [ ] Verify eval tolerance (<0.01% deviation):
  - All evals must pass
  - If evals fail, investigate discrepancy

### Step 5: Update Agent Documentation

- [ ] Update `.claude/agents/orchestrator.md`:
  - Search for old value in thresholds list
  - Update to new value
  - Add reference to formulas.ts constant

- [ ] Update `.claude/agents/backend-agent.md`:
  - Seed data examples
  - API documentation
  - Threshold validation logic

- [ ] Update `.claude/agents/skills-agent.md`:
  - Conversion rate management section
  - Python reference examples
  - TypeScript port examples
  - Test case examples

- [ ] Update `.claude/agents/testing-agent.md`:
  - Test case examples
  - Eval examples
  - Validation criteria

- [ ] Verify no hardcoded values remain:
  ```bash
  grep -r "7\.0" .claude/agents/
  # Should only find references in comments like "(NOT 7.0)"
  ```

### Step 6: Update Application Code

- [ ] Update calculation files in `lib/calculations/`:
  - Verify all use imported constants
  - No hardcoded values
  - Comments reference formulas.ts

- [ ] Update skill implementations in `lib/skills/`:
  - Verify config.thresholds usage
  - No hardcoded fallbacks

- [ ] Update API routes in `app/api/`:
  - Validation schemas
  - Error messages with thresholds

### Step 7: Validation

- [ ] Run runtime validation:
  ```bash
  pnpm dev
  # Check console for validateFormulaConstants() output
  ```

- [ ] Verify database sync:
  ```bash
  pnpm run verify-database
  # Should show all skills have correct thresholds
  ```

- [ ] Manual calculation spot check:
  - Input known test data
  - Verify output matches expected results
  - Compare with Python reference

- [ ] Check for breaking changes:
  - Will existing project data produce different results?
  - Do users need to re-run analyses?
  - Are old reports still valid?

### Step 8: Documentation & Communication

- [ ] Update README.md if user-facing changes

- [ ] Update API documentation if endpoints affected

- [ ] Document migration path for existing data (if needed)

- [ ] Add to deployment notes/release notes

- [ ] Communicate to team:
  - What changed
  - Why it changed
  - Impact on existing data
  - Action items for team members

---

## Post-Change Verification

After completing all steps above, verify:

- [ ] All tests passing
- [ ] All evals passing (<0.01% tolerance)
- [ ] No hardcoded values in codebase
- [ ] Database synced with formulas.ts
- [ ] Agent docs updated
- [ ] Git commit with clear message
- [ ] No console warnings about formula mismatches

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert `lib/constants/formulas.ts` to previous value
2. **Database**: Run rollback migration or manual UPDATE
3. **Verify**: Run test suite and evals
4. **Document**: Why rollback was needed, what went wrong
5. **Fix**: Address root cause before attempting change again

---

## Example: Changing COMPACTOR_OPTIMIZATION_THRESHOLD from 7.0 to 6.0

### Context
- **Date**: 2025-11-14
- **Reason**: WASTE_FORMULAS_REFERENCE.md v2.0 updated based on industry analysis
- **Impact**: Compactor optimization recommendations will trigger at lower tonnage

### Checklist Execution

**Step 1: Documentation**
- ✅ Updated WASTE_FORMULAS_REFERENCE.md v1.0 → v2.0
- ✅ Added justification based on industry data

**Step 2: Code Constants**
- ✅ Updated lib/constants/formulas.ts: `6.0` with comment
- ✅ Searched for hardcoded "7.0" - found 15 instances

**Step 3: Database**
- ✅ Updated seed.sql with new threshold
- ✅ Created migration (not needed - seed data only)
- ✅ Ran supabase db reset successfully

**Step 4: Tests & Evals**
- ✅ Updated test fixtures with new boundary values
- ✅ Updated 12 test cases across 4 test files
- ✅ All tests passing
- ✅ All evals passing (<0.001% deviation)

**Step 5: Agent Docs**
- ✅ Updated orchestrator.md (2 locations)
- ✅ Updated backend-agent.md (2 locations)
- ✅ Updated skills-agent.md (8 locations)
- ✅ Updated testing-agent.md (5 locations)
- ✅ No hardcoded "7.0" remaining (only in NOT 7.0 comments)

**Step 6: Application Code**
- ✅ All calculation files use imported constant
- ✅ All skills use config.thresholds
- ✅ No hardcoded values found

**Step 7: Validation**
- ✅ Runtime validation passing
- ✅ Database verification passing
- ✅ Manual spot check: 5.8 tons → recommend monitors ✓
- ✅ No breaking changes (existing data will produce slightly different recommendations)

**Step 8: Documentation**
- ✅ Git commit with detailed message
- ✅ Added to Phase 1.5-A completion notes
- ✅ Team notified via project documentation

**Result**: Successfully changed threshold from 7.0 to 6.0 tons with full consistency across all areas.

---

## Quick Reference: Files to Check

When changing formulas, always check these locations:

### Documentation
- [ ] WASTE_FORMULAS_REFERENCE.md
- [ ] .claude/CLAUDE.md
- [ ] .claude/agents/orchestrator.md
- [ ] .claude/agents/backend-agent.md
- [ ] .claude/agents/skills-agent.md
- [ ] .claude/agents/testing-agent.md

### Code
- [ ] lib/constants/formulas.ts
- [ ] lib/calculations/*.ts
- [ ] lib/skills/skills/*.ts
- [ ] lib/skills/executor.ts
- [ ] lib/skills/validator.ts

### Database
- [ ] supabase/seed.sql
- [ ] supabase/migrations/*.sql

### Tests
- [ ] __tests__/unit/*.test.ts
- [ ] __tests__/integration/*.test.ts
- [ ] lib/evals/*.ts
- [ ] __tests__/fixtures/*.json

### Application
- [ ] app/api/*/route.ts
- [ ] components/**/**.tsx (if displaying threshold values)

---

**Version**: 1.0
**Maintained by**: Orchestrator Agent
**Review frequency**: After each formula change
