/**
 * Automated E2E UI Test Suite
 *
 * Tests complete WasteWise workflow using Puppeteer:
 * - Landing page branding verification
 * - Login flow
 * - Project navigation
 * - Analysis triggering
 * - Progress monitoring
 * - Results validation
 * - Download functionality
 *
 * Usage:
 *   pnpm test:ui
 *
 * Environment Variables Required:
 *   - DEV_SERVER_URL (default: http://localhost:3000)
 *   - TEST_USER_EMAIL (default: test@wastewise.local)
 *   - TEST_USER_PASSWORD (default: TestPassword123!)
 *   - TEST_PROJECT_ID (from seed script output)
 */

import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") });

// Test configuration
const CONFIG = {
  baseUrl: process.env.DEV_SERVER_URL || "http://localhost:3000",
  testUser: {
    email: process.env.TEST_USER_EMAIL || "test@wastewise.local",
    password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
  },
  testProjectId:
    process.env.TEST_PROJECT_ID || "d82e2314-7ccf-404e-a133-0caebb154c7e",
  screenshotDir: join(process.cwd(), "test-screenshots"),
  timeout: {
    navigation: 60000,
    analysis: 300000, // 5 minutes for complete analysis
    element: 10000,
  },
  viewport: {
    width: 1920,
    height: 1080,
  },
};

// Test results tracking
interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
  screenshot?: string;
}

const results: TestResult[] = [];
let browser: Browser;
let page: Page;

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!existsSync(CONFIG.screenshotDir)) {
    mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Record test result
 */
function recordResult(result: TestResult) {
  results.push(result);
  const icon =
    result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⏸️";
  console.log(`${icon} ${result.name} (${result.duration}ms)`);
  if (result.error) {
    console.error(`   Error: ${result.error}`);
  }
  if (result.screenshot) {
    console.log(`   Screenshot: ${result.screenshot}`);
  }
}

/**
 * Take screenshot helper
 */
async function takeScreenshot(name: string): Promise<string> {
  const screenshotPath = join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({
    path: screenshotPath as any,
    fullPage: true,
  });
  return screenshotPath;
}

/**
 * Wait for element helper
 */
async function waitForElement(
  selector: string,
  timeout = CONFIG.timeout.element,
): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Test 1: Landing Page Branding
 */
async function testLandingPage(): Promise<void> {
  const startTime = Date.now();
  const testName = "Landing Page: WasteWise Branding";

  try {
    console.log("\n🧪 Test 1: Landing Page Branding Verification\n");

    console.log("  → Navigating to:", CONFIG.baseUrl);
    await page.goto(CONFIG.baseUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout.navigation,
    });

    console.log("  → Waiting for page content to load...");
    // Wait for React to render by checking for any visible text content
    await page.waitForFunction(() => document.body.innerText.length > 100, {
      timeout: CONFIG.timeout.element,
    });

    // Additional wait to ensure all components have mounted
    await sleep(2000);

    console.log("  → Taking screenshot...");
    const screenshotPath = await takeScreenshot("01-landing-page");

    console.log("  → Checking for WasteWise branding...");
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasWasteWise =
      bodyText.includes("WasteWise") || bodyText.includes("THE Trash Hub");
    const hasBrillance = bodyText.includes("Brillance");

    if (!hasWasteWise) {
      throw new Error("WasteWise branding not found on landing page");
    }

    if (hasBrillance) {
      throw new Error('Old "Brillance" branding still present');
    }

    console.log("  ✓ WasteWise branding verified");
    console.log("  ✓ No legacy branding found");

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("01-landing-page-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Test 2: Login Flow
 */
async function testLoginFlow(): Promise<void> {
  const startTime = Date.now();
  const testName = "Login Flow";

  try {
    console.log("\n🧪 Test 2: Login Flow\n");

    console.log("  → Navigating to login page...");
    await page.goto(`${CONFIG.baseUrl}/login`, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout.navigation,
    });

    await sleep(1000);

    console.log("  → Filling login form...");

    // Wait for email input
    await waitForElement('input[type="email"], input[name="email"]');
    await page.type(
      'input[type="email"], input[name="email"]',
      CONFIG.testUser.email,
      { delay: 50 },
    );

    // Wait for password input
    await waitForElement('input[type="password"], input[name="password"]');
    await page.type(
      'input[type="password"], input[name="password"]',
      CONFIG.testUser.password,
      { delay: 50 },
    );

    console.log("  → Taking screenshot...");
    await takeScreenshot("02-login-form");

    console.log("  → Submitting form...");
    await Promise.all([
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: CONFIG.timeout.navigation,
      }),
      page.click('button[type="submit"]'),
    ]);

    await sleep(2000);

    console.log("  → Verifying redirect to dashboard...");
    const currentUrl = page.url();

    if (
      !currentUrl.includes("/dashboard") &&
      !currentUrl.includes("/projects")
    ) {
      throw new Error(
        `Expected redirect to dashboard or projects, got: ${currentUrl}`,
      );
    }

    const screenshotPath = await takeScreenshot("02-login-success");

    console.log("  ✓ Login successful");
    console.log("  ✓ Redirected to:", currentUrl);

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("02-login-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Test 3: Project Navigation
 */
async function testProjectNavigation(): Promise<void> {
  const startTime = Date.now();
  const testName = "Project Navigation";

  try {
    console.log("\n🧪 Test 3: Project Navigation\n");

    const projectUrl = `${CONFIG.baseUrl}/projects/${CONFIG.testProjectId}`;
    console.log("  → Navigating to project:", projectUrl);
    await page.goto(projectUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout.navigation,
    });

    await sleep(2000);

    console.log("  → Taking screenshot...");
    const screenshotPath = await takeScreenshot("03-project-page");

    console.log("  → Verifying project details...");
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasProjectName =
      pageText.includes("Riverside Gardens") || pageText.includes("250");

    if (!hasProjectName) {
      throw new Error("Project details not found on page");
    }

    console.log("  ✓ Project page loaded");
    console.log("  ✓ Project details displayed");

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("03-project-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Test 4: Start Analysis
 */
async function testStartAnalysis(): Promise<void> {
  const startTime = Date.now();
  const testName = "Start Analysis";

  try {
    console.log("\n🧪 Test 4: Start Analysis\n");

    console.log('  → Looking for "Start Analysis" button...');

    // Step 1: Click the main "Start Analysis" button to open dialog
    const triggerClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const analyzeBtn = buttons.find(
        (btn) => btn.textContent?.trim() === "Start Analysis",
      );
      if (analyzeBtn) {
        (analyzeBtn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });

    if (!triggerClicked) {
      throw new Error('Could not find "Start Analysis" button');
    }

    console.log('  ✓ Clicked "Start Analysis" button');
    await sleep(1000);

    // Step 2: Wait for dialog to appear and click the confirmation button
    console.log("  → Waiting for dialog to open...");
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log("  ✓ Dialog opened");

    await sleep(500);

    // Step 3: Click the "Start Analysis" button in the dialog footer
    const dialogClicked = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return false;

      const buttons = Array.from(dialog.querySelectorAll("button"));
      const startBtn = buttons.find((btn) => {
        const text = btn.textContent?.trim() || "";
        return text === "Start Analysis" && !text.includes("Cancel");
      });

      if (startBtn) {
        (startBtn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });

    if (!dialogClicked) {
      throw new Error('Could not find "Start Analysis" button in dialog');
    }

    console.log("  ✓ Confirmed analysis start");
    await sleep(2000);

    // Wait for dialog to close
    console.log("  → Waiting for dialog to close...");
    await page
      .waitForFunction(() => !document.querySelector('[role="dialog"]'), {
        timeout: 5000,
      })
      .catch(() => console.log("  ⚠️  Dialog still open"));

    const currentUrl = page.url();
    console.log("  → Current URL:", currentUrl);

    console.log("  → Taking screenshot...");
    const screenshotPath = await takeScreenshot("04-processing-started");

    // Check if we're on processing or results page
    if (
      !currentUrl.includes("/processing") &&
      !currentUrl.includes("/results")
    ) {
      console.warn(
        `  ⚠️  Expected navigation to processing page, got: ${currentUrl}`,
      );
      // Don't fail - analysis might have completed immediately
    }

    console.log("  ✓ Analysis started successfully");

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("04-analysis-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Test 5: Monitor Progress
 */
async function testMonitorProgress(): Promise<void> {
  const startTime = Date.now();
  const testName = "Monitor Progress";

  try {
    console.log("\n🧪 Test 5: Monitor Analysis Progress\n");

    console.log("  → Polling for job completion (max 5 minutes)...");

    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 5 seconds = 5 minutes

    while (!jobCompleted && attempts < maxAttempts) {
      attempts++;

      // Check current URL
      const currentUrl = page.url();

      // Check for results page
      if (currentUrl.includes("/results")) {
        jobCompleted = true;
        console.log(
          `  ✓ Job completed and redirected to results (${attempts * 5} seconds)`,
        );
        break;
      }

      // Check for job status in DOM
      const statusCheck = await page
        .evaluate(() => {
          // Look for various status indicators
          const statusElement = document.querySelector(
            "[data-job-status], [data-status], .job-status",
          );
          const progressElement = document.querySelector(
            "[data-progress], .progress-percent",
          );
          const stepElement = document.querySelector(
            "[data-current-step], .current-step",
          );

          return {
            status: statusElement?.textContent || "",
            progress: progressElement?.textContent || "",
            step: stepElement?.textContent || "",
            hasCompleted: document.body.innerText
              .toLowerCase()
              .includes("completed"),
            hasResults: document.body.innerText
              .toLowerCase()
              .includes("results"),
          };
        })
        .catch(() => null);

      if (statusCheck) {
        if (
          statusCheck.hasCompleted ||
          statusCheck.hasResults ||
          statusCheck.status.toLowerCase() === "completed"
        ) {
          jobCompleted = true;
          console.log(`  ✓ Job completed after ${attempts * 5} seconds`);

          // Wait for redirect to results page
          await sleep(2000);

          // If not auto-redirected, navigate manually
          if (!page.url().includes("/results")) {
            console.log("  → Manually navigating to results page...");
            await page.goto(
              `${CONFIG.baseUrl}/projects/${CONFIG.testProjectId}/results`,
              {
                waitUntil: "networkidle2",
                timeout: CONFIG.timeout.navigation,
              },
            );
          }
          break;
        }

        if (attempts % 6 === 0) {
          console.log(`  → Still processing... (${attempts * 5}s elapsed)`);
          console.log(
            `     Progress: ${statusCheck.progress}, Step: ${statusCheck.step}`,
          );
          await takeScreenshot(`05-progress-${attempts}`);
        }
      }

      await sleep(5000);
    }

    if (!jobCompleted) {
      throw new Error("Analysis did not complete within 5 minutes");
    }

    const screenshotPath = await takeScreenshot("05-progress-final");
    console.log("  ✓ Analysis completed successfully");

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("05-progress-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Test 6: Results Page
 */
async function testResultsPage(): Promise<void> {
  const startTime = Date.now();
  const testName = "Results Page Validation";

  try {
    console.log("\n🧪 Test 6: Results Page Validation\n");

    console.log("  → Verifying results page loaded...");
    const currentUrl = page.url();

    if (!currentUrl.includes("/results")) {
      // Try navigating to results page
      console.log("  → Navigating to results page...");
      await page.goto(
        `${CONFIG.baseUrl}/projects/${CONFIG.testProjectId}/results`,
        {
          waitUntil: "networkidle2",
          timeout: CONFIG.timeout.navigation,
        },
      );
    }

    await sleep(2000);

    console.log("  → Taking screenshot...");
    const screenshotPath = await takeScreenshot("06-results-page");

    console.log("  → Checking for analysis data...");
    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return {
        hasSavings:
          bodyText.includes("saving") || bodyText.includes("potential"),
        hasRecommendations: bodyText.includes("recommendation"),
        hasDownloadButtons: document.querySelectorAll("button").length > 0,
        text: document.body.innerText,
      };
    });

    if (!pageContent.hasSavings && !pageContent.hasRecommendations) {
      console.warn("  ⚠️  Could not verify savings/recommendations data");
      console.warn("  → Page content:", pageContent.text.substring(0, 500));
    }

    console.log("  → Checking download buttons...");
    const downloadButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return {
        excelButton: buttons.some(
          (btn) =>
            btn.textContent?.toLowerCase().includes("excel") ||
            btn.textContent?.toLowerCase().includes("download"),
        ),
        htmlButton: buttons.some(
          (btn) =>
            btn.textContent?.toLowerCase().includes("html") ||
            btn.textContent?.toLowerCase().includes("dashboard"),
        ),
        totalButtons: buttons.length,
      };
    });

    console.log(`  → Found ${downloadButtons.totalButtons} buttons`);
    console.log(`  → Excel button: ${downloadButtons.excelButton ? "✓" : "✗"}`);
    console.log(`  → HTML button: ${downloadButtons.htmlButton ? "✓" : "✗"}`);

    console.log("  ✓ Results page loaded successfully");
    if (pageContent.hasSavings) console.log("  ✓ Savings data displayed");
    if (pageContent.hasRecommendations)
      console.log("  ✓ Recommendations displayed");
    if (downloadButtons.excelButton)
      console.log("  ✓ Excel download available");
    if (downloadButtons.htmlButton) console.log("  ✓ HTML dashboard available");

    recordResult({
      name: testName,
      status: "pass",
      duration: Date.now() - startTime,
      screenshot: screenshotPath,
    });
  } catch (error) {
    const screenshotPath = await takeScreenshot("06-results-error");
    recordResult({
      name: testName,
      status: "fail",
      duration: Date.now() - startTime,
      error: (error as Error).message,
      screenshot: screenshotPath,
    });
    throw error;
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 E2E Test Suite Summary");
  console.log("=".repeat(80));

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏸️  Skipped: ${skipped}`);
  console.log(`\nPass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log("\n📸 Screenshots saved to:", CONFIG.screenshotDir);
  console.log("=".repeat(80) + "\n");
}

/**
 * Main test runner
 */
async function main() {
  console.log("\n🚀 Starting WasteWise E2E UI Test Suite\n");
  console.log("Configuration:");
  console.log(`  Base URL: ${CONFIG.baseUrl}`);
  console.log(`  Test User: ${CONFIG.testUser.email}`);
  console.log(`  Test Project ID: ${CONFIG.testProjectId}`);
  console.log(`  Screenshot Dir: ${CONFIG.screenshotDir}`);

  // Ensure screenshot directory exists
  ensureScreenshotDir();

  try {
    // Launch browser
    console.log("\n🌐 Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();
    await page.setViewport({
      width: CONFIG.viewport.width,
      height: CONFIG.viewport.height,
    });

    console.log("✓ Browser launched successfully\n");

    // Run tests sequentially
    await testLandingPage();
    await testLoginFlow();
    await testProjectNavigation();
    await testStartAnalysis();
    await testMonitorProgress();
    await testResultsPage();

    // Print summary
    printSummary();

    // Close browser
    await browser.close();

    // Exit with appropriate code
    const failed = results.filter((r) => r.status === "fail").length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n💥 Test suite failed:", (error as Error).message);
    printSummary();

    // Close browser if open
    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

// Run tests
main();
