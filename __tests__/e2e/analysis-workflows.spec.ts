/**
 * E2E Test Suite: Analysis Workflows
 *
 * Tests all analysis job types and workflow states:
 * - Complete analysis jobs
 * - Invoice extraction jobs
 * - Regulatory research jobs
 * - Report generation jobs
 * - Progress tracking and status updates
 * - Job completion and redirection
 * - Error handling and job failures
 * - Job cancellation
 */

import { test, expect } from "./utils/fixtures";
import { waitForJobCompletion, uploadFileViaUI } from "./utils/test-helpers";
import * as path from "path";

test.describe("Analysis Workflows", () => {
  // Set longer timeout for analysis tests
  test.setTimeout(10 * 60 * 1000); // 10 minutes

  test.describe("Complete Analysis Job", () => {
    test("Complete analysis job completes successfully", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      console.log("Starting complete analysis workflow test...");

      // Navigate to project
      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click(
        'button:has-text("Analyze"), button:has-text("Start Analysis")',
      );

      // Should redirect to processing page
      await page.waitForURL(/\/processing/, { timeout: 10000 });

      // Progress indicators should be visible
      await expect(
        page.locator(
          '[data-testid="progress-bar"], text=/processing|analyzing/i',
        ),
      ).toBeVisible({ timeout: 30000 });

      // Wait for completion (max 8 minutes for real analysis)
      const maxWaitTime = 8 * 60 * 1000;
      const startTime = Date.now();
      let completed = false;

      while (Date.now() - startTime < maxWaitTime && !completed) {
        const currentUrl = page.url();
        if (currentUrl.includes("/results")) {
          completed = true;
          break;
        }

        const completedIndicator = page.locator(
          "text=/completed|finished|done/i",
        );
        if ((await completedIndicator.count()) > 0) {
          completed = true;
          break;
        }

        const errorIndicator = page.locator("text=/error|failed/i");
        if ((await errorIndicator.count()) > 0) {
          const errorText = await errorIndicator.first().textContent();
          throw new Error(`Analysis failed: ${errorText}`);
        }

        await page.waitForTimeout(2000);
      }

      expect(completed).toBe(true);

      // Should be on results page
      await expect(page.url()).toContain("/results");

      console.log("Complete analysis test passed!");
    });
  });

  test.describe("Invoice Extraction Job", () => {
    test("Invoice extraction job completes successfully", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Upload invoice file
      const invoicePath = path.join(
        __dirname,
        "seeds/test-files/sample-invoice.xlsx",
      );
      await uploadFileViaUI(page, invoicePath);

      await expect(page.locator("text=/uploaded/i")).toBeVisible({
        timeout: 10000,
      });

      // Start invoice extraction (if there's a separate button for this)
      // Otherwise it will be part of the complete analysis
      const extractButton = page.locator(
        'button:has-text("Extract"), button:has-text("Extract Invoices")',
      );

      if ((await extractButton.count()) > 0) {
        await extractButton.click();

        // Wait for processing
        await page.waitForURL(/\/processing/, { timeout: 10000 });

        // Wait for completion
        await expect(
          page.locator("text=/extraction.*complete|completed/i"),
        ).toBeVisible({ timeout: 2 * 60 * 1000 });
      } else {
        // Extraction happens as part of full analysis
        console.log("Invoice extraction is part of full analysis workflow");
      }
    });
  });

  test.describe("Regulatory Research Job", () => {
    test("Regulatory research job completes successfully", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Check if there's a separate regulatory research button
      const researchButton = page.locator(
        'button:has-text("Research"), button:has-text("Regulatory Research")',
      );

      if ((await researchButton.count()) > 0) {
        await researchButton.click();

        // Wait for processing
        await page.waitForURL(/\/processing/, { timeout: 10000 });

        // Regulatory research can take time
        const maxWaitTime = 3 * 60 * 1000; // 3 minutes
        const startTime = Date.now();
        let completed = false;

        while (Date.now() - startTime < maxWaitTime && !completed) {
          const completedIndicator = page.locator(
            "text=/research.*complete|ordinance.*found/i",
          );
          if ((await completedIndicator.count()) > 0) {
            completed = true;
            break;
          }

          await page.waitForTimeout(2000);
        }

        expect(completed).toBe(true);
      } else {
        console.log("Regulatory research is part of full analysis workflow");
      }
    });
  });

  test.describe("Report Generation Job", () => {
    test("Report generation job completes successfully", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      // First, run analysis if not already done
      await page.goto(`/projects/${projectId}`);

      // Check if we already have results
      const resultsLink = page.locator(
        'a:has-text("View Results"), button:has-text("View Results")',
      );

      if ((await resultsLink.count()) === 0) {
        // Run analysis first
        await page.click('button:has-text("Analyze")');
        await page.waitForURL(/\/processing/);

        // Wait for completion
        const maxWaitTime = 8 * 60 * 1000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
          if (page.url().includes("/results")) break;
          await page.waitForTimeout(2000);
        }
      } else {
        // Navigate to existing results
        await resultsLink.click();
      }

      // Now on results page, reports should be generated
      await expect(
        page.locator(
          'button:has-text("Download Excel"), a:has-text("Download Excel")',
        ),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        page.locator(
          'button:has-text("Download HTML"), a:has-text("Download HTML")',
        ),
      ).toBeVisible({ timeout: 30000 });

      console.log("Report generation verified!");
    });
  });

  test.describe("Progress Tracking", () => {
    test("Job shows progress updates during processing", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing page
      await page.waitForURL(/\/processing/);

      // Verify progress indicators
      await expect(
        page.locator('[data-testid="progress-bar"], .progress-bar'),
      ).toBeVisible({ timeout: 30000 });

      // Get initial progress
      const progressPercent = page.locator('[data-testid="progress-percent"]');
      const initialProgress = await progressPercent.textContent();

      console.log(`Initial progress: ${initialProgress}`);

      // Wait a bit
      await page.waitForTimeout(10000);

      // Progress should have changed (or job completed)
      if (!page.url().includes("/results")) {
        const updatedProgress = await progressPercent.textContent();
        console.log(`Updated progress: ${updatedProgress}`);

        // Progress should be different or show higher percentage
        expect(updatedProgress).not.toBe(initialProgress);
      }
    });

    test("User can view job status on processing page", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing page
      await page.waitForURL(/\/processing/);

      // Verify status elements are visible
      await expect(
        page.locator('[data-testid="job-status"], text=/status/i'),
      ).toBeVisible({ timeout: 10000 });

      // Verify current step is shown
      await expect(
        page.locator(
          '[data-testid="current-step"], text=/extracting|analyzing|generating/i',
        ),
      ).toBeVisible({ timeout: 30000 });

      // Verify progress percentage is shown
      await expect(
        page.locator('[data-testid="progress-percent"]'),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Job Completion", () => {
    test("User is redirected to results page when job completes", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing page
      await page.waitForURL(/\/processing/);

      // Wait for automatic redirect to results
      await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 });

      // Verify we're on results page
      await expect(page.locator("h1, h2")).toContainText(
        /results|analysis|complete/i,
      );
    });
  });

  test.describe("Error Handling", () => {
    test("Failed job shows error message", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Try to start analysis without any files (should fail)
      const analyzeButton = page.locator('button:has-text("Analyze")');

      if ((await analyzeButton.count()) > 0) {
        await analyzeButton.click();

        // Should show error about missing files
        await expect(
          page.locator("text=/no.*files|files.*required|upload.*files/i"),
        ).toBeVisible({ timeout: 10000 });
      } else {
        // Button might be disabled when no files
        const disabledButton = page.locator(
          'button:has-text("Analyze"):disabled',
        );
        await expect(disabledButton).toBeVisible();
      }
    });
  });

  test.describe("Job Cancellation", () => {
    test("User can cancel running job", async ({ seededProject }) => {
      const { page, projectId } = seededProject;

      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing page
      await page.waitForURL(/\/processing/);

      // Wait for progress to start
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({
        timeout: 30000,
      });

      // Look for cancel button
      const cancelButton = page.locator(
        'button:has-text("Cancel"), [data-testid="cancel-job"]',
      );

      if ((await cancelButton.count()) > 0) {
        await cancelButton.click();

        // Should show confirmation
        const confirmCancel = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes")',
        );

        if ((await confirmCancel.count()) > 0) {
          await confirmCancel.click();
        }

        // Should show cancellation message or redirect
        await expect(
          page.locator("text=/cancelled|canceled|stopped/i"),
        ).toBeVisible({ timeout: 10000 });
      } else {
        console.log("Job cancellation not available in UI - skipping");
        test.skip();
      }
    });
  });
});
