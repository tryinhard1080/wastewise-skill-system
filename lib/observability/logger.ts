/**
 * Structured Logger
 *
 * Provides consistent, structured logging across the application.
 * Supports different log levels, contexts, and structured data.
 *
 * Phase 1.5: Basic console logging (development)
 * Future: Production logging service integration (e.g., Sentry, LogRocket)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  /** User ID if available */
  userId?: string

  /** Project ID if applicable */
  projectId?: string

  /** Job ID for async operations */
  jobId?: string

  /** Skill name */
  skillName?: string

  /** Request ID for tracing */
  requestId?: string

  /** Additional context fields */
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  data?: Record<string, unknown>
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    // Set minimum log level from environment
    const envLevel = process.env.LOG_LEVEL || 'info'
    this.minLevel = LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentIndex = levels.indexOf(level)
    const minIndex = levels.indexOf(this.minLevel)
    return currentIndex >= minIndex
  }

  /**
   * Create a structured log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    if (context) {
      entry.context = context
    }

    if (data) {
      entry.data = data
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
      }
    }

    return entry
  }

  /**
   * Output log entry
   *
   * Phase 1.5: Console output
   * Future: Send to logging service
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const { level, message, timestamp, context, data, error } = entry

    // Format for console output
    const contextStr = context ? ` [${JSON.stringify(context)}]` : ''
    const dataStr = data ? ` ${JSON.stringify(data)}` : ''
    const errorStr = error ? `\n  Error: ${error.message}\n  ${error.stack}` : ''

    const fullMessage = `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}${dataStr}${errorStr}`

    // Console output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage)
        break
      case LogLevel.INFO:
        console.log(fullMessage)
        break
      case LogLevel.WARN:
        console.warn(fullMessage)
        break
      case LogLevel.ERROR:
        console.error(fullMessage)
        break
    }
  }

  /**
   * Debug-level logging
   */
  debug(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context, data)
    this.output(entry)
  }

  /**
   * Info-level logging
   */
  info(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.INFO, message, context, data)
    this.output(entry)
  }

  /**
   * Warning-level logging
   */
  warn(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.WARN, message, context, data)
    this.output(entry)
  }

  /**
   * Error-level logging
   */
  error(message: string, error?: Error, context?: LogContext, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context, data, error)
    this.output(entry)
  }

  /**
   * Create a child logger with fixed context
   *
   * Useful for maintaining context across multiple log calls.
   *
   * @example
   * const jobLogger = logger.child({ jobId: 'abc-123', skillName: 'compactor-optimization' })
   * jobLogger.info('Starting analysis')
   * jobLogger.info('Analysis complete')
   */
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext)
  }
}

/**
 * Child logger with fixed context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context }
  }

  debug(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    this.parent.debug(message, this.mergeContext(context), data)
  }

  info(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    this.parent.info(message, this.mergeContext(context), data)
  }

  warn(message: string, context?: LogContext, data?: Record<string, unknown>): void {
    this.parent.warn(message, this.mergeContext(context), data)
  }

  error(message: string, error?: Error, context?: LogContext, data?: Record<string, unknown>): void {
    this.parent.error(message, error, this.mergeContext(context), data)
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Usage examples:
 *
 * // Basic logging
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Failed to fetch data', error, { projectId: 'abc' })
 *
 * // With structured data
 * logger.debug('API request', { userId: '123' }, { method: 'POST', path: '/api/analyze' })
 *
 * // Child logger for consistent context
 * const jobLogger = logger.child({ jobId: 'job-123', skillName: 'compactor-optimization' })
 * jobLogger.info('Job started')
 * jobLogger.info('Processing haul data', undefined, { haulCount: 25 })
 * jobLogger.info('Job completed')
 */
