# Database Incident Response Plan

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Review Frequency**: Annually

## Overview

This document defines the incident response plan for database-related incidents in WasteWise production systems. It covers detection, escalation, response, recovery, and post-incident procedures.

## Incident Classification

### Severity Levels

| Severity          | Description                             | Response Time        | Examples                                          |
| ----------------- | --------------------------------------- | -------------------- | ------------------------------------------------- |
| **P0 - Critical** | Total service outage, data loss         | Immediate (0-15 min) | Database down, ransomware, complete data loss     |
| **P1 - High**     | Major feature broken, partial data loss | 1 hour               | Table dropped, major corruption, failed migration |
| **P2 - Medium**   | Degraded performance, minor data issues | 4 hours              | Slow queries, backup failure, minor corruption    |
| **P3 - Low**      | Minimal impact, non-urgent issues       | 24 hours             | Storage warning, old backup retention             |

### Incident Types

1. **Data Loss**
   - Accidental deletion (DROP TABLE, DELETE FROM)
   - Corruption (invalid data, schema mismatch)
   - Ransomware/encryption

2. **Availability**
   - Database unreachable
   - Connection exhaustion
   - Performance degradation

3. **Security**
   - Unauthorized access
   - SQL injection attempt
   - Credential compromise

4. **Operational**
   - Backup failure
   - Migration failure
   - Storage capacity issues

---

## Incident Response Workflow

```
┌─────────────┐
│   Detect    │  ← Monitoring alerts, user reports
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Assess    │  ← Determine severity (P0-P3)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Escalate   │  ← Notify on-call, stakeholders
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Contain    │  ← Stop writes, isolate systems
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Recover   │  ← Execute recovery procedures
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Verify    │  ← Validate data, test application
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Resume    │  ← Restore service, notify users
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Post-Mortem  │  ← Document, learn, improve
└─────────────┘
```

---

## Phase 1: Detection

### Automated Detection

**Monitoring Alerts**:

- Backup failure (via cron job email)
- Database unreachable (via health checks)
- Slow query alerts (via Supabase dashboard)
- Storage capacity warnings (via AWS CloudWatch)
- Failed authentication attempts (via Supabase logs)

**Health Check Endpoints**:

```bash
# Application health check (should respond in <1s)
curl http://wastewise.com/api/health

# Database connection check
curl http://wastewise.com/api/db-check
```

### Manual Detection

**User Reports**:

- Missing data
- Application errors
- Slow performance
- Authentication issues

**Monitoring Dashboard**:

- Supabase Dashboard → Database
- AWS CloudWatch → Metrics
- Application logs → Errors

---

## Phase 2: Assessment

### Immediate Actions (0-5 minutes)

1. **Confirm incident is real** (not false positive):

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check table exists
psql $DATABASE_URL -c "\dt projects"

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
```

2. **Determine severity**:

**P0 Checklist** (any YES → P0):

- [ ] Database completely unreachable?
- [ ] Critical table missing (users, projects)?
- [ ] All users affected?
- [ ] Data encrypted/ransomware?

**P1 Checklist** (any YES → P1):

- [ ] Single table dropped?
- [ ] Partial data loss (>10% of records)?
- [ ] Failed deployment/migration?
- [ ] Major data corruption?

**P2 Checklist** (any YES → P2):

- [ ] Slow queries (>10s)?
- [ ] Backup failure?
- [ ] Minor data corruption (<10% of records)?
- [ ] Storage >80% full?

**P3 Checklist**:

- [ ] Everything else

3. **Document initial findings**:

```bash
# Create incident log
cat > incident-$(date +%Y%m%d-%H%M%S).log <<EOF
=== WasteWise Database Incident ===
Date: $(date)
Severity: [P0/P1/P2/P3]
Reporter: [Name/Automated]
Description: [Brief description]

Initial Assessment:
- Database reachable: [YES/NO]
- Tables affected: [List]
- Estimated impact: [Users affected, data loss]

Timeline:
$(date +"%H:%M:%S") - Incident detected
EOF
```

---

## Phase 3: Escalation

### Notification Matrix

| Severity | Who to Notify                      | How                          | Response Time |
| -------- | ---------------------------------- | ---------------------------- | ------------- |
| **P0**   | On-call engineer, CTO, DevOps team | PagerDuty + Slack #incidents | Immediate     |
| **P1**   | On-call engineer, DevOps team      | Slack #incidents             | 1 hour        |
| **P2**   | DevOps team                        | Slack #alerts                | 4 hours       |
| **P3**   | DevOps team                        | Email                        | 24 hours      |

### Escalation Procedures

#### P0 - Critical Incident

```bash
# 1. Page on-call engineer (via PagerDuty)
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "P0: Database incident - Complete database loss",
      "severity": "critical",
      "source": "WasteWise Production",
      "custom_details": {
        "database_url": "***",
        "incident_log": "incident-20250121-143000.log"
      }
    }
  }'

# 2. Post to Slack #incidents
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "channel": "#incidents",
    "text": "🚨 P0 DATABASE INCIDENT",
    "attachments": [{
      "color": "danger",
      "fields": [
        {"title": "Severity", "value": "P0 - Critical", "short": true},
        {"title": "Impact", "value": "Total service outage", "short": true},
        {"title": "Status", "value": "Investigation in progress", "short": true},
        {"title": "ETA", "value": "TBD", "short": true}
      ]
    }]
  }'

# 3. Email CTO
aws ses send-email \
  --from "alerts@wastewise.com" \
  --to "cto@wastewise.com" \
  --subject "P0 DATABASE INCIDENT - Immediate attention required" \
  --text "Critical database incident detected. On-call engineer paged. Incident log: incident-20250121-143000.log"
```

#### P1 - High Severity

```bash
# Post to Slack #incidents
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -d '{
    "channel": "#incidents",
    "text": "⚠️ P1 Database Incident: [Brief description]",
    "attachments": [{
      "color": "warning",
      "text": "Response in progress. Updates every 30 minutes."
    }]
  }'
```

---

## Phase 4: Containment

### Immediate Containment Actions

#### For Data Loss Incidents (P0/P1)

```bash
# 1. STOP ALL WRITES immediately
# Option A: Revoke write permissions
psql $DATABASE_URL -c "
  REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
"

# Option B: Take application offline (if needed)
# Set maintenance mode in environment variables

# 2. Backup current state (even if corrupted)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL \
  --format=custom \
  --file="incident_snapshot_${TIMESTAMP}.dump"

# Upload to S3
aws s3 cp incident_snapshot_${TIMESTAMP}.dump \
  s3://wastewise-backups/incidents/ \
  --sse AES256

echo "Current state backed up: incident_snapshot_${TIMESTAMP}.dump"

# 3. Document exact state
psql $DATABASE_URL -c "
  SELECT
    tablename,
    n_live_tup AS row_count,
    n_dead_tup AS dead_rows
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
" > incident_state_${TIMESTAMP}.txt
```

#### For Security Incidents (Unauthorized Access)

```bash
# 1. Revoke all API keys
# Via Supabase Dashboard → Settings → API → Revoke all service keys

# 2. Reset database password
# Via Supabase Dashboard → Settings → Database → Reset password

# 3. Review access logs
psql $DATABASE_URL -c "
  SELECT *
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start DESC
  LIMIT 50;
"

# 4. Terminate suspicious connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND usename != 'postgres'
    AND application_name != 'WasteWise App';
"
```

#### For Performance Incidents

```bash
# 1. Identify slow queries
psql $DATABASE_URL -c "
  SELECT
    pid,
    now() - query_start AS duration,
    query,
    state
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND now() - query_start > interval '10 seconds'
  ORDER BY duration DESC;
"

# 2. Kill long-running queries (if safe)
psql $DATABASE_URL -c "
  SELECT pg_cancel_backend(pid)
  FROM pg_stat_activity
  WHERE now() - query_start > interval '5 minutes';
"

# 3. Check for blocking locks
psql $DATABASE_URL -c "
  SELECT
    blocked_locks.pid AS blocked_pid,
    blocking_locks.pid AS blocking_pid,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query
  FROM pg_catalog.pg_locks blocked_locks
  JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
  JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
  JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
  WHERE NOT blocked_locks.granted;
"
```

---

## Phase 5: Recovery

### Select Recovery Procedure

| Incident Type          | Recovery Procedure                 | Reference                                      |
| ---------------------- | ---------------------------------- | ---------------------------------------------- |
| Complete database loss | Full restore from S3 backup        | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 1 |
| Accidental table drop  | PITR or table restore              | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 2 |
| Data corruption        | Restore to point before corruption | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 3 |
| Ransomware             | New DB + immutable backup restore  | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 4 |
| Failed migration       | Rollback to pre-deploy snapshot    | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 5 |
| Specific record loss   | Extract from backup                | `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 6 |

### Recovery Progress Updates

**Update stakeholders every 15 minutes (P0) or 30 minutes (P1)**:

```bash
# Slack update template
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -d '{
    "channel": "#incidents",
    "text": "🔄 Recovery Update [HH:MM]",
    "attachments": [{
      "color": "warning",
      "fields": [
        {"title": "Status", "value": "Restoring database (45% complete)", "short": false},
        {"title": "ETA", "value": "15 minutes", "short": true},
        {"title": "Next Update", "value": "15:45", "short": true}
      ]
    }]
  }'
```

---

## Phase 6: Verification

### Post-Recovery Validation Checklist

- [ ] **Database connection test**:

```bash
psql $DATABASE_URL -c "SELECT version();"
```

- [ ] **Row count verification**:

```bash
psql $DATABASE_URL -c "
  SELECT tablename, n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
# Compare to pre-incident snapshot
```

- [ ] **Data integrity checks**:

```bash
# No NULL values in required fields
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM projects WHERE property_name IS NULL;
"
# Should be 0

# No orphaned records (foreign key integrity)
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM invoice_data
  WHERE project_id NOT IN (SELECT id FROM projects);
"
# Should be 0
```

- [ ] **Application smoke tests**:

```bash
# Health check
curl http://wastewise.com/api/health

# Authentication
curl -X POST http://wastewise.com/api/auth/login \
  -d '{"email":"test@wastewise.local","password":"TestPassword123!"}'

# Fetch projects
curl http://wastewise.com/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Recent data check** (for P0/P1 with data loss):

```bash
# Check for data within RPO window
psql $DATABASE_URL -c "
  SELECT COUNT(*) AS recent_projects
  FROM projects
  WHERE created_at > NOW() - INTERVAL '24 hours';
"
# Document any data loss
```

- [ ] **Performance validation**:

```bash
# Query response time
time psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
# Should be <1 second
```

---

## Phase 7: Service Resumption

### Resume Operations Checklist

- [ ] **Restore write permissions** (if revoked):

```bash
psql $DATABASE_URL -c "
  GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
"
```

- [ ] **Remove maintenance mode** (if enabled)

- [ ] **Notify users**:

```bash
# Email all active users
aws ses send-email \
  --from "support@wastewise.com" \
  --to-addresses $(psql $DATABASE_URL -t -c "SELECT email FROM users WHERE active = true;") \
  --subject "WasteWise Service Restored" \
  --text "We experienced a temporary database issue which has now been resolved. All services are operating normally. We apologize for any inconvenience."
```

- [ ] **Update status page**:

```
https://status.wastewise.com
Status: All Systems Operational ✅
```

- [ ] **Post to Slack**:

```bash
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -d '{
    "channel": "#incidents",
    "text": "✅ INCIDENT RESOLVED",
    "attachments": [{
      "color": "good",
      "fields": [
        {"title": "Status", "value": "Service fully restored", "short": true},
        {"title": "Duration", "value": "45 minutes", "short": true},
        {"title": "Data Loss", "value": "None", "short": true},
        {"title": "Post-Mortem", "value": "Scheduled for tomorrow 2pm", "short": true}
      ]
    }]
  }'
```

---

## Phase 8: Post-Incident

### Post-Mortem Process

**Timeline**: Within 48 hours of incident resolution

**Attendees**:

- Incident responders
- Engineering team
- CTO (for P0/P1)
- Affected stakeholders

**Agenda**:

1. Incident timeline review
2. Root cause analysis (5 Whys technique)
3. What went well
4. What went poorly
5. Action items for improvement

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD
**Severity**: P0/P1/P2/P3
**Duration**: XX minutes
**Impact**: [Brief description]

## Summary

[One paragraph summary of what happened]

## Timeline

| Time  | Event                                          |
| ----- | ---------------------------------------------- |
| 14:00 | Incident detected via monitoring alert         |
| 14:05 | On-call engineer paged                         |
| 14:10 | Root cause identified (accidental DROP TABLE)  |
| 14:15 | Recovery initiated (table restore from backup) |
| 14:30 | Table restored, verification started           |
| 14:40 | Service resumed                                |
| 14:45 | Incident closed                                |

## Root Cause

[Detailed explanation using 5 Whys technique]

1. Why did the table get dropped?
   → Engineer ran migration in production instead of staging

2. Why was production accessible?
   → No safeguards preventing direct production access

3. Why were there no safeguards?
   → Not prioritized in initial setup

4. Why wasn't this caught in review?
   → No checklist for deployment procedures

5. Why was there no checklist?
   → Process documentation incomplete

**Root Cause**: Insufficient access controls and deployment safeguards

## Impact

- **Users Affected**: 0 (detected before user impact)
- **Data Loss**: None (restored from backup within minutes)
- **Revenue Impact**: None
- **Downtime**: 40 minutes

## What Went Well

- Monitoring detected issue immediately
- On-call engineer responded within 5 minutes
- Backup restoration worked flawlessly
- Communication was clear and frequent

## What Went Poorly

- Production database was accessible without safeguards
- No deployment checklist followed
- No automated backups before migrations

## Action Items

| Action                                   | Owner            | Due Date   | Priority |
| ---------------------------------------- | ---------------- | ---------- | -------- |
| Implement read-only production DB access | DevOps           | 2025-01-25 | P0       |
| Create pre-deployment checklist          | Engineering      | 2025-01-22 | P1       |
| Automate pre-migration backups           | DevOps           | 2025-01-28 | P1       |
| Document deployment procedures           | Technical Writer | 2025-02-05 | P2       |

## Lessons Learned

- Never underestimate the importance of access controls
- Checklists prevent human error
- Regular backup testing saved us (we knew restore worked)

## Appendix

- Incident log: incident-20250121-140000.log
- Slack thread: https://wastewise.slack.com/archives/...
- Related incidents: None
```

### Follow-up Actions

- [ ] Create tickets for all action items
- [ ] Schedule follow-up review (30 days)
- [ ] Update runbooks based on learnings
- [ ] Share post-mortem with team
- [ ] Archive incident documentation

---

## Incident Log Template

```bash
# incident-YYYYMMDD-HHMMSS.log

=== WasteWise Database Incident Log ===

Incident ID: INC-2025-001
Severity: [P0/P1/P2/P3]
Status: [Detected/Investigating/Recovering/Resolved]

=== INCIDENT DETAILS ===
Reported By: [Name/System]
Reported At: YYYY-MM-DD HH:MM:SS UTC
Affected System: Production Database
Impact: [Brief description]

=== TIMELINE ===
[HH:MM:SS] - Incident detected via [monitoring/user report]
[HH:MM:SS] - On-call engineer notified
[HH:MM:SS] - Investigation started
[HH:MM:SS] - Root cause identified: [description]
[HH:MM:SS] - Containment actions: [actions taken]
[HH:MM:SS] - Recovery initiated: [procedure used]
[HH:MM:SS] - Recovery completed
[HH:MM:SS] - Verification passed
[HH:MM:SS] - Service resumed
[HH:MM:SS] - Incident closed

=== ROOT CAUSE ===
[Detailed explanation]

=== RECOVERY ACTIONS ===
1. [Action taken]
2. [Action taken]
3. [Action taken]

=== DATA LOSS ASSESSMENT ===
Tables Affected: [List]
Records Lost: [Count]
Time Window: [From - To]
Recovery Status: [Fully Recovered / Partial Loss / Unrecoverable]

=== VERIFICATION ===
- Database Connection: ✅ PASSED
- Row Counts: ✅ PASSED
- Data Integrity: ✅ PASSED
- Application Tests: ✅ PASSED

=== NOTIFICATIONS ===
[HH:MM:SS] - On-call engineer paged
[HH:MM:SS] - Slack #incidents posted
[HH:MM:SS] - CTO notified (P0 only)
[HH:MM:SS] - Users notified (if impacted)

=== POST-INCIDENT ===
Post-Mortem Scheduled: YYYY-MM-DD HH:MM
Action Items Created: [Ticket numbers]
Lessons Learned: [Key takeaways]

=== ATTACHMENTS ===
- Database snapshot: incident_snapshot_YYYYMMDD_HHMMSS.dump
- State file: incident_state_YYYYMMDD_HHMMSS.txt
- Restore log: restore-output.log
- Slack thread: [URL]
```

---

## Emergency Contacts

**Database Incidents**:

- Primary: devops@wastewise.com
- On-call: +1-555-0100 (PagerDuty)
- Escalation: cto@wastewise.com

**Supabase Support**:

- Email: support@supabase.io
- Priority Support: Dashboard → Support (Pro tier+)

**Security Incidents**:

- CISO: security@wastewise.com
- FBI IC3: https://www.ic3.gov/ (ransomware)

**AWS Support**:

- Support Console: https://console.aws.amazon.com/support
- Phone: 1-866-947-0031 (Business Support+)

---

**Next Review Date**: 2026-01-21
