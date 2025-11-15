/**
 * Standardized Error Types
 *
 * Defines consistent error shapes and codes across the application.
 * All API routes and skill executions should use these error types.
 */

/**
 * Base application error
 *
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        details: this.details,
      },
    }
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details)
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details)
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, details?: any) {
    const message = id ? `${resource} '${id}' not found` : `${resource} not found`
    super(message, 'NOT_FOUND', 404, { resource, id, ...details })
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public validationErrors: Array<{
      field: string
      message: string
      code?: string
    }>,
    details?: any
  ) {
    super(message, 'VALIDATION_ERROR', 400, {
      validationErrors,
      ...details,
    })
  }
}

/**
 * Business logic errors (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR', details?: any) {
    super(message, code, 422, details)
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      originalMessage: message,
      ...details,
    })
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, {
      retryAfter,
      ...details,
    })
  }
}

/**
 * Timeout errors (408)
 */
export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', 408, {
      operation,
      timeoutMs,
      ...details,
    })
  }
}

/**
 * Skill-specific errors
 */

export class SkillExecutionError extends AppError {
  constructor(skillName: string, message: string, code: string = 'SKILL_EXECUTION_ERROR', details?: any) {
    super(message, code, 500, { skillName, ...details })
  }
}

export class InsufficientDataError extends SkillExecutionError {
  constructor(skillName: string, requiredData: string[], details?: any) {
    super(
      skillName,
      `Insufficient data for ${skillName}`,
      'INSUFFICIENT_DATA',
      { requiredData, ...details }
    )
  }
}

export class FormulaValidationError extends SkillExecutionError {
  constructor(skillName: string, message: string, details?: any) {
    super(skillName, message, 'FORMULA_VALIDATION_ERROR', details)
  }
}

export class SkillCancelledError extends SkillExecutionError {
  constructor(skillName: string, details?: any) {
    super(skillName, `${skillName} execution was cancelled`, 'SKILL_CANCELLED', details)
  }
}

/**
 * AI service errors
 */

export class AIServiceError extends ExternalServiceError {
  constructor(provider: string, message: string, cost?: number, details?: any) {
    super(`AI-${provider}`, message, { cost, ...details })
  }
}

export class AIQuotaExceededError extends RateLimitError {
  constructor(provider: string, quotaType: string, details?: any) {
    super(`AI quota exceeded for ${provider}: ${quotaType}`, undefined, {
      provider,
      quotaType,
      ...details,
    })
  }
}

/**
 * Database errors
 */

export class DatabaseError extends AppError {
  constructor(operation: string, message: string, details?: any) {
    super(`Database error during ${operation}`, 'DATABASE_ERROR', 500, {
      operation,
      originalMessage: message,
      ...details,
    })
  }
}

/**
 * File processing errors
 */

export class FileProcessingError extends AppError {
  constructor(fileName: string, message: string, code: string = 'FILE_PROCESSING_ERROR', details?: any) {
    super(message, code, 422, { fileName, ...details })
  }
}

export class InvalidFileTypeError extends FileProcessingError {
  constructor(fileName: string, expectedTypes: string[], actualType?: string, details?: any) {
    super(
      fileName,
      `Invalid file type for ${fileName}. Expected: ${expectedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      { expectedTypes, actualType, ...details }
    )
  }
}

export class FileTooLargeError extends FileProcessingError {
  constructor(fileName: string, maxSizeBytes: number, actualSizeBytes: number, details?: any) {
    super(
      fileName,
      `File ${fileName} exceeds maximum size of ${maxSizeBytes} bytes`,
      'FILE_TOO_LARGE',
      { maxSizeBytes, actualSizeBytes, ...details }
    )
  }
}

/**
 * Error handler utility
 *
 * Converts unknown errors to standardized AppError instances
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500, {
      originalError: error.name,
      stack: error.stack,
    })
  }

  return new AppError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  )
}

/**
 * Error response helper for API routes
 *
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   return errorResponse(error)
 * }
 */
export function errorResponse(error: unknown): Response {
  const appError = normalizeError(error)

  return Response.json(appError.toJSON(), {
    status: appError.statusCode,
  })
}

/**
 * Error code constants for consistency
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Business Logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  FORMULA_VALIDATION_ERROR: 'FORMULA_VALIDATION_ERROR',

  // Skills
  SKILL_EXECUTION_ERROR: 'SKILL_EXECUTION_ERROR',
  SKILL_NOT_FOUND: 'SKILL_NOT_FOUND',
  SKILL_CANCELLED: 'SKILL_CANCELLED',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',

  // Files
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_DELETED: 'RESOURCE_DELETED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Timeouts
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodes
