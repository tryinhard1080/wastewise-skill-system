import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: 1.0,

  debug: false,

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out expected errors (like rate limiting)
    if (event.exception?.values?.[0]?.type === 'RateLimitError') {
      return null
    }

    return event
  },
})
