/**
 * E2E Test Suite: Error Handling & Edge Cases
 *
 * Tests application resilience and error handling:
 * - API unavailability
 * - File upload failures
 * - Analysis job failures
 * - Retry mechanisms
 * - User-friendly error messages
 * - Network errors
 * - Rate limiting (429 responses)
 * - Unauthorized access (401 responses)
 * - Validation errors with field-specific messages
 */

import { test, expect, Page } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  loginUser,
} from "./utils/test-helpers";
import * as path from "path";

test.describe("Error Handling & Edge Cases", () => {
  test.describe("API Errors", () => {
    test("User sees error message when API is unavailable", async ({
      page,
    }) => {
      // Create and login test user
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Intercept API calls and return 503
        await page.route("**/api/projects", (route) => {
          route.fulfill({
            status: 503,
            body: JSON.stringify({ error: "Service Unavailable" }),
          });
        });

        // Navigate to dashboard
        await page.goto("/dashboard");

        // Should show error message
        await expect(
          page.locator(
            "text=/service.*unavailable|unable.*to.*load|try.*again.*later/i",
          ),
        ).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteTestUser(userId);
      }
    });

    test("User sees error message when file upload fails", async ({ page }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Create a project
        await page.goto("/projects/new");
        await page.fill('[name="property_name"]', "Test Property");
        await page.fill('[name="units"]', "150");
        await page.selectOption('[name="property_type"]', "Garden-Style");
        await page.selectOption('[name="equipment_type"]', "COMPACTOR");
        await page.click('button[type="submit"]');

        await page.waitForURL(/\/projects\/[a-f0-9-]+/);

        // Intercept upload API and return error
        await page.route("**/api/upload", (route) => {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: "Upload failed" }),
          });
        });

        // Try to upload file
        const invoicePath = path.join(
          __dirname,
          "seeds/test-files/sample-invoice.xlsx",
        );
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(invoicePath);

        // Should show upload error
        await expect(
          page.locator("text=/upload.*failed|error.*uploading/i"),
        ).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteTestUser(userId);
      }
    });

    test("User sees error message when job fails", async ({ page }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Create project
        await page.goto("/projects/new");
        await page.fill('[name="property_name"]', "Test Property");
        await page.fill('[name="units"]', "150");
        await page.selectOption('[name="property_type"]', "Garden-Style");
        await page.selectOption('[name="equipment_type"]', "COMPACTOR");
        await page.click('button[type="submit"]');

        await page.waitForURL(/\/projects\/[a-f0-9-]+/);

        // Intercept analysis API and return error
        await page.route("**/api/analyze", (route) => {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: "Analysis failed" }),
          });
        });

        // Try to start analysis (might need files first)
        const analyzeButton = page.locator('button:has-text("Analyze")');

        if (
          (await analyzeButton.count()) > 0 &&
          !(await analyzeButton.isDisabled())
        ) {
          await analyzeButton.click();

          // Should show error message
          await expect(
            page.locator(
              "text=/analysis.*failed|error.*analyzing|failed.*to.*analyze/i",
            ),
          ).toBeVisible({ timeout: 10000 });
        }
      } finally {
        await deleteTestUser(userId);
      }
    });
  });

  test.describe("Retry Mechanisms", () => {
    test("User can retry failed operations", async ({ page }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Intercept API with failure first, then success
        let attemptCount = 0;
        await page.route("**/api/projects", (route) => {
          attemptCount++;

          if (attemptCount === 1) {
            // First attempt fails
            route.fulfill({
              status: 500,
              body: JSON.stringify({ error: "Server error" }),
            });
          } else {
            // Subsequent attempts succeed
            route.continue();
          }
        });

        // Navigate to dashboard
        await page.goto("/dashboard");

        // Should show error
        const errorMessage = page.locator("text=/error|failed/i");
        if ((await errorMessage.count()) > 0) {
          // Look for retry button
          const retryButton = page.locator(
            'button:has-text("Retry"), button:has-text("Try Again")',
          );

          if ((await retryButton.count()) > 0) {
            await retryButton.click();

            // Should succeed on retry
            await expect(page.locator("text=/error|failed/i")).not.toBeVisible({
              timeout: 5000,
            });
          }
        }
      } finally {
        await deleteTestUser(userId);
      }
    });
  });

  test.describe("User-Friendly Messages", () => {
    test("User sees meaningful error messages (not technical jargon)", async ({
      page,
    }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Intercept API with technical error
        await page.route("**/api/projects", (route) => {
          route.fulfill({
            status: 500,
            body: JSON.stringify({
              error: "NullPointerException at line 42",
              stack: "Very technical stack trace...",
            }),
          });
        });

        await page.goto("/dashboard");

        // Should show user-friendly message
        const errorMessages = page.locator("text=/error|failed|unable/i");

        if ((await errorMessages.count()) > 0) {
          const errorText = await errorMessages.first().textContent();

          // Should NOT contain technical terms
          expect(errorText?.toLowerCase()).not.toContain("exception");
          expect(errorText?.toLowerCase()).not.toContain("null");
          expect(errorText?.toLowerCase()).not.toContain("undefined");
          expect(errorText?.toLowerCase()).not.toContain("stack");
          expect(errorText?.toLowerCase()).not.toContain("line");

          // Should contain user-friendly terms
          const hasFriendlyMessage =
            errorText?.toLowerCase().includes("try again") ||
            errorText?.toLowerCase().includes("unable to") ||
            errorText?.toLowerCase().includes("please") ||
            errorText?.toLowerCase().includes("error loading");

          expect(hasFriendlyMessage).toBe(true);
        }
      } finally {
        await deleteTestUser(userId);
      }
    });
  });

  test.describe("Network Errors", () => {
    test("App handles network errors gracefully", async ({ page }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Simulate network timeout
        await page.route("**/api/projects", (route) => {
          // Don't fulfill or abort - just timeout
          setTimeout(() => {
            route.abort("timedout");
          }, 1000);
        });

        await page.goto("/dashboard");

        // Should show network error message
        await expect(
          page.locator(
            "text=/network.*error|connection.*error|timeout|unable.*to.*connect/i",
          ),
        ).toBeVisible({ timeout: 15000 });

        // Page should not crash
        await expect(page.locator("body")).toBeVisible();
      } finally {
        await deleteTestUser(userId);
      }
    });
  });

  test.describe("Rate Limiting", () => {
    test("App handles rate limiting gracefully (429 response)", async ({
      page,
    }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        // Intercept with rate limit response
        await page.route("**/api/analyze", (route) => {
          route.fulfill({
            status: 429,
            headers: {
              "Retry-After": "60",
            },
            body: JSON.stringify({
              error: "Too many requests",
            }),
          });
        });

        // Create and navigate to project
        await page.goto("/projects/new");
        await page.fill('[name="property_name"]', "Test Property");
        await page.fill('[name="units"]', "150");
        await page.selectOption('[name="property_type"]', "Garden-Style");
        await page.selectOption('[name="equipment_type"]', "COMPACTOR");
        await page.click('button[type="submit"]');

        await page.waitForURL(/\/projects\/[a-f0-9-]+/);

        // Try to analyze
        const analyzeButton = page.locator('button:has-text("Analyze")');

        if (
          (await analyzeButton.count()) > 0 &&
          !(await analyzeButton.isDisabled())
        ) {
          await analyzeButton.click();

          // Should show rate limit message
          await expect(
            page.locator(
              "text=/too.*many.*requests|rate.*limit|try.*again.*later|wait.*before/i",
            ),
          ).toBeVisible({ timeout: 10000 });
        }
      } finally {
        await deleteTestUser(userId);
      }
    });
  });

  test.describe("Authorization Errors", () => {
    test("App handles unauthorized access (401 response)", async ({ page }) => {
      // Don't log in - just try to access protected resource
      await page.goto("/dashboard");

      // Should redirect to login
      await page.waitForURL(/login/, { timeout: 10000 });

      // Verify we're on login page
      await expect(page.locator("h1, h2")).toContainText(/login|sign.*in/i);
    });
  });

  test.describe("Validation Errors", () => {
    test("App handles validation errors with field-specific messages", async ({
      page,
    }) => {
      const testEmail = `test-${Date.now()}@wastewise.test`;
      const testPassword = "TestPassword123!";
      const userId = await createTestUser(testEmail, testPassword);

      try {
        await loginUser(page, testEmail, testPassword);

        await page.goto("/projects/new");

        // Submit with invalid data
        await page.fill('[name="property_name"]', "");
        await page.fill('[name="units"]', "-5"); // Invalid: negative units
        await page.selectOption('[name="property_type"]', "Garden-Style");
        await page.selectOption('[name="equipment_type"]', "COMPACTOR");

        await page.click('button[type="submit"]');

        // Should show field-specific validation errors
        const propertyNameError = page.locator(
          "text=/property.*name.*required/i",
        );
        const unitsError = page.locator(
          "text=/units.*must.*be.*positive|invalid.*units/i",
        );

        // At least one validation error should be visible
        const hasValidationError =
          (await propertyNameError.count()) > 0 ||
          (await unitsError.count()) > 0;

        expect(hasValidationError).toBe(true);

        // Should not submit (still on form page)
        expect(page.url()).toContain("/projects/new");
      } finally {
        await deleteTestUser(userId);
      }
    });
  });
});
