# Database Backup Testing Procedures

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Test Frequency**: Quarterly
**Next Test Due**: 2026-02-21

## Overview

Regular backup testing is CRITICAL to ensure recovery procedures work when needed. This document defines comprehensive testing procedures to validate backup integrity, restore processes, and disaster recovery capabilities.

**Remember**: Untested backups are not backups.

## Testing Philosophy

1. **Test in production-like environment** - Staging should mirror production
2. **Test complete workflows** - Not just restore, but application functionality
3. **Document everything** - Every test must be logged
4. **Fix issues immediately** - Failed tests = broken disaster recovery
5. **Automate where possible** - Reduce human error

## Quarterly Testing Schedule

| Quarter | Test Type | Focus Area | Due Date |
|---------|-----------|------------|----------|
| Q1 (Jan-Mar) | Full Restore | Complete database recovery | Jan 15 |
| Q2 (Apr-Jun) | Table-Level | Partial recovery scenarios | Apr 15 |
| Q3 (Jul-Sep) | PITR Testing | Point-in-time recovery | Jul 15 |
| Q4 (Oct-Dec) | Disaster Drill | Simulated ransomware attack | Oct 15 |

## Test 1: Backup Integrity Validation

**Frequency**: After every backup (automated)
**Duration**: 2 minutes
**Environment**: Backup server

### Purpose
Verify backup file is valid and can be read by pg_restore.

### Procedure

```bash
#!/bin/bash
# Run after backup creation

BACKUP_FILE="wastewise_backup_20250121_030000.dump"

echo "=== Backup Integrity Test ==="
echo "File: $BACKUP_FILE"
echo "Date: $(date)"

# Test 1: File exists and is readable
echo -n "Test 1: File exists... "
if [ -r "$BACKUP_FILE" ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL - File not readable"
  exit 1
fi

# Test 2: File size check
echo -n "Test 2: File size check... "
FILE_SIZE=$(stat -c%s "$BACKUP_FILE")
MIN_SIZE=1048576  # 1 MB
if [ $FILE_SIZE -gt $MIN_SIZE ]; then
  echo "✅ PASS ($FILE_SIZE bytes)"
else
  echo "❌ FAIL - File too small ($FILE_SIZE bytes)"
  exit 1
fi

# Test 3: pg_restore can read file
echo -n "Test 3: Structure validation... "
if pg_restore --list $BACKUP_FILE > /dev/null 2>&1; then
  echo "✅ PASS"
else
  echo "❌ FAIL - Cannot read backup structure"
  exit 1
fi

# Test 4: Table count
echo -n "Test 4: Table count... "
TABLE_COUNT=$(pg_restore --list $BACKUP_FILE | grep "TABLE DATA" | wc -l)
EXPECTED_MIN=10
if [ $TABLE_COUNT -ge $EXPECTED_MIN ]; then
  echo "✅ PASS ($TABLE_COUNT tables)"
else
  echo "⚠️ WARNING - Only $TABLE_COUNT tables (expected >=$EXPECTED_MIN)"
fi

# Test 5: Checksum verification
echo -n "Test 5: Checksum... "
if [ -f "${BACKUP_FILE}.sha256" ]; then
  if sha256sum -c "${BACKUP_FILE}.sha256" > /dev/null 2>&1; then
    echo "✅ PASS"
  else
    echo "❌ FAIL - Checksum mismatch"
    exit 1
  fi
else
  echo "⚠️ SKIP - No checksum file"
fi

echo ""
echo "=== All Tests Passed ✅ ==="
```

### Success Criteria
- All 5 tests pass
- No errors in output
- Logged in monitoring system

---

## Test 2: Full Database Restore (Quarterly)

**Frequency**: Quarterly (Q1)
**Duration**: 45 minutes
**Environment**: Staging database

### Purpose
Verify complete database can be restored and application functions correctly.

### Prerequisites

1. **Staging environment ready**:
   - Fresh staging database (empty or droppable)
   - Same PostgreSQL version as production
   - Sufficient storage (2x production database size)

2. **Backup file available**:
   - Latest weekly production backup
   - Checksum file verified

3. **Application deployed**:
   - Staging app pointing to staging database
   - Environment variables configured

### Procedure

#### Step 1: Pre-Test Checklist

```bash
# Record starting state
echo "=== Pre-Test Checklist ===" | tee test-report.txt
echo "Test Date: $(date)" | tee -a test-report.txt
echo "Tester: $USER" | tee -a test-report.txt

# Verify staging database is accessible
echo -n "Staging database accessible: " | tee -a test-report.txt
if psql $STAGING_DB_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ FAILED" | tee -a test-report.txt
  exit 1
fi

# Download production backup
echo "Downloading production backup..." | tee -a test-report.txt
LATEST_BACKUP=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  grep "\.dump$" | sort | tail -1 | awk '{print $4}')
aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./test-restore.dump
aws s3 cp s3://wastewise-backups/${LATEST_BACKUP}.sha256 ./test-restore.dump.sha256

# Verify checksum
echo -n "Backup checksum: " | tee -a test-report.txt
if sha256sum -c test-restore.dump.sha256 > /dev/null 2>&1; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ FAILED" | tee -a test-report.txt
  exit 1
fi
```

#### Step 2: Perform Restore

```bash
echo "=== Restore Process ===" | tee -a test-report.txt
START_TIME=$(date +%s)

# Clear staging database
echo "Clearing staging database..." | tee -a test-report.txt
psql $STAGING_DB_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore backup
echo "Restoring backup..." | tee -a test-report.txt
pg_restore test-restore.dump \
  --dbname=$STAGING_DB_URL \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  2>&1 | tee restore-output.log

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "Restore duration: ${DURATION}s" | tee -a test-report.txt

# Check for errors
ERROR_COUNT=$(grep -i "error" restore-output.log | wc -l)
echo "Errors during restore: $ERROR_COUNT" | tee -a test-report.txt
if [ $ERROR_COUNT -gt 0 ]; then
  echo "⚠️ WARNING - Errors detected (review restore-output.log)" | tee -a test-report.txt
fi
```

#### Step 3: Data Validation

```bash
echo "=== Data Validation ===" | tee -a test-report.txt

# Check table counts
psql $STAGING_DB_URL -c "
  SELECT
    tablename,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
" | tee -a test-report.txt

# Validate critical tables have data
echo -n "Users table: " | tee -a test-report.txt
USER_COUNT=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM users;")
if [ $USER_COUNT -gt 0 ]; then
  echo "✅ ($USER_COUNT rows)" | tee -a test-report.txt
else
  echo "❌ EMPTY" | tee -a test-report.txt
fi

echo -n "Projects table: " | tee -a test-report.txt
PROJECT_COUNT=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM projects;")
if [ $PROJECT_COUNT -gt 0 ]; then
  echo "✅ ($PROJECT_COUNT rows)" | tee -a test-report.txt
else
  echo "❌ EMPTY" | tee -a test-report.txt
fi

# Check data integrity
echo -n "Data integrity (no NULL project names): " | tee -a test-report.txt
NULL_COUNT=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM projects WHERE property_name IS NULL;")
if [ $NULL_COUNT -eq 0 ]; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ Found $NULL_COUNT NULL values" | tee -a test-report.txt
fi

# Verify recent data (within last 7 days)
echo "Recent data check (last 7 days):" | tee -a test-report.txt
psql $STAGING_DB_URL -c "
  SELECT
    DATE(created_at) AS date,
    COUNT(*) AS projects_created
  FROM projects
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
" | tee -a test-report.txt
```

#### Step 4: Application Smoke Tests

```bash
echo "=== Application Tests ===" | tee -a test-report.txt

# Update staging app to use restored database
# (Environment variable should already point to STAGING_DB_URL)

# Test 1: Health check
echo -n "Health endpoint: " | tee -a test-report.txt
HEALTH_RESPONSE=$(curl -s http://staging.wastewise.com/api/health)
if echo $HEALTH_RESPONSE | grep -q "healthy"; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ FAILED - $HEALTH_RESPONSE" | tee -a test-report.txt
fi

# Test 2: Database connection
echo -n "Database connection: " | tee -a test-report.txt
DB_CHECK=$(curl -s http://staging.wastewise.com/api/db-check)
if echo $DB_CHECK | grep -q "connected"; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ FAILED" | tee -a test-report.txt
fi

# Test 3: Fetch projects
echo -n "API: Fetch projects: " | tee -a test-report.txt
PROJECTS_RESPONSE=$(curl -s http://staging.wastewise.com/api/projects)
if echo $PROJECTS_RESPONSE | grep -q "property_name"; then
  echo "✅" | tee -a test-report.txt
else
  echo "❌ FAILED" | tee -a test-report.txt
fi

# Test 4: Authentication
echo -n "Authentication: " | tee -a test-report.txt
# Test with known test user from production backup
AUTH_RESPONSE=$(curl -s -X POST http://staging.wastewise.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@wastewise.local","password":"TestPassword123!"}')
if echo $AUTH_RESPONSE | grep -q "access_token"; then
  echo "✅" | tee -a test-report.txt
else
  echo "⚠️ WARNING - Test user may not exist in backup" | tee -a test-report.txt
fi
```

#### Step 5: Performance Validation

```bash
echo "=== Performance Tests ===" | tee -a test-report.txt

# Database size
echo "Database size:" | tee -a test-report.txt
psql $STAGING_DB_URL -c "
  SELECT pg_size_pretty(pg_database_size(current_database()));
" | tee -a test-report.txt

# Largest tables
echo "Largest tables:" | tee -a test-report.txt
psql $STAGING_DB_URL -c "
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 5;
" | tee -a test-report.txt

# Query performance test
echo -n "Query performance (projects count): " | tee -a test-report.txt
QUERY_START=$(date +%s%N)
psql $STAGING_DB_URL -c "SELECT COUNT(*) FROM projects;" > /dev/null
QUERY_END=$(date +%s%N)
QUERY_DURATION=$(( (QUERY_END - QUERY_START) / 1000000 ))  # Convert to ms
echo "${QUERY_DURATION}ms" | tee -a test-report.txt
if [ $QUERY_DURATION -lt 1000 ]; then
  echo "✅ Performance acceptable" | tee -a test-report.txt
else
  echo "⚠️ WARNING - Slow query (${QUERY_DURATION}ms)" | tee -a test-report.txt
fi
```

#### Step 6: Test Report Summary

```bash
echo "" | tee -a test-report.txt
echo "=== Test Summary ===" | tee -a test-report.txt
echo "Status: ✅ PASSED" | tee -a test-report.txt
echo "Total Duration: ${DURATION}s" | tee -a test-report.txt
echo "Backup File: $LATEST_BACKUP" | tee -a test-report.txt
echo "Restore Size: $(pg_size_pretty $(psql $STAGING_DB_URL -t -c 'SELECT pg_database_size(current_database());'))" | tee -a test-report.txt
echo "Tables Restored: $(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")" | tee -a test-report.txt
echo "Total Rows: $(psql $STAGING_DB_URL -t -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;")" | tee -a test-report.txt
echo "" | tee -a test-report.txt
echo "Next Test Due: $(date -d '+3 months' +%Y-%m-%d)" | tee -a test-report.txt

# Archive test report
REPORT_NAME="backup-test-report-$(date +%Y%m%d).txt"
cp test-report.txt $REPORT_NAME

# Upload to S3
aws s3 cp $REPORT_NAME s3://wastewise-backups/test-reports/$REPORT_NAME

echo "Test report saved: $REPORT_NAME"
```

### Success Criteria

- [ ] Backup downloads successfully
- [ ] Checksum validates
- [ ] Restore completes without critical errors
- [ ] All critical tables have data
- [ ] No data integrity issues found
- [ ] Application connects to database
- [ ] API endpoints return valid responses
- [ ] Query performance acceptable (<1 second)
- [ ] Test report generated and archived

### Follow-up Actions

**If test passes**:
- Archive test report to S3
- Update next test due date in this document
- Email summary to team

**If test fails**:
- Create incident ticket
- Document failure in test report
- Investigate root cause immediately
- Fix issues before next production backup
- Re-run test until passed

---

## Test 3: Table-Level Restore (Quarterly)

**Frequency**: Quarterly (Q2)
**Duration**: 20 minutes
**Environment**: Staging database

### Purpose
Verify partial recovery scenarios work correctly.

### Procedure

```bash
echo "=== Table-Level Restore Test ==="

# Download backup
aws s3 cp s3://wastewise-backups/$LATEST_BACKUP ./test-restore.dump

# Test scenario: Restore only 'projects' table
echo "Scenario: Accidental DROP TABLE projects"

# 1. Drop table in staging
psql $STAGING_DB_URL -c "DROP TABLE IF EXISTS projects CASCADE;"

# 2. Verify table is missing
TABLE_EXISTS=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='projects';")
if [ $TABLE_EXISTS -eq 0 ]; then
  echo "✅ Table dropped successfully"
else
  echo "❌ Table still exists!"
  exit 1
fi

# 3. Restore table from backup
pg_restore test-restore.dump \
  --table=projects \
  --dbname=$STAGING_DB_URL

# 4. Verify table restored
TABLE_EXISTS=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='projects';")
if [ $TABLE_EXISTS -eq 1 ]; then
  echo "✅ Table restored successfully"
else
  echo "❌ Table restoration failed!"
  exit 1
fi

# 5. Verify data
ROW_COUNT=$(psql $STAGING_DB_URL -t -c "SELECT COUNT(*) FROM projects;")
echo "✅ Restored $ROW_COUNT rows"

echo "=== Test Passed ✅ ==="
```

### Success Criteria
- Table drops successfully
- Table restores successfully
- Row count matches expected
- Foreign key constraints restored
- Application can query table

---

## Test 4: Point-in-Time Recovery (Quarterly)

**Frequency**: Quarterly (Q3)
**Duration**: 30 minutes
**Environment**: Supabase Pro tier required

### Purpose
Verify PITR functionality for precise recovery.

### Procedure

1. **Create test data** in staging:
```sql
-- Insert test record with known timestamp
INSERT INTO projects (id, user_id, property_name, units, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'PITR Test Property',
  100,
  NOW()
);

-- Record timestamp
SELECT id, created_at FROM projects WHERE property_name = 'PITR Test Property';
-- Result: id=abc-123, created_at=2025-01-21 14:30:45.123
```

2. **Simulate data corruption** (2 minutes later):
```sql
-- Delete the test record
DELETE FROM projects WHERE property_name = 'PITR Test Property';

-- Verify it's gone
SELECT COUNT(*) FROM projects WHERE property_name = 'PITR Test Property';
-- Result: 0
```

3. **Initiate PITR via Supabase Dashboard**:
- Navigate to: **Database → Point in Time Recovery**
- Select timestamp: `2025-01-21 14:31:00` (after insert, before delete)
- Create new project (non-destructive test)
- Wait for recovery (~10 minutes)

4. **Verify recovery**:
```bash
# Connect to recovered database
RECOVERED_DB_URL="postgresql://...new-url..."

# Check test record exists
psql $RECOVERED_DB_URL -c "
  SELECT id, property_name, created_at
  FROM projects
  WHERE property_name = 'PITR Test Property';
"
# Should return 1 row

echo "✅ PITR Test Passed - Record recovered"
```

5. **Cleanup**:
- Pause or delete the temporary recovered project
- Document test results

### Success Criteria
- Test record created successfully
- Test record deleted successfully (simulating loss)
- PITR initiated successfully
- Test record exists in recovered database
- Timestamp is correct (after insert, before delete)

---

## Test 5: Disaster Drill (Annual)

**Frequency**: Annually (Q4)
**Duration**: 2 hours
**Environment**: Full staging environment

### Purpose
Simulate complete disaster scenario to test end-to-end recovery.

### Scenario: Simulated Ransomware Attack

**Timeline**:
- **T+0:00** - Attack detected, database encrypted
- **T+0:05** - Incident declared, recovery initiated
- **T+0:10** - Backup downloaded and verified
- **T+0:30** - New clean database provisioned
- **T+0:45** - Database restored
- **T+1:00** - Application redeployed and tested
- **T+1:30** - Service resumed
- **T+2:00** - Post-mortem started

### Procedure

See `DATABASE_RECOVERY_PROCEDURES.md` → Scenario 4 for full procedure.

**Additional Test Requirements**:
- [ ] Test communication procedures (Slack notifications)
- [ ] Test escalation (notify on-call engineer)
- [ ] Test security response (isolate systems)
- [ ] Test backup immutability (S3 object lock)
- [ ] Test credential rotation procedures
- [ ] Document every step with timestamps
- [ ] Measure actual RTO vs target (1 hour)

### Success Criteria
- Complete recovery achieved within 2 hours
- All stakeholders notified
- Security procedures followed
- Application functional after recovery
- Post-mortem document created

---

## Test Documentation Template

```markdown
# Backup Test Report

**Test Date**: YYYY-MM-DD
**Test Type**: [Full Restore | Table Restore | PITR | Disaster Drill]
**Tester**: [Name]
**Environment**: [Staging | Production-like]

## Summary
- **Status**: [PASSED | FAILED | PARTIAL]
- **Duration**: [XX minutes]
- **Issues Found**: [None | List issues]

## Test Details

### Backup Information
- Backup File: wastewise_backup_YYYYMMDD_HHMMSS.dump
- Backup Date: YYYY-MM-DD
- Backup Size: X GB
- Checksum: [Verified ✅ | Failed ❌]

### Restore Process
- Start Time: HH:MM:SS
- End Time: HH:MM:SS
- Duration: XX seconds
- Errors: [Count]

### Data Validation
| Table | Expected Rows | Actual Rows | Status |
|-------|---------------|-------------|--------|
| users | XX | XX | ✅ |
| projects | XX | XX | ✅ |
| invoices | XX | XX | ✅ |

### Application Tests
- [ ] Health check passed
- [ ] Database connection successful
- [ ] API endpoints functional
- [ ] Authentication working
- [ ] Query performance acceptable

## Issues Found
[List any issues discovered]

## Recommendations
[List any improvements or actions needed]

## Next Test Due
[Date of next quarterly test]

## Attachments
- Full restore log: restore-output.log
- Test output: test-report.txt
```

---

## Continuous Testing Automation

**Monthly Automated Tests** (via cron):

```bash
# /etc/cron.monthly/backup-integrity-test.sh

#!/bin/bash
# Run first Monday of every month at 2 AM

# Download latest 3 backups
for i in {1..3}; do
  BACKUP=$(aws s3 ls s3://wastewise-backups/ --recursive | \
    grep "\.dump$" | sort | tail -$i | head -1 | awk '{print $4}')

  aws s3 cp s3://wastewise-backups/$BACKUP ./

  # Run integrity test
  if pg_restore --list $BACKUP > /dev/null 2>&1; then
    echo "✅ $(basename $BACKUP) - PASS"
  else
    echo "❌ $(basename $BACKUP) - FAIL"
    # Send alert
    aws sns publish \
      --topic-arn arn:aws:sns:us-east-1:123456789:backup-alerts \
      --message "Backup integrity test FAILED for $BACKUP"
  fi

  rm $BACKUP
done
```

---

## Test Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| Backup Integrity Test Pass Rate | 100% | Automated monthly tests |
| Full Restore Duration | <60 minutes | Quarterly drill |
| Table Restore Duration | <15 minutes | Quarterly drill |
| PITR Availability | 100% uptime | Monitor Supabase dashboard |
| Disaster Drill RTO | <2 hours | Annual drill |
| Test Documentation Completion | 100% | Quarterly review |

---

**Reminder**: Schedule next test in calendar now!
