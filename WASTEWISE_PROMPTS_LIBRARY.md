# WasteWise Prompts Library
## Copy-Paste Ready Prompts for Lovable

---

## 📋 How to Use This Document

1. **Copy each prompt exactly as written**
2. **Paste into Lovable's prompt interface**
3. **Wait for generation** (30-90 seconds)
4. **Test the result** in preview
5. **Move to next prompt**

**Important**: These prompts build on each other. Do them in order!

---

## 🎨 PHASE 1: Landing Page & Auth

### PROMPT 1A: Landing Page Hero & Features

```
Create a modern SaaS landing page for "WasteWise by THE Trash Hub" - a waste management analysis platform for multifamily properties.

DESIGN SYSTEM (use these colors and styles):
- Background: #F7F5F3 (cream/beige)
- Text: #37322F (dark brown)
- Accent: #22C55E (green for savings/success)
- Border: rgba(55, 50, 47, 0.12)
- Use shadcn/ui components throughout
- Professional, clean, minimal aesthetic
- Subtle shadows: 0px 0px 0px 4px rgba(55,50,47,0.05)

NAVIGATION BAR:
- Logo: "WasteWise" (left side)
- Nav links: Features, How It Works, Pricing (center)
- Buttons: "Sign In" (ghost) + "Get Started" (primary) (right side)
- Sticky on scroll
- Background: #F7F5F3 with subtle backdrop blur

HERO SECTION:
- Headline (large, bold): "Waste Management Analysis Made Simple"
- Subheadline: "Reduce costs by up to 30% with data-driven insights for multifamily properties"
- Two CTAs:
  * "Start Free Analysis" (primary green button, large)
  * "Watch Demo" (secondary outlined button)
- Hero image/illustration on right side (placeholder or simple graphic)

FEATURES SECTION (below hero):
Title: "Everything You Need to Optimize Waste Costs"

3 feature cards in a row:

Card 1:
- Icon: Document/Invoice icon
- Title: "Automated Invoice Analysis"
- Description: "Upload invoices and get instant insights. No manual data entry required."

Card 2:
- Icon: Shield/Check icon
- Title: "Regulatory Compliance"
- Description: "Stay compliant with local recycling and waste ordinances automatically."

Card 3:
- Icon: Chart/TrendingUp icon
- Title: "AI-Powered Optimization"
- Description: "Discover cost-saving opportunities with our proprietary algorithms."

Style cards with:
- White background
- Subtle shadow and border
- Rounded corners (8px)
- Hover effect (slight lift)
- Padding: 32px

Make it fully responsive and mobile-friendly.
```

---

### PROMPT 1B: How It Works Section

```
Add a "How It Works" section to the landing page AFTER the features section:

SECTION HEADER:
- Title: "Simple Process, Powerful Results"
- Subtitle: "Get from invoice to insights in four easy steps"

4 STEP CARDS (horizontal layout on desktop, vertical on mobile):

Step 1:
- Number badge: "1"
- Icon: Upload cloud icon
- Title: "Upload Invoices"
- Description: "Drag and drop your waste invoices and contracts. We support PDF, Excel, and CSV files."

Step 2:
- Number badge: "2"
- Icon: Building/Home icon
- Title: "Enter Property Info"
- Description: "Tell us about your property - name, units, location, and type."

Step 3:
- Number badge: "3"
- Icon: Sparkles/AI icon
- Title: "AI Analysis"
- Description: "Our AI extracts data, researches ordinances, and calculates optimizations automatically."

Step 4:
- Number badge: "4"
- Icon: Download/Report icon
- Title: "Download Reports"
- Description: "Get Excel workbooks and interactive dashboards with actionable recommendations."

STYLING:
- Connect steps with a horizontal line (or arrow)
- Number badges: Green background, white text, circular
- Cards: Minimal, focus on icons and text
- Add subtle fade-in animation on scroll

Center a CTA button below: "Start Your First Analysis" (primary green)
```

---

### PROMPT 1C: Stats, Pricing, Footer

```
Add these sections to complete the landing page:

STATS BAR (between How It Works and Pricing):
- Full-width background: Light green tint
- 3 stats in a row:
  * "$2.4M+" label "Saved for Clients"
  * "850+" label "Properties Analyzed"  
  * "95%" label "Client Satisfaction"
- Bold numbers, smaller label text
- Animated count-up on scroll (optional)

PRICING SECTION:
Title: "Choose Your Plan"

3 pricing tiers (cards in row):

STARTER:
- $99/month
- "5 Analyses per month"
- "Basic reports"
- "Email support"
- Button: "Start Free Trial"

PROFESSIONAL (highlighted):
- $299/month
- Badge: "Most Popular"
- "20 Analyses per month"
- "Advanced reports + dashboards"
- "Regulatory research"
- "Priority support"
- Button: "Start Free Trial" (emphasized)

ENTERPRISE:
- "Custom Pricing"
- "Unlimited analyses"
- "Custom integrations"
- "Dedicated account manager"
- "SLA guarantee"
- Button: "Contact Sales"

Style: Cards with border, highlighted (Professional) has green border

FINAL CTA SECTION:
- Background: Dark (#37322F)
- White text
- Headline: "Ready to Reduce Your Waste Costs?"
- Subheadline: "Join 850+ properties saving money with WasteWise"
- Button: "Get Started Free" (green, large)

FOOTER:
- Background: #F7F5F3
- Border top
- 3 columns:
  * Column 1: Logo + tagline "by THE Trash Hub"
  * Column 2: Links (Product, Pricing, About, Contact)
  * Column 3: Contact info + social icons
- Bottom: Copyright © 2025 WasteWise. All rights reserved.
```

---

### PROMPT 2: Authentication Pages

```
Create authentication system using Supabase Auth:

LOGIN PAGE (/login):
- Centered card (max-width: 400px)
- Logo at top
- Heading: "Welcome Back"
- Form fields:
  * Email (type: email, required)
  * Password (type: password, required, show/hide toggle)
- "Forgot password?" link (right-aligned, small)
- "Sign In" button (full width, primary)
- Divider: "or"
- "Sign in with Google" button (outlined, Google icon)
- Bottom text: "Don't have an account? Sign up" (link to /signup)

SIGNUP PAGE (/signup):
- Same layout as login
- Heading: "Create Your Account"
- Form fields:
  * Full Name (required)
  * Email (required)
  * Password (required, min 8 chars, show strength indicator)
  * Company Name (optional)
- Checkbox: "I agree to the Terms & Conditions" (required)
- "Create Account" button (full width, primary)
- Divider: "or"
- "Sign up with Google" button
- Bottom text: "Already have an account? Sign in" (link to /login)

FORGOT PASSWORD PAGE (/forgot-password):
- Simple form
- Email field
- "Send Reset Link" button
- Success message after submit

IMPLEMENTATION:
- Use Supabase Auth (supabase.auth.signInWithPassword, signUp, etc.)
- Store session in localStorage
- Redirect to /dashboard after successful login/signup
- Show error messages below fields if auth fails
- Validate email format, password strength

PROTECTED ROUTES:
- Create auth middleware to check if user is logged in
- Redirect to /login if not authenticated
- Protected routes: /dashboard, /projects/*

NAVIGATION UPDATE:
- If not logged in: Show "Sign In" + "Get Started" buttons
- If logged in: Show user avatar dropdown with:
  * User name and email
  * "Dashboard" link
  * "Settings" link
  * Divider
  * "Logout" button

Use shadcn/ui Form, Input, Button components. Match landing page design.
```

---

## 🏗 PHASE 2: Dashboard & Project Management

### PROMPT 3A: Dashboard Layout

```
Create the main dashboard at /dashboard (protected route):

LAYOUT STRUCTURE:
Sidebar (left, 240px wide, collapsible on mobile):
- Logo at top
- Navigation items:
  * "Dashboard" (home icon) - active
  * "Projects" (folder icon)
  * "Reports" (file-text icon)
  * "Settings" (settings icon)
- Bottom: User info card (small avatar, name, "Logout" button)

Main Content Area:
HEADER:
- Breadcrumb: "Dashboard"
- Right side: "New Analysis" button (primary, large, plus icon)

CONTENT (empty state):
- Large icon (folder-open, centered)
- Heading: "No projects yet"
- Description: "Start your first waste management analysis to discover cost savings"
- Button: "Create New Analysis" (primary, large)

When projects exist:
STATS ROW (3 cards):
- Total Projects
- Active Analyses
- Total Savings Identified

PROJECTS LIST:
- Title: "Recent Projects"
- Table/Grid with project cards:
  * Property name (bold)
  * Units count
  * Location (city, state)
  * Status badge (Draft/Processing/Completed)
  * Last updated date
  * Action buttons (View, Delete)

STYLING:
- Sidebar: White background, subtle border right
- Main area: #F7F5F3 background
- Cards: White, shadow, rounded
- Active nav item: Green left border, light green background
- Responsive: Hide sidebar on mobile, show hamburger menu

Use shadcn/ui Card, Badge, Button, Table components.
```

---

### PROMPT 3B: Database Schema Setup

```
Set up Supabase database tables for projects:

GO TO SUPABASE SQL EDITOR AND RUN:

-- Projects table
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Project files table
create table project_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  file_name text not null,
  file_type text not null check (file_type in ('invoice', 'contract', 'csv', 'other')),
  file_size integer,
  storage_path text not null,
  uploaded_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table projects enable row level security;
alter table project_files enable row level security;

-- RLS Policies
create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

create policy "Users can view files of own projects"
  on project_files for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create storage bucket for files
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true);

-- Storage policy
create policy "Users can upload to own project folders"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own project files"
  on storage.objects for select
  using (
    bucket_id = 'project-files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger to update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at();
```

---

### PROMPT 4: Project Creation Wizard

```
Create multi-step project creation wizard at /projects/new:

OVERALL LAYOUT:
- Stepper at top showing: 1. Property Info → 2. Upload Files → 3. Review
- Progress indicator
- "Save Draft" button (top right, secondary)

STEP 1: PROPERTY INFORMATION

Form with fields:
1. Property Name
   - Label: "Property Name"
   - Placeholder: "e.g., Orion McKinney Apartments"
   - Required, max 100 chars
   - Helper text: "Official name of the property"

2. Number of Units
   - Label: "Total Units"
   - Type: number
   - Placeholder: "248"
   - Required, min 10, max 2000
   - Helper text: "Total residential units"

3. City
   - Label: "City"
   - Placeholder: "McKinney"
   - Required
   - Autocomplete cities

4. State
   - Label: "State"
   - Select dropdown with all US states
   - Required
   - Default: "TX"

5. Property Type
   - Label: "Property Type"
   - Select: Garden-Style, Mid-Rise, High-Rise
   - Required
   - Helper text: 
     * Garden-Style: <150 units, 2-3 stories
     * Mid-Rise: 150-300 units, 4-8 stories  
     * High-Rise: 300+ units, 9+ stories

Buttons:
- "Cancel" (left, secondary)
- "Next: Upload Files" (right, primary)

Validation: Show errors below fields, disable Next until valid

---

STEP 2: UPLOAD FILES

FILE UPLOAD ZONE:
- Large drag-and-drop area
- Icon: Upload cloud
- Text: "Drag and drop files here, or click to browse"
- Subtext: "Supported: PDF, Excel (.xlsx, .xls), CSV"
- Max file size: 10MB per file
- Max files: 20 total

UPLOADED FILES LIST:
Table with columns:
1. File name (with icon)
2. Type selector (dropdown: Invoice, Contract, Other)
3. Size (formatted: 2.4 MB)
4. Remove button (X icon)

Above table:
- "Add More Files" button (secondary)
- File count: "5 files uploaded"

Requirements display:
- ✓ At least 1 invoice file uploaded
- ⚠ Contract file recommended

Buttons:
- "Back" (left, secondary)
- "Review & Submit" (right, primary, disabled until validation passes)

FILE STORAGE:
- Upload to Supabase Storage bucket: project-files
- Path: {user_id}/{project_id}/{filename}
- Create project_files table entries

---

STEP 3: REVIEW

Summary of entered information:
- Property details (name, units, location, type)
- Files list (count, types)
- Edit buttons for each section

Confirmation:
- Checkbox: "I confirm this information is accurate"

Final buttons:
- "Back to Files" (left, secondary)
- "Start Analysis" (right, primary, green, large)

---

ON SUBMIT:
1. Create project in database with status='processing'
2. Upload files to storage
3. Create file records
4. Redirect to /projects/{id}/processing
5. Show success toast

Use shadcn/ui: Form, Input, Select, Button, Card, Table, Checkbox components
Style with validation states, loading states, smooth transitions
```

---

## 🔄 PHASE 3: Processing & Results

### PROMPT 5A: Processing Page with Progress

```
Create processing/status page at /projects/[id]/processing:

HEADER:
- Breadcrumb: Dashboard → Projects → {Property Name}
- Title: "Processing Analysis"
- Subtitle: "{Property Name}"

PROGRESS SECTION:
Stepper showing current step:
1. ✓ Files Uploaded (completed, green check)
2. ⏳ Extracting Data (in progress, spinning icon)
3. ⏸️ Running Analysis (pending, gray)
4. ⏸️ Generating Reports (pending, gray)

PROGRESS BAR:
- Width: 100%
- Current progress: Dynamic (0-100%)
- Color: Green
- Show percentage text

ACTIVITY LOG:
Card with scrollable list showing real-time updates:
- "✓ Uploaded 8 invoice files" (timestamp)
- "✓ Uploaded 1 contract file" (timestamp)
- "⏳ Processing invoices..." (timestamp, animated)
- "✓ Extracted 13 months of invoice data" (timestamp)
- "⏳ Conducting regulatory research for McKinney, TX..." (animated)
- "✓ Found 5 licensed waste haulers" (timestamp)
- "⏳ Calculating optimization opportunities..." (animated)

Auto-scroll to bottom as new items appear

STATUS CARD:
- Current step name (large)
- Estimated time remaining
- "Cancel Analysis" button (danger, ghost)

WHEN COMPLETED (progress = 100%):
- Success animation (confetti or checkmark)
- Message: "Analysis Complete! 🎉"
- Stats: "Found $15,234 in potential savings"
- Buttons:
  * "View Results" (primary, large)
  * "Download Excel Report" (secondary)
  * "Download HTML Dashboard" (secondary)

REAL-TIME UPDATES:
Subscribe to Supabase Realtime for project updates:
```typescript
const subscription = supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
    (payload) => {
      // Update progress, status, activity log
      setProgress(payload.new.progress)
      setStatus(payload.new.status)
    }
  )
  .subscribe()
```

For MVP: Simulate progress with intervals:
- 0-30%: Processing files (3 seconds)
- 30-50%: Extracting data (3 seconds)
- 50-70%: Regulatory research (4 seconds)
- 70-90%: Running analysis (3 seconds)
- 90-100%: Generating reports (2 seconds)

Add activity log messages at each milestone

Use shadcn/ui: Card, Progress, ScrollArea, Button components
Add smooth animations and transitions
```

---

### PROMPT 5B: Results Dashboard - Overview Tab

```
Create results dashboard at /projects/[id]/results:

LAYOUT:
Tabs at top:
- Overview (active)
- Expense Analysis
- Recommendations
- Regulatory Compliance

OVERVIEW TAB CONTENT:

HEADER CARD (full width, prominent):
- Background: Green gradient
- White text
- Large text: "Potential to Reduce 2026 Trash Expense by $15,234"
- Subtext: "Based on 13 months of data analysis"

KEY METRICS (3 cards in row):

Card 1 - Average Monthly Cost:
- Icon: DollarSign
- Value: "$3,247" (large, bold)
- Label: "Average Monthly Cost"
- Trend: "+2.3% from last quarter" (small, gray)

Card 2 - Cost Per Door:
- Icon: Home
- Value: "$13.09" (large, bold)
- Label: "Cost Per Door"
- Comparison: "Target: $10-15" (small, green if in range)

Card 3 - Annual Savings Opportunity:
- Icon: TrendingUp
- Value: "$15,234" (large, bold, green)
- Label: "Potential Annual Savings"
- Breakdown: "3 optimization opportunities"

CHARTS SECTION (2 columns):

Left - Monthly Cost Trend:
- Line chart using Chart.js
- X-axis: Months (last 13 months)
- Y-axis: Total cost
- Show: Actual costs, trend line
- Highlight: Highest and lowest months

Right - Cost Breakdown:
- Doughnut chart using Chart.js
- Segments:
  * Disposal (60%)
  * Pickup Fees (20%)
  * Rental (10%)
  * Contamination (5%)
  * Other (5%)
- Legend below

PROPERTY DETAILS CARD:
- Property name
- Units count
- Location
- Property type
- Analysis period
- Vendor(s)

TOP RECOMMENDATION PREVIEW:
- Card with green left border
- Badge: "Priority 1"
- Title: "Install Compactor Monitors"
- Brief description
- Savings: "$12,000/year"
- "View Details" button → jumps to Recommendations tab

Use shadcn/ui: Tabs, Card, Badge components
Integrate Chart.js for visualizations
Make responsive (stack on mobile)
```

---

### PROMPT 6: Expense Analysis Tab

```
Add Expense Analysis tab to the results dashboard:

TAB CONTENT:

FILTERS BAR:
- Month range selector (date picker)
- Vendor filter (multi-select dropdown)
- Service type filter (dropdown: All, Disposal, Bulk, etc.)
- "Export to CSV" button (right side)

MONTHLY TREND CHART:
- Line chart showing:
  * Cost per door (primary line, blue)
  * Total monthly cost (secondary line, green)
- X-axis: Months
- Y-axis: Dollars
- Tooltip: Show exact values on hover
- Toggle buttons: "Cost Per Door" | "Total Cost" | "Both"

DETAILED EXPENSE TABLE:
Headers:
- Month (sortable)
- Vendor (sortable)
- Service Type (filterable)
- Invoice # (searchable)
- Amount (sortable, right-aligned, currency format)
- Cost/Door (sortable, right-aligned, currency format)
- Notes (expandable)

Data rows:
- October 2024 | Waste Management | Hauling | 5998169-1571-5 | $1,388.51 | $5.60 | Regular service
- October 2024 | Ally Waste | Bulk Trash | 41953 | $909.33 | $3.67 | Monthly pickup
- [more rows...]

Monthly subtotal rows:
- Bold text
- Background: Light gray
- Shows: Month + "TOTAL" | | | | $2,297.84 | $9.27 | Monthly budget: $9.27/door

Grand total row at bottom:
- Bold, larger font
- Background: Medium gray
- Shows: GRAND TOTAL | | | | $42,273.92 | $13.09 | Avg monthly: $13.09/door

TABLE FEATURES:
- Pagination (20 per page)
- Search bar (searches invoice numbers, vendors)
- Sort by any column
- Sticky header on scroll
- Row highlighting on hover

STATS SUMMARY (above table):
- Total invoices processed: 47
- Date range: Oct 2023 - Oct 2024
- Unique vendors: 3
- Average monthly cost: $3,247.99

Use shadcn/ui: Table, Select, Input, Button, DatePicker components
Implement with real data from database
Add loading states and empty states
```

---

### PROMPT 7: Recommendations Tab

```
Add Recommendations tab to show optimization opportunities:

TAB CONTENT:

HEADER:
- Title: "Cost Optimization Opportunities"
- Subtitle: "3 recommendations identified"
- Total savings badge: "$15,234 annual savings"

RECOMMENDATION CARDS (stacked vertically):

CARD 1 - Install Compactor Monitors:
Header row:
- Badge: "Priority 1" (green)
- Title: "Install Compactor Monitors" (large, bold)
- Status: "Recommended" (green dot)

Description:
"Current average of 5.2 tons/haul indicates early pickups. Installing DSQ compactor monitors will optimize pickups to target 8-9 tons/haul, significantly reducing pickup frequency."

Metrics row (3 columns):
- Current Performance:
  * Avg tons/haul: 5.2
  * Pickups/month: 18
  * Capacity utilization: 58%
  
- Target Performance:
  * Avg tons/haul: 8.5
  * Pickups/month: 11
  * Capacity utilization: 94%
  
- Financial Impact:
  * Annual savings: $12,000
  * ROI: 145%
  * Payback: 8.3 months

Calculation Details (expandable):
- Current annual hauls: 216
- Optimized annual hauls: 132
- Hauls eliminated: 84
- Cost per haul: $165
- Gross annual savings: $13,860
- Installation cost: $300
- Annual monitoring: $2,400
- Net Year 1 savings: $11,160
- Net annual savings (Year 2+): $11,460

Implementation:
- Timeline: "2-4 weeks"
- Confidence: HIGH (badge)
- Next steps: "Contact Keith Conrad at DSQ Technologies"
- Contact button with email/phone

---

CARD 2 - Reduce Contamination:
Similar structure...
- Priority 2
- Current contamination: 5.2% of spend
- Target: <3%
- Savings: $2,500/year
- Actions: Signage, resident education, audits

---

CARD 3 - Bulk Trash Subscription:
Similar structure...
- Priority 3
- Current: On-demand averaging $625/month
- Recommended: Monthly subscription $400
- Savings: $2,700/year

---

COMPARISON TABLE (bottom):
Summary comparison of all recommendations:
| Recommendation | Priority | Annual Savings | ROI | Payback | Confidence |
|----------------|----------|----------------|-----|---------|------------|
| Compactor Monitors | 1 | $12,000 | 145% | 8.3 mo | HIGH |
| Contamination | 2 | $2,500 | N/A | Immediate | MEDIUM |
| Bulk Subscription | 3 | $2,700 | N/A | Immediate | HIGH |

EXPORT BUTTON:
"Download Full Report" → triggers PDF generation

Use shadcn/ui: Card, Badge, Button, Collapsible, Table
Add expand/collapse for calculation details
Include contact information cards
Make calculations prominent and easy to understand
```

---

### PROMPT 8: Regulatory Compliance Tab

```
Add Regulatory Compliance tab:

TAB CONTENT:

HEADER CARD:
- Title: "McKinney, TX Waste & Recycling Ordinances"
- Confidence score badge: "HIGH" (green) or "MEDIUM" (yellow) or "LOW" (red)
- Sources consulted: "3 official sources"
- Last updated: {date}

ORDINANCE OVERVIEW:
Card with summary text:
"The City of McKinney requires multifamily properties to provide recycling services. This ordinance is part of the city's waste reduction and sustainability goals."

COMPLIANCE CHECKLIST:
Table format:

| Requirement | Status | Priority | Action Required |
|-------------|--------|----------|-----------------|
| Recycling Container | ⚠️ VERIFY | HIGH | Schedule site inspection |
| Collection Service | ✓ COMPLIANT | HIGH | Service confirmed with vendor |
| Verification Records | ⚠️ VERIFY | MEDIUM | Request annual submission |
| Container Signage | ⚠️ VERIFY | MEDIUM | Check signage requirements |
| Resident Access | ✓ COMPLIANT | MEDIUM | Containers co-located |

Status badges:
- ✓ COMPLIANT (green)
- ⚠️ VERIFY (yellow)  
- ❌ NON-COMPLIANT (red)

MANDATORY REQUIREMENTS SECTION:

Recycling:
- Requirement card:
  * Icon: Recycle
  * "MANDATORY for properties with 5+ units"
  * Capacity: "Equal to 50% of waste capacity"
  * Frequency: "Weekly minimum"
  * Collection: "Co-located with trash"

Composting/Organics:
- Requirement card:
  * Icon: Leaf
  * Status: "NOT CURRENTLY REQUIRED"
  * Note: "Monitor for future mandates"

LICENSED HAULERS TABLE:
| Company | Phone | Website | Services |
|---------|-------|---------|----------|
| Waste Management | (800) 555-0100 | wm.com | Full service |
| Texas Disposal | (512) 555-0200 | texasdisposal.com | Recycling |
| Ally Waste | (214) 555-0300 | allywaste.com | Bulk trash |
| [3 more haulers...] |

PENALTIES & ENFORCEMENT:
- Classification: "Municipal code violation"
- Enforcement agency: "McKinney Environmental Services"
- Contact: John Doe, (972) 555-0400
- Fine structure: "Enforcement through compliance verification"

CALENDAR REMINDERS (if contract provided):
List of upcoming dates:
- "90 days before contract renewal: Send termination notice if desired"
- "Annual compliance verification due: March 31, 2025"

SOURCES SECTION:
List of sources consulted:
1. McKinney Municipal Code, Chapter 10 - Solid Waste
   Link: library.municode.com/tx/mckinney/...
2. McKinney Environmental Services - Recycling Requirements
   Link: mckinneytexas.org/solid-waste/...
3. [Additional sources...]

DOWNLOAD BUTTON:
"Download Compliance Report" (PDF with all details)

Use shadcn/ui: Card, Badge, Table, Accordion, Link components
Color-code compliance status
Make links clickable
Include print-friendly styling
```

---

## 🎨 PHASE 4: Polish & Advanced Features

### PROMPT 9: Excel Report Generation

```
Create Excel workbook generation feature:

Add button to results page: "Download Excel Report"

BACKEND FUNCTION (Supabase Edge Function):
Create function: generate-excel-report

Install dependencies:
- ExcelJS

Function logic:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { projectId } = await req.json()
  
  // Initialize Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  // Fetch project data
  const { data: project } = await supabase
    .from('projects')
    .select('*, project_files(*), invoice_data(*)')
    .eq('id', projectId)
    .single()
  
  // Create workbook
  const workbook = new ExcelJS.Workbook()
  
  // TAB 1: SUMMARY_FULL
  const summarySheet = workbook.addWorksheet('SUMMARY_FULL')
  
  // First line MUST be savings statement
  summarySheet.getCell('A1').value = `Potential to Reduce 2026 Trash Expense by $${project.total_savings.toFixed(0)}`
  summarySheet.getCell('A1').font = { 
    bold: true, 
    size: 14, 
    color: { argb: 'FF22C55E' } 
  }
  summarySheet.mergeCells('A1:E1')
  summarySheet.getCell('A1').alignment = { horizontal: 'center' }
  
  // Property Overview
  summarySheet.getCell('A3').value = 'PROPERTY OVERVIEW'
  summarySheet.getCell('A3').font = { bold: true, size: 12 }
  
  summarySheet.getCell('A4').value = 'Property Name:'
  summarySheet.getCell('B4').value = project.property_name
  
  summarySheet.getCell('A5').value = 'Units:'
  summarySheet.getCell('B5').value = project.units
  
  // Continue with all sections...
  
  // TAB 2: EXPENSE_ANALYSIS
  const expenseSheet = workbook.addWorksheet('EXPENSE_ANALYSIS')
  
  expenseSheet.getCell('A1').value = 'DETAILED MONTHLY EXPENSE ANALYSIS'
  expenseSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  expenseSheet.getCell('A1').fill = { 
    type: 'pattern', 
    pattern: 'solid', 
    fgColor: { argb: 'FF1F4E78' } 
  }
  expenseSheet.mergeCells('A1:G1')
  
  // Headers
  const headers = ['Month', 'Vendor', 'Service Type', 'Invoice Number', 'Amount', 'Cost/Door', 'Notes']
  headers.forEach((header, i) => {
    const cell = expenseSheet.getCell(3, i + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'FF4472C4' } 
    }
  })
  
  // Add invoice data rows
  let row = 4
  project.invoice_data.forEach(invoice => {
    expenseSheet.getCell(row, 1).value = invoice.month
    expenseSheet.getCell(row, 2).value = invoice.vendor_name
    expenseSheet.getCell(row, 3).value = invoice.service_type
    expenseSheet.getCell(row, 4).value = invoice.invoice_number
    expenseSheet.getCell(row, 5).value = invoice.total_amount
    expenseSheet.getCell(row, 5).numFmt = '$#,##0.00'
    expenseSheet.getCell(row, 6).value = invoice.total_amount / project.units
    expenseSheet.getCell(row, 6).numFmt = '$#,##0.00'
    expenseSheet.getCell(row, 7).value = 'Regular waste service'
    row++
  })
  
  // Set column widths
  expenseSheet.getColumn(1).width = 15
  expenseSheet.getColumn(2).width = 20
  expenseSheet.getColumn(3).width = 20
  expenseSheet.getColumn(4).width = 18
  expenseSheet.getColumn(5).width = 12
  expenseSheet.getColumn(6).width = 10
  expenseSheet.getColumn(7).width = 45
  
  // Add remaining tabs:
  // TAB 3: RECOMMENDATIONS
  // TAB 4: REGULATORY_COMPLIANCE
  // etc.
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  // Upload to storage
  const fileName = `${project.property_name.replace(/\s/g, '_')}_Analysis.xlsx`
  const { data: uploadData } = await supabase.storage
    .from('reports')
    .upload(`${projectId}/${fileName}`, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    })
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('reports')
    .getPublicUrl(`${projectId}/${fileName}`)
  
  return new Response(
    JSON.stringify({ url: publicUrl }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

FRONTEND:
Add download button that:
1. Calls Supabase function
2. Shows loading spinner
3. Downloads file on completion
4. Shows success toast

Style download button prominently
Show file size estimate
Include "View in Excel" helper text
```

---

### PROMPT 10: Settings Page

```
Create user settings page at /settings:

LAYOUT with tabs:
- Profile
- Company
- Notifications
- Billing

PROFILE TAB:
Form with:
- Avatar upload (circular, 100px)
- Full name (editable)
- Email (disabled, show "Verified" badge)
- Phone number (optional)
- "Update Profile" button

COMPANY TAB:
Form with:
- Company name
- Industry (dropdown)
- Property count (number)
- "Save Company Info" button

NOTIFICATIONS TAB:
Toggle switches:
- Email notifications:
  * Analysis complete
  * New optimization found
  * Regulatory updates
- Push notifications (if enabled)

BILLING TAB:
- Current plan badge (Starter/Professional/Enterprise)
- Usage stats:
  * Analyses this month: 3 / 5
  * Progress bar
- "Upgrade Plan" button
- Payment method card (if applicable)
- Billing history table

Use shadcn/ui: Tabs, Form, Input, Switch, Button, Avatar components
Add save confirmation toasts
Include form validation
```

---

## 🚀 DEPLOYMENT PROMPTS

### PROMPT 11: Final Polish

```
Polish the entire application:

1. Add consistent loading states everywhere:
   - Skeleton loaders for cards
   - Spinner for buttons
   - Progress bars for uploads

2. Add error boundaries:
   - Catch errors gracefully
   - Show friendly error messages
   - "Try again" buttons

3. Add empty states:
   - No projects: Helpful message + CTA
   - No results: Explanation + suggestions
   - No files: Upload prompt

4. Improve mobile responsiveness:
   - Test all pages on mobile
   - Collapsible sidebar
   - Stack cards vertically
   - Larger tap targets

5. Add micro-interactions:
   - Button hover effects
   - Card lift on hover
   - Smooth transitions
   - Toast notifications

6. Performance optimization:
   - Lazy load images
   - Code splitting
   - Memoize expensive calculations
   - Optimize bundle size

7. Accessibility:
   - Keyboard navigation
   - ARIA labels
   - Focus indicators
   - Screen reader support

Test thoroughly on:
- Desktop (Chrome, Firefox, Safari)
- Mobile (iOS Safari, Android Chrome)
- Tablet

Fix any bugs found.
```

---

## 📝 Notes

**Important**:
- These prompts build on each other - do them in order
- Test each feature before moving to the next
- Adjust prompts based on what Lovable generates
- Use "Fix" or "Modify" prompts to refine results

**Common Issues**:
- If styling is off, explicitly reference design tokens
- If database isn't working, check RLS policies
- If file upload fails, verify storage bucket configuration
- If authentication breaks, check Supabase Auth settings

**Pro Tips**:
- Save your prompts as you go
- Take screenshots of working states
- Use GitHub integration for version control
- Export code if you need to manually fix something

---

*Prompts Library v1.0*  
*Total Prompts: 20+*  
*Estimated Build Time: 8-16 hours*
