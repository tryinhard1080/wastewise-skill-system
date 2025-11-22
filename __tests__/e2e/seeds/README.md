# E2E Test Data Seeds

This directory contains test files used for E2E testing of WasteWise.

## Test Files

### Invoice Files
- `sample-invoice.csv` - Sample CSV invoice with line items
- `sample-invoice.xlsx` - Sample Excel invoice with multiple sheets
- `sample-invoice.pdf` - Minimal PDF invoice (for upload testing)

### Haul Log Files
- `sample-haullog.csv` - Sample CSV haul log with pickup dates and tonnage
- `sample-haullog.xlsx` - Sample Excel haul log with formatted data

## Usage

These files are used by E2E tests to simulate file uploads and analysis workflows.

Example:
```typescript
import { test } from '../utils/fixtures'
import path from 'path'

test('upload invoice', async ({ testProject }) => {
  const { page } = testProject
  const filePath = path.join(__dirname, '../seeds/test-files/sample-invoice.xlsx')
  await page.setInputFiles('input[type="file"]', filePath)
})
```

## Data Format

All test files follow the WasteWise data schema:

### Invoices
- Service month (YYYY-MM format)
- Line items with description, quantity, rate, amount
- Total amount

### Haul Logs
- Pickup date (YYYY-MM-DD format)
- Tons collected
- Compactor ID (optional)

## Adding New Test Files

1. Create the file following the appropriate schema
2. Place in `test-files/` directory
3. Update this README
4. Reference in E2E tests as needed

## Notes

- Files are intentionally small for fast test execution
- PDF files are minimal (text-only) to avoid large binary data in git
- All data is synthetic - no real customer information
