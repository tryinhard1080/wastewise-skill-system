# Staging Deployment Checklist

**Date**: _______________
**Deployer**: _______________
**Deployment Type**: [ ] Initial [ ] Update [ ] Hotfix
**Git Commit**: _______________

---

## Phase 1: Pre-Deployment Preparation

### 1.1 Code Quality ✅

- [ ] All TypeScript files compile without errors (`pnpm tsc --noEmit`)
- [ ] ESLint passes with 0 warnings (`pnpm lint`)
- [ ] Code formatted properly (`pnpm prettier --check .` if configured)
- [ ] No `console.log` statements in production code (except `console.error/warn/info`)
- [ ] No TODO comments in critical paths

**Command**: `pnpm run pre-deploy:checks`

### 1.2 Testing ✅

- [ ] All unit tests passing (`pnpm test:unit`)
- [ ] All integration tests passing (`pnpm test:integration`)
- [ ] Calculation evals passing (<0.01% tolerance) (`pnpm eval`)
- [ ] E2E tests passing (`pnpm test:e2e`) - Optional but recommended
- [ ] Test coverage adequate (>80% for calculations)

**Commands**:
```bash
pnpm test:unit --run
pnpm test:integration --run
pnpm eval
```

### 1.3 Database ✅

- [ ] All migrations applied locally and tested (`npx supabase db reset`)
- [ ] Seed data creates test user successfully
- [ ] RLS policies tested and enforced
- [ ] No hardcoded database credentials in code
- [ ] Database backup procedures documented

**Verification**:
```bash
npx supabase db reset
# Test with: test@wastewise.local / TestPassword123!
```

### 1.4 Environment Configuration ✅

- [ ] `.env.template` file up to date with all required variables
- [ ] No secrets in `.env.template`
- [ ] `.env.local` in `.gitignore`
- [ ] All environment variables documented
- [ ] Staging environment variables prepared (see Section 3)

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`
- `EXA_API_KEY` (optional)
- `RESEND_API_KEY` (for alerts)
- `SLACK_WEBHOOK_URL` (for alerts)
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV=production`

### 1.5 Security ✅

- [ ] No hardcoded API keys or secrets in code
- [ ] Rate limiting configured (`lib/middleware/rate-limit.ts`)
- [ ] File validation enabled (`lib/validation/file-validation.ts`)
- [ ] XSS prevention configured (DOMPurify)
- [ ] CSP headers configured (`middleware.ts`)
- [ ] Auth flow tested (signup, login, logout, forgot password)

**Security Audit Command**:
```bash
grep -r "sk-ant-" . --exclude-dir=node_modules --exclude-dir=.next
grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=__tests__
```

### 1.6 Dependencies ✅

- [ ] `pnpm-lock.yaml` in sync with `package.json`
- [ ] No critical security vulnerabilities (`pnpm audit --audit-level high`)
- [ ] All dependencies up to date (or pinned for stability)
- [ ] Production build succeeds (`pnpm build`)

**Commands**:
```bash
pnpm audit --audit-level high
pnpm build
```

### 1.7 Documentation ✅

- [ ] README.md updated with current features
- [ ] API documentation generated (`/api-docs`)
- [ ] Deployment runbook reviewed
- [ ] User guides updated
- [ ] Changelog updated with new features/fixes

---

## Phase 2: Supabase Setup

### 2.1 Create Staging Project

- [ ] Create new Supabase project for staging
- [ ] Note project reference ID: _______________
- [ ] Configure project settings (region, database password)
- [ ] Enable required extensions (uuid-ossp, etc.)

**Supabase Dashboard**: https://supabase.com/dashboard

### 2.2 Link Local to Staging

```bash
npx supabase login
npx supabase link --project-ref <staging-project-ref>
```

- [ ] Successfully linked to staging project
- [ ] Verified connection (`npx supabase db diff`)

### 2.3 Push Database Migrations

```bash
npx supabase db push
```

- [ ] All migrations applied successfully
- [ ] No errors in migration output
- [ ] Verified schema in Supabase Studio

**Verify Tables Created**:
- [ ] `profiles`
- [ ] `projects`
- [ ] `project_files`
- [ ] `invoice_data`
- [ ] `haul_log`
- [ ] `optimizations`
- [ ] `contract_terms`
- [ ] `regulatory_compliance`
- [ ] `analysis_jobs`
- [ ] `user_roles`
- [ ] `admin_audit_log`
- [ ] `job_alerts`

### 2.4 Configure Storage Buckets

- [ ] Create `invoices` bucket
- [ ] Create `contracts` bucket
- [ ] Create `reports` bucket
- [ ] Configure storage policies (RLS)
- [ ] Set file size limits (10MB per file)

**Supabase Studio → Storage → New Bucket**

### 2.5 Seed Test Data (Optional)

```bash
# Copy seed.sql to Supabase SQL editor and run
```

- [ ] Test user created: `test@wastewise.local`
- [ ] Test project created: Riverside Gardens
- [ ] Can login and access test project

---

## Phase 3: Frontend Deployment (Vercel/Netlify)

### 3.1 Connect Git Repository

- [ ] Repository connected to Vercel/Netlify
- [ ] Build command configured: `pnpm build`
- [ ] Output directory: `.next`
- [ ] Install command: `pnpm install`

### 3.2 Configure Environment Variables

**In Vercel/Netlify Dashboard → Settings → Environment Variables**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase>
SUPABASE_SERVICE_KEY=<service-key-from-supabase>

# AI Services
ANTHROPIC_API_KEY=<your-anthropic-key>

# Search (optional)
EXA_API_KEY=<your-exa-key>

# Alerting (optional but recommended)
RESEND_API_KEY=<your-resend-key>
SLACK_WEBHOOK_URL=<your-slack-webhook>

# App Configuration
NEXT_PUBLIC_APP_URL=https://staging.wastewise.io
NODE_ENV=production
```

- [ ] All environment variables configured
- [ ] Values verified (no typos)
- [ ] Secrets marked as "Secret" (hidden)

### 3.3 Deploy Frontend

```bash
# Push to staging branch (if auto-deploy configured)
git push origin master:staging

# OR manual deploy via CLI
vercel --prod
```

- [ ] Deployment initiated
- [ ] Build logs show no errors
- [ ] Deployment URL: _______________
- [ ] Custom domain configured (if applicable)

### 3.4 Verify Frontend Deployment

- [ ] Site loads at deployment URL
- [ ] No console errors in browser DevTools
- [ ] Landing page renders correctly
- [ ] Auth pages accessible (/login, /signup)
- [ ] Health check returns 200 (`/api/health`)

**Test URLs**:
- [ ] `https://staging.wastewise.io`
- [ ] `https://staging.wastewise.io/api/health`
- [ ] `https://staging.wastewise.io/login`
- [ ] `https://staging.wastewise.io/api-docs`

---

## Phase 4: Worker Deployment

### 4.1 Choose Deployment Method

**Option A: Docker Container** (Recommended)

- [ ] Dockerfile.worker exists and tested locally
- [ ] Docker registry accessible
- [ ] Container orchestration configured (ECS, Cloud Run, etc.)

**Option B: Long-Running Server**

- [ ] Server provisioned (VM, VPS, etc.)
- [ ] Node.js 20+ installed
- [ ] pnpm installed globally
- [ ] systemd service configured

### 4.2 Deploy Worker (Option A: Docker)

```bash
# Build worker image
docker build -f Dockerfile.worker -t wastewise-worker:staging .

# Tag for registry
docker tag wastewise-worker:staging registry.example.com/wastewise-worker:staging

# Push to registry
docker push registry.example.com/wastewise-worker:staging

# Deploy to container service (example: AWS ECS)
aws ecs update-service --cluster wastewise-staging --service worker --force-new-deployment
```

- [ ] Image built successfully
- [ ] Image pushed to registry
- [ ] Container deployed and running
- [ ] Logs show "Worker started - polling for jobs"

### 4.3 Deploy Worker (Option B: Server)

```bash
# SSH to staging server
ssh staging.wastewise.io

# Clone repository
cd /opt
sudo git clone https://github.com/your-org/wastewise-saas.git
cd wastewise-saas

# Install dependencies
pnpm install --frozen-lockfile

# Create .env file
sudo nano .env
# Paste environment variables

# Setup systemd service
sudo cp deploy/worker.service /etc/systemd/system/wastewise-worker.service
sudo systemctl daemon-reload
sudo systemctl enable wastewise-worker
sudo systemctl start wastewise-worker

# Verify service running
sudo systemctl status wastewise-worker
```

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Systemd service created and enabled
- [ ] Worker running (green status)

### 4.4 Verify Worker Deployment

```bash
# Check worker health
curl https://staging.wastewise.io/api/health/worker

# Check worker logs
sudo journalctl -u wastewise-worker -f  # If systemd
docker logs wastewise-worker -f         # If Docker
```

- [ ] Worker health endpoint returns 200
- [ ] Logs show job polling activity
- [ ] No errors in logs
- [ ] Worker connects to database successfully
- [ ] Worker can access Anthropic API

---

## Phase 5: Verification & Smoke Tests

### 5.1 Automated Smoke Tests

```bash
# Run smoke tests against staging
STAGING_URL=https://staging.wastewise.io pnpm run smoke-tests
```

- [ ] All smoke tests passing
- [ ] Health checks: ✅
- [ ] Auth flow: ✅
- [ ] API endpoints: ✅
- [ ] Worker status: ✅

### 5.2 Manual End-to-End Test

**Test Account**:
- Email: `test@wastewise.local`
- Password: `TestPassword123!`

**Complete Workflow**:

1. [ ] **Login**
   - Navigate to https://staging.wastewise.io/login
   - Login with test credentials
   - Redirected to dashboard

2. [ ] **Create Project**
   - Click "New Project"
   - Fill in details (Riverside Gardens, 250 units, Compactor, Austin TX)
   - Click "Create"
   - Project appears in list

3. [ ] **Upload Files**
   - Click on project
   - Upload sample invoice (PDF)
   - File appears in list
   - No upload errors

4. [ ] **Start Analysis**
   - Click "Start Analysis"
   - Redirected to processing page
   - Progress bar shows 0%

5. [ ] **Monitor Progress**
   - Progress updates every 2 seconds
   - Current step shows (e.g., "Extracting invoice data")
   - Check worker logs to confirm job processing

6. [ ] **Review Results**
   - Analysis completes (progress = 100%)
   - Redirected to results page
   - Executive summary shows metrics
   - Optimization recommendations displayed

7. [ ] **Download Reports**
   - Click "Download Excel Report"
   - Excel file downloads successfully
   - Click "Download HTML Dashboard"
   - HTML file downloads successfully

8. [ ] **Verify Reports**
   - Open Excel file
   - 5 tabs present (Dashboard, Expenses, Haul Log, Optimization, Contract)
   - Data populated correctly
   - Open HTML file
   - Interactive charts render
   - Tables are filterable

### 5.3 Performance Verification

```bash
# Lighthouse audit
pnpm lighthouse https://staging.wastewise.io

# Load test (optional)
pnpm load-test https://staging.wastewise.io
```

- [ ] Lighthouse Performance score >90
- [ ] Page load time <2 seconds
- [ ] Mobile responsive (375px-1440px)
- [ ] No console errors

### 5.4 Security Verification

- [ ] Rate limiting works (try >100 requests/min)
- [ ] File validation rejects invalid files
- [ ] Auth required for protected routes
- [ ] RLS policies enforced (can't access other users' data)
- [ ] XSS protection working

### 5.5 Error Handling

- [ ] 404 page renders for invalid routes
- [ ] 500 page renders for server errors
- [ ] Graceful handling of network errors
- [ ] User-friendly error messages

---

## Phase 6: Monitoring Setup

### 6.1 Error Tracking (Optional but Recommended)

**Sentry Integration**:

- [ ] Sentry project created for staging
- [ ] `NEXT_PUBLIC_SENTRY_DSN` configured
- [ ] Test error sent and received in Sentry
- [ ] Alerts configured for critical errors

### 6.2 Health Check Monitoring

**Uptime Monitoring** (e.g., UptimeRobot, Pingdom):

- [ ] Monitor added for `https://staging.wastewise.io/api/health`
- [ ] Check interval: 5 minutes
- [ ] Alert contact configured
- [ ] Notification channel set up (email, Slack)

### 6.3 Database Monitoring

**Supabase Dashboard**:

- [ ] Database size monitored
- [ ] Connection pool monitored
- [ ] Query performance reviewed
- [ ] Slow queries identified (if any)

### 6.4 Worker Monitoring

- [ ] Worker health check endpoint monitored
- [ ] Job processing rate tracked
- [ ] Job failure alerts configured
- [ ] Worker CPU/memory monitored

**Alert Thresholds**:
- Job failure rate >10% → Send alert
- Worker down >5 minutes → Send alert
- Database connections >80% → Send alert

---

## Phase 7: Post-Deployment Tasks

### 7.1 Documentation Updates

- [ ] Update deployment log with timestamp and commit SHA
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned
- [ ] Share staging URL with team

**Deployment Log Entry**:
```
Date: 2025-11-22
Deployer: [Name]
Commit: [SHA]
Frontend URL: https://staging.wastewise.io
Worker: Docker container on AWS ECS
Issues: None
Notes: First staging deployment
```

### 7.2 Team Notification

- [ ] Notify team of successful deployment
- [ ] Share staging credentials
- [ ] Request team to test critical workflows
- [ ] Schedule user acceptance testing

**Notification Template**:
```
✅ Staging Deployment Complete

URL: https://staging.wastewise.io
Test Credentials: test@wastewise.local / TestPassword123!

Please test:
- Login/logout
- Create project
- Upload files
- Run analysis
- Download reports

Report any issues in #staging-feedback
```

### 7.3 Beta User Invitations

- [ ] Identify 3-5 beta testers
- [ ] Send invitations with credentials
- [ ] Provide user guide link
- [ ] Schedule feedback session

**Beta Tester Checklist**:
- [ ] User 1: [Name/Email]
- [ ] User 2: [Name/Email]
- [ ] User 3: [Name/Email]
- [ ] User 4: [Name/Email]
- [ ] User 5: [Name/Email]

### 7.4 Monitoring Period

- [ ] Monitor for first 2 hours (actively)
- [ ] Monitor for first 24 hours (periodic checks)
- [ ] Review error logs daily for first week
- [ ] Check job success rate daily

**Issues Found**: _______________________________________________

**Resolution**: _______________________________________________

---

## Phase 8: Rollback Plan (If Needed)

### 8.1 When to Rollback

Rollback if any of the following occur:

- [ ] Critical functionality broken (can't create projects, analysis fails)
- [ ] Database corruption or data loss
- [ ] Security vulnerability discovered
- [ ] >50% job failure rate
- [ ] Worker constantly crashing

### 8.2 Rollback Frontend

```bash
# Vercel
vercel rollback <previous-deployment-url>

# OR re-deploy previous commit
git revert HEAD
git push origin staging
```

- [ ] Previous version deployed
- [ ] Verified site works
- [ ] Notified team of rollback

### 8.3 Rollback Database

```bash
# Identify problematic migration
npx supabase db diff

# Revert migration
npx supabase migration repair <migration-name> --status reverted
npx supabase db push
```

- [ ] Migration reverted
- [ ] Schema verified
- [ ] Data integrity checked

### 8.4 Rollback Worker

```bash
# Docker
docker service update --image registry.example.com/wastewise-worker:<previous-tag>

# Systemd
cd /opt/wastewise-saas
git checkout <previous-commit>
pnpm install --frozen-lockfile
sudo systemctl restart wastewise-worker
```

- [ ] Previous worker version deployed
- [ ] Worker running successfully
- [ ] Jobs processing normally

### 8.5 Post-Rollback

- [ ] Document reason for rollback
- [ ] Create incident report
- [ ] Plan fix and re-deployment
- [ ] Notify stakeholders

---

## Sign-Off

**Pre-Deployment Checks**: [ ] Complete
**Supabase Setup**: [ ] Complete
**Frontend Deployment**: [ ] Complete
**Worker Deployment**: [ ] Complete
**Smoke Tests**: [ ] Passed
**Monitoring Setup**: [ ] Complete
**Post-Deployment Tasks**: [ ] Complete

**Overall Status**: [ ] Success [ ] Success with Issues [ ] Failed

**Signed**: _______________
**Date**: _______________
**Next Steps**: _______________________________________________

---

## Appendix: Useful Commands

### Quick Health Checks
```bash
# Frontend health
curl https://staging.wastewise.io/api/health

# Worker health
curl https://staging.wastewise.io/api/health/worker

# Database connection
npx supabase db ping
```

### Log Viewing
```bash
# Vercel logs
vercel logs

# Worker logs (systemd)
sudo journalctl -u wastewise-worker -f

# Worker logs (Docker)
docker logs wastewise-worker -f
```

### Database Operations
```bash
# View schema
npx supabase db dump --schema-only

# Create migration
npx supabase migration new migration-name

# Reset database (CAUTION)
npx supabase db reset
```

### Emergency Contacts
- **Technical Lead**: _______________
- **DevOps**: _______________
- **On-Call Engineer**: _______________

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Maintained By**: WasteWise DevOps Team
