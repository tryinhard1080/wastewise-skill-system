/**
 * OAuth Callback Handler
 *
 * Handles OAuth redirects and email confirmation links from Supabase Auth.
 * This route processes the auth code and establishes a session.
 *
 * Flow:
 * 1. User clicks OAuth provider (Google, GitHub) or email confirmation link
 * 2. Provider redirects back to this route with an auth code
 * 3. Exchange code for session
 * 4. Redirect to dashboard on success, login on failure
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle OAuth errors (e.g., user cancelled authorization)
  if (error) {
    console.error('OAuth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        errorDescription || 'Authentication failed. Please try again.'
      )}`
    )
  }

  // If no code is present, redirect to login with error
  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        'No authentication code received. Please try again.'
      )}`
    )
  }

  try {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(
          'Failed to establish session. Please try again.'
        )}`
      )
    }

    // Successfully authenticated - redirect to dashboard or specified next URL
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  } catch (err) {
    console.error('Unexpected error in auth callback:', err)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        'An unexpected error occurred. Please try again.'
      )}`
    )
  }
}
