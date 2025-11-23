# WasteWise Testing Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-18 (Phase 7)

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Automated E2E Testing (Puppeteer)](#automated-e2e-testing-puppeteer)
3. [Performance Validation (Chrome DevTools MCP)](#performance-validation-chrome-devtools-mcp)
4. [Test Data Management](#test-data-management)
5. [CI/CD Integration](#cicd-integration)
6. [Troubleshooting](#troubleshooting)

---

## Testing Overview

WasteWise uses a **hybrid testing approach**:

1. **Puppeteer** - Fully automated E2E tests (runs independently)
2. **Chrome DevTools MCP** - AI-assisted performance validation
3. **Vitest** - Unit and integration tests
4. **Backend E2E** - API-level integration tests

---

## Automated E2E Testing (Puppeteer)

### Quick Start

```bash
# 1. Ensure all services are running
npx supabase start
pnpm dev          # Terminal 1
pnpm worker       # Terminal 2

# 2. Seed test data
pnpm seed

# 3. Run E2E tests
pnpm test:ui
```

### Test Suite Coverage

The E2E test suite (`scripts/test-e2e-ui.ts`) covers the complete WasteWise workflow:

| Test # | Name                  | Duration | Description                                        |
| ------ | --------------------- | -------- | -------------------------------------------------- |
| 1      | Landing Page Branding | ~5s      | Verifies WasteWise branding (no "Brillance")       |
| 2      | Login Flow            | ~10s     | Authentication with test credentials               |
| 3      | Project Navigation    | ~5s      | Navigate to test project page                      |
| 4      | Start Analysis        | ~5s      | Click "Start Analysis" button, verify job creation |
| 5      | Monitor Progress      | 2-5min   | Poll for job completion, track progress            |
| 6      | Results Validation    | ~10s     | Verify savings, recommendations, download buttons  |

**Total Duration**: ~3-6 minutes (depends on analysis completion time)

### Test Configuration

Environment variables (`.env.local`):

```bash
# Required for E2E tests
DEV_SERVER_URL=http://localhost:3000
TEST_USER_EMAIL=test@wastewise.local
TEST_USER_PASSWORD=TestPassword123!
TEST_PROJECT_ID=d82e2314-7ccf-404e-a133-0caebb154c7e  # From pnpm seed output
```

### Test Output

**Screenshots**: Saved to `test-screenshots/` directory

- `01-landing-page.png` - Initial page load
- `02-login-form.png` - Login form filled
- `02-login-success.png` - After login redirect
- `03-project-page.png` - Project details page
- `04-processing-started.png` - Analysis started
- `05-progress-X.png` - Progress screenshots (every 30s)
- `05-progress-final.png` - Analysis completed
- `06-results-page.png` - Final results page

**Console Output**:

```
🚀 Starting WasteWise E2E UI Test Suite

Configuration:
  Base URL: http://localhost:3000
  Test User: test@wastewise.local
  Test Project ID: d82e2314-7ccf-404e-a133-0caebb154c7e
  Screenshot Dir: C:\...\test-screenshots

🌐 Launching browser...
✓ Browser launched successfully

🧪 Test 1: Landing Page Branding Verification

  → Navigating to: http://localhost:3000
  → Taking screenshot...
  → Checking for WasteWise branding...
  ✓ WasteWise branding verified
  ✓ No legacy branding found
✅ Landing Page: WasteWise Branding (2345ms)
   Screenshot: C:\...\01-landing-page.png

...

================================================================================
📊 E2E Test Suite Summary
================================================================================

Total Tests: 6
✅ Passed: 6
❌ Failed: 0
⏸️  Skipped: 0

Pass Rate: 100.0%

📸 Screenshots saved to: C:\...\test-screenshots
================================================================================
```

### Customization

**Run with custom config**:

```bash
DEV_SERVER_URL=http://localhost:4000 pnpm test:ui
```

**Run in headed mode** (for debugging):

Edit `scripts/test-e2e-ui.ts` line 619:

```typescript
browser = await puppeteer.launch({
  headless: false, // Changed from true
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
```

**Adjust timeouts**:

Edit `CONFIG` object in `scripts/test-e2e-ui.ts`:

```typescript
const CONFIG = {
  // ...
  timeout: {
    navigation: 30000, // Page load timeout
    analysis: 300000, // 5 minutes for analysis
    element: 10000, // Element wait timeout
  },
};
```

---

## Performance Validation (Chrome DevTools MCP)

### Overview

After Puppeteer tests pass, use **Chrome DevTools MCP** for advanced performance validation:

- **Lighthouse audits** - Overall performance score
- **Console error monitoring** - Runtime errors
- **Network timing** - API request durations
- **Resource analysis** - Bundle sizes, load times

### How to Use

Chrome DevTools MCP is AI-assisted, meaning **I (Claude) execute the validation steps** using MCP tools.

#### Step 1: Ask Claude to Run Performance Validation

**Example request**:

```
"Can you run a Lighthouse audit on the WasteWise results page and check for console errors?"
```

#### Step 2: Claude Uses MCP Tools

I will use the following MCP tools (configured in `.claude/mcp-servers.json`):

- `mcp__puppeteer__puppeteer_navigate` - Navigate to page
- `mcp__puppeteer__puppeteer_evaluate` - Execute JavaScript to check performance
- `mcp__puppeteer__puppeteer_screenshot` - Capture visual evidence

#### Step 3: Review Results

I will provide a report with:

- Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Console errors found (if any)
- Network request timings
- Recommendations for improvements

### Example Performance Validation Session

**You**:

> "Run performance validation on the WasteWise results page after the E2E tests complete."

**Claude (me)**:

1. Navigate to `http://localhost:3000/projects/[id]/results`
2. Run Lighthouse audit
3. Check for console errors
4. Analyze network requests
5. Provide report:

```
Performance Validation Results
==============================

Lighthouse Scores:
- Performance: 92/100 ✅ (target: >90)
- Accessibility: 98/100 ✅
- Best Practices: 95/100 ✅
- SEO: 100/100 ✅

Console Errors: None ✅

Network Timing:
- Initial page load: 1.2s
- API call to /api/jobs/[id]: 245ms
- Total resources: 12 (2.3MB)

Recommendations:
- Consider lazy-loading chart images
- Enable compression for API responses
- Add service worker for offline support

Overall: PASS ✅ All metrics meet Phase 7 requirements
```

### Specific Performance Checks

#### Check 1: Lighthouse Score >90

**Request**:

> "Run a Lighthouse audit on the landing page and ensure the performance score is above 90."

**What I'll do**:

- Navigate to landing page
- Run Lighthouse audit using Chrome DevTools
- Report all scores

#### Check 2: Console Error Detection

**Request**:

> "Check for console errors during the complete workflow (login → analysis → results)."

**What I'll do**:

- Navigate through workflow
- Monitor console for errors, warnings
- Report any issues found

#### Check 3: Network Request Analysis

**Request**:

> "Analyze network requests during analysis job polling. Are we polling too frequently?"

**What I'll do**:

- Monitor network tab during polling
- Count requests
- Measure timing
- Verify 2-second interval

#### Check 4: Responsive Design Validation

**Request**:

> "Test the results page at mobile (375px), tablet (768px), and desktop (1440px) viewports."

**What I'll do**:

- Resize viewport to each breakpoint
- Take screenshots
- Verify layout adapts correctly

---

## Test Data Management

### Seed Test Data

**Script**: `scripts/seed-test-data.ts`

**What it creates**:

- ✅ Test user: `test@wastewise.local` / `TestPassword123!`
- ✅ Test project: "Riverside Gardens Apartments"
  - 250 units
  - Compactor equipment
  - Austin, TX location
- ✅ 6 monthly invoices (Jan-Jun 2025)
- ✅ 22 haul log entries (realistic data with variation)
- ✅ 1 contract terms record

**Run seed script**:

```bash
pnpm seed
```

**Output**:

```
✅ Seed completed successfully!

📋 Test Credentials:
  Email:    test@wastewise.local
  Password: TestPassword123!

🏢 Test Project:
  ID:        d82e2314-7ccf-404e-a133-0caebb154c7e
  Name:      Riverside Gardens Apartments
  Units:     250
  Equipment: COMPACTOR
  Location:  Austin, TX

📊 Data Created:
  - 6 monthly invoices (Jan-Jun 2025)
  - 22 haul log entries
  - 1 contract terms record
```

**Important**: Copy the `Project ID` and add it to `.env.local`:

```bash
TEST_PROJECT_ID=d82e2314-7ccf-404e-a133-0caebb154c7e
```

### Reset Test Data

```bash
# Reset database (WARNING: Deletes all data)
npx supabase db reset

# Re-seed test data
pnpm seed
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Start Supabase
        run: npx supabase start

      - name: Run database migrations
        run: npx supabase db push

      - name: Seed test data
        run: pnpm seed

      - name: Build application
        run: pnpm build

      - name: Start dev server
        run: pnpm dev &
        env:
          NODE_ENV: test

      - name: Wait for dev server
        run: npx wait-on http://localhost:3000 -t 30000

      - name: Start worker
        run: pnpm worker &

      - name: Wait for worker
        run: sleep 5

      - name: Run E2E tests
        run: pnpm test:ui

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-screenshots/

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run TypeScript checks
pnpm tsc --noEmit || exit 1

# Run unit tests
pnpm test:unit || exit 1

# Optional: Run E2E tests (comment out for faster commits)
# pnpm test:ui || exit 1
```

---

## Troubleshooting

### Test Failures

#### Test 1: Landing Page Branding

**Error**: "WasteWise branding not found"

**Solution**:

- Check dev server is running (`pnpm dev`)
- Verify `DEV_SERVER_URL` is correct
- Check landing page content in browser manually

#### Test 2: Login Flow

**Error**: "Expected redirect to dashboard, got: /login"

**Solutions**:

- Verify test user exists (`test@wastewise.local`)
- Check password is correct (`TestPassword123!`)
- Manually login in browser to verify credentials
- Check for console errors during login

#### Test 3: Project Navigation

**Error**: "Project details not found on page"

**Solutions**:

- Verify test data is seeded (`pnpm seed`)
- Check `TEST_PROJECT_ID` in `.env.local` is correct
- Navigate to project page manually in browser

#### Test 4: Start Analysis

**Error**: "Could not find Start Analysis button"

**Solutions**:

- Check project page has "Start Analysis" button
- Verify no existing jobs are running
- Check for console errors on project page

#### Test 5: Monitor Progress

**Error**: "Analysis did not complete within 5 minutes"

**Solutions**:

- Verify worker is running (`pnpm worker`)
- Check worker logs for errors
- Manually check job status in database:
  ```sql
  SELECT id, status, progress_percent, current_step, error_message
  FROM analysis_jobs
  ORDER BY created_at DESC
  LIMIT 1;
  ```
- Increase timeout in `CONFIG.timeout.analysis` if needed

#### Test 6: Results Page

**Error**: "Could not verify savings/recommendations data"

**Solutions**:

- Check job completed successfully (status='completed')
- Verify `result_data` is not null in database
- Check for errors in results page console
- Navigate to results page manually in browser

### Browser Issues

**Error**: "Failed to launch browser"

**Windows Solution**:

```bash
# Install browser dependencies
pnpm puppeteer browsers install chrome
```

**Linux Solution**:

```bash
# Install Chrome dependencies
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils
```

### Performance Validation Issues

**Issue**: Claude DevTools MCP not working

**Solution**:

- Verify MCP server is configured: check `.claude/mcp-servers.json`
- Ensure `chrome-devtools-mcp` is installed:
  ```bash
  npx -y chrome-devtools-mcp@latest --help
  ```
- Ask Claude directly to run performance validation

---

## Advanced Testing

### Responsive Design Testing

**Test multiple viewports**:

Edit `scripts/test-e2e-ui.ts` to add viewport tests:

```typescript
const viewports = [
  { width: 375, height: 667, name: "Mobile" },
  { width: 768, height: 1024, name: "Tablet" },
  { width: 1024, height: 768, name: "Desktop" },
  { width: 1440, height: 900, name: "Large Desktop" },
];

for (const viewport of viewports) {
  await page.setViewport(viewport);
  await takeScreenshot(`results-${viewport.name}`);
}
```

### Dark Mode Testing

**Test dark mode toggle**:

```typescript
// Click dark mode toggle
await page.click("[data-theme-toggle]");
await sleep(500);
await takeScreenshot("results-dark-mode");
```

### Download Validation

**Test report downloads**:

```typescript
// Set download path
const client = await page.target().createCDPSession();
await client.send("Page.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: "./test-downloads",
});

// Click download button
await page.click('button:has-text("Download Excel")');

// Wait for download
await sleep(2000);

// Verify file exists
const files = fs.readdirSync("./test-downloads");
console.log("Downloaded files:", files);
```

---

## Summary

**Automated Testing** (Puppeteer):

- ✅ Runs independently without AI assistance
- ✅ CI/CD integration ready
- ✅ Full workflow coverage
- ✅ Screenshot evidence at each step

**Performance Validation** (Chrome DevTools MCP):

- ✅ AI-assisted advanced validation
- ✅ Lighthouse audits
- ✅ Console error detection
- ✅ Network timing analysis

**Combined Approach**:

- ✅ Best of both worlds
- ✅ Comprehensive test coverage
- ✅ Production-ready quality assurance

---

**Last Updated**: 2025-11-18 (Phase 7)
**Maintained By**: Orchestrator Agent

**Generated with [Claude Code](https://claude.com/claude-code)**
