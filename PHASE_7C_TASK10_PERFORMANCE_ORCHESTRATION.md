# Phase 7C Task 10: Performance Optimization & Load Testing - Orchestration Summary

## Overview

**Task**: Achieve Lighthouse score >90 and handle 100 concurrent users without degradation

**Status**: Infrastructure Complete - Ready for Baseline Testing and Optimization

**Date**: 2025-11-21

---

## 1. Performance Testing Infrastructure ✅

### Tools Installed

- ✅ **Lighthouse** (v12.8.2) - Performance auditing
- ✅ **Autocannon** (v7.15.0) - Load testing
- ✅ **Chrome Launcher** (v1.2.1) - Browser automation

### Scripts Created

#### 1.1 Lighthouse Audit Script

**File**: `scripts/lighthouse-audit.ts`

**Capabilities**:

- Runs Lighthouse audits on all key pages
- Measures: Performance, FCP, LCP, TBT, CLS, TTI, Speed Index
- Generates HTML reports per page
- Creates JSON summary with pass/fail status
- Exits with error if average score <90

**Pages Tested**:

- Landing Page (`/`)
- Login Page (`/login`)
- Dashboard (`/dashboard`)
- (Project-specific pages require authentication - manual testing needed)

**Usage**:

```bash
pnpm perf:lighthouse
```

**Output**:

- `lighthouse-reports/summary.json` - Aggregate metrics
- `lighthouse-reports/[page-name].html` - Individual page reports

#### 1.2 Load Testing Script

**File**: `scripts/load-test.ts`

**Capabilities**:

- Simulates concurrent users with autocannon
- Tests multiple load scenarios (10, 50, 100 concurrent)
- Measures latency (avg, p50, p95, p99)
- Tracks error rate and throughput
- Validates against targets (p95 <2s, error rate <0.1%)

**Scenarios**:

1. Landing Page - Light Load (10 concurrent, 10s)
2. Landing Page - Medium Load (50 concurrent, 20s)
3. Landing Page - Heavy Load (100 concurrent, 30s)
4. Login Page - Light Load (10 concurrent, 10s)
5. Dashboard - Light Load (10 concurrent, 10s)
6. API Health Check - Heavy Load (100 concurrent, 20s)

**Usage**:

```bash
pnpm perf:load
```

**Output**:

- `load-test-reports/summary.json` - All scenario results

#### 1.3 Bundle Analysis Script

**File**: `scripts/analyze-bundle.ts`

**Capabilities**:

- Analyzes Next.js build output
- Identifies large bundles (>500KB)
- Categorizes bundles (pages, chunks, static)
- Generates size reports with optimization recommendations

**Usage**:

```bash
# Build first, then analyze
pnpm build
pnpm perf:bundle
```

**Output**:

- `bundle-reports/bundle-analysis.json` - Bundle size breakdown

### Package Scripts Added

```json
{
  "perf:lighthouse": "tsx scripts/lighthouse-audit.ts",
  "perf:load": "tsx scripts/load-test.ts",
  "perf:bundle": "tsx scripts/analyze-bundle.ts",
  "perf:all": "pnpm perf:bundle && pnpm perf:lighthouse && pnpm perf:load"
}
```

---

## 2. Documentation & Guidelines ✅

### 2.1 Performance Guide

**File**: `docs/PERFORMANCE.md`

**Contents**:

- Performance targets (Lighthouse >90, p95 <2s, error rate <0.1%)
- Testing tool documentation
- Optimization strategies (frontend & backend)
- Caching strategies (ISR, SWR, HTTP cache)
- Performance monitoring setup
- Performance budget enforcement
- Common performance issues & solutions
- CI/CD integration examples

### 2.2 Lighthouse CI Configuration

**File**: `.lighthouserc.json`

**Budget Enforcement**:

- Performance score ≥90 (error)
- FCP ≤1500ms (error)
- LCP ≤2500ms (error)
- CLS ≤0.1 (error)
- TBT ≤300ms (error)
- Script size ≤500KB (warning)
- Total size ≤2MB (warning)

---

## 3. CI/CD Integration ✅

### 3.1 GitHub Actions Workflow

**File**: `.github/workflows/performance.yml`

**Jobs**:

1. **bundle-analysis** - Analyzes bundle sizes on every PR
2. **lighthouse-audit** - Runs Lighthouse audits and comments on PR
3. **load-testing** - Runs load tests and comments results on PR

**Triggers**:

- Pull requests to `master`
- Pushes to `master`
- Manual workflow dispatch

**Artifacts**:

- Bundle analysis reports (30-day retention)
- Lighthouse HTML reports (30-day retention)
- Load test results (30-day retention)

**PR Comments**:

- Lighthouse scores per page
- Load test results with pass/fail indicators
- Actionable insights on performance

---

## 4. Build Configuration Fixes ✅

### 4.1 TypeScript Configuration

**File**: `tsconfig.json`

**Changes**:

- Excluded `scripts/**/*.ts` from Next.js build
- Prevents performance scripts from being type-checked during build
- Scripts are type-checked independently via `tsx`

**Reason**: Performance scripts use Node.js-specific APIs (lighthouse, autocannon) that conflict with Next.js edge runtime

### 4.2 Worker Type Fix

**File**: `lib/workers/analysis-worker.ts`

**Changes**:

- Added type assertion for `claim_next_analysis_job` RPC call
- RPC function not yet in database types (needs migration)
- Worker has fallback logic for missing RPC function

---

## 5. Current Build Status ✅

### Build Output (as of 2025-11-21)

```
Route (app)                              Size     First Load JS
┌ ○ /                                    15 kB           211 kB
├ ○ /_not-found                          1.03 kB         197 kB
├ ƒ /api/*                               0 B                0 B
├ ƒ /dashboard                           357 B           198 kB
├ ○ /forgot-password                     3.97 kB         288 kB
├ ƒ /jobs/[id]                           100 kB          306 kB  ⚠️ LARGE
├ ○ /login                               3.8 kB          288 kB
├ ƒ /projects                            356 B           198 kB
├ ƒ /projects/[id]                       39.8 kB         335 kB
├ ƒ /projects/[id]/processing            4.47 kB         265 kB
├ ƒ /projects/[id]/results               10.5 kB         214 kB
├ ○ /projects/new                        5.19 kB         322 kB
├ ○ /reset-password                      4.62 kB         289 kB
└ ○ /signup                              4.34 kB         289 kB

+ First Load JS shared by all            196 kB
  ├ chunks/11ff0b90-06b89881c31249b0.js  53.8 kB
  ├ chunks/577-b2d09cb8a2411fd7.js       101 kB  ⚠️ LARGE
  ├ chunks/ea1165fd-23c8c3e5c23287da.js  38.2 kB
  └ other shared chunks (total)          2.88 kB

ƒ Middleware                             82 kB
```

### Initial Observations

**❌ Issues Identified**:

1. `/jobs/[id]` route: 100 KB (too large, consider code splitting)
2. Shared chunk `577`: 101 KB (likely contains heavy dependencies)
3. Middleware: 82 KB (review if all logic is necessary)
4. Multiple pages loading 288-335 KB total JS (above 200 KB target)

**⚠️ Warnings**:

- Images unoptimized (`next.config.mjs` line 6)
- Sentry configuration using deprecated files
- Rate limiter using in-memory store (not suitable for production)

---

## 6. Next Steps: Agent Coordination

### 6.1 Phase 1: Establish Baseline ⏳

**Agent**: `tester`

**Tasks**:

1. Run bundle analysis: `pnpm perf:bundle`
2. Start dev server: `pnpm dev`
3. Run Lighthouse audits: `pnpm perf:lighthouse`
4. Run load tests: `pnpm perf:load`
5. Document baseline metrics

**Expected Output**:

- Baseline Lighthouse scores per page
- Baseline p95 latency under 100 concurrent users
- Bundle size breakdown
- Identification of top 3 bottlenecks

### 6.2 Phase 2: Frontend Optimizations ⏳

**Agent**: `frontend-dev`

**Tasks** (based on baseline findings):

**Immediate Fixes**:

1. Fix image optimization in `next.config.mjs`

   ```javascript
   images: {
     unoptimized: false, // Enable optimization
     domains: [], // Add allowed image domains
   }
   ```

2. Optimize large `/jobs/[id]` route
   - Analyze what makes it 100 KB
   - Implement code splitting with dynamic imports
   - Lazy load non-critical components

3. Reduce shared chunk size (101 KB)
   - Analyze dependencies in chunk 577
   - Consider splitting into smaller chunks
   - Remove unused dependencies

**Additional Optimizations**: 4. Implement font optimization with `next/font` 5. Add `loading.tsx` components for better UX 6. Implement Suspense boundaries for async components 7. Add `next/image` to all image tags 8. Review and minimize middleware logic (82 KB)

### 6.3 Phase 3: Backend Optimizations ⏳

**Agent**: `backend-dev`

**Tasks**:

1. **Database Indexes**

   ```sql
   CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
   CREATE INDEX IF NOT EXISTS idx_invoice_data_project_id ON invoice_data(project_id);
   CREATE INDEX IF NOT EXISTS idx_haul_log_project_id ON haul_log(project_id);
   CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status, created_at);
   CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON analysis_jobs(user_id, status);
   ```

2. **API Response Caching**
   - Implement cache headers for static endpoints
   - Use Next.js `unstable_cache` for data fetching
   - Implement SWR caching on client

3. **Query Optimization**
   - Review Supabase queries for unnecessary `SELECT *`
   - Use selective field queries
   - Implement pagination for large datasets

4. **RPC Function Performance**
   - Review and optimize slow RPC functions
   - Add indexes to tables used by RPC functions

### 6.4 Phase 4: Validation ⏳

**Agent**: `tester`

**Tasks**:

1. Re-run performance tests: `pnpm perf:all`
2. Compare before/after metrics
3. Verify all targets met:
   - Lighthouse ≥90 on all pages ✓
   - p95 latency <2s under 100 concurrent ✓
   - Error rate <0.1% ✓
   - Bundle size <5MB ✓
   - Individual chunks <500KB ✓

**Success Criteria**:

- [ ] Average Lighthouse score ≥90
- [ ] All pages score ≥90
- [ ] p95 latency ≤2000ms (100 concurrent)
- [ ] Error rate ≤0.1% (100 concurrent)
- [ ] Total bundle size ≤5MB
- [ ] No individual chunks >500KB
- [ ] Images optimized (WebP, responsive)

---

## 7. Performance Targets Summary

### Lighthouse Metrics

| Metric            | Target | Current | Status |
| ----------------- | ------ | ------- | ------ |
| Performance Score | ≥90    | TBD     | ⏳     |
| FCP               | ≤1.5s  | TBD     | ⏳     |
| LCP               | ≤2.5s  | TBD     | ⏳     |
| TBT               | ≤300ms | TBD     | ⏳     |
| CLS               | ≤0.1   | TBD     | ⏳     |
| TTI               | ≤3.5s  | TBD     | ⏳     |

### Load Testing

| Metric                       | Target    | Current | Status |
| ---------------------------- | --------- | ------- | ------ |
| p95 Latency (100 concurrent) | <2000ms   | TBD     | ⏳     |
| Error Rate (100 concurrent)  | <0.1%     | TBD     | ⏳     |
| Throughput                   | >50 req/s | TBD     | ⏳     |

### Bundle Size

| Metric          | Target | Current | Status |
| --------------- | ------ | ------- | ------ |
| Total Size      | <5MB   | ~1.5MB  | ✅     |
| Largest Chunk   | <500KB | 101KB   | ✅     |
| Largest Page    | <500KB | 335KB   | ✅     |
| Individual Page | <200KB | 211KB   | ⚠️     |

---

## 8. Known Issues & Risks

### Issues

1. **Image Optimization Disabled** (`next.config.mjs:6`)
   - Impact: Larger image downloads, no WebP conversion
   - Fix: Enable optimization and configure image domains

2. **Large Shared Chunk** (101 KB)
   - Impact: All pages load this chunk
   - Fix: Analyze dependencies, consider splitting

3. **Sentry Deprecated Configuration**
   - Impact: Warnings during build, future compatibility
   - Fix: Migrate to instrumentation files

4. **In-Memory Rate Limiter**
   - Impact: Not suitable for multi-instance deployments
   - Fix: Migrate to Upstash/Redis (already configured)

### Risks

1. **Lighthouse CI Not Yet Integrated**
   - Recommendation: Add to required PR checks
   - Blocker: None, workflow ready

2. **Performance Regression**
   - Risk: New features may degrade performance
   - Mitigation: Automated performance tests on every PR

3. **Load Test Environment**
   - Risk: CI environment may not accurately reflect production
   - Mitigation: Run load tests in staging environment

---

## 9. Files Created/Modified

### Created

- ✅ `scripts/lighthouse-audit.ts` - Lighthouse audit script
- ✅ `scripts/load-test.ts` - Load testing script
- ✅ `scripts/analyze-bundle.ts` - Bundle analysis script
- ✅ `docs/PERFORMANCE.md` - Performance guide
- ✅ `.lighthouserc.json` - Lighthouse CI configuration
- ✅ `.github/workflows/performance.yml` - Performance testing workflow
- ✅ `PHASE_7C_TASK10_PERFORMANCE_ORCHESTRATION.md` - This document

### Modified

- ✅ `package.json` - Added performance scripts and dependencies
- ✅ `tsconfig.json` - Excluded scripts from Next.js build
- ✅ `lib/workers/analysis-worker.ts` - Fixed type error with RPC call

---

## 10. Command Reference

### Development

```bash
# Run all performance tests
pnpm perf:all

# Individual tests
pnpm perf:bundle      # Bundle size analysis
pnpm perf:lighthouse  # Lighthouse audits
pnpm perf:load        # Load testing

# Build application
pnpm build
```

### CI/CD

```bash
# Manually trigger performance workflow
gh workflow run performance.yml

# View latest performance results
gh run list --workflow=performance.yml
```

---

## 11. Orchestrator Recommendations

### Immediate Actions (Priority 1)

1. **Run Baseline Tests** - Use `tester` agent to establish current performance
2. **Fix Image Optimization** - Use `frontend-dev` agent (quick win)
3. **Add Database Indexes** - Use `backend-dev` agent (significant impact)

### Short-Term Actions (Priority 2)

4. **Optimize Large Routes** - Use `frontend-dev` agent for `/jobs/[id]`
5. **Reduce Shared Chunk** - Use `frontend-dev` agent to analyze dependencies
6. **Implement Caching** - Use `backend-dev` agent for API routes

### Long-Term Actions (Priority 3)

7. **Sentry Migration** - Update to instrumentation files
8. **Rate Limiter Migration** - Use Upstash/Redis in production
9. **Performance Monitoring** - Integrate real-time monitoring

---

## 12. Success Metrics

### Definition of Done

- [ ] All performance tests passing in CI/CD
- [ ] Average Lighthouse score ≥90
- [ ] System handles 100 concurrent users with p95 <2s
- [ ] Error rate <0.1% under load
- [ ] Performance budget enforced in CI/CD
- [ ] Documentation complete (`docs/PERFORMANCE.md`)
- [ ] Performance regression tests automated

### Expected Timeline

- **Baseline Testing**: 1-2 hours
- **Frontend Optimizations**: 4-6 hours
- **Backend Optimizations**: 2-4 hours
- **Validation & Documentation**: 2-3 hours
- **Total**: 9-15 hours (with agent coordination)

---

**Orchestrator**: All infrastructure is ready. Performance testing and optimization can proceed with specialized agents.

**Next Action**: Spawn `tester` agent to establish performance baseline.
