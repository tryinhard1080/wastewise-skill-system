# Production Deployment Checklist

**Date**: ******\_\_\_******
**Deployer**: ******\_\_\_******
**Deployment Type**: [ ] Initial [ ] Update [ ] Hotfix [ ] Rollback
**Git Commit**: ******\_\_\_******
**Staging Validation**: [ ] Complete [ ] Partial [ ] Skipped (explain): ******\_\_\_******

---

## ⚠️ CRITICAL: Pre-Deployment Requirements

**Before proceeding, ALL of the following MUST be true**:

- [ ] ✅ Staging deployment successful and stable for 48+ hours
- [ ] ✅ Beta users tested on staging with no critical issues
- [ ] ✅ All critical bugs from staging fixed
- [ ] ✅ Load testing completed (100+ concurrent users)
- [ ] ✅ Security audit passed
- [ ] ✅ Backup systems tested and verified
- [ ] ✅ Rollback plan documented and tested
- [ ] ✅ Monitoring and alerting configured
- [ ] ✅ Stakeholder approval obtained
- [ ] ✅ Deployment window scheduled (off-peak hours)

**If ANY item is unchecked, STOP and complete it before proceeding.**

---

## Phase 1: Pre-Deployment Validation (30 minutes)

### 1.1 Staging Verification ✅

- [ ] Staging has been running for 48+ hours
- [ ] No critical errors in last 48 hours
- [ ] Job success rate >95%
- [ ] Worker uptime >99%
- [ ] Database performance acceptable
- [ ] No security incidents

**Staging Metrics**:

- Job success rate: **\_\_\_\_**%
- Average response time: **\_\_**ms
- Error rate: **\_\_\_\_**%
- Uptime: **\_\_\_\_**%

---

### 1.2 Code Quality (STRICT) ✅

```bash
pnpm run pre-deploy:checks
```

**MUST PASS ALL**:

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Unit tests: 100% passing
- [ ] Integration tests: 100% passing
- [ ] E2E tests: 100% passing
- [ ] Calculation evals: <0.01% tolerance
- [ ] Performance tests: Lighthouse >90
- [ ] Security scan: 0 high/critical vulnerabilities

**Do NOT proceed if any check fails.**

---

### 1.3 Production Environment Preparation ✅

- [ ] Production Supabase project created
- [ ] Production database backed up
- [ ] Production environment variables prepared
- [ ] SSL certificates valid (expires >30 days)
- [ ] CDN configured (if using)
- [ ] DNS records ready
- [ ] Custom domain verified

**Environment Variables Checklist**:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
- [ ] `SUPABASE_SERVICE_KEY` (production)
- [ ] `ANTHROPIC_API_KEY` (production key, not dev)
- [ ] `EXA_API_KEY` (production)
- [ ] `RESEND_API_KEY` (production)
- [ ] `SLACK_WEBHOOK_URL` (production channel)
- [ ] `PAGERDUTY_API_KEY` (if using)
- [ ] `SENTRY_DSN` (production project)
- [ ] `NEXT_PUBLIC_APP_URL=https://app.wastewise.io`
- [ ] `NODE_ENV=production`

---

### 1.4 Monitoring & Alerting Setup ✅

**Sentry (Error Tracking)**:

- [ ] Production project created
- [ ] DSN configured in environment variables
- [ ] Source maps upload configured
- [ ] Release tracking enabled
- [ ] Alert rules configured (critical errors → Slack/PagerDuty)
- [ ] Test error sent and received

**Uptime Monitoring** (UptimeRobot, Pingdom, etc.):

- [ ] Frontend health check (https://app.wastewise.io/api/health)
- [ ] Worker health check (https://app.wastewise.io/api/health/worker)
- [ ] Check interval: 1 minute
- [ ] Alert channels: Email + Slack + SMS
- [ ] Incident escalation configured

**Database Monitoring**:

- [ ] Supabase database metrics enabled
- [ ] Connection pool alerts (>80% → warning)
- [ ] Query performance tracking
- [ ] Storage alerts (>80% → warning)
- [ ] Daily backup configured

**Worker Monitoring**:

- [ ] Job processing rate tracked
- [ ] Job failure rate alerts (>10% → critical)
- [ ] Worker crash alerts (immediate)
- [ ] Queue depth alerts (>100 pending → warning)

---

### 1.5 Backup & Recovery Verification ✅

```bash
# Test backup script
bash scripts/backup-database.sh

# Test restore script (on staging!)
bash scripts/restore-database.sh
```

- [ ] Automated daily backups configured
- [ ] Backup retention policy: 90 days
- [ ] Backup storage: S3/R2 with encryption
- [ ] Backup verification tested (restore on staging)
- [ ] Point-in-time recovery enabled
- [ ] RTO (Recovery Time Objective): <1 hour
- [ ] RPO (Recovery Point Objective): <15 minutes

**Backup Schedule**:

- Daily: Full database backup at 2 AM UTC
- Weekly: Complete system snapshot (Sunday 3 AM UTC)
- Monthly: Archival backup (first Sunday of month)

---

### 1.6 Team Readiness ✅

- [ ] All team members notified of deployment window
- [ ] On-call engineer assigned: ******\_\_\_******
- [ ] Backup engineer assigned: ******\_\_\_******
- [ ] Stakeholder communication plan ready
- [ ] User notification drafted (if downtime expected)
- [ ] Status page updated (if using)

**Deployment Window**:

- Start: ******\_\_\_****** (UTC)
- Expected duration: ******\_\_\_******
- Rollback deadline: ******\_\_\_****** (if issues found)

---

## Phase 2: Database Migration (15 minutes)

### 2.1 Production Database Setup

**Create Production Supabase Project**:

- [ ] Project created: wastewise-production
- [ ] Region: ******\_\_\_****** (closest to users)
- [ ] Database password: ******\_\_\_****** (stored securely)
- [ ] Project reference ID: ******\_\_\_******

```bash
# Link to production
npx supabase login
npx supabase link --project-ref <production-ref>
```

- [ ] Successfully linked to production

---

### 2.2 Pre-Migration Backup

```bash
# Backup production database BEFORE migration
bash scripts/backup-database.sh
```

- [ ] Pre-migration backup completed
- [ ] Backup file location: ******\_\_\_******
- [ ] Backup verified (checksum): ******\_\_\_******

---

### 2.3 Run Migrations

```bash
# Dry run first (check what will happen)
npx supabase db diff

# Push migrations
npx supabase db push
```

- [ ] Dry run reviewed (no unexpected changes)
- [ ] Migrations applied successfully
- [ ] No errors in migration output
- [ ] All tables created
- [ ] All RPC functions created
- [ ] All RLS policies applied

**Verify Schema**:

- [ ] 12 tables exist (profiles, projects, analysis_jobs, etc.)
- [ ] All indexes created
- [ ] All constraints applied
- [ ] Storage buckets created (invoices, contracts, reports)

---

### 2.4 Post-Migration Verification

```bash
# Query database to verify
psql $DATABASE_URL -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

- [ ] Expected table count: 12
- [ ] RPC functions callable
- [ ] RLS policies enforced
- [ ] Database performance acceptable

---

## Phase 3: Frontend Deployment (20 minutes)

### 3.1 Vercel/Netlify Production Setup

**Connect Repository**:

- [ ] Production project created
- [ ] Git branch: `master` (or `main`)
- [ ] Build command: `pnpm build`
- [ ] Output directory: `.next`
- [ ] Install command: `pnpm install`
- [ ] Node version: 20.x

---

### 3.2 Environment Variables (Production)

**Copy ALL environment variables to production**:

```bash
# Supabase (PRODUCTION credentials)
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_KEY=<prod-service-key>

# AI Services (PRODUCTION API keys)
ANTHROPIC_API_KEY=<prod-anthropic-key>

# Search (PRODUCTION)
EXA_API_KEY=<prod-exa-key>

# Alerting (PRODUCTION channels)
RESEND_API_KEY=<prod-resend-key>
SLACK_WEBHOOK_URL=<prod-slack-webhook>  # #production-alerts channel
PAGERDUTY_API_KEY=<prod-pagerduty-key>  # If using

# Error Tracking (PRODUCTION Sentry)
NEXT_PUBLIC_SENTRY_DSN=<prod-sentry-dsn>
SENTRY_AUTH_TOKEN=<sentry-auth-token>

# App Configuration
NEXT_PUBLIC_APP_URL=https://app.wastewise.io
NODE_ENV=production

# Security
RATE_LIMIT_MAX_REQUESTS=100  # Per minute for standard users
RATE_LIMIT_WINDOW=60000      # 1 minute in ms
```

- [ ] All environment variables configured
- [ ] Values verified (no typos)
- [ ] No staging credentials used
- [ ] Secrets marked as "Secret"
- [ ] Environment: Production

---

### 3.3 Deploy Frontend (Zero-Downtime)

**Pre-Deployment**:

```bash
# Build locally to verify
pnpm build

# Check build size
du -sh .next
```

- [ ] Local build successful
- [ ] Build size acceptable (<200MB)
- [ ] No build warnings

**Deploy**:

```bash
# Push to production branch
git push origin master:production

# OR deploy via CLI
vercel deploy --prod
```

- [ ] Deployment initiated
- [ ] Build logs reviewed (no errors)
- [ ] Build completed successfully
- [ ] Deployment URL: ******\_\_\_******

---

### 3.4 Custom Domain Configuration

- [ ] DNS A record: app.wastewise.io → Vercel IP
- [ ] DNS CNAME: www.wastewise.io → Vercel
- [ ] SSL certificate provisioned (automatic)
- [ ] SSL verified (HTTPS working)
- [ ] HTTP → HTTPS redirect enabled
- [ ] www → non-www redirect configured

**Verify DNS**:

```bash
dig app.wastewise.io
curl -I https://app.wastewise.io
```

---

## Phase 4: Worker Deployment (25 minutes)

### 4.1 Choose Deployment Strategy

**Option A: AWS ECS (Recommended for Production)**

- [ ] ECS cluster created: wastewise-production
- [ ] Task definition created
- [ ] Service configured (desired count: 2 for redundancy)
- [ ] Auto-scaling enabled (2-5 tasks based on queue depth)
- [ ] Health checks configured

**Option B: Google Cloud Run**

- [ ] Cloud Run service created
- [ ] Scaling: Min 1, Max 5
- [ ] Health checks configured

**Option C: Dedicated Server**

- [ ] Production server provisioned
- [ ] High availability: 2+ servers with load balancer
- [ ] Failover configured

---

### 4.2 Build Production Worker Image

```bash
# Build with production tag
docker build -f Dockerfile.worker -t wastewise-worker:production .

# Tag for registry
docker tag wastewise-worker:production <registry>/wastewise-worker:v1.0.0

# Push to registry
docker push <registry>/wastewise-worker:v1.0.0
```

- [ ] Image built successfully
- [ ] Image tagged with version number
- [ ] Image pushed to registry
- [ ] Image size: **\_\_\_** MB

---

### 4.3 Deploy Worker with Redundancy

**AWS ECS Deployment**:

```bash
# Update ECS service
aws ecs update-service \
  --cluster wastewise-production \
  --service worker \
  --force-new-deployment \
  --desired-count 2
```

- [ ] Service updated
- [ ] 2 tasks running
- [ ] Health checks passing
- [ ] Logs showing "Worker started"

**Environment Variables (Worker)**:

- [ ] All Supabase credentials (production)
- [ ] ANTHROPIC_API_KEY (production)
- [ ] LOG_LEVEL=info (not debug in production)
- [ ] NODE_ENV=production

---

### 4.4 Verify Worker Deployment

```bash
# Check worker health
curl https://app.wastewise.io/api/health/worker

# Check worker logs
aws logs tail /aws/ecs/wastewise-worker --follow  # AWS
docker logs wastewise-worker -f                   # Docker
```

- [ ] Health endpoint returns 200
- [ ] Logs show successful startup
- [ ] Database connection established
- [ ] Anthropic API accessible
- [ ] Job polling started
- [ ] No errors in logs

---

## Phase 5: Smoke Tests & Verification (20 minutes)

### 5.1 Automated Smoke Tests

```bash
# Run against production
STAGING_URL=https://app.wastewise.io pnpm smoke-tests
```

**Expected Result**: ALL TESTS PASSING

- [ ] Frontend health: ✅
- [ ] Database connectivity: ✅
- [ ] Worker health: ✅
- [ ] Authentication flow: ✅
- [ ] API endpoints: ✅
- [ ] Job queue: ✅
- [ ] File uploads: ✅

**If ANY test fails, STOP and investigate immediately.**

---

### 5.2 Manual End-to-End Test

**Create Test Account**:

```bash
# Use a production test account
Email: production-test@wastewise.io
Password: <secure-password>
```

**Complete Workflow**:

1. [ ] **Signup**
   - Navigate to https://app.wastewise.io/signup
   - Create account
   - Verify email works
   - Login successful

2. [ ] **Create Project**
   - Click "New Project"
   - Fill in: "Production Test Property", 100 units, Compactor, Austin TX
   - Project created successfully

3. [ ] **Upload Invoice**
   - Upload sample PDF invoice
   - File uploads to storage
   - No errors in console

4. [ ] **Run Analysis**
   - Click "Start Analysis"
   - Job created in database
   - Worker picks up job
   - Progress updates every 2 seconds

5. [ ] **Monitor Job**
   - Check worker logs for processing
   - Check admin dashboard for job status
   - No errors during processing

6. [ ] **Review Results**
   - Job completes (100%)
   - Redirects to results page
   - Executive summary displays
   - Optimization recommendations show
   - Charts render correctly

7. [ ] **Download Reports**
   - Download Excel report (works)
   - Download HTML dashboard (works)
   - Files contain correct data
   - Files download from CDN (if configured)

8. [ ] **Cleanup**
   - Delete test project
   - Verify deletion works
   - Check database (project removed)

---

### 5.3 Performance Verification

```bash
# Lighthouse audit
pnpm lighthouse https://app.wastewise.io

# Load test
pnpm load-test https://app.wastewise.io
```

- [ ] Lighthouse Performance: >90
- [ ] Lighthouse Accessibility: >90
- [ ] Lighthouse Best Practices: >90
- [ ] Lighthouse SEO: >80
- [ ] Time to First Byte: <600ms
- [ ] First Contentful Paint: <1.5s
- [ ] Largest Contentful Paint: <2.5s
- [ ] Load test: 100 concurrent users handled
- [ ] No degradation under load

---

### 5.4 Security Verification

- [ ] **SSL/TLS**: HTTPS enforced, A+ rating on SSL Labs
- [ ] **Headers**: Security headers present (CSP, X-Frame-Options, etc.)
- [ ] **Authentication**: JWT validation working
- [ ] **Rate Limiting**: API rate limits enforced (100 req/min)
- [ ] **File Validation**: Only PDF/PNG/JPG accepted, size limits enforced
- [ ] **RLS Policies**: Users can only access their own data
- [ ] **XSS Protection**: DOMPurify sanitizing user inputs
- [ ] **CORS**: Only allowed origins can access API

**Test Rate Limiting**:

```bash
# Should get 429 after 100 requests
for i in {1..120}; do curl https://app.wastewise.io/api/health; done
```

---

## Phase 6: Monitoring & Alerts Configuration (15 minutes)

### 6.1 Sentry Configuration

- [ ] Sentry production project active
- [ ] Source maps uploaded
- [ ] Release created: `v1.0.0`
- [ ] Error grouping configured
- [ ] Alert rules set:
  - [ ] > 10 errors/min → Slack #production-alerts
  - [ ] Critical error → PagerDuty (immediate)
  - [ ] Daily error summary → Email

**Test Sentry**:

```bash
# Trigger test error (remove after verification)
curl https://app.wastewise.io/api/debug/sentry-test
```

- [ ] Error appears in Sentry dashboard
- [ ] Alert sent to Slack
- [ ] Error includes context (user, URL, stack trace)

---

### 6.2 Uptime Monitoring

**UptimeRobot / Pingdom Configuration**:

1. [ ] **Frontend Monitor**
   - URL: https://app.wastewise.io/api/health
   - Type: HTTP(S)
   - Interval: 1 minute
   - Timeout: 30 seconds
   - Expected: 200 status, "ok" in response

2. [ ] **Worker Monitor**
   - URL: https://app.wastewise.io/api/health/worker
   - Type: HTTP(S)
   - Interval: 1 minute
   - Timeout: 30 seconds
   - Expected: 200 status

3. [ ] **Database Monitor**
   - Use Supabase dashboard metrics
   - Alert if connections >80% pool

**Alert Channels**:

- [ ] Email: devops@wastewise.io
- [ ] Slack: #production-alerts
- [ ] SMS: +1-XXX-XXX-XXXX (on-call engineer)
- [ ] PagerDuty: High-priority incidents

---

### 6.3 Application Performance Monitoring (Optional but Recommended)

**New Relic / Datadog / Application Insights**:

- [ ] APM agent installed
- [ ] Traces enabled
- [ ] Database queries monitored
- [ ] External API calls tracked
- [ ] Custom metrics configured:
  - [ ] Job processing time
  - [ ] AI API response time
  - [ ] Report generation time

---

### 6.4 Log Aggregation (Optional but Recommended)

**CloudWatch / Logtail / Papertrail**:

- [ ] Frontend logs aggregated
- [ ] Worker logs aggregated
- [ ] Database logs accessible
- [ ] Log retention: 30 days
- [ ] Search and filter working

---

## Phase 7: Backup Automation (10 minutes)

### 7.1 Automated Backup Configuration

**Daily Backups**:

```bash
# Add to cron (2 AM UTC daily)
0 2 * * * /opt/wastewise/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

- [ ] Cron job created
- [ ] Backup script tested
- [ ] Backups stored in S3/R2 with encryption
- [ ] Backup retention policy configured (90 days)
- [ ] Old backups auto-deleted after retention period

**Weekly Backups**:

```bash
# Add to cron (Sunday 3 AM UTC)
0 3 * * 0 /opt/wastewise/scripts/backup-full-system.sh >> /var/log/backup.log 2>&1
```

- [ ] Weekly full system backup configured
- [ ] Includes: Database + file storage + configuration

---

### 7.2 Backup Verification Automation

```bash
# Add to cron (daily at 4 AM UTC, after backup)
0 4 * * * /opt/wastewise/scripts/verify-backup.sh >> /var/log/backup-verify.log 2>&1
```

- [ ] Backup verification script created
- [ ] Checks backup file integrity (checksum)
- [ ] Verifies backup is restorable (test restore to temp DB)
- [ ] Alerts if backup fails

---

### 7.3 Disaster Recovery Plan

**Documented Procedures**:

- [ ] Complete database restore procedure
- [ ] RTO: <1 hour (how fast can we recover)
- [ ] RPO: <15 minutes (how much data can we lose)
- [ ] Tested disaster recovery on staging
- [ ] Team trained on recovery procedures

**Recovery Test**:

- [ ] Schedule quarterly DR tests
- [ ] Next test date: ******\_\_\_******
- [ ] Document lessons learned

---

## Phase 8: Go-Live Finalization (10 minutes)

### 8.1 DNS Cutover (if migrating from staging)

- [ ] Update DNS to point to production
- [ ] TTL set to 300 (5 minutes) for quick rollback
- [ ] DNS propagation verified (nslookup, dig)
- [ ] Old staging URL still accessible for rollback

---

### 8.2 Post-Deployment Monitoring (First 4 Hours)

**Hour 1 (Active Monitoring)**:

- [ ] Watch error logs continuously
- [ ] Monitor job success rate
- [ ] Check database performance
- [ ] Verify worker processing jobs
- [ ] No critical errors

**Hour 2-4 (Periodic Checks)**:

- [ ] Check every 30 minutes
- [ ] Review error rates
- [ ] Check uptime monitors
- [ ] Verify alerts working

**First 24 Hours**:

- [ ] Check every 4 hours
- [ ] Review daily summary
- [ ] Address any warnings

**First Week**:

- [ ] Daily health checks
- [ ] Weekly review meeting
- [ ] Document any issues

---

### 8.3 Team Notification

**Internal Notification**:

```
✅ PRODUCTION DEPLOYMENT COMPLETE

URL: https://app.wastewise.io
Version: v1.0.0
Deployed: 2025-11-22 15:00 UTC
Deployed by: [Your Name]

Status: All systems operational
- Frontend: ✅ Healthy
- Worker: ✅ Processing jobs
- Database: ✅ Connected
- Monitoring: ✅ Active

On-call: [Engineer Name] (Slack: @engineer)

Please monitor #production-alerts for any issues.
```

- [ ] Team notified in Slack #engineering
- [ ] Stakeholders notified via email
- [ ] Status page updated (if using)

**User Communication** (if applicable):

- [ ] Announcement email sent
- [ ] Social media update posted
- [ ] Blog post published
- [ ] Documentation updated

---

## Phase 9: Rollback Plan (IF NEEDED)

### 9.1 When to Rollback

**CRITICAL - Rollback immediately if**:

- Critical functionality broken (users can't create projects, run analysis, download reports)
- Data loss or corruption detected
- Security vulnerability discovered
- > 50% job failure rate
- Database performance degraded >3x
- Worker constantly crashing

**WARNING - Consider rollback if**:

- Error rate >10%
- Performance degraded >2x
- Multiple user complaints
- Monitoring alerts firing repeatedly

---

### 9.2 Rollback Procedure

**Step 1: Notify Team**

```
🚨 PRODUCTION ROLLBACK IN PROGRESS

Reason: [Brief description]
Impact: [User impact]
ETA: [Time to complete rollback]
```

---

**Step 2: Rollback Frontend**

```bash
# Vercel
vercel rollback <previous-deployment-url>

# OR deploy previous release
git checkout v0.9.0
git push origin v0.9.0:production
```

- [ ] Previous version deployed
- [ ] Verified deployment successful
- [ ] Site loads correctly

---

**Step 3: Rollback Worker**

```bash
# AWS ECS
aws ecs update-service \
  --cluster wastewise-production \
  --service worker \
  --task-definition wastewise-worker:previous-revision

# OR Docker
docker pull <registry>/wastewise-worker:v0.9.0
docker service update --image <registry>/wastewise-worker:v0.9.0
```

- [ ] Previous worker version deployed
- [ ] Worker running successfully
- [ ] Jobs processing normally

---

**Step 4: Rollback Database (EXTREME CAUTION)**

```bash
# Only if migrations caused the issue
npx supabase migration repair <migration-name> --status reverted
npx supabase db push

# OR restore from backup
bash scripts/restore-database.sh <backup-file>
```

⚠️ **WARNING**: Database rollback can cause data loss. Consult with team first.

- [ ] Database rolled back (if necessary)
- [ ] Data integrity verified
- [ ] Application working with rolled-back DB

---

**Step 5: Verify Rollback**

```bash
# Run smoke tests
STAGING_URL=https://app.wastewise.io pnpm smoke-tests

# Manual verification
# Complete full E2E test
```

- [ ] All smoke tests passing
- [ ] Manual E2E test successful
- [ ] Users can use the application
- [ ] No critical errors

---

**Step 6: Post-Rollback**

- [ ] Update status page
- [ ] Notify users (if impacted)
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Plan fix and re-deployment

---

## Phase 10: Success Criteria & Sign-Off

### 10.1 Deployment Success Checklist

**Technical**:

- [ ] All automated tests passing
- [ ] All smoke tests passing
- [ ] Manual E2E test successful
- [ ] No critical errors in logs
- [ ] Job success rate >95%
- [ ] Worker uptime >99%
- [ ] Response times <500ms p95
- [ ] Error rate <1%

**Operational**:

- [ ] Monitoring active and alerting
- [ ] Backups running successfully
- [ ] Team notified
- [ ] Documentation updated
- [ ] On-call schedule confirmed

**Business**:

- [ ] Users can access application
- [ ] Core workflows functional
- [ ] No customer complaints
- [ ] Stakeholder approval

---

### 10.2 Deployment Log Entry

```
================================================================================
PRODUCTION DEPLOYMENT LOG
================================================================================

Date: 2025-11-22
Time: 15:00 UTC
Deployer: [Your Name]
Version: v1.0.0
Git Commit: abc123def456

Pre-Deployment:
- Staging validation: ✅ 48 hours stable
- Code quality checks: ✅ All passing
- Security scan: ✅ No vulnerabilities
- Load testing: ✅ 100 concurrent users

Deployment:
- Frontend: ✅ Deployed to Vercel
- Worker: ✅ Deployed to AWS ECS (2 tasks)
- Database: ✅ Migrations applied successfully
- DNS: ✅ Updated, propagated

Verification:
- Smoke tests: ✅ 11/11 passing
- E2E test: ✅ Complete workflow successful
- Performance: ✅ Lighthouse 94
- Security: ✅ SSL A+, rate limiting working

Monitoring:
- Sentry: ✅ Active
- Uptime monitors: ✅ Configured
- Backups: ✅ Automated
- Alerts: ✅ Firing correctly

Issues: None

On-Call: [Engineer Name]
Backup: [Engineer Name]

Status: ✅ DEPLOYMENT SUCCESSFUL

Next Review: 2025-11-23 15:00 UTC (24-hour checkpoint)
================================================================================
```

---

### 10.3 Final Sign-Off

**Technical Lead**: ******\_\_\_******
**Date**: ******\_\_\_******

**DevOps Lead**: ******\_\_\_******
**Date**: ******\_\_\_******

**Product Manager**: ******\_\_\_******
**Date**: ******\_\_\_******

**Overall Deployment Status**: [ ] Success [ ] Success with Issues [ ] Failed

**Post-Deployment Actions**:

- [ ] Schedule 24-hour review
- [ ] Schedule 1-week review
- [ ] Plan next deployment improvements
- [ ] Update runbook with lessons learned

---

## Appendix: Quick Reference

### Emergency Contacts

- **Technical Lead**: ******\_\_\_******
- **DevOps Lead**: ******\_\_\_******
- **On-Call Engineer**: ******\_\_\_******
- **Backup Engineer**: ******\_\_\_******
- **Security Team**: ******\_\_\_******

### Critical URLs

- **Production**: https://app.wastewise.io
- **Admin Dashboard**: https://app.wastewise.io/admin
- **API Docs**: https://app.wastewise.io/api-docs
- **Health Check**: https://app.wastewise.io/api/health
- **Worker Health**: https://app.wastewise.io/api/health/worker

### Monitoring Dashboards

- **Sentry**: https://sentry.io/wastewise-production
- **Uptime**: https://uptimerobot.com
- **Supabase**: https://supabase.com/dashboard/project/<prod-ref>
- **Vercel**: https://vercel.com/wastewise/production

### Useful Commands

```bash
# Health checks
curl https://app.wastewise.io/api/health
curl https://app.wastewise.io/api/health/worker

# View logs
vercel logs --prod
aws logs tail /aws/ecs/wastewise-worker --follow

# Database operations
npx supabase db diff
npx supabase db push

# Backup/Restore
bash scripts/backup-database.sh
bash scripts/restore-database.sh <backup-file>

# Rollback
vercel rollback <url>
aws ecs update-service --cluster wastewise-production --service worker --task-definition <previous>
```

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Maintained By**: WasteWise DevOps Team
