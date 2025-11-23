/**
 * E2E Test: Complete Analysis Workflow
 *
 * This test validates the entire user journey from signup to downloading reports:
 * 1. User authentication (signup/login)
 * 2. Project creation
 * 3. File upload (invoices, haul logs)
 * 4. Analysis execution (async job processing)
 * 5. Results viewing
 * 6. Report downloads (Excel + HTML)
 *
 * Note: This test can take 5-10 minutes due to real AI processing
 */

import { test, expect } from "./utils/fixtures";
import {
  waitForJobCompletion,
  uploadFileViaUI,
  downloadFile,
} from "./utils/test-helpers";
import * as path from "path";

test.describe("Complete Analysis Workflow", () => {
  test.setTimeout(15 * 60 * 1000); // 15 minutes for complete workflow

  test("User can complete full analysis from login to download", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Step 1: Verify we're on the dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");

    // Step 2: Create a new project
    console.log("Step 2: Creating new project...");
    await page.click(
      'button:has-text("Create New Project"), a:has-text("Create New Project")',
    );

    // Fill in project details
    await page.fill('[name="property_name"]', "E2E Test Property");
    await page.fill('[name="units"]', "250");
    await page.selectOption('[name="property_type"]', "Garden-Style");
    await page.selectOption('[name="equipment_type"]', "COMPACTOR");
    await page.fill('[name="location"]', "Austin, TX");

    // Submit project creation
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for redirect to project page
    await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 10000 });

    // Extract project ID from URL
    const url = page.url();
    const projectIdMatch = url.match(/\/projects\/([a-f0-9-]+)/);
    expect(projectIdMatch).not.toBeNull();
    const projectId = projectIdMatch![1];

    console.log(`✓ Project created: ${projectId}`);

    // Step 3: Upload test files
    console.log("Step 3: Uploading test files...");

    // Upload invoice file
    const invoicePath = path.join(
      __dirname,
      "seeds/test-files/sample-invoice.xlsx",
    );
    await uploadFileViaUI(page, invoicePath);

    // Wait for upload confirmation
    await expect(page.locator("text=/uploaded|success/i")).toBeVisible({
      timeout: 10000,
    });

    // Upload haul log file
    const haulLogPath = path.join(
      __dirname,
      "seeds/test-files/sample-haullog.xlsx",
    );
    await uploadFileViaUI(page, haulLogPath);

    // Verify both files uploaded
    await expect(page.locator("text=/2.*files?.*uploaded/i")).toBeVisible({
      timeout: 10000,
    });

    console.log("✓ Files uploaded successfully");

    // Step 4: Start analysis
    console.log("Step 4: Starting analysis...");

    // Click analyze button
    await page.click(
      'button:has-text("Analyze"), button:has-text("Start Analysis")',
    );

    // Wait for redirect to processing page
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/processing/, {
      timeout: 10000,
    });

    console.log("✓ Analysis started");

    // Step 5: Monitor job progress
    console.log("Step 5: Waiting for analysis to complete...");

    // Get job ID from URL or page data
    let jobId: string | null = null;

    // Try to extract job ID from the page
    const jobIdElement = await page.locator("[data-job-id]").first();
    if ((await jobIdElement.count()) > 0) {
      jobId = await jobIdElement.getAttribute("data-job-id");
    }

    // If no job ID on page, try to get from API calls
    if (!jobId) {
      // Wait for progress indicator to appear
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({
        timeout: 30000,
      });

      // Extract job ID from network requests or page state
      // For now, we'll poll the processing page until completion
    }

    // Wait for completion (max 10 minutes for real analysis)
    const maxWaitTime = 10 * 60 * 1000;
    const startTime = Date.now();
    let completed = false;

    while (Date.now() - startTime < maxWaitTime && !completed) {
      // Check if we've been redirected to results page
      const currentUrl = page.url();
      if (currentUrl.includes("/results")) {
        completed = true;
        break;
      }

      // Check for completion indicator on processing page
      const completedIndicator = page.locator(
        "text=/completed|finished|done/i",
      );
      if ((await completedIndicator.count()) > 0) {
        completed = true;
        break;
      }

      // Check for error
      const errorIndicator = page.locator("text=/error|failed/i");
      if ((await errorIndicator.count()) > 0) {
        const errorText = await errorIndicator.first().textContent();
        throw new Error(`Analysis failed: ${errorText}`);
      }

      // Wait 2 seconds before next check
      await page.waitForTimeout(2000);
    }

    if (!completed) {
      throw new Error("Analysis did not complete within 10 minutes");
    }

    console.log("✓ Analysis completed");

    // Step 6: View results
    console.log("Step 6: Viewing results...");

    // If not already on results page, navigate to it
    if (!page.url().includes("/results")) {
      await page.goto(`/projects/${projectId}/results`);
    }

    // Verify results page loaded
    await expect(page.locator("h1, h2")).toContainText(
      /results|analysis|complete/i,
    );

    // Verify key result sections are present
    await expect(
      page.locator("text=/executive summary|overview/i"),
    ).toBeVisible();
    await expect(
      page.locator("text=/optimization|recommendation/i"),
    ).toBeVisible();
    await expect(page.locator("text=/cost|savings/i")).toBeVisible();

    console.log("✓ Results page loaded with data");

    // Step 7: Download reports
    console.log("Step 7: Downloading reports...");

    // Download Excel report
    const excelDownload = await downloadFile(
      page,
      'button:has-text("Download Excel"), a:has-text("Download Excel")',
    );

    expect(excelDownload.filename).toMatch(/\.xlsx$/i);
    console.log(`✓ Excel report downloaded: ${excelDownload.filename}`);

    // Download HTML dashboard
    const htmlDownload = await downloadFile(
      page,
      'button:has-text("Download HTML"), button:has-text("Download Dashboard"), a:has-text("Download HTML")',
    );

    expect(htmlDownload.filename).toMatch(/\.html$/i);
    console.log(`✓ HTML dashboard downloaded: ${htmlDownload.filename}`);

    // Final verification
    console.log("✅ Complete E2E workflow test passed!");
  });

  test("Analysis workflow with seeded data", async ({ seededProject }) => {
    const { page, projectId } = seededProject;

    console.log("Testing analysis with pre-seeded data...");

    // Navigate to project
    await page.goto(`/projects/${projectId}`);

    // Start analysis (no file upload needed - data is already seeded)
    await page.click(
      'button:has-text("Analyze"), button:has-text("Start Analysis")',
    );

    // Wait for processing
    await page.waitForURL(/\/processing/, { timeout: 10000 });

    // Wait for completion (seeded data should process faster)
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();
    let completed = false;

    while (Date.now() - startTime < maxWaitTime && !completed) {
      const currentUrl = page.url();
      if (currentUrl.includes("/results")) {
        completed = true;
        break;
      }

      const completedIndicator = page.locator("text=/completed|finished/i");
      if ((await completedIndicator.count()) > 0) {
        completed = true;
        break;
      }

      await page.waitForTimeout(2000);
    }

    expect(completed).toBe(true);

    // Verify results
    await expect(page.locator("h1, h2")).toContainText(/results|analysis/i);

    // Verify compactor optimization results are present
    await expect(page.locator("text=/compactor/i")).toBeVisible();
    await expect(page.locator("text=/yards per door|ypd/i")).toBeVisible();

    console.log("✅ Seeded data analysis test passed!");
  });

  test("User can create multiple projects", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Create first project
    await page.click(
      'button:has-text("Create New Project"), a:has-text("Create New Project")',
    );
    await page.fill('[name="property_name"]', "Test Property 1");
    await page.fill('[name="units"]', "150");
    await page.selectOption('[name="property_type"]', "Mid-Rise");
    await page.selectOption('[name="equipment_type"]', "COMPACTOR");
    await page.click('button[type="submit"]:has-text("Create")');

    await page.waitForURL(/\/projects\/[a-f0-9-]+/);
    const project1Id = page.url().match(/\/projects\/([a-f0-9-]+)/)![1];

    // Go back to dashboard
    await page.goto("/dashboard");

    // Create second project
    await page.click(
      'button:has-text("Create New Project"), a:has-text("Create New Project")',
    );
    await page.fill('[name="property_name"]', "Test Property 2");
    await page.fill('[name="units"]', "300");
    await page.selectOption('[name="property_type"]', "High-Rise");
    await page.selectOption('[name="equipment_type"]', "DUMPSTER");
    await page.click('button[type="submit"]:has-text("Create")');

    await page.waitForURL(/\/projects\/[a-f0-9-]+/);
    const project2Id = page.url().match(/\/projects\/([a-f0-9-]+)/)![1];

    // Verify different project IDs
    expect(project1Id).not.toBe(project2Id);

    // Go to dashboard and verify both projects are listed
    await page.goto("/dashboard");

    await expect(page.locator("text=Test Property 1")).toBeVisible();
    await expect(page.locator("text=Test Property 2")).toBeVisible();

    console.log("✅ Multiple projects test passed!");
  });

  test("Handles file upload errors gracefully", async ({ testProject }) => {
    const { page } = testProject;

    // Try to upload an invalid file type
    const invalidFilePath = path.join(__dirname, "utils/test-helpers.ts");

    // Attempt upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);

    // Should show error message
    await expect(page.locator("text=/invalid|error|supported/i")).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ File upload error handling test passed!");
  });

  test("Displays progress updates during analysis", async ({
    seededProject,
  }) => {
    const { page, projectId } = seededProject;

    await page.goto(`/projects/${projectId}`);

    // Start analysis
    await page.click(
      'button:has-text("Analyze"), button:has-text("Start Analysis")',
    );

    // Wait for processing page
    await page.waitForURL(/\/processing/);

    // Verify progress indicators are present
    await expect(
      page.locator('[data-testid="progress-bar"], text=/progress|processing/i'),
    ).toBeVisible({ timeout: 30000 });

    // Verify progress percentage updates (should change over time)
    const initialProgress = await page
      .locator('[data-testid="progress-percent"]')
      .textContent();

    // Wait a few seconds
    await page.waitForTimeout(10000);

    const updatedProgress = await page
      .locator('[data-testid="progress-percent"]')
      .textContent();

    // Progress should have changed (or job completed)
    const completed = page.url().includes("/results");
    if (!completed) {
      expect(updatedProgress).not.toBe(initialProgress);
    }

    console.log("✅ Progress updates test passed!");
  });
});
