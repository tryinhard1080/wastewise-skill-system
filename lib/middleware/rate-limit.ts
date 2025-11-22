/**
 * Production-Grade Rate Limiting Middleware
 *
 * Uses Upstash Redis for distributed rate limiting across multiple instances.
 *
 * Features:
 * - Sliding window rate limiting
 * - Distributed across multiple server instances
 * - Graceful fallback if Redis unavailable
 * - Standard rate limit headers
 *
 * Usage:
 * ```typescript
 * import { rateLimit, rateLimitResponse } from '@/lib/middleware/rate-limit'
 *
 * export async function POST(req: NextRequest) {
 *   const result = await rateLimit(req, {
 *     maxRequests: 10,
 *     windowMs: 60 * 1000,
 *   })
 *
 *   if (result && !result.success) {
 *     return rateLimitResponse(result)
 *   }
 *
 *   // ... rest of handler
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * Rate limit configuration
 */
export type RateLimitConfig = {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Skip rate limiting for successful requests (default: false)
   */
  skipSuccessfulRequests?: boolean
}

/**
 * Rate limit result
 */
export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Initialize Upstash Redis client
 *
 * Falls back to null if environment variables not configured
 * (allows graceful degradation in development)
 */
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } else {
    console.warn(
      '⚠️ [RATE LIMIT] Upstash Redis not configured. Rate limiting disabled. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
    )
  }
} catch (error) {
  console.error('[RATE LIMIT] Failed to initialize Redis:', error)
  redis = null
}

/**
 * Cache for rate limiter instances to avoid recreating them
 */
const rateLimiterCache = new Map<string, Ratelimit>()

/**
 * Get or create a rate limiter instance for the given configuration
 */
function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) {
    return null
  }

  const cacheKey = `${config.maxRequests}:${config.windowMs}`

  if (rateLimiterCache.has(cacheKey)) {
    return rateLimiterCache.get(cacheKey)!
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.maxRequests,
      `${config.windowMs} ms`
    ),
    analytics: true,
    prefix: '@wastewise/ratelimit',
  })

  rateLimiterCache.set(cacheKey, limiter)
  return limiter
}

/**
 * Get identifier for rate limiting
 *
 * Priority:
 * 1. User ID (from auth)
 * 2. IP address (from headers)
 * 3. 'anonymous'
 */
function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'anonymous'

  return `ip:${ip}`
}

/**
 * Apply rate limiting to a request
 *
 * @param req - The Next.js request
 * @param config - Rate limit configuration
 * @param userId - Optional user ID for per-user rate limiting
 * @returns Rate limit result or null if rate limiting disabled/failed
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<RateLimitResult | null> {
  const limiter = getRateLimiter(config)

  if (!limiter) {
    // Rate limiting disabled or failed to initialize
    return null
  }

  const identifier = getIdentifier(req, userId)

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    return {
      success,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    // Fail open - allow request if rate limiting fails
    console.error('[RATE LIMIT] Error checking rate limit:', error)
    return null
  }
}

/**
 * Create a 429 Too Many Requests response
 *
 * Includes standard rate limit headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests
 * - X-RateLimit-Reset: When the limit resets (ISO timestamp)
 * - Retry-After: Seconds until reset
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': Math.max(1, retryAfterSeconds).toString(),
      },
    }
  )
}

/**
 * Pre-configured rate limiters for common use cases
 *
 * Usage:
 * ```typescript
 * import { RATE_LIMITS } from '@/lib/middleware/rate-limit'
 *
 * const result = await rateLimit(req, RATE_LIMITS.JOB_CREATION, userId)
 * ```
 */
export const RATE_LIMITS = {
  /**
   * Strict limit for creating analysis jobs
   * 5 requests per minute
   */
  JOB_CREATION: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },

  /**
   * Lenient limit for polling job status
   * 60 requests per minute
   */
  STATUS_POLLING: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },

  /**
   * Moderate limit for project operations
   * 20 requests per minute
   */
  PROJECT_OPERATIONS: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },

  /**
   * Strict limit for file uploads
   * 10 requests per minute
   */
  FILE_UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },

  /**
   * General API limit
   * 100 requests per minute
   */
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  /**
   * Strict limit for authentication endpoints
   * 5 requests per minute (prevent brute force)
   */
  AUTH: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
} as const
