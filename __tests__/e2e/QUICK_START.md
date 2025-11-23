# E2E Testing Quick Start

Fast reference for running E2E tests.

## Prerequisites (One-Time Setup)

```bash
# 1. Install Playwright browsers
pnpm exec playwright install chromium

# 2. Ensure .env.local has these variables:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=your-api-key
```

## Running Tests

### Start Required Services

```bash
# Terminal 1: Supabase
pnpm supabase start

# Terminal 2: Background Worker
pnpm worker

# Terminal 3: Dev Server
pnpm dev
```

### Run Tests

```bash
# Interactive mode (recommended)
pnpm test:e2e:ui

# Headless mode (CI-like)
pnpm test:e2e

# Debug mode (step through)
pnpm test:e2e:debug

# Headed mode (see browser)
pnpm test:e2e:headed

# Run specific test
pnpm exec playwright test --grep "complete full analysis"
```

### View Results

```bash
# Open HTML report
pnpm test:e2e:report

# Screenshots/videos are in:
test-results/
playwright-report/
```

## Common Issues

### "Missing environment variables"

→ Check `.env.local` has all required vars

### "Connection refused"

→ Ensure Supabase is running (`pnpm supabase start`)

### "Job timeout"

→ Check worker is running (`pnpm worker`)

### Browser install fails (Windows)

→ Tests work in CI/CD (Linux) - not critical for local dev

## Test Structure

```
__tests__/e2e/
├── complete-analysis-flow.spec.ts   # Main tests
├── utils/
│   ├── test-helpers.ts              # Helper functions
│   └── fixtures.ts                  # Test fixtures
└── seeds/
    └── test-files/                  # Sample data
```

## Available Fixtures

```typescript
// Auto-login
test("name", async ({ authenticatedPage }) => {
  // User already logged in
});

// Auto-create project
test("name", async ({ testProject }) => {
  const { page, projectId } = testProject;
});

// Project with data
test("name", async ({ seededProject }) => {
  const { page, projectId } = seededProject;
  // 6 months of data pre-loaded
});
```

## Full Documentation

- **Complete Guide**: `__tests__/e2e/README.md`
- **Setup Summary**: `E2E_TESTING_SETUP_COMPLETE.md`
- **General Testing**: `docs/TESTING.md`
