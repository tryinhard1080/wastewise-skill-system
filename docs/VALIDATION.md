# WasteWise Validation Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Philosophy**: "If `/validate` passes, WasteWise is production-ready"

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Validation Philosophy](#validation-philosophy)
4. [The Five Validation Phases](#the-five-validation-phases)
5. [Running Validation](#running-validation)
6. [Understanding Results](#understanding-results)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

---

## Overview

The WasteWise validation system provides **100% confidence** that the application works correctly in production through comprehensive, automated testing across five critical phases.

### Why This Matters

Traditional testing approaches often miss integration issues that only appear in production. The WasteWise validation system:

- ✅ Tests **complete user workflows**, not isolated functions
- ✅ Verifies **real external systems** (database, APIs, file system)
- ✅ Validates **calculation accuracy** against Python reference (<0.01% tolerance)
- ✅ Ensures **security measures** are enforced (RLS, input sanitization, rate limiting)
- ✅ Confirms **performance standards** (Lighthouse score >90)

### Success Criteria

**If all 5 phases pass**:

- ✅ WasteWise is production-ready
- ✅ All critical user workflows tested
- ✅ All calculations verified accurate
- ✅ All security measures validated
- ✅ Safe to deploy

**If any phase fails**:

- ❌ Do NOT deploy to production
- ❌ Fix failing tests first
- ❌ Re-run `/validate` until all pass

---

## Quick Start

### Prerequisites

1. **Local Supabase running**:

   ```bash
   supabase start
   supabase db push
   ```

2. **Environment variables configured** (`.env.local`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

3. **Dependencies installed**:

   ```bash
   pnpm install
   ```

4. **Worker process NOT running** during tests (to avoid conflicts)

### Running Validation

```bash
# Full validation (all 5 phases) - Use before PRs
pnpm validate

# Fast validation (skip E2E tests) - Use before commits
pnpm validate:skip-e2e

# Run specific phase only
pnpm validate:phase=1  # Linting
pnpm validate:phase=2  # Type checking
pnpm validate:phase=3  # Style checking
pnpm validate:phase=4  # Unit tests
pnpm validate:phase=5  # E2E tests
```

---

## Validation Philosophy

### Integration Over Isolation

WasteWise validation emphasizes **integration testing** over isolated unit testing.

**Traditional Approach** (Discouraged):

```typescript
// ❌ Test that a function stores data internally
test("saveUser stores user in memory", () => {
  const result = saveUser({ name: "John" });
  expect(result.stored).toBe(true);
});
```

**WasteWise Approach** (Recommended):

```typescript
// ✅ Test complete workflow with observable external outcomes
test("user signup creates database record and sends email", async () => {
  // 1. Interact like a real user
  await page.goto("/signup");
  await page.fill('[name="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  // 2. Verify in actual external systems
  const user = await database.query("SELECT * FROM users WHERE email = $1", [
    "test@example.com",
  ]);
  expect(user).toBeDefined();

  const email = await emailService.getLastEmail();
  expect(email.to).toBe("test@example.com");
  expect(email.subject).toContain("Welcome");
});
```

### Why Integration Testing?

1. **Real-World Validity**: Tests what actually matters - does the feature work for users?
2. **Catch Integration Bugs**: Finds issues between components that unit tests miss
3. **Confidence**: Validates entire system, not isolated pieces
4. **Refactor Safety**: Can change implementation without breaking tests

---

## The Five Validation Phases

### Phase 1: Linting

**Purpose**: Enforce code quality standards and catch common errors

**Command**: `pnpm lint`

**What It Checks**:

- ESLint rules for TypeScript/JavaScript
- React hooks usage
- Import/export correctness
- Potential runtime errors

**Expected Result**: 0 errors, 0 warnings

**Example Output**:

```bash
✅ Phase 1: Linting... PASSED (2341ms)
```

---

### Phase 2: Type Checking

**Purpose**: Ensure type safety across codebase

**Command**: `pnpm tsc --noEmit`

**What It Checks**:

- Type mismatches
- Missing type annotations (strict mode)
- Invalid property access
- Function signature correctness

**Expected Result**: 0 type errors

**Example Output**:

```bash
✅ Phase 2: Type Checking... PASSED (5128ms)
```

**Note**: TypeScript strict mode is enabled. All type errors must be fixed.

---

### Phase 3: Style Checking

**Purpose**: Maintain consistent code formatting

**Command**: `pnpm prettier --check .`

**What It Checks**:

- Code formatting consistency
- Indentation
- Line length
- Import ordering

**Expected Result**: All files properly formatted

**To Fix**: Run `pnpm prettier --write .`

**Example Output**:

```bash
✅ Phase 3: Style Checking... PASSED (1523ms)
```

---

### Phase 4: Unit Testing

**Purpose**: Test calculations, utilities, and business logic

**Command**: `pnpm test:unit`

**What It Tests**:

- Calculation formulas (yards per door, cost per door, etc.)
- Skills business logic
- Utility functions
- Data transformation
- **Formula evals** (TypeScript vs Python reference)

**Expected Result**: All unit tests pass

**Critical Tests**:

- `lib/evals/` - Calculation accuracy (<0.01% tolerance)
- `__tests__/skills/` - Skills logic
- `__tests__/security/` - Security hardening (XSS, file upload, RLS)

**Example Output**:

```bash
✅ Phase 4: Unit Testing... PASSED (12456ms)
   - 127 tests passed
   - Calculation evals: All within 0.01% tolerance
   - Security tests: All passed
```

---

### Phase 5: End-to-End Testing

**Purpose**: Test complete user workflows exactly as users interact with WasteWise

**Command**: `pnpm test:e2e`

**What It Tests**:

- User Registration & Login
- Create Project Workflow
- Upload Files Workflow
- Run Analysis Workflow (with job processing)
- View Results & Download Reports Workflow
- Error Handling Workflow

**Test Levels**:

#### Level 1: Internal API Tests

Test API endpoints with curl commands and verify in database:

```bash
# Example: Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","units":250,"property_type":"Garden-Style"}' \
  | jq '.id'

# Verify in database
psql -c "SELECT * FROM projects WHERE name='Test';"
```

#### Level 2: External Integration Tests

Test interactions with external services:

- Anthropic AI (invoice extraction, regulatory research)
- Supabase Storage (file uploads)

#### Level 3: Complete User Workflows (Most Important)

Playwright tests that run complete user journeys:

```typescript
test("complete waste analysis workflow", async ({ page }) => {
  // 1. Login
  await page.goto("/login");
  await page.fill('[name="email"]', "test@wastewise.local");
  await page.fill('[name="password"]', "TestPassword123!");
  await page.click('button[type="submit"]');

  // 2. Create project
  await page.goto("/projects/new");
  await page.fill('[name="name"]', "Test Property");
  // ... fill form ...
  await page.click('button[type="submit"]');

  // 3. Upload files
  await page.setInputFiles('input[type="file"]', "invoice.pdf");
  await page.waitForSelector(".upload-success");

  // 4. Start analysis
  await page.click('[data-testid="analyze"]');
  await page.waitForSelector('[data-testid="results"]');

  // 5. Verify in database
  const analysis = await db.query(
    "SELECT * FROM analysis_jobs WHERE status = $1",
    ["completed"],
  );
  expect(analysis.result_data).toBeDefined();

  // 6. Download reports
  await page.click('[data-testid="download-excel"]');
  const download = await page.waitForEvent("download");
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
```

**Expected Result**: All 66 E2E tests pass across 8 test suites

**Example Output**:

```bash
✅ Phase 5: E2E Testing... PASSED (142341ms)
   - auth-flows.spec.ts: 9/9 passed
   - project-management.spec.ts: 9/9 passed
   - file-upload.spec.ts: 9/9 passed
   - analysis-workflows.spec.ts: 9/9 passed
   - results-reports.spec.ts: 9/9 passed
   - error-handling.spec.ts: 9/9 passed
   - performance.spec.ts: 7/7 passed
   - responsive-viewports.spec.ts: 5/5 passed
```

---

## Running Validation

### Full Validation (Recommended Before PRs)

```bash
pnpm validate
```

**Expected Duration**: ~3-5 minutes

**When to Use**:

- ✅ Before creating a pull request
- ✅ After completing a major feature
- ✅ Before deploying to production
- ✅ After merging from master

### Quick Validation (Before Commits)

```bash
pnpm validate:skip-e2e
```

**Expected Duration**: ~30 seconds

**When to Use**:

- ✅ Before every commit
- ✅ During active development
- ✅ Quick sanity checks

### Targeted Validation

```bash
# Just linting
pnpm validate:phase=1

# Just type checking
pnpm validate:phase=2

# Just style
pnpm validate:phase=3

# Just unit tests
pnpm validate:phase=4

# Just E2E tests
pnpm validate:phase=5
```

**When to Use**:

- Fixing specific issues
- Debugging failed phases
- Running subset of tests during development

---

## Understanding Results

### Success Output

```bash
==================================================
WasteWise Validation Orchestrator
==================================================

Philosophy: "If /validate passes, WasteWise is production-ready"

Checking Prerequisites...

  ✅ Node modules installed
  ✅ package.json exists
  ✅ TypeScript config exists

Phase 1: Linting
Enforce code quality and catch common errors
Running: pnpm lint

✅ PASSED (2341ms)

Phase 2: Type Checking
Ensure type safety across codebase
Running: pnpm tsc --noEmit

✅ PASSED (5128ms)

Phase 3: Style Checking
Maintain consistent code formatting
Running: pnpm prettier --check .

✅ PASSED (1523ms)

Phase 4: Unit Testing
Test calculations, utilities, and business logic
Running: pnpm test:unit

✅ PASSED (12456ms)

Phase 5: E2E Testing
Test complete user workflows
Running: pnpm test:e2e

✅ PASSED (142341ms)

============================================================
Validation Summary
============================================================

  ✅ Phase 1: Linting... PASSED (2341ms)
  ✅ Phase 2: Type Checking... PASSED (5128ms)
  ✅ Phase 3: Style Checking... PASSED (1523ms)
  ✅ Phase 4: Unit Testing... PASSED (12456ms)
  ✅ Phase 5: E2E Testing... PASSED (142341ms)

Results:
  Phases Passed: 5/5
  Total Duration: 163789ms (163.79s)

🎉 All validations passed! Ready for production.

✅ WasteWise is production-ready
✅ All critical user workflows tested
✅ All calculations verified accurate
✅ All security measures validated
✅ Safe to deploy
```

### Failure Output

```bash
Phase 3: Style Checking
Maintain consistent code formatting
Running: pnpm prettier --check .

❌ FAILED (1523ms)

Error:
src/components/Dashboard.tsx needs formatting
src/lib/calculations/compactor.ts needs formatting

⚠️ Required phase failed. Stopping validation.

============================================================
Validation Summary
============================================================

  ✅ Phase 1: Linting... PASSED (2341ms)
  ✅ Phase 2: Type Checking... PASSED (5128ms)
  ❌ Phase 3: Style Checking... FAILED (1523ms)

Results:
  Phases Passed: 2/3
  Total Duration: 9392ms (9.39s)

❌ Validation failed. Do NOT deploy to production.

Next Steps:
  1. Fix failing tests first
  2. Re-run /validate until all pass
  3. Review error messages above
```

---

## Troubleshooting

### Common Issues

#### Supabase Not Running

**Symptom**: "Database connection failed" errors

**Fix**:

```bash
# Start Supabase
supabase start

# Verify running
supabase status
```

#### Database Migration Issues

**Symptom**: "Table does not exist" errors

**Fix**:

```bash
# Reset database
supabase db reset

# Run migrations
supabase migration up
```

#### E2E Tests Timing Out

**Symptom**: Tests fail with timeout errors

**Fix**:

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds per test
```

#### Calculation Evals Failing

**Symptom**: "Deviation >0.01%" errors

**Fix**:

```bash
# Verify Python reference implementation
cd waste-skills-complete
python -m pytest tests/

# Check conversion rates match
grep -r "14.49\|4.33\|8.5\|6.0" lib/constants/formulas.ts
```

#### Rate Limiting Tests Failing

**Symptom**: Rate limit tests not triggering 429 responses

**Fix**:

```bash
# Verify Upstash Redis configured
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Or use fallback (in-memory) for testing
unset UPSTASH_REDIS_REST_URL
```

### Phase-Specific Troubleshooting

#### Phase 1 (Linting) Failures

```bash
# Auto-fix linting issues
pnpm lint --fix

# Check specific file
pnpm eslint src/path/to/file.ts
```

#### Phase 2 (Type Checking) Failures

```bash
# Check specific directory
pnpm tsc --noEmit --project tsconfig.json

# View detailed errors
pnpm tsc --noEmit --pretty
```

#### Phase 3 (Style) Failures

```bash
# Auto-fix formatting
pnpm prettier --write .

# Check specific file
pnpm prettier --check src/path/to/file.ts
```

#### Phase 4 (Unit Tests) Failures

```bash
# Run tests in watch mode
pnpm test:unit --watch

# Run specific test file
pnpm test __tests__/skills/compactor-optimization.test.ts

# Run with verbose output
pnpm test:unit --reporter=verbose
```

#### Phase 5 (E2E Tests) Failures

```bash
# Run E2E tests in headed mode (see browser)
pnpm test:e2e:headed

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run specific E2E test
playwright test __tests__/e2e/auth-flows.spec.ts

# View test report
pnpm test:e2e:report
```

---

## CI/CD Integration

### GitHub Actions

WasteWise validation can be integrated into GitHub Actions workflows:

```yaml
# .github/workflows/validate.yml
name: Validate

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: pnpm install

      - name: Run Validation
        run: pnpm validate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: playwright-report/
```

### Pre-commit Hooks

Automate validation before commits using Husky:

```bash
# .husky/pre-commit
#!/bin/sh
pnpm validate:skip-e2e || exit 1
```

---

## Best Practices

### 1. Run Validation Frequently

- ✅ **Before every commit**: `pnpm validate:skip-e2e`
- ✅ **Before every PR**: `pnpm validate`
- ✅ **After merging from master**: `pnpm validate`
- ✅ **Before deploying**: `pnpm validate`

### 2. Fix Failures Immediately

Don't accumulate technical debt:

- ❌ Don't skip validation to "save time"
- ❌ Don't commit failing code
- ❌ Don't create PRs with known failures
- ✅ Fix issues as soon as they appear

### 3. Use Targeted Validation During Development

Speed up your workflow:

```bash
# Working on UI → Just lint and type check
pnpm validate:phase=1 && pnpm validate:phase=2

# Working on calculations → Run unit tests
pnpm eval && pnpm validate:phase=4

# Working on API → Run integration tests
pnpm test __tests__/api/integration.test.ts
```

### 4. Trust the Validation System

If `/validate` passes, the code is production-ready:

- ✅ Deploy with confidence
- ✅ No need for manual testing
- ✅ All critical paths verified

### 5. Keep Tests Fast

- Use `--skip-e2e` for pre-commit checks
- Run full validation only before PRs
- Optimize slow tests (parallel execution, reduce waits)

### 6. Monitor Validation Metrics

Track validation performance over time:

- Average duration per phase
- Failure rates by phase
- Most common failure types

---

## Appendix: Test Coverage

### Unit Tests (Phase 4)

- **Skills**: 100% coverage for all 5 skills
- **Calculations**: <0.01% deviation from Python reference
- **Utilities**: 100% coverage
- **Security**: XSS, file upload, RLS, rate limiting

### E2E Tests (Phase 5)

- **66 total tests** across 8 test suites
- **Complete workflows**: Auth, projects, uploads, analysis, results
- **Performance**: Lighthouse audits, load testing
- **Responsiveness**: 6 viewport sizes tested

### Integration Tests

- **API endpoints**: All routes tested with real data
- **Database**: RLS policies, cascade deletes, constraints
- **External services**: Anthropic AI, Supabase Storage

---

## Support & Contributing

**Questions**: Review this documentation or check `.claude/commands/validate.md`

**Issues**: Report validation failures with:

- Phase that failed
- Error message
- Steps to reproduce
- Environment (local, CI/CD)

**Contributing**: To add new validation checks:

1. Update test suite (`__tests__/`)
2. Update `scripts/validate.ts` if adding new phase
3. Update this documentation
4. Update `.claude/commands/validate.md`

---

**Version History**:

- v1.0.0 (2025-11-22): Initial validation system documentation

**Maintained By**: WasteWise Development Team
**Review Frequency**: After major feature additions
