/**
 * Structured Logger
 *
 * Provides consistent, structured logging across the application.
 * Supports different log levels, contexts, and structured data.
 *
 * Integrated with Sentry for error tracking in production.
 */

import SentryShim from "./sentry-shim";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  /** User ID if available */
  userId?: string;

  /** Project ID if applicable */
  projectId?: string;

  /** Job ID for async operations */
  jobId?: string;

  /** Skill name */
  skillName?: string;

  /** Request ID for tracing */
  requestId?: string;

  /** Additional context fields */
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level from environment
    const envLevel = process.env.LOG_LEVEL || "info";
    this.minLevel =
      LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel] ||
      LogLevel.INFO;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Create a structured log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: any,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    if (data) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  /**
   * Output log entry
   *
   * Sends to console and Sentry (for errors in production)
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const { level, message, timestamp, context, data, error } = entry;

    // Format for console output
    const contextStr = context ? ` [${JSON.stringify(context)}]` : "";
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    const errorStr = error
      ? `\n  Error: ${error.message}\n  ${error.stack}`
      : "";

    const fullMessage = `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}${dataStr}${errorStr}`;

    // Console output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage);
        break;
      case LogLevel.INFO:
        console.log(fullMessage);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage);
        break;
    }

    // Send errors to Sentry in production
    if (
      level === LogLevel.ERROR &&
      error &&
      process.env.NODE_ENV === "production"
    ) {
      // Reconstruct Error object from serialized error
      const errorObj = new Error(error.message);
      errorObj.name = error.message;
      errorObj.stack = error.stack;

      SentryShim.captureException(errorObj, {
        level: "error",
        contexts: {
          custom: context || {},
        },
        extra: data,
        tags: {
          ...(context?.userId && { userId: context.userId }),
          ...(context?.projectId && { projectId: context.projectId }),
          ...(context?.jobId && { jobId: context.jobId }),
          ...(context?.skillName && { skillName: context.skillName }),
        },
      });
    }

    // Send warnings to Sentry in production (as breadcrumbs)
    if (level === LogLevel.WARN && process.env.NODE_ENV === "production") {
      SentryShim.addBreadcrumb({
        category: "warning",
        message,
        level: "warning",
        data: { ...context, ...data },
      });
    }
  }

  /**
   * Debug-level logging
   */
  debug(message: string, context?: LogContext, data?: any): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context, data);
    this.output(entry);
  }

  /**
   * Info-level logging
   */
  info(message: string, context?: LogContext, data?: any): void {
    const entry = this.createEntry(LogLevel.INFO, message, context, data);
    this.output(entry);
  }

  /**
   * Warning-level logging
   */
  warn(message: string, context?: LogContext, data?: any): void {
    const entry = this.createEntry(LogLevel.WARN, message, context, data);
    this.output(entry);
  }

  /**
   * Error-level logging
   */
  error(
    message: string,
    error?: Error,
    context?: LogContext,
    data?: any,
  ): void {
    const entry = this.createEntry(
      LogLevel.ERROR,
      message,
      context,
      data,
      error,
    );
    this.output(entry);
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
    return new ChildLogger(this, baseContext);
  }

  /**
   * Start a performance timer
   *
   * Returns a function that when called, logs the duration.
   *
   * @example
   * const endTimer = logger.startTimer('API call')
   * // ... do work ...
   * endTimer() // Logs: "Timer: API call" with duration_ms
   */
  startTimer(label: string, context?: LogContext): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Timer: ${label}`, context, {
        duration_ms: duration.toFixed(2),
      });
    };
  }
}

/**
 * Child logger with fixed context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext,
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context };
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.parent.debug(message, this.mergeContext(context), data);
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.parent.info(message, this.mergeContext(context), data);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.parent.warn(message, this.mergeContext(context), data);
  }

  error(
    message: string,
    error?: Error,
    context?: LogContext,
    data?: any,
  ): void {
    this.parent.error(message, error, this.mergeContext(context), data);
  }
}

// Export singleton instance
export const logger = new Logger();

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
