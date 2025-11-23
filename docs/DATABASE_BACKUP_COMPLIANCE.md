# Database Backup Compliance

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Owner**: Infrastructure Team & Legal
**Review Frequency**: Quarterly (or when regulations change)

## Overview

This document defines compliance requirements for WasteWise database backups to meet regulatory obligations including GDPR, data retention laws, and industry standards for SaaS platforms.

## Regulatory Framework

### 1. GDPR (General Data Protection Regulation)

**Applies to**: All EU users and their data

#### Data Protection Requirements

**Article 5 - Principles**:

- **Lawfulness, Fairness, Transparency**: Backups must be documented and disclosed in privacy policy
- **Purpose Limitation**: Backup data only used for disaster recovery, not secondary purposes
- **Data Minimization**: Only backup necessary data fields
- **Accuracy**: Backup verification ensures data integrity
- **Storage Limitation**: 90-day retention aligns with legitimate business needs
- **Integrity & Confidentiality**: Encryption at rest and in transit

**Article 17 - Right to Erasure ("Right to be Forgotten")**:

- User deletion requests must cascade to backups
- Implement backup purging procedures for deleted user data
- Document retention exceptions (legal holds, compliance)

**Article 32 - Security of Processing**:

- Encryption: AES-256 for backups at rest
- Access controls: Role-based access to backup systems
- Audit logging: All backup access and restoration logged
- Pseudonymization: Consider for sensitive fields in backups

#### GDPR Compliance Checklist

- [ ] Privacy policy discloses backup practices and retention
- [ ] Data Processing Agreement (DPA) with Supabase covers backups
- [ ] User deletion process includes backup purging
- [ ] Backup encryption verified (AES-256)
- [ ] Access logs for all backup operations
- [ ] Data breach notification plan includes backup compromise scenarios
- [ ] Regular privacy impact assessments include backup systems

### 2. CCPA (California Consumer Privacy Act)

**Applies to**: California residents

#### Key Requirements

- **Right to Know**: Users can request backup policies
- **Right to Delete**: Same as GDPR - cascade to backups
- **Security**: Reasonable security measures (encryption, access controls)

#### CCPA Compliance Checklist

- [ ] Privacy policy includes backup retention disclosure
- [ ] User deletion requests processed within 45 days
- [ ] Annual security audits include backup systems
- [ ] Service provider agreements (Supabase) include backup clauses

### 3. SOC 2 Type II (Service Organization Control)

**Applies to**: SaaS platforms handling customer data

#### Trust Services Criteria

**Security**:

- Access controls to backup systems (MFA, least privilege)
- Encryption in transit and at rest
- Network segmentation for backup infrastructure

**Availability**:

- RTO: 1 hour, RPO: 24 hours
- Quarterly backup testing and validation
- Documented incident response procedures

**Confidentiality**:

- Encryption of sensitive fields (API keys, passwords)
- Access logging and monitoring
- Background checks for personnel with backup access

**Processing Integrity**:

- Backup verification (checksums, test restores)
- Change management for backup procedures
- Version control for backup scripts

#### SOC 2 Compliance Checklist

- [ ] Backup procedures documented and version controlled
- [ ] Quarterly backup testing with documented results
- [ ] Access controls reviewed quarterly
- [ ] Encryption verified (at rest and in transit)
- [ ] Incident response plan includes backup scenarios
- [ ] Vendor management includes Supabase backup SLA review

## Data Retention Policies

### Production Database Backups

| Backup Type             | Retention Period | Rationale                                     | Compliance Basis         |
| ----------------------- | ---------------- | --------------------------------------------- | ------------------------ |
| **Daily Full Backups**  | 90 days          | Business continuity + regulatory requirements | GDPR Article 5(e), SOC 2 |
| **Weekly Full Backups** | 1 year           | Long-term recovery, audit trail               | Tax regulations, SOC 2   |
| **Monthly Archival**    | 7 years          | Legal holds, financial records                | Tax law (IRS), GAAP      |
| **PITR Logs**           | 30 days          | Point-in-time recovery for recent data        | Business continuity      |
| **Pre-deployment**      | 90 days          | Rollback capability                           | Change management        |

### User Data Retention After Deletion

**Standard Process**:

1. User requests account deletion
2. Soft delete in production database (30-day grace period)
3. Hard delete from production after grace period
4. **Backups**: Data remains in backups until expiration (up to 90 days)
5. Document retention exception in privacy policy

**Legal Hold Exception**:

- If user data subject to legal hold, retain in secure archive
- Document legal basis (court order, investigation)
- Isolate from regular backups
- Purge within 30 days of hold release

### Anonymization vs. Deletion

**Recommendation**: True deletion (not anonymization) for GDPR compliance

**Why**:

- GDPR requires erasure, not just anonymization
- Anonymization difficult to prove in backups
- Pseudonymization allowed for legitimate interests (with safeguards)

**Implementation**:

```sql
-- Purge user from backups (run on each backup before expiration)
DELETE FROM users WHERE id = 'user-to-delete';
DELETE FROM projects WHERE user_id = 'user-to-delete';
DELETE FROM analysis_jobs WHERE user_id = 'user-to-delete';
-- ... cascade to all related tables
```

## Encryption Requirements

### At Rest

**Requirement**: AES-256 encryption for all backups

**Supabase Implementation**:

- Database encryption: Enabled by default (Supabase manages keys)
- Storage buckets: Server-side encryption with AWS KMS
- Backup archives: Encrypted before transfer to S3/R2

**Key Management**:

- Supabase database: Managed by Supabase (AWS KMS)
- Custom backups: Use GPG or AWS KMS for encryption
- Key rotation: Annual (or per security policy)
- Key access: Restricted to infrastructure team (MFA required)

**Verification**:

```bash
# Check if backup is encrypted
gpg --list-packets wastewise-backup-2025-11-22.sql.gpg
# OR for AWS KMS
aws s3api head-object --bucket backups --key wastewise-backup.sql \
  --query 'ServerSideEncryption'
```

### In Transit

**Requirement**: TLS 1.2+ for all backup transfers

**Implementation**:

- Supabase connections: `sslmode=require`
- S3/R2 uploads: HTTPS only (verified in script)
- pg_dump/pg_restore: Use SSL connection strings

**Verification**:

```bash
# Verify SSL connection
psql "postgresql://user@host:5432/db?sslmode=verify-full" \
  -c "SELECT version();"
```

### Field-Level Encryption (Optional)

**Consider for**:

- API keys (if stored in database)
- User passwords (already hashed with bcrypt)
- Sensitive PII (addresses, phone numbers)

**Implementation**: Use Supabase's `pgcrypto` extension

```sql
-- Encrypt sensitive field before backup
UPDATE users SET address = pgp_sym_encrypt(address, 'encryption-key');
```

## Access Controls

### Backup System Access

**Principle**: Least privilege + MFA

**Roles**:

| Role                   | Access Level                   | Personnel                 | MFA Required |
| ---------------------- | ------------------------------ | ------------------------- | ------------ |
| **Backup Admin**       | Full (create, restore, delete) | Infrastructure lead       | Yes          |
| **Backup Operator**    | Create, view (no delete)       | DevOps team               | Yes          |
| **Auditor**            | View logs, read-only           | Security team, compliance | Yes          |
| **Emergency Recovery** | Restore only (break-glass)     | CTO, lead engineer        | Yes          |

**Access Review**: Quarterly (document in audit log)

### Supabase Access

**Service Role Key**:

- Stored in password manager (1Password, Vault)
- Rotated annually or on personnel change
- Never committed to git
- Used only in backup/restore scripts

**Database Credentials**:

- Separate read-only user for backups (`backup_user`)
- Separate write user for restores (`restore_admin`)
- MFA for all database admin access
- IP whitelisting for backup infrastructure

### Backup Storage Access

**S3/R2 Bucket**:

- Private (no public access)
- IAM policy: Least privilege (backup role can write, restore role can read)
- Versioning enabled (protect against accidental deletion)
- MFA delete enabled (prevent unauthorized deletion)
- Access logging to CloudWatch/Cloudflare Analytics

**Access Policy Example** (AWS S3):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT:role/backup-writer" },
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::wastewise-backups/*"
    },
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT:role/restore-reader" },
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": "arn:aws:s3:::wastewise-backups/*"
    }
  ]
}
```

## Audit Logging

### Required Logs

**Backup Operations**:

- Timestamp of backup start/completion
- User/system that initiated backup
- Backup type (full, incremental, PITR)
- Backup size and location
- Success/failure status
- Retention expiration date

**Restore Operations**:

- Timestamp of restore start/completion
- User that initiated restore
- Restore target (full database, table, point-in-time)
- Data accessed/restored
- Justification (incident ticket, change request)
- Success/failure status

**Access Events**:

- Backup file downloads
- Backup storage access (S3/R2)
- Backup system logins
- Permission changes
- Encryption key access

### Log Retention

- **Backup/restore logs**: 7 years (audit trail for compliance)
- **Access logs**: 2 years (security monitoring)
- **Security events**: Indefinite (incident investigation)

### Log Storage

- **Supabase logs**: Built-in logging (retain 90 days)
- **Application logs**: Structured logs to file + monitoring service
- **Audit trail**: Separate secure database (append-only)

**Example Log Entry**:

```json
{
  "timestamp": "2025-11-22T14:30:00Z",
  "event_type": "backup_created",
  "user": "backup-automation",
  "backup_type": "daily_full",
  "database": "production",
  "backup_size_mb": 2456,
  "backup_location": "s3://wastewise-backups/daily/2025-11-22.sql.gz",
  "encryption": "AES-256",
  "retention_days": 90,
  "status": "success"
}
```

## Data Breach Response

### Backup Compromise Scenarios

**Scenario 1**: Backup file stolen (unauthorized download)

**Immediate Actions** (0-15 min):

1. Revoke access credentials for backup storage
2. Rotate encryption keys
3. Review access logs to identify scope
4. Notify security team

**Follow-up** (15-72 hours):

1. Assess data exposure (was backup encrypted?)
2. If unencrypted: GDPR breach notification (72 hours)
3. User notification (if high risk to rights/freedoms)
4. Forensic analysis of attack vector
5. Implement additional safeguards

**Scenario 2**: Backup storage misconfigured (public exposure)

**Immediate Actions** (0-5 min):

1. Disable public access immediately
2. Review who accessed backups (S3 access logs)
3. Rotate all encryption keys

**Follow-up** (5-72 hours):

1. Verify no data exfiltration occurred
2. If exposure confirmed: GDPR breach notification
3. Security audit of all storage configurations
4. Implement infrastructure-as-code for bucket policies

### Notification Requirements

**GDPR (Article 33)**:

- Notify supervisory authority within **72 hours** of breach awareness
- Include: Nature of breach, affected data categories, likely consequences, mitigation measures
- Document breach in internal register (even if not reported)

**CCPA**:

- Notify affected California residents without unreasonable delay
- If >500 CA residents: Notify California Attorney General

**Users**:

- Notify affected users if breach likely to result in high risk
- Provide: Nature of breach, mitigation steps, contact information

## Compliance Monitoring

### Quarterly Reviews

**Q1, Q2, Q3, Q4 Checklist**:

- [ ] Verify backup retention matches policy (90 days, 1 year, 7 years)
- [ ] Test backup restoration (see DATABASE_BACKUP_TESTING.md)
- [ ] Review access logs for anomalies
- [ ] Validate encryption (at rest and in transit)
- [ ] Verify user deletion requests processed in backups
- [ ] Review personnel with backup access (offboarding complete?)
- [ ] Test disaster recovery procedures
- [ ] Update documentation for any policy/procedure changes

### Annual Audits

**SOC 2 Audit** (if applicable):

- Provide backup procedures documentation
- Evidence of quarterly backup testing
- Access control reviews
- Encryption verification
- Incident response testing

**Internal Security Audit**:

- Penetration testing of backup infrastructure
- Vulnerability scanning
- Access control validation
- Encryption key management review

### Metrics to Track

| Metric                       | Target      | Frequency            |
| ---------------------------- | ----------- | -------------------- |
| **Backup Success Rate**      | >99.5%      | Daily                |
| **RTO (Recovery Time)**      | <1 hour     | Quarterly test       |
| **RPO (Data Loss)**          | <24 hours   | Quarterly test       |
| **Encryption Coverage**      | 100%        | Monthly verification |
| **Access Review Completion** | 100%        | Quarterly            |
| **User Deletion Backlog**    | <7 days     | Weekly               |
| **Backup Storage Cost**      | <$500/month | Monthly              |

## Legal Holds & eDiscovery

### Legal Hold Process

**Trigger Events**:

- Litigation notification
- Regulatory investigation
- Law enforcement request
- Internal investigation

**Procedure**:

1. Legal team issues hold notice
2. Identify affected user accounts/projects
3. Isolate relevant backups (copy to secure archive)
4. Suspend normal retention/deletion for held data
5. Document hold in compliance register
6. Notify affected personnel (no data destruction)

**Hold Archive**:

- Location: Separate S3/R2 bucket (`wastewise-legal-holds`)
- Access: Legal team + compliance officer only
- Retention: Until hold released + 30 days
- Encryption: Same as production backups (AES-256)

### eDiscovery Requests

**Responding to Requests**:

1. Verify request legitimacy (court order, subpoena)
2. Scope data to specific user/date range
3. Restore relevant backup to isolated environment
4. Extract requested data (minimize disclosure)
5. Provide in requested format (PDF, CSV, database dump)
6. Log disclosure (who, what, when, legal basis)

**Data Minimization**:

- Only provide data explicitly requested
- Redact non-relevant user data
- Use pseudonymization where possible
- Provide data dictionary with exports

## International Data Transfers

### EU to US Transfers

**Mechanism**: Standard Contractual Clauses (SCCs)

**Requirements**:

- Supabase DPA includes SCCs
- Backup storage in EU region (if possible)
- If US storage: Document additional safeguards

**Transfer Impact Assessment (TIA)**:

- Assess laws in destination country (US CLOUD Act, FISA)
- Document encryption safeguards
- User notification in privacy policy

### Data Residency

**Preferred**: Store backups in same region as production database

**Supabase Regions**:

- Production: `eu-west-1` (Ireland)
- Backups: Same region or `eu-central-1` (Frankfurt)

**Avoid**: US regions for EU user data (unless necessary + safeguards)

## Privacy Policy Disclosures

### Required Disclosures

**Users must be informed**:

- Backup practices (frequency, retention)
- Data in backups (all user data included)
- Retention periods (90 days, 1 year, 7 years)
- Deletion timeline (up to 90 days in backups after account deletion)
- Security measures (encryption, access controls)
- Third-party processors (Supabase, AWS/Cloudflare)

**Example Language**:

> "We create daily encrypted backups of our database for disaster recovery purposes. Backups are retained for 90 days and stored securely with AES-256 encryption. If you delete your account, your data will be removed from our production database within 30 days, but may persist in backups for up to 90 days before permanent deletion."

## Compliance Violations & Remediation

### Common Violations

1. **Unencrypted backups**: Encrypt all existing backups, rotate keys
2. **Excessive retention**: Purge old backups beyond policy
3. **Missing access logs**: Implement audit logging immediately
4. **User data not deleted**: Purge from backups, notify user
5. **Public backup exposure**: Revoke access, notify if breach

### Remediation Process

1. **Identify**: Quarterly audits or incident detection
2. **Assess**: Severity (critical, high, medium, low)
3. **Remediate**: Fix within SLA (critical: 24h, high: 1 week, medium: 1 month)
4. **Verify**: Test remediation effectiveness
5. **Document**: Update compliance register
6. **Prevent**: Update procedures, add automated checks

## Contact Information

**Data Protection Officer (DPO)**:

- Email: dpo@wastewise.com
- Phone: [TBD]

**Security Team**:

- Email: security@wastewise.com
- Incident hotline: [TBD]

**Legal Team**:

- Email: legal@wastewise.com

**Supabase Support**:

- Email: support@supabase.io
- Emergency: Escalate via dashboard

## Document History

| Version | Date       | Changes                      | Author              |
| ------- | ---------- | ---------------------------- | ------------------- |
| 1.0.0   | 2025-11-22 | Initial compliance framework | Infrastructure Team |

## Related Documents

- [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md) - Overall backup strategy
- [DATABASE_BACKUP_PROCEDURES.md](./DATABASE_BACKUP_PROCEDURES.md) - Backup procedures
- [DATABASE_RECOVERY_PROCEDURES.md](./DATABASE_RECOVERY_PROCEDURES.md) - Recovery procedures
- [DATABASE_INCIDENT_RESPONSE.md](./DATABASE_INCIDENT_RESPONSE.md) - Incident response plan
- [SECURITY.md](./SECURITY.md) - Overall security practices
- [Privacy Policy](https://wastewise.com/privacy) - User-facing privacy disclosures
