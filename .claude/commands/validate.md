# WasteWise Validation Command

**Purpose**: Provides 100% confidence that WasteWise works correctly in production by testing all critical user workflows.

**Philosophy**: "If `/validate` passes, WasteWise is production-ready"

---

## Prerequisites

**Required**:

- Local Supabase running (`supabase start`)
- Environment variables configured (`.env.local`)
- Dependencies installed (`pnpm install`)
- Worker process NOT running during tests (to avoid conflicts)

**Optional for Full E2E**:

- Anthropic API key (for AI integration tests)
- Test data seeded (`pnpm run seed:test`)

---

## Phase 1: Linting

**Purpose**: Enforce code quality and catch common errors

```bash
pnpm lint
```

**What it checks**:

- ESLint rules for TypeScript/JavaScript
- React hooks usage
- Import/export correctness
- Potential runtime errors

**Expected**: 0 errors, 0 warnings

---

## Phase 2: Type Checking

**Purpose**: Ensure type safety across codebase

```bash
pnpm tsc --noEmit
```

**What it checks**:

- Type mismatches
- Missing type annotations (strict mode)
- Invalid property access
- Function signature correctness

**Expected**: 0 errors

**Note**: TypeScript strict mode is enabled. All type errors must be fixed.

---

## Phase 3: Style Checking

**Purpose**: Maintain consistent code formatting

```bash
pnpm prettier --check .
```

**What it checks**:

- Code formatting consistency
- Indentation
- Line length
- Import ordering

**Expected**: All files properly formatted

**To fix**: Run `pnpm prettier --write .`

---

## Phase 4: Unit Testing

**Purpose**: Test calculations, utilities, and business logic

```bash
pnpm test:unit
```

**What it tests**:

- Calculation formulas (yards per door, cost per door, etc.)
- Skills business logic
- Utility functions
- Data transformation
- Formula evals (TypeScript vs Python)

**Expected**: All unit tests pass

**Critical Tests**:

- `lib/evals/` - Calculation accuracy (< 0.01% tolerance)
- `__tests__/skills/` - Skills logic
- `__tests__/security/` - Security hardening (XSS, file upload, RLS)

---

## Phase 5: End-to-End Testing

**Purpose**: Test complete user workflows exactly as users interact with WasteWise

### 5.1 Internal API Tests

**Test API endpoints with real data**:

```bash
# Health check
curl http://localhost:3000/api/health | jq '.status'
# Expected: {"status":"ok"}

# Create test project (requires auth token)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -d '{"name":"Test Property","units":250,"property_type":"Garden-Style"}' \
  | jq '.id'
# Expected: Project ID returned

# Start analysis job
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -d '{"projectId":"<PROJECT_ID>"}' \
  | jq '.jobId'
# Expected: Job ID returned

# Check job status
curl http://localhost:3000/api/jobs/<JOB_ID> \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  | jq '.status'
# Expected: "pending" | "processing" | "completed" | "failed"
```

**Database Verification**:

```bash
# Verify project created
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT id, name, units FROM projects WHERE name='Test Property';"

# Verify analysis job exists
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT id, status, job_type FROM analysis_jobs WHERE status='completed' LIMIT 1;"

# Verify RLS policies enforced
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM projects WHERE user_id != '<TEST_USER_ID>';"
# Expected: 0 rows (RLS prevents cross-user access)
```

### 5.2 External Integration Tests

**Anthropic AI (if API key configured)**:

```bash
# Test invoice extraction (mock or real)
curl -X POST http://localhost:3000/api/extract-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -F "file=@__tests__/fixtures/sample-invoice.pdf" \
  | jq '.extracted_data'
# Expected: Invoice data extracted

# Test regulatory research (mock or real)
curl -X POST http://localhost:3000/api/regulatory-research \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -d '{"city":"Austin","state":"TX"}' \
  | jq '.ordinances | length'
# Expected: > 0 ordinances found
```

**Supabase Storage**:

```bash
# Upload test file
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -F "file=@__tests__/fixtures/test.pdf" \
  -F "projectId=<PROJECT_ID>" \
  | jq '.file_path'
# Expected: Storage path returned

# Verify file in Supabase Storage
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT name, bucket_id FROM storage.objects WHERE name LIKE '%test.pdf%';"
# Expected: File record exists
```

### 5.3 Complete User Workflows (Most Critical)

**Run Playwright E2E tests**:

```bash
pnpm test:e2e
```

**Workflows Tested**:

1. **User Registration & Login**:
   - Navigate to `/signup`
   - Fill form (email, password)
   - Submit and verify email confirmation
   - Logout
   - Login with credentials
   - Verify dashboard access

2. **Create Project Workflow**:
   - Login as test user
   - Navigate to "New Project"
   - Fill project form (name, units, type, location)
   - Submit
   - Verify project appears in database
   - Verify project listed on dashboard

3. **Upload Files Workflow**:
   - Open project
   - Upload invoice PDF
   - Upload haul log CSV
   - Verify files in Supabase Storage
   - Verify file records in `project_files` table

4. **Run Analysis Workflow** (Integration Test):
   - Open project with files
   - Click "Analyze"
   - Wait for job processing (with progress updates)
   - Verify job status updates in database
   - Verify analysis results saved
   - Check `analysis_jobs` table for completed job

5. **View Results & Download Reports Workflow**:
   - Navigate to results page
   - Verify all result sections visible:
     - Executive Summary
     - Optimization Recommendations
     - Cost Analysis
     - Haul Log Analysis
   - Download Excel report
   - Verify Excel file downloads
   - Verify Excel contains expected sheets
   - Download HTML dashboard
   - Verify HTML file downloads
   - Verify HTML renders correctly

6. **Error Handling Workflow**:
   - Test invalid file upload (wrong type)
   - Test oversized file upload
   - Test analysis with missing data
   - Test rate limiting (rapid requests)
   - Verify error messages user-friendly

**Specific Test Files**:

```bash
# Complete workflow (most important)
playwright test __tests__/e2e/complete-workflow.test.ts

# Individual workflows
playwright test __tests__/e2e/auth-workflow.test.ts
playwright test __tests__/e2e/project-workflow.test.ts
playwright test __tests__/e2e/upload-workflow.test.ts
playwright test __tests__/e2e/analysis-workflow.test.ts
playwright test __tests__/e2e/results-workflow.test.ts
```

### 5.4 Calculation Validation (Critical for WasteWise)

**Run formula evals**:

```bash
pnpm eval
```

**What it validates**:

- TypeScript calculations match Python reference (< 0.01% tolerance)
- Compactor optimization formula accuracy
- Yards per door calculations
- Cost per door calculations
- Conversion rates consistency (14.49, 4.33, 8.5, 6.0)

**Test Scenarios**:

- Compactor data with various tons per haul (< 6.0, 6.0-8.5, > 8.5)
- Dumpster data with various frequencies
- Lease-up properties (> 40% below benchmark)
- Contamination scenarios (> 3% of spend)
- Bulk subscription scenarios (> $500/month)

**Expected**: All evals pass with < 0.01% deviation

### 5.5 Security Validation

**Run security tests**:

```bash
pnpm test __tests__/security/
```

**What it validates**:

- XSS prevention (DOMPurify sanitization)
- File upload security (magic bytes, size limits)
- RLS policies (cross-user access prevention)
- Rate limiting (Upstash Redis)
- Input sanitization (all user inputs)
- Sandbox compliance (AI agent boundaries)

**Expected**: All security tests pass

---

## Success Criteria

### All Phases Must Pass

✅ **Phase 1 (Linting)**: 0 errors, 0 warnings
✅ **Phase 2 (Type Checking)**: 0 type errors
✅ **Phase 3 (Style)**: All files properly formatted
✅ **Phase 4 (Unit Tests)**: All tests pass
✅ **Phase 5 (E2E)**:

- All API tests return expected results
- All database queries verify correct state
- All Playwright workflows complete successfully
- All calculation evals within 0.01% tolerance
- All security tests pass

### Production Readiness Indicators

**If ALL phases pass**:

- ✅ WasteWise is production-ready
- ✅ All critical user workflows tested
- ✅ All calculations verified accurate
- ✅ All security measures validated
- ✅ Safe to deploy

**If ANY phase fails**:

- ❌ Do NOT deploy to production
- ❌ Fix failing tests first
- ❌ Re-run `/validate` until all pass

---

## Troubleshooting

### Common Issues

**Supabase Not Running**:

```bash
# Start Supabase
supabase start

# Verify running
supabase status
```

**Database Migration Issues**:

```bash
# Reset database
supabase db reset

# Run migrations
supabase migration up
```

**E2E Tests Timing Out**:

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds per test
```

**Calculation Evals Failing**:

```bash
# Verify Python reference implementation
cd waste-skills-complete
python -m pytest tests/

# Check conversion rates match
grep -r "14.49\|4.33\|8.5\|6.0" lib/constants/formulas.ts
```

**Rate Limiting Tests Failing**:

```bash
# Verify Upstash Redis configured
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Or use fallback (in-memory) for testing
unset UPSTASH_REDIS_REST_URL
```

---

## Running Specific Phases

```bash
# Just linting
pnpm lint

# Just type checking
pnpm tsc --noEmit

# Just style
pnpm prettier --check .

# Just unit tests
pnpm test:unit

# Just specific E2E workflow
playwright test __tests__/e2e/complete-workflow.test.ts

# Just calculation evals
pnpm eval

# Just security tests
pnpm test __tests__/security/
```

---

## Integration with CI/CD

**GitHub Actions** (planned):

```yaml
# .github/workflows/validate.yml
name: Validate
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: pnpm install
      - run: pnpm validate # Runs all 5 phases
```

**Pre-commit Hook** (planned):

```bash
# .husky/pre-commit
#!/bin/sh
pnpm validate || exit 1
```

---

## Notes

- **First-time setup**: May need to seed test data (`pnpm run seed:test`)
- **API keys**: Some tests require Anthropic API key for full integration testing
- **Duration**: Full validation takes ~3-5 minutes (most time in E2E tests)
- **Parallel execution**: Unit tests and some E2E tests run in parallel for speed
- **Docker**: For CI/CD, consider running in Docker for reproducibility

---

## WasteWise-Specific Validation Details

### Critical Business Rules Validated

✅ **Formulas**: All calculations match Python reference
✅ **Thresholds**: 6.0 tons (optimization), 3% (contamination), $500 (bulk)
✅ **Conversion Rates**: 14.49, 4.33, 8.5 (consistent across codebase)
✅ **Skills**: All 5 skills produce correct output formats
✅ **Reports**: Excel and HTML generation works end-to-end

### Key Workflows Covered

1. ✅ Complete waste analysis (upload → analyze → download)
2. ✅ Compactor optimization recommendation
3. ✅ Invoice data extraction (Claude Vision)
4. ✅ Contract term extraction
5. ✅ Regulatory ordinance research
6. ✅ Report generation (Excel + HTML)

---

**Last Updated**: 2025-11-21
**Maintained By**: Development Team
**Review Frequency**: After major feature additions
