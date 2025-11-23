# Database Backup & Recovery Documentation Index

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Owner**: Infrastructure Team

## Overview

This index provides a comprehensive guide to WasteWise's database backup and disaster recovery documentation. All documents and scripts work together to ensure zero data loss and rapid recovery in production environments.

## Quick Reference

### Emergency Recovery (Data Loss Event)

**If you need to recover the database immediately:**

1. **Read**: [DATABASE_INCIDENT_RESPONSE.md](./DATABASE_INCIDENT_RESPONSE.md) - Section "Immediate Actions (0-15 min)"
2. **Execute**: `./scripts/restore-database.sh` with most recent backup
3. **Follow**: Recovery procedures in [DATABASE_RECOVERY_PROCEDURES.md](./DATABASE_RECOVERY_PROCEDURES.md)

### Quarterly Backup Testing

**Required every 3 months:**

1. **Read**: [DATABASE_BACKUP_TESTING.md](./DATABASE_BACKUP_TESTING.md)
2. **Execute**: `./scripts/test-backup.sh --full-test`
3. **Document**: Results in compliance register

### Creating Manual Backup (Pre-Deployment)

**Before any major deployment:**

1. **Execute**: `./scripts/backup-database.sh pre-deploy`
2. **Verify**: Check backup creation in logs
3. **Proceed**: With deployment only after backup confirmation

## Documentation Structure

### 1. Strategy & Planning

#### [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md)

- **Purpose**: High-level backup strategy and objectives
- **Audience**: Leadership, infrastructure team, auditors
- **Key Content**:
  - Recovery objectives (RTO: 1 hour, RPO: 24 hours)
  - Backup types (daily, weekly, monthly, pre-deploy, PITR)
  - Retention policies (90 days, 1 year, 7 years)
  - Data prioritization (P0, P1, P2 tables)

**When to read**:

- Designing backup infrastructure
- Reviewing compliance requirements
- Planning disaster recovery strategy

---

### 2. Operational Procedures

#### [DATABASE_BACKUP_PROCEDURES.md](./DATABASE_BACKUP_PROCEDURES.md)

- **Purpose**: Step-by-step backup creation procedures
- **Audience**: DevOps engineers, infrastructure team
- **Key Content**:
  - Manual backup procedures (pg_dump commands)
  - Automated backup setup (cron jobs, GitHub Actions)
  - Encryption procedures (GPG)
  - Cloud upload procedures (S3/R2)

**When to read**:

- Setting up automated backups
- Creating manual backups
- Troubleshooting backup failures

---

#### [DATABASE_RECOVERY_PROCEDURES.md](./DATABASE_RECOVERY_PROCEDURES.md)

- **Purpose**: Step-by-step recovery procedures
- **Audience**: DevOps engineers, on-call engineers
- **Key Content**:
  - Full database recovery
  - Point-in-time recovery (PITR)
  - Table-level recovery
  - Partial data recovery
  - Rollback procedures

**When to read**:

- Data loss incident
- Accidental deletion
- Database corruption
- Testing recovery procedures

---

### 3. Testing & Validation

#### [DATABASE_BACKUP_TESTING.md](./DATABASE_BACKUP_TESTING.md)

- **Purpose**: Quarterly backup testing procedures
- **Audience**: Infrastructure team, QA team
- **Key Content**:
  - Quarterly testing checklist
  - Test scenarios (full restore, table restore, PITR)
  - Validation procedures
  - Performance benchmarking

**When to read**:

- Quarterly backup testing (required)
- Validating new backup procedures
- Benchmarking recovery performance
- Compliance audits

---

### 4. Incident Response

#### [DATABASE_INCIDENT_RESPONSE.md](./DATABASE_INCIDENT_RESPONSE.md)

- **Purpose**: Emergency response plan for data loss incidents
- **Audience**: On-call engineers, incident commanders
- **Key Content**:
  - Immediate actions (0-15 min)
  - Recovery steps (15-60 min)
  - Post-incident analysis
  - Communication templates
  - Escalation procedures

**When to read**:

- **IMMEDIATELY** during data loss incident
- Training new on-call engineers
- Incident response drills

---

### 5. Monitoring & Alerting

#### [DATABASE_BACKUP_MONITORING.md](./DATABASE_BACKUP_MONITORING.md)

- **Purpose**: Monitoring setup and alert configuration
- **Audience**: DevOps engineers, SRE team
- **Key Content**:
  - Metrics to track (success rate, duration, size)
  - Alert configuration (PagerDuty, Slack)
  - Dashboard setup (Grafana, Supabase)
  - Health checks

**When to read**:

- Setting up monitoring infrastructure
- Configuring alerts
- Creating dashboards
- Debugging backup failures

---

### 6. Compliance & Legal

#### [DATABASE_BACKUP_COMPLIANCE.md](./DATABASE_BACKUP_COMPLIANCE.md)

- **Purpose**: Compliance requirements and legal obligations
- **Audience**: Legal team, compliance officers, auditors
- **Key Content**:
  - GDPR compliance (right to erasure, encryption)
  - CCPA compliance (user deletion, retention)
  - SOC 2 Type II requirements
  - Data retention policies
  - Audit logging requirements
  - Legal holds and eDiscovery

**When to read**:

- Compliance audits (SOC 2, ISO 27001)
- Legal hold requests
- User deletion requests
- Privacy policy updates
- Regulatory changes

---

## Scripts & Automation

### Script 1: backup-database.sh

**Location**: `/scripts/backup-database.sh`

**Purpose**: Automated database backup with encryption and cloud storage

**Usage**:

```bash
# Daily backup (default)
./scripts/backup-database.sh

# Weekly backup
./scripts/backup-database.sh weekly

# Pre-deployment backup
./scripts/backup-database.sh pre-deploy

# Backup without encryption (NOT RECOMMENDED)
./scripts/backup-database.sh daily false

# Backup without cloud upload (local only)
./scripts/backup-database.sh daily true false
```

**Features**:

- ✅ Automated pg_dump with compression
- ✅ GPG encryption (AES-256)
- ✅ Cloud upload to S3/R2
- ✅ Checksum generation (SHA-256)
- ✅ Metadata tracking (JSON)
- ✅ Retention policy enforcement
- ✅ Logging and notifications

**Environment Variables Required**:

```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_KEY
BACKUP_S3_BUCKET
BACKUP_GPG_RECIPIENT
```

---

### Script 2: restore-database.sh

**Location**: `/scripts/restore-database.sh`

**Purpose**: Database restoration from backups with verification and rollback

**Usage**:

```bash
# Restore from local backup
./scripts/restore-database.sh local /path/to/backup.sql.gpg

# Restore from S3 (interactive selection)
./scripts/restore-database.sh s3

# Restore from S3 (specific file)
./scripts/restore-database.sh s3 daily/2025-11-22/backup.sql.gpg

# Point-in-time recovery (requires Supabase Pro)
./scripts/restore-database.sh pitr "2025-11-22 14:30:00"

# Dry run (simulate without executing)
./scripts/restore-database.sh local /path/to/backup.sql.gpg --dry-run
```

**Features**:

- ✅ Pre-restore safety backup (automatic)
- ✅ User confirmation (prevent accidents)
- ✅ Decryption (GPG)
- ✅ Integrity verification (checksum)
- ✅ Active connection termination
- ✅ Atomic database swap
- ✅ Post-restore validation
- ✅ Rollback capability

**Safety Mechanisms**:

1. Requires typing "RESTORE" to confirm
2. Creates pre-restore backup automatically
3. Restores to temporary database first
4. Validates restore before swapping
5. Keeps pre-restore backup for rollback

---

### Script 3: test-backup.sh

**Location**: `/scripts/test-backup.sh`

**Purpose**: Quarterly backup testing and validation

**Usage**:

```bash
# Quick test (no restore, validates files only)
./scripts/test-backup.sh

# Full test (includes restore to test database)
./scripts/test-backup.sh --full-test

# Test specific backup
./scripts/test-backup.sh /path/to/backup.sql.gpg

# Full test on specific backup
./scripts/test-backup.sh /path/to/backup.sql.gpg --full-test
```

**Tests Performed**:

1. ✅ Backup file exists and size is reasonable
2. ✅ Backup file is readable by pg_restore
3. ✅ Checksum validation (if available)
4. ✅ Encryption validation (GPG)
5. ✅ Metadata validation (JSON)
6. ✅ **[Full test only]** Restore to test database
7. ✅ **[Full test only]** Data integrity validation
8. ✅ **[Full test only]** Performance validation (RTO compliance)

**Output**:

- **Log file**: `backup-tests/logs/test-TIMESTAMP.log`
- **Results JSON**: `backup-tests/results/test-TIMESTAMP.json`
- **Pass rate**: Must be ≥80% to pass

---

## Automation Setup

### Cron Jobs (Linux/Mac)

**Daily Backup** (2 AM UTC):

```bash
0 2 * * * /path/to/wastewise/scripts/backup-database.sh daily >> /var/log/wastewise/backup.log 2>&1
```

**Weekly Backup** (Sunday 3 AM UTC):

```bash
0 3 * * 0 /path/to/wastewise/scripts/backup-database.sh weekly >> /var/log/wastewise/backup.log 2>&1
```

**Monthly Backup** (1st day of month, 4 AM UTC):

```bash
0 4 1 * * /path/to/wastewise/scripts/backup-database.sh monthly >> /var/log/wastewise/backup.log 2>&1
```

**Quarterly Testing** (1st day of quarter, 5 AM UTC):

```bash
0 5 1 */3 * /path/to/wastewise/scripts/test-backup.sh --full-test >> /var/log/wastewise/test.log 2>&1
```

### GitHub Actions (Recommended)

See [DATABASE_BACKUP_PROCEDURES.md](./DATABASE_BACKUP_PROCEDURES.md) - Section "Automated Backups" for complete GitHub Actions workflow configuration.

---

## Common Workflows

### Workflow 1: New Environment Setup

**Goal**: Set up backup infrastructure for new Supabase instance

1. **Configure environment variables** (.env.local):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJxxx...
   BACKUP_S3_BUCKET=wastewise-backups-prod
   BACKUP_GPG_RECIPIENT=wastewise-backups
   ```

2. **Set up GPG encryption**:

   ```bash
   # Generate key
   gpg --gen-key
   # Export public key
   gpg --export -a "wastewise-backups" > backup-key.pub
   ```

3. **Create S3/R2 bucket**:
   - Create bucket: `wastewise-backups-prod`
   - Enable versioning
   - Enable MFA delete
   - Configure IAM policy (see COMPLIANCE.md)

4. **Test manual backup**:

   ```bash
   ./scripts/backup-database.sh daily
   ```

5. **Verify backup in S3**:

   ```bash
   aws s3 ls s3://wastewise-backups-prod/
   ```

6. **Set up automated backups** (cron or GitHub Actions)

7. **Test restore**:
   ```bash
   ./scripts/test-backup.sh --full-test
   ```

---

### Workflow 2: Pre-Deployment Backup

**Goal**: Create safety backup before major deployment

1. **Create pre-deployment backup**:

   ```bash
   ./scripts/backup-database.sh pre-deploy
   ```

2. **Wait for confirmation**:

   ```
   [SUCCESS] Backup created successfully
   [INFO] URL: s3://wastewise-backups/pre-deploy/2025-11-22/...
   ```

3. **Verify backup**:

   ```bash
   ./scripts/test-backup.sh /path/to/backup.sql.gpg
   ```

4. **Proceed with deployment** (only after backup confirmation)

5. **If deployment fails**, restore from pre-deployment backup:
   ```bash
   ./scripts/restore-database.sh local /path/to/pre-deploy-backup.sql.gpg
   ```

---

### Workflow 3: Data Loss Recovery

**Goal**: Recover from accidental data deletion or corruption

**Phase 1: Immediate Actions (0-15 min)**

1. **Stop application** (prevent further damage):

   ```bash
   # Stop production app
   vercel --prod --pause
   # Or stop local server
   ```

2. **Assess damage**:
   - What data was lost?
   - When did it happen?
   - What's the scope?

3. **Notify team** (incident channel):
   ```
   @here DATABASE INCIDENT
   Data loss detected: [DESCRIPTION]
   Time: [TIMESTAMP]
   Initiating recovery procedures
   ```

**Phase 2: Recovery (15-60 min)**

4. **Identify backup to restore**:
   - If recent (< 24 hours): Use latest daily backup
   - If specific time known: Use PITR (if available)
   - If old (> 24 hours): Use weekly/monthly backup

5. **Download and verify backup**:

   ```bash
   ./scripts/restore-database.sh s3
   # Select appropriate backup from list
   ```

6. **Restore database**:

   ```bash
   # Confirmation required (type "RESTORE")
   # Pre-restore backup created automatically
   ```

7. **Validate restoration**:
   - Check critical tables and row counts
   - Verify data integrity
   - Test application functionality

**Phase 3: Post-Incident (60 min - 24 hours)**

8. **Document incident** (see INCIDENT_RESPONSE.md):
   - Root cause
   - Timeline
   - Data lost (if any)
   - Recovery actions
   - Lessons learned

9. **Implement preventions**:
   - Add validation
   - Improve access controls
   - Update procedures

10. **Communicate status**:
    - Internal team (incident resolved)
    - Users (if user-facing impact)
    - Leadership (incident report)

---

### Workflow 4: Quarterly Backup Testing

**Goal**: Validate backup and recovery procedures (compliance requirement)

**Frequency**: Every 3 months (Q1, Q2, Q3, Q4)

**Procedure**:

1. **Schedule testing window** (low-traffic period)

2. **Run full backup test**:

   ```bash
   ./scripts/test-backup.sh --full-test
   ```

3. **Review test results**:

   ```bash
   cat backup-tests/results/test-TIMESTAMP.json
   ```

4. **Verify all tests passed**:
   - ✅ Backup exists and readable
   - ✅ Checksum valid
   - ✅ Encryption valid
   - ✅ Metadata exists
   - ✅ Restore successful
   - ✅ Data integrity validated
   - ✅ Performance acceptable (< 1 hour)

5. **Document results** in compliance register:

   ```
   Date: 2025-11-22
   Test Type: Quarterly Backup Test
   Result: PASSED (87.5% tests passed)
   RTO Measured: 45 minutes
   Issues: None
   Next Test: 2026-02-22
   ```

6. **If failures**, remediate before next quarter:
   - Fix backup procedures
   - Update scripts
   - Retest until passing

---

## Compliance Requirements

### GDPR Compliance

**Key Requirements**:

1. ✅ User deletion requests processed within 30 days
2. ✅ Data purged from backups within 90 days (retention policy)
3. ✅ Encryption at rest (AES-256)
4. ✅ Encryption in transit (TLS 1.2+)
5. ✅ Access logging (all backup operations)
6. ✅ Privacy policy disclosure (backup practices)

**Actions Required**:

- User deletes account → soft delete (30 days) → hard delete (production) → purge from backups (up to 90 days)
- Document all backup access in audit log
- Annual review of backup procedures with legal team

### SOC 2 Type II Compliance

**Key Requirements**:

1. ✅ Documented backup procedures (this documentation)
2. ✅ Quarterly backup testing (test-backup.sh)
3. ✅ RTO/RPO targets met (1 hour / 24 hours)
4. ✅ Access controls (MFA, least privilege)
5. ✅ Change management (version controlled scripts)
6. ✅ Incident response plan (INCIDENT_RESPONSE.md)

**Actions Required**:

- Quarterly testing documentation for auditors
- Annual security audit of backup infrastructure
- Access control review (quarterly)
- Version control all backup scripts (git)

---

## Troubleshooting

### Issue 1: Backup Creation Fails

**Symptoms**: Script exits with error during pg_dump

**Common Causes**:

1. Database connection failure (check credentials)
2. Insufficient disk space
3. Database locked (active connections)
4. Network timeout

**Resolution**:

```bash
# Check database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check disk space
df -h

# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Retry with verbose logging
./scripts/backup-database.sh daily 2>&1 | tee backup-debug.log
```

---

### Issue 2: Restore Hangs or Times Out

**Symptoms**: pg_restore appears frozen

**Common Causes**:

1. Large database size (> 10GB)
2. Active connections preventing restore
3. Slow network (if restoring from S3)

**Resolution**:

```bash
# Terminate active connections
psql "$DATABASE_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'your_db' AND pid != pg_backend_pid();
"

# Use parallel restore (faster for large databases)
pg_restore --jobs=4 --dbname="$DATABASE_URL" backup.sql

# If S3 download slow, download first then restore
aws s3 cp s3://bucket/backup.sql.gpg ./
./scripts/restore-database.sh local backup.sql.gpg
```

---

### Issue 3: Backup Test Fails

**Symptoms**: test-backup.sh reports failures

**Common Causes**:

1. Backup file corrupted (checksum mismatch)
2. Encryption key missing/incorrect
3. Test database creation failed
4. Performance degradation (RTO exceeded)

**Resolution**:

```bash
# Check which tests failed
cat backup-tests/results/test-TIMESTAMP.json | jq '.tests'

# If checksum failed: backup may be corrupted, try different backup
# If encryption failed: verify GPG key available
gpg --list-keys wastewise-backups

# If restore failed: check logs for specific error
cat backup-tests/logs/test-TIMESTAMP.log | grep ERROR

# If performance failed: investigate database size growth
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

---

## Contact & Escalation

### Primary Contacts

**Infrastructure Team**:

- Email: infrastructure@wastewise.com
- Slack: #infrastructure
- On-call: PagerDuty rotation

**Security Team**:

- Email: security@wastewise.com
- Incident hotline: [TBD]

**Compliance Officer**:

- Email: compliance@wastewise.com

### Escalation Path

**Level 1**: Infrastructure Engineer (on-call)
**Level 2**: Infrastructure Lead
**Level 3**: CTO
**Level 4**: CEO (data breach only)

---

## Document Maintenance

### Review Schedule

- **Quarterly**: Update with any procedure changes
- **Annually**: Full review with legal/compliance teams
- **As-needed**: After major incidents or infrastructure changes

### Version Control

All documentation and scripts are version controlled in git:

```bash
git log -- docs/DATABASE_*.md
git log -- scripts/*backup*.sh
```

### Change Process

1. Propose changes via Pull Request
2. Review by infrastructure team
3. Approve by infrastructure lead
4. Merge to master
5. Update version numbers and "Last Updated" dates
6. Notify team in #infrastructure channel

---

## Additional Resources

### External Documentation

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [GPG Encryption Guide](https://www.gnupg.org/gph/en/manual.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

### Internal Resources

- [WasteWise SECURITY.md](./SECURITY.md) - Overall security practices
- [WasteWise DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [WasteWise ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md) - Deployment rollback

---

**Last Updated**: 2025-11-22
**Next Review**: 2026-02-22
**Document Owner**: Infrastructure Team
