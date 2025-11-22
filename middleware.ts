/**
 * Next.js Middleware
 *
 * Handles:
 * 1. Authentication state refresh and route protection
 * 2. Security headers (CSP, HSTS, etc.)
 *
 * Runs on every request to protected routes
 */

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Generate a random nonce for CSP
 *
 * Used to allow specific inline scripts while blocking all others
 */
function generateNonce(): string {
  // Generate cryptographically secure random bytes
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)

  // Convert to base64
  return Buffer.from(randomBytes).toString('base64')
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  // Content Security Policy (CSP)
  // Prevents XSS attacks by controlling which resources can load
  const cspDirectives = [
    "default-src 'self'", // Only allow resources from same origin by default
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`, // Allow scripts with nonce or from CDN (Chart.js)
    `style-src 'self' 'nonce-${nonce}'`, // Allow styles with nonce
    "img-src 'self' blob: data: https:", // Allow images from same origin, data URIs, and HTTPS
    "font-src 'self' data:", // Allow fonts from same origin and data URIs
    "connect-src 'self' https://*.supabase.co", // Allow API calls to same origin and Supabase
    "frame-ancestors 'none'", // Prevent clickjacking (don't allow embedding in iframes)
    "base-uri 'self'", // Restrict <base> tag to same origin
    "form-action 'self'", // Only allow form submissions to same origin
    "object-src 'none'", // Block <object>, <embed>, <applet>
    "upgrade-insecure-requests", // Upgrade HTTP to HTTPS
  ]

  const csp = cspDirectives.join('; ')
  response.headers.set('Content-Security-Policy', csp)

  // X-Frame-Options: Prevent clickjacking
  // Redundant with CSP frame-ancestors, but good defense-in-depth
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: Prevent MIME sniffing
  // Forces browsers to respect declared Content-Type
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Control referrer information
  // Don't leak full URL to external sites
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Disable unnecessary browser features
  // Reduces attack surface
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict-Transport-Security (HSTS): Force HTTPS
  // Only set in production (dev uses HTTP)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-DNS-Prefetch-Control: Control DNS prefetching
  // Slight privacy improvement
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  return response
}

export async function middleware(request: NextRequest) {
  // Step 1: Handle authentication
  const response = await updateSession(request)

  // Step 2: Apply security headers
  const nonce = generateNonce()
  const secureResponse = applySecurityHeaders(response, nonce)

  // TODO: Store nonce in request context for use in pages
  // This would allow using the nonce in inline scripts
  // For now, we avoid inline scripts entirely

  return secureResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
