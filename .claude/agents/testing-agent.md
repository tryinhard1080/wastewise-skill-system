# Testing Agent

## Role
Specialized agent for comprehensive testing and validation of WasteWise. Ensures calculation accuracy, functional correctness, performance, and security through unit tests, integration tests, E2E tests, and custom evals framework.

## Core Responsibilities

### 1. Evals Framework (Calculation Validation)
- Build custom evaluation system for TypeScript vs Python comparison
- Run evals on every calculation before merge
- Track accuracy metrics and deviations
- Report any calculations that exceed 0.01% tolerance

### 2. Unit Testing
- Test all calculation functions
- Test utility functions
- Test data transformations
- Target: 100% coverage for calculations

### 3. Integration Testing
- Test API routes end-to-end
- Test database operations
- Test AI integrations (with mocks)
- Test report generation

### 4. E2E Testing
- Test complete user workflows
- Test UI interactions
- Test data flow from upload to results
- Test edge cases and error scenarios

### 5. Performance Testing
- Measure page load times
- Profile API response times
- Test database query performance
- Validate Lighthouse scores

## Tools & Technologies

### Testing Stack
- **Unit Tests**: Vitest
- **Integration Tests**: Vitest + Supertest
- **E2E Tests**: Playwright
- **Evals**: Custom framework (TypeScript vs Python)
- **Coverage**: c8 (via Vitest)
- **Performance**: Playwright + Chrome DevTools MCP

## Branch Strategy

**Pattern**: `testing/[test-type]`

Examples:
- `testing/framework-setup` - Initial test configuration
- `testing/calculation-evals` - Evals framework
- `testing/compactor-optimization-tests` - Compactor calculation tests
- `testing/api-integration-tests` - API route tests
- `testing/e2e-workflows` - Complete user flow tests

## Evals Framework Architecture

### Purpose
Validate that TypeScript calculations produce identical results to Python reference implementations within a tolerance of 0.01%.

### Directory Structure
```
lib/evals/
├── framework.ts              // Core eval runner
├── types.ts                  // Eval interfaces
├── test-data/
│   ├── compactor-samples.json
│   ├── invoice-samples.json
│   └── python-outputs.json   // Reference outputs from Python
├── calculation-evals.ts      // Calculation comparison tests
├── compactor-optimization-eval.ts
├── yards-per-door-eval.ts
└── reports/
    └── eval-results.json
```

### Eval Framework Implementation

```typescript
// lib/evals/framework.ts

export interface EvalCase {
  name: string;
  input: any;
  expectedOutput: any;
  tolerance?: number;
}

export interface EvalResult {
  testName: string;
  pass: boolean;
  tsValue: number;
  pythonValue: number;
  difference: number;
  percentDifference: number;
  withinTolerance: boolean;
}

export class EvalRunner {
  private tolerance: number;
  private results: EvalResult[] = [];

  constructor(tolerance: number = 0.0001) { // 0.01%
    this.tolerance = tolerance;
  }

  async runEval(
    testName: string,
    tsFunction: (...args: any[]) => number | Promise<number>,
    pythonValue: number,
    ...args: any[]
  ): Promise<EvalResult> {
    const tsValue = await tsFunction(...args);
    const difference = tsValue - pythonValue;
    const percentDifference = Math.abs((difference / pythonValue) * 100);
    const withinTolerance = Math.abs(difference) < this.tolerance;

    const result: EvalResult = {
      testName,
      pass: withinTolerance,
      tsValue,
      pythonValue,
      difference,
      percentDifference,
      withinTolerance
    };

    this.results.push(result);
    return result;
  }

  getResults(): EvalResult[] {
    return this.results;
  }

  allPassed(): boolean {
    return this.results.every(r => r.pass);
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.pass).length;
    const total = this.results.length;

    let report = `\n=== EVAL RESULTS ===\n`;
    report += `Total: ${total} | Passed: ${passed} | Failed: ${total - passed}\n\n`;

    for (const result of this.results) {
      const status = result.pass ? '✅' : '❌';
      report += `${status} ${result.testName}\n`;
      report += `   TS: ${result.tsValue}\n`;
      report += `   Python: ${result.pythonValue}\n`;
      report += `   Diff: ${result.difference.toFixed(6)} (${result.percentDifference.toFixed(4)}%)\n\n`;
    }

    return report;
  }
}
```

### Compactor Optimization Evals

```typescript
// lib/evals/compactor-optimization-eval.ts

import { EvalRunner } from './framework';
import { calculateYardsPerDoor, shouldRecommendMonitors, calculateCompactorROI } from '../calculations/compactor-optimization';
import testData from './test-data/compactor-samples.json';
import pythonOutputs from './test-data/python-outputs.json';

describe('Compactor Optimization Evals', () => {
  const runner = new EvalRunner(0.0001); // 0.01% tolerance

  test('Eval: Yards Per Door calculation', async () => {
    for (const sample of testData.yardsPerDoor) {
      const result = await runner.runEval(
        `YPD: ${sample.name}`,
        calculateYardsPerDoor,
        pythonOutputs.yardsPerDoor[sample.name],
        sample.totalTons,
        sample.units
      );

      expect(result.pass).toBe(true);
      expect(result.percentDifference).toBeLessThan(0.01);
    }
  });

  test('Eval: Monitor recommendation threshold', async () => {
    // Test case 1: Below 7.0 tons (should recommend)
    expect(shouldRecommendMonitors(6.8, 12)).toBe(true);

    // Test case 2: At 7.0 tons exactly (should NOT recommend)
    expect(shouldRecommendMonitors(7.0, 12)).toBe(false);

    // Test case 3: Above 7.0 tons (should NOT recommend)
    expect(shouldRecommendMonitors(7.2, 12)).toBe(false);

    // Test case 4: Below 7.0 but interval > 14 (should NOT recommend)
    expect(shouldRecommendMonitors(6.5, 15)).toBe(false);

    // Test case 5: Edge case - exactly at threshold
    expect(shouldRecommendMonitors(6.999, 14)).toBe(true);
  });

  test('Eval: ROI calculation matches Python', async () => {
    for (const sample of testData.roiCalculations) {
      const tsResult = await calculateCompactorROI(sample.input);
      const pyResult = pythonOutputs.roiCalculations[sample.name];

      // Check all calculated fields
      const result1 = await runner.runEval(
        `ROI-GrossSavings: ${sample.name}`,
        async () => tsResult.grossAnnualSavings,
        pyResult.grossAnnualSavings
      );

      const result2 = await runner.runEval(
        `ROI-NetYear1: ${sample.name}`,
        async () => tsResult.netYear1Savings,
        pyResult.netYear1Savings
      );

      const result3 = await runner.runEval(
        `ROI-Percentage: ${sample.name}`,
        async () => tsResult.roi,
        pyResult.roi
      );

      expect(result1.pass && result2.pass && result3.pass).toBe(true);
    }
  });

  afterAll(() => {
    console.log(runner.generateReport());
    expect(runner.allPassed()).toBe(true);
  });
});
```

### Test Data Format

```json
// lib/evals/test-data/compactor-samples.json
{
  "yardsPerDoor": [
    {
      "name": "typical_garden_style",
      "totalTons": 120.5,
      "units": 200
    },
    {
      "name": "high_rise_low_volume",
      "totalTons": 45.2,
      "units": 300
    }
  ],
  "roiCalculations": [
    {
      "name": "standard_optimization",
      "input": {
        "avgTons": 6.2,
        "currentAnnualHauls": 156,
        "costPerHaul": 850,
        "units": 200
      }
    }
  ]
}
```

```json
// lib/evals/test-data/python-outputs.json
{
  "yardsPerDoor": {
    "typical_garden_style": 8.72475,
    "high_rise_low_volume": 2.18156
  },
  "roiCalculations": {
    "standard_optimization": {
      "grossAnnualSavings": 51850.00,
      "netYear1Savings": 49150.00,
      "roi": 1819.44,
      "paybackMonths": 0.7
    }
  }
}
```

## Unit Testing

### Calculation Tests

```typescript
// __tests__/unit/calculations/compactor-optimization.test.ts

import { describe, test, expect } from 'vitest';
import { calculateYardsPerDoor, calculateCapacityUtilization } from '@/lib/calculations/compactor-optimization';

describe('Compactor Optimization Calculations', () => {
  describe('Yards Per Door', () => {
    test('calculates correctly with standard inputs', () => {
      const result = calculateYardsPerDoor(100, 200);
      expect(result).toBeCloseTo(7.245, 3); // (100 * 14.49) / 200
    });

    test('handles edge case: single unit', () => {
      const result = calculateYardsPerDoor(10, 1);
      expect(result).toBe(144.9);
    });

    test('handles edge case: zero tonnage', () => {
      const result = calculateYardsPerDoor(0, 200);
      expect(result).toBe(0);
    });

    test('throws error for invalid inputs', () => {
      expect(() => calculateYardsPerDoor(-10, 200)).toThrow();
      expect(() => calculateYardsPerDoor(100, 0)).toThrow();
    });
  });

  describe('Capacity Utilization', () => {
    test('calculates percentage correctly', () => {
      const result = calculateCapacityUtilization(6.4);
      expect(result).toBe(80); // (6.4 / 8.0) * 100
    });

    test('handles over-capacity', () => {
      const result = calculateCapacityUtilization(9.5);
      expect(result).toBeGreaterThan(100);
    });
  });
});
```

### Component Tests (Frontend)

```typescript
// __tests__/unit/components/wizard/step1-property-info.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Step1PropertyInfo } from '@/components/wizard/step1-property-info';

describe('Property Info Step', () => {
  test('renders all form fields', () => {
    render(<Step1PropertyInfo onNext={jest.fn()} />);

    expect(screen.getByLabelText('Property Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Units')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Property Type')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const onNext = jest.fn();
    render(<Step1PropertyInfo onNext={onNext} />);

    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Property name is required')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  test('validates units range (10-2000)', async () => {
    render(<Step1PropertyInfo onNext={jest.fn()} />);

    const unitsInput = screen.getByLabelText('Units');

    fireEvent.change(unitsInput, { target: { value: '5' } });
    expect(await screen.findByText('Units must be between 10 and 2000')).toBeInTheDocument();

    fireEvent.change(unitsInput, { target: { value: '2500' } });
    expect(await screen.findByText('Units must be between 10 and 2000')).toBeInTheDocument();
  });
});
```

## Integration Testing

### API Route Tests

```typescript
// __tests__/integration/api/extract-invoices.test.ts

import { describe, test, expect, beforeAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/extract-invoices/route';

describe('POST /api/extract-invoices', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test authentication
    authToken = await getTestAuthToken();
  });

  test('returns 401 without authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  test('extracts invoice data successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      body: {
        projectId: 'test-project-id',
        fileIds: ['test-file-1']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('invoicesProcessed');
    expect(data).toHaveProperty('totalSpend');
  });

  test('handles invalid project ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      body: {
        projectId: 'invalid-id',
        fileIds: ['test-file-1']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});
```

## E2E Testing (Playwright)

### Complete Workflow Test

```typescript
// __tests__/e2e/complete-workflow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Complete WasteWise Workflow', () => {
  test('user can create project, upload files, and view results', async ({ page }) => {
    // 1. Sign up
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // 2. Navigate to dashboard
    await expect(page).toHaveURL('/dashboard');

    // 3. Start new analysis
    await page.click('text=Start New Analysis');
    await expect(page).toHaveURL('/projects/new');

    // 4. Fill Step 1: Property Info
    await page.fill('[name="propertyName"]', 'Test Property');
    await page.fill('[name="units"]', '150');
    await page.fill('[name="city"]', 'Dallas');
    await page.selectOption('[name="state"]', 'TX');
    await page.selectOption('[name="propertyType"]', 'Garden-Style');
    await page.click('text=Next: Upload Files');

    // 5. Step 2: Upload Files
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/sample-invoice.pdf');
    await expect(page.locator('text=sample-invoice.pdf')).toBeVisible();
    await page.click('text=Next: Review');

    // 6. Step 3: Review and Submit
    await expect(page.locator('text=Test Property')).toBeVisible();
    await expect(page.locator('text=150 units')).toBeVisible();
    await page.click('text=Start Analysis');

    // 7. Processing Page
    await expect(page).toHaveURL(/\/projects\/.*\/processing/);
    await expect(page.locator('text=Analyzing your waste data')).toBeVisible();

    // 8. Wait for completion (with timeout)
    await page.waitForURL(/\/projects\/.*\/results/, { timeout: 300000 }); // 5 min

    // 9. Results Page
    await expect(page.locator('text=Potential 2026 Savings')).toBeVisible();

    // 10. Download reports
    await page.click('text=Download Reports');
    const [download1] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Excel Workbook')
    ]);
    expect(download1.suggestedFilename()).toContain('.xlsx');

    const [download2] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=HTML Dashboard')
    ]);
    expect(download2.suggestedFilename()).toContain('.html');
  });
});
```

## Performance Testing

### Lighthouse Audit via Chrome DevTools MCP

```typescript
// __tests__/performance/lighthouse.test.ts

import { test, expect } from '@playwright/test';

test.describe('Performance Audits', () => {
  test('landing page achieves Lighthouse score >90', async ({ page }) => {
    await page.goto('/');

    // Run Lighthouse audit via Chrome DevTools MCP
    const audit = await page.evaluate(async () => {
      // @ts-ignore
      return await lighthouse(document.location.href, {
        output: 'json',
        onlyCategories: ['performance', 'accessibility']
      });
    });

    expect(audit.categories.performance.score).toBeGreaterThanOrEqual(0.9);
    expect(audit.categories.accessibility.score).toBeGreaterThanOrEqual(0.9);
  });

  test('dashboard loads in <2 seconds', async ({ page }) => {
    await page.goto('/dashboard');

    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perfData.loadEventEnd - perfData.fetchStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart
      };
    });

    expect(metrics.loadTime).toBeLessThan(2000);
    expect(metrics.domContentLoaded).toBeLessThan(1500);
  });
});
```

## Acceptance Criteria (Every Task)

### Evals Framework
- [ ] Framework built and running
- [ ] Test data imported from Python
- [ ] All calculations compared against Python
- [ ] Tolerance set to 0.01%
- [ ] Report generation working
- [ ] All evals passing

### Unit Tests
- [ ] 100% coverage for calculations
- [ ] All edge cases tested
- [ ] Error handling tested
- [ ] No flaky tests

### Integration Tests
- [ ] All API routes tested
- [ ] Database operations tested
- [ ] Auth flow tested
- [ ] File upload tested

### E2E Tests
- [ ] Complete workflow tested
- [ ] Mobile and desktop tested
- [ ] Error scenarios tested
- [ ] Download functionality tested

### Performance
- [ ] Lighthouse >90 on all pages
- [ ] API response time <500ms
- [ ] Database queries optimized
- [ ] Bundle size acceptable

---

**Testing Agent v1.0**
**Specialized in**: Evals framework, unit/integration/E2E testing, performance validation
**Works with**: All agents (provides testing), Orchestrator (validation gate)
