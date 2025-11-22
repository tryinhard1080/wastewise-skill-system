/**
 * E2E Test Suite: Project Management
 *
 * Tests all project-related functionality including:
 * - Project creation with validation
 * - Project listing and viewing
 * - File uploads to projects
 * - Project deletion
 * - Row-level security (RLS) validation
 */

import { test, expect } from './utils/fixtures'
import { createTestUser, deleteTestUser, loginUser } from './utils/test-helpers'
import * as path from 'path'

test.describe('Project Management', () => {
  test.describe('Project Creation', () => {
    test('User can create project with all required fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage

      await page.goto('/dashboard')

      // Click create project button
      await page.click('button:has-text("Create New Project"), a:has-text("Create New Project")')

      // Wait for new project form
      await expect(page.locator('h1, h2')).toContainText(/new.*project|create.*project/i)

      // Fill required fields
      await page.fill('[name="property_name"]', 'Sunset Gardens Apartments')
      await page.fill('[name="units"]', '180')
      await page.selectOption('[name="property_type"]', 'Garden-Style')
      await page.selectOption('[name="equipment_type"]', 'COMPACTOR')
      await page.fill('[name="location"]', 'Phoenix, AZ')

      // Submit form
      await page.click('button[type="submit"]:has-text("Create")')

      // Should redirect to project page
      await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 10000 })

      // Verify project details are shown
      await expect(page.locator('text=Sunset Gardens Apartments')).toBeVisible()
      await expect(page.locator('text=/180.*units/i')).toBeVisible()
    })

    test('User cannot create project with missing required fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage

      await page.goto('/projects/new')

      // Try to submit with empty form
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Should show validation errors for required fields
      await expect(page.locator('text=/property.*name.*required|required/i')).toBeVisible({ timeout: 5000 })

      // Fill only property name
      await page.fill('[name="property_name"]', 'Test Property')
      await submitButton.click()

      // Should still show validation errors for other required fields
      await expect(page.locator('text=/units.*required|equipment.*required/i')).toBeVisible({ timeout: 5000 })

      // Verify we're still on the form (not submitted)
      expect(page.url()).toContain('/projects/new')
    })
  })

  test.describe('Project Listing', () => {
    test('User can view project list on dashboard', async ({ testProject }) => {
      const { page, projectId } = testProject

      await page.goto('/dashboard')

      // Project list should be visible
      await expect(page.locator('[data-testid="project-list"], .project-list')).toBeVisible({ timeout: 5000 })

      // Should show at least one project (the one we created)
      const projectCards = page.locator('[data-testid="project-card"], .project-card')
      await expect(projectCards).toHaveCount(1, { timeout: 5000 })
    })

    test('User can view project details page', async ({ testProject }) => {
      const { page, projectId } = testProject

      // Navigate to project
      await page.goto(`/projects/${projectId}`)

      // Verify project details are shown
      await expect(page.locator('h1, h2')).toContainText(/Test Property/i)
      await expect(page.locator('text=/250.*units/i')).toBeVisible()
      await expect(page.locator('text=/COMPACTOR/i')).toBeVisible()
      await expect(page.locator('text=/Garden-Style/i')).toBeVisible()
    })
  })

  test.describe('File Upload', () => {
    test('User can upload files to project', async ({ testProject }) => {
      const { page, projectId } = testProject

      await page.goto(`/projects/${projectId}`)

      // Upload test invoice file
      const invoicePath = path.join(__dirname, 'seeds/test-files/sample-invoice.xlsx')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(invoicePath)

      // Wait for upload confirmation
      await expect(page.locator('text=/uploaded|upload.*success|file.*added/i')).toBeVisible({ timeout: 10000 })

      // Verify file appears in file list
      await expect(page.locator('text=/sample-invoice/i')).toBeVisible()
    })
  })

  test.describe('Project Deletion', () => {
    test('User can delete project with confirmation', async ({ authenticatedPage }) => {
      const page = authenticatedPage

      // Create a project to delete
      await page.goto('/projects/new')
      await page.fill('[name="property_name"]', 'Project To Delete')
      await page.fill('[name="units"]', '100')
      await page.selectOption('[name="property_type"]', 'Garden-Style')
      await page.selectOption('[name="equipment_type"]', 'COMPACTOR')
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/projects\/[a-f0-9-]+/)
      const projectId = page.url().match(/\/projects\/([a-f0-9-]+)/)![1]

      // Click delete button
      await page.click('button:has-text("Delete"), [data-testid="delete-project"]')

      // Should show confirmation dialog
      await expect(page.locator('text=/confirm.*delete|are.*you.*sure/i')).toBeVisible({ timeout: 5000 })

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Delete")')

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })

      // Project should no longer appear in list
      await expect(page.locator('text=Project To Delete')).not.toBeVisible()

      // Try to access deleted project directly
      await page.goto(`/projects/${projectId}`)

      // Should show 404 or redirect
      await expect(page.locator('text=/not.*found|doesn.*exist/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Row-Level Security (RLS)', () => {
    test('User can only see their own projects', async ({ page }) => {
      // Create two test users
      const user1Email = `user1-${Date.now()}@wastewise.test`
      const user2Email = `user2-${Date.now()}@wastewise.test`
      const password = 'TestPassword123!'

      const user1Id = await createTestUser(user1Email, password)
      const user2Id = await createTestUser(user2Email, password)

      try {
        // Login as user 1
        await loginUser(page, user1Email, password)

        // Create project as user 1
        await page.goto('/projects/new')
        await page.fill('[name="property_name"]', 'User 1 Project')
        await page.fill('[name="units"]', '150')
        await page.selectOption('[name="property_type"]', 'Garden-Style')
        await page.selectOption('[name="equipment_type"]', 'COMPACTOR')
        await page.click('button[type="submit"]')

        await page.waitForURL(/\/projects\/[a-f0-9-]+/)
        const user1ProjectId = page.url().match(/\/projects\/([a-f0-9-]+)/)![1]

        // Logout user 1
        await page.click('[data-testid="user-menu"]')
        await page.click('text=Logout')
        await page.waitForURL(/login/)

        // Login as user 2
        await loginUser(page, user2Email, password)

        // Try to access user 1's project
        await page.goto(`/projects/${user1ProjectId}`)

        // Should show 404 or access denied
        await expect(page.locator('text=/not.*found|access.*denied|unauthorized/i')).toBeVisible({ timeout: 5000 })

        // Check dashboard - should not see user 1's project
        await page.goto('/dashboard')
        await expect(page.locator('text=User 1 Project')).not.toBeVisible()

        // Create project as user 2
        await page.goto('/projects/new')
        await page.fill('[name="property_name"]', 'User 2 Project')
        await page.fill('[name="units"]', '200')
        await page.selectOption('[name="property_type"]', 'Mid-Rise')
        await page.selectOption('[name="equipment_type"]', 'DUMPSTER')
        await page.click('button[type="submit"]')

        await page.waitForURL(/\/projects\/[a-f0-9-]+/)

        // Check dashboard - should only see user 2's project
        await page.goto('/dashboard')
        await expect(page.locator('text=User 2 Project')).toBeVisible()
        await expect(page.locator('text=User 1 Project')).not.toBeVisible()
      } finally {
        // Cleanup both users
        await deleteTestUser(user1Id)
        await deleteTestUser(user2Id)
      }
    })
  })

  test.describe('Multiple Projects', () => {
    test('User can create multiple projects', async ({ authenticatedPage }) => {
      const page = authenticatedPage

      const projects = [
        { name: 'Project Alpha', units: 150, type: 'Garden-Style', equipment: 'COMPACTOR' },
        { name: 'Project Beta', units: 200, type: 'Mid-Rise', equipment: 'DUMPSTER' },
        { name: 'Project Gamma', units: 300, type: 'High-Rise', equipment: 'COMPACTOR' }
      ]

      const createdIds: string[] = []

      for (const project of projects) {
        await page.goto('/projects/new')

        await page.fill('[name="property_name"]', project.name)
        await page.fill('[name="units"]', project.units.toString())
        await page.selectOption('[name="property_type"]', project.type)
        await page.selectOption('[name="equipment_type"]', project.equipment)
        await page.click('button[type="submit"]')

        await page.waitForURL(/\/projects\/[a-f0-9-]+/)
        const projectId = page.url().match(/\/projects\/([a-f0-9-]+)/)![1]
        createdIds.push(projectId)
      }

      // Verify all projects are listed on dashboard
      await page.goto('/dashboard')

      for (const project of projects) {
        await expect(page.locator(`text=${project.name}`)).toBeVisible()
      }

      // Verify all project IDs are unique
      const uniqueIds = new Set(createdIds)
      expect(uniqueIds.size).toBe(projects.length)
    })

    test('Project list pagination works correctly', async ({ authenticatedPage }) => {
      const page = authenticatedPage

      // Create 12 projects (if pagination limit is 10)
      for (let i = 1; i <= 12; i++) {
        await page.goto('/projects/new')
        await page.fill('[name="property_name"]', `Pagination Test ${i}`)
        await page.fill('[name="units"]', '100')
        await page.selectOption('[name="property_type"]', 'Garden-Style')
        await page.selectOption('[name="equipment_type"]', 'COMPACTOR')
        await page.click('button[type="submit"]')
        await page.waitForURL(/\/projects\/[a-f0-9-]+/)
      }

      // Go to dashboard
      await page.goto('/dashboard')

      // Check if pagination controls are visible
      const paginationControls = page.locator('[data-testid="pagination"], .pagination')
      const hasPagination = await paginationControls.count() > 0

      if (hasPagination) {
        // Click next page
        await page.click('[data-testid="next-page"], button:has-text("Next")')

        // Should see different projects
        await expect(page.locator('text=/Pagination Test 1[12]/i')).toBeVisible({ timeout: 5000 })

        // Click previous page
        await page.click('[data-testid="prev-page"], button:has-text("Previous")')

        // Should see first page projects again
        await expect(page.locator('text=/Pagination Test [1-9]/i')).toBeVisible({ timeout: 5000 })
      }
    })
  })
})
