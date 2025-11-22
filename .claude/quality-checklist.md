# Pre-Commit Quality Checklist

## 🚨 CRITICAL: Review Before Every Commit

This checklist prevents the most common issues that cause runtime failures. **Every item must pass before committing.**

---

## 1. Database Schema Validation

**Problem**: Form values don't match database CHECK constraints → 100% failure rate

**Checklist**:
- [ ] Read migration files in `supabase/migrations/` for exact constraints
- [ ] Verify form/API values match CHECK constraint options (case-sensitive!)
- [ ] Test INSERT/UPDATE queries against actual schema
- [ ] Check enum values match exactly (e.g., 'Garden-Style' not 'multifamily')

**Example**:
```typescript
// ❌ WRONG - Doesn't match DB constraint
property_type: 'multifamily'  // DB expects 'Garden-Style'

// ✅ CORRECT - Read supabase/migrations/*.sql first
property_type: 'Garden-Style'  // Matches CHECK constraint exactly
```

---

## 2. API Contract Validation

**Problem**: Component expects snake_case but API returns camelCase → SWR breaks

**Checklist**:
- [ ] API response shape matches component interface (snake_case vs camelCase)
- [ ] TypeScript interfaces align with actual API responses
- [ ] Test SWR/fetch integration end-to-end
- [ ] Verify nested objects match (e.g., `progress.percent` not `progress_percent`)

**Example**:
```typescript
// ❌ WRONG - Interface doesn't match API
interface Job {
  job_type: string  // API returns jobType (camelCase)
  progress_percent: number  // API returns progress.percent (nested)
}

// ✅ CORRECT - Matches API response exactly
interface Job {
  jobType: string
  progress: {
    percent: number
  }
}
```

---

## 3. Type Safety

**Problem**: `ignoreBuildErrors: true` hides all type mismatches → runtime errors

**Checklist**:
- [ ] NO `ignoreBuildErrors` or `ignoreESLintErrors` in `next.config.mjs`
- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] No `any` types without explicit justification
- [ ] Import shared types (don't redefine per component)

**Commands**:
```bash
# Must pass before committing
pnpm tsc --noEmit
pnpm lint
```

---

## 4. Import Canonical Types & Constants

**Problem**: Redefining types causes mismatches; hardcoding constants causes drift

**Checklist**:
- [ ] Use types from `lib/skills/types.ts` (not redefined interfaces)
- [ ] Use constants from `lib/constants/formulas.ts` (not hardcoded values)
- [ ] Skills return types match skill registry
- [ ] No duplicate type definitions across files

**Example**:
```typescript
// ❌ WRONG - Duplicate type definition
interface CompactorResult {
  dsqMonitorCost?: { install: number }  // Doesn't exist in skill
}

// ✅ CORRECT - Import canonical type
import type { CompactorOptimizationResult } from '@/lib/skills/types'
import { DSQ_MONITOR_INSTALL } from '@/lib/constants/formulas'

// Use imported constant
const cost = DSQ_MONITOR_INSTALL
```

---

## 5. Environment Variables

**Problem**: Inconsistent naming causes "missing env var" errors

**Checklist**:
- [ ] Consistent naming across all files
- [ ] Documented in `.env.template`
- [ ] No secrets in code or git history
- [ ] Verify exact name matches across:
  - `lib/supabase/server.ts`
  - `scripts/*.ts`
  - `.env.template`

**Example**:
```bash
# ❌ WRONG - Inconsistent names
SUPABASE_SERVICE_KEY=...          # .env.template
SUPABASE_SERVICE_ROLE_KEY=...     # lib/supabase/server.ts

# ✅ CORRECT - Same name everywhere
SUPABASE_SERVICE_ROLE_KEY=...     # All files
```

---

## 6. Agent Usage (REQUIRED for All Development)

**Problem**: Direct development skips validation → schema/type mismatches

**Checklist**:
- [ ] Frontend Agent validates all UI components
- [ ] Backend Agent validates all API routes
- [ ] Code Analyzer Agent reviews before commit
- [ ] Testing Agent validates integration points

**When to Use Which Agent**:
- **UI changes** → Frontend Agent
- **API changes** → Backend Agent
- **Pre-commit** → Code Analyzer Agent (ALWAYS)
- **Complex tasks** → Planner Agent first

**Never**:
- ❌ Make changes directly without agents
- ❌ Skip Code Analyzer before commit
- ❌ Commit without agent validation

---

## 7. Data Transformation

**Problem**: Passing raw DB data to components expecting API format

**Checklist**:
- [ ] Transform snake_case DB fields to camelCase API format
- [ ] Nest fields as expected (e.g., `progress.percent` not flat `progress_percent`)
- [ ] Add helper transformation functions if needed
- [ ] Test with actual data from database

**Example**:
```typescript
// ❌ WRONG - Passing raw DB data
<JobsList jobs={project.analysis_jobs} />

// ✅ CORRECT - Transform before passing
function transformJobs(jobs: any[]) {
  return jobs.map(job => ({
    jobType: job.job_type,
    progress: {
      percent: job.progress_percent
    }
  }))
}

<JobsList jobs={transformJobs(project.analysis_jobs)} />
```

---

## 8. Authentication Guards

**Problem**: Pages accessible without auth → undefined user errors

**Checklist**:
- [ ] All protected pages check `if (!user) redirect('/login')`
- [ ] Auth check before database queries using `user.id`
- [ ] No `user?.id!` without null check first
- [ ] Middleware configured for auth routes

**Example**:
```typescript
// ❌ WRONG - No auth check
const { data: { user } } = await supabase.auth.getUser()
const projects = await supabase.from('projects').eq('user_id', user?.id!)

// ✅ CORRECT - Check first
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const projects = await supabase.from('projects').eq('user_id', user.id)
```

---

## 9. Sandbox Compliance (NEW - Nov 2025)

**Problem**: AI agents accessing sensitive files or making unauthorized API calls

**Checklist**:
- [ ] Sandbox enabled before launching agents (`/sandbox` command)
- [ ] No attempts to access .env, credentials, or secrets
- [ ] All network requests to approved domains only
- [ ] Boundary violations logged via sandbox-logger.ts
- [ ] Appropriate sandbox profile selected for task (dev/testing/docs/readonly)

**Commands**:
```bash
# Enable sandbox
/sandbox

# Verify sandbox configuration
cat .claude/sandbox.json

# Run sandbox compliance tests
pnpm test __tests__/security/sandbox-compliance.test.ts
```

**Verification**:
```typescript
// Check for violations
import { getSandboxStats, detectSuspiciousPatterns } from '@/lib/observability/sandbox-logger'

const stats = getSandboxStats()
const patterns = detectSuspiciousPatterns()

if (patterns.suspicious) {
  console.error('Suspicious sandbox activity:', patterns.reasons)
  console.info('Recommendations:', patterns.recommendations)
}
```

**When to Use Which Profile**:
- **wastewise-dev**: Frontend/backend development (default)
- **wastewise-testing**: Writing tests, running test suites
- **wastewise-docs**: Documentation updates only
- **wastewise-readonly**: Code analysis, security audits

---

## 10. Validation Command (RECOMMENDED)

**Problem**: Manually running multiple validation steps is error-prone and inconsistent

**Philosophy**: "If `/validate` passes, WasteWise is production-ready"

**The /validate Command**:
```bash
# Run all 5 validation phases (recommended before PR)
pnpm validate

# Skip E2E tests for faster pre-commit checks
pnpm validate:skip-e2e

# Run specific phase only
pnpm validate:phase=1  # Linting only
pnpm validate:phase=2  # Type checking only
pnpm validate:phase=3  # Style checking only
pnpm validate:phase=4  # Unit tests only
pnpm validate:phase=5  # E2E tests only
```

**What It Validates (5 Phases)**:
1. **Linting**: Code quality, common errors (`pnpm lint`)
2. **Type Checking**: Type safety (`pnpm tsc --noEmit`)
3. **Style Checking**: Code formatting (`pnpm prettier --check .`)
4. **Unit Testing**: Business logic, calculations (`pnpm test:unit`)
5. **E2E Testing**: Complete user workflows (`pnpm test:e2e`)

**When to Use**:
- ✅ **Before every PR** → Run full `pnpm validate`
- ✅ **Before every commit** → Run `pnpm validate:skip-e2e` (faster)
- ✅ **After major changes** → Run full `pnpm validate`
- ✅ **In CI/CD pipeline** → Run full `pnpm validate`

**When to Use Individual Phases**:
- Fixing specific issues: `pnpm validate:phase=1` (linting)
- Quick type check: `pnpm validate:phase=2` (types)
- Formula changes: `pnpm eval` + `pnpm validate:phase=4` (unit tests)

**Success Criteria**:
- All 5 phases must pass with 0 errors
- Calculation evals within 0.01% tolerance
- Security tests pass
- No console errors

---

## Pre-Commit Command

**Quick Pre-Commit (Recommended)**:
```bash
# Fastest validation (skips E2E tests)
pnpm validate:skip-e2e
```

**Traditional Approach** (if not using /validate):
```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Lint
pnpm lint

# 3. Unit tests
pnpm test:unit

# 4. Review checklist above
```

**All must pass with 0 errors.**

---

## Common Pitfalls Summary

| Issue | Symptom | Fix |
|-------|---------|-----|
| Schema mismatch | INSERT fails | Read migrations first |
| API shape mismatch | SWR undefined | Match API response exactly |
| Type errors hidden | Runtime crashes | Remove `ignoreBuildErrors` |
| Hardcoded values | Calculation drift | Import from `formulas.ts` |
| Missing auth guard | undefined user | Check user before queries |
| No agent validation | All of the above | **Use agents for everything** |
| No sandbox | Agent accesses secrets | Enable `/sandbox` command |
| Manual validation | Inconsistent checks | Run `pnpm validate:skip-e2e` |

---

**Last Updated**: 2025-11-22 (Added /validate command integration)
**Purpose**: Prevent runtime failures by catching issues at dev time
