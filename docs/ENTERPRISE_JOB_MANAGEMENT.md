# Enterprise Job Management System

**Status**: Implementation Complete (Phase 7)
**Date**: 2025-11-22
**Version**: 1.0.0

## Overview

This document describes the enterprise-grade job management features implemented for WasteWise's async job processing system. These features provide production-ready reliability, observability, and operational control.

---

## 🎯 Features Implemented

### 1. Exponential Backoff Retry Logic

**Purpose**: Automatically retry failed jobs with intelligent backoff strategy

**Components**:

- `lib/workers/job-retry-manager.ts` - Retry orchestration class
- `supabase/migrations/20251122092818_enhance_job_management.sql` - Database schema

**Retry Strategy**:
| Attempt | Delay | Total Time Elapsed |
|---------|-------|-------------------|
| 1 (Initial) | Immediate | 0 min |
| 2 | 1 minute | 1 min |
| 3 | 5 minutes | 6 min |
| 4 | 15 minutes | 21 min |
| Max Backoff | 30 minutes | - |

**Error Classification**:

- **Retryable**: Network errors, timeouts, rate limits (429, 502, 503, 504)
- **Permanent**: Validation errors, permission errors (401, 403, 404)
- **Unknown**: Default to retryable (with caution)

**Database Schema**:

```sql
ALTER TABLE analysis_jobs ADD COLUMN:
- retry_after timestamp with time zone  -- When job is eligible for retry
- retry_error_log jsonb  -- Array of error objects from previous attempts
```

**API**:

```typescript
const retryManager = new JobRetryManager(supabaseUrl, supabaseKey);

// Check if job should be retried
const shouldRetry = await retryManager.shouldRetry(job, error);

// Schedule retry with exponential backoff
await retryManager.scheduleRetry(job, error);

// Mark as permanently failed
await retryManager.markPermanentlyFailed(job, error);
```

**Testing**: `__tests__/lib/workers/job-retry-manager.test.ts`

---

### 2. Priority Queue System

**Purpose**: Process high-priority jobs before low-priority ones

**Components**:

- Database function: `get_next_job(worker_identifier)` - Atomic queue claiming
- Database function: `assign_job_priority(user_id, job_type)` - Smart priority assignment

**Priority Levels** (1=highest, 10=lowest):
| Priority | Use Case | Auto-Assigned When |
|----------|----------|-------------------|
| 1 | Urgent/Admin | Admin-initiated |
| 3 | High | First-time user's first analysis |
| 5 | Normal | Regular analysis jobs |
| 7 | Low | Report regeneration |
| 9 | Background | Batch operations, cleanup |

**Queue Ordering**:

```sql
SELECT * FROM analysis_jobs
WHERE status = 'pending'
  AND (retry_after IS NULL OR retry_after <= NOW())
ORDER BY priority ASC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED  -- Prevent race conditions
```

**Database Schema**:

```sql
ALTER TABLE analysis_jobs ADD COLUMN:
- priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10)
- priority_reason text  -- Human-readable explanation
- worker_id text  -- Worker that claimed this job
- claimed_at timestamp with time zone  -- When job was claimed
```

**API Usage**:

```typescript
// Client: Create job with custom priority
POST /api/analyze
{
  "projectId": "uuid",
  "jobType": "complete_analysis",
  "priority": 1  // Optional: 1-10, auto-assigned if omitted
}

// Worker: Get next job from priority queue
const jobId = await jobProcessor.getNextJob()
if (jobId) {
  await jobProcessor.processJob(jobId)
}
```

**Testing**: `__tests__/integration/priority-queue.test.ts`

---

### 3. Alert System

**Purpose**: Notify administrators of job failures, stuck jobs, and system health issues

**Components**:

- `lib/alerts/job-alerts.ts` - Alert manager class
- `lib/alerts/notification-service.ts` - Multi-channel notification service
- `supabase/migrations/20251122092818_enhance_job_management.sql` - Alerts table

**Alert Types**:
| Type | Severity | Channels | Trigger |
|------|----------|----------|---------|
| `job_failed` | ERROR | Email + Slack | Job permanently failed after all retries |
| `job_stuck` | WARNING | Email | Job processing >30 minutes |
| `high_error_rate` | CRITICAL | Email + Slack + PagerDuty | Error rate >10% in time window |
| `worker_down` | CRITICAL | Email + Slack | Worker heartbeat timeout |

**Notification Channels**:

1. **Email** (via Resend)
   - HTML-formatted alerts
   - Includes job details and dashboard links
   - Configurable via `RESEND_API_KEY` and `ADMIN_EMAIL`

2. **Slack** (via Webhooks)
   - Formatted blocks with action buttons
   - Critical alerts include severity indicators
   - Configurable via `SLACK_WEBHOOK_URL`

3. **PagerDuty** (Optional)
   - Critical alerts only
   - Configurable via `PAGERDUTY_KEY`

**Database Schema**:

```sql
CREATE TABLE job_alerts (
  id uuid PRIMARY KEY,
  job_id uuid REFERENCES analysis_jobs(id),
  alert_type text NOT NULL,  -- job_failed, job_stuck, high_error_rate, worker_down
  severity text NOT NULL,  -- warning, error, critical
  message text NOT NULL,
  details jsonb,
  notified_at timestamp with time zone,
  notification_channels jsonb,  -- ['email', 'slack', 'pagerduty']
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT NOW()
)
```

**API**:

```typescript
const alertManager = new JobAlertManager(supabaseUrl, supabaseKey);

// Send job failed alert
await alertManager.sendJobFailedAlert(job, error);

// Send stuck job alert
await alertManager.sendJobStuckAlert(job);

// Check for stuck jobs and alert
await alertManager.checkStuckJobs();

// Check error rate and alert if threshold exceeded
await alertManager.checkErrorRate("1 hour");

// Get unacknowledged alerts
const alerts = await alertManager.getUnacknowledgedAlerts();

// Acknowledge alert
await alertManager.acknowledgeAlert(alertId, userId);
```

**Testing**: `__tests__/lib/alerts/job-alerts.test.ts`

---

### 4. Monitoring Endpoints

**Purpose**: Real-time visibility into job queue and worker health

**Endpoints**:

#### GET /api/admin/jobs/monitoring

Returns comprehensive queue metrics:

```json
{
  "success": true,
  "data": {
    "total_pending": 15,
    "total_processing": 3,
    "total_failed_today": 2,
    "total_completed_today": 45,
    "by_priority": {
      "1": 2,
      "3": 5,
      "5": 8
    },
    "avg_duration_seconds": 120,
    "error_rate_1h": 5.2,
    "error_rate_24h": 3.1,
    "stuck_jobs": 0
  },
  "timestamp": "2025-11-22T09:30:00Z"
}
```

#### GET /api/admin/workers/health

Returns worker health status:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "activeWorkers": 2,
    "workerIds": ["worker-12345-1732267800", "worker-12346-1732267805"],
    "lastJobProcessed": "2025-11-22T09:28:00Z",
    "minutesSinceLastJob": 2,
    "jobsProcessedLastHour": 12,
    "jobsProcessedLastDay": 45,
    "throughput": {
      "perHour": 12,
      "perDay": 45
    }
  },
  "timestamp": "2025-11-22T09:30:00Z"
}
```

**Health Status**:

- `healthy`: Workers active, jobs processing normally
- `degraded`: Workers active but no jobs processed in 10+ minutes
- `unhealthy`: No active workers detected

**Implementation**:

- `app/api/admin/jobs/monitoring/route.ts`
- `app/api/admin/workers/health/route.ts`

---

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```bash
# ===========================
# ALERTS & NOTIFICATIONS
# ===========================

# Email notifications via Resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=alerts@wastewise.app
ADMIN_EMAIL=admin@your-company.com

# Slack webhook for critical alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty integration for critical alerts (optional)
PAGERDUTY_KEY=your_pagerduty_integration_key

# ===========================
# JOB MANAGEMENT CONFIGURATION
# ===========================

# Maximum retry attempts for failed jobs
MAX_JOB_RETRIES=3

# Alert threshold for stuck jobs (in minutes)
JOB_STUCK_THRESHOLD_MINUTES=30

# Alert threshold for high error rate (0.10 = 10%)
ERROR_RATE_THRESHOLD=0.10

# Worker heartbeat threshold (in minutes)
WORKER_HEARTBEAT_THRESHOLD_MINUTES=5
```

---

## 📊 Database Functions

### Queue Management

```sql
-- Get next job from priority queue (atomic)
SELECT get_next_job('worker-identifier');

-- Assign priority based on user history
SELECT assign_job_priority('user-uuid', 'complete_analysis');

-- Schedule retry with exponential backoff
SELECT schedule_job_retry('job-uuid', 'error message', 'ERROR_CODE');
```

### Monitoring

```sql
-- Get comprehensive queue metrics
SELECT get_queue_metrics();

-- Detect stuck jobs (processing >30 min)
SELECT * FROM detect_stuck_jobs();

-- Calculate error rate over time window
SELECT calculate_error_rate('1 hour');

-- Cleanup old completed/failed jobs
SELECT cleanup_old_analysis_jobs(30);  -- Keep last 30 days
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test job-retry-manager
pnpm test job-alerts
```

**Test Files**:

- `__tests__/lib/workers/job-retry-manager.test.ts` - Retry logic validation
- `__tests__/lib/alerts/job-alerts.test.ts` - Alert system validation

### Integration Tests

```bash
# Run integration tests (requires running Supabase)
pnpm test:integration priority-queue
```

**Test File**:

- `__tests__/integration/priority-queue.test.ts` - End-to-end queue behavior

**Test Coverage**:

- ✅ Error classification (retryable vs permanent)
- ✅ Exponential backoff calculation
- ✅ Priority queue ordering
- ✅ Worker claiming (SKIP LOCKED)
- ✅ Retry scheduling
- ✅ Alert creation and notification
- ✅ Queue metrics calculation

---

## 🚀 Usage Examples

### Worker Implementation

```typescript
import { JobProcessor } from "@/lib/workers/job-processor";

const processor = new JobProcessor(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  "worker-main-1",
);

// Main worker loop
while (true) {
  const jobId = await processor.getNextJob();

  if (jobId) {
    try {
      await processor.processJob(jobId);
    } catch (error) {
      // Error handling with retry logic happens automatically
      console.error("Job failed:", error);
    }
  } else {
    // No jobs available - sleep briefly
    await sleep(1000);
  }
}
```

### Client: Create High-Priority Job

```typescript
const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    projectId: "uuid",
    jobType: "complete_analysis",
    priority: 1, // Highest priority
  }),
});

const { jobId } = await response.json();

// Poll for status
const job = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
```

### Admin: Monitor Queue Health

```typescript
// Get queue metrics
const metrics = await fetch("/api/admin/jobs/monitoring").then((r) => r.json());

console.log("Queue health:", metrics.data);

// Get worker health
const health = await fetch("/api/admin/workers/health").then((r) => r.json());

if (health.data.status !== "healthy") {
  console.warn("Worker issues detected:", health.data);
}
```

---

## 📈 Operational Benefits

### Reliability

- ✅ Automatic retry with exponential backoff
- ✅ No lost jobs due to transient failures
- ✅ Intelligent error classification

### Observability

- ✅ Real-time queue metrics
- ✅ Worker health monitoring
- ✅ Alert history and acknowledgment

### Performance

- ✅ Priority-based job ordering
- ✅ First-time user experience optimization
- ✅ Efficient queue processing with SKIP LOCKED

### Operational Control

- ✅ Multi-channel alerting (email, Slack, PagerDuty)
- ✅ Configurable thresholds and retry limits
- ✅ Admin visibility into job queue state

---

## 🔜 Future Enhancements

### Planned Features

1. **Worker Registration Table**: Track worker heartbeats, resource usage
2. **Job Cancellation**: Allow users to cancel pending/processing jobs
3. **Job Scheduling**: Schedule jobs for future execution (cron-like)
4. **Advanced Metrics**: Prometheus/Grafana integration
5. **Dead Letter Queue**: Permanent failure storage and analysis
6. **Job Dependencies**: Chain jobs with dependencies
7. **Bulk Operations**: Batch job creation and management

### Monitoring Improvements

- Worker CPU and memory usage tracking
- Distributed tracing for job execution
- Custom dashboard with real-time updates
- Historical trend analysis

---

## 📚 References

**Database Migration**:

- `supabase/migrations/20251122092818_enhance_job_management.sql`

**Core Implementation**:

- `lib/workers/job-retry-manager.ts`
- `lib/workers/job-processor.ts`
- `lib/alerts/job-alerts.ts`
- `lib/alerts/notification-service.ts`

**API Endpoints**:

- `app/api/analyze/route.ts` (priority parameter)
- `app/api/admin/jobs/monitoring/route.ts`
- `app/api/admin/workers/health/route.ts`

**Tests**:

- `__tests__/lib/workers/job-retry-manager.test.ts`
- `__tests__/lib/alerts/job-alerts.test.ts`
- `__tests__/integration/priority-queue.test.ts`

**Configuration**:

- `.env.template` (updated with new variables)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-22
**Maintained By**: Backend Development Team
