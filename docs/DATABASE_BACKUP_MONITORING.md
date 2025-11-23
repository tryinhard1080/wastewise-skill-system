# Database Backup Monitoring & Alerting

**Version**: 1.0.0
**Last Updated**: 2025-11-21

## Overview

Comprehensive monitoring and alerting configuration for WasteWise database backup systems.

## Monitoring Requirements

### Critical Metrics

| Metric                 | Target      | Alert Threshold | Action            |
| ---------------------- | ----------- | --------------- | ----------------- |
| Backup Success Rate    | 100%        | <100%           | Page on-call      |
| Backup Duration        | <15 min     | >30 min         | Investigate       |
| Backup File Size       | ±20% of avg | >±50%           | Alert DevOps      |
| Storage Capacity       | <80%        | >90%            | Increase capacity |
| Last Successful Backup | <24 hours   | >48 hours       | Critical alert    |
| Restore Test Pass Rate | 100%        | <100%           | Block deployments |

## Automated Monitoring

### 1. Backup Success/Failure Detection

**Method**: Parse cron job output

```bash
# /etc/cron.weekly/backup-monitor.sh
#!/bin/bash

BACKUP_LOG="/var/log/wastewise-backup.log"
LAST_24H=$(date -d '24 hours ago' +%s)

# Check for recent successful backup
LAST_SUCCESS=$(grep "Backup complete" $BACKUP_LOG | tail -1 | \
  awk '{print $1" "$2}' | xargs -I {} date -d {} +%s)

if [ $LAST_SUCCESS -lt $LAST_24H ]; then
  # Alert: No successful backup in 24 hours
  curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
    -d '{"text":"🚨 No successful database backup in 24 hours!","channel":"#alerts"}'

  # Page on-call
  curl -X POST https://events.pagerduty.com/v2/enqueue \
    -d '{"routing_key":"KEY","event_action":"trigger","payload":{"summary":"Backup failure","severity":"critical"}}'
fi
```

### 2. Storage Capacity Monitoring

**Method**: AWS CloudWatch + SNS

```bash
# Monitor S3 bucket size
aws cloudwatch put-metric-alarm \
  --alarm-name wastewise-backup-storage-warning \
  --alarm-description "Backup storage >90% of quota" \
  --metric-name BucketSizeBytes \
  --namespace AWS/S3 \
  --statistic Average \
  --period 86400 \
  --threshold 9000000000000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:backup-alerts
```

### 3. Backup File Size Anomaly Detection

```bash
#!/bin/bash
# Check backup size variance

LATEST_SIZE=$(aws s3 ls s3://wastewise-backups/ --recursive | tail -1 | awk '{print $3}')
AVG_SIZE=$(aws s3 ls s3://wastewise-backups/ --recursive | tail -5 | \
  awk '{sum+=$3; count++} END {print sum/count}')

VARIANCE=$(echo "scale=2; ($LATEST_SIZE / $AVG_SIZE - 1) * 100" | bc)

if (( $(echo "$VARIANCE > 50" | bc -l) )); then
  echo "⚠️ Backup size anomaly: +${VARIANCE}%"
  # Send alert
elif (( $(echo "$VARIANCE < -50" | bc -l) )); then
  echo "⚠️ Backup size anomaly: ${VARIANCE}%"
  # Send alert
fi
```

## Alert Configuration

### Slack Webhooks

**Setup**:

1. Create incoming webhook in Slack
2. Configure channels:
   - `#alerts` - P2/P3 notifications
   - `#incidents` - P0/P1 critical alerts

**Alert Template**:

```json
{
  "channel": "#alerts",
  "username": "Backup Monitor",
  "icon_emoji": ":floppy_disk:",
  "attachments": [
    {
      "color": "warning",
      "title": "Backup Alert",
      "fields": [
        { "title": "Event", "value": "Backup size anomaly", "short": true },
        { "title": "Severity", "value": "Medium", "short": true },
        {
          "title": "Details",
          "value": "Latest backup 60% larger than average",
          "short": false
        }
      ],
      "footer": "WasteWise Backup Monitor"
    }
  ]
}
```

### Email Notifications

**AWS SES Configuration**:

```bash
# Daily backup summary
aws ses send-email \
  --from "backups@wastewise.com" \
  --to "devops@wastewise.com" \
  --subject "Daily Backup Report - $(date +%Y-%m-%d)" \
  --text "
Backup Status: ✅ Success
File: wastewise_backup_$(date +%Y%m%d)_030000.dump
Size: 4.2 GB (compressed)
Duration: 12 minutes
Uploaded: s3://wastewise-backups/2025/01/
Next Backup: $(date -d 'next Sunday 3:00' +%Y-%m-%d\ %H:%M)
"
```

### PagerDuty Integration

**Critical Alerts Only** (P0/P1):

```bash
# Trigger incident
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Database backup failed - Manual intervention required",
      "severity": "critical",
      "source": "WasteWise Backup System",
      "custom_details": {
        "error": "pg_dump connection timeout",
        "backup_file": "wastewise_backup_20250121_030000.dump",
        "duration": "Timeout after 30 minutes"
      }
    }
  }'
```

## Monitoring Dashboard

### Supabase Dashboard Metrics

**Navigate to**: Project Settings → Database → Usage

**Key Metrics**:

- Database size trend
- Connection pool usage
- Query performance
- Backup schedule

### Custom CloudWatch Dashboard

**Metrics to display**:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["WasteWise/Backups", "BackupDuration", { "stat": "Average" }],
          [".", "BackupSize", { "stat": "Average" }],
          [".", "BackupSuccess", { "stat": "Sum" }]
        ],
        "period": 86400,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Backup Metrics (Daily)"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [["AWS/S3", "BucketSizeBytes", { "stat": "Average" }]],
        "period": 86400,
        "stat": "Average",
        "title": "S3 Storage Usage"
      }
    }
  ]
}
```

## Health Checks

### Automated Daily Health Check

```bash
#!/bin/bash
# /etc/cron.daily/backup-health-check.sh

echo "=== Backup Health Check - $(date) ==="

# 1. Check latest backup exists
LATEST=$(aws s3 ls s3://wastewise-backups/ --recursive | grep "\.dump$" | tail -1)
if [ -z "$LATEST" ]; then
  echo "❌ No backups found in S3"
  exit 1
fi

# 2. Check backup age (<24 hours)
BACKUP_DATE=$(echo $LATEST | awk '{print $1" "$2}')
BACKUP_EPOCH=$(date -d "$BACKUP_DATE" +%s)
NOW_EPOCH=$(date +%s)
AGE_HOURS=$(( ($NOW_EPOCH - $BACKUP_EPOCH) / 3600 ))

if [ $AGE_HOURS -gt 24 ]; then
  echo "❌ Latest backup is $AGE_HOURS hours old"
  exit 1
fi

# 3. Check backup size (should be >1 MB)
BACKUP_SIZE=$(echo $LATEST | awk '{print $3}')
if [ $BACKUP_SIZE -lt 1048576 ]; then
  echo "❌ Backup size too small: $BACKUP_SIZE bytes"
  exit 1
fi

# 4. Verify S3 storage capacity (<80%)
BUCKET_SIZE=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  awk '{sum+=$3} END {print sum}')
CAPACITY_LIMIT=10000000000000  # 10 TB
USAGE_PERCENT=$(echo "scale=2; ($BUCKET_SIZE / $CAPACITY_LIMIT) * 100" | bc)

if (( $(echo "$USAGE_PERCENT > 80" | bc -l) )); then
  echo "⚠️ Storage usage: ${USAGE_PERCENT}%"
fi

echo "✅ All health checks passed"
echo "Latest Backup: $LATEST"
echo "Age: $AGE_HOURS hours"
echo "Size: $(numfmt --to=iec $BACKUP_SIZE)"
echo "Storage Usage: ${USAGE_PERCENT}%"
```

## Logging

### Centralized Backup Logs

**Location**: `/var/log/wastewise-backup.log`

**Log Format**:

```
[2025-01-21 03:00:00] [INFO] Starting weekly backup
[2025-01-21 03:00:05] [INFO] Database connection successful
[2025-01-21 03:02:15] [INFO] pg_dump completed (2m 10s)
[2025-01-21 03:02:20] [INFO] Backup file size: 4.2 GB
[2025-01-21 03:02:25] [INFO] Checksum calculated: sha256:abc123...
[2025-01-21 03:04:50] [INFO] S3 upload completed (2m 25s)
[2025-01-21 03:04:55] [INFO] Backup complete: wastewise_backup_20250121_030000.dump
```

**Log Rotation**:

```bash
# /etc/logrotate.d/wastewise-backup
/var/log/wastewise-backup.log {
    daily
    rotate 90
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## Weekly Reports

### Automated Weekly Summary

```bash
#!/bin/bash
# Send weekly backup report every Monday 9 AM

WEEK_START=$(date -d 'last Monday' +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

# Count successful backups
SUCCESS_COUNT=$(grep "Backup complete" /var/log/wastewise-backup.log | \
  awk -v start="$WEEK_START" -v end="$WEEK_END" \
  '$1 >= start && $1 <= end' | wc -l)

# Average backup size
AVG_SIZE=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  tail -7 | awk '{sum+=$3; count++} END {print sum/count}')

# Storage usage
TOTAL_SIZE=$(aws s3 ls s3://wastewise-backups/ --recursive | \
  awk '{sum+=$3} END {print sum}')

# Send report
aws ses send-email \
  --from "backups@wastewise.com" \
  --to "devops@wastewise.com" \
  --subject "Weekly Backup Report - Week of $WEEK_START" \
  --text "
=== WasteWise Backup Weekly Report ===

Period: $WEEK_START to $WEEK_END

Successful Backups: $SUCCESS_COUNT / 7
Average Backup Size: $(numfmt --to=iec $AVG_SIZE)
Total Storage Used: $(numfmt --to=iec $TOTAL_SIZE)

Backup Schedule:
- Daily (Supabase): 2 AM UTC
- Weekly (Custom): Sunday 3 AM UTC

Next Actions:
- Quarterly restore test due: $(date -d '+30 days' +%Y-%m-%d)

Dashboard: https://console.aws.amazon.com/s3/buckets/wastewise-backups
"
```

## Incident Metrics

**Track and review monthly**:

| Metric                      | Target  | Current |
| --------------------------- | ------- | ------- |
| Mean Time to Detect (MTTD)  | <5 min  | -       |
| Mean Time to Respond (MTTR) | <15 min | -       |
| False Positive Rate         | <5%     | -       |
| Alert Fatigue Score         | Low     | -       |

## Alert Tuning

**Review quarterly**:

- Adjust thresholds based on observed patterns
- Reduce false positives
- Ensure critical alerts are not missed
- Update contact lists and escalation paths

---

**Next Review**: 2026-02-21
