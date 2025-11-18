# WasteWise Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-18 (Phase 7)
**Target Environment**: Production

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
   - [Option 1: Vercel + Railway](#option-1-vercel--railway-recommended)
   - [Option 2: Single VPS Server](#option-2-single-vps-server)
   - [Option 3: Docker Compose](#option-3-docker-compose)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [x] **Supabase Account** - Production database and storage
- [x] **Anthropic API Key** - Claude AI for analysis (Phase 4+)
- [x] **Domain Name** - For production URL
- [x] **SSL Certificate** - Handled automatically by deployment platform

### Local Development Setup Complete
- [x] All Phase 0-6 development complete
- [x] Integration tests passing (Phase 7)
- [x] No TypeScript errors (`pnpm tsc --noEmit`)
- [x] All environment variables documented

---

## Environment Configuration

### Production Environment Variables

Create `.env.production` or configure in your deployment platform:

```bash
##########
# Supabase (Production Instance)
##########
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # KEEP SECRET!

##########
# AI Services
##########
ANTHROPIC_API_KEY=sk-ant-api03-...  # KEEP SECRET! (Phase 4+)

##########
# Application
##########
NEXT_PUBLIC_APP_URL=https://wastewise.yourdomain.com
NODE_ENV=production

##########
# Worker Configuration
##########
WORKER_POLL_INTERVAL_MS=2000      # Poll database every 2 seconds
WORKER_MAX_CONCURRENT=2           # Process up to 2 jobs simultaneously

##########
# Optional: Monitoring
##########
SENTRY_DSN=https://...            # Error tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Security Checklist

- [ ] **Never commit** `.env.production` to git
- [ ] Store secrets in deployment platform's secret management
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` regularly
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Use HTTPS only (no HTTP in production)
- [ ] Set up CORS properly in Supabase dashboard

---

## Database Setup

### 1. Create Production Supabase Project

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Create new project
# 3. Choose region closest to your users
# 4. Wait for project to provision (~2 minutes)
```

### 2. Run Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to production project
npx supabase link --project-ref your-project-ref

# Push all migrations to production
npx supabase db push

# Verify migrations applied correctly
npx supabase db diff --schema public
# Should return: "No schema changes detected"
```

### 3. Create Storage Buckets

```sql
-- Run in Supabase SQL Editor
-- Create storage bucket for analysis reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-reports', 'analysis-reports', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'analysis-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'analysis-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Verify RPC Functions

```sql
-- Test all RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'start_analysis_job',
    'update_job_progress',
    'complete_analysis_job',
    'fail_analysis_job'
  );

-- Should return 4 rows
```

### 5. Create Database Indexes

```sql
-- Optimize job query performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status
  ON analysis_jobs(status)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user
  ON analysis_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project
  ON analysis_jobs(project_id);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created
  ON analysis_jobs(created_at DESC);

-- Optimize project queries
CREATE INDEX IF NOT EXISTS idx_projects_user
  ON projects(user_id);

-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

---

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

Best for: Scalability, ease of deployment, automatic HTTPS

#### A. Deploy Next.js App to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to: https://vercel.com/your-project/settings/environment-variables
# Add all variables from .env.production
```

**Vercel Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Mark as "Secret")
- `ANTHROPIC_API_KEY` (Mark as "Secret")
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV` = `production`

#### B. Deploy Worker to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway init

# 4. Create worker service
# In Railway dashboard:
# - Click "New Service"
# - Select "Deploy from GitHub Repo"
# - Choose your repository
# - Set start command: pnpm worker
```

**Railway Environment Variables** (Worker):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `WORKER_POLL_INTERVAL_MS` = `2000`
- `WORKER_MAX_CONCURRENT` = `2`
- `NODE_ENV` = `production`

**Railway Configuration File** (`railway.json`):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm worker",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### C. Verify Deployment

```bash
# Test frontend
curl https://wastewise.yourdomain.com

# Test API endpoint (requires auth token)
curl https://wastewise.yourdomain.com/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check worker logs in Railway dashboard
# Should see: "Worker started successfully" and "Polling for analysis jobs..."
```

---

### Option 2: Single VPS Server

Best for: Full control, cost-effectiveness, private hosting

#### A. Provision Server

**Recommended Specs**:
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB SSD
- **Provider**: DigitalOcean, Linode, AWS EC2, or similar

#### B. Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Certbot (SSL certificates)
apt install -y certbot python3-certbot-nginx
```

#### C. Clone Repository

```bash
# Create app directory
mkdir -p /var/www/wastewise
cd /var/www/wastewise

# Clone repository
git clone https://github.com/your-org/wastewise-saas.git .

# Install dependencies
pnpm install

# Create production environment file
nano .env.production
# Paste all environment variables
```

#### D. Build Application

```bash
# Build Next.js app
pnpm build

# Verify build succeeded
ls -la .next/
# Should see standalone/ directory
```

#### E. Configure PM2

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'wastewise-web',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/wastewise',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'wastewise-worker',
      script: 'pnpm',
      args: 'worker',
      cwd: '/var/www/wastewise',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start services:
```bash
# Start both web and worker
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs

# Check status
pm2 status
pm2 logs
```

#### F. Configure Nginx

Create `/etc/nginx/sites-available/wastewise`:
```nginx
server {
    listen 80;
    server_name wastewise.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable site:
```bash
# Create symlink
ln -s /etc/nginx/sites-available/wastewise /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

#### G. Set Up SSL Certificate

```bash
# Obtain SSL certificate from Let's Encrypt
certbot --nginx -d wastewise.yourdomain.com

# Follow prompts
# Choose: Redirect HTTP to HTTPS

# Test auto-renewal
certbot renew --dry-run
```

#### H. Set Up Firewall

```bash
# Allow SSH
ufw allow 22

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable

# Check status
ufw status
```

---

### Option 3: Docker Compose

Best for: Reproducible deployments, multi-container orchestration

#### A. Create Docker Files

**Dockerfile.web**:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Dockerfile.worker**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy application code
COPY . .

# Run worker
CMD ["pnpm", "worker"]
```

**docker-compose.yml**:
```yaml
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
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - web
    healthcheck:
      test: ["CMD", "pgrep", "-f", "worker"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### B. Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## Post-Deployment

### 1. Smoke Test

```bash
# Test homepage
curl https://wastewise.yourdomain.com

# Test API health (requires creating a test user first)
curl https://wastewise.yourdomain.com/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create First Admin User

```bash
# Via Supabase Dashboard:
# 1. Go to Authentication > Users
# 2. Click "Add User"
# 3. Enter email and password
# 4. Confirm email manually (or via email if configured)
```

### 3. Run End-to-End Test

1. Sign up/login as test user
2. Create test project with sample data
3. Start analysis job
4. Monitor progress in worker logs
5. Verify results page loads
6. Download Excel and HTML reports
7. Confirm reports open correctly

### 4. Monitor for First 24 Hours

```bash
# Watch worker logs
pm2 logs wastewise-worker --lines 100

# Watch web server logs
pm2 logs wastewise-web --lines 100

# Check for errors
pm2 logs --err

# Monitor system resources
pm2 monit
```

---

## Monitoring & Health Checks

### 1. Worker Health Check Endpoint

Create `app/api/worker/health/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Check for stuck jobs (processing >10 minutes)
  const { data: stuckJobs } = await supabase
    .from('analysis_jobs')
    .select('id, started_at')
    .eq('status', 'processing')
    .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if (stuckJobs && stuckJobs.length > 0) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        reason: `${stuckJobs.length} jobs stuck in processing`,
        stuckJobs: stuckJobs.map((j) => j.id),
      },
      { status: 503 }
    )
  }

  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
}
```

### 2. Uptime Monitoring

Use services like:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **Better Uptime**

Monitor:
- `https://wastewise.yourdomain.com/` (homepage)
- `https://wastewise.yourdomain.com/api/worker/health` (worker health)

### 3. Error Tracking (Optional)

**Sentry Setup**:

```bash
npm install @sentry/nextjs
```

`sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 4. Database Monitoring

Monitor in Supabase Dashboard:
- Database size usage
- Active connections
- Query performance
- Storage usage

Set up alerts for:
- Database >80% full
- Active connections >80% limit
- Storage >80% full

---

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms**: Jobs stuck in `pending` status

**Debugging**:
```bash
# Check worker is running
pm2 list

# Check worker logs
pm2 logs wastewise-worker --lines 50

# Test database connection manually
psql $SUPABASE_CONNECTION_STRING -c "SELECT COUNT(*) FROM analysis_jobs WHERE status='pending';"
```

**Common Causes**:
- Worker not running (restart with `pm2 restart wastewise-worker`)
- Database connection issues (verify `SUPABASE_SERVICE_ROLE_KEY`)
- Worker crashed (check logs for errors)

---

### Jobs Failing with "Project Not Found"

**Symptoms**: Jobs fail immediately with `PROJECT_NOT_FOUND` error

**Debugging**:
```sql
-- Check if project exists
SELECT id, property_name, user_id
FROM projects
WHERE id = 'YOUR_PROJECT_ID';

-- Check if invoices exist
SELECT COUNT(*)
FROM invoice_data
WHERE project_id = 'YOUR_PROJECT_ID';
```

**Common Causes**:
- Project doesn't exist in database
- User ID mismatch (RLS blocking access)
- No invoice data for project

---

### Database Connection Pool Exhausted

**Symptoms**: "too many connections" errors

**Solution**:
```typescript
// lib/supabase/server.ts
// Increase pooler connection mode in Supabase connection string
const connectionString = process.env.DATABASE_URL?.replace(
  ':5432',
  ':6543?pgbouncer=true'
)
```

Or enable **Connection Pooling** in Supabase Dashboard:
1. Go to Settings > Database
2. Enable "Transaction" mode
3. Update connection strings

---

### High Memory Usage (Worker)

**Symptoms**: Worker process using >2GB RAM

**Debugging**:
```bash
# Check memory usage
pm2 monit

# Restart worker to clear memory
pm2 restart wastewise-worker
```

**Solutions**:
- Reduce `WORKER_MAX_CONCURRENT` (e.g., from 2 to 1)
- Increase server RAM
- Implement job timeout (kill jobs running >15 minutes)

---

## Backup & Recovery

### Database Backups

Supabase automatically backs up databases daily. To create manual backup:

```bash
# Export entire database
pg_dump $SUPABASE_CONNECTION_STRING > backup-$(date +%Y-%m-%d).sql

# Restore from backup
psql $SUPABASE_CONNECTION_STRING < backup-2025-11-18.sql
```

### Storage Backups

```bash
# Backup analysis reports
npx supabase storage download analysis-reports --recursive

# Restore reports
npx supabase storage upload analysis-reports backup/ --recursive
```

---

## Performance Optimization

### 1. Enable Next.js Caching

```typescript
// next.config.mjs
export default {
  experimental: {
    optimizeCss: true,
  },
  compress: true,
  swcMinify: true,
}
```

### 2. Database Query Optimization

```sql
-- Add covering indexes
CREATE INDEX idx_jobs_user_status ON analysis_jobs(user_id, status, created_at DESC);

-- Analyze tables
ANALYZE analysis_jobs;
ANALYZE projects;
```

### 3. CDN Setup

Use Vercel Edge Network (automatic) or Cloudflare:
- Cache static assets
- Cache report downloads (365-day expiry)
- Enable gzip/brotli compression

---

## Security Hardening

### 1. Rate Limiting

Already implemented in API routes (Phase 2.2):
- 10 job creations per minute
- 60 status checks per minute

### 2. Database RLS

Verify Row Level Security is enabled:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

### 3. Secrets Rotation

Rotate secrets quarterly:
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- SSL certificates (automatic with Let's Encrypt)

---

## Rollback Plan

If deployment fails:

### Vercel Rollback
```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### PM2 Rollback (VPS)
```bash
# Pull previous commit
git log --oneline
git reset --hard <previous-commit-hash>

# Rebuild and restart
pnpm build
pm2 restart all
```

### Database Rollback
```bash
# Restore from backup
psql $SUPABASE_CONNECTION_STRING < backup-previous.sql
```

---

## Conclusion

After following this guide, your WasteWise application should be:
- ✅ Deployed and accessible via HTTPS
- ✅ Worker processing jobs in background
- ✅ Database optimized with indexes
- ✅ Monitoring and health checks configured
- ✅ Backups automated
- ✅ Security hardened

For ongoing maintenance, refer to:
- [API Documentation](./API.md) for endpoint reference
- `.claude/CLAUDE.md` for project architecture
- `PHASE_7_PLAN.md` for testing checklist

---

**Last Updated:** 2025-11-18 (Phase 7)
**Maintained By:** Orchestrator Agent

**Generated with [Claude Code](https://claude.com/claude-code)**
