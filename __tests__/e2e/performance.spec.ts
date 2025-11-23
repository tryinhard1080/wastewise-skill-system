/**
 * E2E Test Suite: Performance & Load Testing
 *
 * Tests application performance and scalability:
 * - Page load times (Dashboard, Projects, Results)
 * - File upload performance
 * - Analysis job completion time
 * - Concurrent file uploads
 * - Large dataset handling
 * - Memory efficiency
 * - Loading states
 */

import { test, expect } from "./utils/fixtures";
import { uploadFileViaUI, createTestProject } from "./utils/test-helpers";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

test.describe("Performance & Load Testing", () => {
  test.describe("Page Load Performance", () => {
    test("Dashboard loads in <2 seconds", async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      const startTime = Date.now();

      await page.goto("/dashboard");

      // Wait for main content to be visible
      await expect(page.locator("h1")).toContainText(/dashboard/i);

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test("Project list loads in <2 seconds", async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Create a few projects first
      const userId = page.url().includes("dashboard")
        ? await page.evaluate(() => window.localStorage.getItem("userId"))
        : null;

      await page.goto("/dashboard");

      const startTime = Date.now();

      await page.goto("/projects");

      // Wait for project list or empty state
      await expect(
        page.locator(
          '[data-testid="project-list"], text=/no.*projects|create.*project/i',
        ),
      ).toBeVisible();

      const loadTime = Date.now() - startTime;

      console.log(`Project list load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(2000);
    });

    test("Results page loads in <2 seconds", async ({ seededProject }) => {
      const { page, projectId } = seededProject;

      // First, run analysis to have results
      await page.goto(`/projects/${projectId}`);
      await page.click('button:has-text("Analyze")');
      await page.waitForURL(/\/processing/);

      // Wait for completion
      await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 });

      // Now measure results page reload time
      const startTime = Date.now();

      await page.goto(`/projects/${projectId}/results`);

      // Wait for main content
      await expect(page.locator("h1, h2")).toContainText(/results|analysis/i);

      const loadTime = Date.now() - startTime;

      console.log(`Results page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe("File Upload Performance", () => {
    test("File upload completes in <30 seconds (10MB file)", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create a 10MB test file
      const largeFilePath = path.join(os.tmpdir(), "large-test-file.xlsx");
      const fileContent = Buffer.alloc(10 * 1024 * 1024); // 10MB
      fs.writeFileSync(largeFilePath, fileContent);

      try {
        const startTime = Date.now();

        // Upload file
        await uploadFileViaUI(page, largeFilePath);

        // Wait for upload confirmation
        await expect(
          page.locator("text=/uploaded|upload.*success/i"),
        ).toBeVisible({ timeout: 30000 });

        const uploadTime = Date.now() - startTime;

        console.log(`10MB file upload time: ${uploadTime}ms`);

        expect(uploadTime).toBeLessThan(30000);
      } finally {
        // Cleanup
        if (fs.existsSync(largeFilePath)) {
          fs.unlinkSync(largeFilePath);
        }
      }
    });
  });

  test.describe("Analysis Performance", () => {
    test("Analysis job completes in <5 minutes (realistic dataset)", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      console.log("Starting analysis performance test...");

      await page.goto(`/projects/${projectId}`);

      const startTime = Date.now();

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing
      await page.waitForURL(/\/processing/);

      // Wait for completion
      await page.waitForURL(/\/results/, { timeout: 5 * 60 * 1000 });

      const analysisTime = Date.now() - startTime;

      console.log(`Analysis completion time: ${analysisTime / 1000}s`);

      expect(analysisTime).toBeLessThan(5 * 60 * 1000); // 5 minutes
    });
  });

  test.describe("Concurrent Operations", () => {
    test("App handles 10 concurrent file uploads", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create 10 small test files
      const filePaths: string[] = [];

      for (let i = 1; i <= 10; i++) {
        const filePath = path.join(os.tmpdir(), `concurrent-test-${i}.csv`);
        const content = `File ${i}\nData,Value\nTest,${i}\n`;
        fs.writeFileSync(filePath, content);
        filePaths.push(filePath);
      }

      try {
        const startTime = Date.now();

        // Upload all files at once
        const fileInput = page.locator('input[type="file"]');

        // Some browsers support multiple file selection
        await fileInput.setInputFiles(filePaths);

        // Wait for uploads to complete
        await expect(
          page.locator("text=/10.*files?.*uploaded|uploaded.*10/i"),
        ).toBeVisible({ timeout: 60000 });

        const totalTime = Date.now() - startTime;

        console.log(`10 concurrent uploads completed in: ${totalTime}ms`);

        // Should handle concurrent uploads without crashing
        expect(totalTime).toBeLessThan(60000); // 1 minute max
      } finally {
        // Cleanup
        filePaths.forEach((filePath) => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  });

  test.describe("Large Dataset Handling", () => {
    test("App handles large datasets (250-unit property, 6 months data)", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      // Seeded project already has:
      // - 250 units
      // - 6 months of invoice data
      // - 22 haul log entries

      await page.goto(`/projects/${projectId}`);

      // Navigate to project details
      await expect(page.locator("text=/250.*units/i")).toBeVisible();

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing
      await page.waitForURL(/\/processing/);

      // Should handle large dataset without timeout
      await page.waitForURL(/\/results/, { timeout: 8 * 60 * 1000 });

      // Verify results page loads successfully
      await expect(page.locator("h1, h2")).toContainText(/results|analysis/i);

      // Verify data is rendered
      await expect(page.locator("text=/250.*units/i")).toBeVisible();
      await expect(page.locator("text=/\$\d+/i")).toBeVisible(); // Dollar amounts

      console.log("Large dataset handled successfully!");
    });
  });

  test.describe("Loading States", () => {
    test("App shows loading indicators during long operations", async ({
      seededProject,
    }) => {
      const { page, projectId } = seededProject;

      await page.goto(`/projects/${projectId}`);

      // Start analysis
      await page.click('button:has-text("Analyze")');

      // Wait for processing page
      await page.waitForURL(/\/processing/);

      // Should show loading indicators
      const loadingIndicators = page.locator(
        '[data-testid="loading"], [data-testid="progress-bar"], .spinner, text=/loading|processing/i',
      );
      await expect(loadingIndicators.first()).toBeVisible({ timeout: 10000 });

      // Loading indicators should remain visible during processing
      await page.waitForTimeout(5000);

      // If still processing, loading should still be visible
      if (!page.url().includes("/results")) {
        await expect(loadingIndicators.first()).toBeVisible();
      }

      console.log("Loading states verified!");
    });
  });
});
