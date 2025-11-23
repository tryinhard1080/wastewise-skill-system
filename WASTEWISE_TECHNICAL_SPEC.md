# WasteWise Technical Specification

## Complete System Architecture & Implementation Details

---

## 📖 Document Overview

**Purpose**: Technical reference for WasteWise Complete Suite web application  
**Audience**: Developers, technical stakeholders, integrators  
**Version**: 1.0  
**Last Updated**: November 13, 2025

---

## 🎯 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Tailwind CSS                           │
│  - Pages: Landing, Auth, Dashboard, Projects, Results           │
│  - Components: shadcn/ui library                                 │
│  - State: React Query + Zustand                                  │
│  - Routing: React Router / Next.js                               │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS/WebSocket
┌────────────────┴────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Edge Functions (Deno)                                 │
│  - extract-invoice-data                                          │
│  - conduct-regulatory-research                                   │
│  - analyze-optimizations                                         │
│  - generate-excel-report                                         │
│  - generate-html-dashboard                                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL + Storage                                  │
│  - Tables: projects, invoice_data, optimizations, etc.          │
│  - Storage: File uploads, generated reports                     │
│  - Auth: User authentication and authorization                  │
│  - Realtime: WebSocket updates                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  - OpenAI GPT-4o: Invoice data extraction                       │
│  - Anthropic Claude: Regulatory research                        │
│  - Brave Search: Web ordinance lookup                           │
│  - SendGrid: Email notifications (optional)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### Complete Table Definitions

#### `projects` Table

```sql
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  property_name text not null,
  units integer not null check (units between 10 and 2000),
  city text not null,
  state text not null,
  property_type text check (property_type in ('Garden-Style', 'Mid-Rise', 'High-Rise')),
  status text default 'draft' check (status in ('draft', 'processing', 'completed', 'failed', 'cancelled')),
  progress integer default 0 check (progress between 0 and 100),
  total_savings numeric(10,2) default 0,
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_projects_user_id on projects(user_id);
create index idx_projects_status on projects(status);
create index idx_projects_created_at on projects(created_at desc);
```

**Key Fields**:

- `status`: Workflow state machine
- `progress`: Real-time processing indicator (0-100)
- `total_savings`: Calculated sum of all optimization opportunities

---

#### `project_files` Table

```sql
create table project_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  file_name text not null,
  file_type text not null check (file_type in ('invoice', 'contract', 'csv', 'other')),
  file_size integer,
  mime_type text,
  storage_path text not null,
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  uploaded_at timestamp with time zone default now()
);

create index idx_project_files_project_id on project_files(project_id);
create index idx_project_files_type on project_files(file_type);
```

**Storage Path Format**: `{user_id}/{project_id}/{timestamp}_{filename}`

---

#### `invoice_data` Table

```sql
create table invoice_data (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  source_file_id uuid references project_files on delete set null,
  invoice_number text,
  invoice_date date not null,
  vendor_name text not null,
  service_type text,
  total_amount numeric(10,2) not null,
  tonnage numeric(10,3),
  hauls integer,
  charges jsonb,
  -- JSON structure:
  -- {
  --   "disposal": 850.00,
  --   "pickup_fees": 200.00,
  --   "rental": 150.00,
  --   "contamination": 50.00,
  --   "bulk_service": 100.00,
  --   "other": 38.51
  -- }
  notes text,
  created_at timestamp with time zone default now()
);

create index idx_invoice_data_project_id on invoice_data(project_id);
create index idx_invoice_data_date on invoice_data(invoice_date);
create index idx_invoice_data_vendor on invoice_data(vendor_name);
```

**Derived Fields** (calculated on query):

- `month`: `to_char(invoice_date, 'Mon YYYY')`
- `cost_per_door`: `total_amount / projects.units`

---

#### `haul_log` Table

```sql
create table haul_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  invoice_id uuid references invoice_data on delete set null,
  haul_date date not null,
  tonnage numeric(10,3) not null check (tonnage > 0),
  days_since_last integer,
  status text check (status in ('normal', 'low_utilization', 'high_utilization')),
  created_at timestamp with time zone default now()
);

create index idx_haul_log_project_id on haul_log(project_id);
create index idx_haul_log_date on haul_log(haul_date);
```

**Business Logic**:

- `days_since_last`: Calculated from previous haul date
- `status`:
  - `low_utilization` if tonnage < 7.0
  - `high_utilization` if tonnage > 9.0
  - `normal` otherwise

---

#### `contract_terms` Table

```sql
create table contract_terms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  source_file_id uuid references project_files on delete set null,
  contract_start_date date,
  contract_end_date date,
  term_length_years numeric(5,2),
  clauses jsonb not null,
  -- JSON structure:
  -- {
  --   "Term & Renewal": [
  --     {
  --       "text": "Contract auto-renews annually...",
  --       "risk_severity": "MEDIUM",
  --       "impact": "May lock into unfavorable terms",
  --       "action_required": "Set 90-day termination reminder"
  --     }
  --   ],
  --   "Rate Increases": [...],
  --   "Termination": [...]
  -- }
  calendar_reminders jsonb,
  created_at timestamp with time zone default now()
);

create index idx_contract_terms_project_id on contract_terms(project_id);
```

**Clause Categories**:

1. Term & Renewal
2. Rate Increases
3. Termination
4. Liability
5. Service Level
6. Force Majeure
7. Indemnification

---

#### `regulatory_data` Table

```sql
create table regulatory_data (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  ordinance_overview text,
  waste_requirements jsonb,
  recycling_requirements jsonb not null,
  -- JSON structure:
  -- {
  --   "mandatory": true,
  --   "property_threshold_units": 5,
  --   "capacity_requirement": "50% of waste capacity",
  --   "service_frequency": "Weekly minimum",
  --   "co_location_required": true
  -- }
  composting_requirements jsonb not null,
  penalties jsonb,
  licensed_haulers jsonb,
  -- Array of: [{"name": "Waste Management", "phone": "...", "website": "..."}]
  regulatory_contacts jsonb,
  sources_consulted jsonb not null,
  confidence_score text not null check (confidence_score in ('HIGH', 'MEDIUM', 'LOW')),
  research_date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index idx_regulatory_data_project_id on regulatory_data(project_id);
create index idx_regulatory_confidence on regulatory_data(confidence_score);
```

**Confidence Scoring Logic**:

- HIGH: 2+ official .gov sources, specific requirements, penalties documented
- MEDIUM: 1 official source, some details missing
- LOW: No official sources or insufficient data

---

#### `optimization_results` Table

```sql
create table optimization_results (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  recommendation_type text not null check (recommendation_type in
    ('compactor_monitor', 'contamination_reduction', 'bulk_subscription', 'service_frequency', 'vendor_consolidation')),
  recommended boolean not null,
  priority integer check (priority between 1 and 5),
  title text not null,
  description text not null,
  annual_savings numeric(10,2),
  roi_percent numeric(6,2),
  payback_months numeric(5,2),
  calculation_details jsonb not null,
  -- JSON structure varies by type, example for compactor:
  -- {
  --   "current_avg_tons_per_haul": 5.2,
  --   "target_tons_per_haul": 8.5,
  --   "capacity_utilization_current": 58,
  --   "current_annual_hauls": 216,
  --   "optimized_annual_hauls": 132,
  --   "hauls_eliminated": 84,
  --   "cost_per_haul": 165,
  --   "gross_annual_savings": 13860,
  --   "installation_cost": 300,
  --   "annual_monitoring_cost": 2400,
  --   "net_year1_savings": 11160
  -- }
  contact_info jsonb,
  implementation_timeline text,
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamp with time zone default now()
);

create index idx_optimization_project_id on optimization_results(project_id);
create index idx_optimization_recommended on optimization_results(recommended);
create index idx_optimization_priority on optimization_results(priority);
```

---

#### `reports` Table

```sql
create table reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  report_type text not null check (report_type in ('excel', 'html', 'pdf')),
  file_name text not null,
  storage_path text not null,
  file_size integer,
  generated_at timestamp with time zone default now()
);

create index idx_reports_project_id on reports(project_id);
create index idx_reports_type on reports(report_type);
```

---

#### `activity_log` Table

```sql
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  activity_type text not null,
  message text not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

create index idx_activity_project_id on activity_log(project_id);
create index idx_activity_created_at on activity_log(created_at desc);
```

**Activity Types**:

- `project_created`
- `files_uploaded`
- `processing_started`
- `data_extracted`
- `regulatory_researched`
- `analysis_completed`
- `report_generated`
- `error_occurred`

---

### Row Level Security (RLS) Policies

**Pattern for All Tables**:

```sql
-- Users can only access data from their own projects
create policy "Users access own project data"
  on {table_name} for all
  using (
    exists (
      select 1 from projects
      where projects.id = {table_name}.project_id
      and projects.user_id = auth.uid()
    )
  );
```

**Storage Policies**:

```sql
-- Users can only access files in their own folders
create policy "Users access own files"
  on storage.objects for select
  using (
    bucket_id = 'project-files' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users upload to own folders"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 🔧 API Specifications

### Supabase Edge Functions

#### Function: `extract-invoice-data`

**Purpose**: Extract structured data from uploaded invoice files

**Input**:

```typescript
interface ExtractInvoiceRequest {
  projectId: string;
  fileUrls: string[];
}
```

**Process**:

1. Download files from Supabase Storage
2. Extract text (PDF.js for PDFs, XLSX for Excel)
3. Send to OpenAI GPT-4o with extraction prompt
4. Parse JSON response
5. Validate data
6. Insert into `invoice_data` table
7. Update project progress

**Output**:

```typescript
interface ExtractInvoiceResponse {
  success: boolean;
  invoiceCount: number;
  errors?: Array<{
    fileName: string;
    error: string;
  }>;
}
```

**OpenAI Prompt Template**:

```
Extract the following fields from this invoice:
- invoice_number
- invoice_date (ISO format)
- vendor_name
- service_type
- total_amount (numeric)
- tonnage (if compactor, numeric)
- charges_breakdown (object with: disposal, pickup_fees, rental, contamination, bulk_service, other)

Return ONLY valid JSON. Example:
{
  "invoice_number": "5998169-1571-5",
  "invoice_date": "2024-10-15",
  "vendor_name": "Waste Management",
  "service_type": "Compactor Hauling",
  "total_amount": 1388.51,
  "tonnage": 4.2,
  "charges_breakdown": {
    "disposal": 850.00,
    "pickup_fees": 200.00,
    "rental": 150.00,
    "contamination": 50.00,
    "bulk_service": 0.00,
    "other": 138.51
  }
}

Invoice text:
{pdf_text}
```

---

#### Function: `conduct-regulatory-research`

**Purpose**: Research local waste ordinances

**Input**:

```typescript
interface RegulatorResearchRequest {
  projectId: string;
  city: string;
  state: string;
}
```

**Process**:

1. Search Brave: `"{city}" "{state}" waste recycling ordinance multifamily`
2. Filter for .gov sources
3. Fetch top 3 sources with web_fetch
4. Send to Claude with extraction prompt
5. Parse structured response
6. Assign confidence score
7. Store in `regulatory_data` table

**Claude Prompt Template**:

```
From these search results, extract the following information about waste management ordinances in {city}, {state}:

RECYCLING REQUIREMENTS:
- Is recycling mandatory? (boolean)
- Property threshold (e.g., "5+ units")
- Capacity requirement (e.g., "50% of waste capacity")
- Service frequency (e.g., "Weekly minimum")
- Container specifications
- Co-location required? (boolean)

COMPOSTING/ORGANICS:
- Is composting mandatory? (boolean)
- Effective date (if applicable)
- Property threshold
- Accepted materials (array)
- Service frequency

PENALTIES:
- Classification (e.g., "Municipal violation")
- Enforcement agency
- Contact information
- Fine structure

LICENSED HAULERS:
- Find 3-5 licensed haulers with name, phone, website

Return structured JSON:
{
  "recycling_requirements": {...},
  "composting_requirements": {...},
  "penalties": {...},
  "licensed_haulers": [{...}],
  "sources": ["url1", "url2"]
}

Search results:
{search_results}
```

**Output**:

```typescript
interface RegulatoryResearchResponse {
  success: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  haulerCount: number;
}
```

---

#### Function: `analyze-optimizations`

**Purpose**: Calculate optimization opportunities

**Input**:

```typescript
interface AnalyzeOptimizationsRequest {
  projectId: string;
}
```

**Process**:

1. Fetch invoice_data and haul_log
2. Calculate yards per door
3. Run compactor optimization algorithm
4. Run contamination analysis
5. Run bulk subscription analysis
6. Store results in `optimization_results`
7. Update `projects.total_savings`

**Compactor Optimization Algorithm**:

```typescript
function analyzeCompactorOptimization(
  haulLog: HaulRecord[],
  propertyUnits: number,
  costPerHaul: number,
): OptimizationResult {
  // Calculate average tons per haul
  const totalTons = haulLog.reduce((sum, h) => sum + h.tonnage, 0);
  const avgTonsPerHaul = totalTons / haulLog.length;

  // Check threshold (CRITICAL: < 7 tons/haul)
  if (avgTonsPerHaul >= 7.0) {
    return { recommended: false, reason: "Above threshold" };
  }

  // Check max interval constraint (≤ 14 days)
  const maxInterval = Math.max(...haulLog.map((h) => h.days_since_last || 0));
  if (maxInterval > 14) {
    return { recommended: false, reason: "Interval too long" };
  }

  // Calculate savings
  const targetTonsPerHaul = 8.5;
  const monthsAnalyzed = new Set(
    haulLog.map((h) => h.haul_date.toISOString().substring(0, 7)),
  ).size;

  const currentHaulsPerMonth = haulLog.length / monthsAnalyzed;
  const currentAnnualHauls = currentHaulsPerMonth * 12;
  const currentAnnualCost = currentAnnualHauls * costPerHaul;

  const optimizedHaulsPerMonth = totalTons / monthsAnalyzed / targetTonsPerHaul;
  const optimizedAnnualHauls = optimizedHaulsPerMonth * 12;
  const optimizedAnnualCost = optimizedAnnualHauls * costPerHaul;

  const installationCost = 300;
  const annualMonitoringCost = 2400; // $200/month

  const grossSavings = currentAnnualCost - optimizedAnnualCost;
  const netYear1Savings =
    grossSavings - installationCost - annualMonitoringCost;
  const roiPercent =
    (netYear1Savings / (installationCost + annualMonitoringCost)) * 100;
  const paybackMonths =
    (installationCost + annualMonitoringCost) / (grossSavings / 12);

  return {
    recommended: true,
    priority: 1,
    title: "Install Compactor Monitors",
    description: `Current average of ${avgTonsPerHaul.toFixed(2)} tons/haul indicates early pickups.`,
    annual_savings: netYear1Savings,
    roi_percent: roiPercent,
    payback_months: paybackMonths,
    calculation_details: {
      current_avg_tons_per_haul: avgTonsPerHaul,
      target_tons_per_haul: targetTonsPerHaul,
      capacity_utilization_current: (avgTonsPerHaul / targetTonsPerHaul) * 100,
      current_annual_hauls: currentAnnualHauls,
      optimized_annual_hauls: optimizedAnnualHauls,
      hauls_eliminated: currentAnnualHauls - optimizedAnnualHauls,
      cost_per_haul: costPerHaul,
      gross_annual_savings: grossSavings,
      installation_cost: installationCost,
      annual_monitoring_cost: annualMonitoringCost,
      net_year1_savings: netYear1Savings,
    },
    contact_info: {
      name: "Keith Conrad",
      company: "DSQ Technologies",
      email: "keith.conrad@dsqtech.com",
    },
    implementation_timeline: "2-4 weeks",
    confidence: "HIGH",
  };
}
```

**Output**:

```typescript
interface AnalyzeOptimizationsResponse {
  success: boolean;
  optimizationCount: number;
  totalSavings: number;
}
```

---

#### Function: `generate-excel-report`

**Purpose**: Create downloadable Excel workbook

**Input**:

```typescript
interface GenerateExcelRequest {
  projectId: string;
}
```

**Process**:

1. Fetch all project data
2. Create ExcelJS workbook
3. Generate 9 tabs:
   - SUMMARY_FULL
   - EXPENSE_ANALYSIS
   - HAUL_LOG (if compactor)
   - OPTIMIZATION
   - CONTRACT_TERMS (if contract)
   - REGULATORY_COMPLIANCE
   - LEASE_UP_NOTES (if applicable)
   - DOCUMENTATION_NOTES
   - QUALITY_CHECK
4. Apply formatting
5. Generate buffer
6. Upload to Supabase Storage
7. Create `reports` record

**Excel Workbook Structure**:

**Tab 1: SUMMARY_FULL**

- Row 1: "Potential to Reduce 2026 Trash Expense by $XX,XXX" (bold, green, size 14)
- Property Overview section
- Cost Metrics section
- Top 3 Optimization Opportunities
- Regulatory Compliance Status

**Tab 2: EXPENSE_ANALYSIS**

- Title row (dark blue background)
- Headers: Month | Vendor | Service Type | Invoice # | Amount | Cost/Door | Notes
- Data rows (one per invoice)
- Monthly subtotal rows (light gray background)
- Grand total row (medium gray background)

**Tab 3: HAUL_LOG** (conditional)

- Only created if compactor service detected
- Headers: Date | Tonnage | Days Since Last | Status
- Color-coded rows (red for low utilization, green for good)

**Tab 4: OPTIMIZATION**

- Each recommendation as a section
- Calculation breakdown tables
- Contact information
- Implementation details

**Tab 5: CONTRACT_TERMS** (conditional)

- Only if contract file provided
- 7 clause categories
- Risk severity indicators
- Calendar reminders

**Tab 6: REGULATORY_COMPLIANCE**

- Ordinance overview
- Mandatory requirements table
- Compliance checklist
- Licensed haulers table
- Penalties section
- Sources consulted

**Tab 7: LEASE-UP_NOTES** (conditional)

- Only if yards/door >40% below benchmark
- Status indicators
- Assessment
- Monitoring recommendations

**Tab 8: DOCUMENTATION_NOTES**

- Vendor contacts
- Formulas used
- Contract information
- Reference data

**Tab 9: QUALITY_CHECK**

- Validation summary
- Checks performed
- Errors/warnings (if any)

**Output**:

```typescript
interface GenerateExcelResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}
```

---

#### Function: `generate-html-dashboard`

**Purpose**: Create standalone HTML dashboard

**Input**: Same as `generate-excel-report`

**Process**:

1. Fetch all project data
2. Generate HTML with embedded data
3. Include Chart.js for visualizations
4. Include Tailwind CSS CDN
5. Add interactive JavaScript
6. Upload to storage
7. Create `reports` record

**HTML Structure**:

- 6 tabs (Dashboard, Expense, Haul Log, Optimization, Contract, Regulatory)
- Embedded Chart.js visualizations
- Interactive filters
- Print-friendly CSS
- Mobile responsive

**Output**: Same as Excel

---

## 🔐 Security Considerations

### Authentication

**Method**: Supabase Auth with email/password and OAuth (Google)

**Session Management**:

- JWT tokens stored in httpOnly cookies
- Refresh token rotation
- Session timeout: 24 hours
- Auto-refresh on activity

**Password Requirements**:

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

### Authorization

**Row Level Security (RLS)**:

- All tables have RLS enabled
- Users can only access their own projects
- Service role key used for Edge Functions (bypasses RLS)

**API Rate Limiting**:

- 100 requests/minute per user
- 10 file uploads/hour per user
- 5 analysis requests/hour per user

---

### Data Security

**File Upload Validation**:

- File type whitelist: PDF, XLSX, XLS, CSV
- Max file size: 10MB
- Virus scanning (ClamAV integration)
- Sanitize file names

**Input Sanitization**:

- SQL injection prevention (Supabase handles)
- XSS prevention (React escapes by default)
- CSRF tokens for state-changing operations

**Data Encryption**:

- At rest: PostgreSQL encryption
- In transit: TLS 1.3
- Backups: AES-256 encryption

---

## 📊 Performance Optimization

### Frontend

**Code Splitting**:

```typescript
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectView = lazy(() => import("./pages/ProjectView"));
```

**Image Optimization**:

- WebP format with JPEG fallback
- Lazy loading
- Responsive images with srcset

**Bundle Size**:

- Target: < 500KB initial load
- Tree shaking enabled
- Dynamic imports for heavy libraries

---

### Backend

**Database Optimization**:

- Indexes on frequently queried columns
- Connection pooling (PgBouncer)
- Read replicas for reports

**Caching Strategy**:

- Redis for session data
- CDN for static assets
- Browser caching headers

**Query Optimization**:

```sql
-- Example: Optimized project list query
SELECT
  p.id, p.property_name, p.units, p.city, p.state,
  p.status, p.created_at,
  COUNT(pf.id) as file_count,
  SUM(or.annual_savings) as total_savings
FROM projects p
LEFT JOIN project_files pf ON pf.project_id = p.id
LEFT JOIN optimization_results or ON or.project_id = p.id AND or.recommended = true
WHERE p.user_id = auth.uid()
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 20;
```

---

## 🧪 Testing Strategy

### Unit Tests

**Framework**: Vitest + React Testing Library

**Coverage Targets**:

- Components: 80%
- Utils: 90%
- Edge Functions: 85%

**Example Test**:

```typescript
describe("CompactorOptimization", () => {
  it("recommends monitors when avg < 7 tons/haul", () => {
    const haulLog = [
      { tonnage: 5.2, days_since_last: 7 },
      { tonnage: 6.1, days_since_last: 6 },
      { tonnage: 5.8, days_since_last: 7 },
    ];

    const result = analyzeCompactorOptimization(haulLog, 248, 165);

    expect(result.recommended).toBe(true);
    expect(result.priority).toBe(1);
    expect(result.annual_savings).toBeGreaterThan(10000);
  });
});
```

---

### Integration Tests

**Framework**: Playwright

**Test Scenarios**:

1. User sign up → create project → upload files → view results
2. File upload error handling
3. Real-time progress updates
4. Report generation and download

---

### End-to-End Tests

**Framework**: Playwright + Real Database

**Critical Paths**:

- Complete analysis workflow
- Multi-file upload
- Report generation
- Payment flow (if applicable)

---

## 📈 Monitoring & Observability

### Application Monitoring

**Tool**: Sentry

**Tracked Metrics**:

- Error rate
- Response time
- Database query performance
- API latency

**Alerts**:

- Error rate > 1%
- Response time > 3s
- Database connections > 80%

---

### Analytics

**Tool**: PostHog or Mixpanel

**Key Events**:

- User signup
- Project created
- Files uploaded
- Analysis completed
- Report downloaded
- Optimization viewed

**Funnels**:

1. Landing → Signup → Project Creation → Analysis Complete
2. Analysis Complete → View Results → Download Report

---

### Logging

**Structure**:

```json
{
  "timestamp": "2025-11-13T10:30:00Z",
  "level": "info",
  "service": "extract-invoice-data",
  "project_id": "uuid",
  "user_id": "uuid",
  "message": "Invoice extraction completed",
  "metadata": {
    "file_count": 8,
    "duration_ms": 12340
  }
}
```

**Log Levels**:

- ERROR: System failures, exceptions
- WARN: Degraded performance, validation issues
- INFO: Business events, completions
- DEBUG: Detailed processing steps (dev only)

---

## 🚀 Deployment

### Infrastructure

**Hosting**: Lovable (Netlify/Vercel backend)

**CDN**: Cloudflare

**Database**: Supabase (hosted PostgreSQL)

**Storage**: Supabase Storage (S3-compatible)

---

### CI/CD Pipeline

**Tool**: GitHub Actions

**Pipeline**:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Lovable
        run: |
          lovable deploy --project wastewise
```

---

### Environment Configuration

**Environments**:

1. Development (dev.wastewise.com)
2. Staging (staging.wastewise.com)
3. Production (wastewise.com)

**Environment Variables**:

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Brave Search
BRAVE_API_KEY=BSA...

# Sentry
SENTRY_DSN=https://...

# Environment
NODE_ENV=production
```

---

## 📝 API Documentation

### REST Endpoints

**Base URL**: `https://wastewise.com/api`

**Authentication**: Bearer token in Authorization header

#### `POST /projects`

Create new project

**Request**:

```json
{
  "property_name": "Orion McKinney",
  "units": 248,
  "city": "McKinney",
  "state": "TX",
  "property_type": "Garden-Style"
}
```

**Response**:

```json
{
  "id": "uuid",
  "status": "draft",
  "created_at": "2025-11-13T10:30:00Z"
}
```

---

#### `POST /projects/:id/files`

Upload files to project

**Request**: multipart/form-data with file attachments

**Response**:

```json
{
  "uploaded": 8,
  "files": [
    {
      "id": "uuid",
      "file_name": "invoice_oct.pdf",
      "file_size": 245678
    }
  ]
}
```

---

#### `POST /projects/:id/analyze`

Start analysis

**Response**:

```json
{
  "status": "processing",
  "progress": 0
}
```

---

#### `GET /projects/:id`

Get project details

**Response**:

```json
{
  "id": "uuid",
  "property_name": "Orion McKinney",
  "units": 248,
  "status": "completed",
  "progress": 100,
  "total_savings": 15234.0,
  "created_at": "2025-11-13T10:30:00Z"
}
```

---

#### `GET /projects/:id/results`

Get analysis results

**Response**:

```json
{
  "summary": {
    "avg_monthly_cost": 3247.99,
    "cost_per_door": 13.09,
    "total_savings": 15234.00
  },
  "optimizations": [...],
  "regulatory": {...},
  "invoices": [...]
}
```

---

#### `GET /projects/:id/reports/:type`

Download report (type: excel, html, pdf)

**Response**: File download

---

## 🎓 Learning Resources

### For Developers

**React + TypeScript**:

- https://react.dev
- https://www.typescriptlang.org/docs

**Supabase**:

- https://supabase.com/docs
- https://supabase.com/docs/guides/functions

**Tailwind CSS**:

- https://tailwindcss.com/docs

**shadcn/ui**:

- https://ui.shadcn.com

**Chart.js**:

- https://www.chartjs.org/docs

---

### For Non-Technical Users

**User Guide** (to be created):

- How to create a project
- Uploading invoices
- Understanding results
- Downloading reports

**Video Tutorials** (planned):

- 5-minute quick start
- Deep dive on optimization recommendations
- Understanding regulatory compliance

---

## 📞 Support

### Technical Support

**Email**: support@wastewise.com

**Response Time**:

- Critical: 2 hours
- High: 8 hours
- Normal: 24 hours

### Bug Reporting

**GitHub Issues**: github.com/wastewise/app

**Template**:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots
- Browser/device info

---

## 🔄 Version History

**v1.0.0** (Launch) - November 2025

- Initial release
- Core analysis features
- Excel + HTML reports
- Regulatory research

**Planned v1.1.0** - Q1 2026

- PDF summary reports
- Email delivery
- Batch analysis
- API access

**Planned v2.0.0** - Q2 2026

- Mobile app
- Advanced analytics
- Predictive modeling
- Vendor marketplace

---

_Technical Specification v1.0_  
_Last Updated: November 13, 2025_  
_Maintained by: WasteWise Engineering Team_
