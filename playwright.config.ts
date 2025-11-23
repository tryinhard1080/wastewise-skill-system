import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration for WasteWise
 *
 * Note: On Windows, browser installation may require manual setup.
 * For CI/CD (Linux), browsers install automatically.
 *
 * See __tests__/e2e/README.md for setup instructions.
 */
export default defineConfig({
  testDir: "__tests__/e2e",

  // Run tests sequentially to avoid database state conflicts
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker to prevent database conflicts
  workers: 1,

  // Reporter configuration
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared test configuration
  use: {
    // Base URL for the application
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "retain-on-failure",

    // Capture screenshot on failure
    screenshot: "only-on-failure",

    // Capture video on failure
    video: "retain-on-failure",

    // Maximum time each action can take
    actionTimeout: 10000,

    // Maximum navigation time
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web server configuration for running tests
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start

    // Environment variables for the dev server
    env: {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
  },

  // Global test timeout (15 minutes for long-running analysis tests)
  timeout: 15 * 60 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
});
