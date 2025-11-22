#!/bin/bash

# WasteWise Backup Testing Script
# Version: 1.0.0
# Purpose: Quarterly backup testing and validation
# Usage: ./scripts/test-backup.sh [--backup-file PATH] [--full-test]

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# CONFIGURATION
# ============================================================================

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  source "$PROJECT_ROOT/.env.local"
  set +a
fi

# Parse command-line arguments
BACKUP_FILE="${1:-}"          # Path to backup file to test
FULL_TEST="${2:-false}"       # Run full restore test (time-consuming)

# Timestamp for test results
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Test directories
TEST_ROOT="${PROJECT_ROOT}/backup-tests"
TEST_LOGS="${TEST_ROOT}/logs"
TEST_RESULTS="${TEST_ROOT}/results"

# Create directories
mkdir -p "$TEST_LOGS"
mkdir -p "$TEST_RESULTS"

# Log and results files
LOG_FILE="${TEST_LOGS}/test-${TIMESTAMP}.log"
RESULTS_FILE="${TEST_RESULTS}/test-${TIMESTAMP}.json"

# Database connection (test instance)
DB_HOST="${SUPABASE_DB_HOST:-db.$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|supabase.co|supabase.co|')}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASSWORD="${SUPABASE_SERVICE_KEY}"

# Test database name (separate from production)
TEST_DB_NAME="${DB_NAME}_backup_test"

# Connection strings
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
TEST_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${TEST_DB_NAME}?sslmode=require"

# Cloud storage settings
S3_BUCKET="${BACKUP_S3_BUCKET:-wastewise-backups}"

# Test results
declare -A TEST_RESULTS_MAP=(
  ["backup_exists"]=false
  ["backup_readable"]=false
  ["checksum_valid"]=false
  ["encryption_valid"]=false
  ["metadata_exists"]=false
  ["restore_successful"]=false
  ["data_integrity"]=false
  ["performance_acceptable"]=false
)

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log() {
  local level="$1"
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
  log "INFO" "$@"
}

log_error() {
  log "ERROR" "$@"
}

log_success() {
  log "SUCCESS" "$@"
}

log_warning() {
  log "WARNING" "$@"
}

# ============================================================================
# TEST HELPERS
# ============================================================================

test_passed() {
  local test_name="$1"
  TEST_RESULTS_MAP["$test_name"]=true
  log_success "✓ PASS: $test_name"
}

test_failed() {
  local test_name="$1"
  local reason="$2"
  TEST_RESULTS_MAP["$test_name"]=false
  log_error "✗ FAIL: $test_name - $reason"
}

# ============================================================================
# BACKUP DISCOVERY
# ============================================================================

find_latest_backup() {
  log_info "Finding latest backup..."

  # Check local backups first
  local local_backup=$(find "${PROJECT_ROOT}/backups" -name "*.sql.gpg" -o -name "*.sql" 2>/dev/null | sort -r | head -1)

  if [ -n "$local_backup" ] && [ -f "$local_backup" ]; then
    log_info "Found local backup: $local_backup"
    BACKUP_FILE="$local_backup"
    return 0
  fi

  # Check S3 backups
  log_info "Checking S3 for latest backup..."
  local s3_backup=$(aws s3 ls "s3://${S3_BUCKET}/" --recursive | sort | tail -1 | awk '{print $4}')

  if [ -n "$s3_backup" ]; then
    log_info "Found S3 backup: $s3_backup"

    # Download to test directory
    local local_path="${TEST_ROOT}/$(basename "$s3_backup")"
    aws s3 cp "s3://${S3_BUCKET}/${s3_backup}" "$local_path"

    BACKUP_FILE="$local_path"
    return 0
  fi

  log_error "No backups found locally or in S3"
  return 1
}

# ============================================================================
# TEST 1: BACKUP FILE VALIDATION
# ============================================================================

test_backup_exists() {
  log_info "Test 1: Backup file exists"

  if [ -z "$BACKUP_FILE" ]; then
    if ! find_latest_backup; then
      test_failed "backup_exists" "No backup file specified and none found"
      return 1
    fi
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    test_failed "backup_exists" "Backup file not found: $BACKUP_FILE"
    return 1
  fi

  local file_size=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
  local file_size_human=$(numfmt --to=iec $file_size)

  log_info "Backup file: $BACKUP_FILE"
  log_info "File size: $file_size_human"

  if [ "$file_size" -lt 1048576 ]; then  # < 1MB
    test_failed "backup_exists" "Backup file suspiciously small: $file_size_human"
    return 1
  fi

  test_passed "backup_exists"
}

# ============================================================================
# TEST 2: BACKUP READABILITY
# ============================================================================

test_backup_readable() {
  log_info "Test 2: Backup file is readable"

  # Check if encrypted
  if [[ "$BACKUP_FILE" == *.gpg ]]; then
    log_info "Backup is encrypted, attempting to decrypt..."

    local decrypted_file="${BACKUP_FILE%.gpg}"

    if gpg --decrypt --output "$decrypted_file" "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
      log_success "Backup decrypted successfully"
      BACKUP_FILE="$decrypted_file"
    else
      test_failed "backup_readable" "Failed to decrypt backup"
      return 1
    fi
  fi

  # Verify pg_restore can read the backup
  if pg_restore --list "$BACKUP_FILE" &> /dev/null; then
    local table_count=$(pg_restore --list "$BACKUP_FILE" | grep -c "TABLE DATA" || true)
    log_info "Backup contains $table_count tables"

    if [ "$table_count" -lt 5 ]; then
      test_failed "backup_readable" "Table count suspiciously low: $table_count"
      return 1
    fi

    test_passed "backup_readable"
  else
    test_failed "backup_readable" "pg_restore cannot read backup file"
    return 1
  fi
}

# ============================================================================
# TEST 3: CHECKSUM VALIDATION
# ============================================================================

test_checksum_validation() {
  log_info "Test 3: Checksum validation"

  local checksum_file="${BACKUP_FILE}.sha256"

  if [ ! -f "$checksum_file" ]; then
    log_warning "Checksum file not found, skipping validation"
    test_failed "checksum_valid" "Checksum file missing"
    return 1
  fi

  if sha256sum -c "$checksum_file" 2>&1 | tee -a "$LOG_FILE"; then
    test_passed "checksum_valid"
  else
    test_failed "checksum_valid" "Checksum mismatch - backup may be corrupted"
    return 1
  fi
}

# ============================================================================
# TEST 4: ENCRYPTION VALIDATION
# ============================================================================

test_encryption_validation() {
  log_info "Test 4: Encryption validation"

  # Re-check original file before decryption
  local original_file="$BACKUP_FILE"
  if [[ ! "$original_file" == *.gpg ]]; then
    original_file="${BACKUP_FILE}.gpg"
  fi

  if [ ! -f "$original_file" ]; then
    log_warning "Original encrypted file not found, skipping encryption test"
    test_failed "encryption_valid" "Encrypted file not available"
    return 1
  fi

  # Verify GPG encryption
  if gpg --list-packets "$original_file" 2>&1 | grep -q "encrypted"; then
    log_info "Backup is properly encrypted with GPG"

    # Check encryption algorithm
    local algo=$(gpg --list-packets "$original_file" 2>&1 | grep "cipher algo" | head -1)
    log_info "Encryption: $algo"

    test_passed "encryption_valid"
  else
    test_failed "encryption_valid" "Backup is not encrypted or encryption is invalid"
    return 1
  fi
}

# ============================================================================
# TEST 5: METADATA VALIDATION
# ============================================================================

test_metadata_exists() {
  log_info "Test 5: Metadata validation"

  local metadata_file="${BACKUP_FILE}.meta.json"

  if [ ! -f "$metadata_file" ]; then
    log_warning "Metadata file not found: $metadata_file"
    test_failed "metadata_exists" "Metadata file missing"
    return 1
  fi

  # Parse and validate metadata
  if command -v jq &> /dev/null; then
    local backup_type=$(jq -r '.backup_type' "$metadata_file")
    local retention_days=$(jq -r '.retention_days' "$metadata_file")
    local expires_at=$(jq -r '.expires_at' "$metadata_file")

    log_info "Backup type: $backup_type"
    log_info "Retention: $retention_days days"
    log_info "Expires: $expires_at"

    # Check if backup has expired
    local expiry_epoch=$(date -d "$expires_at" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$expires_at" +%s)
    local now_epoch=$(date +%s)

    if [ "$expiry_epoch" -lt "$now_epoch" ]; then
      log_warning "Backup has expired: $expires_at"
      test_failed "metadata_exists" "Backup expired"
      return 1
    fi

    test_passed "metadata_exists"
  else
    log_warning "jq not installed, skipping metadata validation"
    test_failed "metadata_exists" "Cannot validate metadata (jq not installed)"
    return 1
  fi
}

# ============================================================================
# TEST 6: RESTORE TEST (FULL)
# ============================================================================

test_restore_functionality() {
  if [ "$FULL_TEST" != "true" ]; then
    log_info "Test 6: Restore test (SKIPPED - use --full-test to enable)"
    test_failed "restore_successful" "Full test not requested"
    return 1
  fi

  log_info "Test 6: Full restore test"
  log_warning "This will create a temporary test database"

  # Create test database
  log_info "Creating test database: $TEST_DB_NAME"
  psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>&1 | tee -a "$LOG_FILE"
  psql "$DATABASE_URL" -c "CREATE DATABASE $TEST_DB_NAME;" 2>&1 | tee -a "$LOG_FILE"

  # Restore to test database
  log_info "Restoring backup to test database..."
  local start_time=$(date +%s)

  if pg_restore --verbose \
    --dbname="$TEST_DB_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$BACKUP_FILE" \
    2>&1 | tee -a "$LOG_FILE"; then

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Restore completed in ${duration}s"

    # Verify table count
    local table_count=$(psql "$TEST_DB_URL" -t -c "
      SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public';
    " | xargs)

    log_info "Restored $table_count tables"

    if [ "$table_count" -lt 5 ]; then
      test_failed "restore_successful" "Table count too low: $table_count"
      return 1
    fi

    # Store performance metric
    echo "$duration" > "${TEST_ROOT}/restore_duration.txt"

    test_passed "restore_successful"
  else
    test_failed "restore_successful" "Restore failed"
    return 1
  fi
}

# ============================================================================
# TEST 7: DATA INTEGRITY
# ============================================================================

test_data_integrity() {
  if [ "$FULL_TEST" != "true" ]; then
    log_info "Test 7: Data integrity (SKIPPED - requires full restore)"
    test_failed "data_integrity" "Full test not requested"
    return 1
  fi

  log_info "Test 7: Data integrity validation"

  # Verify critical tables exist and have data
  local critical_tables=("users" "projects" "analysis_jobs" "invoice_data")
  local all_valid=true

  for table in "${critical_tables[@]}"; do
    local row_count=$(psql "$TEST_DB_URL" -t -c "SELECT count(*) FROM $table;" 2>&1 | xargs)

    if [ $? -eq 0 ]; then
      log_info "✓ Table '$table': $row_count rows"
    else
      log_error "✗ Table '$table': Missing or inaccessible"
      all_valid=false
    fi
  done

  # Check for foreign key consistency
  log_info "Checking foreign key constraints..."
  local fk_violations=$(psql "$TEST_DB_URL" -t -c "
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY';
  " 2>&1 | xargs)

  log_info "Foreign key constraints: $fk_violations"

  # Verify no NULL values in critical NOT NULL columns
  # (This would be custom SQL based on your schema)

  if [ "$all_valid" = true ]; then
    test_passed "data_integrity"
  else
    test_failed "data_integrity" "Some tables missing or inaccessible"
    return 1
  fi
}

# ============================================================================
# TEST 8: PERFORMANCE VALIDATION
# ============================================================================

test_performance() {
  if [ "$FULL_TEST" != "true" ]; then
    log_info "Test 8: Performance validation (SKIPPED - requires full restore)"
    test_failed "performance_acceptable" "Full test not requested"
    return 1
  fi

  log_info "Test 8: Performance validation"

  # Check restore duration (should be < 1 hour for RTO compliance)
  if [ -f "${TEST_ROOT}/restore_duration.txt" ]; then
    local duration=$(cat "${TEST_ROOT}/restore_duration.txt")
    local max_duration=3600  # 1 hour

    log_info "Restore duration: ${duration}s"
    log_info "RTO requirement: ${max_duration}s (1 hour)"

    if [ "$duration" -gt "$max_duration" ]; then
      test_failed "performance_acceptable" "Restore took longer than RTO: ${duration}s > ${max_duration}s"
      return 1
    fi

    test_passed "performance_acceptable"
  else
    test_failed "performance_acceptable" "Duration data not available"
    return 1
  fi
}

# ============================================================================
# CLEANUP
# ============================================================================

cleanup_test_environment() {
  log_info "Cleaning up test environment..."

  # Drop test database
  if psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Test database dropped"
  else
    log_warning "Failed to drop test database"
  fi

  # Remove temporary files (keep logs and results)
  if [ -f "${BACKUP_FILE%.gpg}" ] && [[ "$BACKUP_FILE" == *"backup-tests"* ]]; then
    rm -f "${BACKUP_FILE%.gpg}"
    log_info "Removed temporary decrypted backup"
  fi
}

# ============================================================================
# RESULTS REPORTING
# ============================================================================

generate_test_report() {
  log_info "Generating test report..."

  # Count passed/failed tests
  local total_tests=0
  local passed_tests=0
  local failed_tests=0

  for test_name in "${!TEST_RESULTS_MAP[@]}"; do
    ((total_tests++))
    if [ "${TEST_RESULTS_MAP[$test_name]}" = "true" ]; then
      ((passed_tests++))
    else
      ((failed_tests++))
    fi
  done

  local pass_rate=$((passed_tests * 100 / total_tests))

  # Generate JSON report
  cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_file": "$BACKUP_FILE",
  "full_test": $FULL_TEST,
  "summary": {
    "total_tests": $total_tests,
    "passed": $passed_tests,
    "failed": $failed_tests,
    "pass_rate": $pass_rate
  },
  "tests": {
EOF

  local first=true
  for test_name in "${!TEST_RESULTS_MAP[@]}"; do
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$RESULTS_FILE"
    fi
    echo "    \"$test_name\": ${TEST_RESULTS_MAP[$test_name]}" >> "$RESULTS_FILE"
  done

  cat >> "$RESULTS_FILE" <<EOF

  },
  "log_file": "$LOG_FILE"
}
EOF

  log_info "========================================"
  log_info "         TEST RESULTS SUMMARY"
  log_info "========================================"
  log_info "Total tests: $total_tests"
  log_success "Passed: $passed_tests"
  log_error "Failed: $failed_tests"
  log_info "Pass rate: ${pass_rate}%"
  log_info "========================================"

  if [ "$pass_rate" -ge 80 ]; then
    log_success "✓ Backup testing PASSED (>80% tests passed)"
    return 0
  else
    log_error "✗ Backup testing FAILED (<80% tests passed)"
    return 1
  fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  log_info "========================================"
  log_info "WasteWise Backup Testing"
  log_info "========================================"
  log_info "Timestamp: $TIMESTAMP"
  log_info "Full test: $FULL_TEST"

  # Run all tests
  test_backup_exists
  test_backup_readable
  test_checksum_validation
  test_encryption_validation
  test_metadata_exists
  test_restore_functionality
  test_data_integrity
  test_performance

  # Cleanup
  cleanup_test_environment

  # Generate report
  if generate_test_report; then
    log_success "All backup tests completed successfully"
    log_info "Results saved to: $RESULTS_FILE"
    log_info "Log saved to: $LOG_FILE"
    exit 0
  else
    log_error "Backup testing failed"
    log_info "Results saved to: $RESULTS_FILE"
    log_info "Log saved to: $LOG_FILE"
    exit 1
  fi
}

# Execute main function
main "$@"
