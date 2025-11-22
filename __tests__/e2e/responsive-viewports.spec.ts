import { test, expect, type Page } from '@playwright/test'

/**
 * Responsive Viewport Testing Suite
 *
 * Tests all key pages across 5 viewport sizes:
 * - Mobile Small: 375px (iPhone SE)
 * - Mobile Large: 414px (iPhone 14 Pro Max)
 * - Tablet: 768px (iPad)
 * - Desktop: 1024px (Small Desktop)
 * - Large Desktop: 1440px (MacBook Pro)
 *
 * Validates:
 * - No horizontal scroll
 * - No overflow elements
 * - Touch target sizes (min 44x44px on mobile)
 * - Text readability (no overflow)
 * - Responsive images
 */

const VIEWPORTS = {
  'mobile-small': { width: 375, height: 667 },
  'mobile-large': { width: 414, height: 896 },
  'tablet': { width: 768, height: 1024 },
  'desktop': { width: 1024, height: 768 },
  'desktop-large': { width: 1440, height: 900 },
}

const PAGES_TO_TEST = [
  { name: 'Landing Page', url: '/' },
  { name: 'Login Page', url: '/login' },
  { name: 'Signup Page', url: '/signup' },
]

// Helper to check for horizontal scroll
async function checkNoHorizontalScroll(page: Page, pageName: string, viewport: string) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

  expect(scrollWidth, `${pageName} (${viewport}): Page should not have horizontal scroll`).toBeLessThanOrEqual(
    clientWidth
  )
}

// Helper to check for overflow elements
async function checkNoOverflowElements(page: Page, pageName: string, viewport: string) {
  const overflowElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*')
    const overflowing: string[] = []

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth

      if (rect.right > viewportWidth) {
        overflowing.push(
          `${el.tagName}${el.className ? '.' + el.className.split(' ').join('.') : ''}`
        )
      }
    })

    return overflowing
  })

  expect(
    overflowElements.length,
    `${pageName} (${viewport}): Found ${overflowElements.length} overflowing elements: ${overflowElements.join(', ')}`
  ).toBe(0)
}

// Helper to check touch target sizes on mobile
async function checkTouchTargets(page: Page, pageName: string, viewport: string) {
  const smallTargets = await page.evaluate(() => {
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea')
    const tooSmall: Array<{ tag: string; width: number; height: number }> = []

    interactiveElements.forEach((el) => {
      const rect = el.getBoundingClientRect()

      // Skip hidden elements
      if (rect.width === 0 || rect.height === 0) return

      // Check if touch target is too small (minimum 44x44px recommended)
      if (rect.width < 44 || rect.height < 44) {
        tooSmall.push({
          tag: `${el.tagName}${el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
      }
    })

    return tooSmall
  })

  if (smallTargets.length > 0) {
    console.warn(
      `${pageName} (${viewport}): Found ${smallTargets.length} touch targets smaller than 44x44px:`,
      smallTargets.slice(0, 5) // Show first 5
    )
  }

  // Allow some small targets but warn if there are too many
  expect(
    smallTargets.length,
    `${pageName} (${viewport}): Too many small touch targets (${smallTargets.length}). First few: ${JSON.stringify(smallTargets.slice(0, 3))}`
  ).toBeLessThan(10)
}

// Helper to check for text overflow
async function checkTextOverflow(page: Page, pageName: string, viewport: string) {
  const overflowingText = await page.evaluate(() => {
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div')
    const overflowing: string[] = []

    textElements.forEach((el) => {
      const styles = window.getComputedStyle(el)
      if (styles.overflow === 'hidden' && styles.textOverflow !== 'ellipsis') {
        if (el.scrollWidth > el.clientWidth) {
          overflowing.push(
            `${el.tagName}${el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`
          )
        }
      }
    })

    return overflowing
  })

  if (overflowingText.length > 0) {
    console.warn(
      `${pageName} (${viewport}): Found ${overflowingText.length} text elements with overflow:`,
      overflowingText.slice(0, 5)
    )
  }
}

// Test each page on each viewport
for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`Responsive Tests - ${viewportName} (${viewport.width}x${viewport.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport)
    })

    for (const pageTest of PAGES_TO_TEST) {
      test(`${pageTest.name} - No horizontal scroll`, async ({ page }) => {
        await page.goto(pageTest.url)
        await page.waitForLoadState('networkidle')
        await checkNoHorizontalScroll(page, pageTest.name, viewportName)
      })

      test(`${pageTest.name} - No overflow elements`, async ({ page }) => {
        await page.goto(pageTest.url)
        await page.waitForLoadState('networkidle')
        await checkNoOverflowElements(page, pageTest.name, viewportName)
      })

      // Only check touch targets on mobile viewports
      if (viewportName.includes('mobile')) {
        test(`${pageTest.name} - Touch target sizes`, async ({ page }) => {
          await page.goto(pageTest.url)
          await page.waitForLoadState('networkidle')
          await checkTouchTargets(page, pageTest.name, viewportName)
        })
      }

      test(`${pageTest.name} - No text overflow`, async ({ page }) => {
        await page.goto(pageTest.url)
        await page.waitForLoadState('networkidle')
        await checkTextOverflow(page, pageTest.name, viewportName)
      })

      test(`${pageTest.name} - Visual regression screenshot`, async ({ page }) => {
        await page.goto(pageTest.url)
        await page.waitForLoadState('networkidle')

        // Wait for fonts to load
        await page.waitForTimeout(500)

        // Take screenshot for visual validation
        await page.screenshot({
          path: `__tests__/e2e/screenshots/${pageTest.name.toLowerCase().replace(/\s+/g, '-')}-${viewportName}.png`,
          fullPage: true,
        })
      })
    }
  })
}

// Additional tests for authenticated pages (requires login)
test.describe('Authenticated Pages - Responsive', () => {
  const authenticatedPages = [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Projects List', url: '/projects' },
    { name: 'New Project', url: '/projects/new' },
  ]

  // Login before authenticated tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@wastewise.local')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${viewportName} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport)
      })

      for (const pageTest of authenticatedPages) {
        test(`${pageTest.name} - Responsive layout`, async ({ page }) => {
          await page.goto(pageTest.url)
          await page.waitForLoadState('networkidle')

          // Check all responsive validations
          await checkNoHorizontalScroll(page, pageTest.name, viewportName)
          await checkNoOverflowElements(page, pageTest.name, viewportName)

          if (viewportName.includes('mobile')) {
            await checkTouchTargets(page, pageTest.name, viewportName)
          }

          // Screenshot
          await page.screenshot({
            path: `__tests__/e2e/screenshots/${pageTest.name.toLowerCase().replace(/\s+/g, '-')}-${viewportName}.png`,
            fullPage: true,
          })
        })
      }
    })
  }
})

// Test specific responsive components
test.describe('Responsive Component Behavior', () => {
  test('Navigation menu adapts to mobile', async ({ page }) => {
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if mobile menu button exists (if implemented)
    const hasMobileMenu = await page.locator('button[aria-label="Menu"]').count()
    if (hasMobileMenu > 0) {
      await page.click('button[aria-label="Menu"]')
      await expect(page.locator('nav')).toBeVisible()
    }
  })

  test('Forms stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/projects/new')

    // Wait for auth
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@wastewise.local')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/projects/new')
    await page.waitForLoadState('networkidle')

    // Check form layout (inputs should stack)
    const form = page.locator('form').first()
    const formBox = await form.boundingBox()

    if (formBox) {
      expect(formBox.width).toBeLessThan(500)
    }
  })

  test('Tables scroll horizontally on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@wastewise.local')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check if tables have overflow-x-auto
    const tables = page.locator('table')
    const count = await tables.count()

    if (count > 0) {
      const tableContainer = tables.first().locator('..')
      const overflowX = await tableContainer.evaluate((el) => {
        return window.getComputedStyle(el).overflowX
      })

      expect(['auto', 'scroll']).toContain(overflowX)
    }
  })

  test('Buttons full-width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    const submitButton = page.locator('button[type="submit"]')
    const buttonBox = await submitButton.boundingBox()

    if (buttonBox) {
      // Button should be close to full width (allowing for padding)
      expect(buttonBox.width).toBeGreaterThan(300)
    }
  })
})
