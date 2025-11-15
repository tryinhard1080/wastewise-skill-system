/**
 * Authentication Layout
 *
 * Shared layout for all authentication pages (login, signup, forgot-password)
 * Provides consistent branding and styling across auth flows
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WasteWise Authentication',
  description: 'Sign in to WasteWise by THE Trash Hub',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            WasteWise
          </h1>
          <p className="text-green-100 text-lg">
            by THE Trash Hub
          </p>
        </div>

        <div className="space-y-6 text-white">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Optimize Waste Management
            </h2>
            <p className="text-green-100">
              Save thousands with AI-powered waste analysis and optimization recommendations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold">$50K+</div>
              <div className="text-sm text-green-100">Average Annual Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-sm text-green-100">Invoice Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5 Min</div>
              <div className="text-sm text-green-100">Analysis Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-green-100">Properties Optimized</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-green-200">
          © 2025 THE Trash Hub. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
