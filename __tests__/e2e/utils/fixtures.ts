/**
 * Playwright Fixtures for WasteWise E2E Tests
 *
 * Fixtures provide reusable test contexts including:
 * - Authenticated pages (auto-login/logout)
 * - Test projects (auto-create/cleanup)
 * - Seeded data (invoices, haul logs)
 */

import { test as base, Page } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestProject,
  deleteTestProject,
  loginUser,
  seedInvoiceData,
  seedHaulLogData
} from './test-helpers'

type TestFixtures = {
  /**
   * Authenticated page with a logged-in test user
   * Automatically creates user, logs in, and cleans up after test
   */
  authenticatedPage: Page

  /**
   * Test project with authenticated page
   * Automatically creates project and cleans up after test
   */
  testProject: {
    page: Page
    projectId: string
    userId: string
  }

  /**
   * Test project with seeded invoice and haul log data
   * Ready for immediate analysis testing
   */
  seededProject: {
    page: Page
    projectId: string
    userId: string
  }
}

export const test = base.extend<TestFixtures>({
  /**
   * Fixture: authenticatedPage
   *
   * Creates a test user, logs in, and provides an authenticated page.
   * Automatically cleans up the user after the test.
   *
   * Usage:
   * ```typescript
   * test('my test', async ({ authenticatedPage }) => {
   *   await authenticatedPage.goto('/dashboard')
   *   // ... test code ...
   * })
   * ```
   */
  authenticatedPage: async ({ page }, use) => {
    // Setup: Create test user
    const testEmail = `test-${Date.now()}@wastewise.test`
    const testPassword = 'TestPassword123!'
    const userId = await createTestUser(testEmail, testPassword)

    try {
      // Login
      await loginUser(page, testEmail, testPassword)

      // Provide authenticated page to test
      await use(page)
    } finally {
      // Cleanup: Delete test user
      await deleteTestUser(userId)
    }
  },

  /**
   * Fixture: testProject
   *
   * Creates a test user, logs in, and creates a test project.
   * Provides both the authenticated page and project ID.
   * Automatically cleans up the project and user after the test.
   *
   * Usage:
   * ```typescript
   * test('my test', async ({ testProject }) => {
   *   const { page, projectId } = testProject
   *   await page.goto(`/projects/${projectId}`)
   *   // ... test code ...
   * })
   * ```
   */
  testProject: async ({ page }, use) => {
    // Setup: Create test user
    const testEmail = `test-${Date.now()}@wastewise.test`
    const testPassword = 'TestPassword123!'
    const userId = await createTestUser(testEmail, testPassword)

    try {
      // Login
      await loginUser(page, testEmail, testPassword)

      // Create test project
      const projectId = await createTestProject(userId, {
        property_name: `Test Property ${Date.now()}`,
        units: 250,
        property_type: 'Garden-Style',
        equipment_type: 'COMPACTOR',
        location: 'Austin, TX'
      })

      // Provide page and project info to test
      await use({ page, projectId, userId })
    } finally {
      // Cleanup: Delete project and user
      // Note: deleteTestUser will also clean up projects via RLS
      await deleteTestUser(userId)
    }
  },

  /**
   * Fixture: seededProject
   *
   * Creates a test project with sample invoice and haul log data.
   * Ready for immediate analysis testing without manual uploads.
   *
   * Data seeded:
   * - 6 months of invoice data (Jan-Jun 2025)
   * - 22 haul log entries (realistic compactor usage)
   *
   * Usage:
   * ```typescript
   * test('analyze seeded project', async ({ seededProject }) => {
   *   const { page, projectId } = seededProject
   *   await page.goto(`/projects/${projectId}/analyze`)
   *   // ... test code ...
   * })
   * ```
   */
  seededProject: async ({ page }, use) => {
    // Setup: Create test user
    const testEmail = `test-${Date.now()}@wastewise.test`
    const testPassword = 'TestPassword123!'
    const userId = await createTestUser(testEmail, testPassword)

    try {
      // Login
      await loginUser(page, testEmail, testPassword)

      // Create test project
      const projectId = await createTestProject(userId, {
        property_name: `Seeded Test Property ${Date.now()}`,
        units: 250,
        property_type: 'Garden-Style',
        equipment_type: 'COMPACTOR',
        location: 'Austin, TX'
      })

      // Seed invoice data (6 months)
      await seedInvoiceData(projectId, [
        {
          service_month: '2025-01',
          total_amount: 2850.00,
          line_items: [
            { description: 'Compactor Service', quantity: 8, rate: 285, amount: 2280 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 475, amount: 475 }
          ]
        },
        {
          service_month: '2025-02',
          total_amount: 2736.00,
          line_items: [
            { description: 'Compactor Service', quantity: 8, rate: 285, amount: 2280 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 361, amount: 361 }
          ]
        },
        {
          service_month: '2025-03',
          total_amount: 2945.00,
          line_items: [
            { description: 'Compactor Service', quantity: 9, rate: 285, amount: 2565 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 285, amount: 285 }
          ]
        },
        {
          service_month: '2025-04',
          total_amount: 2850.00,
          line_items: [
            { description: 'Compactor Service', quantity: 8, rate: 285, amount: 2280 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 475, amount: 475 }
          ]
        },
        {
          service_month: '2025-05',
          total_amount: 3040.00,
          line_items: [
            { description: 'Compactor Service', quantity: 9, rate: 285, amount: 2565 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 380, amount: 380 }
          ]
        },
        {
          service_month: '2025-06',
          total_amount: 2850.00,
          line_items: [
            { description: 'Compactor Service', quantity: 8, rate: 285, amount: 2280 },
            { description: 'Environmental Fee', quantity: 1, rate: 95, amount: 95 },
            { description: 'Fuel Surcharge', quantity: 1, rate: 475, amount: 475 }
          ]
        }
      ])

      // Seed haul log data (22 entries across 6 months)
      await seedHaulLogData(projectId, [
        { pickup_date: '2025-01-03', tons: 4.2 },
        { pickup_date: '2025-01-10', tons: 5.8 },
        { pickup_date: '2025-01-17', tons: 4.9 },
        { pickup_date: '2025-01-24', tons: 5.3 },
        { pickup_date: '2025-02-07', tons: 6.1 },
        { pickup_date: '2025-02-14', tons: 5.4 },
        { pickup_date: '2025-02-21', tons: 4.7 },
        { pickup_date: '2025-02-28', tons: 5.9 },
        { pickup_date: '2025-03-06', tons: 6.3 },
        { pickup_date: '2025-03-13', tons: 5.2 },
        { pickup_date: '2025-03-20', tons: 4.8 },
        { pickup_date: '2025-03-27', tons: 6.0 },
        { pickup_date: '2025-04-03', tons: 5.5 },
        { pickup_date: '2025-04-10', tons: 4.9 },
        { pickup_date: '2025-04-17', tons: 5.7 },
        { pickup_date: '2025-04-24', tons: 5.1 },
        { pickup_date: '2025-05-01', tons: 6.2 },
        { pickup_date: '2025-05-08', tons: 5.3 },
        { pickup_date: '2025-05-15', tons: 4.6 },
        { pickup_date: '2025-05-22', tons: 5.8 },
        { pickup_date: '2025-06-05', tons: 5.4 },
        { pickup_date: '2025-06-12', tons: 4.7 }
      ])

      // Provide page and project info to test
      await use({ page, projectId, userId })
    } finally {
      // Cleanup: Delete project and user
      await deleteTestUser(userId)
    }
  }
})

export { expect } from '@playwright/test'
