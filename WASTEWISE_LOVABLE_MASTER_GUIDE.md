# WasteWise Complete Suite - Lovable Build Guide

## Consolidated Master Document for Development

**Version**: 2.0  
**Last Updated**: November 14, 2025  
**For**: Lovable.dev & Claude Code  
**Author**: Richard Bates - THE Trash Hub

---

## 🎯 CRITICAL: What Makes WasteWise Unique

This is NOT just another SaaS template. WasteWise has **specific business logic** that MUST be implemented:

### Non-Negotiable Business Rules

1. **Compactor Optimization Threshold**: <7 tons/haul (NOT <5 or <6)
2. **Contamination Threshold**: >3% of total spend
3. **Bulk Subscription Threshold**: >$500/month average
4. **Lease-up Detection**: >40% below benchmark = NO optimization recommendations
5. **Regulatory Research**: 2 searches max, 1-2 fetches only
6. **Branding**: "WasteWise by THE Trash Hub" (NEVER "Advantage Waste")

### Critical Calculations

```python
# Yards Per Door - Compactor
yards_per_door = (total_tons * 14.49) / units

# Yards Per Door - Dumpster
yards_per_door = (qty * size * frequency * 4.33) / units

# Cost Per Door
cost_per_door = monthly_total / units

# Capacity Utilization (Compactor)
utilization = (avg_tons_per_haul / 8.0) * 100
```

### Benchmarks by Property Type

| Property Type | Yards/Door | Cost/Door |
| ------------- | ---------- | --------- |
| Garden-Style  | 2.0-2.5    | $15-25    |
| Mid-Rise      | 1.8-2.3    | $12-22    |
| High-Rise     | 1.5-2.0    | $10-20    |

---

## 📋 DOCUMENTATION REVIEW & ISSUES FOUND

### ✅ What's Good

1. **Executive Summary**: Clear, well-structured overview
2. **Technical Spec**: Solid database schema and architecture
3. **Quick Start**: Practical 8-hour build guide
4. **Prompts Library**: Useful copy-paste prompts

### ❌ Issues Identified

#### 1. **Duplication** (High Priority)

- **Two rebuild plans**: LOVABLE_REBUILD_PLAN.md (2,897 lines) + WASTEWISE_LOVABLE_REBUILD_PLAN.md (1,388 lines)
- **Two prompts libraries**: WASTEWISE_LOVABLE_PROMPTS.md (1,613 lines) + WASTEWISE_PROMPTS_LIBRARY.md (1,233 lines)
- **Three quick references**: Confusing overlap

**Fix**: This consolidated document replaces all of them

#### 2. **Missing WasteWise Business Logic** (Critical)

The existing documents focus on UI/UX but don't capture:

- Specific optimization thresholds (7-ton rule)
- Validation framework (40+ checks)
- Regulatory research protocols
- Benchmarking rules
- Lease-up detection logic
- Contract extraction requirements
- Excel workbook formatting standards

**Fix**: Integrated below in Phase 3

#### 3. **Generic Component Architecture** (Medium Priority)

COMPONENT_ARCHITECTURE.md is a generic SaaS landing page template, not tailored to WasteWise

**Fix**: Updated landing page specs below

#### 4. **No Integration with Skill Files** (Critical)

The documents don't reference the comprehensive SKILL\_\_2_UPDATED.md (3,064 lines) that contains ALL the actual business logic

**Fix**: Extracted and integrated throughout this document

#### 5. **Token Management Not Integrated** (Medium Priority)

SKILL_MD_TOKEN_UPDATES.md improvements not reflected in build plan

**Fix**: Added to Phase 3

---

## 🏗️ BUILD ARCHITECTURE

### Technology Stack (Final)

**Frontend**:

- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Chart.js for visualizations
- React Query for data fetching
- Zustand for state management

**Backend**:

- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Row Level Security (RLS) enabled
- Real-time subscriptions

**AI/External Services**:

- OpenAI GPT-4o: Invoice data extraction
- Anthropic Claude Sonnet 4.5: Regulatory research
- Brave Search API: Web ordinance lookup

**File Generation**:

- ExcelJS: Excel workbook generation
- Custom HTML: Interactive dashboards

**Infrastructure**:

- Lovable.dev: Development & deployment
- GitHub: Version control
- Sentry: Error tracking (optional)

---

## 📊 DATABASE SCHEMA (Complete)

### Core Tables

```sql
-- ===========================
-- PROJECTS TABLE
-- ===========================
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
  equipment_type text check (equipment_type in ('COMPACTOR', 'DUMPSTER', 'MIXED')),
  analysis_period_months integer,
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_projects_user_id on projects(user_id);
create index idx_projects_status on projects(status);
create index idx_projects_created_at on projects(created_at desc);

-- ===========================
-- PROJECT FILES TABLE
-- ===========================
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

-- ===========================
-- INVOICE DATA TABLE
-- ===========================
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
  charges jsonb default '{}'::jsonb,
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

-- ===========================
-- HAUL LOG TABLE (Compactors Only)
-- ===========================
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

-- ===========================
-- OPTIMIZATION OPPORTUNITIES TABLE
-- ===========================
create table optimizations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  opportunity_type text not null check (opportunity_type in ('compactor_monitors', 'contamination_reduction', 'bulk_subscription', 'other')),
  recommend boolean not null default false,
  priority integer check (priority between 1 and 5),
  title text not null,
  description text,
  calculation_breakdown jsonb not null default '{}'::jsonb,
  -- JSON structure:
  -- {
  --   "current_avg_tons_per_haul": 5.2,
  --   "target_tons_per_haul": 8.5,
  --   "capacity_utilization_current": 61.2,
  --   "current_annual_hauls": 156,
  --   "optimized_annual_hauls": 95,
  --   "hauls_eliminated": 61,
  --   "cost_per_haul": 850.00,
  --   "gross_annual_savings": 51850.00,
  --   "installation_cost": 300.00,
  --   "annual_monitoring_cost": 2400.00,
  --   "net_year1_savings": 49150.00,
  --   "net_annual_savings_year2plus": 49450.00,
  --   "roi_percent": 1819.44,
  --   "payback_months": 0.7
  -- }
  contact_info jsonb,
  implementation_timeline text,
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamp with time zone default now()
);

create index idx_optimizations_project_id on optimizations(project_id);
create index idx_optimizations_type on optimizations(opportunity_type);

-- ===========================
-- CONTRACT TERMS TABLE
-- ===========================
create table contract_terms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  source_file_id uuid references project_files on delete set null,
  contract_start_date date,
  contract_end_date date,
  term_length_years numeric(5,2),
  clauses jsonb not null default '{}'::jsonb,
  -- JSON structure:
  -- {
  --   "Term & Renewal": [...],
  --   "Rate Increases": [...],
  --   "Termination": [...],
  --   "Liability": [...],
  --   "Service Level": [...],
  --   "Force Majeure": [...],
  --   "Indemnification": [...]
  -- }
  calendar_reminders jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create index idx_contract_terms_project_id on contract_terms(project_id);

-- ===========================
-- REGULATORY COMPLIANCE TABLE
-- ===========================
create table regulatory_compliance (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  city text not null,
  state text not null,
  confidence_score text check (confidence_score in ('HIGH', 'MEDIUM', 'LOW')),
  sources_consulted jsonb default '[]'::jsonb,
  waste_requirements jsonb default '{}'::jsonb,
  recycling_requirements jsonb default '{}'::jsonb,
  composting_requirements jsonb default '{}'::jsonb,
  penalties jsonb default '{}'::jsonb,
  licensed_haulers jsonb default '[]'::jsonb,
  regulatory_contacts jsonb default '{}'::jsonb,
  cached_data boolean default false,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index idx_regulatory_city_state on regulatory_compliance(city, state);
create index idx_regulatory_project_id on regulatory_compliance(project_id);

-- ===========================
-- ORDINANCE DATABASE (Cache)
-- ===========================
create table ordinance_database (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  state text not null,
  location_key text unique not null, -- city_state format
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  primary_source text,
  recycling_mandatory boolean default false,
  threshold_units integer,
  capacity_requirement text,
  service_frequency text,
  composting_required boolean default false,
  composting_effective_date date,
  composting_threshold_units integer,
  accepted_materials jsonb default '[]'::jsonb,
  penalties jsonb default '{}'::jsonb,
  licensed_haulers jsonb default '[]'::jsonb,
  contacts jsonb default '{}'::jsonb,
  last_verified timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index idx_ordinance_location_key on ordinance_database(location_key);

-- ===========================
-- ROW LEVEL SECURITY POLICIES
-- ===========================

-- Projects
alter table projects enable row level security;

create policy "Users view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Project Files
alter table project_files enable row level security;

create policy "Users view own project files"
  on project_files for select
  using (exists (
    select 1 from projects
    where projects.id = project_files.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own project files"
  on project_files for insert
  with check (exists (
    select 1 from projects
    where projects.id = project_files.project_id
    and projects.user_id = auth.uid()
  ));

-- Apply similar RLS to all user-specific tables
-- (invoice_data, haul_log, optimizations, contract_terms, regulatory_compliance)
```

---

## 🚀 PHASE-BY-PHASE BUILD PLAN

### Phase 1: Foundation (Week 1) - 8 hours

**Goal**: Working landing page + auth + empty dashboard

#### Hour 1-2: Landing Page

**Prompt 1A**: Landing Page Hero

```
Create a modern SaaS landing page for "WasteWise by THE Trash Hub" - waste management analysis for multifamily properties.

DESIGN SYSTEM:
- Background: #F7F5F3 (cream/beige)
- Text: #37322F (dark brown)
- Primary: #22C55E (green - savings/success)
- Secondary: #EF4444 (red - warnings)
- Border: rgba(55, 50, 47, 0.12)
- Use shadcn/ui components
- Professional, clean, data-focused aesthetic

NAVIGATION:
- Logo: "WasteWise" + tagline "by THE Trash Hub" (left)
- Links: Features, How It Works, Pricing (center)
- Buttons: "Sign In" (ghost) + "Get Started" (primary green) (right)
- Sticky on scroll with backdrop blur

HERO SECTION:
- Headline (56px, bold): "Reduce Waste Costs by Up to 30%"
- Subheadline (20px): "Data-driven waste management analysis for multifamily properties. Upload invoices, get insights in minutes."
- Two CTAs:
  * "Start Free Analysis" (large green button with arrow)
  * "Watch 2-Min Demo" (outlined button with play icon)
- Right side: Illustration/graphic showing:
  * Invoice upload → AI analysis → Report download
  * Use green/brown color scheme

TRUST BAR (below hero):
- "Trusted by 850+ properties nationwide"
- Small logos/names: "Columbia Square", "Orion Properties", "Springs Communities"
- Stats: "$2.4M saved" | "95% satisfaction" | "48hr turnaround"

Make fully responsive and mobile-first.
```

**Prompt 1B**: Features Section

```
Add FEATURES section after hero with WasteWise-specific capabilities:

SECTION HEADER:
- Title: "Everything You Need to Optimize Waste Management"
- Subtitle: "Powered by AI, validated by industry experts"

6 FEATURE CARDS (2 rows x 3 columns on desktop):

Row 1:
1. Automated Invoice Processing
   - Icon: FileText
   - "Upload PDFs, Excel, or CSV - AI extracts all data automatically"

2. Regulatory Compliance Research
   - Icon: Shield
   - "Automatic lookup of local recycling and composting ordinances"

3. AI-Powered Optimization
   - Icon: Sparkles/Brain
   - "Identify savings opportunities with proprietary algorithms"

Row 2:
4. Compactor Utilization Analysis
   - Icon: BarChart
   - "Calculate tons/haul and recommend monitor installations"

5. Contract Risk Assessment
   - Icon: FileSearch
   - "Extract terms, identify risks, set calendar reminders"

6. Professional Reports
   - Icon: Download
   - "Excel workbooks + interactive HTML dashboards"

CARD STYLING:
- White background
- Subtle shadow: 0px 4px 6px rgba(0,0,0,0.05)
- Border: 1px solid rgba(55,50,47,0.12)
- Padding: 32px
- Hover: slight lift + shadow increase
- Icon: Green circle background
```

#### Hour 3-4: How It Works & Pricing

**Prompt 1C**: Process & Pricing

```
Add HOW IT WORKS and PRICING sections:

HOW IT WORKS SECTION:
Title: "From Invoice to Insights in 4 Steps"

4 STEPS (horizontal timeline on desktop):
1. Upload
   - Icon: Upload cloud
   - "Upload waste invoices and contracts"
   - "Supports PDF, Excel, CSV, images"

2. Property Info
   - Icon: Building
   - "Enter property details"
   - "Name, units, location, property type"

3. AI Analysis
   - Icon: CPU/Sparkles
   - "Automated data extraction & research"
   - "Calculations, ordinance lookup, optimization"

4. Download Reports
   - Icon: FileCheck
   - "Excel + HTML dashboards ready"
   - "Actionable recommendations with ROI"

Connect with dotted line, add animations on scroll.

PRICING SECTION:
Title: "Simple, Transparent Pricing"
Subtitle: "14-day free trial • No credit card required"

3 TIERS (cards in row):

STARTER ($99/month):
- "For single properties"
- 5 analyses/month
- Basic reports
- Email support
- Button: "Start Free Trial"

PROFESSIONAL ($299/month) [HIGHLIGHTED]:
- Badge: "Most Popular"
- "For property managers"
- 20 analyses/month
- Advanced reports + dashboards
- Regulatory compliance
- Priority support
- Button: "Start Free Trial" (emphasized)

ENTERPRISE (Custom):
- "For portfolios"
- Unlimited analyses
- Custom integrations
- API access
- Dedicated account manager
- SLA guarantee
- Button: "Contact Sales"

Highlight Professional with green border and subtle background.
```

#### Hour 5-6: Authentication

**Prompt 2**: Auth System

```
Implement Supabase authentication:

LOGIN PAGE (/login):
- Centered card (max-width: 420px)
- Logo + "WasteWise" at top
- Heading: "Welcome back"
- Subheading: "Sign in to your account"
- Email input (with validation)
- Password input (with show/hide toggle)
- "Remember me" checkbox
- "Sign In" button (full width, green)
- "Forgot password?" link (right aligned)
- Divider: "or"
- "Don't have an account? Sign up" link
- Footer: "Protected by Supabase Auth"

SIGNUP PAGE (/signup):
- Similar layout to login
- Heading: "Create your account"
- Full name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- Company name (optional)
- Terms checkbox: "I agree to Terms and Privacy Policy"
- "Create Account" button
- "Already have an account? Sign in" link

FORGOT PASSWORD PAGE (/forgot-password):
- Email input
- "Send Reset Link" button
- Success message: "Check your email for reset link"

PROTECTED ROUTE SETUP:
- Create AuthProvider context
- Wrap app in AuthProvider
- Create PrivateRoute component
- Redirect to /login if not authenticated
- Store user session in localStorage
- Add logout functionality in nav

Use Supabase Auth, match design system colors.
```

#### Hour 7-8: Dashboard Shell

**Prompt 3**: Dashboard Layout

```
Create main dashboard at /dashboard (protected):

LAYOUT:
Header (sticky):
- Logo "WasteWise" (left)
- Search bar (center) - "Search properties..."
- Notification bell icon
- User menu dropdown (right):
  * User avatar/initials
  * Name and email
  * "Account Settings"
  * "Billing"
  * "Documentation"
  * Divider
  * "Sign Out" (red text)

Sidebar (collapsible on mobile):
- Dashboard (Home icon) - active state
- Properties (Building icon)
- Reports (FileText icon)
- Analytics (BarChart icon)
- Settings (Settings icon)
- Divider
- "New Analysis" button (green, full width)

Main Content Area:
EMPTY STATE (if no projects):
- Large upload cloud icon (gray)
- Heading: "No analyses yet"
- Subheading: "Create your first waste analysis to get started"
- "Start New Analysis" button (large, green)
- OR
- "Watch Tutorial" link

STATS CARDS (if has projects - 4 cards in row):
1. Total Properties
   - Number + trend indicator
2. Total Savings Identified
   - Dollar amount in green
3. Avg Cost Per Door
   - Dollar amount with benchmark comparison
4. Active Analyses
   - Number with status badge

RECENT ANALYSES TABLE:
- Columns: Property, Units, City, Status, Date, Actions
- Status badges: Completed (green), Processing (blue), Failed (red)
- Actions: View, Download, Delete icons
- Click row to open details

Make fully responsive with mobile sidebar.
```

### Phase 2: Core Workflow (Week 2) - 16 hours

#### Create Project Wizard

**Prompt 4**: Multi-Step Form

```
Create project creation wizard at /projects/new with 3 steps:

STEP 1 - Property Information:
Title: "Tell us about your property"
Progress: 1/3

Form fields:
- Property name (text, required)
  * Placeholder: "e.g., Columbia Square Apartments"
  * Validation: 3-100 characters

- Units (number, required)
  * Placeholder: "Number of residential units"
  * Validation: 10-2000
  * Helper text: "Must be between 10 and 2,000 units"

- City (text, required)
  * Autocomplete with US cities

- State (select, required)
  * Dropdown with all US states

- Property Type (select, required)
  * Options: Garden-Style, Mid-Rise, High-Rise
  * Info tooltip explaining each type

Buttons:
- "Cancel" (secondary, left)
- "Next: Upload Files" (primary green, right)

STEP 2 - Upload Files:
Title: "Upload your invoices and contracts"
Progress: 2/3

Drag-and-drop zone:
- Large upload area with border dashed
- "Drag and drop files here"
- "or click to browse"
- "Supports PDF, Excel, CSV (Max 10MB each)"

File list (shows uploaded files):
- Filename with icon
- File size
- Type selector: [Invoice] [Contract] [Other]
- Remove button (X icon)

Validations:
- At least 1 invoice required
- Max 10MB per file
- Max 20 files total
- Show progress bar during upload

Buttons:
- "Back" (secondary, left)
- "Next: Review" (primary green, right, disabled until 1+ invoice)

STEP 3 - Review & Confirm:
Title: "Review and start analysis"
Progress: 3/3

Summary card:
- Property details (name, units, city/state, type)
- "Edit" link to go back
- File count: "X invoices, Y contracts uploaded"
- "Edit" link to go back

Estimated analysis time: "2-5 minutes"

What happens next:
1. AI extracts invoice data
2. Conducts regulatory research
3. Calculates optimizations
4. Generates reports

Buttons:
- "Back" (secondary, left)
- "Start Analysis" (primary green, large, right)

On submit:
- Create project in database
- Upload files to Supabase Storage
- Navigate to /projects/[id]/processing
- Show loading spinner

Use shadcn/ui Form, Stepper, Card components.
Match design system.
```

#### Processing Page

**Prompt 5**: Processing UI

```
Create processing page at /projects/[id]/processing:

LAYOUT:
Full-width centered card (max 800px)

HEADER:
- Property name (large, bold)
- "Analyzing your waste data..."

PROGRESS SECTION:
- Overall progress bar (0-100%)
- Percentage text above bar
- Estimated time remaining: "About X minutes left"

STEP INDICATORS (4 stages with checkmarks/spinners):
1. ✓ Files Uploaded (complete)
2. ⏳ Processing Invoices (current - spinner)
3. ⏸️ Regulatory Research (pending)
4. ⏸️ Generating Reports (pending)

Each step shows:
- Icon (check/spinner/waiting)
- Step name
- Timestamp when completed

ACTIVITY LOG (scrollable):
- Most recent at top
- Each item:
  * Timestamp
  * Icon (file/ai/search/check)
  * Message text
  * Optional: file name or detail

Example messages:
- "Uploaded 5 invoice files"
- "Extracted data from invoice #12345"
- "Found property has compactor service"
- "Researching McKinney, TX ordinances..."
- "Calculated 3 optimization opportunities"
- "Generated Excel report"
- "Created HTML dashboard"

COMPLETION STATE:
When status = 'completed':
- Green checkmark icon (large)
- Heading: "Analysis Complete!"
- Summary: "Found $XX,XXX in potential savings"
- Two buttons:
  * "View Results" (primary green, large)
  * "Download Reports" (secondary)

ERROR STATE:
When status = 'failed':
- Red X icon
- Heading: "Analysis Failed"
- Error message from database
- "Try Again" button
- "Contact Support" link

Auto-refresh every 2 seconds using Supabase Realtime.
Show loading skeleton while fetching.
```

### Phase 3: AI Integration (Week 3-4) - 32 hours

This is where WasteWise becomes REAL. This phase implements the actual business logic.

#### Supabase Edge Function: Invoice Extraction

**Prompt 6A**: Invoice Processing Setup

````
Create Supabase Edge Function: extract-invoice-data

ENDPOINT: POST /functions/v1/extract-invoice-data
AUTH: Required (pass user JWT)

INPUT:
{
  "project_id": "uuid",
  "file_ids": ["uuid", "uuid"]
}

PROCESS:
1. Validate project belongs to user
2. Fetch file metadata from project_files table
3. Download files from Supabase Storage
4. For each file:
   a. Determine file type (PDF, Excel, CSV)
   b. Extract text/data
   c. Call OpenAI GPT-4o with this prompt:

```typescript
const extractionPrompt = `You are extracting waste management invoice data.

INVOICE CONTENT:
${fileContent}

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
- invoice_date is REQUIRED
- vendor_name is REQUIRED
- total_amount is REQUIRED
- All currency values as numbers (no $)
- If field not found, use null
- tonnage/hauls only for compactor invoices
- Itemize charges as specifically as possible

Return ONLY valid JSON.`;
````

d. Parse OpenAI response
e. Validate extracted data
f. Insert into invoice_data table
g. Update project progress

5. Return summary of extraction

RESPONSE:
{
"success": true,
"invoices_processed": 8,
"total_spend": 15234.67,
"date_range": {
"start": "2024-01-01",
"end": "2024-08-31"
}
}

ERROR HANDLING:

- Catch PDF parsing errors
- Retry OpenAI calls (max 3 attempts)
- Log all errors
- Update project.error_message if fatal

Use Deno, integrate with Supabase client.

```

#### Business Logic: Optimization Analysis

**Prompt 6B**: Optimization Calculations
```

Create Supabase Edge Function: analyze-optimizations

ENDPOINT: POST /functions/v1/analyze-optimizations
INPUT: { "project_id": "uuid" }

CRITICAL BUSINESS RULES (from SKILL.md):

1. COMPACTOR MONITORS:
   Recommend IF:
   - Average tons/haul < 7.0 (CRITICAL: NOT <5 or <6)
   - AND max interval ≤ 14 days

   Calculate:
   - Current avg tons/haul
   - Target: 8.5 tons/haul
   - Current annual hauls vs optimized
   - Cost per haul (from invoices)
   - Installation cost: $300 one-time
   - Monthly monitoring: $200/month
   - Net year 1 savings
   - ROI %
   - Payback months

2. CONTAMINATION REDUCTION:
   Recommend IF:
   - Contamination charges > 3% of total spend

   Calculate:
   - Total contamination from invoices
   - Percentage of total spend
   - 50% reduction target
   - Potential savings

3. BULK TRASH SUBSCRIPTION:
   Recommend IF:
   - Average bulk charges > $500/month

   Calculate:
   - Average monthly bulk charges
   - Subscription cost: $400/month
   - Net annual savings

4. LEASE-UP DETECTION:
   Calculate yards per door:
   - Compactor: (total_tons \* 14.49) / units
   - Dumpster: (qty _ size _ freq \* 4.33) / units

   Compare to benchmarks:
   - Garden-Style: 2.0-2.5 YPD
   - Mid-Rise: 1.8-2.3 YPD
   - High-Rise: 1.5-2.0 YPD

   If > 40% below minimum:
   - Flag as lease-up
   - DO NOT recommend optimizations
   - Add note: "Reassess at 90% occupancy"

IMPLEMENTATION:

```typescript
export async function analyzeOptimizations(projectId: string) {
  // 1. Fetch project data
  const project = await supabase
    .from("projects")
    .select("*, invoice_data(*), haul_log(*)")
    .eq("id", projectId)
    .single();

  // 2. Calculate metrics
  const totalSpend = sumInvoices(project.invoice_data);
  const avgMonthlySpend = totalSpend / project.analysis_period_months;
  const costPerDoor = avgMonthlySpend / project.units;

  // 3. Check for compactor
  const hasCompactor = project.equipment_type === "COMPACTOR";

  const optimizations = [];

  // 4. COMPACTOR OPTIMIZATION
  if (hasCompactor && project.haul_log.length > 0) {
    const avgTons = average(project.haul_log.map((h) => h.tonnage));
    const maxInterval = Math.max(
      ...project.haul_log.map((h) => h.days_since_last || 0),
    );

    // CRITICAL THRESHOLD CHECK
    if (avgTons < 7.0 && maxInterval <= 14) {
      const result = calculateCompactorOptimization({
        avgTons,
        haulLog: project.haul_log,
        units: project.units,
        costPerHaul: getCostPerHaul(project.invoice_data),
      });

      optimizations.push({
        opportunity_type: "compactor_monitors",
        recommend: true,
        priority: 1,
        ...result,
      });
    }
  }

  // 5. CONTAMINATION
  const contaminationTotal = sumCharges(project.invoice_data, "contamination");
  const contaminationPct = (contaminationTotal / totalSpend) * 100;

  if (contaminationPct > 3.0) {
    optimizations.push({
      opportunity_type: "contamination_reduction",
      recommend: true,
      priority: 2,
      title: "Implement Contamination Reduction Program",
      calculation_breakdown: {
        current_annual_contamination: contaminationTotal,
        percentage_of_total_spend: contaminationPct,
        target_reduction: 50,
        potential_annual_savings: contaminationTotal * 0.5,
      },
    });
  }

  // 6. BULK SUBSCRIPTION
  const bulkCharges = getMonthlyBulkCharges(project.invoice_data);
  const avgMonthlyBulk = average(bulkCharges);

  if (avgMonthlyBulk > 500) {
    const subscriptionCost = 400;
    const savings = (avgMonthlyBulk - subscriptionCost) * 12;

    if (savings > 0) {
      optimizations.push({
        opportunity_type: "bulk_subscription",
        recommend: true,
        priority: 3,
        title: "Convert to Bulk Trash Subscription",
        calculation_breakdown: {
          current_avg_monthly: avgMonthlyBulk,
          subscription_monthly_cost: subscriptionCost,
          net_annual_savings: savings,
        },
      });
    }
  }

  // 7. Insert optimizations into database
  for (const opt of optimizations) {
    await supabase.from("optimizations").insert({
      project_id: projectId,
      ...opt,
    });
  }

  // 8. Update project total_savings
  const totalSavings = optimizations
    .filter((o) => o.recommend)
    .reduce(
      (sum, o) => sum + (o.calculation_breakdown.net_year1_savings || 0),
      0,
    );

  await supabase
    .from("projects")
    .update({ total_savings: totalSavings })
    .eq("id", projectId);

  return { success: true, optimizations };
}
```

Store results in optimizations table.

```

#### Regulatory Research

**Prompt 6C**: Ordinance Lookup
```

Create Supabase Edge Function: conduct-regulatory-research

ENDPOINT: POST /functions/v1/conduct-regulatory-research
INPUT: { "project_id": "uuid", "city": "string", "state": "string" }

TOKEN-EFFICIENT PROTOCOL (from SKILL_MD_TOKEN_UPDATES.md):

1. CHECK CACHE FIRST:

```typescript
const locationKey = `${city.toLowerCase().replace(" ", "_")}_${state.toLowerCase()}`;

const cached = await supabase
  .from("ordinance_database")
  .select("*")
  .eq("location_key", locationKey)
  .single();

if (cached) {
  console.log("✅ Using cached ordinance data");
  return formatCachedData(cached);
}
```

2. IF NOT CACHED, CONDUCT LIVE RESEARCH (streamlined):

Search 1: Municode.com (best source)

```typescript
const query1 = `"${city}" "${state}" site:municode.com recycling ordinance`;
const results1 = await braveSearch(query1);

const municodeUrls = results1.web.results.filter((r) =>
  r.url.includes("municode.com"),
);

if (municodeUrls.length > 0) {
  // Fetch ordinance content
  const content = await fetch(municodeUrls[0].url).then((r) => r.text());

  // Extract requirements using Claude
  const requirements = await extractRequirements(content, city);

  // Cache for future use
  await cacheOrdinanceData(locationKey, requirements);

  return requirements;
}
```

Search 2: City .gov (backup)

```typescript
const query2 = `"${city}" "${state}" recycling multifamily requirements site:.gov`;
const results2 = await braveSearch(query2);

// Process .gov results...
```

STOP AT 2 SEARCHES MAX. If insufficient data, flag for manual review.

3. EXTRACT REQUIREMENTS using Claude API:

```typescript
const extractionPrompt = `
Analyze this ordinance content and extract waste management requirements for multifamily properties.

ORDINANCE TEXT:
${content}

LOCATION: ${city}, ${state}

Extract and return JSON:
{
  "recycling_requirements": {
    "mandatory": boolean,
    "property_threshold_units": number or null,
    "capacity_requirement": "string describing requirement",
    "service_frequency": "string like 'Weekly minimum'"
  },
  "composting_requirements": {
    "mandatory": boolean,
    "effective_date": "YYYY-MM-DD or null",
    "accepted_materials": ["array", "of", "materials"]
  },
  "penalties": {
    "classification": "string",
    "fine_amounts": "string describing fines"
  },
  "licensed_haulers": [
    {
      "name": "Company Name",
      "phone": "phone number",
      "website": "url or null"
    }
  ],
  "regulatory_contacts": {
    "contact_name": "string",
    "title": "string",
    "phone": "string",
    "email": "string"
  }
}

Focus on:
- Specific numerical thresholds
- Mandatory vs voluntary programs
- Dates and deadlines
- Licensed hauler lists
`;

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  messages: [
    {
      role: "user",
      content: extractionPrompt,
    },
  ],
});

const requirements = JSON.parse(response.content[0].text);
```

4. ASSIGN CONFIDENCE SCORE:

- HIGH: Official sources, specific requirements, penalties documented
- MEDIUM: Core info found, some details missing
- LOW: Insufficient data - flag "HUMAN REVIEW REQUIRED"

5. Store in regulatory_compliance table

RESPONSE:
{
"success": true,
"confidence_score": "HIGH",
"recycling_mandatory": true,
"composting_mandatory": false,
"licensed_haulers_count": 5,
"cached": false
}

Integrate Brave Search API + Anthropic Claude API.

```

### Phase 4: Report Generation (Week 5) - 16 hours

#### Excel Workbook Generator

**Prompt 7A**: Excel Report Setup
```

Create Supabase Edge Function: generate-excel-report

ENDPOINT: POST /functions/v1/generate-excel-report
INPUT: { "project_id": "uuid" }

Use ExcelJS library to create workbook with 8 tabs:

TAB 1: SUMMARY

- Property overview
- Analysis period
- Key metrics (cost/door, total spend)
- Top 3 optimization opportunities

TAB 2: SUMMARY_FULL

- First line MUST BE: "Potential to Reduce 2026 Trash Expense by $XX,XXX"
- Detailed findings
- All optimization opportunities
- Regulatory status

TAB 3: EXPENSE_ANALYSIS (CRITICAL FORMAT)

- ROW-BASED layout (each invoice = row)
- Columns: Month | Vendor | Service Type | Invoice # | Amount | Cost/Door | Notes
- Monthly subtotal rows with budget calculations
- Grand total at bottom

FORMATTING REQUIREMENTS (from wastewise_expense_format_template_UPDATED.md):

```typescript
// Header row
worksheet.getRow(3).values = [
  "Month",
  "Vendor",
  "Service Type",
  "Invoice Number",
  "Amount",
  "Cost/Door",
  "Notes",
];
worksheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
worksheet.getRow(3).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4472C4" },
};

// Data rows
let row = 4;
for (const invoice of invoices) {
  worksheet.getRow(row).values = [
    invoice.month,
    invoice.vendor_name,
    invoice.service_type,
    invoice.invoice_number || "N/A",
    invoice.total_amount,
    invoice.total_amount / project.units,
    invoice.notes || generateDefaultNote(invoice.service_type),
  ];

  // Format currency
  worksheet.getCell(row, 5).numFmt = "$#,##0.00";
  worksheet.getCell(row, 6).numFmt = "$#,##0.00";

  row++;
}

// Monthly subtotal
worksheet.getRow(row).values = [
  null,
  null,
  null,
  `${month} TOTAL:`,
  monthTotal,
  monthTotal / project.units,
  `Monthly budget: $${(monthTotal / project.units).toFixed(2)}/door`,
];
worksheet.getRow(row).font = { bold: true, italic: true };
worksheet.getRow(row).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE7E6E6" },
};
```

TAB 4: HAUL_LOG (if compactor)

- Date | Tonnage | Days Since Last | Status
- Flag low utilization (<7 tons)

TAB 5: OPTIMIZATION

- One row per opportunity
- Full calculation breakdowns
- Contact information
- Implementation timeline

TAB 6: CONTRACT_TERMS (if contract provided)

- 7 clause categories
- Verbatim contract text
- Risk severity
- Calendar reminders

TAB 7: REGULATORY_COMPLIANCE

- 8 sections (from SKILL.md Section 5):
  1. Ordinance Summary
  2. Waste Collection Requirements
  3. Recycling Requirements
  4. Composting/Organics
  5. Penalties & Enforcement
  6. Licensed Haulers (table)
  7. Regulatory Contacts
  8. Research Confidence

TAB 8: INSTRUCTIONS

- How to use the workbook
- Formula explanations
- Contact information

SAVE TO:

- Supabase Storage: `reports/${project_id}/workbook.xlsx`
- Return download URL

VALIDATION BEFORE SAVE:

- All 8 tabs present
- First line of SUMMARY_FULL correct
- All invoice numbers included
- Monthly subtotals calculate correctly
- Contract tab only if contract exists

Use ExcelJS, return signed URL valid for 1 hour.

```

#### HTML Dashboard Generator

**Prompt 7B**: Interactive Dashboard
```

Create Supabase Edge Function: generate-html-dashboard

ENDPOINT: POST /functions/v1/generate-html-dashboard
INPUT: { "project_id": "uuid" }

Generate standalone HTML file with 6 tabs:

TAB 1 - DASHBOARD:

- Executive KPIs (3 cards)
- Gauge charts (Chart.js):
  - Compactor utilization
  - Average tons/haul
- Savings opportunity summary

TAB 2 - EXPENSE ANALYSIS:

- Monthly cost trend (line chart)
- Cost per door trend (line chart)
- Charge breakdown (stacked bar chart)

TAB 3 - HAUL LOG (if compactor):

- Filterable table
- Color-coded status (red = low utilization)
- Export to CSV button

TAB 4 - OPTIMIZATION:

- Optimization cards with:
  - Title and description
  - Savings calculation breakdown
  - ROI metrics (if applicable)
  - Contact info
  - Implementation timeline

TAB 5 - CONTRACT TERMS (if exists):

- Risk matrix
- Calendar reminders
- Action items

TAB 6 - REGULATORY:

- Ordinance summary
- Compliance checklist
- Licensed haulers table
- Confidence score badge

TECH STACK:

- Tailwind CSS (CDN)
- Chart.js (CDN)
- Alpine.js for interactivity (CDN)
- No build step - standalone HTML

TEMPLATE STRUCTURE:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>WasteWise Analysis - {{property_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script
      src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
      defer
    ></script>
    <style>
      /* Custom styles for gauge charts, tabs */
    </style>
  </head>
  <body class="bg-slate-50">
    <!-- Header with property info -->
    <!-- Tab navigation -->
    <!-- Tab content areas -->
    <!-- Charts initialized with inline data -->
    <script>
      // All data embedded in JavaScript
      const projectData = {{JSON_DATA}};
      // Initialize charts
      // Tab switching logic
    </script>
  </body>
</html>
```

SAVE TO:

- Supabase Storage: `reports/${project_id}/dashboard.html`
- Return signed URL

CRITICAL: Embed ALL data in HTML (no external API calls).
Make it work offline once downloaded.

```

### Phase 5: Results Display (Week 6) - 8 hours

**Prompt 8**: Results Page
```

Create comprehensive results page at /projects/[id]/results:

LAYOUT:
Header:

- Property name (large)
- Analysis date range
- "Download Reports" dropdown:
  - Excel Workbook
  - HTML Dashboard
  - Both (ZIP)

Hero Card:

- Large green box
- "Potential 2026 Savings: $XX,XXX"
- Breakdown: Show top 3 opportunities
- "Learn More" expands details

4 TABS:

TAB 1 - OVERVIEW:
Grid of KPI cards:

- Total Spend (period)
- Avg Monthly Cost
- Cost Per Door
- Yards Per Door (with benchmark)
- Potential Annual Savings (green, large)
- Regulatory Compliance Status

Charts:

- Monthly cost trend (line chart)
- Vendor breakdown (pie chart)
- Service type breakdown (bar chart)

TAB 2 - INVOICES:
Data table with:

- Columns: Month, Date, Vendor, Invoice #, Service, Amount, Cost/Door
- Sortable columns
- Search/filter
- Export to CSV button
- Click row to view details modal

TAB 3 - OPTIMIZATIONS:
For each opportunity:

- Priority badge (1, 2, 3)
- Title card (expandable)
- Description
- Calculation breakdown (formatted table)
- Expected savings (green, bold)
- ROI metrics (if applicable)
- Contact information card
- "Request Quote" button
- Implementation timeline

TAB 4 - COMPLIANCE:

- Ordinance summary card
- Requirements checklist:
  - Recycling (✓ ⚠ ✗)
  - Composting (✓ ⚠ ✗)
  - Licensed hauler used
- Confidence score badge
- Licensed haulers table
- Regulatory contacts
- "View Full Report" link to tab in Excel

Use shadcn/ui Table, Card, Tabs, Badge.
Fetch data from database tables.
Real-time updates if status changes.

```

### Phase 6: Polish & Launch (Week 7) - 16 hours

**Prompt 9A**: Mobile Responsiveness
```

Audit and fix mobile responsiveness across all pages:

PRIORITIES:

1. Landing page hero - stack on mobile
2. Dashboard - collapsible sidebar
3. Project wizard - vertical stepper on mobile
4. Results page - tabs to accordion on mobile
5. Charts - responsive sizing

Use Tailwind breakpoints:

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

Test on:

- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1440px)

```

**Prompt 9B**: Loading States
```

Add loading skeletons and states throughout:

DASHBOARD:

- Skeleton cards while loading projects
- "Loading..." text with spinner

PROJECT WIZARD:

- Uploading... progress bar
- "Processing" spinner after submit

RESULTS PAGE:

- Chart skeletons
- Table skeletons
- "Generating report..." for downloads

Use shadcn/ui Skeleton component.
Prevent layout shift during load.

```

**Prompt 9C**: Error Handling
```

Implement comprehensive error handling:

TYPES OF ERRORS:

1. Network errors (offline)
2. Auth errors (session expired)
3. Validation errors (bad input)
4. Processing errors (AI failed)
5. File errors (corrupt PDF)

ERROR UI:

- Toast notifications (shadcn/ui Toast)
- Error boundaries (React)
- Inline field errors (forms)
- Empty states with actions
- Error pages (404, 500)

ACTIONS:

- "Try Again" button
- "Contact Support" link
- "Go Back" navigation
- Auto-retry (max 3)

Log errors to Sentry (optional).

```

**Prompt 9D**: Pricing Page
```

Create dedicated pricing page at /pricing:

Same pricing tiers as landing page, but with:

- Feature comparison table
- FAQ section below
- "Start Free Trial" CTAs
- Testimonials
- "Enterprise" contact form

Add toggle: Monthly / Annual (20% discount)

Link from nav and landing page.

```

**Prompt 9E**: Settings Pages
```

Create user settings at /settings with tabs:

PROFILE:

- Name
- Email (read-only)
- Company name
- Phone
- Avatar upload
- "Save Changes" button

BILLING:

- Current plan badge
- Usage this month
- "Upgrade" button
- Payment method (Stripe integration future)
- Billing history table

NOTIFICATIONS:

- Email preferences checkboxes:
  - Analysis complete
  - New features
  - Weekly digest
- "Save Preferences" button

API (future):

- API key display/regenerate
- Usage metrics
- Documentation link

Use shadcn/ui Form, Tabs, Switch.

````

---

## 🧪 TESTING CHECKLIST

### Authentication
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Forgot password flow
- [ ] Session persistence
- [ ] Logout
- [ ] Protected routes redirect

### Project Creation
- [ ] Form validation (all fields)
- [ ] File upload (<10MB)
- [ ] File type detection
- [ ] Multiple file upload
- [ ] Remove uploaded file
- [ ] Create project in database
- [ ] Navigate to processing

### Processing
- [ ] Progress updates in real-time
- [ ] Activity log appears
- [ ] Completion triggers redirect
- [ ] Error handling
- [ ] Cancel processing

### Results
- [ ] Load project data
- [ ] Display KPIs correctly
- [ ] Charts render
- [ ] Tables sortable
- [ ] Download reports work
- [ ] Mobile responsive

### Reports
- [ ] Excel has 8 tabs
- [ ] First line SUMMARY_FULL correct
- [ ] All invoices listed
- [ ] Calculations accurate
- [ ] HTML standalone works
- [ ] Charts in HTML functional

### Edge Cases
- [ ] No invoices (error)
- [ ] 1 invoice (works)
- [ ] 20 invoices (works)
- [ ] Very old dates
- [ ] Missing invoice numbers
- [ ] Corrupt PDF
- [ ] Huge file (>10MB rejected)
- [ ] Network offline
- [ ] Slow AI response

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] All prompts tested in Lovable
- [ ] Database tables created
- [ ] RLS policies tested
- [ ] Edge Functions deployed
- [ ] Storage buckets configured
- [ ] Environment variables set
- [ ] API keys secured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (PostHog)

### Launch
- [ ] Custom domain connected
- [ ] SSL certificate active
- [ ] Email configured (SendGrid)
- [ ] Monitoring enabled
- [ ] Backup strategy
- [ ] Rate limiting configured

### Post-Launch
- [ ] Monitor error rates
- [ ] Check API usage
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Plan Phase 2 features

---

## 💡 CRITICAL SUCCESS FACTORS

### 1. Accuracy Over Speed
The #1 priority is **accurate calculations**. Better to take 5 minutes and be right than 1 minute and be wrong.

Validate:
- Tons/haul threshold (7, not 5 or 6)
- Yards per door formulas
- Savings calculations
- Benchmark comparisons

### 2. Professional Polish
This is for property managers managing $millions. Everything must look:
- Clean and organized
- Data-driven and credible
- Professional and trustworthy
- Easy to understand

### 3. Real Business Value
Every recommendation must:
- Have a clear ROI
- Show calculation breakdown
- Provide action steps
- Include contact information

### 4. Token Efficiency
Claude API costs add up. Optimize:
- Use ordinance database cache
- Limit searches to 2 max
- Batch OpenAI calls when possible
- Monitor API spending

### 5. User Experience
Make it effortless:
- Upload files in 2 minutes
- Get results in 5 minutes
- Download reports immediately
- Understand findings easily

---

## 📞 SUPPORT & RESOURCES

### Documentation
- **This Guide**: Complete build reference
- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com

### Community
- **Lovable Discord**: discord.gg/lovable
- **Supabase Discord**: discord.supabase.com
- **r/SaaS**: Reddit community
- **#buildinpublic**: Twitter hashtag

### Tools
- **Lovable**: https://lovable.dev
- **Supabase**: https://supabase.com
- **ExcelJS**: https://github.com/exceljs/exceljs
- **Chart.js**: https://www.chartjs.org

---

## 🎯 NEXT STEPS

### RIGHT NOW (5 min)
1. Review this entire document
2. Bookmark for reference
3. Create Lovable account
4. Create Supabase account

### TODAY (2 hours)
1. Start with Prompt 1A (Landing Hero)
2. Test in Lovable preview
3. Continue through Phase 1
4. Deploy landing page

### THIS WEEK (16 hours)
1. Complete Phase 1 & 2
2. Have working MVP
3. Show to 3 potential users
4. Gather feedback

### THIS MONTH (80 hours)
1. Complete all 6 phases
2. Launch beta to 10 properties
3. Iterate based on feedback
4. Plan v2 features

---

## ✅ VALIDATION: Did You Get Everything?

Before proceeding, verify this document includes:

- [x] Complete database schema
- [x] All business rules from SKILL.md
- [x] Exact calculation formulas
- [x] Regulatory research protocol
- [x] Excel formatting requirements
- [x] HTML dashboard specs
- [x] Phase-by-phase prompts
- [x] Testing checklist
- [x] Deployment guide
- [x] No duplication from other docs

**If all checked → You're ready to build! 🚀**

---

*WasteWise Lovable Master Guide v2.0*
*Consolidated from 10 source documents*
*Richard Bates - THE Trash Hub*
*November 14, 2025*

---

## 🎓 APPENDIX: Key Formulas Reference

```python
# Yards Per Door
def yards_per_door_compactor(total_tons, units):
    return (total_tons * 14.49) / units

def yards_per_door_dumpster(qty, size, freq, units):
    return (qty * size * freq * 4.33) / units

# Cost Per Door
def cost_per_door(monthly_total, units):
    return monthly_total / units

# Capacity Utilization
def capacity_utilization(avg_tons, target=8.0):
    return (avg_tons / target) * 100

# Days Between Pickups
def days_between(hauls_per_month):
    return 30 / hauls_per_month

# Compactor Optimization Threshold
def should_recommend_monitors(avg_tons, max_interval_days):
    return avg_tons < 7.0 and max_interval_days <= 14

# Lease-up Detection
def is_lease_up(yards_per_door, benchmark_min):
    variance = ((yards_per_door - benchmark_min) / benchmark_min) * 100
    return variance < -40
````

---

**END OF MASTER GUIDE**
