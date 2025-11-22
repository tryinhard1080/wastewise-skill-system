# WasteWise Deployment Architecture

**Version**: 1.0.0
**Date**: 2025-11-21
**Status**: Approved for Implementation

## Executive Summary

This document defines the production deployment architecture for WasteWise SaaS platform. The architecture prioritizes:
- **Simplicity**: Minimize operational complexity
- **Reliability**: 99.9% uptime target
- **Cost-effectiveness**: Optimize for startup budget
- **Scalability**: Support growth from 10 to 10,000 users

## Deployment Platform

**Selected Platform**: Railway.app

**Rationale**:
- Native Next.js 14 support with zero configuration
- Multi-service deployment (web + worker) in single project
- Built-in PostgreSQL with connection pooling
- Automatic SSL/TLS certificates
- GitHub integration for CI/CD
- Simple environment variable management
- Cost-effective pricing ($5/month/service)
- Easy horizontal scaling

**Alternative Considered**: Vercel (web) + Railway (worker)
- **Rejected**: Adds complexity, separate billing, harder to monitor

## Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                         Railway Project                      │
├──────────────────────┬──────────────────────┬───────────────┤
│   Web Service        │   Worker Service     │   Database    │
│   (Next.js 14)       │   (Node.js)          │   (External)  │
│                      │                      │               │
│   Port: 3000         │   No exposed port    │   Supabase    │
│   Public domain      │   Internal only      │   PostgreSQL  │
│   Horizontal scale   │   Horizontal scale   │   Managed     │
│   Min: 1 instance    │   Min: 1 instance    │               │
│   Max: 10 instances  │   Max: 3 instances   │               │
└──────────────────────┴──────────────────────┴───────────────┘
           │                      │                    │
           │                      │                    │
           ├──────────────────────┴────────────────────┤
           │                                           │
           │         Shared Environment Variables      │
           │         (Railway Secret Store)            │
           └───────────────────────────────────────────┘

External Services (not on Railway):
┌──────────────────────┬──────────────────────┬───────────────┐
│   Supabase Hosted    │   Anthropic API      │   Sentry.io   │
│   (Database + Auth   │   (Claude AI)        │   (Monitoring)│
│   + Storage)         │                      │               │
└──────────────────────┴──────────────────────┴───────────────┘
```

## Service Specifications

### Web Service (Next.js 14)

**Runtime**: Node.js 20 LTS
**Entry Command**: `pnpm build && pnpm start`
**Port**: 3000 (auto-detected by Railway)
**Memory**: 512MB (min) → 2GB (max)
**CPU**: 0.5 vCPU (min) → 2 vCPU (max)

**Features**:
- Server-side rendering (SSR)
- API routes with rate limiting
- Static asset serving via Next.js
- Automatic HTTPS via Railway
- Health check endpoint: `/api/health`

**Scaling Strategy**:
- Horizontal auto-scaling based on CPU/memory
- Scale up: >80% CPU for 2 minutes
- Scale down: <30% CPU for 5 minutes
- Max instances: 10 (supports ~10,000 concurrent users)

### Worker Service (Background Jobs)

**Runtime**: Node.js 20 LTS
**Entry Command**: `pnpm build:worker && pnpm start:worker`
**Port**: None (internal service)
**Memory**: 1GB (min) → 4GB (max)
**CPU**: 1 vCPU (min) → 4 vCPU (max)

**Features**:
- Job polling (2-second intervals)
- Concurrent job processing (1-3 jobs)
- Graceful shutdown (SIGTERM handling)
- Automatic restart on crash
- Health check: Database connectivity test

**Scaling Strategy**:
- Manual horizontal scaling initially
- Add workers when job queue depth >10
- Target: <2 minute average job wait time
- Max instances: 3 (handles ~180 jobs/hour)

### Database Service (Supabase Hosted)

**Platform**: Supabase Cloud (managed PostgreSQL 15)
**Tier**: Pro ($25/month)
**Connection Pooling**: Enabled (pgBouncer)
**Backups**: Automated daily + point-in-time recovery

**Why External (not Railway PostgreSQL)**:
- Supabase provides Auth + Storage + Realtime in one platform
- Existing migrations and schema already built for Supabase
- Better PostgreSQL management tools
- Built-in connection pooling (pgBouncer)
- Free SSL connections

**Connection Strategy**:
- Web service: Connection pooling via pgBouncer (max 15 connections)
- Worker service: Direct connection (max 5 connections)
- Total pool: 20 connections (within Supabase Pro limits)

## Environment Variables

### Required for Both Services

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (public, safe to expose)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (secret, server-only)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=project-files

# AI Services
ANTHROPIC_API_KEY=sk-ant-... (secret)

# Application
NEXT_PUBLIC_APP_URL=https://wastewise.railway.app
NODE_ENV=production

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_... (for source maps)
```

### Web Service Only

```bash
# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Session Management
SESSION_SECRET=... (random 32-byte string)
```

### Worker Service Only

```bash
# Worker Configuration
WORKER_POLL_INTERVAL=2000
WORKER_MAX_CONCURRENT_JOBS=1

# Resource Limits
WORKER_MEMORY_LIMIT_MB=3072
WORKER_JOB_TIMEOUT_MS=300000
```

### Environment-Specific Variables

**Development** (localhost):
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG=true
LOG_LEVEL=debug
```

**Staging** (Railway preview):
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://wastewise-staging.railway.app
DEBUG=true
LOG_LEVEL=info
```

**Production** (Railway main):
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://wastewise.com
DEBUG=false
LOG_LEVEL=warn
```

## Secret Management

**Storage**: Railway environment variables (encrypted at rest)

**Access Control**:
- Production secrets: Only accessible to production services
- Staging secrets: Separate Railway project
- Development secrets: Local `.env.local` (git-ignored)

**Rotation Policy**:
- API keys: Rotate every 90 days
- Service role keys: Rotate every 180 days
- Session secrets: Rotate every 30 days
- Document rotation in `docs/SECRET_ROTATION_LOG.md`

**Emergency Rotation**:
1. Generate new key in source system (Anthropic, Supabase)
2. Add new key to Railway with temporary name (e.g., `ANTHROPIC_API_KEY_NEW`)
3. Update code to check both keys
4. Deploy and verify
5. Remove old key from Railway
6. Update code to use only new key
7. Deploy final version

## Network Configuration

### Custom Domain Setup

**Primary Domain**: `wastewise.com`
**Staging Domain**: `staging.wastewise.com`

**DNS Configuration** (Cloudflare DNS):
```
A     wastewise.com            →  Railway IP (auto-provided)
CNAME www.wastewise.com        →  wastewise.com
CNAME staging.wastewise.com    →  Railway staging URL
```

**SSL/TLS**:
- Auto-provisioned by Railway (Let's Encrypt)
- Automatic renewal every 60 days
- Forced HTTPS redirect (configured in Railway)

### CORS Configuration

**Allowed Origins** (production):
- `https://wastewise.com`
- `https://www.wastewise.com`

**Allowed Origins** (staging):
- `https://staging.wastewise.com`
- `https://wastewise-staging.railway.app`

**Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
**Allowed Headers**: `Content-Type, Authorization, X-CSRF-Token`
**Credentials**: `true` (for cookies)

**Implementation**: Next.js middleware (`middleware.ts`)

### Rate Limiting

**Global Rate Limit**:
- 100 requests per minute per IP
- Enforced at Next.js API route level
- Returns `429 Too Many Requests` with `Retry-After` header

**Endpoint-Specific Limits**:
- `POST /api/analyze`: 5 requests/hour per user (prevents abuse)
- `POST /api/projects`: 20 requests/hour per user
- `GET /api/jobs/*`: 60 requests/minute per user (polling)

**Implementation**: `lib/middleware/rate-limiter.ts` using Upstash Redis

## Scaling Strategy

### Horizontal Scaling (Add More Instances)

**Web Service Triggers**:
- CPU >80% for 2 minutes → Add 1 instance
- Memory >85% for 2 minutes → Add 1 instance
- Response time >2s for 5 minutes → Add 1 instance
- Scale down: Inverse conditions for 5 minutes

**Worker Service Triggers**:
- Job queue depth >10 → Add 1 worker
- Average job wait time >2 minutes → Add 1 worker
- Manual scaling initially (add automation in Phase 8)

**Database Scaling**:
- Supabase Pro supports up to 1TB database
- Connection pooling handles 20 concurrent connections
- If connection limit reached: Upgrade to Team tier ($599/month, 60 connections)

### Vertical Scaling (Bigger Instances)

**When to Scale Up**:
- Memory limits consistently hit (OOM errors)
- CPU bottleneck (single-threaded operations)
- Large file processing (>10MB invoices)

**How to Scale Up**:
1. Update Railway service configuration
2. Redeploy with new resource limits
3. Monitor performance for 24 hours
4. Revert if no improvement

### Cost Optimization

**Current Estimated Monthly Cost**:
- Railway Web Service: $5-20 (depending on usage)
- Railway Worker Service: $5-15
- Supabase Pro: $25
- Anthropic API: $50-200 (variable, depends on usage)
- Sentry: $26 (Team plan)
- **Total**: ~$111-286/month

**Scaling Cost Projections**:
- 100 users: $150/month
- 1,000 users: $350/month
- 10,000 users: $1,200/month

## Database Connection Pooling

**Problem**: PostgreSQL has limited connections (Supabase Pro = 60 max)

**Solution**: Supabase pgBouncer (connection pooler)

**Configuration**:
```typescript
// lib/supabase/server.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // Server-side only
    },
    global: {
      headers: {
        'X-Client-Info': 'wastewise-web/1.0.0',
      },
    },
  }
)
```

**Connection Limits**:
- Web service: 15 connections (shared across instances)
- Worker service: 5 connections (shared across workers)
- Reserved for Supabase admin: 5 connections
- Total: 25/60 connections used

**Monitoring**:
- Track active connections in Supabase dashboard
- Alert if connections >50 (near limit)
- Auto-scale or optimize queries if limit approached

## Health Checks & Monitoring

### Health Check Endpoints

**Web Service**: `GET /api/health`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T12:00:00Z",
  "checks": {
    "database": "connected",
    "storage": "accessible",
    "sentry": "configured"
  },
  "uptime": 86400
}
```

**Worker Service**: Internal health check (database connectivity)
```typescript
// Checked every 30 seconds by worker process
async function checkHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('analysis_jobs').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
```

### Uptime Monitoring

**Service**: UptimeRobot (free tier)

**Checks**:
- `https://wastewise.com/` - Every 5 minutes
- `https://wastewise.com/api/health` - Every 5 minutes
- Alert if down for >2 minutes

**Notifications**:
- Email: team@wastewise.com
- Slack: #alerts channel (future)

### Error Tracking

**Service**: Sentry.io (Team plan, $26/month)

**Configuration**:
- Automatic error capture (client + server)
- Source map uploads for production builds
- Performance monitoring (traces)
- Release tracking (git commit SHA)

**Alert Thresholds**:
- Error rate >1% of requests → Slack alert
- New error type → Email notification
- Critical error (database failure) → SMS alert

### Logging Strategy

**Log Levels**:
- **DEBUG**: Development only (not in production)
- **INFO**: Important events (job started, user login)
- **WARN**: Recoverable errors (API retry, validation failure)
- **ERROR**: Unrecoverable errors (database connection lost)

**Log Aggregation**:
- Railway built-in logs (7-day retention)
- Future: Export to Datadog or Logtail (if needed)

**Log Format** (JSON):
```json
{
  "timestamp": "2025-11-21T12:00:00.000Z",
  "level": "INFO",
  "service": "web",
  "message": "Job started",
  "context": {
    "jobId": "job_123",
    "userId": "user_456"
  }
}
```

## Deployment Workflow

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run unit tests
      - Run integration tests
      - Run TypeScript checks
      - Run linter

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Deploy to Railway (automatic via Railway GitHub integration)
      - Upload source maps to Sentry
      - Run smoke tests
      - Notify team (Slack)
```

### Deployment Process

**Staging Deployment** (automatic on PR):
1. Push branch to GitHub
2. Create pull request
3. Railway creates preview deployment automatically
4. Run automated tests against preview
5. Manual QA testing
6. Merge to master if tests pass

**Production Deployment** (automatic on merge):
1. Merge PR to master
2. GitHub Actions runs tests
3. Railway deploys to production (zero-downtime)
4. Sentry creates new release
5. Health checks verify deployment
6. Rollback if health checks fail

### Zero-Downtime Deployment

Railway handles zero-downtime deployments automatically:
1. Build new Docker image
2. Start new instances with new code
3. Wait for health checks to pass
4. Route traffic to new instances
5. Gracefully shutdown old instances (wait for in-flight requests)

### Rollback Procedures

**Automatic Rollback** (if health checks fail):
- Railway automatically reverts to previous deployment
- Takes ~2 minutes
- No manual intervention needed

**Manual Rollback** (if issue discovered post-deployment):
```bash
# Via Railway CLI
railway rollback

# Or via Railway dashboard
# Go to Deployments → Select previous deployment → Redeploy
```

**Rollback Checklist**:
1. Identify issue (error spike in Sentry, user reports)
2. Check if issue exists in previous version (compare logs)
3. Execute rollback (CLI or dashboard)
4. Verify health checks pass
5. Monitor error rates for 15 minutes
6. Notify team of rollback
7. Create incident report
8. Fix issue in new PR

## Security Considerations

### Least-Privilege Access

**Railway Access**:
- **Owner**: 1 person (Richard)
- **Developer**: Engineers (can deploy, view logs)
- **Viewer**: Support team (read-only)

**Supabase Access**:
- **Owner**: 1 person (Richard)
- **Admin**: Engineers (full database access)
- **Service Role**: Only used by backend services (not humans)

### Secrets Management

**Never Commit**:
- `.env.local` (git-ignored)
- API keys
- Service role keys
- Session secrets

**Secure Storage**:
- Railway environment variables (encrypted)
- 1Password for team secret sharing (future)

### Input Validation

**API Routes**:
- Validate all inputs with Zod schemas
- Sanitize file uploads (check MIME types, file size)
- Rate limiting on all endpoints
- CSRF protection via Next.js built-in

**Database**:
- Row-Level Security (RLS) enabled on all tables
- Prepared statements (SQL injection prevention)
- Foreign key constraints

### Network Security

**TLS/SSL**:
- Force HTTPS redirect
- HSTS headers enabled
- Minimum TLS 1.2

**Headers**:
```typescript
// next.config.mjs
{
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
}
```

## Disaster Recovery

### Backup Strategy

**Database Backups** (Supabase automatic):
- Daily full backups (retained 7 days)
- Point-in-time recovery (up to 7 days back)
- Manual backup before major migrations

**Code Backups**:
- Git repository on GitHub (primary)
- Railway deployment snapshots (last 30 deployments)

### Recovery Procedures

**Database Corruption**:
1. Restore from Supabase backup (via dashboard)
2. Re-run migrations if needed
3. Verify data integrity
4. Resume services

**Complete Service Failure**:
1. Check Railway status page
2. If Railway down: Wait for resolution (99.9% SLA)
3. If code issue: Rollback to last known good deployment
4. If database issue: Restore from backup

**Data Loss**:
- Maximum data loss: 24 hours (daily backups)
- Recovery time objective (RTO): 2 hours
- Recovery point objective (RPO): 24 hours

## Success Metrics

**Performance**:
- Response time (p95): <500ms
- Time to First Byte (TTFB): <200ms
- Job processing time: <5 minutes (average)

**Reliability**:
- Uptime: 99.9% (allows 43 minutes downtime/month)
- Error rate: <0.1% of requests
- Failed job rate: <1%

**Cost**:
- Cost per user: <$1/month (at 1,000 users)
- AI API cost: <50% of total infrastructure cost

## Future Enhancements (Phase 8+)

**Auto-Scaling**:
- Implement auto-scaling for worker service
- Load balancer for web service (if >10 instances needed)

**Caching**:
- Redis cache for frequently accessed data
- CDN for static assets (Cloudflare)

**Observability**:
- Distributed tracing (OpenTelemetry)
- Custom dashboards (Grafana)
- Alerts for business metrics (jobs/hour, revenue/day)

**Multi-Region**:
- Deploy to US West + US East (Railway supports multi-region)
- Global CDN for static assets
- Database read replicas

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-21
**Next Review**: 2025-12-21 (after initial production deployment)
**Maintained By**: Orchestrator Agent + Backend Agent
