/**
 * Rate Limiting Utilities
 *
 * ⚠️ DEVELOPMENT ONLY - IN-MEMORY IMPLEMENTATION
 *
 * This is a simple in-memory rate limiter suitable for:
 * - Single-instance development environments
 * - Local testing
 * - Phase 1.5 development (current)
 *
 * ❌ NOT SUITABLE FOR PRODUCTION because:
 * - State is lost on server restart (rate limits reset)
 * - Doesn't work with multiple instances (each instance has separate limits)
 * - No distributed coordination (load balancer = 3x the rate limit on 3 instances)
 * - No DDoS protection across instances
 *
 * 🚀 PRODUCTION MIGRATION PATH:
 *
 * Before Phase 4 (Production Launch), migrate to distributed rate limiting:
 *
 * Option 1: Upstash Redis (Recommended - serverless, free tier available)
 * ```bash
 * npm install @upstash/ratelimit @upstash/redis
 * ```
 *
 * ```typescript
 * import { Ratelimit } from '@upstash/ratelimit'
 * import { Redis } from '@upstash/redis'
 *
 * const redis = Redis.fromEnv() // Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *
 * export const rateLimiters = {
 *   jobCreation: new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(10, '1 m'),
 *     analytics: true,
 *   }),
 *
 *   statusPolling: new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(60, '1 m'),
 *   }),
 * }
 *
 * // Usage in API route:
 * const { success, limit, remaining, reset } = await rateLimiters.jobCreation.limit(userId)
 * if (!success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded', retryAfter: reset },
 *     { status: 429, headers: { 'Retry-After': String(reset) } }
 *   )
 * }
 * ```
 *
 * Option 2: Vercel KV (if deploying to Vercel)
 * ```bash
 * npm install @vercel/kv
 * ```
 *
 * Option 3: Self-hosted Redis
 * ```bash
 * npm install ioredis
 * ```
 *
 * See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface RateLimitConfig {
  /**
   * Number of requests allowed within the window
   */
  limit: number;

  /**
   * Window duration in milliseconds
   */
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit records
 * Key: user ID or IP address
 * Value: request count and reset time
 *
 * ⚠️ WARNING: This Map is in-memory only and will be lost on:
 * - Server restart
 * - Deployment
 * - Process crash
 *
 * For production, migrate to distributed storage (Redis/Upstash) before Phase 4.
 */
const store = new Map<string, RequestRecord>();

// Log warning on first import (development only)
if (process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️ [RATE LIMIT] Using in-memory rate limiter in production! " +
      "This is not suitable for multi-instance deployments. " +
      "Migrate to Upstash/Redis before scaling. " +
      "See lib/api/rate-limit.ts for migration guide.",
  );
}

/**
 * Clean up expired entries every 10 minutes
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);

/**
 * Check if request is rate limited
 *
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and retry info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  let record = store.get(identifier);

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store.set(identifier, record);
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  const isLimited = record.count > config.limit;
  const remaining = Math.max(0, config.limit - record.count);
  const retryAfter = isLimited
    ? Math.ceil((record.resetTime - now) / 1000)
    : undefined;

  return {
    isLimited,
    remaining,
    resetTime: record.resetTime,
    retryAfter,
  };
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
  return (identifier: string) => checkRateLimit(identifier, config);
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
};

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual intervention
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
): {
  count: number;
  remaining: number;
  resetTime: number;
} {
  const record = store.get(identifier);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      count: 0,
      remaining: config.limit,
      resetTime: now + config.windowMs,
    };
  }

  return {
    count: record.count,
    remaining: Math.max(0, config.limit - record.count),
    resetTime: record.resetTime,
  };
}
