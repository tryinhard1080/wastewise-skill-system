# GitHub Issues to Create

This file contains all remaining bugs found in the code review (2025-11-18).
**4 Critical bugs have been fixed** in this PR. The remaining 17 bugs should be tracked as GitHub issues.

---

## 🔥 HIGH PRIORITY (6 issues)

### SECURITY-3: Signed URLs Expire After 1 Year (Excessive)
**Labels**: `security`, `high-priority`, `phase-4`
**Milestone**: Phase 4 - Production Readiness

**Description**:
Report download URLs are valid for 365 days, creating a security risk if URLs are leaked.

**Location**: `lib/reports/storage.ts:88`

**Current Code**:
```typescript
.createSignedUrl(storagePath, 31536000) // 365 days in seconds
```

**Impact**:
If URL is leaked (email forwarding, Slack history, logs), unauthorized access remains possible for a year.

**Fix**:
Reduce expiry to 7-30 days:
```typescript
.createSignedUrl(storagePath, 604800) // 7 days (recommended)
```

**Priority**: High
**Estimated Effort**: 15 minutes

---

### PERF-3: Report Generation Loads Everything Into Memory
**Labels**: `performance`, `high-priority`, `phase-4`
**Milestone**: Phase 4 - Production Readiness

**Description**:
Excel workbook is generated entirely in memory, which can cause OOM crashes for large properties.

**Location**: `lib/reports/excel-generator.ts:151`

**Current Code**:
```typescript
const buffer = await workbook.xlsx.writeBuffer()  // Entire file in RAM
```

**Impact**:
- Property with 10K invoices → 50MB+ workbook → Serverless function OOM crash
- No streaming → High latency for large reports

**Fix**:
Implement streaming to storage:
```typescript
const stream = workbook.xlsx.createWriteStream()
// Pipe to Supabase Storage upload stream
```

**Priority**: High
**Estimated Effort**: 2-3 hours

---

### PERF-4: Database Query Fetches All Records Instead of Aggregation
**Labels**: `performance`, `high-priority`, `database`
**Milestone**: Phase 3 - Validation

**Description**:
Average tonnage calculation fetches ALL records, then calculates average in application code instead of using database aggregation.

**Location**: `lib/db/haul-log-repository.ts:308-332`

**Current Code**:
```typescript
const { data, error } = await this.supabase
  .from('haul_log')
  .select('tonnage')  // Fetches ALL rows
  .eq('project_id', projectId)

const total = data.reduce((sum, haul) => sum + haul.tonnage, 0)
const average = total / data.length
```

**Impact**:
- 10K haul records → 10K rows transferred over network
- O(n) memory usage when O(1) is possible
- Slow query performance

**Fix**:
Use PostgreSQL aggregation:
```typescript
const { data, error } = await this.supabase
  .from('haul_log')
  .select('tonnage.avg()')
  .eq('project_id', projectId)
  .single()

return { average: data?.avg || 0, error: null }
```

**Priority**: High
**Estimated Effort**: 1 hour (search for other similar patterns)

---

### CODE-1: Inconsistent Error Handling Patterns
**Labels**: `code-quality`, `high-priority`, `refactor`
**Milestone**: Phase 2 - Implementation

**Description**:
Some functions return `{ data, error }`, others throw exceptions, creating unpredictable behavior.

**Locations**:
- `lib/db/haul-log-repository.ts:49` (returns error)
- `lib/skills/executor.ts:68` (throws error)

**Examples**:
```typescript
// Pattern 1: Repository
async create(haul) {
  return { data: null, error: error.message }
}

// Pattern 2: Executor
if (projectError || !project) {
  throw new NotFoundError('Project', projectId)
}
```

**Impact**:
- Developers don't know which pattern to expect
- Uncaught exceptions crash requests
- Inconsistent error handling in clients

**Fix**:
Standardize on Result type pattern:
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

async function create(): Promise<Result<HaulLogRow>> {
  // ...
}
```

**Priority**: High
**Estimated Effort**: 4-6 hours (codebase-wide refactor)

---

### CODE-2: Type Safety Issues with "as any" Assertions
**Labels**: `code-quality`, `high-priority`, `type-safety`
**Milestone**: Phase 2 - Implementation

**Description**:
Multiple locations use `as any` type assertions, bypassing TypeScript's type checking and creating runtime error risks.

**Locations**:
- `lib/skills/skills/wastewise-analytics.ts:399`
- `lib/db/invoice-repository.ts:278`
- `lib/workers/job-processor.ts:184`

**Examples**:
```typescript
const charges = invoice.charges as any  // Lost type safety
const contamination = charges?.contamination || 0

charges: updates.charges as any  // JSONB loses type info

result: result.data as any  // No validation
```

**Impact**:
- Runtime errors when JSONB structure changes
- Null pointer exceptions
- Hard to refactor safely

**Fix**:
Define proper types for JSONB columns:
```typescript
interface InvoiceCharges {
  disposal?: number
  pickup_fees?: number
  rental?: number
  contamination?: number
  bulk_service?: number
  other?: number
}

const charges: InvoiceCharges = invoice.charges
const contamination = charges.contamination ?? 0
```

**Priority**: High
**Estimated Effort**: 2-3 hours

---

### PERF-5: Missing Composite Index on Hot Query Path
**Labels**: `performance`, `high-priority`, `database`
**Status**: ✅ **FIXED** in migration `20251118220002_add_performance_indexes.sql`

**Description**:
Worker queries `analysis_jobs` by `status = 'pending'` frequently, but only has single-column index.

**Location**: `supabase/migrations/20251114000002_analysis_jobs.sql:66-71`

**Impact**: Sequential scan on large tables → slow job pickup

**Fix**: Already applied in this PR

---

## ⚠️ MEDIUM PRIORITY (8 issues)

### PERF-6: Worker Polls Continuously Even When Idle
**Labels**: `performance`, `medium-priority`, `worker`
**Status**: ✅ **FIXED** in `lib/workers/analysis-worker.ts`

**Description**:
Worker polls database every 2 seconds regardless of job presence.

**Impact**:
- Unnecessary database load (1,800 queries/hour per worker)
- Wasted CPU cycles

**Fix**: Already applied exponential backoff in this PR

---

### PERF-7: Batch Insert Fallback Creates N+1 Query Problem
**Labels**: `performance`, `medium-priority`, `database`
**Milestone**: Phase 3 - Validation

**Description**:
If bulk insert fails, code falls back to individual inserts for entire batch.

**Location**: `lib/db/invoice-repository.ts:158-173`

**Current Code**:
```typescript
if (error) {
  for (const invoice of chunk) {  // N queries instead of 1
    await this.create(invoice)
  }
}
```

**Impact**: 1,000 invoices with 1 duplicate → 1,000 individual INSERT statements

**Fix**:
```typescript
.insert(inserts)
.onConflict('invoice_number, project_id')
.ignore()
```

**Priority**: Medium
**Estimated Effort**: 1 hour

---

### SECURITY-4: Rate Limiter State Lost on Server Restart
**Labels**: `security`, `medium-priority`, `phase-4`
**Status**: ✅ **DOCUMENTED** with migration path in `lib/api/rate-limit.ts`

**Description**:
Cleanup interval clears expired entries but state is lost on process restart.

**Impact**: Attacker can bypass rate limits by triggering server restarts (if possible).

**Fix**: Documented migration path to Upstash Redis before Phase 4

---

### SECURITY-5: Missing Input Sanitization on Filenames
**Labels**: `security`, `medium-priority`, `validation`
**Milestone**: Phase 3 - Validation

**Description**:
Property name is used in filename with minimal sanitization.

**Location**: `lib/reports/excel-generator.ts:189-192`

**Current Code**:
```typescript
const propertyName = project.property_name
  .replace(/[^a-zA-Z0-9]/g, '_')
  .replace(/_+/g, '_')
  .substring(0, 50)
```

**Impact**: Potential path traversal if regex doesn't catch all cases

**Fix**:
```typescript
import crypto from 'crypto'
const hash = crypto.createHash('md5').update(project.id).digest('hex').slice(0, 8)
const filename = `WasteWise_${hash}_${date}.xlsx`
```

**Priority**: Medium
**Estimated Effort**: 30 minutes

---

### CODE-3: Hardcoded Magic Numbers Throughout Codebase
**Labels**: `code-quality`, `medium-priority`, `refactor`
**Milestone**: Phase 2 - Implementation

**Description**:
Magic numbers are hardcoded throughout the codebase instead of using named constants.

**Locations**:
- `lib/workers/analysis-worker.ts:38` (2000)
- `lib/api/rate-limit.ts:114` (60 * 1000)
- `lib/skills/skills/compactor-optimization.ts:199` (365)

**Examples**:
```typescript
this.pollInterval = config.pollInterval || 2000  // What is 2000?
windowMs: 60 * 1000  // 60 what?
const currentAnnualHauls = Math.round((totalHauls / haulLog.length) * 365)  // Why 365?
```

**Fix**:
```typescript
export const WORKER_POLL_INTERVAL_MS = 2000
export const RATE_LIMIT_WINDOW_MS = 60 * 1000
export const DAYS_PER_YEAR = 365
```

**Priority**: Medium
**Estimated Effort**: 2 hours

---

### CODE-4: Missing Null Checks on Nested Properties
**Labels**: `code-quality`, `medium-priority`, `bug`
**Milestone**: Phase 2 - Implementation

**Description**:
Direct property access without null checking, using `!` assertions incorrectly.

**Location**: `app/projects/[id]/results/page.tsx:61`

**Current Code**:
```typescript
{new Date(job.completed_at!).toLocaleDateString(...)}
// What if completed_at is null despite "!" assertion?
```

**Impact**: Runtime crashes when job is in unexpected state

**Fix**:
```typescript
{job.completed_at
  ? new Date(job.completed_at).toLocaleDateString(...)
  : 'Processing...'}
```

**Priority**: Medium
**Estimated Effort**: 1 hour (search for all `!` assertions)

---

### CODE-5: Console.log Instead of Logger
**Labels**: `code-quality`, `low-priority`, `observability`
**Milestone**: Phase 4 - Production Readiness

**Description**:
Using console.error instead of structured logger.

**Location**: `app/api/analyze/route.ts:117`

**Current Code**:
```typescript
console.error('Error creating analysis job:', error)
```

**Fix**:
```typescript
logger.error('Error creating analysis job', error as Error)
```

**Priority**: Medium
**Estimated Effort**: 1 hour (find all console.* calls)

---

### CODE-6: Inconsistent Async Patterns
**Labels**: `code-quality`, `low-priority`, `refactor`
**Milestone**: Phase 3 - Validation

**Description**:
Mix of async/await and Promise.then/catch patterns.

**Impact**: Harder to read, maintain consistency

**Fix**: Standardize on async/await everywhere

**Priority**: Low
**Estimated Effort**: 2 hours

---

### CODE-7: Duplicate Formula Validation Logic
**Labels**: `code-quality`, `low-priority`, `refactor`
**Milestone**: Phase 3 - Validation

**Description**:
Each skill validates formulas independently instead of centralized validation.

**Location**: `lib/skills/skills/compactor-optimization.ts:99-100`

**Current Code**:
```typescript
// Each skill does this:
this.validateFormulas(context)
```

**Fix**: Move to BaseSkill.execute() before calling executeInternal()

**Priority**: Low
**Estimated Effort**: 1 hour

---

## 📊 Summary

| Priority | Count | Status |
|----------|-------|--------|
| **Critical** | 4 | ✅ All fixed in this PR |
| **High** | 6 | 1 fixed, 5 need issues |
| **Medium** | 8 | 2 fixed/documented, 6 need issues |
| **Low** | 3 | All need issues |
| **TOTAL** | **21** | **4 fixed, 17 to track** |

---

## 🎯 Recommended Action Plan

### Phase 2 (Current Sprint)
- [ ] CODE-1: Standardize error handling
- [ ] CODE-2: Fix type safety issues
- [ ] CODE-3: Extract magic numbers to constants
- [ ] CODE-4: Add null checks

### Phase 3 (Next Sprint)
- [ ] PERF-4: Use database aggregation
- [ ] PERF-7: Fix batch insert fallback
- [ ] SECURITY-5: Improve filename sanitization

### Phase 4 (Production Readiness)
- [ ] SECURITY-3: Reduce signed URL expiry
- [ ] PERF-3: Implement report streaming
- [ ] CODE-5: Replace console with logger
- [ ] CODE-6: Standardize async patterns
- [ ] CODE-7: Centralize formula validation

---

**Created**: 2025-11-18
**By**: Code Review Analysis
**PR**: claude/code-review-019tyQjPbvTraNjHou31MVXT
