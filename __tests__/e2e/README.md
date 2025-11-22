# E2E Testing Guide for WasteWise

This directory contains end-to-end (E2E) tests for the WasteWise application using Playwright.

## Overview

E2E tests validate the complete user journey from authentication to downloading analysis reports. These tests interact with the real application, database, and AI services to ensure everything works together correctly.

## Directory Structure

```
__tests__/e2e/
├── README.md                          # This file
├── complete-analysis-flow.spec.ts     # Original complete workflow test (5 tests)
├── auth-flows.spec.ts                 # Authentication tests (9 tests)
├── project-management.spec.ts         # Project CRUD operations (9 tests)
├── file-upload.spec.ts                # File upload & validation (9 tests)
├── analysis-workflows.spec.ts         # Analysis job workflows (9 tests)
├── results-reports.spec.ts            # Results display & downloads (9 tests)
├── error-handling.spec.ts             # Error states & edge cases (9 tests)
├── performance.spec.ts                # Performance & load testing (7 tests)
├── utils/
│   ├── test-helpers.ts                # Helper functions for tests
│   └── fixtures.ts                    # Playwright fixtures (auth, projects, etc.)
└── seeds/
    ├── README.md                      # Test data documentation
    └── test-files/                    # Sample files for upload testing
        ├── sample-invoice.csv
        ├── sample-invoice.xlsx
        ├── sample-haullog.csv
        └── sample-haullog.xlsx
```

**Total Test Coverage**: 66 E2E tests across 8 test suites

## Prerequisites

### Local Development

1. **Environment Variables**: Ensure `.env.local` has all required variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

2. **Supabase Local Instance**: Start Supabase before running tests:
   ```bash
   pnpm supabase start
   pnpm supabase db push
   ```

3. **Background Worker**: Start the worker process:
   ```bash
   pnpm worker
   ```

4. **Playwright Browsers**: Install browsers (one-time setup):
   ```bash
   pnpm exec playwright install chromium
   ```

   **Note for Windows Users**: If you encounter browser installation errors (winldd issues), you can:
   - Use the existing Puppeteer installation for local testing
   - Run E2E tests in CI/CD (Linux) where Playwright installs cleanly
   - Or manually download Chromium and configure Playwright to use it

### CI/CD

All required setup is automated in `.github/workflows/e2e-tests.yml`. Tests run automatically on:
- Pull requests to `master`
- Pushes to `master`
- Manual workflow dispatch

## Test Suites Overview

### 1. Authentication Flows (`auth-flows.spec.ts`) - 9 tests
Tests user authentication and session management:
- User signup with validation
- Login/logout flows
- Password reset functionality
- Session persistence across page reloads
- Protected route access control

### 2. Project Management (`project-management.spec.ts`) - 9 tests
Tests project CRUD operations and data isolation:
- Project creation with required fields
- Form validation errors
- Project listing and details viewing
- File uploads to projects
- Project deletion with confirmation
- Row-level security (RLS) validation
- Multiple project support

### 3. File Upload & Validation (`file-upload.spec.ts`) - 9 tests
Tests file upload functionality and validation:
- PDF, Excel (.xlsx), and CSV uploads
- Multiple file uploads
- File size validation (10MB limit)
- File type validation (unsupported types rejected)
- Upload progress indicators
- File removal before analysis
- File list display with names and sizes

### 4. Analysis Workflows (`analysis-workflows.spec.ts`) - 9 tests
Tests all analysis job types and states:
- Complete analysis jobs
- Invoice extraction jobs
- Regulatory research jobs
- Report generation jobs
- Progress tracking during processing
- Job completion and auto-redirect to results
- Error handling for failed jobs
- Job cancellation (if supported)

### 5. Results & Reports (`results-reports.spec.ts`) - 9 tests
Tests results page rendering and downloads:
- Analysis summary display
- Optimization recommendations
- Expense breakdown visualization
- Excel report downloads
- HTML dashboard downloads
- File format validation (valid .xlsx and .html)
- Empty state handling (no data message)
- Graceful handling of missing data

### 6. Error Handling & Edge Cases (`error-handling.spec.ts`) - 9 tests
Tests application resilience and error states:
- API unavailability (503 errors)
- File upload failures
- Analysis job failures
- Retry mechanisms
- User-friendly error messages (no technical jargon)
- Network errors and timeouts
- Rate limiting (429 responses)
- Unauthorized access (401 responses)
- Validation errors with field-specific messages

### 7. Performance & Load Testing (`performance.spec.ts`) - 7 tests
Tests application performance and scalability:
- Dashboard load time (<2s)
- Project list load time (<2s)
- Results page load time (<2s)
- File upload time (<30s for 10MB)
- Analysis completion time (<5 minutes)
- Concurrent file uploads (10 simultaneous)
- Large dataset handling (250 units, 6 months data)

### 8. Complete Analysis Flow (`complete-analysis-flow.spec.ts`) - 5 tests
Original comprehensive workflow tests:
- Full user journey from login to download
- Analysis with seeded data
- Multiple project creation
- File upload error handling
- Progress monitoring during analysis

## Running Tests

### Full Test Suite

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with UI (interactive mode)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run in debug mode (step through tests)
pnpm test:e2e:debug
```

### Specific Test Suites

```bash
# Run specific test suite
pnpm exec playwright test auth-flows
pnpm exec playwright test project-management
pnpm exec playwright test file-upload
pnpm exec playwright test analysis-workflows
pnpm exec playwright test results-reports
pnpm exec playwright test error-handling
pnpm exec playwright test performance

# Run original complete workflow tests
pnpm exec playwright test complete-analysis-flow

# Run a specific test by name
pnpm exec playwright test --grep "User can complete full analysis"
```

### View Test Results

```bash
# Open HTML report
pnpm test:e2e:report

# Or open directly
npx playwright show-report
```

## Test Fixtures

Fixtures provide reusable test contexts with automatic setup/cleanup.

### `authenticatedPage`

Creates a test user, logs in, and provides an authenticated page.

```typescript
test('my test', async ({ authenticatedPage }) => {
  // Page is already logged in
  await authenticatedPage.goto('/dashboard')
  // ... test code ...
})
// User automatically deleted after test
```

### `testProject`

Creates a test user, logs in, and creates a test project.

```typescript
test('my test', async ({ testProject }) => {
  const { page, projectId, userId } = testProject
  await page.goto(`/projects/${projectId}`)
  // ... test code ...
})
// Project and user automatically deleted after test
```

### `seededProject`

Creates a test project with pre-seeded invoice and haul log data.

```typescript
test('analyze seeded project', async ({ seededProject }) => {
  const { page, projectId } = seededProject
  // Project already has 6 months of invoice data and 22 haul logs
  await page.goto(`/projects/${projectId}/analyze`)
  // ... test code ...
})
// All data automatically cleaned up after test
```

## Helper Functions

Located in `utils/test-helpers.ts`:

### User Management

```typescript
// Create test user
const userId = await createTestUser('test@example.com', 'password123')

// Delete test user (also deletes associated data)
await deleteTestUser(userId)

// Login to application
await loginUser(page, 'test@example.com', 'password123')
```

### Project Management

```typescript
// Create test project
const projectId = await createTestProject(userId, {
  property_name: 'Test Property',
  units: 250,
  property_type: 'Garden-Style',
  equipment_type: 'COMPACTOR'
})

// Delete test project
await deleteTestProject(projectId)
```

### Job Monitoring

```typescript
// Wait for analysis job to complete
const result = await waitForJobCompletion(page, jobId, 300000) // 5 min timeout

// Get current job progress
const progress = await getCurrentJobProgress(page)

// Wait for specific progress milestone
await waitForProgress(page, 50) // Wait until 50% complete
```

### File Operations

```typescript
// Upload file via UI
await uploadFileViaUI(page, '/path/to/file.xlsx')

// Download file and verify
const { filename, path } = await downloadFile(page, 'button:has-text("Download")')
```

### Data Seeding

```typescript
// Seed invoice data
await seedInvoiceData(projectId, [
  {
    service_month: '2025-01',
    total_amount: 2850.00,
    line_items: [...]
  }
])

// Seed haul log data
await seedHaulLogData(projectId, [
  { pickup_date: '2025-01-03', tons: 4.2 }
])
```

## Writing New Tests

### Basic Structure

```typescript
import { test, expect } from './utils/fixtures'

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Arrange
    await authenticatedPage.goto('/some-page')

    // Act
    await authenticatedPage.click('button:has-text("Click Me")')

    // Assert
    await expect(authenticatedPage.locator('h1')).toContainText('Expected Text')
  })
})
```

### Using Fixtures

```typescript
// Use authenticated page (auto-login)
test('test with auth', async ({ authenticatedPage }) => {
  // User is already logged in
})

// Use test project (auto-created)
test('test with project', async ({ testProject }) => {
  const { page, projectId } = testProject
  // Project already exists, user logged in
})

// Use seeded project (data pre-loaded)
test('test with data', async ({ seededProject }) => {
  const { page, projectId } = seededProject
  // Project has invoice and haul log data
})
```

### Test Timeouts

E2E tests involving AI processing can take several minutes:

```typescript
test.describe('Long-running tests', () => {
  test.setTimeout(15 * 60 * 1000) // 15 minutes

  test('analysis workflow', async ({ seededProject }) => {
    // Test that may take 5-10 minutes
  })
})
```

## Debugging Tests

### Debug Mode

Run tests in debug mode to step through them:

```bash
pnpm test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through test actions
- Inspect page elements
- Pause and resume execution
- View console logs

### Headed Mode

See the browser during test execution:

```bash
pnpm test:e2e:headed
```

### Screenshots and Videos

Tests automatically capture:
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Traces**: On failure only (includes network, console, etc.)

Find artifacts in:
- `test-results/` - Raw test output
- `playwright-report/` - HTML report with screenshots/videos

### Console Logs

Add debug logs in tests:

```typescript
test('debug test', async ({ page }) => {
  console.log('Step 1: Navigating to page')
  await page.goto('/dashboard')

  console.log('Step 2: Clicking button')
  await page.click('button')
})
```

## Troubleshooting

### Browser Installation Issues (Windows)

**Problem**: `winldd.exe` errors when installing Chromium

**Solution 1 - Use CI/CD**:
- Tests run perfectly in CI/CD (Linux)
- Develop locally, validate in PR checks

**Solution 2 - Use Puppeteer**:
- Puppeteer is already installed
- Configure Playwright to use Puppeteer's Chromium

**Solution 3 - Manual Install**:
```bash
# Download Chromium manually
# Configure playwright.config.ts to use custom executable path
```

### Test Timeouts

**Problem**: Tests fail with "Timeout" errors

**Causes**:
1. Worker not running (analysis jobs never complete)
2. Supabase not started (database errors)
3. Network issues (slow AI responses)

**Solutions**:
```bash
# Ensure worker is running
pnpm worker

# Ensure Supabase is running
pnpm supabase start

# Increase timeout in test
test.setTimeout(20 * 60 * 1000) // 20 minutes
```

### Database State Conflicts

**Problem**: Tests fail due to duplicate data or missing records

**Cause**: Previous test didn't clean up properly

**Solution**:
```bash
# Reset Supabase database
pnpm supabase db reset

# Or restart Supabase
pnpm supabase stop
pnpm supabase start
pnpm supabase db push
```

### Worker Not Processing Jobs

**Problem**: Analysis jobs stay in "pending" status forever

**Checklist**:
1. Worker process is running (`pnpm worker`)
2. `ANTHROPIC_API_KEY` is set in `.env.local`
3. Worker logs show job pickup (check `worker.log`)
4. No errors in worker console

### File Upload Failures

**Problem**: File uploads don't work in tests

**Causes**:
1. Invalid file path (use absolute paths)
2. File doesn't exist
3. File type not supported

**Solution**:
```typescript
import path from 'path'

// Use path.join for cross-platform compatibility
const filePath = path.join(__dirname, 'seeds/test-files/sample-invoice.xlsx')
await uploadFileViaUI(page, filePath)
```

## Best Practices

### 1. Use Fixtures

Always use fixtures for common setups:

```typescript
// ❌ DON'T create users manually in every test
test('bad test', async ({ page }) => {
  const userId = await createTestUser(...)
  await loginUser(...)
  // ... test code ...
  await deleteTestUser(userId) // Easy to forget!
})

// ✅ DO use fixtures
test('good test', async ({ authenticatedPage }) => {
  // User auto-created, logged in, and cleaned up
})
```

### 2. Isolate Tests

Each test should be independent:

```typescript
// ✅ Good - No dependencies
test('test 1', async ({ testProject }) => {
  // Uses own project
})

test('test 2', async ({ testProject }) => {
  // Uses separate project
})
```

### 3. Clean Selectors

Use data-testid attributes for stable selectors:

```typescript
// ❌ Fragile - Text can change
await page.click('button:has-text("Submit")')

// ✅ Stable - Uses test ID
await page.click('[data-testid="submit-button"]')
```

### 4. Explicit Waits

Wait for elements before interacting:

```typescript
// ❌ May fail if element not yet visible
await page.click('button')

// ✅ Waits for element to be ready
await expect(page.locator('button')).toBeVisible()
await page.click('button')
```

### 5. Meaningful Assertions

Assert on user-visible behavior:

```typescript
// ❌ Tests implementation details
expect(await page.locator('#result').getAttribute('data-value')).toBe('123')

// ✅ Tests user-visible output
await expect(page.locator('h1')).toContainText('Analysis Complete')
```

## Performance Optimization

### Parallel Execution

By default, tests run sequentially (workers: 1) to avoid database conflicts.

To enable parallel execution:
1. Use isolated database instances per worker
2. Update `playwright.config.ts`:
   ```typescript
   workers: process.env.CI ? 2 : 1
   ```

### Seeded Data

Use `seededProject` fixture instead of uploading files:

```typescript
// ❌ Slower - Uploads and processes files
test('slow test', async ({ testProject }) => {
  await uploadFileViaUI(page, 'invoice.xlsx')
  await page.click('button:has-text("Analyze")')
})

// ✅ Faster - Data already in database
test('fast test', async ({ seededProject }) => {
  await page.click('button:has-text("Analyze")')
})
```

## CI/CD Integration

Tests run automatically on GitHub Actions. See `.github/workflows/e2e-tests.yml`.

### Viewing CI Results

1. Go to PR or commit
2. Click "Checks" tab
3. Select "E2E Tests" workflow
4. View test results and artifacts

### Downloading Artifacts

Failed test artifacts (screenshots, videos, traces) are available for 7 days:

1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download `playwright-report` or `test-results`

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [WasteWise Testing Guide](../../docs/TESTING.md)
- [GitHub Actions Workflow](.github/workflows/e2e-tests.yml)

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review test logs and screenshots
3. Run tests locally with `--debug` flag
4. Check `worker.log` for background job errors
5. Verify Supabase is running and migrations applied
6. Ask in team Slack channel or create GitHub issue
