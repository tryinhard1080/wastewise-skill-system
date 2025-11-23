# WasteWise Deployment Guide

**Version**: 2.0.0
**Last Updated**: 2025-11-21
**Prerequisites**: Node.js 20+, pnpm, Railway CLI, Git

Complete step-by-step guide for deploying WasteWise to Railway production.

See `DEPLOYMENT_ARCHITECTURE.md` for detailed architecture design.

---

## Quick Start

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and link project
railway login
railway link

# 3. Configure environment variables in Railway dashboard

# 4. Deploy to staging
pnpm deploy:staging

# 5. Verify and deploy to production
pnpm deploy:production
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles (`pnpm tsc --noEmit`)
- [ ] Environment variables validated (`pnpm validate:env --strict`)
- [ ] Staging deployment tested
- [ ] No uncommitted changes (`git status`)

### Deployment

- [ ] Run deployment script (`pnpm deploy:production`)
- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] Logs show no errors

### Post-Deployment

- [ ] Monitor Sentry for errors (30 minutes)
- [ ] Check Railway metrics (CPU, memory)
- [ ] Verify worker processing jobs
- [ ] Test complete user flow

---

## Railway Setup

### 1. Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Verify email

### 2. Create New Project

```bash
# Via CLI
railway init

# Or via dashboard:
# https://railway.app/new
```

### 3. Create Two Services

**Web Service** (Next.js):

- Name: `wastewise-web`
- Source: GitHub repository
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`
- Port: 3000 (auto-detected)

**Worker Service** (Background Jobs):

- Name: `wastewise-worker`
- Source: Same GitHub repository
- Build Command: `pnpm install && pnpm build:worker`
- Start Command: `pnpm start:worker`
- No public port (internal only)

### 4. Configure Environment Variables

Add these in Railway dashboard → Variables:

```bash
# Required for both services
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=project-files
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://wastewise.railway.app
NODE_ENV=production

# Recommended
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
```

---

## Deployment Process

### Staging Deployment

```bash
# 1. Validate environment
pnpm validate:env

# 2. Run tests
pnpm test

# 3. Deploy to staging
pnpm deploy:staging

# 4. Verify health endpoint
curl https://wastewise-staging.railway.app/api/health
```

### Production Deployment

```bash
# Full deployment with all safety checks
pnpm deploy:production
```

This script:

1. Validates environment (strict mode)
2. Runs all tests
3. Creates git tag
4. Deploys to Railway
5. Runs health checks
6. Creates Sentry release

---

## Rollback

If deployment fails:

```bash
# Automatic rollback
pnpm rollback

# Or via Railway dashboard:
# 1. Go to Deployments tab
# 2. Find last known good deployment
# 3. Click "Redeploy"
```

---

## Monitoring

### Health Checks

Railway monitors `/api/health` every 30 seconds:

```bash
# Test health endpoint
curl https://wastewise.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T12:00:00Z",
  "checks": {
    "database": "connected",
    "storage": "accessible",
    "sentry": "configured"
  }
}
```

### Error Tracking

View errors at: https://sentry.io/organizations/your-org/issues/

### Logs

```bash
# Web service logs
railway logs --service web

# Worker service logs
railway logs --service worker

# Follow logs in real-time
railway logs --follow
```

---

## Troubleshooting

### Build Fails

```bash
# Test build locally
pnpm build

# Check TypeScript errors
pnpm tsc --noEmit

# Check for missing dependencies
pnpm install
```

### Health Checks Fail

1. Check Supabase connectivity
2. Verify environment variables
3. Check Railway logs for errors
4. Restart service if needed

### Worker Not Processing Jobs

1. Check worker logs: `railway logs --service worker`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check database connection limits
4. Restart worker: `railway restart --service worker`

---

## Additional Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) - Architecture details
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre/post deployment checklists
- [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md) - Detailed rollback guide

---

**Support**: Create issue in GitHub repository
**Railway Docs**: https://docs.railway.app
**Supabase Docs**: https://supabase.com/docs
