/**
 * E2E Test Suite: Results & Reports
 *
 * Tests results page rendering and report downloads:
 * - Analysis summary display
 * - Optimization recommendations
 * - Expense breakdown visualization
 * - Excel report downloads
 * - HTML report downloads
 * - File format validation
 * - Empty state handling
 * - Missing data graceful degradation
 */

import { test, expect } from './utils/fixtures'
import { downloadFile } from './utils/test-helpers'
import * as path from 'path'
import * as fs from 'fs'

test.describe('Results & Reports', () => {
  test.setTimeout(10 * 60 * 1000) // 10 minutes for analysis + results

  test.describe('Results Page Display', () => {
    test('Results page displays analysis summary correctly', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Run analysis
      await page.goto(`/projects/${projectId}`)
      await page.click('button:has-text("Analyze")')
      await page.waitForURL(/\/processing/)

      // Wait for completion
      await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })

      // Verify summary section is visible
      await expect(page.locator('text=/executive.*summary|summary|overview/i')).toBeVisible()

      // Verify key metrics are displayed
      await expect(page.locator('text=/total.*cost|monthly.*cost/i')).toBeVisible()
      await expect(page.locator('text=/yards.*per.*door|ypd/i')).toBeVisible()
      await expect(page.locator('text=/cost.*per.*door/i')).toBeVisible()

      // Verify property details are shown
      await expect(page.locator('text=/250.*units/i')).toBeVisible()
      await expect(page.locator('text=/COMPACTOR/i')).toBeVisible()
    })

    test('Results page shows optimization recommendations', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results (assuming analysis already run)
      await page.goto(`/projects/${projectId}`)

      // Run analysis if needed
      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Verify recommendations section exists
      await expect(page.locator('text=/recommendations|optimizations|opportunities/i')).toBeVisible()

      // Verify recommendation details are shown
      const recommendationSection = page.locator('[data-testid="recommendations"], .recommendations-section')

      if (await recommendationSection.count() > 0) {
        // Should show at least one recommendation
        await expect(page.locator('text=/reduce.*frequency|monitor|schedule/i')).toBeVisible()
      }
    })

    test('Results page shows expense breakdown', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Verify expense breakdown section
      await expect(page.locator('text=/expense.*breakdown|expenses|costs/i')).toBeVisible()

      // Verify expense categories are shown
      await expect(page.locator('text=/service.*cost|environmental.*fee|fuel.*surcharge/i')).toBeVisible()

      // Verify charts or visualizations are present
      const chartElement = page.locator('[data-testid="expense-chart"], canvas, .chart-container')
      if (await chartElement.count() > 0) {
        await expect(chartElement.first()).toBeVisible()
      }
    })
  })

  test.describe('Report Downloads', () => {
    test('User can download Excel report', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Download Excel report
      const download = await downloadFile(page, 'button:has-text("Download Excel"), a:has-text("Download Excel")')

      // Verify filename
      expect(download.filename).toMatch(/\.xlsx$/i)

      console.log(`Excel report downloaded: ${download.filename}`)
    })

    test('User can download HTML report', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Download HTML report
      const download = await downloadFile(page, 'button:has-text("Download HTML"), button:has-text("Download Dashboard"), a:has-text("Download HTML")')

      // Verify filename
      expect(download.filename).toMatch(/\.html$/i)

      console.log(`HTML report downloaded: ${download.filename}`)
    })
  })

  test.describe('File Format Validation', () => {
    test('Downloaded Excel file is valid (.xlsx format)', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Download Excel
      const download = await downloadFile(page, 'button:has-text("Download Excel"), a:has-text("Download Excel")')

      // Verify file exists and has content
      expect(download.path).toBeTruthy()

      const fileStats = fs.statSync(download.path)
      expect(fileStats.size).toBeGreaterThan(0)

      // Verify it's a valid Excel file (ZIP format signature)
      const buffer = fs.readFileSync(download.path)
      const signature = buffer.toString('hex', 0, 4)

      // Excel files are ZIP archives (PK\x03\x04)
      expect(signature).toBe('504b0304')

      console.log(`Excel file validated: ${fileStats.size} bytes`)
    })

    test('Downloaded HTML file is valid (can be opened in browser)', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Download HTML
      const download = await downloadFile(page, 'button:has-text("Download HTML"), button:has-text("Download Dashboard"), a:has-text("Download HTML")')

      // Verify file exists and has content
      expect(download.path).toBeTruthy()

      const fileStats = fs.statSync(download.path)
      expect(fileStats.size).toBeGreaterThan(0)

      // Read HTML content
      const htmlContent = fs.readFileSync(download.path, 'utf-8')

      // Verify it's valid HTML
      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html')
      expect(htmlContent).toContain('</html>')

      // Verify it contains expected content
      expect(htmlContent).toMatch(/WasteWise|Analysis|Dashboard/i)

      // Try to open in browser
      const newPage = await page.context().newPage()
      await newPage.goto(`file:///${download.path}`)

      // Verify page loaded
      await expect(newPage.locator('h1, h2, title')).toContainText(/WasteWise|Analysis|Dashboard/i)

      await newPage.close()

      console.log(`HTML file validated: ${fileStats.size} bytes`)
    })
  })

  test.describe('Empty State Handling', () => {
    test('Results page shows "No data" message when analysis has no results', async ({ testProject }) => {
      const { page, projectId } = testProject

      // Try to navigate directly to results (no analysis run yet)
      await page.goto(`/projects/${projectId}/results`)

      // Should show empty state message
      await expect(page.locator('text=/no.*data|no.*results|analysis.*not.*run|run.*analysis/i')).toBeVisible({ timeout: 10000 })

      // Should show button to run analysis
      await expect(page.locator('button:has-text("Run Analysis"), a:has-text("Run Analysis")')).toBeVisible()
    })
  })

  test.describe('Graceful Error Handling', () => {
    test('Results page handles missing data gracefully', async ({ seededProject }) => {
      const { page, projectId } = seededProject

      // Navigate to results
      await page.goto(`/projects/${projectId}`)

      const resultsLink = page.locator('a:has-text("View Results")')
      if (await resultsLink.count() === 0) {
        await page.click('button:has-text("Analyze")')
        await page.waitForURL(/\/processing/)
        await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 })
      } else {
        await resultsLink.click()
      }

      // Page should not show error messages for missing optional data
      const errorMessages = page.locator('text=/error|failed|crash/i')
      const errorCount = await errorMessages.count()

      // If there are errors, they should be user-friendly
      if (errorCount > 0) {
        const errorText = await errorMessages.first().textContent()
        console.log(`Found error message: ${errorText}`)

        // Should not show technical errors
        expect(errorText?.toLowerCase()).not.toContain('undefined')
        expect(errorText?.toLowerCase()).not.toContain('null')
        expect(errorText?.toLowerCase()).not.toContain('exception')
      }

      // Page should still render main sections even with missing data
      await expect(page.locator('h1, h2')).toBeVisible()
      await expect(page.locator('button:has-text("Download"), a:has-text("Download")')).toBeVisible()
    })
  })
})
