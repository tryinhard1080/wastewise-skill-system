'use client'

/**
 * Toast Provider Component
 *
 * Wraps the app with toast notifications using sonner
 */

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  )
}
