/**
 * Navigation Constants
 *
 * Centralized navigation routes and menu structure.
 * Used by header, footer, sidebar, and mobile menus.
 */

// ============================================================================
// MAIN NAVIGATION (Header)
// ============================================================================

export const MAIN_NAV = [
  {
    label: 'Features',
    href: '/#features',
  },
  {
    label: 'Pricing',
    href: '/#pricing',
  },
  {
    label: 'How It Works',
    href: '/#how-it-works',
  },
  {
    label: 'FAQ',
    href: '/#faq',
  },
] as const

// ============================================================================
// AUTH ROUTES
// ============================================================================

export const AUTH_ROUTES = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
} as const

// ============================================================================
// APP ROUTES (Authenticated)
// ============================================================================

export const APP_ROUTES = {
  dashboard: '/dashboard',
  projects: '/projects',
  projectNew: '/projects/new',
  projectDetail: (id: string) => `/projects/${id}`,
  projectProcessing: (id: string) => `/projects/${id}/processing`,
  projectResults: (id: string) => `/projects/${id}/results`,
  reports: '/reports',
  analytics: '/analytics',
  settings: '/settings',
} as const

// ============================================================================
// DASHBOARD SIDEBAR NAVIGATION
// ============================================================================

export const DASHBOARD_NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: 'folder',
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: 'file-text',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: 'bar-chart',
  },
] as const

export const DASHBOARD_FOOTER_NAV = [
  {
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
  },
  {
    label: 'Sign Out',
    href: '/api/auth/signout',
    icon: 'log-out',
  },
] as const

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export const EXTERNAL_LINKS = {
  support: 'mailto:support@thetrash.hub',
  documentation: '/docs',
  privacyPolicy: '/privacy',
  termsOfService: '/terms',
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MainNavItem = typeof MAIN_NAV[number]
export type DashboardNavItem = typeof DASHBOARD_NAV[number]
