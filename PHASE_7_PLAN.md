# Phase 7 Plan: Integration Testing & Production Deployment

**Date**: 2025-11-17
**Status**: Planning
**Previous Phase**: Phase 6 (Complete Analytics Integration) - COMPLETE ✅

---

## Overview

Phase 6 completed all code implementation for the complete analytics workflow. Phase 7 focuses on **validating the entire system** through integration testing and preparing for production deployment.

**Goals**:
1. ✅ Verify end-to-end workflow with real data
2. ✅ Test all API endpoints and worker functionality
3. ✅ Validate error handling and edge cases
4. ✅ Document test results and deployment readiness
5. ✅ Prepare production deployment checklist

---

## Prerequisites

### Required Environment
- ✅ Supabase database with all tables and RPC functions
- ✅ Environment variables configured (.env.local)
- ✅ Background worker running (`pnpm worker`)
- ✅ Development server running (`pnpm dev`)

### Test Data Requirements
- **Project**: At least 1 complete project with:
  - Property details (name, type, units, equipment)
  - Invoice data (minimum 3 months)
  - Haul log data (for compactor properties)
  - Optional: Contract terms

---

## Task 1: Worker System Integration Tests

**Goal**: Verify background worker picks up jobs and processes them correctly

### Test Cases

#### 1.1: Worker Startup
- [ ] Worker starts with valid environment variables
- [ ] Worker exits with clear error if `NEXT_PUBLIC_SUPABASE_URL` missing
- [ ] Worker exits with clear error if `SUPABASE_SERVICE_KEY` missing
- [ ] Worker accepts custom poll interval (`--poll=5000`)
- [ ] Worker accepts custom concurrency (`--concurrent=2`)

**Expected Output**:
```
╔═══════════════════════════════════════════════════════╗
║   WasteWise Analytics Worker                          ║
║   Analysis Job Processor                              ║
╚═══════════════════════════════════════════════════════╝

Configuration:
  Poll Interval:     2000ms
  Max Concurrent:    1 job(s)
  Database:          https://xxx.supabase.co

✓ Environment validated
✓ Database connection verified

Worker started. Press Ctrl+C to stop.
Polling for pending jobs every 2 seconds...
```

#### 1.2: Job Polling
- [ ] Worker queries database every 2 seconds (poll interval)
- [ ] Worker picks up jobs with `status='pending'`
- [ ] Worker processes oldest jobs first (`created_at ASC`)
- [ ] Worker logs "No pending jobs" when queue is empty

**Test Method**: Monitor worker console output while creating test jobs

#### 1.3: Job Processing
- [ ] Job status changes to `'processing'` when worker starts
- [ ] `started_at` timestamp is set
- [ ] Progress updates appear in database during execution
- [ ] Job status changes to `'completed'` on success
- [ ] `completed_at` timestamp is set
- [ ] `result_data` is saved to database
- [ ] AI usage metrics are saved

**Test Method**:
```sql
-- Monitor job progression
SELECT id, status, progress_percent, current_step, started_at, completed_at
FROM analysis_jobs
WHERE id = 'YOUR_JOB_ID'
ORDER BY updated_at DESC;
```

#### 1.4: Error Handling
- [ ] Job marked as `'failed'` if skill execution throws error
- [ ] Error message saved to `error_message` field
- [ ] Error code saved to `error_code` field
- [ ] Worker continues processing other jobs after failure
- [ ] Failed jobs retry up to 3 times (if retry logic implemented)

**Test Method**: Create intentionally failing job (e.g., invalid project ID)

#### 1.5: Graceful Shutdown
- [ ] Worker stops cleanly on `Ctrl+C` (SIGINT)
- [ ] Worker stops cleanly on `SIGTERM`
- [ ] In-progress jobs are not abandoned (marked as failed or retried)
- [ ] Database connections are closed properly

**Test Method**: Start job, press Ctrl+C during processing, verify job state

---

## Task 2: API Endpoint Integration Tests

**Goal**: Verify all API routes work correctly with authentication and error handling

### 2.1: Start Analysis Endpoint

**POST /api/projects/[id]/analyze**

#### Success Cases
- [ ] Returns `{ jobId, status, message }` when analysis starts
- [ ] Creates job record with `status='pending'`
- [ ] Sets `total_steps=5` and `progress_percent=0`
- [ ] Validates user owns the project (RLS enforcement)

**Test Method**:
```bash
curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Error Cases
- [ ] Returns `401 Unauthorized` if not authenticated
- [ ] Returns `404 Not Found` if project doesn't exist
- [ ] Returns `404 Not Found` if user doesn't own project
- [ ] Returns `400 Bad Request` if no invoice data exists
- [ ] Returns `409 Conflict` if job already pending/processing

**Test Method**: Test each error case systematically

---

### 2.2: Job Status Endpoint

**GET /api/jobs/[id]**

#### Success Cases
- [ ] Returns job details for pending job
- [ ] Returns real-time progress for processing job
- [ ] Returns complete result for completed job
- [ ] Returns error details for failed job
- [ ] Progress updates reflect database changes (poll every 2s)

**Response Structure Validation**:
```typescript
{
  id: string
  projectId: string
  jobType: 'complete_analysis'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: {
    percent: number
    currentStep: string | null
    stepsCompleted: number
    totalSteps: number
  }
  timing: {
    startedAt: string | null
    completedAt: string | null
    durationSeconds: number | null
  }
  result: WasteWiseAnalyticsCompleteResult | null
  error: { message: string, code: string } | null
  aiUsage: {
    requests: number
    tokensInput: number
    tokensOutput: number
    costUsd: number
  }
}
```

#### Error Cases
- [ ] Returns `401 Unauthorized` if not authenticated
- [ ] Returns `404 Not Found` if job doesn't exist
- [ ] Returns `404 Not Found` if user doesn't own job (RLS)

---

### 2.3: Job Cancellation Endpoint

**DELETE /api/jobs/[id]**

#### Success Cases
- [ ] Cancels job with `status='pending'`
- [ ] Cancels job with `status='processing'`
- [ ] Sets `status='cancelled'` and `cancelled_at` timestamp

#### Error Cases
- [ ] Returns `400 Bad Request` if job already completed
- [ ] Returns `400 Bad Request` if job already failed
- [ ] Returns `400 Bad Request` if job already cancelled
- [ ] Returns `401 Unauthorized` if not authenticated
- [ ] Returns `404 Not Found` if job doesn't exist

---

## Task 3: Frontend End-to-End Tests

**Goal**: Verify complete user workflow from start to finish

### 3.1: Complete Analysis Workflow

**Steps**:
1. Navigate to project detail page `/projects/[id]`
2. Click "Start Analysis" button
3. Verify redirect to processing page (or loading state)
4. Poll for job status updates
5. Verify progress bar updates (0% → 25% → 50% → 75% → 100%)
6. Verify current step text updates
7. Verify redirect to results page when completed
8. Verify results page displays correctly

**Expected Timeline**: 2-5 minutes (depending on project size)

---

### 3.2: Results Page Validation

**URL**: `/projects/[id]/results`

#### Data Display Tests
- [ ] Property header shows project name
- [ ] Analysis completion date displays correctly
- [ ] Summary section shows 4 metric cards:
  - Total Savings Potential (formatted currency)
  - Current Monthly Cost (formatted currency)
  - Optimized Monthly Cost (formatted currency)
  - Savings Percentage (formatted percent)
- [ ] Date range displays correctly (start - end)
- [ ] Total hauls displays correctly (or hidden if 0)
- [ ] Recommendations list displays all recommendations
- [ ] Recommendations sorted by priority (1, 2, 3, 4, 5)
- [ ] Priority badges color-coded correctly:
  - Priority 1 = Red/destructive
  - Priority 2 = Default
  - Priority 3 = Secondary
  - Priority 4-5 = Outline
- [ ] Confidence badges show when present (HIGH/MEDIUM/LOW)
- [ ] Empty state shows if no recommendations

#### Download Tests
- [ ] "Download Excel Report" button is enabled
- [ ] Click downloads `.xlsx` file
- [ ] Downloaded file opens in Excel/Numbers
- [ ] "View HTML Dashboard" button is enabled
- [ ] Click opens new tab with HTML dashboard
- [ ] HTML dashboard is interactive (filters, charts work)

#### Responsive Design Tests
- [ ] Mobile (375px): Cards stack vertically, buttons stack
- [ ] Tablet (768px): 2 columns for cards
- [ ] Desktop (1024px): 4 columns for cards
- [ ] Large desktop (1440px): Layout scales correctly

#### Dark Mode Tests
- [ ] Toggle dark mode: Colors invert correctly
- [ ] Cards have proper dark backgrounds
- [ ] Text has proper dark mode contrast
- [ ] Icons maintain color coding

---

### 3.3: Error Handling Tests

#### No Completed Analysis
- [ ] Visiting `/projects/[id]/results` without completed job redirects to `/projects/[id]`
- [ ] User sees message: "No analysis results available yet"

#### Report Generation Failures
- [ ] If reports fail to generate, warning message appears:
  - "Reports Not Available"
  - "Report generation failed during analysis..."
  - Download buttons are disabled
- [ ] Analysis results still display correctly
- [ ] Recommendations still visible

#### Network Errors
- [ ] Lost connection during analysis shows error
- [ ] User can retry analysis
- [ ] No duplicate jobs created

---

## Task 4: Performance & Load Testing

### 4.1: Single Job Performance

**Metrics to Track**:
- [ ] Time to complete analysis: _____ seconds (target: <180s)
- [ ] Database queries: _____ queries (check N+1 issues)
- [ ] AI API calls: _____ requests (verify not excessive)
- [ ] Memory usage: _____ MB peak
- [ ] Report file sizes:
  - Excel: _____ KB (target: <500KB)
  - HTML: _____ KB (target: <200KB)

### 4.2: Concurrent Jobs

**Test**: Start 3 analysis jobs simultaneously

- [ ] All jobs complete successfully
- [ ] No race conditions or deadlocks
- [ ] Jobs process sequentially (max concurrent = 1)
- [ ] Database handles concurrent writes
- [ ] No file upload conflicts

### 4.3: Large Project Testing

**Test**: Analyze project with:
- 500+ invoices
- 1,000+ haul log entries
- 3+ years of data

- [ ] Analysis completes without timeout
- [ ] Excel workbook remains under 5MB
- [ ] HTML dashboard loads in <3 seconds
- [ ] No memory issues during processing

---

## Task 5: Database Validation

### 5.1: RPC Functions

**Verify all RPC functions work correctly**:

```sql
-- Test start_analysis_job
SELECT start_analysis_job('YOUR_JOB_ID'::uuid);
-- Expected: status='processing', started_at set

-- Test update_job_progress
SELECT update_job_progress(
  'YOUR_JOB_ID'::uuid,
  50,
  'Running optimization analyses',
  2
);
-- Expected: progress_percent=50, current_step updated

-- Test complete_analysis_job
SELECT complete_analysis_job(
  'YOUR_JOB_ID'::uuid,
  '{"summary": {...}}'::jsonb,
  '{"requests": 5}'::jsonb
);
-- Expected: status='completed', result_data saved

-- Test fail_analysis_job
SELECT fail_analysis_job(
  'YOUR_JOB_ID'::uuid,
  'Test error',
  'TEST_ERROR'
);
-- Expected: status='failed' (or pending if retries remain)
```

### 5.2: Row Level Security

- [ ] Users can only see their own projects
- [ ] Users can only see their own analysis jobs
- [ ] Users can only start analysis on their own projects
- [ ] Users can only cancel their own jobs
- [ ] Service role can access all jobs (worker)

**Test Method**: Create 2 users, verify isolation

---

## Task 6: Security Validation

### 6.1: Authentication
- [ ] All API routes require authentication
- [ ] Expired tokens are rejected
- [ ] Invalid tokens return 401
- [ ] Missing auth header returns 401

### 6.2: Authorization
- [ ] Users cannot access other users' projects
- [ ] Users cannot access other users' jobs
- [ ] Users cannot start analysis on projects they don't own

### 6.3: Input Validation
- [ ] Invalid project IDs return 404
- [ ] Invalid job IDs return 404
- [ ] Malformed UUIDs return 400
- [ ] SQL injection attempts are blocked

---

## Task 7: Production Deployment Preparation

### 7.1: Environment Configuration

**Production Environment Variables**:
```bash
# Supabase (Production instance)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... # KEEP SECRET!

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx # KEEP SECRET!

# App Configuration
NEXT_PUBLIC_APP_URL=https://wastewise.yourdomain.com
NODE_ENV=production

# Worker Configuration (optional)
WORKER_POLL_INTERVAL=2000
WORKER_MAX_CONCURRENT=2
```

### 7.2: Deployment Options

#### Option 1: Vercel (Frontend) + Railway (Worker)

**Frontend (Vercel)**:
```bash
# Deploy Next.js app
vercel --prod

# Set environment variables in Vercel dashboard
```

**Worker (Railway)**:
```bash
# Create railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm worker",
    "restartPolicyType": "ON_FAILURE"
  }
}

# Deploy worker
railway up
```

#### Option 2: Single Server (VPS)

**Using PM2**:
```bash
# Install PM2
npm install -g pm2

# Start Next.js app
pm2 start npm --name wastewise-web -- run start

# Start worker
pm2 start npm --name wastewise-worker -- run worker

# Save configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

#### Option 3: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
```

### 7.3: Monitoring Setup

**Worker Health Check**:
```typescript
// app/api/worker/health/route.ts
export async function GET() {
  const supabase = createClient()

  // Check for stuck jobs (processing >10 minutes)
  const { data: stuckJobs } = await supabase
    .from('analysis_jobs')
    .select('id, started_at')
    .eq('status', 'processing')
    .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if (stuckJobs && stuckJobs.length > 0) {
    return Response.json({
      status: 'unhealthy',
      reason: `${stuckJobs.length} jobs stuck in processing`,
      stuckJobs: stuckJobs.map(j => j.id),
    }, { status: 503 })
  }

  return Response.json({ status: 'healthy' })
}
```

**Sentry Integration** (optional):
```typescript
// lib/observability/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 7.4: Database Migrations

**Pre-deployment Checklist**:
- [ ] All migrations applied to production database
- [ ] RPC functions created in production
- [ ] Storage buckets created (`analysis-reports`)
- [ ] RLS policies enabled
- [ ] Indexes created for performance:
  ```sql
  CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status) WHERE status IN ('pending', 'processing');
  CREATE INDEX idx_analysis_jobs_user ON analysis_jobs(user_id);
  CREATE INDEX idx_analysis_jobs_project ON analysis_jobs(project_id);
  ```

### 7.5: Performance Optimization

**Before Production**:
- [ ] Enable Next.js production build optimizations
- [ ] Enable database connection pooling
- [ ] Set up CDN for static assets (Vercel Edge Network)
- [ ] Configure caching headers for reports
- [ ] Optimize images (use next/image)
- [ ] Minimize bundle size (analyze with `next build --analyze`)

---

## Task 8: Documentation Updates

### 8.1: README.md

Update with:
- [ ] Production deployment instructions
- [ ] Environment variable reference
- [ ] Worker deployment guide
- [ ] Troubleshooting section

### 8.2: API Documentation

Create `docs/API.md`:
- [ ] All endpoint descriptions
- [ ] Request/response examples
- [ ] Error codes reference
- [ ] Authentication guide

### 8.3: Deployment Guide

Create `docs/DEPLOYMENT.md`:
- [ ] Step-by-step deployment instructions
- [ ] Environment setup
- [ ] Database migration guide
- [ ] Worker deployment options
- [ ] Monitoring and health checks

---

## Success Criteria

### Phase 7 Complete When:
- ✅ All worker system tests pass
- ✅ All API endpoint tests pass
- ✅ Complete end-to-end workflow verified
- ✅ Results page displays correctly
- ✅ Downloads work (Excel + HTML)
- ✅ Error handling validated
- ✅ Performance meets targets (<180s analysis)
- ✅ Security validated (auth, RLS, input validation)
- ✅ Production deployment plan documented
- ✅ Health monitoring in place

### Production Readiness Checklist:
- [ ] All integration tests passing
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Lighthouse score >90
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] Worker deployment tested
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Backup strategy in place

---

## Timeline

**Estimated Duration**: 2-3 days

- **Day 1**: Tasks 1-3 (Worker, API, Frontend testing)
- **Day 2**: Tasks 4-6 (Performance, Database, Security)
- **Day 3**: Tasks 7-8 (Deployment prep, Documentation)

---

## Next Steps After Phase 7

**Phase 8: Production Launch**
1. Deploy to production environment
2. Monitor first 10 real user analyses
3. Collect user feedback
4. Fix any production-specific issues

**Phase 9: Feature Enhancements**
1. Processing page with live progress bar
2. Email notifications on completion
3. Regulatory research skill integration
4. Batch analysis for multiple properties

---

**Last Updated**: 2025-11-17
**Status**: READY TO START
**Previous Phase**: Phase 6 - COMPLETE ✅
