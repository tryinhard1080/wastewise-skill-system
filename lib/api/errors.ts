/**
 * API Error Handling Utilities
 *
 * Standardized error responses and error classes for API endpoints
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Common API errors
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`
    super(404, message, 'NOT_FOUND')
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(
      429,
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    )
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 *
 * @param error - Error to handle
 * @returns NextResponse with appropriate status and error message
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    )
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string }

    // Map common Supabase error codes
    switch (supabaseError.code) {
      case 'PGRST116': // Row not found
        return NextResponse.json(
          { error: 'Resource not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      case '23505': // Unique violation
        return NextResponse.json(
          { error: 'Resource already exists', code: 'CONFLICT' },
          { status: 409 }
        )
      case '23503': // Foreign key violation
        return NextResponse.json(
          { error: 'Referenced resource not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      case 'PGRST301': // JWT expired
        return NextResponse.json(
          { error: 'Session expired', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
    }
  }

  // Generic internal server error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper for API route handlers
 *
 * Usage:
 * ```typescript
 * export const GET = withErrorHandler(async (request) => {
 *   // Your handler code
 *   throw new NotFoundError('Job', 'abc-123')
 * })
 * ```
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}
