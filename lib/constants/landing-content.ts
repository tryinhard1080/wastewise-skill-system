/**
 * Landing Page Content Constants
 *
 * Centralized copy and content for the WasteWise landing page.
 * Edit this file to update marketing copy across the entire site.
 *
 * @see components/footer-section.tsx
 * @see components/pricing-section.tsx
 * @see components/faq-section.tsx
 * @see app/page.tsx
 */

// ============================================================================
// SITE CONFIG
// ============================================================================

export const SITE_CONFIG = {
  name: 'WasteWise',
  tagline: 'by THE Trash Hub',
  description: 'Waste management optimization made simple',
  url: 'https://wastewise.thetrash.hub',
} as const

// ============================================================================
// HERO SECTION
// ============================================================================

export const HERO_CONTENT = {
  title: {
    line1: 'Reduce Waste Costs',
    line2: 'by Up to 30%',
  },
  subtitle: 'Data-driven waste management analysis for multifamily properties.',
  subtitleLine2: 'Upload invoices, get insights in minutes.',
  cta: {
    primary: 'START FREE ANALYSIS',
    secondary: 'Watch 2-Min Demo',
  },
} as const

// ============================================================================
// SOCIAL PROOF / STATS
// ============================================================================

export const STATS = {
  saved: { value: '$2.4M+', label: 'Total Saved' },
  properties: { value: '850+', label: 'Properties Analyzed' },
  satisfaction: { value: '95%', label: 'Client Satisfaction' },
} as const

// ============================================================================
// FEATURE CARDS (Hero Section)
// ============================================================================

export const FEATURE_CARDS = [
  {
    title: 'Automated Invoice Processing',
    description: 'Upload PDFs, AI extracts service data, tonnage, and charges automatically.',
    icon: 'invoice',
  },
  {
    title: 'AI-Powered Optimization',
    description: 'Identify over-servicing, right-size contracts, and reduce contamination fees.',
    icon: 'ai',
  },
  {
    title: 'Professional Reports',
    description: 'Download Excel workbooks and interactive HTML dashboards instantly.',
    icon: 'reports',
  },
] as const

// ============================================================================
// HOW IT WORKS (4-Step Process)
// ============================================================================

export const HOW_IT_WORKS = {
  badge: 'How It Works',
  title: 'From Invoice to Insights in 4 Steps',
  subtitle: 'Upload your waste data and get actionable recommendations in minutes, not weeks.',
  steps: [
    {
      number: 1,
      title: 'Upload Files',
      description: 'Drag and drop invoices, contracts, or haul logs. We support PDF, Excel, and CSV formats.',
    },
    {
      number: 2,
      title: 'Enter Property Info',
      description: 'Property name, units, location, and equipment type help us tailor the analysis.',
    },
    {
      number: 3,
      title: 'AI Analysis',
      description: 'Claude Vision extracts data, analyzes patterns, and calculates savings opportunities.',
    },
    {
      number: 4,
      title: 'Download Reports',
      description: 'Get Excel workbooks and interactive HTML dashboards with actionable recommendations.',
    },
  ],
} as const

// ============================================================================
// PRICING TIERS
// ============================================================================

export const PRICING = {
  badge: 'Plans & Pricing',
  title: 'Choose the perfect plan for your portfolio',
  subtitle: 'Scale your waste optimization with flexible pricing. Start free, upgrade when you\'re ready.',
  tiers: {
    starter: {
      name: 'Starter',
      description: 'Perfect for single properties getting started with waste optimization.',
      monthlyPrice: 0,
      annualPrice: 0,
      cta: 'Start for free',
      features: [
        'Up to 3 properties',
        'Basic invoice extraction',
        'Standard optimization report',
        'Email support',
        'PDF & Excel exports',
      ],
    },
    professional: {
      name: 'Professional',
      description: 'Advanced features for property management companies.',
      monthlyPrice: 49,
      annualPrice: 39,
      cta: 'Get started',
      featured: true,
      features: [
        'Unlimited properties',
        'AI-powered invoice extraction',
        'Compactor monitoring recommendations',
        'Regulatory compliance research',
        'Interactive HTML dashboards',
        'Priority support',
        'Batch processing',
        'API access',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      description: 'Complete solution for large portfolios and REITs.',
      monthlyPrice: 199,
      annualPrice: 159,
      cta: 'Contact sales',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'White-label reports',
        'Portfolio-wide analytics',
        'SLA guarantees',
        'On-site training',
        'Custom contract terms',
      ],
    },
  },
} as const

// ============================================================================
// FAQ ITEMS
// ============================================================================

export const FAQ_ITEMS = [
  {
    question: 'What is WasteWise and who is it for?',
    answer:
      'WasteWise is a data-driven waste management optimization platform designed for multifamily property managers. It\'s perfect for apartment communities, property management companies, and real estate portfolios looking to reduce waste costs and improve service efficiency.',
  },
  {
    question: 'How does the waste analysis work?',
    answer:
      'Our platform uses AI to extract data from your waste invoices, haul logs, and contracts. We analyze service patterns, identify over-servicing, calculate yards per door metrics, and provide actionable recommendations to optimize your waste management costs.',
  },
  {
    question: 'What file formats do you support?',
    answer:
      'We support PDF invoices (scanned or digital), Excel spreadsheets (.xlsx, .xls), and CSV files. Our AI can extract data from most standard waste hauler invoice formats automatically.',
  },
  {
    question: 'How quickly can I get results?',
    answer:
      'Most analyses complete in under 5 minutes. Upload your invoices, enter your property details, and our AI will generate comprehensive reports with cost-saving recommendations almost instantly.',
  },
  {
    question: 'Is my data secure with WasteWise?',
    answer:
      'Absolutely. We use enterprise-grade security measures including end-to-end encryption, SOC 2 compliance, and regular security audits. Your property and vendor data is stored in secure, redundant data centers.',
  },
  {
    question: 'What kind of savings can I expect?',
    answer:
      'Properties typically see 15-30% reduction in waste costs through optimization recommendations. Savings come from right-sizing service frequency, identifying over-servicing, reducing contamination fees, and optimizing compactor utilization.',
  },
] as const

// ============================================================================
// CTA SECTION
// ============================================================================

export const CTA_SECTION = {
  title: 'Ready to optimize your waste costs?',
  subtitle: 'Join hundreds of properties saving thousands on waste management with data-driven insights.',
  cta: 'Start for free',
} as const

// ============================================================================
// FOOTER
// ============================================================================

export const FOOTER = {
  brand: {
    name: 'WasteWise',
    tagline: 'Waste management optimization made simple',
  },
  socialLinks: {
    twitter: 'https://twitter.com/thetrash_hub',
    linkedin: 'https://linkedin.com/company/the-trash-hub',
    // No GitHub for a SaaS product
  },
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Support', href: '/support' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} THE Trash Hub. All rights reserved.`,
} as const

// ============================================================================
// LOGIN / AUTH PAGES
// ============================================================================

export const AUTH_CONTENT = {
  login: {
    title: 'Sign in',
    subtitle: 'Enter your email and password to access your account',
    cta: 'Sign in',
    altText: 'Don\'t have an account?',
    altLink: 'Sign up',
  },
  signup: {
    title: 'Create account',
    subtitle: 'Start optimizing your waste management today',
    cta: 'Create account',
    altText: 'Already have an account?',
    altLink: 'Sign in',
  },
  sidebar: {
    title: 'Optimize Waste Management',
    subtitle: 'Save thousands with AI-powered waste analysis and optimization recommendations.',
    stats: [
      { value: '$50K+', label: 'Average Annual Savings' },
      { value: '95%', label: 'Invoice Accuracy' },
      { value: '5 Min', label: 'Analysis Time' },
      { value: '500+', label: 'Properties Optimized' },
    ],
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FeatureCard = typeof FEATURE_CARDS[number]
export type HowItWorksStep = typeof HOW_IT_WORKS.steps[number]
export type PricingTier = typeof PRICING.tiers.starter | typeof PRICING.tiers.professional | typeof PRICING.tiers.enterprise
export type FAQItem = typeof FAQ_ITEMS[number]
export type FooterColumn = typeof FOOTER.columns[number]
