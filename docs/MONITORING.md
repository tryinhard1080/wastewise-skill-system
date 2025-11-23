# WasteWise Monitoring & Observability Guide

## Overview

WasteWise uses a comprehensive monitoring stack to ensure production reliability:

- **Error Tracking**: Sentry (captures exceptions, stack traces, user context)
- **Health Checks**: Custom endpoints for application and worker health
- **Structured Logging**: Centralized logger with contextual data
- **Performance Monitoring**: Sentry performance tracing (optional)

## Table of Contents

1. [Sentry Setup](#sentry-setup)
2. [Health Check Endpoints](#health-check-endpoints)
3. [Logging Best Practices](#logging-best-practices)
4. [Setting Up Alerts](#setting-up-alerts)
5. [Troubleshooting](#troubleshooting)

---

## Sentry Setup

### 1. Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (supports up to 5,000 events/month)
3. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue** (recommended for production)

### 2. Get Your DSN

After creating the project:

1. Navigate to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
2. Copy the **DSN** (looks like: `https://abc123@o123.ingest.sentry.io/456`)
3. Note: There are two DSNs (public and private) - use the **public DSN** for both client and server

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@sentry.io/your-project-id
SENTRY_DSN=https://your-public-key@sentry.io/your-project-id

# For source map uploads (CI/CD only)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

**Security Note**: The `NEXT_PUBLIC_SENTRY_DSN` is safe to expose in the browser. It's rate-limited by Sentry and only allows sending events (not reading them).

### 4. Generate Auth Token (For CI/CD)

To upload source maps in production builds:

1. Go to **Settings** → **Account** → **API** → **Auth Tokens**
2. Click **Create New Token**
3. Scopes required:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token and add to your CI/CD environment variables

### 5. Test Sentry Integration

**Local Testing** (development only):

```bash
# Start dev server
pnpm dev

# Trigger test error
curl http://localhost:3000/api/debug/sentry
```

This should:

- Throw an error in the console
- **NOT** send to Sentry (development errors are filtered)

**Production Testing**:

1. Deploy to staging/production
2. Trigger the test endpoint
3. Check Sentry dashboard for the captured error

---

## Health Check Endpoints

WasteWise provides two health check endpoints for monitoring system status.

### Main Application Health: `GET /api/health`

**Purpose**: Verify core application services (database, storage)

**Response** (healthy):

```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "storage": "ok"
  }
}
```

**Response** (degraded):

```json
{
  "status": "degraded",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "storage": "error"
  },
  "errors": ["Storage: Connection timeout"]
}
```

**HTTP Status Codes**:

- `200`: Healthy or degraded (partial functionality)
- `503`: Unhealthy (critical failure)

**Usage**:

```bash
# Check application health
curl http://localhost:3000/api/health

# Use in monitoring tools (UptimeRobot, Pingdom, etc.)
# URL: https://your-domain.com/api/health
# Expected: 200 status code
```

### Worker Health: `GET /api/health/worker`

**Purpose**: Monitor background job queue performance

**Response** (healthy):

```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "jobStats": {
    "pending": 2,
    "processing": 1,
    "completed_last_hour": 45,
    "failed_last_hour": 0,
    "avg_processing_time_minutes": 3.2
  }
}
```

**Response** (warning):

```json
{
  "status": "warning",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "jobStats": {
    "pending": 12,
    "processing": 3,
    "completed_last_hour": 20,
    "failed_last_hour": 2,
    "avg_processing_time_minutes": 7.5
  },
  "concerns": [
    "High pending job count: 12",
    "Slow processing time: 7.5 minutes average"
  ]
}
```

**Health Thresholds**:

- **Healthy**: <10 pending, <5 processing, <5 failures/hour, <10min avg time
- **Warning**: 10-20 pending, 5-10 processing, 5-10 failures/hour, 10-15min avg time
- **Critical**: >20 pending, >10 processing, >10 failures/hour, >15min avg time

**Usage**:

```bash
# Check worker health
curl http://localhost:3000/api/health/worker

# Monitor worker performance
watch -n 10 'curl -s http://localhost:3000/api/health/worker | jq'
```

---

## Logging Best Practices

### Using the Logger

```typescript
import { logger } from "@/lib/observability/logger";

// Basic logging
logger.info("User logged in", { userId: "123" });
logger.error("Failed to process job", error, { jobId: "abc" });

// With structured data
logger.info(
  "API request completed",
  { userId: "123", requestId: "req-456" },
  { method: "POST", path: "/api/analyze", duration_ms: 234 },
);

// Child logger for consistent context
const jobLogger = logger.child({
  jobId: "job-123",
  skillName: "compactor-optimization",
});

jobLogger.info("Job started");
jobLogger.info("Processing haul data", undefined, { haulCount: 25 });
jobLogger.info("Job completed");

// Performance timing
const endTimer = logger.startTimer("Database query", { userId: "123" });
// ... perform query ...
endTimer(); // Logs: "Timer: Database query" with duration_ms
```

### Log Levels

| Level   | When to Use                              | Sentry Behavior        |
| ------- | ---------------------------------------- | ---------------------- |
| `debug` | Development debugging, verbose info      | Not sent               |
| `info`  | Normal operations, important events      | Not sent               |
| `warn`  | Recoverable errors, degraded performance | Breadcrumb only        |
| `error` | Exceptions, failures, critical issues    | Full exception capture |

### What to Log

**DO Log**:

- User actions (login, create project, start analysis)
- Job lifecycle (started, progress, completed, failed)
- External API calls (Anthropic, Supabase)
- Performance metrics (duration, token usage)
- Business-critical errors

**DON'T Log**:

- Sensitive data (passwords, API keys, PII)
- Full file contents (just metadata)
- Noisy low-level operations (every database query)

### Log Structure

Always include context:

```typescript
// ❌ BAD - No context
logger.error("Job failed", error);

// ✅ GOOD - With context
logger.error("Job failed", error, {
  jobId: job.id,
  userId: job.user_id,
  projectId: job.project_id,
  skillName: job.job_type,
});
```

---

## Setting Up Alerts

### Sentry Alerts

1. Go to **Alerts** → **Create Alert Rule**
2. Recommended rules:

**Critical Errors**:

- Trigger: **An event is seen**
- Conditions: `level:error` AND `environment:production`
- Action: Email team immediately

**High Error Rate**:

- Trigger: **Error count** is above **10 in 1 hour**
- Conditions: `environment:production`
- Action: Email + Slack notification

**Slow Jobs**:

- Trigger: **Custom metric** (if using performance monitoring)
- Conditions: `transaction.duration > 600000` (10 minutes)
- Action: Email team

### Health Check Monitoring

Use external monitoring services to poll health endpoints:

**UptimeRobot** (free tier):

1. Add monitor: `https://your-domain.com/api/health`
2. Check interval: **5 minutes**
3. Alert contacts: Email, Slack, SMS

**Pingdom**:

1. Add check: `https://your-domain.com/api/health`
2. Expected: **200 status code**
3. Alert when: Down for **5 minutes**

**Custom Script** (cron job):

```bash
#!/bin/bash
# Check health and alert on failure

HEALTH_URL="https://your-domain.com/api/health"
WORKER_URL="https://your-domain.com/api/health/worker"

# Check main health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
if [ $STATUS -ne 200 ]; then
  echo "ALERT: Application unhealthy (status: $STATUS)"
  # Send alert (email, Slack, PagerDuty, etc.)
fi

# Check worker health
WORKER_STATUS=$(curl -s $WORKER_URL | jq -r '.status')
if [ "$WORKER_STATUS" = "critical" ]; then
  echo "ALERT: Worker queue critical"
  # Send alert
fi
```

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check 1**: Verify environment variables are set:

```bash
echo $NEXT_PUBLIC_SENTRY_DSN
echo $SENTRY_DSN
```

**Check 2**: Verify environment is production:

```bash
echo $NODE_ENV  # Should be "production"
```

Development errors are intentionally filtered to avoid noise.

**Check 3**: Check Sentry quota:

- Go to **Settings** → **Subscription**
- Verify you haven't hit the event limit

**Check 4**: Test manually:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(new Error("Manual test error"));
```

### Health Checks Failing

**Database Connection Issues**:

```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test direct connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/projects?select=id&limit=1 \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

**Storage Issues**:

- Verify storage bucket exists: `project-files`
- Check bucket permissions (public or authenticated)
- Verify service role key has storage access

### Worker Queue Backlog

**Symptoms**:

- High pending count (>20)
- Slow processing time (>10 minutes)

**Diagnosis**:

```bash
# Check worker status
curl http://localhost:3000/api/health/worker

# Check worker logs
pm2 logs worker  # If using PM2
journalctl -u wastewise-worker  # If using systemd
```

**Solutions**:

1. **Scale workers**: Run multiple worker instances
2. **Check AI API limits**: Verify Anthropic rate limits
3. **Optimize skills**: Profile slow operations
4. **Database performance**: Add indexes, optimize queries

---

## Production Checklist

Before deploying to production:

- [ ] Sentry DSN configured
- [ ] Auth token set (for source maps)
- [ ] Health check endpoints tested
- [ ] Alerts configured (Sentry + external monitoring)
- [ ] Log level set to `info` or `warn` (not `debug`)
- [ ] Error filtering verified (development errors not sent)
- [ ] Worker health monitoring in place
- [ ] On-call rotation established
- [ ] Incident response plan documented

---

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Monitoring Best Practices](https://nextjs.org/docs/advanced-features/monitoring)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/performance)

---

**Last Updated**: 2025-11-21
**Maintained By**: Backend Development Team
