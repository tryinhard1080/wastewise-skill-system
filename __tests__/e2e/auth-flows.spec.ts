/**
 * E2E Test Suite: Authentication Flows
 *
 * Tests all authentication-related functionality including:
 * - User registration (signup)
 * - Login/logout flows
 * - Password validation
 * - Session management
 * - Protected route access
 */

import { test, expect, Page } from '@playwright/test'
import { createTestUser, deleteTestUser, loginUser, logoutUser } from './utils/test-helpers'

test.describe('Authentication Flows', () => {
  test.describe('User Registration (Signup)', () => {
    test('User can sign up with valid email and password', async ({ page }) => {
      const testEmail = `new-user-${Date.now()}@wastewise.test`
      const testPassword = 'ValidPassword123!'

      await page.goto('/signup')

      // Fill signup form
      await page.fill('[name="email"]', testEmail)
      await page.fill('[name="password"]', testPassword)
      await page.fill('[name="confirmPassword"]', testPassword)

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })

      // Verify user is logged in
      await expect(page.locator('h1')).toContainText(/dashboard/i)

      // Cleanup: Get user ID and delete
      const supabase = (await import('./utils/test-helpers')).default
      // Delete user via email lookup (implementation depends on your helpers)
    })

    test('User cannot sign up with invalid email format', async ({ page }) => {
      await page.goto('/signup')

      // Try invalid email formats
      const invalidEmails = [
        'notanemail',
        '@wastewise.test',
        'user@',
        'user @wastewise.test',
        'user@wastewise'
      ]

      for (const email of invalidEmails) {
        await page.fill('[name="email"]', email)
        await page.fill('[name="password"]', 'ValidPassword123!')
        await page.fill('[name="confirmPassword"]', 'ValidPassword123!')

        // Submit should be disabled or show validation error
        const submitButton = page.locator('button[type="submit"]')
        const isDisabled = await submitButton.isDisabled()

        if (!isDisabled) {
          await submitButton.click()
          // Should show validation error
          await expect(page.locator('text=/invalid.*email|email.*invalid/i')).toBeVisible({ timeout: 5000 })
        }

        // Clear for next iteration
        await page.fill('[name="email"]', '')
      }
    })

    test('User cannot sign up with weak password', async ({ page }) => {
      await page.goto('/signup')

      const testEmail = `test-${Date.now()}@wastewise.test`

      // Try weak passwords
      const weakPasswords = [
        'short',           // Too short
        'noupperlower',    // No uppercase
        'NOLOWERCASE',     // No lowercase
        'NoNumbers',       // No numbers
        '12345678',        // Only numbers
        'password'         // Common password
      ]

      for (const password of weakPasswords) {
        await page.fill('[name="email"]', testEmail)
        await page.fill('[name="password"]', password)
        await page.fill('[name="confirmPassword"]', password)

        const submitButton = page.locator('button[type="submit"]')
        const isDisabled = await submitButton.isDisabled()

        if (!isDisabled) {
          await submitButton.click()
          // Should show password strength error
          await expect(page.locator('text=/password.*weak|password.*strong|password.*requirements/i')).toBeVisible({ timeout: 5000 })
        }

        // Clear for next iteration
        await page.fill('[name="password"]', '')
        await page.fill('[name="confirmPassword"]', '')
      }
    })
  })

  test.describe('User Login', () => {
    let testEmail: string
    let testPassword: string
    let userId: string

    test.beforeEach(async () => {
      // Create test user before each login test
      testEmail = `test-${Date.now()}@wastewise.test`
      testPassword = 'TestPassword123!'
      userId = await createTestUser(testEmail, testPassword)
    })

    test.afterEach(async () => {
      // Cleanup test user
      if (userId) {
        await deleteTestUser(userId)
      }
    })

    test('User can log in with correct credentials', async ({ page }) => {
      await page.goto('/login')

      await page.fill('[name="email"]', testEmail)
      await page.fill('[name="password"]', testPassword)
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })
      await expect(page.locator('h1')).toContainText(/dashboard/i)
    })

    test('User cannot log in with incorrect password', async ({ page }) => {
      await page.goto('/login')

      await page.fill('[name="email"]', testEmail)
      await page.fill('[name="password"]', 'WrongPassword123!')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials|incorrect.*password|login.*failed/i')).toBeVisible({ timeout: 5000 })

      // Should NOT redirect to dashboard
      expect(page.url()).toContain('/login')
    })

    test('User can reset forgotten password', async ({ page }) => {
      await page.goto('/login')

      // Click forgot password link
      await page.click('text=/forgot.*password|reset.*password/i')

      // Should navigate to password reset page
      await expect(page.url()).toMatch(/forgot-password|reset-password/)

      // Enter email
      await page.fill('[name="email"]', testEmail)
      await page.click('button[type="submit"]')

      // Should show confirmation message
      await expect(page.locator('text=/check.*email|reset.*link.*sent|email.*sent/i')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Session Management', () => {
    test('User is redirected to login when accessing protected routes', async ({ page }) => {
      // Try to access protected routes without authentication
      const protectedRoutes = [
        '/dashboard',
        '/projects',
        '/projects/new',
        '/settings'
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)

        // Should redirect to login page
        await page.waitForURL(/login/, { timeout: 10000 })
        expect(page.url()).toContain('/login')
      }
    })

    test('User session persists across page reloads', async ({ page }) => {
      // Create and login test user
      const testEmail = `test-${Date.now()}@wastewise.test`
      const testPassword = 'TestPassword123!'
      const userId = await createTestUser(testEmail, testPassword)

      try {
        await loginUser(page, testEmail, testPassword)

        // Verify logged in
        await expect(page).toHaveURL('/dashboard')

        // Reload page
        await page.reload()

        // Should still be logged in
        await expect(page).toHaveURL('/dashboard')
        await expect(page.locator('h1')).toContainText(/dashboard/i)

        // Navigate to another page
        await page.goto('/projects')
        await expect(page).toHaveURL('/projects')

        // Reload again
        await page.reload()

        // Should still be logged in
        await expect(page).toHaveURL('/projects')
      } finally {
        await deleteTestUser(userId)
      }
    })

    test('User can log out successfully', async ({ page }) => {
      // Create and login test user
      const testEmail = `test-${Date.now()}@wastewise.test`
      const testPassword = 'TestPassword123!'
      const userId = await createTestUser(testEmail, testPassword)

      try {
        await loginUser(page, testEmail, testPassword)

        // Verify logged in
        await expect(page).toHaveURL('/dashboard')

        // Logout
        await logoutUser(page)

        // Should redirect to login
        await page.waitForURL(/login/, { timeout: 5000 })

        // Try to access protected route
        await page.goto('/dashboard')

        // Should redirect back to login
        await page.waitForURL(/login/, { timeout: 5000 })
      } finally {
        await deleteTestUser(userId)
      }
    })
  })
})
