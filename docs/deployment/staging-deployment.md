# Staging Deployment Runbook

This runbook guides you through deploying WasteWise to a staging environment for final validation before production release.

**Target Audience**: DevOps engineers, release managers, technical leads
**Estimated Time**: 45-60 minutes (first deployment), 15-20 minutes (subsequent deployments)
**Prerequisites**: Access to Supabase project, Vercel account, Anthropic API key

---

## Overview

### Staging Environment Purpose

The staging environment serves as a production-like environment for:

- Final integration testing with real AI services
- Performance validation under realistic load
- Security testing (auth, RLS, input validation)
- User acceptance testing (UAT)
- Load testing and capacity planning
- Pre-production smoke tests

### Architecture

**Staging Stack**:

- **Frontend + API**: Vercel (serverless)
- **Database**: Supabase Cloud (managed PostgreSQL)
- **Background Worker**: Vercel Serverless Function (long-running)
- **Storage**: Supabase Storage (S3-compatible)
- **AI Services**: Anthropic API (production keys with limits)
- **Search**: Exa API (optional, for regulatory research)

**Differences from Production**:

- Lower resource limits (to save costs)
- Smaller database instance
- Test user accounts allowed
- More verbose logging
- No auto-scaling (fixed capacity)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] **All tests passing**

  ```bash
  pnpm test
  # Expected: 0 failures, all suites pass
  ```

- [ ] **TypeScript compiles with 0 errors**

  ```bash
  npx tsc --noEmit
  # Expected: no errors
  ```

- [ ] **Linting passes**

  ```bash
  pnpm lint
  # Expected: 0 errors, 0 warnings (or acceptable warnings only)
  ```

- [ ] **Calculation evals pass** (if implemented)

  ```bash
  pnpm eval
  # Expected: All calculations within 0.01% of reference
  ```

- [ ] **No console errors in E2E tests**
  - Run app locally
  - Open browser dev tools (F12)
  - Complete full workflow
  - Verify 0 console errors

### Database

- [ ] **All migrations applied**

  ```bash
  npx supabase db reset  # Local verification
  ls supabase/migrations/  # Check migration files
  ```

- [ ] **Database types generated**

  ```bash
  npx supabase gen types typescript --local > types/database.types.ts
  # Verify file is up-to-date
  ```

- [ ] **Seed data script works**

  ```bash
  npx tsx scripts/seed-test-data.ts
  # Should create test user and sample project
  ```

- [ ] **RLS policies defined** for all tables
  - Open Supabase Studio
  - Check each table has appropriate RLS policies
  - Verify policies are enabled

### Environment

- [ ] **Supabase Cloud project created**
  - Project name: `wastewise-staging`
  - Region: Select closest to users
  - Plan: Free or Pro (depending on load)

- [ ] **Anthropic API key obtained**
  - Sign up at https://console.anthropic.com/
  - Create API key
  - Add credits ($20 recommended for staging)
  - Test key works: `curl https://api.anthropic.com/v1/messages -H "x-api-key: YOUR_KEY"`

- [ ] **Exa API key obtained** (optional)
  - Sign up at https://exa.ai/
  - Create API key (if using regulatory research)

- [ ] **Vercel account set up**
  - Sign up at https://vercel.com/
  - Import GitHub repository
  - Connect to staging environment

### Security

- [ ] **Environment variables documented**
  - List all required env vars
  - Document what each one does
  - Identify which are secrets (never log these)

- [ ] **Secrets not in code**
  - Search codebase: `grep -r "sk-ant-" .` (should return 0 results)
  - Search codebase: `grep -r "password" .` (check results aren't hardcoded)

- [ ] **CORS configured**
  - Allowed origins documented
  - No wildcard `*` in production-like environments

- [ ] **Rate limiting tested**
  - API endpoints have rate limits
  - Test that limits work as expected

### Monitoring

- [ ] **Logging configured**
  - Decide where logs go (Vercel logs, external service)
  - Ensure sensitive data not logged (PII, API keys)

- [ ] **Health check endpoint exists**

  ```bash
  curl http://localhost:3000/api/health
  # Should return 200 OK
  ```

- [ ] **Error tracking set up** (optional but recommended)
  - Sentry, Rollbar, or similar
  - Test errors are captured

---

## Deployment Steps

### Step 1: Set Up Supabase Cloud

#### Create Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `wastewise-staging`
   - **Database Password**: Generate strong password (save in password manager)
   - **Region**: `us-east-1` (or closest to users)
   - **Plan**: Free (or Pro if needed)
4. Click **"Create New Project"**
5. Wait 2-5 minutes for provisioning

#### Configure Project

1. **Get Connection Details**:
   - Go to **Project Settings** → **API**
   - Copy:
     - `URL` (e.g., https://xxxxx.supabase.co)
     - `anon public` key
     - `service_role` key (keep secret!)

2. **Run Migrations**:

   ```bash
   # Link to remote project
   npx supabase link --project-ref xxxxx

   # Enter database password when prompted

   # Push migrations
   npx supabase db push

   # Verify migrations applied
   npx supabase db remote inspect
   ```

3. **Create Test User**:
   - Go to **Authentication** → **Users**
   - Click **"Add User"**
   - Email: `staging-test@wastewise.local`
   - Password: Generate strong password
   - Auto-confirm user: ✅
   - Click **"Create User"**

4. **Configure Storage**:
   - Go to **Storage**
   - Create bucket: `reports`
   - Set to **Public** (for report downloads)
   - Configure CORS if needed

5. **Verify RLS**:
   - Go to **Database** → **Tables**
   - Check each table shows "RLS enabled"
   - Click table → **RLS Policies** tab
   - Verify policies exist

#### Seed Test Data (Optional)

For staging testing:

```bash
# Set environment to staging
export NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run seed script
npx tsx scripts/seed-test-data.ts

# Verify in Supabase Studio
# Should see:
# - Test user
# - Sample project
# - 6 invoices
# - 22 haul log entries
```

### Step 2: Deploy to Vercel

#### Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import from GitHub:
   - Select repository: `wastewise-saas`
   - Click **"Import"**

#### Configure Build Settings

1. **Framework Preset**: Next.js
2. **Root Directory**: `./` (default)
3. **Build Command**: `pnpm build`
4. **Output Directory**: `.next` (default)
5. **Install Command**: `pnpm install`

#### Set Environment Variables

Click **"Environment Variables"** and add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Services
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Search (optional)
EXA_API_KEY=your-exa-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://wastewise-staging.vercel.app
NODE_ENV=production

# Worker Configuration
WORKER_POLL_INTERVAL_MS=5000
WORKER_CONCURRENCY=1
```

**Important**:

- Mark `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` as **sensitive** (not shown in logs)
- Select **"All Environments"** or just **"Production"** (Vercel's "production" = our staging)

#### Deploy

1. Click **"Deploy"**
2. Wait 3-5 minutes for build
3. Deployment should succeed
4. Note the URL: `https://wastewise-staging.vercel.app` (or custom domain)

### Step 3: Deploy Background Worker

The worker needs to run as a long-running process, not a serverless function.

**Option A: Vercel Cron Job** (Recommended for Staging)

1. Create `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/worker",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. Create `app/api/worker/route.ts`:

   ```typescript
   import { NextResponse } from "next/server";
   import { processAnalysisJobs } from "@/scripts/worker";

   export const maxDuration = 300; // 5 minutes

   export async function GET() {
     await processAnalysisJobs();
     return NextResponse.json({ status: "ok" });
   }
   ```

3. Redeploy to Vercel

**Option B: Separate VPS** (Better for Production)

See [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for VPS setup.

**Option C: Railway/Render** (Alternative)

Deploy worker as standalone service on Railway or Render.

### Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add domain: `staging.wastewise.com`
3. Configure DNS:
   - Type: `CNAME`
   - Name: `staging`
   - Value: `cname.vercel-dns.com`
4. Wait for DNS propagation (5-30 minutes)
5. Verify SSL certificate issued automatically

### Step 5: Update CORS and Allowed Origins

In Supabase dashboard:

1. Go to **Settings** → **API**
2. Scroll to **CORS Settings**
3. Add allowed origin: `https://wastewise-staging.vercel.app`
4. Click **"Save"**

### Step 6: Verify Deployment Health

Run through these checks:

1. **Health Check**:

   ```bash
   curl https://wastewise-staging.vercel.app/api/health
   # Expected: {"status":"ok"}
   ```

2. **Landing Page**:
   - Visit https://wastewise-staging.vercel.app
   - Should load without errors
   - Check browser console (F12) for errors

3. **Authentication**:
   - Click **"Sign In"**
   - Use staging test credentials
   - Should successfully authenticate

4. **Database Connection**:
   - After sign in, navigate to Dashboard
   - Should load user's projects (or empty state)
   - Check browser console for errors

5. **API Endpoints**:
   ```bash
   # Test projects endpoint (requires auth token)
   curl https://wastewise-staging.vercel.app/api/projects \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   # Expected: 200 OK with project list
   ```

---

## Post-Deployment Verification

### Functional Tests

- [ ] **User can sign up**
  - Create new account
  - Verify email confirmation works
  - Check user appears in Supabase Auth

- [ ] **User can create project**
  - Navigate to "New Analysis"
  - Fill in project details
  - Submit form
  - Verify project appears in database

- [ ] **User can upload files**
  - Select invoice files
  - Upload files
  - Verify files appear in Supabase Storage

- [ ] **Analysis job runs**
  - Click "Start Analysis"
  - Verify job created in `analysis_jobs` table
  - Wait for worker to pick up job
  - Verify job completes successfully

- [ ] **Reports generate**
  - Check Excel report downloads
  - Check HTML dashboard downloads
  - Open both files locally and verify content

### Performance Tests

- [ ] **Page load times**
  - Landing page: < 2 seconds
  - Dashboard: < 3 seconds
  - Results page: < 3 seconds

- [ ] **Analysis completion time**
  - Small project (1-3 invoices): < 2 minutes
  - Medium project (4-6 invoices): < 4 minutes
  - Large project (7-12 invoices): < 6 minutes

- [ ] **API response times**
  - GET /api/projects: < 500ms
  - POST /api/analyze: < 1s (just creates job)
  - GET /api/jobs/[id]: < 200ms

### Security Tests

- [ ] **RLS works**
  - User can only see own projects
  - User cannot access other users' data
  - Test with multiple accounts

- [ ] **Authentication required**
  - Cannot access dashboard without login
  - API returns 401 for unauthenticated requests

- [ ] **Input validation**
  - Try invalid inputs in forms
  - Verify appropriate error messages
  - No crashes or 500 errors

- [ ] **Rate limiting active**
  - Make rapid API requests
  - Verify rate limit kicks in (429 error)

### Integration Tests

- [ ] **Anthropic API integration**
  - Upload real invoice
  - Verify extraction works
  - Check no API errors

- [ ] **Supabase Storage**
  - Upload files
  - Download reports
  - Verify public URLs work

- [ ] **Email notifications** (if implemented)
  - Complete analysis
  - Verify email sent
  - Check email formatting

---

## Rollback Procedure

If deployment fails or critical issues found:

### Immediate Rollback (Vercel)

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Find previous stable deployment
4. Click **"⋯"** → **"Promote to Production"**
5. Confirm promotion
6. Previous version restored in ~30 seconds

### Database Rollback (If Migration Failed)

```bash
# Connect to staging database
npx supabase link --project-ref xxxxx

# Revert last migration
npx supabase migration repair --status reverted

# Or restore from backup
# In Supabase dashboard: Database → Backups → Restore
```

### Communicate Rollback

1. Post in #wastewise-dev Slack channel
2. Update deployment log
3. Create incident report
4. Schedule post-mortem

---

## Post-Deployment Tasks

### Monitoring Setup

- [ ] **Configure alerts**
  - Vercel: Set up error alerts
  - Supabase: Set up performance alerts
  - Set thresholds (e.g., >5% error rate)

- [ ] **Set up uptime monitoring**
  - Use Uptime Robot, Pingdom, or similar
  - Monitor https://wastewise-staging.vercel.app/api/health
  - Check every 5 minutes
  - Alert if down >2 consecutive checks

- [ ] **Review logs**
  - Vercel logs: Check for errors
  - Supabase logs: Check for slow queries
  - Worker logs: Verify jobs processing

### Documentation

- [ ] **Update deployment log**
  - Document deployment date/time
  - Record any issues encountered
  - Note configuration changes

- [ ] **Update team**
  - Notify in #wastewise-dev
  - Share staging URL
  - Provide test credentials
  - Request UAT feedback

- [ ] **Create smoke test checklist**
  - Document critical paths
  - Assign testers
  - Set deadline for feedback

### Testing Phase

- [ ] **Internal testing** (1-2 days)
  - Dev team tests all features
  - Log bugs in GitHub Issues
  - Fix critical bugs before UAT

- [ ] **User acceptance testing** (2-3 days)
  - Invite select users
  - Provide test instructions
  - Collect feedback
  - Prioritize fixes

- [ ] **Load testing** (optional)
  - Use k6, Artillery, or similar
  - Simulate 10-50 concurrent users
  - Verify no degradation

- [ ] **Security scan** (optional)
  - Run OWASP ZAP or similar
  - Fix any high-priority vulnerabilities

---

## Next Deployment

### Incremental Updates

For subsequent staging deployments:

1. **Merge PR to master**
2. **Automatic deployment**:
   - Vercel auto-deploys on push to master
   - No manual steps needed
3. **Verify deployment**:
   - Check health endpoint
   - Run smoke tests
4. **Monitor for 1 hour**:
   - Watch logs for errors
   - Check performance metrics

### Promotion to Production

Once staging is stable:

1. **Tag release**:

   ```bash
   git tag -a v1.0.0 -m "Production release 1.0.0"
   git push origin v1.0.0
   ```

2. **Deploy to production**:
   - Follow production deployment guide
   - Use separate Vercel project
   - Use production Supabase project

3. **Gradual rollout**:
   - Enable for 10% of users
   - Monitor metrics
   - Increase to 50%, then 100%

---

## Appendix: Environment Variables Reference

### Required Variables

| Variable                        | Example                         | Description                      |
| ------------------------------- | ------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxx.supabase.co`       | Supabase project URL             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...`                    | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGc...`                    | Service role key (SECRET)        |
| `ANTHROPIC_API_KEY`             | `sk-ant-...`                    | Anthropic API key (SECRET)       |
| `NEXT_PUBLIC_APP_URL`           | `https://staging.wastewise.com` | Application URL                  |
| `NODE_ENV`                      | `production`                    | Node environment                 |

### Optional Variables

| Variable                  | Example                     | Description                         |
| ------------------------- | --------------------------- | ----------------------------------- |
| `EXA_API_KEY`             | `exa_...`                   | Exa search API key (for regulatory) |
| `WORKER_POLL_INTERVAL_MS` | `5000`                      | Worker polling interval             |
| `WORKER_CONCURRENCY`      | `1`                         | Max concurrent jobs                 |
| `SENTRY_DSN`              | `https://...@sentry.io/...` | Error tracking (if using Sentry)    |

---

## Troubleshooting

### Deployment Fails

**Error**: Build fails on Vercel

**Solutions**:

1. Check build logs for specific error
2. Verify `pnpm build` works locally
3. Check all dependencies in `package.json`
4. Verify environment variables set correctly

### Worker Not Processing

**Error**: Jobs stuck in 'pending' status

**Solutions**:

1. Check worker logs in Vercel dashboard
2. Verify `ANTHROPIC_API_KEY` is set and valid
3. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Verify cron job configured in `vercel.json`

### Database Connection Error

**Error**: "Could not connect to database"

**Solutions**:

1. Verify Supabase project is running
2. Check connection string format
3. Verify service role key is correct
4. Check RLS policies aren't blocking queries

### CORS Errors

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:

1. Add staging domain to Supabase CORS settings
2. Verify `NEXT_PUBLIC_APP_URL` matches actual URL
3. Check `next.config.js` headers configuration

---

**Built with ❤️ by THE Trash Hub**

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Document Owner**: DevOps Team
