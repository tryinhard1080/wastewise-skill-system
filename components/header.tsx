'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MAIN_NAV, AUTH_ROUTES } from '@/lib/constants/navigation'
import { SITE_CONFIG } from '@/lib/constants/landing-content'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#37322f]/6 bg-[#f7f5f3]/95 backdrop-blur-sm">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="text-[#37322f] font-semibold text-lg hover:opacity-80 transition-opacity">
              {SITE_CONFIG.name}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href={AUTH_ROUTES.login}>
              <Button variant="ghost" className="text-[#37322f] hover:bg-[#37322f]/5">
                Log in
              </Button>
            </Link>
            <Link href={AUTH_ROUTES.signup}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2 text-[#37322f]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#37322f]/10">
            <div className="flex flex-col space-y-3">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-2 border-t border-[#37322f]/10">
                <Link href={AUTH_ROUTES.login} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-[#37322f]">
                    Log in
                  </Button>
                </Link>
                <Link href={AUTH_ROUTES.signup} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
