/**
 * Notification Service
 *
 * Handles sending alerts via multiple channels:
 * - Email (via Resend)
 * - Slack (via webhooks)
 * - PagerDuty (optional)
 *
 * Provides reusable notification templates and formatting.
 *
 * Phase 7: Production readiness - notification infrastructure
 */

import { logger } from '@/lib/observability/logger'
import type { Tables } from '@/types/database.types'

type JobAlert = Tables<'job_alerts'>
type AnalysisJob = Tables<'analysis_jobs'>

/**
 * Email notification via Resend
 */
export async function sendEmailNotification(
  alert: JobAlert,
  job?: AnalysisJob
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Email notifications disabled - RESEND_API_KEY not configured')
    return false
  }

  if (!process.env.ADMIN_EMAIL) {
    logger.warn('Email notifications disabled - ADMIN_EMAIL not configured')
    return false
  }

  const emailLogger = logger.child({
    alertId: alert.id,
    alertType: alert.alert_type,
    to: process.env.ADMIN_EMAIL,
  })

  try {
    // Dynamic import to avoid bundling issues
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subject = getEmailSubject(alert)
    const html = getEmailHtml(alert, job)

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'alerts@wastewise.app',
      to: process.env.ADMIN_EMAIL,
      subject,
      html,
    })

    if (response.error) {
      throw new Error(`Resend error: ${response.error.message}`)
    }

    emailLogger.info('Email notification sent successfully', {
      emailId: response.data?.id,
    })

    return true
  } catch (error) {
    emailLogger.error('Failed to send email notification', error as Error)
    return false
  }
}

/**
 * Slack notification via webhook
 */
export async function sendSlackNotification(
  alert: JobAlert,
  job?: AnalysisJob
): Promise<boolean> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    logger.warn('Slack notifications disabled - SLACK_WEBHOOK_URL not configured')
    return false
  }

  const slackLogger = logger.child({
    alertId: alert.id,
    alertType: alert.alert_type,
  })

  try {
    const payload = getSlackPayload(alert, job)

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${await response.text()}`)
    }

    slackLogger.info('Slack notification sent successfully')

    return true
  } catch (error) {
    slackLogger.error('Failed to send Slack notification', error as Error)
    return false
  }
}

/**
 * PagerDuty notification (optional)
 */
export async function sendPagerDutyNotification(alert: JobAlert): Promise<boolean> {
  if (!process.env.PAGERDUTY_KEY) {
    logger.debug('PagerDuty notifications disabled - PAGERDUTY_KEY not configured')
    return false
  }

  const pagerDutyLogger = logger.child({
    alertId: alert.id,
    alertType: alert.alert_type,
  })

  try {
    // PagerDuty Events API v2
    const payload = {
      routing_key: process.env.PAGERDUTY_KEY,
      event_action: 'trigger',
      payload: {
        summary: alert.message,
        severity: mapSeverityToPagerDuty(alert.severity),
        source: 'WasteWise Job System',
        custom_details: alert.details,
      },
    }

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`PagerDuty API returned ${response.status}: ${await response.text()}`)
    }

    pagerDutyLogger.info('PagerDuty notification sent successfully')

    return true
  } catch (error) {
    pagerDutyLogger.error('Failed to send PagerDuty notification', error as Error)
    return false
  }
}

/**
 * Generate email subject line
 */
function getEmailSubject(alert: JobAlert): string {
  const severityEmoji = {
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  }

  const emoji = severityEmoji[alert.severity as keyof typeof severityEmoji] || '📢'

  return `${emoji} [WasteWise Alert] ${alert.alert_type.replace(/_/g, ' ').toUpperCase()}`
}

/**
 * Generate email HTML content
 */
function getEmailHtml(alert: JobAlert, job?: AnalysisJob): string {
  const details = alert.details as Record<string, any> || {}
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .detail { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${alert.alert_type.replace(/_/g, ' ').toUpperCase()}</h2>
          <p>Severity: ${alert.severity.toUpperCase()}</p>
        </div>
        <div class="content">
          <p><strong>${alert.message}</strong></p>
  `

  // Add job-specific details
  if (job) {
    html += `
      <div class="detail">
        <span class="label">Job ID:</span>
        <span class="value">${job.id}</span>
      </div>
      <div class="detail">
        <span class="label">Job Type:</span>
        <span class="value">${job.job_type}</span>
      </div>
      <div class="detail">
        <span class="label">Project ID:</span>
        <span class="value">${job.project_id}</span>
      </div>
    `

    if (job.error_message) {
      html += `
        <div class="detail">
          <span class="label">Error:</span>
          <span class="value">${job.error_message}</span>
        </div>
      `
    }

    if (details.totalAttempts) {
      html += `
        <div class="detail">
          <span class="label">Total Attempts:</span>
          <span class="value">${details.totalAttempts}</span>
        </div>
      `
    }

    html += `
      <a href="${appUrl}/dashboard" class="button">View Dashboard</a>
    `
  }

  // Add additional details
  if (Object.keys(details).length > 0) {
    html += `<h3>Additional Details:</h3>`
    for (const [key, value] of Object.entries(details)) {
      if (!['jobType', 'projectId', 'userId', 'errorMessage', 'totalAttempts'].includes(key)) {
        html += `
          <div class="detail">
            <span class="label">${key}:</span>
            <span class="value">${JSON.stringify(value)}</span>
          </div>
        `
      }
    }
  }

  html += `
          <div class="footer">
            <p>This is an automated alert from WasteWise job monitoring system.</p>
            <p>Alert ID: ${alert.id}</p>
            <p>Timestamp: ${new Date(alert.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Generate Slack payload
 */
function getSlackPayload(alert: JobAlert, job?: AnalysisJob): Record<string, any> {
  const details = alert.details as Record<string, any> || {}
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const severityEmoji = {
    warning: ':warning:',
    error: ':x:',
    critical: ':rotating_light:',
  }

  const emoji = severityEmoji[alert.severity as keyof typeof severityEmoji] || ':bell:'

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${alert.alert_type.replace(/_/g, ' ').toUpperCase()}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${alert.message}*`,
      },
    },
  ]

  // Add job details
  if (job) {
    const fields: any[] = [
      {
        type: 'mrkdwn',
        text: `*Job Type:*\n${job.job_type}`,
      },
      {
        type: 'mrkdwn',
        text: `*Severity:*\n${alert.severity.toUpperCase()}`,
      },
    ]

    if (job.error_message) {
      fields.push({
        type: 'mrkdwn',
        text: `*Error:*\n${job.error_message.substring(0, 100)}${job.error_message.length > 100 ? '...' : ''}`,
      })
    }

    if (details.totalAttempts) {
      fields.push({
        type: 'mrkdwn',
        text: `*Total Attempts:*\n${details.totalAttempts}`,
      })
    }

    blocks.push({
      type: 'section',
      fields,
    })

    // Add action button
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Dashboard',
          },
          url: `${appUrl}/dashboard`,
          style: 'primary',
        },
      ],
    })
  }

  // Add context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Alert ID: ${alert.id} | ${new Date(alert.created_at).toLocaleString()}`,
      },
    ],
  })

  return {
    text: alert.message,
    blocks,
  }
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'warning':
      return '#FFA500' // Orange
    case 'error':
      return '#DC3545' // Red
    case 'critical':
      return '#8B0000' // Dark Red
    default:
      return '#6C757D' // Gray
  }
}

/**
 * Map severity to PagerDuty severity levels
 */
function mapSeverityToPagerDuty(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}
