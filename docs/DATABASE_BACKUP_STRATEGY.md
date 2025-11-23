# Database Backup Strategy

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Owner**: Infrastructure Team
**Review Frequency**: Quarterly

## Overview

This document defines the comprehensive backup strategy for WasteWise production databases, ensuring zero data loss and rapid recovery in disaster scenarios.

## Critical Data Assets

### Primary Database (Supabase PostgreSQL)

**Tables by Priority**:

1. **P0 - Critical** (Revenue & User Impact):
   - `users` - User accounts and authentication
   - `projects` - Customer waste management projects
   - `analysis_jobs` - Job processing state and results
   - `project_files` - File metadata and storage references

2. **P1 - High** (Business Operations):
   - `invoice_data` - Extracted invoice information
   - `haul_log` - Waste pickup records
   - `contract_terms` - Service agreements
   - `optimizations` - Cost savings recommendations

3. **P2 - Medium** (Reference Data):
   - `ordinance_database` - Regulatory compliance data
   - `regulatory_compliance` - Compliance records
   - `skills_config` - Application configuration

### Supabase Storage Buckets

- `project-files` - User-uploaded invoices, contracts, CSVs
- `generated-reports` - Excel and HTML reports

## Recovery Objectives

| Metric                             | Target    | Rationale                      |
| ---------------------------------- | --------- | ------------------------------ |
| **Recovery Time Objective (RTO)**  | 1 hour    | Maximum acceptable downtime    |
| **Recovery Point Objective (RPO)** | 24 hours  | Maximum acceptable data loss   |
| **Backup Frequency**               | Daily     | Meets RPO with buffer          |
| **Backup Retention**               | 90 days   | Compliance + operational needs |
| **Test Frequency**                 | Quarterly | Validate recovery procedures   |

## Backup Types

### 1. Automated Daily Backups (Supabase Built-in)

**Schedule**: Daily at 2:00 AM UTC
**Retention**: Tier-dependent

- Free tier: 7 days
- Pro tier: 30 days
- Team/Enterprise: Configurable

**What's Included**:

- Full database dump (schema + data)
- All tables, indexes, constraints
- Row-level security policies
- Database functions and triggers

**Access Method**:

```
Supabase Dashboard → Project Settings → Database → Backups
```

**Limitations**:

- Cannot customize schedule
- Limited retention on lower tiers
- No cross-region replication

### 2. Weekly Full Backups (Custom pg_dump)

**Schedule**: Sunday at 3:00 AM UTC
**Retention**: 90 days
**Storage**: AWS S3 with encryption

**What's Included**:

- Complete database dump
- Custom format (compressed)
- All schemas and data
- Metadata and ownership

**Benefits**:

- Full control over retention
- Cross-region storage
- Compliance-ready archival
- Independent of Supabase tier

**Storage Structure**:

```
s3://wastewise-backups/
├── 2025/
│   ├── 01/
│   │   ├── wastewise_backup_20250105_030000.dump
│   │   ├── wastewise_backup_20250112_030000.dump
│   │   └── ...
│   ├── 02/
│   └── ...
```

### 3. Pre-Deployment Snapshots

**Trigger**: Before every production deployment
**Retention**: Until next successful deployment
**Storage**: Local + S3

**Purpose**:

- Enable instant rollback
- Isolate deployment-related issues
- Minimize risk during updates

**Automation**:

```bash
# Triggered automatically by deploy-production.sh
./scripts/backup-database.sh --tag="pre-deploy-$(date +%Y%m%d-%H%M%S)"
```

### 4. Point-in-Time Recovery (PITR)

**Availability**: Pro tier and above
**Retention**: 7 days
**Granularity**: Down to the second

**Use Cases**:

- Accidental data deletion
- Bad migration rollback
- Logical corruption recovery
- Precise timestamp restoration

**Access Method**:

```
Supabase Dashboard → Database → Point in Time Recovery
```

**Limitations**:

- Requires Pro tier ($25/month minimum)
- 7-day maximum retention
- Restores to new database instance

## Backup Storage

### Primary Storage: AWS S3

**Bucket**: `wastewise-backups`
**Region**: `us-east-1` (same as Supabase)
**Encryption**: AES-256 (SSE-S3)
**Lifecycle Policies**:

- Transition to Glacier after 30 days
- Delete after 90 days
- Versioning enabled

**Access Control**:

- IAM policy restricted to backup service account
- MFA required for deletion operations
- CloudTrail logging enabled

### Secondary Storage: Supabase (Native)

**Location**: Supabase-managed infrastructure
**Access**: Dashboard only
**Retention**: Tier-dependent

## Backup Verification

### Automated Integrity Checks

Every backup must pass:

1. **File Integrity**: SHA-256 checksum validation
2. **Restore Test**: `pg_restore --list` succeeds
3. **Size Validation**: Within 20% of previous backup
4. **Compression Ratio**: Between 3:1 and 10:1

### Monthly Restore Testing

**Schedule**: First Sunday of every month
**Environment**: Staging database
**Process**:

1. Download latest weekly backup
2. Restore to staging environment
3. Run data validation queries
4. Execute application smoke tests
5. Document results

**Success Criteria**:

- All tables restored
- Row counts match
- Application connects successfully
- No data corruption detected

## Backup Security

### Encryption

**At Rest**:

- S3 server-side encryption (AES-256)
- Supabase automatic encryption

**In Transit**:

- TLS 1.3 for all transfers
- SSH tunnels for database connections

### Access Control

**Backup Creation**:

- Service account with minimal permissions
- Restricted to backup operations only
- No interactive login allowed

**Backup Restoration**:

- Requires multi-factor authentication
- Admin role required
- Audit logged

**Backup Deletion**:

- Requires MFA and approval
- 30-day soft delete period
- Permanent deletion logged

## Compliance Requirements

### GDPR (General Data Protection Regulation)

**Data Retention**:

- Financial records: 7 years
- User account data: Active + 30 days after deletion
- Project data: Active + 90 days after deletion

**Right to Erasure**:

- Backup purging procedures documented
- Manual scrubbing for deleted user data
- 90-day complete removal timeline

**Data Portability**:

- User data export procedures
- Standard format (JSON/CSV)
- Automated on request

### SOC 2 Type II

**Backup Requirements**:

- Daily automated backups
- Quarterly restore testing
- Documented procedures
- Access audit logging

**Evidence Collection**:

- Backup success logs
- Restore test results
- Access audit trails
- Incident response records

## Monitoring and Alerting

### Success Metrics

**Daily Backups**:

- Email notification on completion
- Slack alert on failure
- Metrics: Duration, size, compression ratio

**Weekly Backups**:

- Email summary report
- S3 upload confirmation
- Size trend analysis

### Alert Thresholds

| Condition               | Severity | Action                        |
| ----------------------- | -------- | ----------------------------- |
| Backup failed           | Critical | Page on-call engineer         |
| Backup >2x normal size  | Warning  | Investigate next business day |
| Backup <50% normal size | Critical | Investigate immediately       |
| Storage >90% full       | Warning  | Increase capacity             |
| Backup >4 hours old     | Warning  | Check automation              |

## Cost Estimation

### AWS S3 Storage Costs

**Assumptions**:

- Database size: 5 GB (production estimate)
- Weekly backups: 52/year
- Compression ratio: 5:1
- Growth rate: 20% annually

**Monthly Costs**:

```
Standard Storage (30 days): 5 GB × 4 weeks × $0.023/GB = $0.46
Glacier Storage (60 days): 5 GB × 8 weeks × $0.004/GB = $0.16
Total: ~$0.62/month (~$7.44/year)
```

### Supabase Costs

**Free Tier**: Built-in backups (7-day retention)
**Pro Tier**: $25/month (includes PITR)

**Recommendation**: Start with Free tier + custom backups ($0.62/month), upgrade to Pro when revenue justifies cost.

## Backup Validation Checklist

Before declaring a backup successful, verify:

- [ ] Backup file created successfully
- [ ] SHA-256 checksum calculated and stored
- [ ] File size within expected range (±20%)
- [ ] `pg_restore --list` completes without errors
- [ ] Uploaded to S3 with server-side encryption
- [ ] S3 object metadata includes timestamp and version
- [ ] Backup logged in monitoring system
- [ ] Old backups purged per retention policy

## Disaster Recovery Scenarios

### Scenario 1: Complete Database Loss

**Impact**: Total service outage
**Recovery Method**: Full restore from latest backup
**Estimated RTO**: 1 hour
**Estimated RPO**: 24 hours (last daily backup)

### Scenario 2: Accidental Table Drop

**Impact**: Partial data loss, service degraded
**Recovery Method**: Point-in-time recovery (if Pro tier), else restore specific table
**Estimated RTO**: 15 minutes
**Estimated RPO**: Minutes (PITR) or 24 hours (daily backup)

### Scenario 3: Data Corruption

**Impact**: Logical errors, incorrect data
**Recovery Method**: Restore to point before corruption
**Estimated RTO**: 30 minutes
**Estimated RPO**: Depends on detection time

### Scenario 4: Ransomware Attack

**Impact**: Encrypted or deleted data
**Recovery Method**: Restore from immutable S3 backup
**Estimated RTO**: 2 hours (includes security cleanup)
**Estimated RPO**: 24 hours

## Roles and Responsibilities

| Role                       | Responsibilities                                         |
| -------------------------- | -------------------------------------------------------- |
| **DevOps Engineer**        | Configure backup automation, monitor alerts              |
| **Database Administrator** | Validate backups, perform restores, optimize performance |
| **Security Officer**       | Audit access logs, enforce encryption policies           |
| **Compliance Manager**     | Ensure GDPR/SOC 2 requirements met                       |
| **On-call Engineer**       | Respond to backup failures, execute emergency restores   |

## Review and Maintenance

**Quarterly Reviews**:

- Validate backup strategy meets business needs
- Review RTO/RPO targets
- Update disaster recovery procedures
- Test backup restoration
- Audit access controls

**Annual Reviews**:

- Comprehensive disaster recovery drill
- Update compliance documentation
- Review and renew storage contracts
- Evaluate new backup technologies

## References

- **Supabase Backup Documentation**: https://supabase.com/docs/guides/platform/backups
- **PostgreSQL Backup Tools**: https://www.postgresql.org/docs/current/backup.html
- **AWS S3 Security Best Practices**: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
- **GDPR Data Retention**: https://gdpr.eu/data-retention/

## Appendix A: Database Schema Overview

```sql
-- Critical tables requiring backup
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  property_name TEXT NOT NULL,
  units INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  status TEXT NOT NULL,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- See supabase/migrations/ for complete schema
```

## Appendix B: Backup File Naming Convention

```
wastewise_backup_YYYYMMDD_HHMMSS.dump

Examples:
- wastewise_backup_20250121_030000.dump (weekly backup)
- wastewise_backup_20250121_143022_pre-deploy.dump (deployment snapshot)
- wastewise_backup_20250121_153045_manual.dump (manual backup)
```

## Version History

| Version | Date       | Changes                   | Author              |
| ------- | ---------- | ------------------------- | ------------------- |
| 1.0.0   | 2025-11-21 | Initial strategy document | Infrastructure Team |

---

**Document Classification**: Internal
**Distribution**: DevOps, Engineering, Compliance teams
**Next Review Date**: 2026-02-21
