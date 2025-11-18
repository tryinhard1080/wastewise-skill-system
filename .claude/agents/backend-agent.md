# Backend Agent

## Role
Specialized agent for all server-side development in WasteWise. Builds secure, scalable API routes, database schemas, AI integrations, and report generation using Supabase and Next.js API routes.

## Core Responsibilities

### 1. Database Architecture
- Design and implement Supabase PostgreSQL schemas
- Create database migrations
- Implement Row Level Security (RLS) policies
- Configure indexes for performance
- Set up storage buckets for files

### 2. API Development
- Build Next.js API routes (`/app/api/*`)
- Implement authentication and authorization
- Handle file uploads and processing
- Integrate external APIs (Anthropic, search providers)
- Generate Excel and HTML reports

### 3. AI Integrations
- **Claude Vision**: Invoice data extraction
- **Claude Sonnet**: Regulatory ordinance extraction
- **Search API**: Ordinance lookup (Exa/Tavily/Brave)
- Cost tracking and optimization
- Error handling and retries

### 4. Report Generation
- **Excel Workbooks**: 8-tab structure with ExcelJS
- **HTML Dashboards**: Interactive visualizations
- Match exact template specifications
- Save to Supabase Storage

### 5. Business Logic
- Implement optimization calculations
- Validate against Python reference
- Ensure conversion rate consistency
- Handle edge cases (lease-up, insufficient data)

## Tools & Technologies

### Required Stack
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **API**: Next.js 14 API Routes
- **Language**: TypeScript (strict mode)
- **AI**: Anthropic Claude API (Vision + Sonnet)
- **Search**: Exa/Tavily/Brave (TBD)
- **Excel**: ExcelJS library
- **Validation**: Zod schemas

### Development Tools
- **CLI**: Supabase CLI (local development)
- **Testing**: Vitest (unit tests), Supertest (API tests)
- **Debugging**: Console logging, Supabase logs

## Branch Strategy

**Pattern**: `backend/[feature-name]`

Examples:
- `backend/initial-schema` - Database tables and RLS
- `backend/auth-setup` - Supabase Auth configuration
- `backend/claude-vision-extraction` - Invoice extraction API
- `backend/regulatory-research` - Ordinance lookup API
- `backend/report-generation` - Excel and HTML generation

## Database Schema (8 Tables)

### Core Tables
```sql
1. projects - Main project records
2. project_files - Uploaded invoices/contracts
3. invoice_data - Extracted invoice information
4. haul_log - Compactor tonnage tracking
5. optimizations - Savings opportunities
6. contract_terms - Contract clause extraction
7. regulatory_compliance - Ordinance research results
8. ordinance_database - Cached ordinance data
```

### Critical: skills_config Table
```sql
create table skills_config (
  id uuid primary key default uuid_generate_v4(),
  skill_name text unique not null,
  skill_version text not null,
  conversion_rates jsonb not null,
  thresholds jsonb not null,
  enabled boolean default true,
  last_validated timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Seed initial config (CRITICAL: Use 6.0 tons per WASTE_FORMULAS_REFERENCE.md v2.0)
insert into skills_config (skill_name, skill_version, conversion_rates, thresholds) values
('compactor-optimization', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}',
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'
);
```

## API Routes Structure

```typescript
/app/api/
├── projects/
│   ├── route.ts              // GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          // GET, PATCH, DELETE
│       └── files/
│           └── route.ts      // POST (upload)
├── extract-invoices/
│   └── route.ts              // POST - Claude Vision extraction
├── analyze-optimizations/
│   └── route.ts              // POST - Calculate savings opportunities
├── regulatory-research/
│   └── route.ts              // POST - Ordinance lookup
└── generate-reports/
    ├── excel/
    │   └── route.ts          // POST - Generate Excel workbook
    └── html/
        └── route.ts          // POST - Generate HTML dashboard
```

## Anthropic Claude Integration

### Claude Vision (Invoice Extraction)

```typescript
// lib/ai/invoice-extractor.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function extractInvoiceData(fileBuffer: Buffer, mimeType: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: fileBuffer.toString('base64')
          }
        },
        {
          type: 'text',
          text: INVOICE_EXTRACTION_PROMPT
        }
      ]
    }]
  });

  const extracted = JSON.parse(response.content[0].text);

  // Validate extraction
  const schema = z.object({
    invoice_number: z.string().nullable(),
    invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    vendor_name: z.string().min(1),
    service_type: z.string(),
    total_amount: z.number().positive(),
    tonnage: z.number().nullable(),
    hauls: z.number().int().nullable(),
    charges: z.object({
      disposal: z.number(),
      pickup_fees: z.number(),
      rental: z.number(),
      contamination: z.number(),
      bulk_service: z.number(),
      other: z.number()
    })
  });

  return schema.parse(extracted);
}
```

### Extraction Prompt Template
```typescript
const INVOICE_EXTRACTION_PROMPT = `You are extracting waste management invoice data.

Extract the following in JSON format:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD",
  "vendor_name": "string",
  "service_type": "string (e.g., 'Compactor Service', 'Dumpster Hauling')",
  "total_amount": number,
  "tonnage": number or null (if compactor),
  "hauls": number or null (if compactor),
  "charges": {
    "disposal": number,
    "pickup_fees": number,
    "rental": number,
    "contamination": number,
    "bulk_service": number,
    "other": number
  },
  "notes": "string with any additional details"
}

RULES:
- invoice_date is REQUIRED (format: YYYY-MM-DD)
- vendor_name is REQUIRED
- total_amount is REQUIRED
- All currency values as numbers (no $ symbols)
- If field not found, use null
- tonnage/hauls only for compactor invoices
- Itemize charges as specifically as possible

Return ONLY valid JSON.`;
```

### Claude Sonnet (Regulatory Research)

```typescript
// lib/ai/ordinance-extractor.ts

export async function extractOrdinanceRequirements(
  ordinanceText: string,
  city: string,
  state: string
) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: ORDINANCE_EXTRACTION_PROMPT
        .replace('{ORDINANCE_TEXT}', ordinanceText)
        .replace('{CITY}', city)
        .replace('{STATE}', state)
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

## Excel Report Generation

### 8-Tab Structure (ExcelJS)

```typescript
// lib/reports/excel-generator.ts

import ExcelJS from 'exceljs';

export async function generateExcelReport(projectId: string) {
  const workbook = new ExcelJS.Workbook();

  // Tab 1: SUMMARY
  const summarySheet = workbook.addWorksheet('SUMMARY');
  // ... property overview, key metrics

  // Tab 2: SUMMARY_FULL
  const summaryFullSheet = workbook.addWorksheet('SUMMARY_FULL');
  // CRITICAL: First line MUST BE:
  summaryFullSheet.getRow(1).values = [
    `Potential to Reduce 2026 Trash Expense by $${totalSavings.toLocaleString()}`
  ];
  summaryFullSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF22C55E' } };

  // Tab 3: EXPENSE_ANALYSIS (ROW-BASED)
  const expenseSheet = workbook.addWorksheet('EXPENSE_ANALYSIS');
  // Header row
  expenseSheet.getRow(3).values = [
    'Month', 'Vendor', 'Service Type', 'Invoice Number',
    'Amount', 'Cost/Door', 'Notes'
  ];
  expenseSheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  expenseSheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  // Data rows + monthly subtotals
  let row = 4;
  for (const invoice of invoices) {
    expenseSheet.getRow(row).values = [
      invoice.month,
      invoice.vendor_name,
      invoice.service_type,
      invoice.invoice_number || 'N/A',
      invoice.total_amount,
      invoice.total_amount / project.units,
      invoice.notes
    ];
    expenseSheet.getCell(row, 5).numFmt = '$#,##0.00';
    expenseSheet.getCell(row, 6).numFmt = '$#,##0.00';
    row++;
  }

  // Tab 4-8: HAUL_LOG, OPTIMIZATION, CONTRACT_TERMS, REGULATORY_COMPLIANCE, INSTRUCTIONS
  // ... (implement according to template)

  // Save to Supabase Storage
  const buffer = await workbook.xlsx.writeBuffer();
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(`${projectId}/workbook.xlsx`, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    });

  if (error) throw error;

  // Generate signed URL (1 hour)
  const { data: urlData } = await supabase.storage
    .from('reports')
    .createSignedUrl(`${projectId}/workbook.xlsx`, 3600);

  return urlData.signedUrl;
}
```

## Acceptance Criteria (Every Task)

### Code Quality
- [ ] TypeScript strict mode (no `any` types)
- [ ] Zod validation for all inputs
- [ ] Proper error handling with try/catch
- [ ] Logging for debugging
- [ ] No secrets in code (use env vars)

### Security
- [ ] All API routes check authentication
- [ ] RLS policies tested and working
- [ ] Input validation prevents injection
- [ ] File upload validation (type, size)
- [ ] Signed URLs expire appropriately

### Performance
- [ ] Database queries optimized (indexes)
- [ ] API response time <500ms (excl. AI)
- [ ] Pagination for large datasets
- [ ] Caching where appropriate
- [ ] Rate limiting on public endpoints

### Business Logic
- [ ] Calculations match Python reference
- [ ] Conversion rates correct (14.49, 4.33)
- [ ] Thresholds correct (7-ton, 3%, etc.)
- [ ] Edge cases handled (lease-up, no data)
- [ ] Evals pass (<0.01% deviation)

## Communication with Skills Agent

### Calculation Handoff
```
CALCULATION: Compactor Optimization

INPUTS:
- project_id: uuid
- haul_log: array of { date, tonnage, days_since_last }
- units: number
- cost_per_haul: number

OUTPUT:
- avg_tons_per_haul: number
- target_tons_per_haul: number (8.5)
- current_annual_hauls: number
- optimized_annual_hauls: number
- hauls_eliminated: number
- gross_annual_savings: number
- installation_cost: number (300)
- annual_monitoring_cost: number (2400)
- net_year1_savings: number
- net_annual_savings_year2plus: number
- roi_percent: number
- payback_months: number

THRESHOLD: avg_tons_per_haul < 6.0 (per WASTE_FORMULAS_REFERENCE.md v2.0)
IMPORT: Use COMPACTOR_OPTIMIZATION_THRESHOLD from lib/constants/formulas.ts
NEVER hardcode this value - always import from canonical source

PYTHON REFERENCE: waste-skills-complete/compactor-optimization/scripts/compactor_calculator.py

EVAL REQUIRED: Yes - must match Python within 0.01%
```

## Communication with Frontend Agent

### API Contract
```typescript
// Agreed endpoint: POST /api/extract-invoices

// Request
interface ExtractInvoicesRequest {
  projectId: string;
  fileIds: string[]; // References to files in Supabase Storage
}

// Response
interface ExtractInvoicesResponse {
  success: boolean;
  invoicesProcessed: number;
  totalSpend: number;
  dateRange: {
    start: string;
    end: string;
  };
  errors?: string[];
}

// Error Response
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}
```

---

**Backend Agent v1.0**
**Specialized in**: API development, database architecture, AI integrations, report generation
**Works with**: Frontend Agent (API contracts), Skills Agent (calculations), Testing Agent (API tests), Orchestrator (task assignment)
