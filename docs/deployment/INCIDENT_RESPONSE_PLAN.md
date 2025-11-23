# Production Incident Response Plan

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Owner**: DevOps Team

---

## 📋 Purpose

This document defines the procedures for responding to production incidents in the WasteWise SaaS platform, ensuring minimal downtime and rapid resolution.

---

## 🚨 Incident Severity Levels

### P0 - Critical (Immediate Response Required)

**Impact**: Complete service outage or data loss

**Examples**:

- Entire application down (502/503 errors)
- Database inaccessible
- Data corruption or loss detected
- Security breach detected
- Payment processing failure (if applicable)

**Response Time**: Immediate (within 5 minutes)
**Escalation**: Page on-call engineer immediately
**Communication**: Update status page, notify all users

---

### P1 - High (Urgent Response Required)

**Impact**: Major functionality broken for all/most users

**Examples**:

- Analysis jobs failing (>50% failure rate)
- Worker not processing jobs
- File uploads completely broken
- Authentication failures (users can't login)
- Report generation failing

**Response Time**: Within 15 minutes
**Escalation**: Slack alert to on-call engineer
**Communication**: Status page update, notify affected users

---

### P2 - Medium (Timely Response Required)

**Impact**: Degraded performance or partial functionality loss

**Examples**:

- Slow page loads (>3 seconds)
- Intermittent job failures (10-50% failure rate)
- Some users experiencing issues
- Email notifications delayed
- Admin dashboard slow/unresponsive

**Response Time**: Within 1 hour
**Escalation**: Slack notification to engineering team
**Communication**: Internal notification, monitor for escalation

---

### P3 - Low (Standard Response)

**Impact**: Minor issues, workarounds available

**Examples**:

- UI glitches (not blocking workflows)
- Non-critical feature broken
- Cosmetic issues
- Minor performance degradation

**Response Time**: Within 4 hours (or next business day)
**Escalation**: Create ticket, assign to team
**Communication**: Internal tracking only

---

## 👥 Roles and Responsibilities

### Incident Commander (IC)

**Who**: On-call engineer or tech lead
**Responsibilities**:

- Declare incident severity
- Coordinate response efforts
- Make rollback/mitigation decisions
- Communicate with stakeholders
- Lead post-mortem

### Technical Responder

**Who**: On-call engineer + available team members
**Responsibilities**:

- Investigate root cause
- Implement fixes
- Test solutions
- Deploy patches
- Monitor recovery

### Communications Lead

**Who**: Product manager or designated team member
**Responsibilities**:

- Update status page
- Notify affected users
- Provide regular updates
- Manage customer inquiries
- Draft incident report

---

## 📞 On-Call Schedule

### Primary On-Call

**Current**: ******\_\_\_******
**Slack**: @******\_\_\_******
**Phone**: ******\_\_\_******

### Backup On-Call

**Current**: ******\_\_\_******
**Slack**: @******\_\_\_******
**Phone**: ******\_\_\_******

### Escalation Path

1. Primary On-Call (page)
2. Backup On-Call (after 10 minutes no response)
3. Technical Lead (after 20 minutes)
4. CTO (for P0 incidents)

---

## 🔔 Alert Channels

### Monitoring Systems

- **Sentry**: Critical errors → Slack #production-alerts
- **Uptime Robot**: Downtime detected → SMS + Slack
- **Supabase**: Database alerts → Email
- **Custom Alerts**: Job failures, worker crashes → Slack

### Communication Channels

- **Slack**: #production-alerts (real-time updates)
- **Email**: devops@wastewise.io (summaries)
- **SMS**: Critical P0 incidents only
- **PagerDuty**: P0/P1 incidents (if configured)
- **Status Page**: https://status.wastewise.io (user-facing)

---

## 🎯 Incident Response Process

### Phase 1: Detection & Triage (0-5 minutes)

**1. Alert Received**

- Monitor detects issue and sends alert
- On-call engineer acknowledges within 5 minutes
- Begin initial investigation

**2. Assess Severity**

```
Is the entire site down? → P0
Is a core workflow broken? → P1
Is performance degraded? → P2
Is it a minor issue? → P3
```

**3. Declare Incident**

```
Post in #production-alerts:
🚨 INCIDENT DECLARED

Severity: P0/P1/P2/P3
Impact: [Brief description]
Affected: [All users / Subset / Internal only]
IC: @[Your name]

Investigating...
```

---

### Phase 2: Investigation (5-30 minutes)

**1. Gather Information**

```bash
# Check application health
curl https://app.wastewise.io/api/health
curl https://app.wastewise.io/api/health/worker

# View recent logs
vercel logs --prod --since 1h
aws logs tail /aws/ecs/wastewise-worker --since 1h

# Check error tracking
# Open Sentry dashboard
# Filter errors by last 1 hour

# Check database
# Open Supabase dashboard
# Review active queries
# Check connection pool
```

**2. Identify Root Cause**

Common investigation paths:

**Application Down (502/503)**:

- Check Vercel deployment status
- Check worker status (is it running?)
- Check database connectivity
- Check external API status (Anthropic, search providers)

**High Error Rate**:

- Review Sentry for error patterns
- Check recent deployments (did we just deploy?)
- Check database query performance
- Check external API errors

**Performance Degradation**:

- Check database query times
- Check worker job queue depth
- Check CDN/caching issues
- Check resource utilization (CPU, memory)

**3. Update Incident**

```
Update in #production-alerts:

🔍 INVESTIGATING

Root cause suspects:
- [List potential causes]

Current actions:
- [What you're doing]

ETA: [Estimate for fix/update]
```

---

### Phase 3: Mitigation (30-60 minutes)

**Decision Matrix**:

| Situation                      | Action                            |
| ------------------------------ | --------------------------------- |
| Recent deployment caused issue | Rollback immediately              |
| Database migration failed      | Rollback migration (with caution) |
| External API down              | Enable fallback/cached results    |
| Worker crashed                 | Restart worker, check logs        |
| Performance issue              | Scale resources, enable caching   |
| Security issue                 | Isolate affected systems, patch   |

**Rollback Decision Criteria**:

Rollback if:

- [ ] Issue started immediately after deployment
- [ ] Users significantly impacted
- [ ] No quick fix available
- [ ] Previous version was stable

Do NOT rollback if:

- [ ] Issue is database-related (data loss risk)
- [ ] Root cause unclear (may not fix issue)
- [ ] Fix is simple and quick (<15 minutes)

**Execute Rollback** (if decided):

```bash
# Frontend rollback
vercel rollback <previous-deployment-url>

# Worker rollback
aws ecs update-service \
  --cluster wastewise-production \
  --service worker \
  --task-definition <previous-revision>

# Database rollback (EXTREME CAUTION)
# Only if absolutely necessary
# Consult with team first
npx supabase migration repair <migration> --status reverted
```

**Alternative Mitigations**:

- Hot-patch specific issue
- Enable feature flags to disable broken feature
- Scale resources (more workers, larger database)
- Enable maintenance mode (if fixing requires downtime)

**4. Update Incident**

```
Update in #production-alerts:

🔧 MITIGATION IN PROGRESS

Action taken: [Rollback / Hot-patch / Scale]
Status: [In progress / Testing / Deployed]
Expected recovery: [Time estimate]
```

---

### Phase 4: Recovery & Verification (60-90 minutes)

**1. Deploy Fix**

```bash
# If hot-patching
git commit -m "hotfix: [issue description]"
git push origin master:production

# Monitor deployment
vercel logs --prod --follow
```

**2. Verify Recovery**

```bash
# Run smoke tests
STAGING_URL=https://app.wastewise.io pnpm smoke-tests

# Manual verification
# Complete full E2E workflow
# Check metrics dashboard
# Review error rates
```

**3. Monitor Closely**

- Watch error logs for 30 minutes
- Check job success rate
- Verify worker processing normally
- Monitor database performance
- Check user reports

**4. Update Incident**

```
Update in #production-alerts:

✅ INCIDENT RESOLVED

Resolution: [What was done]
Root cause: [Brief explanation]
Duration: [Time from start to resolution]
Impact: [Users affected, data lost (if any)]

Post-mortem scheduled for [Date/Time]
```

---

### Phase 5: Post-Incident Review (Within 24 hours)

**1. Update Status Page**

```
RESOLVED - [Issue description]

We experienced [description] from [start time] to [end time] UTC.

Root Cause: [Brief explanation]
Impact: [Who was affected]
Resolution: [What we did]

We apologize for any inconvenience. We're implementing [preventive measures] to prevent this from happening again.

- The WasteWise Team
```

**2. Schedule Post-Mortem**

- Schedule within 24-48 hours
- Invite all responders
- Prepare timeline of events
- Gather logs and metrics

**3. Create Incident Report**

Template: `INCIDENT_YYYY-MM-DD_brief-description.md`

```markdown
# Incident Report: [Brief Description]

**Date**: YYYY-MM-DD
**Severity**: P0/P1/P2/P3
**Duration**: [Start time] to [End time] UTC
**Impact**: [Users affected, functionality lost]

## Summary

[2-3 sentence summary of what happened]

## Timeline (All times UTC)

- HH:MM - [Event]
- HH:MM - [Event]
- HH:MM - [Event]

## Root Cause

[Detailed explanation of what caused the incident]

## Impact

- Users affected: [Number or percentage]
- Duration: [Total downtime]
- Data loss: [None / Description]
- Revenue impact: [If applicable]

## Resolution

[What was done to resolve the incident]

## Preventive Measures

1. [Action item 1] - Owner: [Name] - Due: [Date]
2. [Action item 2] - Owner: [Name] - Due: [Date]
3. [Action item 3] - Owner: [Name] - Due: [Date]

## Lessons Learned

- [What went well]
- [What could be improved]
- [What we'll do differently]

## Action Items

- [ ] [Task 1] - @owner - Due date
- [ ] [Task 2] - @owner - Due date
```

---

## 📚 Common Incident Playbooks

### Playbook 1: Complete Site Outage (502/503 errors)

**Symptoms**:

- Users see "Bad Gateway" or "Service Unavailable"
- Health check endpoint returns 502/503

**Immediate Actions**:

1. Check Vercel deployment status
2. Check if recent deployment occurred
3. Check application logs for errors

**Resolution Steps**:

```bash
# Check deployment
vercel ls --prod

# Check logs
vercel logs --prod --since 30m

# If recent deployment, rollback
vercel rollback <previous-url>

# If not deployment-related, check database
curl https://<supabase-ref>.supabase.co/rest/v1/

# Check worker
curl https://app.wastewise.io/api/health/worker
```

**Prevention**:

- Enable staging-to-production promotion (not direct deploy)
- Implement blue-green deployments
- Add pre-deployment smoke tests

---

### Playbook 2: Worker Not Processing Jobs

**Symptoms**:

- Jobs stuck in "pending" status
- No jobs completing
- Worker health check failing

**Immediate Actions**:

1. Check worker logs
2. Check worker is running
3. Check database connectivity from worker

**Resolution Steps**:

```bash
# Check worker status (AWS ECS)
aws ecs describe-services \
  --cluster wastewise-production \
  --services worker

# Check logs
aws logs tail /aws/ecs/wastewise-worker --follow

# Common issues:
# 1. Worker crashed - Restart service
aws ecs update-service \
  --cluster wastewise-production \
  --service worker \
  --force-new-deployment

# 2. Database connection issue - Check connection string
# 3. API key invalid - Verify ANTHROPIC_API_KEY

# Verify recovery
curl https://app.wastewise.io/api/health/worker
```

**Prevention**:

- Implement worker health auto-restart
- Add worker redundancy (multiple tasks)
- Monitor worker uptime actively

---

### Playbook 3: High Job Failure Rate

**Symptoms**:

- > 10% of jobs failing
- Specific error pattern in logs
- Users reporting analysis failures

**Immediate Actions**:

1. Check Sentry for error patterns
2. Review recent failed jobs
3. Identify common factor (file type, property type, etc.)

**Resolution Steps**:

```bash
# Query failed jobs
# Use admin dashboard or database query
psql $DATABASE_URL -c "
  SELECT job_type, error_message, COUNT(*)
  FROM analysis_jobs
  WHERE status = 'failed'
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY job_type, error_message
  ORDER BY COUNT(*) DESC;
"

# Common causes:
# 1. Anthropic API rate limit - Implement backoff
# 2. Invalid input data - Add validation
# 3. External API down - Enable fallbacks

# Immediate mitigation:
# - Enable retry logic for affected jobs
# - Notify affected users
# - Fix root cause and redeploy
```

**Prevention**:

- Implement better input validation
- Add retry logic with exponential backoff
- Monitor job success rate actively

---

### Playbook 4: Database Performance Degradation

**Symptoms**:

- Slow API responses
- Database connection pool exhausted
- Query timeouts

**Immediate Actions**:

1. Check Supabase dashboard for slow queries
2. Check connection pool utilization
3. Check recent data growth

**Resolution Steps**:

```bash
# Check active queries
# Via Supabase SQL editor:
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check slow queries
# Supabase → Database → Query Performance

# Immediate mitigations:
# 1. Scale database (if possible)
# 2. Kill long-running queries (carefully)
# 3. Add missing indexes
# 4. Enable caching for expensive queries

# Add index example:
CREATE INDEX CONCURRENTLY idx_jobs_status_created
ON analysis_jobs(status, created_at DESC);
```

**Prevention**:

- Regular database performance reviews
- Implement query result caching
- Monitor query performance
- Set up automatic scaling

---

### Playbook 5: Security Incident

**Symptoms**:

- Unauthorized access detected
- Unusual API traffic patterns
- Data breach suspected

**Immediate Actions** (CRITICAL):

1. **DO NOT** discuss publicly
2. Notify security team immediately
3. Preserve all logs
4. Document everything

**Resolution Steps**:

1. **Contain**:
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IP addresses

2. **Investigate**:
   - Review access logs
   - Identify breach vector
   - Assess data exposed

3. **Remediate**:
   - Patch vulnerability
   - Force password resets (if needed)
   - Audit all access

4. **Communicate**:
   - Notify affected users (if data exposed)
   - File incident reports (if required by law)
   - Update security policies

**Prevention**:

- Regular security audits
- Penetration testing
- Security training for team
- Implement security monitoring

---

## 📊 Incident Metrics

### Track for Each Incident

- **MTTD** (Mean Time To Detect): Alert → Acknowledgment
- **MTTI** (Mean Time To Investigate): Acknowledgment → Root cause identified
- **MTTR** (Mean Time To Resolve): Root cause → Resolution
- **Impact**: Users affected, duration, data loss

### Monthly Review

- Total incidents by severity
- Average MTTR by severity
- Common root causes
- Preventive measures implemented

### Goals

- P0 MTTR: <30 minutes
- P1 MTTR: <2 hours
- P2 MTTR: <4 hours
- P3 MTTR: <1 day

---

## 📝 Communication Templates

### Status Page Update (Investigating)

```
INVESTIGATING - [Brief Description]

We're currently investigating an issue affecting [functionality/users].

Current Status: Investigating root cause
Impact: [Description]
Next Update: [Time]

We apologize for any inconvenience.
```

### Status Page Update (Monitoring)

```
MONITORING - [Brief Description]

We've implemented a fix and are monitoring the situation.

Current Status: Monitoring for stability
Resolution: [What we did]
Next Update: [Time]

Thank you for your patience.
```

### Status Page Update (Resolved)

```
RESOLVED - [Brief Description]

The issue has been resolved.

Duration: [Start time] to [End time] UTC
Root Cause: [Brief explanation]
Resolution: [What we did]
Prevention: [What we're doing to prevent recurrence]

We apologize for the inconvenience and appreciate your patience.

- The WasteWise Team
```

---

## 🔗 Quick Reference Links

### Dashboards

- Sentry: https://sentry.io/wastewise-production
- Uptime: https://uptimerobot.com
- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com/wastewise/production

### Documentation

- Deployment Runbook: `docs/deployment/staging-deployment.md`
- Rollback Procedures: `docs/deployment/ROLLBACK_PROCEDURES.md`
- Database Backup: `docs/DATABASE_BACKUP_COMPLIANCE.md`

### Tools

- Health Check: `curl https://app.wastewise.io/api/health`
- Worker Health: `curl https://app.wastewise.io/api/health/worker`
- Smoke Tests: `pnpm smoke-tests`
- Logs: `vercel logs --prod`

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Review Schedule**: Quarterly
**Next Review**: 2026-02-22
