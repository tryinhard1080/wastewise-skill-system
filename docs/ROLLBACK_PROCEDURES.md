# WasteWise Rollback Procedures

Detailed procedures for rolling back deployments when issues occur.

---

## When to Rollback

Immediate rollback required if:
- ✗ Health checks failing (>50% failure rate)
- ✗ Error rate >5% of requests
- ✗ Critical functionality completely broken
- ✗ Database corruption detected
- ✗ Security vulnerability exploited

Consider rollback if:
- ⚠ Error rate >1% of requests
- ⚠ Response time >2 seconds (p95)
- ⚠ User reports of broken functionality
- ⚠ Unexpected behavior in production

---

## Rollback Methods

### Method 1: Automated Script (Recommended)

```bash
# Rollback to previous deployment
pnpm rollback

# Or specify environment
pnpm rollback --environment production

# Automatic mode (for CI/CD)
pnpm rollback --auto
```

**Pros**:
- Fast (< 2 minutes)
- Includes verification steps
- Creates documentation

**Cons**:
- Limited to Railway deployments
- May not work for all scenarios

### Method 2: Railway Dashboard

1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Deployments" tab
4. Find last known good deployment (look for green checkmark)
5. Click three-dot menu → "Redeploy"
6. Wait for deployment to complete (~2 minutes)
7. Verify health checks pass

**Pros**:
- Visual interface
- Can select specific deployment
- Works even if CLI unavailable

**Cons**:
- Slower (manual process)
- Easy to select wrong deployment

### Method 3: Git Revert

```bash
# 1. Find commit to revert
git log --oneline -10

# 2. Revert the problematic commit
git revert <commit-sha>

# 3. Push to trigger redeploy
git push origin master

# Railway will automatically redeploy
```

**Pros**:
- Creates permanent record in git history
- Works with any platform
- Easy to understand what was rolled back

**Cons**:
- Slower (requires new deployment)
- May have merge conflicts
- Doesn't rollback database changes

---

## Rollback Verification

After rollback, verify:

### 1. Health Checks

```bash
# Test health endpoint
curl https://wastewise.com/api/health

# Expected: {"status":"healthy",...}
```

### 2. Core Functionality

- [ ] Landing page loads
- [ ] Login works
- [ ] Create project works
- [ ] View results works

### 3. System Metrics

- [ ] Error rate <0.1% (Sentry)
- [ ] Response time <500ms (Railway)
- [ ] Worker processing jobs
- [ ] No database errors

### 4. Monitor for 15 Minutes

Watch for:
- Error spikes in Sentry
- Memory/CPU usage in Railway
- Database connection pool usage
- User reports

---

## Post-Rollback Actions

### Immediate (< 1 hour)

1. **Document the Issue**
   - What broke?
   - When was it discovered?
   - What was the impact?
   - Who discovered it?

2. **Notify Team**
   - Send Slack message (or email)
   - Include: What happened, what was rolled back, current status

3. **Create Bug Report**
   - Create GitHub issue
   - Label: `bug`, `production`, `rollback-required`
   - Assign to appropriate team member

### Short-term (< 24 hours)

1. **Root Cause Analysis**
   - Review code changes
   - Check logs for clues
   - Reproduce issue locally if possible

2. **Create Fix**
   - Fix issue in new branch
   - Add tests to prevent regression
   - Test thoroughly in local environment

3. **Test in Staging**
   - Deploy fix to staging
   - Run full test suite
   - Verify fix resolves issue

### Before Next Deploy

1. **Update Deployment Checklist**
   - Add checks to prevent similar issues
   - Document new testing requirements

2. **Post-Mortem** (for serious issues)
   - What went wrong?
   - Why wasn't it caught earlier?
   - How can we prevent it in the future?
   - What should we change in our process?

---

## Database Rollback

**WARNING**: Database rollbacks are more complex and risky.

### Point-in-Time Recovery (Supabase)

1. Go to Supabase dashboard → Database → Backups
2. Select "Point-in-Time Recovery"
3. Choose timestamp (up to 7 days ago)
4. Click "Restore"
5. **CAUTION**: This will overwrite current database

**Data Loss**: Any data created after restore point will be lost.

### Restore from Backup

1. Go to Supabase dashboard → Database → Backups
2. Find backup from before deployment (daily backups)
3. Click "Restore"
4. Confirm restoration
5. Wait for restore to complete (~5-10 minutes)

**Data Loss**: Up to 24 hours of data may be lost.

### Migration Rollback

If issue is due to migration:

```bash
# Revert migration (if possible)
supabase db reset

# Or manually revert in Supabase SQL editor
# Write SQL to undo migration changes
```

---

## Rollback Communication Template

### Slack/Email Template

```
🚨 Production Rollback - [Date/Time]

Status: Rolled back to previous deployment
Impact: [Brief description of what was broken]
Duration: [How long issue lasted]
Resolution: Rolled back to deployment [commit-sha]

Current Status: ✅ System healthy, all checks passing

Next Steps:
- Root cause analysis in progress
- Fix being developed in branch [branch-name]
- Will redeploy after thorough testing

Questions? Reply to this message.
```

### User-Facing Status (if needed)

```
We experienced a brief issue with [feature] from [start time] to [end time].
The issue has been resolved and all systems are operating normally.
We apologize for any inconvenience.
```

---

## Rollback Decision Matrix

| Severity | Error Rate | Response Time | Action |
|----------|-----------|---------------|--------|
| Critical | >10% | N/A | **Rollback immediately** |
| High | 5-10% | >5s | **Rollback within 15 min** |
| Medium | 1-5% | 2-5s | Investigate, rollback if not resolved in 30 min |
| Low | <1% | <2s | Monitor, fix in next deployment |

**Critical Scenarios** (always rollback):
- Complete service outage
- Data loss or corruption
- Security vulnerability being exploited
- Payment processing broken

---

## Rollback Limitations

What rollback **CANNOT** fix:
- Database schema changes (need separate migration rollback)
- Data that was deleted or corrupted
- External API changes
- Third-party service outages

What rollback **CAN** fix:
- Code bugs introduced in deployment
- Configuration errors
- Performance regressions
- UI/UX issues

---

## Testing Rollback Procedures

**Recommended**: Test rollback in staging quarterly.

```bash
# 1. Deploy known-good version to staging
pnpm deploy:staging

# 2. Deploy intentionally broken version
# (e.g., with syntax error or failing health check)
pnpm deploy:staging

# 3. Practice rollback
pnpm rollback --environment staging

# 4. Verify staging is working again
```

This ensures team is familiar with rollback process.

---

## Emergency Contacts

**Railway Support**: https://help.railway.app (if platform issue)
**Supabase Support**: https://supabase.com/support (if database issue)
**Anthropic Support**: https://console.anthropic.com/support (if AI API issue)

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Next Review**: 2026-02-21 (quarterly)
