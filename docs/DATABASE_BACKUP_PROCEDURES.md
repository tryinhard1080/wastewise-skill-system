# Database Backup Procedures

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Audience**: DevOps Engineers, Database Administrators

## Overview

This document provides step-by-step procedures for creating, verifying, and managing database backups for WasteWise production systems.

## Prerequisites

### Required Tools

```bash
# PostgreSQL client tools
sudo apt-get install postgresql-client-15

# AWS CLI (for S3 uploads)
sudo apt-get install awscli

# Verify installations
pg_dump --version
aws --version
```

### Required Credentials

```bash
# ~/.pgpass (PostgreSQL password file)
# Format: hostname:port:database:username:password
db.example.supabase.co:5432:postgres:postgres:YOUR_PASSWORD

# Set permissions
chmod 600 ~/.pgpass

# AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### Environment Variables

```bash
# Create ~/.backup_env
export DATABASE_URL="postgresql://postgres:PASSWORD@db.example.supabase.co:5432/postgres"
export S3_BACKUP_BUCKET="s3://wastewise-backups"
export BACKUP_RETENTION_DAYS=90
export NOTIFICATION_EMAIL="devops@wastewise.com"

# Load before running backups
source ~/.backup_env
```

## Manual Backup Procedures

### Procedure 1: Full Database Backup

**When to Use**:

- Before major deployments
- Before schema migrations
- Monthly compliance backups
- On-demand for testing

**Steps**:

1. **Prepare environment**:

```bash
# Load environment variables
source ~/.backup_env

# Create backup directory
mkdir -p ~/backups
cd ~/backups

# Set timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wastewise_backup_${TIMESTAMP}.dump"

echo "Starting backup: $BACKUP_FILE"
```

2. **Create backup**:

```bash
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --verbose \
  --file=$BACKUP_FILE \
  --no-owner \
  --no-privileges
```

**Options Explained**:

- `--format=custom`: Binary format, smaller and faster to restore
- `--compress=9`: Maximum compression (1-9 scale)
- `--verbose`: Show progress
- `--no-owner`: Don't restore ownership (Supabase manages this)
- `--no-privileges`: Don't restore grants (Supabase manages this)

3. **Verify backup integrity**:

```bash
# Check file was created
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not created!"
  exit 1
fi

# Check file size (should be >1 MB for production)
FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ $FILE_SIZE -lt 1048576 ]; then
  echo "WARNING: Backup file is very small ($FILE_SIZE bytes)"
fi

# Verify backup can be listed (validates structure)
pg_restore --list $BACKUP_FILE > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backup integrity verified"
else
  echo "❌ Backup validation failed!"
  exit 1
fi
```

4. **Calculate checksum**:

```bash
# Create checksum file
sha256sum $BACKUP_FILE > ${BACKUP_FILE}.sha256

# Display checksum
cat ${BACKUP_FILE}.sha256
```

5. **Upload to S3**:

```bash
# Upload with server-side encryption
aws s3 cp $BACKUP_FILE \
  "${S3_BACKUP_BUCKET}/$(date +%Y/%m/)/${BACKUP_FILE}" \
  --sse AES256 \
  --metadata "backup-date=$(date -Iseconds),database=wastewise,environment=production"

# Upload checksum
aws s3 cp ${BACKUP_FILE}.sha256 \
  "${S3_BACKUP_BUCKET}/$(date +%Y/%m/)/${BACKUP_FILE}.sha256" \
  --sse AES256

echo "✅ Backup uploaded to S3"
```

6. **Verify S3 upload**:

```bash
# Check file exists in S3
aws s3 ls "${S3_BACKUP_BUCKET}/$(date +%Y/%m/)/${BACKUP_FILE}"

# Compare local and remote checksums
aws s3 cp "${S3_BACKUP_BUCKET}/$(date +%Y/%m/)/${BACKUP_FILE}.sha256" - | \
  sha256sum -c
```

7. **Clean up local files**:

```bash
# Keep local copy for 7 days
find ~/backups -name "*.dump" -mtime +7 -delete
find ~/backups -name "*.sha256" -mtime +7 -delete

echo "✅ Backup complete: $BACKUP_FILE"
```

**Expected Duration**: 5-15 minutes for 5 GB database

---

### Procedure 2: Schema-Only Backup

**When to Use**:

- Document database structure
- Compare schema versions
- Lightweight backups for development

**Steps**:

```bash
# Set filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCHEMA_FILE="wastewise_schema_${TIMESTAMP}.sql"

# Create schema backup
pg_dump $DATABASE_URL \
  --schema-only \
  --verbose \
  --file=$SCHEMA_FILE

# View schema
less $SCHEMA_FILE

# Upload to S3 (optional)
aws s3 cp $SCHEMA_FILE \
  "${S3_BACKUP_BUCKET}/schemas/${SCHEMA_FILE}" \
  --sse AES256
```

---

### Procedure 3: Table-Specific Backup

**When to Use**:

- Backup single critical table
- Extract data for analysis
- Partial restore preparation

**Steps**:

```bash
# Set table name and filename
TABLE_NAME="projects"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TABLE_FILE="wastewise_${TABLE_NAME}_${TIMESTAMP}.dump"

# Backup single table
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --table=$TABLE_NAME \
  --file=$TABLE_FILE

# Verify
pg_restore --list $TABLE_FILE

# Upload to S3
aws s3 cp $TABLE_FILE \
  "${S3_BACKUP_BUCKET}/tables/${TABLE_FILE}" \
  --sse AES256
```

---

### Procedure 4: Data-Only Backup (No Schema)

**When to Use**:

- Seed data extraction
- Data migration
- Testing data duplication

**Steps**:

```bash
# Set filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATA_FILE="wastewise_data_${TIMESTAMP}.dump"

# Backup data only (no CREATE TABLE statements)
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --data-only \
  --file=$DATA_FILE

# Upload to S3
aws s3 cp $DATA_FILE \
  "${S3_BACKUP_BUCKET}/data-only/${DATA_FILE}" \
  --sse AES256
```

---

## Automated Backup Procedures

### Procedure 5: Weekly Automated Backup (Cron)

**Setup**:

1. **Create backup script** (see `scripts/backup-database.sh`)

2. **Test script manually**:

```bash
cd /path/to/wastewise
./scripts/backup-database.sh

# Check for errors
echo $?  # Should be 0 for success
```

3. **Schedule with cron**:

```bash
# Edit crontab
crontab -e

# Add weekly backup (Sunday 3 AM UTC)
0 3 * * 0 cd /path/to/wastewise && ./scripts/backup-database.sh >> /var/log/wastewise-backup.log 2>&1
```

4. **Verify cron job**:

```bash
# List cron jobs
crontab -l

# Check cron is running
sudo systemctl status cron
```

5. **Test cron execution**:

```bash
# Temporarily change to run in 5 minutes
# Wait and verify log output
tail -f /var/log/wastewise-backup.log
```

---

### Procedure 6: Pre-Deployment Backup (CI/CD)

**Integration with GitHub Actions**:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Backup database before deployment
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          # Install PostgreSQL client
          sudo apt-get update
          sudo apt-get install -y postgresql-client

          # Create backup
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="wastewise_backup_${TIMESTAMP}_pre-deploy.dump"

          pg_dump $DATABASE_URL \
            --format=custom \
            --compress=9 \
            --file=$BACKUP_FILE

          # Upload to S3
          aws s3 cp $BACKUP_FILE \
            s3://wastewise-backups/pre-deploy/${BACKUP_FILE} \
            --sse AES256

      - name: Deploy application
        run: |
          # Deployment steps here
```

---

## Backup Verification Procedures

### Procedure 7: Verify Backup Integrity

**Run after every backup**:

```bash
BACKUP_FILE="wastewise_backup_20250121_030000.dump"

# 1. Check file exists and is readable
if [ ! -r "$BACKUP_FILE" ]; then
  echo "❌ Backup file not readable"
  exit 1
fi

# 2. Check file size
FILE_SIZE=$(stat -c%s "$BACKUP_FILE")
MIN_SIZE=1048576  # 1 MB minimum
if [ $FILE_SIZE -lt $MIN_SIZE ]; then
  echo "❌ Backup file too small: $FILE_SIZE bytes"
  exit 1
fi

# 3. Verify structure
pg_restore --list $BACKUP_FILE > /tmp/backup_toc.txt
if [ $? -ne 0 ]; then
  echo "❌ Backup file corrupted or invalid"
  exit 1
fi

# 4. Check table count
TABLE_COUNT=$(grep "TABLE DATA" /tmp/backup_toc.txt | wc -l)
if [ $TABLE_COUNT -lt 10 ]; then
  echo "⚠️ WARNING: Only $TABLE_COUNT tables in backup"
fi

# 5. Verify checksum (if available)
if [ -f "${BACKUP_FILE}.sha256" ]; then
  sha256sum -c ${BACKUP_FILE}.sha256
  if [ $? -eq 0 ]; then
    echo "✅ Checksum verified"
  else
    echo "❌ Checksum mismatch!"
    exit 1
  fi
fi

echo "✅ Backup verification complete"
```

---

### Procedure 8: Compare Backup Sizes

**Detect anomalies in backup size**:

```bash
# List recent backups with sizes
aws s3 ls ${S3_BACKUP_BUCKET}/2025/11/ --recursive --human-readable

# Get size of latest backup
LATEST_SIZE=$(aws s3 ls ${S3_BACKUP_BUCKET}/2025/11/ --recursive | \
  tail -1 | awk '{print $3}')

# Get average size of last 4 backups
AVERAGE_SIZE=$(aws s3 ls ${S3_BACKUP_BUCKET}/2025/11/ --recursive | \
  tail -4 | awk '{sum+=$3; count++} END {print sum/count}')

# Calculate difference
DIFFERENCE=$(echo "scale=2; ($LATEST_SIZE / $AVERAGE_SIZE - 1) * 100" | bc)

# Alert if >20% difference
if (( $(echo "$DIFFERENCE > 20" | bc -l) )); then
  echo "⚠️ WARNING: Backup size anomaly detected (+$DIFFERENCE%)"
elif (( $(echo "$DIFFERENCE < -20" | bc -l) )); then
  echo "⚠️ WARNING: Backup size anomaly detected ($DIFFERENCE%)"
else
  echo "✅ Backup size within normal range"
fi
```

---

## Backup Cleanup Procedures

### Procedure 9: Remove Old Backups

**Run monthly to enforce retention policy**:

```bash
# Set retention days
RETENTION_DAYS=90

# List backups older than retention period
aws s3 ls ${S3_BACKUP_BUCKET}/ --recursive | \
  awk '{print $4}' | \
  while read file; do
    # Extract date from filename
    BACKUP_DATE=$(echo $file | grep -oP '\d{8}' | head -1)

    # Convert to seconds since epoch
    BACKUP_EPOCH=$(date -d "$BACKUP_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)

    # Calculate age in days
    AGE_DAYS=$(( ($CURRENT_EPOCH - $BACKUP_EPOCH) / 86400 ))

    # Delete if older than retention
    if [ $AGE_DAYS -gt $RETENTION_DAYS ]; then
      echo "Deleting old backup (${AGE_DAYS} days): $file"
      aws s3 rm ${S3_BACKUP_BUCKET}/${file}
    fi
  done

echo "✅ Old backups removed"
```

---

## Monitoring and Notifications

### Procedure 10: Send Backup Notifications

**Email notification after backup**:

```bash
# Using AWS SES
BACKUP_FILE="wastewise_backup_20250121_030000.dump"
FILE_SIZE=$(stat -c%s "$BACKUP_FILE" | numfmt --to=iec)
DURATION="12 minutes"

aws ses send-email \
  --from "backups@wastewise.com" \
  --to "devops@wastewise.com" \
  --subject "✅ WasteWise Backup Successful - $(date +%Y-%m-%d)" \
  --text "Database backup completed successfully.

Backup File: $BACKUP_FILE
File Size: $FILE_SIZE
Duration: $DURATION
Location: s3://wastewise-backups/$(date +%Y/%m/)/$BACKUP_FILE

Verification: PASSED
Upload: SUCCESSFUL

Next backup: $(date -d 'next Sunday 3:00' +%Y-%m-%d\ %H:%M)"
```

---

## Troubleshooting

### Issue 1: "pg_dump: error: connection to server failed"

**Cause**: Database connection issue

**Solution**:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check firewall rules
# Check ~/.pgpass permissions (must be 600)
chmod 600 ~/.pgpass

# Verify DATABASE_URL format
echo $DATABASE_URL | sed 's/:.*@/:***@/'
```

---

### Issue 2: "pg_dump: error: out of memory"

**Cause**: Large database, insufficient RAM

**Solution**:

```bash
# Use --format=plain with streaming
pg_dump $DATABASE_URL \
  --format=plain \
  --file=backup.sql

# Compress with gzip on-the-fly
pg_dump $DATABASE_URL | gzip > backup.sql.gz
```

---

### Issue 3: Backup file size is 0 bytes

**Cause**: Permissions issue or database empty

**Solution**:

```bash
# Check database has data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"

# Check disk space
df -h

# Run with verbose output to see errors
pg_dump $DATABASE_URL --verbose --file=backup.dump 2>&1 | tee backup.log
```

---

### Issue 4: S3 upload fails with "Access Denied"

**Cause**: Incorrect AWS credentials or IAM permissions

**Solution**:

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls ${S3_BACKUP_BUCKET}/

# Check IAM policy includes:
# - s3:PutObject
# - s3:GetObject
# - s3:ListBucket
```

---

## Backup Schedule Summary

| Backup Type    | Frequency       | Retention | Storage  | Automation |
| -------------- | --------------- | --------- | -------- | ---------- |
| Supabase Daily | Daily 2 AM UTC  | 7-30 days | Supabase | Automatic  |
| Custom Weekly  | Sunday 3 AM UTC | 90 days   | S3       | Cron       |
| Pre-deployment | On deploy       | 7 days    | S3       | CI/CD      |
| Manual         | As needed       | 90 days   | S3       | Manual     |

---

## Checklist: After Creating a Backup

- [ ] Backup file created successfully
- [ ] File size is reasonable (>1 MB, similar to previous)
- [ ] `pg_restore --list` completes without errors
- [ ] SHA-256 checksum calculated and stored
- [ ] Uploaded to S3 with encryption
- [ ] S3 upload verified (file exists)
- [ ] Notification sent (email/Slack)
- [ ] Backup logged in monitoring system
- [ ] Local cleanup performed (>7 days old)

---

## Emergency Contact

**Backup Issues**: devops@wastewise.com
**On-call Engineer**: +1-555-0100 (PagerDuty)
**Supabase Support**: support@supabase.io

---

**Next Steps**: See `DATABASE_RECOVERY_PROCEDURES.md` for restore procedures.
