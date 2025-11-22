/**
 * Job Alert System
 *
 * Manages alerting for job failures, stuck jobs, and system health issues.
 * Integrates with email (Resend) and Slack for notifications.
 *
 * Alert Types:
 * - job_failed: Job permanently failed after all retries
 * - job_stuck: Job processing longer than threshold
 * - high_error_rate: Error rate exceeds threshold
 * - worker_down: Worker health check failed
 *
 * Phase 7: Production readiness - enterprise alerting
 */

import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database.types'
import { logger } from '@/lib/observability/logger'
import {
  sendEmailNotification,
  sendSlackNotification,
  sendPagerDutyNotification,
} from './notification-service'

type AnalysisJob = Tables<'analysis_jobs'>
type JobAlert = Tables<'job_alerts'>

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  WARNING = 'warning', // Informational, no immediate action required
  ERROR = 'error', // Issue detected, should investigate
  CRITICAL = 'critical', // Urgent issue, immediate action required
}

/**
 * Alert types
 */
export enum AlertType {
  JOB_FAILED = 'job_failed',
  JOB_STUCK = 'job_stuck',
  HIGH_ERROR_RATE = 'high_error_rate',
  WORKER_DOWN = 'worker_down',
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  PAGERDUTY = 'pagerduty',
}

/**
 * Alert thresholds (configurable via environment)
 */
const ALERT_THRESHOLDS = {
  JOB_STUCK_MINUTES: parseInt(process.env.JOB_STUCK_THRESHOLD_MINUTES || '30'),
  ERROR_RATE_PERCENT: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.10') * 100, // Convert to percentage
  WORKER_HEARTBEAT_MINUTES: parseInt(process.env.WORKER_HEARTBEAT_THRESHOLD_MINUTES || '5'),
} as const

export class JobAlertManager {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Create alert record in database
   */
  private async createAlert(
    jobId: string | null,
    alertType: AlertType,
    severity: AlertSeverity,
    message: string,
    details?: Record<string, any>
  ): Promise<JobAlert> {
    const { data: alert, error } = await this.supabase
      .from('job_alerts')
      .insert({
        job_id: jobId,
        alert_type: alertType,
        severity,
        message,
        details: details || {},
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create alert', error as Error)
      throw new Error(`Failed to create alert: ${error.message}`)
    }

    return alert
  }

  /**
   * Mark alert as notified
   */
  private async markAlertNotified(
    alertId: string,
    channels: NotificationChannel[]
  ): Promise<void> {
    const { error } = await this.supabase
      .from('job_alerts')
      .update({
        notified_at: new Date().toISOString(),
        notification_channels: channels,
      })
      .eq('id', alertId)

    if (error) {
      logger.error('Failed to mark alert as notified', error as Error, { alertId })
    }
  }

  /**
   * Send job failed alert
   *
   * Triggered when job permanently fails after all retries.
   * Severity: ERROR
   * Channels: Email + Slack
   */
  async sendJobFailedAlert(job: AnalysisJob, error: Error | string): Promise<void> {
    const alertLogger = logger.child({ jobId: job.id, alertType: 'job_failed' })

    const errorMessage = typeof error === 'string' ? error : error.message
    const totalAttempts = job.retry_count + 1

    alertLogger.info('Sending job failed alert', {
      errorMessage,
      totalAttempts,
      jobType: job.job_type,
    })

    // Create alert record
    const alert = await this.createAlert(
      job.id,
      AlertType.JOB_FAILED,
      AlertSeverity.ERROR,
      `Job ${job.id} failed after ${totalAttempts} attempts`,
      {
        jobType: job.job_type,
        projectId: job.project_id,
        userId: job.user_id,
        errorMessage,
        totalAttempts,
        errorHistory: job.retry_error_log,
      }
    )

    // Send notifications
    const channels: NotificationChannel[] = []

    try {
      // Send email if configured
      if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        await this.sendEmailAlert(alert, job)
        channels.push(NotificationChannel.EMAIL)
      }

      // Send Slack if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alert, job)
        channels.push(NotificationChannel.SLACK)
      }

      // Mark alert as notified
      await this.markAlertNotified(alert.id, channels)

      alertLogger.info('Job failed alert sent successfully', {
        channels,
      })
    } catch (notifyError) {
      alertLogger.error('Failed to send job failed alert', notifyError as Error)
    }
  }

  /**
   * Send job stuck alert
   *
   * Triggered when job is processing longer than threshold.
   * Severity: WARNING
   * Channels: Email
   */
  async sendJobStuckAlert(job: AnalysisJob): Promise<void> {
    const alertLogger = logger.child({ jobId: job.id, alertType: 'job_stuck' })

    if (!job.started_at) {
      alertLogger.warn('Cannot send stuck alert - job has no start time')
      return
    }

    const startTime = new Date(job.started_at)
    const durationMinutes = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60)

    alertLogger.info('Sending job stuck alert', {
      durationMinutes,
      threshold: ALERT_THRESHOLDS.JOB_STUCK_MINUTES,
    })

    // Create alert record
    const alert = await this.createAlert(
      job.id,
      AlertType.JOB_STUCK,
      AlertSeverity.WARNING,
      `Job ${job.id} has been processing for ${durationMinutes} minutes`,
      {
        jobType: job.job_type,
        projectId: job.project_id,
        userId: job.user_id,
        durationMinutes,
        threshold: ALERT_THRESHOLDS.JOB_STUCK_MINUTES,
        currentStep: job.current_step,
        progressPercent: job.progress_percent,
      }
    )

    // Send email notification
    const channels: NotificationChannel[] = []

    try {
      if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        await this.sendEmailAlert(alert, job)
        channels.push(NotificationChannel.EMAIL)
      }

      await this.markAlertNotified(alert.id, channels)

      alertLogger.info('Job stuck alert sent successfully', {
        channels,
      })
    } catch (notifyError) {
      alertLogger.error('Failed to send job stuck alert', notifyError as Error)
    }
  }

  /**
   * Send high error rate alert
   *
   * Triggered when error rate exceeds threshold.
   * Severity: CRITICAL
   * Channels: Email + Slack + PagerDuty
   */
  async sendHighErrorRateAlert(errorRate: number, timeWindow: string): Promise<void> {
    const alertLogger = logger.child({ alertType: 'high_error_rate' })

    alertLogger.warn('Sending high error rate alert', {
      errorRate,
      threshold: ALERT_THRESHOLDS.ERROR_RATE_PERCENT,
      timeWindow,
    })

    // Create alert record (no specific job)
    const alert = await this.createAlert(
      null,
      AlertType.HIGH_ERROR_RATE,
      AlertSeverity.CRITICAL,
      `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (${ALERT_THRESHOLDS.ERROR_RATE_PERCENT}%) over ${timeWindow}`,
      {
        errorRate,
        threshold: ALERT_THRESHOLDS.ERROR_RATE_PERCENT,
        timeWindow,
      }
    )

    // Send notifications (all channels for critical alerts)
    const channels: NotificationChannel[] = []

    try {
      if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        await this.sendEmailAlert(alert)
        channels.push(NotificationChannel.EMAIL)
      }

      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alert)
        channels.push(NotificationChannel.SLACK)
      }

      if (process.env.PAGERDUTY_KEY) {
        await this.sendPagerDutyAlert(alert)
        channels.push(NotificationChannel.PAGERDUTY)
      }

      await this.markAlertNotified(alert.id, channels)

      alertLogger.warn('High error rate alert sent successfully', {
        channels,
      })
    } catch (notifyError) {
      alertLogger.error('Failed to send high error rate alert', notifyError as Error)
    }
  }

  /**
   * Send email alert via Resend
   */
  private async sendEmailAlert(alert: JobAlert, job?: AnalysisJob): Promise<void> {
    await sendEmailNotification(alert, job)
  }

  /**
   * Send Slack alert via webhook
   */
  private async sendSlackAlert(alert: JobAlert, job?: AnalysisJob): Promise<void> {
    await sendSlackNotification(alert, job)
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(alert: JobAlert): Promise<void> {
    await sendPagerDutyNotification(alert)
  }

  /**
   * Check for stuck jobs and send alerts
   */
  async checkStuckJobs(): Promise<void> {
    const { data: stuckJobs, error } = await this.supabase.rpc('detect_stuck_jobs')

    if (error) {
      logger.error('Failed to detect stuck jobs', error as Error)
      return
    }

    if (!stuckJobs || stuckJobs.length === 0) {
      logger.debug('No stuck jobs detected')
      return
    }

    logger.warn('Stuck jobs detected', { count: stuckJobs.length })

    // Send alert for each stuck job
    for (const stuckJob of stuckJobs) {
      // Fetch full job details
      const { data: job } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', stuckJob.job_id)
        .single()

      if (job) {
        await this.sendJobStuckAlert(job)
      }
    }
  }

  /**
   * Check error rate and send alert if threshold exceeded
   */
  async checkErrorRate(timeWindow: string = '1 hour'): Promise<void> {
    const { data: errorRate, error } = await this.supabase.rpc('calculate_error_rate', {
      time_window: timeWindow,
    })

    if (error) {
      logger.error('Failed to calculate error rate', error as Error)
      return
    }

    if (errorRate === null || errorRate === undefined) {
      logger.debug('No error rate data available')
      return
    }

    logger.debug('Error rate calculated', { errorRate, timeWindow })

    // Check if error rate exceeds threshold
    if (errorRate > ALERT_THRESHOLDS.ERROR_RATE_PERCENT) {
      await this.sendHighErrorRateAlert(errorRate, timeWindow)
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 50): Promise<JobAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from('job_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Failed to fetch recent alerts', error as Error)
      return []
    }

    return alerts || []
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<JobAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from('job_alerts')
      .select('*')
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch unacknowledged alerts', error as Error)
      return []
    }

    return alerts || []
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('job_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId)

    if (error) {
      logger.error('Failed to acknowledge alert', error as Error, { alertId })
      throw new Error(`Failed to acknowledge alert: ${error.message}`)
    }

    logger.info('Alert acknowledged', { alertId, userId })
  }
}
