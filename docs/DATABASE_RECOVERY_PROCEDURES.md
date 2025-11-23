# Database Recovery Procedures

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Audience**: Database Administrators, On-call Engineers

## Overview

This document provides detailed recovery procedures for all database disaster scenarios in WasteWise production. Follow these procedures carefully to minimize downtime and data loss.

## ⚠️ CRITICAL PRE-RECOVERY CHECKLIST

**BEFORE initiating any recovery:**

- [ ] **STOP ALL WRITES** - Prevent further data corruption
- [ ] **ASSESS IMPACT** - Determine scope of data loss/corruption
- [ ] **NOTIFY STAKEHOLDERS** - Alert team via Slack #incidents channel
- [ ] **START INCIDENT LOG** - Document every action with timestamps
- [ ] **IDENTIFY BACKUP** - Select appropriate backup for recovery
- [ ] **VERIFY BACKUP** - Ensure backup file is intact and complete
- [ ] **CREATE ROLLBACK POINT** - Backup current state (even if corrupted)

**Never skip these steps!** Hasty recovery can worsen data loss.

---

## Recovery Scenarios

### Scenario 1: Complete Database Loss

**Symptoms**:

- Database server unreachable
- Cannot connect to Supabase
- All tables missing

**Impact**: Total service outage

**Recovery Method**: Full restore from latest backup

**Estimated RTO**: 1 hour
**Estimated RPO**: 24 hours (last daily backup)

**Procedure**:

1. **Assess situation**:

```bash
# Attempt connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Supabase status
curl https://status.supabase.com/

# If complete loss confirmed, proceed
```

2. **Notify stakeholders**:

```bash
# Post to Slack (use webhook)
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 DATABASE OUTAGE - Complete database loss detected. Recovery in progress. ETA: 1 hour.",
    "channel": "#incidents"
  }'
```

3. **Download latest backup from S3**:

```bash
# Find latest backup
LATEST_BACKUP=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  grep "\.dump$" | sort | tail -1 | awk '{print $4}')

echo "Latest backup: $LATEST_BACKUP"

# Download backup
aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./restore.dump

# Verify checksum
aws s3 cp s3://wastewise-backups/${LATEST_BACKUP}.sha256 ./restore.dump.sha256
sha256sum -c restore.dump.sha256
```

4. **Verify backup integrity**:

```bash
# List backup contents
pg_restore --list restore.dump > backup_contents.txt

# Check table count (should be ~10 tables)
TABLE_COUNT=$(grep "TABLE DATA" backup_contents.txt | wc -l)
echo "Tables in backup: $TABLE_COUNT"

if [ $TABLE_COUNT -lt 10 ]; then
  echo "⚠️ WARNING: Unexpected table count!"
  # Decide whether to proceed or use older backup
fi
```

5. **Restore database**:

```bash
# Full restore (will drop and recreate all tables)
pg_restore restore.dump \
  --dbname=$DATABASE_URL \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  2>&1 | tee restore.log

# Check for errors
if grep -i "error" restore.log; then
  echo "⚠️ Errors detected during restore. Review restore.log"
fi
```

6. **Verify restoration**:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check row counts for critical tables
psql $DATABASE_URL -c "
  SELECT 'users' AS table_name, COUNT(*) FROM users
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'analysis_jobs', COUNT(*) FROM analysis_jobs;
"

# Run application smoke test
curl http://localhost:3000/api/health
```

7. **Restore Supabase-specific configurations**:

```bash
# Row-level security policies (RLS)
# These are included in schema backup, but verify:
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public';
"

# Storage bucket (if needed)
# Manually recreate via Supabase dashboard if not in backup
```

8. **Resume operations**:

```bash
# Notify team
curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
  -d '{"text": "✅ DATABASE RESTORED - Service resuming. Please verify your data.", "channel": "#incidents"}'

# Restart application
# (Depends on hosting - Railway/Vercel auto-deploys)
```

9. **Post-recovery validation**:

```bash
# Run comprehensive tests
pnpm test

# Check recent data (within RPO window)
psql $DATABASE_URL -c "
  SELECT COUNT(*) AS recent_projects
  FROM projects
  WHERE created_at > NOW() - INTERVAL '24 hours';
"
# If this is 0 but you know there were recent projects, data loss occurred
```

**Duration**: ~60 minutes
**Data Loss**: Up to 24 hours (since last backup)

---

### Scenario 2: Accidental Table Drop

**Symptoms**:

- Specific table missing (e.g., `DROP TABLE projects`)
- Application errors referencing missing table
- Other tables intact

**Impact**: Partial data loss, service degraded

**Recovery Method**:

- **Option A**: Point-in-time recovery (Pro tier only, fastest)
- **Option B**: Restore specific table from backup

**Estimated RTO**: 15 minutes (PITR) or 30 minutes (table restore)
**Estimated RPO**: Minutes (PITR) or 24 hours (backup)

#### Option A: Point-in-Time Recovery (Recommended if available)

**Requirements**: Supabase Pro tier, incident within last 7 days

**Procedure**:

1. **Identify restore point**:

```bash
# Find timestamp just before table was dropped
# Check application logs or database audit logs
RESTORE_TIMESTAMP="2025-01-21 14:30:00 UTC"
```

2. **Initiate PITR via Supabase Dashboard**:

- Navigate to: **Supabase Dashboard → Database → Point in Time Recovery**
- Select restore point: `$RESTORE_TIMESTAMP`
- Choose: **Create new project** (recommended - non-destructive)
- Click: **Start Recovery**

3. **Wait for recovery** (5-15 minutes):

- Monitor progress in dashboard
- New database URL will be provided

4. **Extract missing table from restored database**:

```bash
# Set restored database URL
RESTORED_DB_URL="postgresql://...new-project-url..."

# Export missing table
pg_dump $RESTORED_DB_URL \
  --table=projects \
  --data-only \
  --file=projects_recovered.sql

# Import into production
psql $DATABASE_URL -f projects_recovered.sql

# Verify row count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
```

5. **Clean up**:

```bash
# After confirming data is correct, pause/delete the temporary restored project
# (via Supabase dashboard to avoid charges)
```

**Duration**: ~15 minutes
**Data Loss**: Minimal (minutes)

#### Option B: Restore Table from Backup

**Use when**: PITR not available (Free tier) or incident >7 days ago

**Procedure**:

1. **Download latest backup**:

```bash
LATEST_BACKUP=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  grep "\.dump$" | sort | tail -1 | awk '{print $4}')

aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./restore.dump
```

2. **Extract table schema and data**:

```bash
# Extract table schema
pg_restore restore.dump \
  --schema-only \
  --table=projects \
  --file=projects_schema.sql

# Extract table data
pg_restore restore.dump \
  --data-only \
  --table=projects \
  --file=projects_data.sql
```

3. **Recreate table**:

```bash
# Recreate table structure
psql $DATABASE_URL -f projects_schema.sql

# Import data
psql $DATABASE_URL -f projects_data.sql

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
```

4. **Restore constraints and indexes** (if needed):

```bash
# Extract and restore indexes
pg_restore restore.dump \
  --section=post-data \
  --table=projects \
  --dbname=$DATABASE_URL
```

**Duration**: ~30 minutes
**Data Loss**: Up to 24 hours

---

### Scenario 3: Data Corruption

**Symptoms**:

- Invalid data in tables (e.g., negative costs, NULL required fields)
- Application logic errors
- Calculation discrepancies

**Impact**: Incorrect analysis results, user distrust

**Recovery Method**: Restore to point before corruption

**Estimated RTO**: 30 minutes
**Estimated RPO**: Depends on corruption detection time

**Procedure**:

1. **Identify corruption scope**:

```bash
# Check for anomalies
psql $DATABASE_URL -c "
  -- Find invalid data
  SELECT * FROM invoice_data WHERE total_cost < 0;
  SELECT * FROM projects WHERE units IS NULL OR units < 1;
  SELECT * FROM haul_log WHERE tons_hauled > 50;  -- Unrealistic
"

# Identify when corruption occurred
psql $DATABASE_URL -c "
  SELECT MIN(created_at) AS first_bad_record
  FROM invoice_data
  WHERE total_cost < 0;
"
```

2. **Determine restore strategy**:

**If corruption is isolated** (single table, few rows):

- Manual cleanup with UPDATE/DELETE statements
- Fastest, no downtime

**If corruption is widespread**:

- Full restore from backup before corruption
- Requires downtime

3. **Option A: Manual cleanup** (if feasible):

```bash
# Delete bad records
psql $DATABASE_URL -c "
  DELETE FROM invoice_data WHERE total_cost < 0;
"

# Fix invalid data
psql $DATABASE_URL -c "
  UPDATE projects SET units = 100 WHERE units IS NULL;
"

# Verify
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM invoice_data WHERE total_cost < 0;
"
```

4. **Option B: Full restore** (if widespread):

- Follow **Scenario 1: Complete Database Loss** procedure
- Use backup from before corruption timestamp
- Accept data loss for records created after backup

**Duration**: 10 minutes (manual) or 60 minutes (full restore)
**Data Loss**: Minimal (manual) or up to 24 hours (restore)

---

### Scenario 4: Ransomware Attack

**Symptoms**:

- Encrypted database files
- Ransom demand message
- Connection failures
- Data appears corrupted

**Impact**: Total data compromise, potential legal/compliance issues

**Recovery Method**: Restore from immutable S3 backup (NOT Supabase backup)

**Estimated RTO**: 2 hours (includes security cleanup)
**Estimated RPO**: 24 hours

**⚠️ CRITICAL: Do NOT pay ransom. Do NOT negotiate.**

**Procedure**:

1. **IMMEDIATELY isolate systems**:

```bash
# Disconnect database from internet (Supabase dashboard)
# Revoke all API keys
# Reset all passwords
# Contact Supabase support
```

2. **Preserve evidence**:

```bash
# DO NOT DELETE anything
# Take screenshots of ransom message
# Save all logs
# Contact law enforcement (FBI Internet Crime Complaint Center)
```

3. **Security cleanup**:

```bash
# Scan local systems for malware
# Rotate all credentials
# Review access logs for breach origin
# Reset 2FA for all admin accounts
```

4. **Create new clean database**:

```bash
# Create new Supabase project (fresh instance)
# DO NOT restore to compromised instance

NEW_DB_URL="postgresql://...new-clean-project..."
```

5. **Restore from S3 backup** (immutable, trusted source):

```bash
# Download backup from S3 (encrypted, attacker can't modify)
aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./restore.dump

# Verify checksum (ensures integrity)
sha256sum -c restore.dump.sha256

# Restore to NEW clean database
pg_restore restore.dump \
  --dbname=$NEW_DB_URL \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges
```

6. **Update application configuration**:

```bash
# Update DATABASE_URL environment variable
# Update Supabase API keys
# Redeploy application
```

7. **Security hardening**:

- Enable MFA for all accounts
- Review and restrict IP allowlists
- Enable database audit logging
- Implement intrusion detection
- Schedule security audit

8. **Post-incident**:

- File incident report
- Notify affected users (if PII exposed)
- Update security procedures
- Conduct lessons learned review

**Duration**: ~2 hours
**Data Loss**: Up to 24 hours
**Additional Costs**: New Supabase project, security audit

---

### Scenario 5: Failed Migration/Deployment

**Symptoms**:

- Schema mismatch errors after deployment
- Application crashes referencing missing columns
- Database in inconsistent state

**Impact**: Service outage, application errors

**Recovery Method**: Rollback to pre-deployment snapshot

**Estimated RTO**: 15 minutes
**Estimated RPO**: 0 (no data loss if caught immediately)

**Procedure**:

1. **Stop deployment**:

```bash
# Cancel in-progress deployment
# Revert application to previous version
```

2. **Identify pre-deployment backup**:

```bash
# List recent backups
aws s3 ls s3://wastewise-backups/pre-deploy/ | tail -5

# Select backup from just before deployment
PRE_DEPLOY_BACKUP="wastewise_backup_20250121_140000_pre-deploy.dump"
```

3. **Download and verify**:

```bash
aws s3 cp s3://wastewise-backups/pre-deploy/$PRE_DEPLOY_BACKUP ./rollback.dump
sha256sum -c rollback.dump.sha256
```

4. **Restore database**:

```bash
pg_restore rollback.dump \
  --dbname=$DATABASE_URL \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges

# Verify application works
curl http://localhost:3000/api/health
```

5. **Root cause analysis**:

```bash
# Review failed migration
cat supabase/migrations/FAILED_MIGRATION.sql

# Test migration in staging
# Fix issues before re-deploying
```

**Duration**: ~15 minutes
**Data Loss**: None (if caught immediately)

---

### Scenario 6: Partial Data Loss (Specific Records)

**Symptoms**:

- User reports missing project
- Specific records deleted accidentally
- Audit log shows DELETE operation

**Impact**: Limited data loss, specific user affected

**Recovery Method**: Extract specific records from backup

**Estimated RTO**: 10 minutes
**Estimated RPO**: 24 hours (for that specific record)

**Procedure**:

1. **Identify missing record**:

```bash
# Get record ID from user report
MISSING_PROJECT_ID="d82e2314-7ccf-404e-a133-0caebb154c7e"

# Confirm it's missing
psql $DATABASE_URL -c "
  SELECT * FROM projects WHERE id = '$MISSING_PROJECT_ID';
"
```

2. **Download latest backup**:

```bash
LATEST_BACKUP=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  grep "\.dump$" | sort | tail -1 | awk '{print $4}')

aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./restore.dump
```

3. **Extract specific record**:

```bash
# Restore to temporary database
createdb temp_restore
pg_restore restore.dump --dbname=temp_restore

# Extract missing record
psql temp_restore -c "
  COPY (SELECT * FROM projects WHERE id = '$MISSING_PROJECT_ID')
  TO STDOUT WITH CSV HEADER;
" > missing_project.csv

# View data
cat missing_project.csv
```

4. **Re-insert into production**:

```bash
# Import record
psql $DATABASE_URL -c "
  COPY projects FROM STDIN WITH CSV HEADER;
" < missing_project.csv

# Verify restoration
psql $DATABASE_URL -c "
  SELECT * FROM projects WHERE id = '$MISSING_PROJECT_ID';
"
```

5. **Clean up**:

```bash
# Drop temporary database
dropdb temp_restore
```

**Duration**: ~10 minutes
**Data Loss**: None (if record in backup)

---

## Recovery Tools Reference

### Essential Commands

```bash
# List backup contents
pg_restore --list backup.dump

# Restore full database
pg_restore backup.dump --dbname=$DATABASE_URL --clean

# Restore specific table
pg_restore backup.dump --table=projects --dbname=$DATABASE_URL

# Restore schema only
pg_restore backup.dump --schema-only --dbname=$DATABASE_URL

# Restore data only
pg_restore backup.dump --data-only --dbname=$DATABASE_URL

# Restore with verbose output
pg_restore backup.dump --dbname=$DATABASE_URL --verbose

# Dry run (show what would be restored)
pg_restore backup.dump --list | grep "TABLE DATA"
```

### Verification Queries

```bash
# Check all table row counts
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;
"

# Check database size
psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_database_size(current_database()));
"

# Find largest tables
psql $DATABASE_URL -c "
  SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# Check recent activity
psql $DATABASE_URL -c "
  SELECT COUNT(*) AS records, DATE(created_at) AS date
  FROM projects
  GROUP BY DATE(created_at)
  ORDER BY date DESC
  LIMIT 7;
"
```

---

## Recovery Decision Matrix

| Scenario                     | PITR Available? | Scope         | Recommended Method        | RTO | RPO     |
| ---------------------------- | --------------- | ------------- | ------------------------- | --- | ------- |
| Complete database loss       | N/A             | Total         | Full restore from S3      | 1h  | 24h     |
| Accidental table drop        | Yes             | Partial       | PITR + table extract      | 15m | minutes |
| Accidental table drop        | No              | Partial       | Table restore from backup | 30m | 24h     |
| Data corruption (isolated)   | N/A             | Limited       | Manual UPDATE/DELETE      | 10m | 0       |
| Data corruption (widespread) | Yes             | Major         | PITR to before corruption | 30m | varies  |
| Data corruption (widespread) | No              | Major         | Full restore from backup  | 1h  | 24h     |
| Ransomware                   | N/A             | Total         | New DB + S3 restore       | 2h  | 24h     |
| Failed migration             | N/A             | Schema        | Pre-deploy snapshot       | 15m | 0       |
| Specific record loss         | N/A             | Single record | Extract from backup       | 10m | 24h     |

---

## Incident Response Checklist

- [ ] **Incident detected and confirmed**
- [ ] **Stakeholders notified** (Slack #incidents)
- [ ] **Incident log started** (document actions)
- [ ] **Write operations stopped** (prevent further damage)
- [ ] **Backup identified and verified**
- [ ] **Current state backed up** (even if corrupted)
- [ ] **Recovery procedure selected**
- [ ] **Recovery initiated** (follow procedure exactly)
- [ ] **Progress monitored and logged**
- [ ] **Recovery verified** (run validation queries)
- [ ] **Application tested** (smoke tests)
- [ ] **Service resumed**
- [ ] **Users notified** (resolution communicated)
- [ ] **Post-mortem scheduled** (within 48 hours)
- [ ] **Documentation updated** (lessons learned)

---

## Emergency Contacts

**Database Issues**:

- Primary: devops@wastewise.com
- On-call: +1-555-0100 (PagerDuty)

**Supabase Support**:

- Email: support@supabase.io
- Emergency: Dashboard → Support → Priority ticket

**Security Incidents**:

- CISO: security@wastewise.com
- Law Enforcement: FBI IC3 (https://www.ic3.gov/)

---

**Next Steps**: See `DATABASE_INCIDENT_RESPONSE.md` for detailed incident management procedures.
