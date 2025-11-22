#!/bin/bash

# WasteWise Database Backup Script
# Version: 1.0.0
# Purpose: Automated database backup with encryption and cloud storage
# Usage: ./scripts/backup-database.sh [--type daily|weekly|monthly|pre-deploy] [--encrypt] [--upload]

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

# Backup configuration
BACKUP_TYPE="${1:-daily}"  # daily, weekly, monthly, pre-deploy
ENCRYPT="${2:-true}"       # Encrypt by default
UPLOAD="${3:-true}"        # Upload to cloud by default

# Timestamp for backup filename
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DATE_ONLY=$(date +%Y-%m-%d)

# Backup directories
BACKUP_ROOT="${PROJECT_ROOT}/backups"
BACKUP_LOCAL="${BACKUP_ROOT}/${BACKUP_TYPE}"
BACKUP_LOGS="${BACKUP_ROOT}/logs"

# Create directories if they don't exist
mkdir -p "$BACKUP_LOCAL"
mkdir -p "$BACKUP_LOGS"

# Log file
LOG_FILE="${BACKUP_LOGS}/backup-${TIMESTAMP}.log"

# Backup filename
BACKUP_FILENAME="wastewise-${BACKUP_TYPE}-${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_LOCAL}/${BACKUP_FILENAME}"

# Encryption settings (if enabled)
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-wastewise-backups}"
ENCRYPTED_FILENAME="${BACKUP_FILENAME}.gpg"
ENCRYPTED_PATH="${BACKUP_LOCAL}/${ENCRYPTED_FILENAME}"

# Cloud storage settings
S3_BUCKET="${BACKUP_S3_BUCKET:-wastewise-backups}"
S3_PATH="${BACKUP_TYPE}/${DATE_ONLY}/${ENCRYPTED_FILENAME}"

# Database connection (from Supabase)
DB_HOST="${SUPABASE_DB_HOST:-db.$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|supabase.co|supabase.co|')}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASSWORD="${SUPABASE_SERVICE_KEY}"

# Connection string
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Retention policies (in days)
declare -A RETENTION=(
  ["daily"]=90
  ["weekly"]=365
  ["monthly"]=2555   # ~7 years
  ["pre-deploy"]=90
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

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

validate_dependencies() {
  log_info "Validating dependencies..."

  # Check for required commands
  local required_commands=("pg_dump" "gzip")

  if [ "$ENCRYPT" = "true" ]; then
    required_commands+=("gpg")
  fi

  if [ "$UPLOAD" = "true" ]; then
    required_commands+=("aws")  # or "rclone" for other providers
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

validate_disk_space() {
  log_info "Checking available disk space..."

  # Get database size
  local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_database_size('$DB_NAME');" | xargs)
  local required_space=$((db_size * 2))  # 2x for safety (dump + compression)

  # Get available space (in bytes)
  local available_space=$(df "$BACKUP_LOCAL" | awk 'NR==2 {print $4 * 1024}')

  if [ "$available_space" -lt "$required_space" ]; then
    log_error "Insufficient disk space"
    log_error "Required: $(numfmt --to=iec $required_space)"
    log_error "Available: $(numfmt --to=iec $available_space)"
    exit 1
  fi

  log_success "Sufficient disk space available"
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

create_backup() {
  log_info "Creating database backup..."
  log_info "Backup type: $BACKUP_TYPE"
  log_info "Output file: $BACKUP_PATH"

  local start_time=$(date +%s)

  # Create backup with pg_dump
  # Options:
  #   -F c: Custom format (compressed, allows parallel restore)
  #   -v: Verbose
  #   -Z 9: Compression level 9 (max)
  #   --no-owner: Don't include ownership commands
  #   --no-acl: Don't include ACL commands
  if pg_dump "$DATABASE_URL" \
    --format=custom \
    --verbose \
    --compress=9 \
    --no-owner \
    --no-acl \
    --file="$BACKUP_PATH" \
    2>&1 | tee -a "$LOG_FILE"; then

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local backup_size=$(du -h "$BACKUP_PATH" | cut -f1)

    log_success "Backup created successfully"
    log_info "Duration: ${duration}s"
    log_info "Size: $backup_size"

    # Log metadata to JSON
    cat > "${BACKUP_PATH}.meta.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_type": "$BACKUP_TYPE",
  "database": "$DB_NAME",
  "size_bytes": $(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH"),
  "duration_seconds": $duration,
  "pg_dump_version": "$(pg_dump --version | head -1)",
  "retention_days": ${RETENTION[$BACKUP_TYPE]},
  "expires_at": "$(date -d "+${RETENTION[$BACKUP_TYPE]} days" +%Y-%m-%d 2>/dev/null || date -v+${RETENTION[$BACKUP_TYPE]}d +%Y-%m-%d)"
}
EOF

    return 0
  else
    log_error "Backup creation failed"
    return 1
  fi
}

encrypt_backup() {
  if [ "$ENCRYPT" != "true" ]; then
    log_info "Encryption disabled, skipping..."
    return 0
  fi

  log_info "Encrypting backup..."
  log_info "Recipient: $GPG_RECIPIENT"

  local start_time=$(date +%s)

  # Encrypt with GPG
  # Options:
  #   -e: Encrypt
  #   -r: Recipient
  #   --trust-model always: Trust the key without confirmation
  #   --output: Output file
  if gpg --encrypt \
    --recipient "$GPG_RECIPIENT" \
    --trust-model always \
    --output "$ENCRYPTED_PATH" \
    "$BACKUP_PATH" \
    2>&1 | tee -a "$LOG_FILE"; then

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local encrypted_size=$(du -h "$ENCRYPTED_PATH" | cut -f1)

    log_success "Backup encrypted successfully"
    log_info "Duration: ${duration}s"
    log_info "Size: $encrypted_size"

    # Remove unencrypted backup for security
    rm -f "$BACKUP_PATH"
    log_info "Removed unencrypted backup"

    # Update metadata
    jq --arg encrypted_size "$(stat -f%z "$ENCRYPTED_PATH" 2>/dev/null || stat -c%s "$ENCRYPTED_PATH")" \
      '. + {encrypted: true, encrypted_size_bytes: ($encrypted_size | tonumber)}' \
      "${BACKUP_PATH}.meta.json" > "${ENCRYPTED_PATH}.meta.json"
    rm -f "${BACKUP_PATH}.meta.json"

    return 0
  else
    log_error "Encryption failed"
    return 1
  fi
}

verify_backup() {
  log_info "Verifying backup integrity..."

  local file_to_verify="$BACKUP_PATH"
  if [ "$ENCRYPT" = "true" ]; then
    file_to_verify="$ENCRYPTED_PATH"
  fi

  # Check if file exists
  if [ ! -f "$file_to_verify" ]; then
    log_error "Backup file not found: $file_to_verify"
    return 1
  fi

  # Check file size (should be > 1MB for non-empty database)
  local file_size=$(stat -f%z "$file_to_verify" 2>/dev/null || stat -c%s "$file_to_verify")
  if [ "$file_size" -lt 1048576 ]; then
    log_error "Backup file suspiciously small: $(numfmt --to=iec $file_size)"
    log_error "This may indicate an incomplete or corrupted backup"
    return 1
  fi

  # If encrypted, verify GPG signature
  if [ "$ENCRYPT" = "true" ]; then
    if gpg --list-packets "$file_to_verify" &> /dev/null; then
      log_success "Backup encryption verified"
    else
      log_error "Backup encryption verification failed"
      return 1
    fi
  fi

  # Generate checksums
  local checksum_file="${file_to_verify}.sha256"
  sha256sum "$file_to_verify" > "$checksum_file"
  log_info "Checksum: $(cat $checksum_file | cut -d' ' -f1)"

  log_success "Backup verification complete"
  return 0
}

upload_to_cloud() {
  if [ "$UPLOAD" != "true" ]; then
    log_info "Cloud upload disabled, skipping..."
    return 0
  fi

  log_info "Uploading backup to cloud storage..."
  log_info "Bucket: s3://$S3_BUCKET"
  log_info "Path: $S3_PATH"

  local file_to_upload="$BACKUP_PATH"
  if [ "$ENCRYPT" = "true" ]; then
    file_to_upload="$ENCRYPTED_PATH"
  fi

  local start_time=$(date +%s)

  # Upload to S3 (or compatible service like R2)
  if aws s3 cp "$file_to_upload" "s3://${S3_BUCKET}/${S3_PATH}" \
    --storage-class STANDARD_IA \
    --server-side-encryption AES256 \
    --metadata "backup-type=${BACKUP_TYPE},retention-days=${RETENTION[$BACKUP_TYPE]}" \
    2>&1 | tee -a "$LOG_FILE"; then

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Backup uploaded successfully"
    log_info "Duration: ${duration}s"
    log_info "URL: s3://${S3_BUCKET}/${S3_PATH}"

    # Upload metadata and checksum
    aws s3 cp "${file_to_upload}.meta.json" "s3://${S3_BUCKET}/${S3_PATH}.meta.json" 2>&1 | tee -a "$LOG_FILE"
    aws s3 cp "${file_to_upload}.sha256" "s3://${S3_BUCKET}/${S3_PATH}.sha256" 2>&1 | tee -a "$LOG_FILE"

    return 0
  else
    log_error "Cloud upload failed"
    return 1
  fi
}

cleanup_old_backups() {
  log_info "Cleaning up old backups..."

  local retention_days=${RETENTION[$BACKUP_TYPE]}
  log_info "Retention policy: $retention_days days for $BACKUP_TYPE backups"

  # Find and delete local backups older than retention period
  local deleted_count=0
  while IFS= read -r old_backup; do
    log_info "Deleting old backup: $(basename "$old_backup")"
    rm -f "$old_backup" "${old_backup}.meta.json" "${old_backup}.sha256"
    ((deleted_count++))
  done < <(find "$BACKUP_LOCAL" -name "*.sql.gpg" -o -name "*.sql" -mtime "+${retention_days}")

  if [ "$deleted_count" -gt 0 ]; then
    log_success "Deleted $deleted_count old backup(s)"
  else
    log_info "No old backups to delete"
  fi

  # Cleanup cloud backups (if applicable)
  if [ "$UPLOAD" = "true" ]; then
    log_info "Cleaning up old cloud backups..."

    # Calculate cutoff date
    local cutoff_date=$(date -d "-${retention_days} days" +%Y-%m-%d 2>/dev/null || date -v-${retention_days}d +%Y-%m-%d)

    # List and delete old backups from S3
    aws s3 ls "s3://${S3_BUCKET}/${BACKUP_TYPE}/" --recursive | \
      awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
      while read -r old_key; do
        log_info "Deleting old cloud backup: $old_key"
        aws s3 rm "s3://${S3_BUCKET}/$old_key"
      done
  fi
}

# ============================================================================
# NOTIFICATION FUNCTIONS
# ============================================================================

send_notification() {
  local status="$1"
  local message="$2"

  # TODO: Implement notification service (email, Slack, PagerDuty)
  # For now, just log
  log_info "NOTIFICATION: [$status] $message"

  # Example: Send to Slack webhook
  # if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  #   curl -X POST -H 'Content-type: application/json' \
  #     --data "{\"text\":\"[$status] $message\"}" \
  #     "$SLACK_WEBHOOK_URL"
  # fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  log_info "========================================"
  log_info "WasteWise Database Backup Starting"
  log_info "========================================"
  log_info "Backup type: $BACKUP_TYPE"
  log_info "Encrypt: $ENCRYPT"
  log_info "Upload: $UPLOAD"
  log_info "Timestamp: $TIMESTAMP"

  local overall_start=$(date +%s)

  # Validation phase
  validate_dependencies
  validate_database_connection
  validate_disk_space

  # Backup phase
  if ! create_backup; then
    send_notification "FAILURE" "Database backup creation failed"
    exit 1
  fi

  # Encryption phase
  if ! encrypt_backup; then
    send_notification "FAILURE" "Database backup encryption failed"
    exit 1
  fi

  # Verification phase
  if ! verify_backup; then
    send_notification "FAILURE" "Database backup verification failed"
    exit 1
  fi

  # Upload phase
  if ! upload_to_cloud; then
    send_notification "WARNING" "Database backup upload failed (backup saved locally)"
    # Don't exit - local backup still valid
  fi

  # Cleanup phase
  cleanup_old_backups

  # Calculate total duration
  local overall_end=$(date +%s)
  local total_duration=$((overall_end - overall_start))

  log_info "========================================"
  log_success "Backup completed successfully"
  log_info "Total duration: ${total_duration}s"
  log_info "========================================"

  send_notification "SUCCESS" "Database backup completed in ${total_duration}s"
}

# Execute main function
main "$@"
