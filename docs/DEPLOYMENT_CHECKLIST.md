# WasteWise Deployment Checklist

Use this checklist to ensure safe and successful deployments.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles with no errors (`pnpm tsc --noEmit`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No console errors in development
- [ ] Code reviewed and approved (if team deployment)

### Git Status

- [ ] All changes committed
- [ ] On master/main branch
- [ ] Branch up to date with remote (`git pull origin master`)
- [ ] No uncommitted changes (`git status`)

### Environment Configuration

- [ ] Environment variables validated (`pnpm validate:env --strict`)
- [ ] `.env.template` updated with any new variables
- [ ] Railway environment variables configured
- [ ] Supabase credentials verified
- [ ] Anthropic API key tested
- [ ] Sentry DSN configured (production)

### Database

- [ ] Migrations tested locally
- [ ] Migrations applied to staging
- [ ] Migrations applied to production (if needed)
- [ ] Backup created before major migrations
- [ ] Row-Level Security (RLS) policies verified

### Dependencies

- [ ] `package.json` dependencies up to date
- [ ] No critical security vulnerabilities (`pnpm audit`)
- [ ] Lock file (`pnpm-lock.yaml`) committed

### Documentation

- [ ] README updated (if needed)
- [ ] Deployment documentation reviewed
- [ ] Changelog updated with changes

---

## Staging Deployment Checklist

### Pre-Staging

- [ ] Staging environment configured in Railway
- [ ] Staging environment variables set
- [ ] Staging database populated with test data

### Deployment

- [ ] Run deployment script (`pnpm deploy:staging`)
- [ ] Deployment completes without errors
- [ ] Health checks pass
- [ ] No errors in Railway logs

### Verification

- [ ] Landing page loads correctly
- [ ] Sign up/login works
- [ ] Create project works
- [ ] Upload files works
- [ ] Trigger analysis job works
- [ ] View results page works
- [ ] Download Excel report works
- [ ] Download HTML dashboard works
- [ ] Mobile responsive (test on phone)

### Performance

- [ ] Page load time <2 seconds
- [ ] API responses <500ms
- [ ] No memory leaks (check Railway metrics)
- [ ] Worker processes jobs (check logs)

---

## Production Deployment Checklist

### Pre-Production

- [ ] Staging deployment verified and tested
- [ ] All stakeholders notified of deployment
- [ ] Deployment window scheduled (if needed)
- [ ] Rollback plan reviewed

### Final Safety Checks

- [ ] Production environment variables verified
- [ ] Database backup completed
- [ ] Monitoring tools active (Sentry, UptimeRobot)
- [ ] Team available for support (if needed)

### Deployment

- [ ] Run production deployment script (`pnpm deploy:production`)
- [ ] Review deployment summary
- [ ] Confirm deployment when prompted
- [ ] Deployment completes successfully
- [ ] Git tag created (`deploy-production-TIMESTAMP`)
- [ ] Health checks pass

### Post-Deployment Verification (Immediate)

- [ ] Landing page loads (`https://wastewise.com`)
- [ ] Health endpoint responds (`/api/health`)
- [ ] API routes accessible (401 on protected routes = good)
- [ ] Worker service running (check Railway dashboard)
- [ ] No critical errors in Sentry
- [ ] No errors in Railway logs (first 5 minutes)

### Post-Deployment Verification (30 Minutes)

- [ ] Error rate <0.1% (Sentry)
- [ ] Response time <500ms (Railway metrics)
- [ ] Worker processing jobs successfully
- [ ] No database connection issues
- [ ] No memory/CPU spikes (Railway metrics)
- [ ] Complete user flow works (end-to-end test)

### Post-Deployment Tasks

- [ ] Update internal documentation (if needed)
- [ ] Notify team of successful deployment
- [ ] Monitor for next 2 hours (passive monitoring)
- [ ] Create incident report (if any issues occurred)

---

## Rollback Checklist

### When to Rollback

- [ ] Health checks failing
- [ ] Error rate >5%
- [ ] Critical functionality broken
- [ ] Database corruption detected
- [ ] Security vulnerability discovered

### Rollback Process

- [ ] Identify last known good deployment
- [ ] Run rollback script (`pnpm rollback`)
- [ ] Or redeploy via Railway dashboard
- [ ] Verify health checks pass after rollback
- [ ] Monitor error rates for 15 minutes
- [ ] Notify team of rollback

### Post-Rollback

- [ ] Document issue that caused rollback
- [ ] Create bug report/issue
- [ ] Fix issue in new branch
- [ ] Test fix thoroughly before redeploying
- [ ] Update deployment checklist if needed

---

## Weekly Maintenance Checklist

### Every Monday

- [ ] Review error rates (Sentry)
- [ ] Check Railway usage/costs
- [ ] Verify database backup success
- [ ] Check for dependency updates
- [ ] Review system logs for warnings

### Every Month

- [ ] Review and rotate API keys (90-day rotation)
- [ ] Update dependencies (`pnpm update`)
- [ ] Run security audit (`pnpm audit`)
- [ ] Review Railway metrics (trends)
- [ ] Optimize database queries (if needed)

---

## Emergency Procedures

### Complete Service Outage

1. Check Railway status page
2. Check Supabase status page
3. Verify DNS settings
4. Check SSL certificate validity
5. If Railway issue: Wait for resolution
6. If code issue: Rollback immediately
7. Notify users via status page (if available)

### Database Issues

1. Check connection pool usage
2. Verify Supabase is online
3. Check for long-running queries
4. If corrupted: Restore from backup
5. If connection limit: Upgrade tier or optimize

### High API Costs

1. Check Anthropic usage dashboard
2. Identify which jobs using most tokens
3. Review prompt efficiency
4. Set spending limits in Anthropic console
5. Consider caching or optimization

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
