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

## Pre-Commit Command

Run this before every commit:

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

---

**Last Updated**: 2025-11-14
**Purpose**: Prevent runtime failures by catching issues at dev time
