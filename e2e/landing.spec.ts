import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/WasteWise/)
  })

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/')

    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible()

    // Check for login/signup buttons
    const loginButton = page.getByRole('link', { name: /login|sign in/i })
    const signupButton = page.getByRole('link', { name: /sign up|get started/i })

    await expect(loginButton.or(signupButton)).toBeVisible()
  })

  test('should have hero section', async ({ page }) => {
    await page.goto('/')

    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still load correctly
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Authentication Pages', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup')

    // Check for signup form elements
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible()
  })
})

test.describe('Dashboard (Protected Routes)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })
})
