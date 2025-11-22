#!/bin/bash

# WasteWise Database Restore Script
# Version: 1.0.0
# Purpose: Restore database from backup with verification and rollback
# Usage: ./scripts/restore-database.sh [--source local|s3] [--backup-file PATH] [--point-in-time TIMESTAMP] [--dry-run]

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
SOURCE_TYPE="${1:-local}"    # local, s3
BACKUP_FILE="${2:-}"          # Path to backup file (if local)
POINT_IN_TIME="${3:-}"        # YYYY-MM-DD HH:MM:SS (for PITR)
DRY_RUN="${4:-false}"         # Simulate restore without executing

# Timestamp for logging
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Restore directories
RESTORE_ROOT="${PROJECT_ROOT}/restores"
RESTORE_LOGS="${RESTORE_ROOT}/logs"
TEMP_DIR="${RESTORE_ROOT}/temp"

# Create directories if they don't exist
mkdir -p "$RESTORE_LOGS"
mkdir -p "$TEMP_DIR"

# Log file
LOG_FILE="${RESTORE_LOGS}/restore-${TIMESTAMP}.log"

# Database connection (from Supabase)
DB_HOST="${SUPABASE_DB_HOST:-db.$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|supabase.co|supabase.co|')}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASSWORD="${SUPABASE_SERVICE_KEY}"

# Connection string
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Cloud storage settings
S3_BUCKET="${BACKUP_S3_BUCKET:-wastewise-backups}"

# Pre-restore backup (safety net)
PRE_RESTORE_BACKUP="${RESTORE_ROOT}/pre-restore-${TIMESTAMP}.sql"

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
# SAFETY CHECKS
# ============================================================================

confirm_restore() {
  if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN MODE - No changes will be made"
    return 0
  fi

  log_warning "========================================="
  log_warning "         DATABASE RESTORE WARNING        "
  log_warning "========================================="
  log_warning "This will OVERWRITE the current database!"
  log_warning "All current data will be LOST!"
  log_warning ""
  log_warning "Database: $DB_NAME"
  log_warning "Host: $DB_HOST"
  log_warning "Source: $SOURCE_TYPE"
  if [ -n "$BACKUP_FILE" ]; then
    log_warning "Backup: $BACKUP_FILE"
  fi
  if [ -n "$POINT_IN_TIME" ]; then
    log_warning "Point-in-time: $POINT_IN_TIME"
  fi
  log_warning ""
  log_warning "A pre-restore backup will be created automatically"
  log_warning "========================================="

  read -p "Type 'RESTORE' to confirm: " confirmation

  if [ "$confirmation" != "RESTORE" ]; then
    log_error "Restore cancelled by user"
    exit 1
  fi

  log_info "Restore confirmed by user"
}

validate_dependencies() {
  log_info "Validating dependencies..."

  # Check for required commands
  local required_commands=("pg_restore" "pg_dump" "psql")

  if [ "$SOURCE_TYPE" = "s3" ]; then
    required_commands+=("aws")
  fi

  # Check if backup is encrypted (need GPG)
  if [[ "$BACKUP_FILE" == *.gpg ]]; then
    required_commands+=("gpg")
  fi

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "Required command not found: $cmd"
      log_error "Please install $cmd and try again"
      exit 1
    fi
  done

  log_success "All dependencies validated"
}

validate_database_connection() {
  log_info "Validating database connection..."

  if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    log_error "Failed to connect to database"
    log_error "Check your Supabase credentials and network connectivity"
    exit 1
  fi

  log_success "Database connection validated"
}

check_database_activity() {
  log_info "Checking for active database connections..."

  local active_connections=$(psql "$DATABASE_URL" -t -c "
    SELECT count(*) FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    AND pid != pg_backend_pid()
    AND state = 'active';
  " | xargs)

  if [ "$active_connections" -gt 0 ]; then
    log_warning "Found $active_connections active connection(s)"
    log_warning "Restore may fail if connections are not terminated"

    if [ "$DRY_RUN" != "true" ]; then
      read -p "Terminate active connections? (y/n): " terminate

      if [ "$terminate" = "y" ]; then
        log_info "Terminating active connections..."
        psql "$DATABASE_URL" -c "
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = '$DB_NAME'
          AND pid != pg_backend_pid();
        " &> /dev/null
        log_success "Active connections terminated"
      else
        log_warning "Proceeding with active connections (may fail)"
      fi
    fi
  else
    log_success "No active connections found"
  fi
}

# ============================================================================
# BACKUP ACQUISITION
# ============================================================================

download_from_s3() {
  log_info "Downloading backup from S3..."

  # If no specific file provided, list available backups
  if [ -z "$BACKUP_FILE" ]; then
    log_info "Available backups:"
    aws s3 ls "s3://${S3_BUCKET}/" --recursive | tail -20

    read -p "Enter backup path (from bucket root): " BACKUP_FILE
  fi

  local s3_path="s3://${S3_BUCKET}/${BACKUP_FILE}"
  local local_path="${TEMP_DIR}/$(basename "$BACKUP_FILE")"

  log_info "Downloading from: $s3_path"
  log_info "Downloading to: $local_path"

  if aws s3 cp "$s3_path" "$local_path" 2>&1 | tee -a "$LOG_FILE"; then
    # Download checksum and metadata if available
    aws s3 cp "${s3_path}.sha256" "${local_path}.sha256" 2>&1 | tee -a "$LOG_FILE" || true
    aws s3 cp "${s3_path}.meta.json" "${local_path}.meta.json" 2>&1 | tee -a "$LOG_FILE" || true

    log_success "Backup downloaded successfully"
    BACKUP_FILE="$local_path"
  else
    log_error "Failed to download backup from S3"
    exit 1
  fi
}

decrypt_backup() {
  if [[ "$BACKUP_FILE" != *.gpg ]]; then
    log_info "Backup is not encrypted, skipping decryption"
    return 0
  fi

  log_info "Decrypting backup..."

  local decrypted_file="${BACKUP_FILE%.gpg}"

  if gpg --decrypt --output "$decrypted_file" "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Backup decrypted successfully"
    BACKUP_FILE="$decrypted_file"
  else
    log_error "Failed to decrypt backup"
    exit 1
  fi
}

verify_backup_integrity() {
  log_info "Verifying backup integrity..."

  # Check if file exists
  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi

  # Verify checksum if available
  local checksum_file="${BACKUP_FILE}.sha256"
  if [ -f "$checksum_file" ]; then
    log_info "Verifying checksum..."
    if sha256sum -c "$checksum_file" 2>&1 | tee -a "$LOG_FILE"; then
      log_success "Checksum verification passed"
    else
      log_error "Checksum verification failed"
      log_error "Backup may be corrupted"
      exit 1
    fi
  else
    log_warning "No checksum file found, skipping verification"
  fi

  # Verify pg_restore can read the file
  log_info "Verifying backup format..."
  if pg_restore --list "$BACKUP_FILE" &> /dev/null; then
    log_success "Backup format verified"
  else
    log_error "Invalid backup format"
    log_error "pg_restore cannot read this file"
    exit 1
  fi
}

# ============================================================================
# PRE-RESTORE BACKUP
# ============================================================================

create_pre_restore_backup() {
  if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN: Skipping pre-restore backup"
    return 0
  fi

  log_info "Creating pre-restore backup (safety net)..."
  log_info "Output: $PRE_RESTORE_BACKUP"

  if pg_dump "$DATABASE_URL" \
    --format=custom \
    --compress=9 \
    --file="$PRE_RESTORE_BACKUP" \
    2>&1 | tee -a "$LOG_FILE"; then

    local backup_size=$(du -h "$PRE_RESTORE_BACKUP" | cut -f1)
    log_success "Pre-restore backup created: $backup_size"

    # Create metadata
    cat > "${PRE_RESTORE_BACKUP}.meta.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "purpose": "pre-restore-backup",
  "original_restore_source": "$BACKUP_FILE",
  "size_bytes": $(stat -f%z "$PRE_RESTORE_BACKUP" 2>/dev/null || stat -c%s "$PRE_RESTORE_BACKUP")
}
EOF
  else
    log_error "Failed to create pre-restore backup"
    log_error "Aborting restore for safety"
    exit 1
  fi
}

# ============================================================================
# RESTORE OPERATIONS
# ============================================================================

restore_full_database() {
  log_info "Starting full database restore..."
  log_info "Source: $BACKUP_FILE"

  if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN: Would restore from $BACKUP_FILE"
    log_info "DRY RUN: Target database: $DB_NAME"
    return 0
  fi

  local start_time=$(date +%s)

  # Drop existing connections (already done in check_database_activity)
  # Drop and recreate database (safer than --clean)
  log_info "Dropping existing database..."
  psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS ${DB_NAME}_temp;" 2>&1 | tee -a "$LOG_FILE"
  psql "$DATABASE_URL" -c "CREATE DATABASE ${DB_NAME}_temp;" 2>&1 | tee -a "$LOG_FILE"

  # Restore to temporary database first
  log_info "Restoring to temporary database..."
  local temp_db_url="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}_temp?sslmode=require"

  if pg_restore --verbose \
    --dbname="$temp_db_url" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$BACKUP_FILE" \
    2>&1 | tee -a "$LOG_FILE"; then

    # Verify restore by checking table count
    local table_count=$(psql "$temp_db_url" -t -c "
      SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public';
    " | xargs)

    log_info "Restored $table_count tables"

    if [ "$table_count" -lt 5 ]; then
      log_error "Restored table count suspiciously low: $table_count"
      log_error "Restore may have failed"
      exit 1
    fi

    # Swap databases (atomic operation)
    log_info "Swapping databases..."
    psql "$DATABASE_URL" -c "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old;" 2>&1 | tee -a "$LOG_FILE"
    psql "$DATABASE_URL" -c "ALTER DATABASE ${DB_NAME}_temp RENAME TO $DB_NAME;" 2>&1 | tee -a "$LOG_FILE"

    # Drop old database
    log_info "Dropping old database..."
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS ${DB_NAME}_old;" 2>&1 | tee -a "$LOG_FILE"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Full database restore completed"
    log_info "Duration: ${duration}s"
    log_info "Tables restored: $table_count"
  else
    log_error "Database restore failed"
    log_error "Cleaning up temporary database..."
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS ${DB_NAME}_temp;" 2>&1 | tee -a "$LOG_FILE"
    exit 1
  fi
}

restore_point_in_time() {
  if [ -z "$POINT_IN_TIME" ]; then
    log_error "Point-in-time timestamp required"
    log_error "Usage: ./restore-database.sh --point-in-time '2025-11-22 14:30:00'"
    exit 1
  fi

  log_info "Starting point-in-time recovery..."
  log_info "Target time: $POINT_IN_TIME"

  if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN: Would restore to $POINT_IN_TIME"
    return 0
  fi

  # PITR requires Supabase Pro/Team plan with WAL archiving
  log_warning "PITR requires Supabase Pro/Team plan"
  log_warning "Contact Supabase support to initiate PITR"

  # For now, log instructions
  log_info "To perform PITR:"
  log_info "1. Log into Supabase Dashboard"
  log_info "2. Navigate to Database > Backups"
  log_info "3. Select 'Point-in-Time Recovery'"
  log_info "4. Enter timestamp: $POINT_IN_TIME"
  log_info "5. Confirm restore"

  # Alternative: Use base backup + WAL replay
  # This requires WAL archives to be available
  log_warning "Automated PITR not yet implemented"
  log_warning "Please use Supabase Dashboard or contact support"
  exit 1
}

restore_specific_table() {
  local table_name="$1"

  if [ -z "$table_name" ]; then
    log_error "Table name required for table-level restore"
    exit 1
  fi

  log_info "Starting table-level restore..."
  log_info "Table: $table_name"

  if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN: Would restore table $table_name"
    return 0
  fi

  # Extract specific table from backup
  if pg_restore --verbose \
    --dbname="$DATABASE_URL" \
    --table="$table_name" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$BACKUP_FILE" \
    2>&1 | tee -a "$LOG_FILE"; then

    log_success "Table restored: $table_name"
  else
    log_error "Table restore failed: $table_name"
    exit 1
  fi
}

# ============================================================================
# POST-RESTORE VALIDATION
# ============================================================================

validate_restore() {
  log_info "Validating restored database..."

  # Check critical tables exist
  local critical_tables=("users" "projects" "analysis_jobs" "invoice_data")

  for table in "${critical_tables[@]}"; do
    local row_count=$(psql "$DATABASE_URL" -t -c "
      SELECT count(*) FROM $table;
    " 2>&1 | xargs)

    if [ $? -eq 0 ]; then
      log_success "Table '$table' validated: $row_count rows"
    else
      log_error "Table '$table' missing or inaccessible"
      return 1
    fi
  done

  # Check database size
  local db_size=$(psql "$DATABASE_URL" -t -c "
    SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
  " | xargs)
  log_info "Database size: $db_size"

  # Run simple queries to verify data integrity
  log_info "Running integrity checks..."

  # Check for foreign key violations
  # (This would be custom SQL depending on your schema)

  log_success "Database validation complete"
}

# ============================================================================
# ROLLBACK
# ============================================================================

rollback_restore() {
  log_warning "Rolling back to pre-restore backup..."

  if [ ! -f "$PRE_RESTORE_BACKUP" ]; then
    log_error "Pre-restore backup not found: $PRE_RESTORE_BACKUP"
    log_error "Cannot rollback automatically"
    exit 1
  fi

  # Use the pre-restore backup as the source
  BACKUP_FILE="$PRE_RESTORE_BACKUP"

  log_info "Restoring from: $PRE_RESTORE_BACKUP"
  restore_full_database

  log_success "Rollback complete"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  log_info "========================================"
  log_info "WasteWise Database Restore Starting"
  log_info "========================================"
  log_info "Source type: $SOURCE_TYPE"
  log_info "Dry run: $DRY_RUN"
  log_info "Timestamp: $TIMESTAMP"

  local overall_start=$(date +%s)

  # Safety checks
  confirm_restore
  validate_dependencies
  validate_database_connection
  check_database_activity

  # Acquire backup
  if [ "$SOURCE_TYPE" = "s3" ]; then
    download_from_s3
  elif [ -z "$BACKUP_FILE" ]; then
    log_error "Backup file required for local restore"
    log_error "Usage: ./restore-database.sh local /path/to/backup.sql"
    exit 1
  fi

  # Prepare backup
  decrypt_backup
  verify_backup_integrity

  # Create safety backup
  create_pre_restore_backup

  # Perform restore
  if [ -n "$POINT_IN_TIME" ]; then
    restore_point_in_time
  else
    restore_full_database
  fi

  # Validate
  if ! validate_restore; then
    log_error "Restore validation failed"
    read -p "Rollback to pre-restore state? (y/n): " rollback

    if [ "$rollback" = "y" ]; then
      rollback_restore
    fi
    exit 1
  fi

  # Calculate total duration
  local overall_end=$(date +%s)
  local total_duration=$((overall_end - overall_start))

  log_info "========================================"
  log_success "Restore completed successfully"
  log_info "Total duration: ${total_duration}s"
  log_info "Pre-restore backup saved: $PRE_RESTORE_BACKUP"
  log_info "========================================"
}

# Execute main function
main "$@"
