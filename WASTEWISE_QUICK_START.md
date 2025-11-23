# WasteWise Quick-Start Guide

## Build Your MVP in One Day

---

## ⚡ Fast Track: 0 to Demo in 8 Hours

This guide gets you from zero to a working demo **TODAY**. Follow these steps in order:

---

## Hour 1: Setup (60 minutes)

### Task 1: Create Accounts (20 min)

```
✓ Lovable.dev account
✓ Supabase account (free tier)
✓ OpenAI account + $5 credit
```

### Task 2: Start Lovable Project (10 min)

1. Click "New Project"
2. Name it "WasteWise"
3. Select "Start from Scratch"

### Task 3: Upload Reference (10 min)

1. Download landing-template.zip from Claude
2. Extract locally
3. In Lovable, click "Add Knowledge"
4. Upload the extracted files
5. Label: "Design reference - use this aesthetic"

### Task 4: Set Environment (20 min)

In Lovable Settings → Environment Variables:

```
OPENAI_API_KEY=your_key_here
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## Hour 2-3: Landing Page (120 minutes)

### Prompt 1: Basic Structure

```
Create a modern SaaS landing page for "WasteWise by THE Trash Hub" using the
uploaded design reference for styling.

MUST HAVE:
- Hero: "Waste Management Analysis Made Simple"
- Subhead: "Reduce costs by up to 30% with data-driven insights"
- 2 CTAs: "Start Free Analysis" (primary) + "Watch Demo" (secondary)
- Features section (3 cards):
  1. Automated Invoice Analysis
  2. Regulatory Compliance
  3. AI-Powered Recommendations
- Simple footer with company info

DESIGN:
- Background: #F7F5F3 (cream)
- Text: #37322F (dark)
- Accent: #22C55E (green)
- Use shadcn/ui components
- Clean, minimal, professional
```

### Prompt 2: Add Sections

```
Add these sections to the landing page AFTER the features:

HOW IT WORKS (4 steps with icons):
1. Upload Invoices → "Upload your waste invoices and contracts"
2. Enter Property Info → "Tell us about your property"
3. AI Analysis → "Our AI analyzes your data automatically"
4. Download Reports → "Get Excel workbooks and dashboards"

STATS BAR (3 metrics):
- "$2.4M+ Saved for Clients"
- "850+ Properties Analyzed"
- "95% Client Satisfaction"

Make it scroll smoothly with fade-in animations.
```

---

## Hour 4: Authentication (60 minutes)

### Prompt 3: Auth Setup

```
Add Supabase authentication:

1. Create login page at /login with:
   - Email/password fields
   - "Sign In" button
   - "Don't have account? Sign up" link
   - "Forgot password?" link

2. Create signup page at /signup with:
   - Full name, email, password fields
   - Company name (optional)
   - "Create Account" button
   - "Already have account? Sign in" link

3. Protected routes:
   - Redirect to /login if not authenticated
   - Store user session
   - Add logout in nav

4. Simple nav bar with:
   - WasteWise logo (left)
   - "Dashboard" link (if logged in)
   - User menu dropdown (if logged in)

Use Supabase Auth, match landing page design.
```

---

## Hour 5: Dashboard Shell (60 minutes)

### Prompt 4: Dashboard Layout

```
Create main dashboard at /dashboard (protected route):

LAYOUT:
- Header: Logo, user menu, "New Analysis" button
- Main content:
  - Empty state: "No projects yet. Start your first analysis!"
  - Large "Create New Analysis" card with upload icon

- Sidebar (collapsible):
  - Dashboard (home icon)
  - Projects (folder icon)
  - Reports (document icon)
  - Settings (gear icon)

Make it responsive, clean, professional.
```

---

## Hour 6: Project Creation (60 minutes)

### Prompt 5: Multi-Step Form

```
Create project creation wizard at /projects/new:

STEP 1 - Property Info:
Form with:
- Property name (text, required)
- Units (number, required, 10-2000)
- City (text, required)
- State (dropdown, US states, required)
- Property type (select: Garden-Style, Mid-Rise, High-Rise)
- "Next" button

STEP 2 - Upload Files:
- Drag-and-drop zone
- File type badges (Invoice/Contract)
- List uploaded files with:
  * Filename
  * Size
  * Type selector dropdown
  * Remove button
- "Back" and "Start Analysis" buttons

Validate: at least 1 invoice required, max 10MB per file

Use shadcn/ui Form components, match design system.
```

### Prompt 6: Database Setup

````
Create Supabase tables:

```sql
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  property_name text not null,
  units integer not null,
  city text,
  state text,
  property_type text,
  status text default 'draft',
  created_at timestamp with time zone default now()
);

create table project_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  uploaded_at timestamp with time zone default now()
);

-- Enable RLS
alter table projects enable row level security;
alter table project_files enable row level security;

-- Policies
create policy "Users view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users create own projects" on projects
  for insert with check (auth.uid() = user_id);
````

Create these tables in Supabase SQL editor.

```

---

## Hour 7: Basic Processing (60 minutes)

### Prompt 7: Processing UI
```

Create processing page at /projects/[id]/processing:

Show:

1. Progress bar (0-100%)
2. Current step indicator:
   ✓ Files Uploaded
   ⏳ Processing Data
   ⏸️ Generating Report
3. Activity log:
   - "Uploaded 5 invoice files"
   - "Processing invoices..."
   - "Extracting data..."
4. When done:
   - Success message
   - "View Results" button
   - "Download Report" button (placeholder)

Use loading animations, update progress every few seconds (mock for now).

```

---

## Hour 8: Results View (60 minutes)

### Prompt 8: Simple Results Dashboard
```

Create results page at /projects/[id]/results with 3 tabs:

TAB 1 - Overview:

- Property name and details
- Key metrics (3 cards):
  - Avg Monthly Cost
  - Cost Per Door
  - Potential Savings (mock: $15,000)
- Simple bar chart showing monthly costs

TAB 2 - Invoice Data:

- Table with columns:
  - Month
  - Vendor
  - Invoice #
  - Amount
  - Cost/Door
- Sample data for demo

TAB 3 - Recommendations:

- Card: "Install Compactor Monitors"
  - Description
  - Estimated savings: $12,000/year
  - Contact info button
- Card: "Reduce Contamination"
  - Description
  - Estimated savings: $3,000/year

Use Chart.js for visualizations, shadcn/ui for layout.

```

---

## ✅ What You Have After 8 Hours

**Working Demo Features**:
- ✓ Professional landing page
- ✓ User authentication
- ✓ Dashboard with empty state
- ✓ Project creation form
- ✓ File upload interface
- ✓ Processing page with progress
- ✓ Results dashboard (with mock data)

**NOT Yet Implemented**:
- Actual file processing
- Data extraction
- Real calculations
- Report generation

**But you CAN**:
- Show the UX flow
- Get user feedback
- Validate the concept
- Pitch to stakeholders
- Plan next iterations

---

## 🚀 Next Steps (Post-MVP)

### Week 2: Real Data Processing
```

Add Supabase Edge Functions:

1. PDF parsing with pdf-parse
2. OpenAI API integration
3. Store extracted data
4. Calculate basic metrics

```

### Week 3: Analysis Engine
```

Implement:

1. Yards per door calculations
2. Cost per door analysis
3. Basic optimization logic
4. Store results in database

```

### Week 4: Report Generation
```

Add:

1. ExcelJS for workbook generation
2. HTML dashboard export
3. Download functionality
4. Email delivery

```

---

## 💡 Pro Tips

**Lovable Best Practices**:
1. Start each prompt with "Create" or "Add" for clarity
2. Reference previous work: "Add to the landing page..."
3. Be specific about styling: "Use shadcn/ui Button component"
4. Test in preview after each major prompt
5. Use "Fix" prompts for bugs: "Fix the alignment on mobile"

**Debugging**:
- Click "View Code" to see generated files
- Use browser console for JS errors
- Check Supabase logs for database issues
- Export to GitHub if you need to edit manually

**Staying Organized**:
- Name prompts clearly
- Test each feature before moving on
- Take screenshots of working states
- Save progress frequently (auto-saved)

---

## 🎯 Demo Script

When showing your MVP to stakeholders:

**1. Landing Page** (30 sec)
"This is WasteWise - a platform that analyzes waste management costs for apartment properties..."

**2. Sign Up** (30 sec)
"Users create an account in seconds..."

**3. Create Project** (60 sec)
"They enter property details and upload their invoices..."

**4. Processing** (30 sec)
"Our AI processes the data automatically..."

**5. Results** (90 sec)
"And delivers actionable insights: we found $15,000 in potential savings through compactor optimization..."

**Total**: 4 minutes. Perfect for a pitch!

---

## 📝 Troubleshooting

**"Lovable isn't understanding my prompt"**
- Break it into smaller steps
- Be more specific about what you want
- Include design details
- Reference the landing template

**"Database errors"**
- Check RLS policies are correct
- Verify user is authenticated
- Check table relationships
- View Supabase logs

**"File uploads failing"**
- Check storage bucket exists
- Verify bucket is public (read)
- Check file size limits
- Ensure CORS configured

**"Styling looks wrong"**
- Reference the landing template explicitly
- Specify Tailwind classes
- Use shadcn/ui components
- Test on desktop and mobile

---

## 🎉 You Did It!

You now have a working demo of WasteWise that you can:
- Show to potential users
- Use for user testing
- Present to investors
- Build upon iteratively

**Time to celebrate! 🥳**

Then come back tomorrow and build Phase 2...

---

## 📚 Reference

**Full Documentation**: See WASTEWISE_LOVABLE_REBUILD_PLAN.md

**Prompts Library**: See WASTEWISE_PROMPTS_LIBRARY.md

**Technical Specs**: See WASTEWISE_TECHNICAL_SPEC.md

**Need Help?**
- Lovable Discord: discord.gg/lovable
- Supabase Docs: supabase.com/docs
- This project: Contact Richard Bates

---

*Quick-Start Guide v1.0*
*For: WasteWise Complete Suite*
*Build Time: 8 hours*
*Skill Level: Beginner-friendly*
```
