/**
 * Rate Limiting Utilities
 *
 * Simple in-memory rate limiter using sliding window algorithm.
 * For production with multiple instances, consider using Redis/Upstash.
 */

interface RateLimitConfig {
  /**
   * Number of requests allowed within the window
   */
  limit: number

  /**
   * Window duration in milliseconds
   */
  windowMs: number
}

interface RequestRecord {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limit records
 * Key: user ID or IP address
 * Value: request count and reset time
 */
const store = new Map<string, RequestRecord>()

/**
 * Clean up expired entries every 10 minutes
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Check if request is rate limited
 *
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and retry info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  isLimited: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const now = Date.now()
  let record = store.get(identifier)

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    store.set(identifier, record)
  }

  // Increment count
  record.count++

  // Check if limit exceeded
  const isLimited = record.count > config.limit
  const remaining = Math.max(0, config.limit - record.count)
  const retryAfter = isLimited ? Math.ceil((record.resetTime - now) / 1000) : undefined

  return {
    isLimited,
    remaining,
    resetTime: record.resetTime,
    retryAfter,
  }
}

/**
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```typescript
 * const limit = rateLimitMiddleware({ limit: 10, windowMs: 60000 })
 * const result = await limit(userId)
 * if (result.isLimited) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * }
 * ```
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimit(identifier, config)
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  /**
   * Strict limit for job creation
   * 10 requests per minute
   */
  jobCreation: rateLimitMiddleware({
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  }),

  /**
   * Lenient limit for status polling
   * 60 requests per minute
   */
  statusPolling: rateLimitMiddleware({
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
  }),

  /**
   * General API limit
   * 100 requests per minute
   */
  general: rateLimitMiddleware({
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  }),
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual intervention
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier)
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): {
  count: number
  remaining: number
  resetTime: number
} {
  const record = store.get(identifier)
  const now = Date.now()

  if (!record || now > record.resetTime) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: now + config.windowMs,
    }
  }

  return {
    count: record.count,
    remaining: Math.max(0, config.limit - record.count),
    resetTime: record.resetTime,
  }
}
