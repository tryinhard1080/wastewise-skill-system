/**
 * Metrics Tracking
 *
 * Simple in-memory metrics tracking for application performance monitoring.
 *
 * Phase 1.5: Basic console reporting (development)
 * Future: Integration with monitoring service (e.g., Datadog, New Relic)
 */

import { logger } from './logger'

export interface Metric {
  name: string
  value: number
  unit: 'ms' | 'count' | 'bytes' | 'usd'
  timestamp: string
  tags?: Record<string, string>
}

export interface Timer {
  start: number
  name: string
  tags?: Record<string, string>
}

class Metrics {
  private metrics: Metric[] = []
  private timers: Map<string, Timer> = new Map()

  /**
   * Record a metric value
   */
  record(
    name: string,
    value: number,
    unit: 'ms' | 'count' | 'bytes' | 'usd' = 'count',
    tags?: Record<string, string>
  ): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    }

    this.metrics.push(metric)

    // Log high-value metrics
    if (name.includes('error') || name.includes('failed')) {
      logger.warn(`Metric: ${name} = ${value} ${unit}`, undefined, { tags })
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric: ${name} = ${value} ${unit}`, undefined, { tags })
    }
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, 'count', tags)
  }

  /**
   * Start a timer
   *
   * @returns Timer ID for stopping the timer
   */
  startTimer(name: string, tags?: Record<string, string>): string {
    const timerId = `${name}-${Date.now()}-${Math.random()}`
    const timer: Timer = {
      start: Date.now(),
      name,
      tags,
    }
    this.timers.set(timerId, timer)
    return timerId
  }

  /**
   * Stop a timer and record the duration
   */
  stopTimer(timerId: string): number {
    const timer = this.timers.get(timerId)
    if (!timer) {
      logger.warn(`Timer '${timerId}' not found`)
      return 0
    }

    const duration = Date.now() - timer.start
    this.record(timer.name, duration, 'ms', timer.tags)
    this.timers.delete(timerId)

    return duration
  }

  /**
   * Measure the duration of an async function
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const timerId = this.startTimer(name, tags)
    try {
      const result = await fn()
      this.stopTimer(timerId)
      return result
    } catch (error) {
      this.stopTimer(timerId)
      this.increment(`${name}.error`, 1, tags)
      throw error
    }
  }

  /**
   * Record AI usage metrics
   */
  recordAIUsage(
    provider: string,
    model: string,
    tokensInput: number,
    tokensOutput: number,
    costUsd: number
  ): void {
    const tags = { provider, model }

    this.record('ai.tokens.input', tokensInput, 'count', tags)
    this.record('ai.tokens.output', tokensOutput, 'count', tags)
    this.record('ai.tokens.total', tokensInput + tokensOutput, 'count', tags)
    this.record('ai.cost', costUsd, 'usd', tags)
  }

  /**
   * Record database query metrics
   */
  recordQuery(table: string, operation: string, durationMs: number): void {
    this.record('db.query.duration', durationMs, 'ms', { table, operation })
    this.increment('db.query.count', 1, { table, operation })
  }

  /**
   * Record API request metrics
   */
  recordAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ): void {
    const tags = { method, path, status: statusCode.toString() }

    this.record('api.request.duration', durationMs, 'ms', tags)
    this.increment('api.request.count', 1, tags)

    if (statusCode >= 400) {
      this.increment('api.request.error', 1, tags)
    }
  }

  /**
   * Record skill execution metrics
   */
  recordSkillExecution(
    skillName: string,
    success: boolean,
    durationMs: number,
    aiRequests?: number,
    aiCostUsd?: number
  ): void {
    const tags = { skill: skillName, success: success.toString() }

    this.record('skill.execution.duration', durationMs, 'ms', tags)
    this.increment('skill.execution.count', 1, tags)

    if (!success) {
      this.increment('skill.execution.failed', 1, tags)
    }

    if (aiRequests !== undefined) {
      this.record('skill.ai.requests', aiRequests, 'count', tags)
    }

    if (aiCostUsd !== undefined) {
      this.record('skill.ai.cost', aiCostUsd, 'usd', tags)
    }
  }

  /**
   * Get all metrics
   */
  getAll(): Metric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getByName(name: string): Metric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get aggregated statistics for a metric
   */
  getStats(name: string): {
    count: number
    total: number
    avg: number
    min: number
    max: number
  } | null {
    const metrics = this.getByName(name)
    if (metrics.length === 0) return null

    const values = metrics.map((m) => m.value)

    return {
      count: values.length,
      total: values.reduce((sum, v) => sum + v, 0),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = []
    this.timers.clear()
  }

  /**
   * Print metrics summary to console
   */
  printSummary(): void {
    const metricNames = [...new Set(this.metrics.map((m) => m.name))]

    console.log('\n=== Metrics Summary ===')
    for (const name of metricNames) {
      const stats = this.getStats(name)
      if (stats) {
        const unit = this.metrics.find((m) => m.name === name)?.unit || 'count'
        console.log(
          `${name}: count=${stats.count}, avg=${stats.avg.toFixed(2)}${unit}, min=${stats.min}${unit}, max=${stats.max}${unit}, total=${stats.total}${unit}`
        )
      }
    }
    console.log('======================\n')
  }
}

// Export singleton instance
export const metrics = new Metrics()

/**
 * Usage examples:
 *
 * // Counter metrics
 * metrics.increment('projects.created')
 * metrics.increment('invoices.processed', 5, { projectId: 'abc-123' })
 *
 * // Timer metrics
 * const timerId = metrics.startTimer('data.extraction')
 * // ... do work ...
 * metrics.stopTimer(timerId)
 *
 * // Or use async helper
 * const result = await metrics.time('skill.execute', async () => {
 *   return await executeSkill(context)
 * }, { skillName: 'compactor-optimization' })
 *
 * // AI usage
 * metrics.recordAIUsage('anthropic', 'claude-3-5-sonnet', 1500, 800, 0.015)
 *
 * // Database queries
 * const queryTimer = metrics.startTimer('db.query', { table: 'projects', operation: 'select' })
 * const projects = await supabase.from('projects').select('*')
 * metrics.stopTimer(queryTimer)
 *
 * // API requests (in middleware)
 * const reqTimer = metrics.startTimer('api.request')
 * const response = await handler(request)
 * const duration = metrics.stopTimer(reqTimer)
 * metrics.recordAPIRequest(request.method, request.url, response.status, duration)
 *
 * // Skill execution
 * metrics.recordSkillExecution('compactor-optimization', true, 1250, 2, 0.008)
 *
 * // Get stats
 * const stats = metrics.getStats('skill.execution.duration')
 * console.log(`Average execution time: ${stats.avg}ms`)
 *
 * // Print summary (useful at app shutdown or in development)
 * metrics.printSummary()
 */
