/**
 * Sandbox Audit Logger
 *
 * Tracks Claude Code sandbox boundary violations and permission requests
 * for security monitoring and compliance validation.
 *
 * Integrates with existing WasteWise observability infrastructure.
 */

import { logger } from './logger'

/**
 * Types of sandbox boundary violations
 */
export type SandboxViolationType =
  | 'filesystem_read'      // Attempted read of denied file
  | 'filesystem_write'     // Attempted write outside allowed paths
  | 'filesystem_delete'    // Attempted deletion of protected file
  | 'network_request'      // Request to unapproved domain
  | 'command_execution'    // Execution of excluded command
  | 'permission_escalation' // Attempt to bypass sandbox

/**
 * Severity levels for sandbox violations
 */
export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Sandbox violation event data
 */
export interface SandboxViolationEvent {
  type: SandboxViolationType
  resource: string           // File path, domain, or command
  action: string             // Specific action attempted
  approved: boolean          // Whether user approved the violation
  severity: ViolationSeverity
  agent?: string             // Agent type if applicable
  context?: Record<string, unknown>
  timestamp: string
}

/**
 * Sandbox statistics for monitoring
 */
export interface SandboxStats {
  total_violations: number
  approved_violations: number
  denied_violations: number
  violations_by_type: Record<SandboxViolationType, number>
  violations_by_severity: Record<ViolationSeverity, number>
  most_common_resources: Array<{ resource: string; count: number }>
}

/**
 * In-memory violation tracking (for development)
 * TODO Phase 4: Replace with persistent storage (Sentry, database, log aggregation)
 */
class SandboxViolationTracker {
  private violations: SandboxViolationEvent[] = []
  private maxViolations = 1000 // Prevent memory overflow

  /**
   * Add a violation event to the tracker
   */
  add(event: SandboxViolationEvent): void {
    this.violations.push(event)

    // Trim old violations if limit exceeded
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations)
    }
  }

  /**
   * Get all violations
   */
  getAll(): SandboxViolationEvent[] {
    return [...this.violations]
  }

  /**
   * Get violations by type
   */
  getByType(type: SandboxViolationType): SandboxViolationEvent[] {
    return this.violations.filter(v => v.type === type)
  }

  /**
   * Get violations by severity
   */
  getBySeverity(severity: ViolationSeverity): SandboxViolationEvent[] {
    return this.violations.filter(v => v.severity === severity)
  }

  /**
   * Get recent violations
   */
  getRecent(count: number = 10): SandboxViolationEvent[] {
    return this.violations.slice(-count).reverse()
  }

  /**
   * Get violation statistics
   */
  getStats(): SandboxStats {
    const stats: SandboxStats = {
      total_violations: this.violations.length,
      approved_violations: this.violations.filter(v => v.approved).length,
      denied_violations: this.violations.filter(v => !v.approved).length,
      violations_by_type: {
        filesystem_read: 0,
        filesystem_write: 0,
        filesystem_delete: 0,
        network_request: 0,
        command_execution: 0,
        permission_escalation: 0,
      },
      violations_by_severity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      most_common_resources: [],
    }

    // Count violations by type and severity
    for (const violation of this.violations) {
      stats.violations_by_type[violation.type]++
      stats.violations_by_severity[violation.severity]++
    }

    // Find most common resources
    const resourceCounts = new Map<string, number>()
    for (const violation of this.violations) {
      resourceCounts.set(
        violation.resource,
        (resourceCounts.get(violation.resource) || 0) + 1
      )
    }

    stats.most_common_resources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Clear all violations (for testing)
   */
  clear(): void {
    this.violations = []
  }
}

// Singleton tracker instance
const tracker = new SandboxViolationTracker()

/**
 * Determine severity based on violation type and resource
 */
function determineSeverity(
  type: SandboxViolationType,
  resource: string
): ViolationSeverity {
  // Critical: Attempts to access credentials or secrets
  if (
    resource.includes('.env') ||
    resource.includes('credentials') ||
    resource.includes('secret') ||
    resource.includes('password') ||
    resource.includes('api_key') ||
    resource.includes('token')
  ) {
    return 'critical'
  }

  // High: Permission escalation or deletion attempts
  if (
    type === 'permission_escalation' ||
    type === 'filesystem_delete'
  ) {
    return 'high'
  }

  // Medium: Write attempts outside allowed paths
  if (type === 'filesystem_write') {
    return 'medium'
  }

  // Low: Read attempts or unapproved network requests
  return 'low'
}

/**
 * Log a sandbox boundary violation
 *
 * @param type - Type of violation
 * @param resource - File path, domain, or command that was accessed
 * @param action - Specific action that was attempted
 * @param approved - Whether the user approved the action
 * @param agent - Optional agent type (frontend-dev, backend-dev, etc.)
 * @param context - Optional additional context
 */
export function logSandboxViolation(
  type: SandboxViolationType,
  resource: string,
  action: string,
  approved: boolean,
  agent?: string,
  context?: Record<string, unknown>
): void {
  const severity = determineSeverity(type, resource)

  const event: SandboxViolationEvent = {
    type,
    resource,
    action,
    approved,
    severity,
    agent,
    context,
    timestamp: new Date().toISOString(),
  }

  // Add to tracker
  tracker.add(event)

  // Log to standard logger with appropriate level
  const logLevel = approved ? 'info' : severity === 'critical' ? 'error' : 'warn'
  const logMessage = `Sandbox ${approved ? 'permission granted' : 'violation'}: ${action}`

  logger[logLevel](logMessage, {
    sandboxViolation: {
      type,
      resource,
      approved,
      severity,
      agent,
      ...context,
    },
  })

  // TODO Phase 4: Send to external monitoring (Sentry, log aggregation service)
  // if (severity === 'critical' || severity === 'high') {
  //   sendToSentry(event)
  // }
}

/**
 * Log filesystem boundary violations
 */
export function logFilesystemViolation(
  operation: 'read' | 'write' | 'delete',
  filePath: string,
  approved: boolean,
  agent?: string
): void {
  const typeMap = {
    read: 'filesystem_read' as const,
    write: 'filesystem_write' as const,
    delete: 'filesystem_delete' as const,
  }

  logSandboxViolation(
    typeMap[operation],
    filePath,
    `Attempted ${operation} of ${filePath}`,
    approved,
    agent,
    { operation, filePath }
  )
}

/**
 * Log network boundary violations
 */
export function logNetworkViolation(
  domain: string,
  url: string,
  approved: boolean,
  agent?: string
): void {
  logSandboxViolation(
    'network_request',
    domain,
    `Attempted request to ${url}`,
    approved,
    agent,
    { domain, url }
  )
}

/**
 * Log command execution violations
 */
export function logCommandViolation(
  command: string,
  args: string[],
  approved: boolean,
  agent?: string
): void {
  const fullCommand = [command, ...args].join(' ')

  logSandboxViolation(
    'command_execution',
    command,
    `Attempted execution: ${fullCommand}`,
    approved,
    agent,
    { command, args, fullCommand }
  )
}

/**
 * Get sandbox violation statistics
 */
export function getSandboxStats(): SandboxStats {
  return tracker.getStats()
}

/**
 * Get recent sandbox violations
 */
export function getRecentViolations(count: number = 10): SandboxViolationEvent[] {
  return tracker.getRecent(count)
}

/**
 * Get all violations of a specific type
 */
export function getViolationsByType(type: SandboxViolationType): SandboxViolationEvent[] {
  return tracker.getByType(type)
}

/**
 * Get all violations of a specific severity
 */
export function getViolationsBySeverity(severity: ViolationSeverity): SandboxViolationEvent[] {
  return tracker.getBySeverity(severity)
}

/**
 * Clear violation history (for testing)
 */
export function clearViolationHistory(): void {
  tracker.clear()
}

/**
 * Export violation data for analysis (JSON format)
 */
export function exportViolations(): string {
  return JSON.stringify({
    stats: getSandboxStats(),
    violations: tracker.getAll(),
    exported_at: new Date().toISOString(),
  }, null, 2)
}

/**
 * Check for suspicious violation patterns
 * Returns true if patterns suggest a security concern
 */
export function detectSuspiciousPatterns(): {
  suspicious: boolean
  reasons: string[]
  recommendations: string[]
} {
  const stats = getSandboxStats()
  const reasons: string[] = []
  const recommendations: string[] = []

  // Multiple critical violations
  if (stats.violations_by_severity.critical > 3) {
    reasons.push(`${stats.violations_by_severity.critical} critical violations detected`)
    recommendations.push('Review access to sensitive files (.env, credentials)')
  }

  // High denial rate (>50%)
  if (stats.denied_violations > stats.approved_violations) {
    reasons.push('High denial rate suggests misconfigured sandbox boundaries')
    recommendations.push('Review sandbox.json configuration to align with actual needs')
  }

  // Repeated access to same denied resource
  for (const { resource, count } of stats.most_common_resources.slice(0, 3)) {
    if (count > 5) {
      reasons.push(`Repeated access attempts to ${resource} (${count} times)`)
      recommendations.push(`Consider adding ${resource} to allowed paths if legitimate`)
    }
  }

  // Permission escalation attempts
  if (stats.violations_by_type.permission_escalation > 0) {
    reasons.push('Permission escalation attempts detected')
    recommendations.push('Review agent behavior and update sandbox exclusions if needed')
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    recommendations,
  }
}
