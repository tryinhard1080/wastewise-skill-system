# WasteWise Lovable Prompts Collection

**Ready-to-Use Prompts for Building WasteWise in Lovable**

Copy and paste these prompts directly into Lovable to build each component of the WasteWise application. Follow the order provided for best results.

---

## 🚀 Phase 1: Landing Page & Foundation

### Prompt 1.1: Initialize Project

```
Create a modern SaaS landing page for "WasteWise by THE Trash Hub" - a waste management analysis platform for multifamily properties.

TECH STACK:
- React + TypeScript + Tailwind CSS
- shadcn/ui components
- Vite build tool

BRAND IDENTITY:
- Colors: Green (#22C55E success), Blue (#2563EB trust), Purple (#9333EA premium)
- Logo text: "WasteWise" with tagline "by THE Trash Hub"
- Professional, data-driven, trustworthy aesthetic

PAGES TO CREATE:

1. HERO SECTION:
   - Full-width gradient background (blue to purple, 45deg)
   - Heading: "Transform Your Waste Management Costs"
   - Subheading: "AI-powered analysis that identifies 10-30% cost savings for multifamily properties"
   - Two CTA buttons: "Start Free Analysis" (primary green) and "Watch Demo" (secondary)
   - Hero image: Dashboard preview mockup (floating card effect with shadow)

2. FEATURES SECTION:
   - Title: "Everything You Need to Optimize Waste Costs"
   - 4 feature cards in 2x2 grid:
     * "Instant Invoice Analysis" (upload icon) - Upload invoices, get comprehensive breakdown
     * "Cost Optimization" (trending-up icon) - Identify savings opportunities automatically
     * "Regulatory Compliance" (shield icon) - Local ordinance research included
     * "Professional Reports" (file-text icon) - Excel + Interactive dashboards
   - Each card: Icon, title, description, subtle hover effect

3. HOW IT WORKS (3 STEPS):
   - Step 1: "Upload Invoices" - Drag & drop PDFs or Excel files
   - Step 2: "AI Analysis" - Our engine processes and validates data
   - Step 3: "Get Results" - Download reports and implement savings
   - Display as horizontal timeline with connecting line

4. PRICING SECTION:
   - Two tiers side-by-side:
   
   FREE TIER:
   - Price: $0/month
   - 3 analyses per month
   - Basic features
   - 7-day report access
   - Email support
   - CTA: "Get Started Free"
   
   PRO TIER (recommended badge):
   - Price: $99/month
   - Unlimited analyses
   - Priority processing
   - 90-day report access
   - Advanced features
   - Priority support
   - CTA: "Start Free Trial"

5. TESTIMONIALS:
   - 3 testimonial cards with:
     * Avatar image placeholder
     * Quote (lorem ipsum for now)
     * Name and title
     * Company name
   - Carousel navigation

6. FAQ SECTION:
   - Accordion style (shadcn/ui Accordion)
   - 6 common questions:
     * What file formats do you support?
     * How accurate is the analysis?
     * Is my data secure?
     * Can I cancel anytime?
     * What properties do you support?
     * How long does analysis take?

7. CTA SECTION:
   - Bold heading: "Ready to Save on Waste Management?"
   - Subheading: "Join hundreds of property managers saving thousands"
   - CTA button: "Start Your Free Analysis"
   - Background: Subtle gradient with pattern

8. FOOTER:
   - Logo and tagline
   - Links: About, Pricing, Contact, Privacy, Terms
   - Contact: support@thetrashhub.com | (555) 123-4567
   - Social icons: LinkedIn, Twitter/X
   - Copyright notice

HEADER:
- Logo on left
- Navigation: Features, Pricing, How It Works, Contact
- Right side: "Login" (ghost button) and "Sign Up" (primary button)
- Sticky on scroll with backdrop blur
- Mobile: Hamburger menu

Make it:
- Mobile responsive (mobile-first)
- Smooth scroll animations (use framer-motion)
- Professional and trustworthy
- Fast loading (optimize images)
- Accessible (proper ARIA labels)
```

### Prompt 1.2: Authentication Setup

```
Integrate Supabase authentication into the WasteWise application.

SETUP:
1. Create new Supabase project if not exists
2. Get project URL and anon key from Supabase dashboard
3. Install @supabase/supabase-js package

PAGES TO CREATE:

1. LOGIN PAGE (/login):
   - Clean, centered form on neutral background
   - Logo at top
   - Email input (type=email, required)
   - Password input (type=password, required, show/hide toggle)
   - "Remember me" checkbox
   - "Forgot password?" link (right-aligned, small)
   - "Log In" button (full width, primary)
   - Divider with "or"
   - "Don't have an account? Sign up" link at bottom
   - Loading state while authenticating
   - Error toast for failed login

2. SIGNUP PAGE (/signup):
   - Similar layout to login
   - Fields:
     * Full Name (required)
     * Email (required, validation)
     * Company Name (optional)
     * Password (required, strength indicator)
     * Confirm Password (required, must match)
   - Terms checkbox: "I agree to Terms of Service and Privacy Policy"
   - "Create Account" button (disabled until valid)
   - "Already have an account? Log in" link
   - Success: Redirect to dashboard

3. PASSWORD RESET PAGE (/reset-password):
   - Email input
   - "Send Reset Link" button
   - Back to login link
   - Success message: "Check your email for reset instructions"

SUPABASE SETUP:

Database Schema:
```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' or 'pro'
  analyses_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

AUTH FUNCTIONS:

Create React hooks in src/hooks/useAuth.ts:
- useAuth() - Returns current user, loading state, session
- useSignUp() - Handles registration
- useSignIn() - Handles login
- useSignOut() - Handles logout
- useResetPassword() - Handles password reset

PROTECTED ROUTES:

Create ProtectedRoute component:
- Check if user is authenticated
- If not, redirect to /login
- If yes, render children
- Show loading spinner while checking auth

Apply to:
- /dashboard
- /new-analysis
- /projects
- /settings

SESSION PERSISTENCE:
- Store session in localStorage
- Auto-refresh on app load
- Redirect to dashboard if already logged in (on /login or /signup pages)

COMPONENTS TO USE:
- shadcn/ui: Form, Input, Button, Card, Label, Checkbox
- React Hook Form for form validation
- Zod for schema validation

ERROR HANDLING:
- Show toast notifications for:
  * Invalid credentials
  * Email already exists
  * Network errors
  * Password mismatch
- User-friendly error messages (no technical jargon)
```

### Prompt 1.3: Dashboard Shell

```
Create the main dashboard layout for authenticated users.

LAYOUT STRUCTURE:

1. SIDEBAR (left, fixed):
   Width: 260px desktop, collapsible on mobile
   
   Top Section:
   - Logo and "WasteWise" text
   - User avatar and name dropdown
     * View Profile
     * Settings
     * Logout
   
   Navigation Menu:
   - Dashboard (Home icon) - /dashboard
   - New Analysis (Plus icon) - /new-analysis
   - Projects (Folder icon) - /projects
   - Settings (Settings icon) - /settings
   - Help (HelpCircle icon) - /help
   
   Bottom Section:
   - Subscription tier badge (Free/Pro)
   - Usage meter (if Free tier): "2/3 analyses used"
   - "Upgrade to Pro" button (if Free tier)

2. MAIN CONTENT AREA:
   Padding: 24px
   Max-width: 1400px
   
   Top Bar:
   - Page title (dynamic based on route)
   - Breadcrumbs
   - Search bar (placeholder for future)
   - Notifications icon with badge

3. DASHBOARD HOME PAGE (/dashboard):

   Welcome Section:
   - "Welcome back, [User Name]!" heading
   - Current date and time
   
   Quick Stats Cards (3 columns):
   Card 1: Total Projects
   - Large number (count)
   - Trend indicator (vs last month)
   - Icon: FolderOpen
   
   Card 2: Active Analyses
   - Count with "Processing" badge
   - Icon: Activity
   
   Card 3: Total Savings Identified
   - Dollar amount (sum of all analyses)
   - Icon: TrendingUp, green color
   
   Recent Projects Table:
   - Columns:
     * Property Name (link to results)
     * Date (relative: "2 days ago")
     * Status (badge: Processing/Complete/Failed)
     * Savings (if complete, green text)
     * Actions dropdown (View, Download, Delete)
   - Empty state: "No projects yet. Start your first analysis!"
   - Pagination (10 per page)
   
   Quick Actions:
   - Large "Start New Analysis" button (prominent, center)
   - "View All Projects" link

MOBILE RESPONSIVE:
- Sidebar: Hamburger menu, drawer from left
- Stats cards: Stack vertically
- Table: Horizontal scroll or card view
- Touch-friendly tap targets (min 44px)

COMPONENTS:
- shadcn/ui: Sidebar, Card, Table, Badge, DropdownMenu, Avatar, Button
- lucide-react for all icons
- Smooth transitions and hover effects

DATA FETCHING:
- Fetch user's projects from Supabase on mount
- Real-time subscriptions for status updates
- Loading skeleton while fetching
- Error state with retry button

STYLING:
- Light mode default (dark mode future feature)
- Professional gray/white background
- Green accents for positive metrics
- Blue for primary actions
- Subtle shadows and borders
```

---

## 🚀 Phase 2: File Upload & Processing

### Prompt 2.1: New Analysis Page

```
Create the New Analysis page where users upload files and enter property details.

ROUTE: /new-analysis

PAGE LAYOUT:

Multi-step process with progress indicator:
Step 1: Property Details (active)
Step 2: Upload Files
Step 3: Review & Submit

────────────────────────────────────

STEP 1: PROPERTY DETAILS FORM

Form Container (max-width 800px, centered, Card component):

Required Fields:
1. Property Name
   - Text input
   - Placeholder: "e.g., Columbia Square Living"
   - Required, min 3 characters

2. Number of Units
   - Number input
   - Placeholder: "200"
   - Required, min 1, max 10000

3. City
   - Text input
   - Placeholder: "Portland"
   - Required

4. State
   - Select dropdown with all US states
   - Required
   - Searchable

5. Property Type
   - Radio buttons or Select
   - Options: Garden-Style, Mid-Rise, High-Rise
   - Required
   - Helper text explaining each:
     * Garden-Style: Low-rise apartments, typically 2-3 stories
     * Mid-Rise: 4-10 stories
     * High-Rise: 11+ stories

Form Validation:
- Real-time validation on blur
- Show error messages below fields
- Disable "Next" button until valid
- Save draft automatically to localStorage every 30 seconds

Bottom Actions:
- "Cancel" button (secondary, left)
- "Save Draft" button (secondary)
- "Next Step" button (primary, right, disabled if invalid)

────────────────────────────────────

STEP 2: FILE UPLOAD

Upload Zones (two separate sections):

A. INVOICE FILES (multiple files allowed):
   
   Dropzone Component:
   - Dashed border, light gray background
   - Drag & drop area (min-height: 200px)
   - Icon: Upload cloud icon
   - Text: "Drag & drop invoice files here"
   - Subtext: "or click to browse"
   - "Accepted: PDF, Excel (.xlsx, .xls), CSV"
   - Max size per file: 10MB
   - Max total files: 20
   
   File Preview List:
   - Show uploaded files as cards
   - Each file card shows:
     * File icon (based on type)
     * File name (truncate if long)
     * File size (formatted: "2.3 MB")
     * Upload progress bar (if uploading)
     * Remove button (X icon, top-right)
   - Display in grid (3 columns on desktop)
   
   Validation:
   - Check file type on select
   - Check file size
   - Show error toast if invalid
   - Preview PDF first page (thumbnail)

B. CONTRACT FILE (optional, single file):
   
   Similar dropzone but:
   - Text: "Upload contract (optional)"
   - Single file only
   - Replace file if new one uploaded
   - Show "No contract uploaded" if empty

Upload Behavior:
- Files are NOT uploaded to server yet (just staged)
- Store in component state
- Show total size of all files
- Validate before allowing next step

Bottom Actions:
- "Back" button (to Step 1)
- "Save Draft" button
- "Next Step" button (disabled if no invoice files)

────────────────────────────────────

STEP 3: REVIEW & SUBMIT

Summary View:

Property Details Section:
- Display all entered property info
- "Edit" link to go back to Step 1

Files Section:
- List all invoice files (count)
- Contract file name (if uploaded)
- Total file size
- "Edit" link to go back to Step 2

Confirmation:
- Checkbox: "I confirm the information is accurate"
- Required to enable submit

Cost Preview (if Pro user):
- "This analysis is included in your Pro subscription"

Cost Preview (if Free user):
- "You have X analyses remaining this month"
- OR "Upgrade to Pro for unlimited analyses"

Submit Button:
- Large primary button: "Start Analysis"
- Loading state with spinner when clicked
- Disabled until checkbox checked

Process After Submit:
1. Upload files to Supabase Storage
2. Create project record in database
3. Trigger analysis Edge Function
4. Redirect to processing status page
5. Show success toast: "Analysis started! We'll email you when complete."

────────────────────────────────────

COMPONENTS TO USE:
- shadcn/ui: Form, Input, Select, Card, Button, Progress, Checkbox, Alert
- react-dropzone for file upload
- react-hook-form for form management
- zod for validation schema

ERROR HANDLING:
- Network errors: Show retry button
- File upload failures: Allow re-upload
- Validation errors: Clear, specific messages
- Session expiry: Redirect to login

SAVE DRAFT FEATURE:
- Save form data to Supabase projects table with status='draft'
- Allow user to resume later
- Show drafts on dashboard with "Continue" button
- Auto-save every 30 seconds while on page
```

### Prompt 2.2: File Storage & Database Setup

```
Set up Supabase storage and database schema for file handling.

SUPABASE STORAGE BUCKETS:

Create three private buckets:

1. 'invoices' bucket:
   - Privacy: Private
   - File size limit: 10MB
   - Allowed types: .pdf, .xlsx, .xls, .csv
   - Path structure: {user_id}/{project_id}/{filename}

2. 'contracts' bucket:
   - Privacy: Private
   - File size limit: 10MB
   - Allowed types: .pdf
   - Path structure: {user_id}/{project_id}/{filename}

3. 'outputs' bucket:
   - Privacy: Private
   - File size limit: 50MB
   - Allowed types: .xlsx, .html, .zip
   - Path structure: {user_id}/{project_id}/{filename}

RLS POLICIES FOR STORAGE:

For 'invoices' bucket:
```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "Users can read own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete own invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

Apply similar policies for 'contracts' and 'outputs' buckets.

────────────────────────────────────

DATABASE SCHEMA:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Property info
  property_name TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('Garden-Style', 'Mid-Rise', 'High-Rise')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'complete', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', property_name || ' ' || city || ' ' || state)
  ) STORED
);

CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_search_idx ON projects USING GIN(search_vector);

-- Project files table
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  file_type TEXT NOT NULL CHECK (file_type IN ('invoice', 'contract')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  file_size BIGINT NOT NULL, -- Bytes
  mime_type TEXT NOT NULL,
  
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX project_files_project_id_idx ON project_files(project_id);

-- Analysis results table
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Generated files
  excel_file_path TEXT,
  html_file_path TEXT,
  
  -- Summary data (for quick display)
  summary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "total_savings": 15000,
  --   "monthly_cost": 2500,
  --   "cost_per_door": 12.50,
  --   "optimizations_count": 3,
  --   "confidence": "HIGH"
  -- }
  
  -- Processing metrics
  processing_time_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analysis_results_project_id_idx ON analysis_results(project_id);

-- Error logs table (for debugging)
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX error_logs_project_id_idx ON error_logs(project_id);
CREATE INDEX error_logs_created_at_idx ON error_logs(created_at DESC);
```

────────────────────────────────────

RLS POLICIES FOR TABLES:

```sql
-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Project files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project files"
ON project_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Similar INSERT/DELETE policies for project_files

-- Analysis results
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis results"
ON analysis_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = analysis_results.project_id
    AND projects.user_id = auth.uid()
  )
);
```

────────────────────────────────────

REACT FILE UPLOAD SERVICE:

Create src/services/fileService.ts:

```typescript
import { supabase } from './supabaseClient';

export const uploadInvoiceFile = async (
  file: File,
  userId: string,
  projectId: string
): Promise<string> => {
  const filePath = `${userId}/${projectId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data.path;
};

export const uploadContractFile = async (
  file: File,
  userId: string,
  projectId: string
): Promise<string> => {
  const filePath = `${userId}/${projectId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data.path;
};

export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
};
```

────────────────────────────────────

TEST THE SETUP:

1. Try uploading a test file
2. Verify it appears in Supabase Storage dashboard
3. Verify project record created in database
4. Test RLS by creating second user
5. Verify second user cannot access first user's files
```

---

## 🚀 Phase 3: Analysis Engine

### Prompt 3.1: Supabase Edge Function Setup

```
Create Supabase Edge Function to process waste analysis.

SETUP:

1. In Supabase dashboard:
   - Go to Edge Functions
   - Create new function: 'process-waste-analysis'

2. Function code (TypeScript):

Location: supabase/functions/process-waste-analysis/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Parse request
    const { projectId } = await req.json()
    
    if (!projectId) {
      throw new Error('projectId is required')
    }

    console.log(`Starting analysis for project: ${projectId}`)

    // Update project status to processing
    await supabase
      .from('projects')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    // Fetch project files
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)

    if (filesError) throw filesError

    // Process invoice files
    const invoiceFiles = files.filter(f => f.file_type === 'invoice')
    const contractFile = files.find(f => f.file_type === 'contract')

    console.log(`Processing ${invoiceFiles.length} invoice files`)

    // Download and process each invoice
    const invoiceData = []
    for (const file of invoiceFiles) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(file.file_path)

      if (downloadError) {
        console.error(`Error downloading ${file.file_name}:`, downloadError)
        continue
      }

      // Extract invoice data using OpenAI Vision API
      const extracted = await extractInvoiceData(fileData, file.file_name)
      invoiceData.push(extracted)
    }

    console.log(`Extracted ${invoiceData.length} invoices`)

    // Process contract if provided
    let contractData = null
    if (contractFile) {
      const { data: contractFileData, error: contractDownloadError } = await supabase.storage
        .from('contracts')
        .download(contractFile.file_path)

      if (!contractDownloadError) {
        contractData = await extractContractTerms(contractFileData)
      }
    }

    // Conduct regulatory research
    console.log(`Researching regulations for ${project.city}, ${project.state}`)
    const regulatoryData = await conductRegulatoryResearch(
      project.city,
      project.state
    )

    // Calculate optimizations
    const optimizations = await calculateOptimizations(
      invoiceData,
      project.units,
      project.property_type
    )

    // Validate results
    const validation = await validateAnalysis(
      invoiceData,
      optimizations,
      regulatoryData
    )

    if (!validation.passed) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate Excel workbook
    const excelBuffer = await generateExcelWorkbook({
      project,
      invoiceData,
      contractData,
      regulatoryData,
      optimizations
    })

    // Upload Excel to storage
    const excelFileName = `${project.property_name.replace(/\s+/g, '_')}_Analysis.xlsx`
    const excelPath = `${project.user_id}/${projectId}/${excelFileName}`
    
    await supabase.storage
      .from('outputs')
      .upload(excelPath, excelBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      })

    // Generate HTML dashboard
    const htmlContent = await generateHtmlDashboard({
      project,
      invoiceData,
      optimizations,
      regulatoryData
    })

    // Upload HTML to storage
    const htmlFileName = `${project.property_name.replace(/\s+/g, '_')}_Dashboard.html`
    const htmlPath = `${project.user_id}/${projectId}/${htmlFileName}`
    
    await supabase.storage
      .from('outputs')
      .upload(htmlPath, htmlContent, {
        contentType: 'text/html',
        upsert: true
      })

    // Calculate summary data
    const totalSavings = optimizations
      .filter(o => o.recommend)
      .reduce((sum, o) => sum + (o.calculation_breakdown?.net_year1_savings || 0), 0)

    const avgMonthlyCost = invoiceData.reduce((sum, inv) => sum + inv.total, 0) / 
                          new Set(invoiceData.map(inv => inv.month)).size

    // Save analysis results
    await supabase
      .from('analysis_results')
      .upsert({
        project_id: projectId,
        excel_file_path: excelPath,
        html_file_path: htmlPath,
        summary_data: {
          total_savings: totalSavings,
          monthly_cost: avgMonthlyCost,
          cost_per_door: avgMonthlyCost / project.units,
          optimizations_count: optimizations.filter(o => o.recommend).length,
          confidence: regulatoryData?.confidence_score || 'MEDIUM'
        },
        processing_time_seconds: Math.floor((Date.now() - new Date(project.processing_started_at).getTime()) / 1000)
      })

    // Update project status
    await supabase
      .from('projects')
      .update({
        status: 'complete',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Send completion email
    await sendCompletionEmail(project.user_id, project.property_name, totalSavings)

    console.log(`Analysis complete for project: ${projectId}`)

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        totalSavings,
        processingTime: Math.floor((Date.now() - new Date(project.processing_started_at).getTime()) / 1000)
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error processing analysis:', error)

    // Log error to database
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', projectId)

      await supabase
        .from('error_logs')
        .insert({
          project_id: projectId,
          error_type: 'PROCESSING_ERROR',
          error_message: error.message,
          stack_trace: error.stack
        })
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

// Helper functions (implement these next)
async function extractInvoiceData(fileData: Blob, fileName: string) {
  // TODO: Implement using OpenAI Vision API
}

async function extractContractTerms(fileData: Blob) {
  // TODO: Implement using OpenAI/Claude API
}

async function conductRegulatoryResearch(city: string, state: string) {
  // TODO: Implement using Tavily Search API
}

async function calculateOptimizations(invoiceData: any[], units: number, propertyType: string) {
  // TODO: Implement calculation logic
}

async function validateAnalysis(invoiceData: any[], optimizations: any[], regulatoryData: any) {
  // TODO: Implement validation logic
  return { passed: true, errors: [], warnings: [] }
}

async function generateExcelWorkbook(data: any) {
  // TODO: Implement using ExcelJS
}

async function generateHtmlDashboard(data: any) {
  // TODO: Implement HTML generation
}

async function sendCompletionEmail(userId: string, propertyName: string, savings: number) {
  // TODO: Implement using Resend
}
```

────────────────────────────────────

ENVIRONMENT VARIABLES:

In Supabase dashboard → Settings → Edge Functions:
- OPENAI_API_KEY: Your OpenAI API key
- TAVILY_API_KEY: Your Tavily Search API key (for web search)
- RESEND_API_KEY: Your Resend API key (for emails)

────────────────────────────────────

TRIGGER FUNCTION FROM CLIENT:

In React app, create service function:

src/services/analysisService.ts:

```typescript
import { supabase } from './supabaseClient';

export const startAnalysis = async (projectId: string) => {
  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('process-waste-analysis', {
    body: { projectId }
  });

  if (error) throw error;
  return data;
};
```

Call from New Analysis page after uploading files:

```typescript
// After files uploaded successfully
const result = await startAnalysis(projectId);

// Redirect to processing status page
navigate(`/projects/${projectId}/processing`);
```

────────────────────────────────────

TESTING:

1. Deploy Edge Function using Supabase CLI:
   ```bash
   supabase functions deploy process-waste-analysis
   ```

2. Test with curl:
   ```bash
   curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/process-waste-analysis \
     -H "Authorization: Bearer [ANON_KEY]" \
     -H "Content-Type: application/json" \
     -d '{"projectId":"test-uuid"}'
   ```

3. Monitor logs in Supabase dashboard:
   - Edge Functions → Logs
   - Check for errors

4. Verify:
   - Project status updates to 'processing' then 'complete'
   - Files appear in outputs bucket
   - analysis_results record created
```

---

## 🚀 Phase 4: Results & Downloads

### Prompt 4.1: Processing Status Page

```
Create processing status page that shows real-time analysis progress.

ROUTE: /projects/:projectId/processing

PAGE STRUCTURE:

Center-aligned container (max-width: 600px):

1. ANIMATED PROGRESS INDICATOR:
   - Large circular spinner or progress animation
   - Use Lottie animation (search icon, documents processing)
   - Smooth, professional animation

2. STATUS HEADING:
   - "Analyzing Your Property..."
   - Large, bold text
   - Fade in/out as status updates

3. PROGRESS STEPS (vertical timeline):
   
   Step 1: "Uploading Files" ✓ (complete, green checkmark)
   Step 2: "Processing Invoices" 🔄 (in progress, spinning icon)
   Step 3: "Analyzing Costs" ⏳ (pending, gray)
   Step 4: "Researching Regulations" ⏳ (pending, gray)
   Step 5: "Generating Reports" ⏳ (pending, gray)
   Step 6: "Finalizing" ⏳ (pending, gray)
   
   Display with:
   - Icon for each step (changes based on status)
   - Status text
   - Timestamp when completed
   - Connecting line between steps

4. PROPERTY INFO CARD:
   - Property name
   - Units
   - Location
   - Files uploaded count
   - "View Details" link (to project info)

5. ESTIMATED TIME:
   - "Estimated time remaining: ~2 minutes"
   - Dynamic countdown
   - Update based on average processing time

6. TIPS SECTION:
   - Rotating tips while waiting:
     * "Did you know? Most properties save 10-30% on waste costs"
     * "Tip: Compactor monitoring can reduce pickups by 20%"
     * "We're analyzing local ordinances for compliance"
   - Fade in/out animation every 5 seconds

7. ACTIONS:
   - "Cancel Analysis" button (secondary, bottom-left)
     * Shows confirmation dialog
     * Allows user to cancel and return to dashboard
   - Note: "You'll be notified via email when complete"

────────────────────────────────────

REAL-TIME STATUS UPDATES:

Use Supabase real-time subscriptions:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export const ProcessingStatus = ({ projectId }: { projectId: string }) => {
  const [status, setStatus] = useState('processing');
  const [currentStep, setCurrentStep] = useState(2);

  useEffect(() => {
    // Subscribe to project updates
    const subscription = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          
          // Update step based on status
          if (newStatus === 'complete') {
            setCurrentStep(6);
            // Redirect to results after short delay
            setTimeout(() => {
              navigate(`/projects/${projectId}/results`);
            }, 2000);
          } else if (newStatus === 'failed') {
            // Show error state
            navigate(`/projects/${projectId}/error`);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  // Simulate step progression (for UI feedback)
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 5));
      }, 15000); // Advance step every 15 seconds

      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    // ... JSX for progress UI
  );
};
```

────────────────────────────────────

ERROR HANDLING:

If analysis fails:
- Redirect to error page
- Display error message
- Offer to:
  * Try again
  * Contact support
  * Go back to dashboard

Error page shows:
- Friendly error message (not technical)
- Error ID for support reference
- "What went wrong?" explanation
- Next steps
- Support contact button

────────────────────────────────────

SUCCESS TRANSITION:

When status changes to 'complete':
1. Show all steps complete with checkmarks
2. Display success message: "Analysis Complete! 🎉"
3. Show preview of savings: "Potential savings identified: $15,234"
4. Animate transition (confetti or success animation)
5. Auto-redirect to results page after 2 seconds
6. OR show "View Results" button immediately

────────────────────────────────────

COMPONENTS:
- shadcn/ui: Card, Progress, Badge, Button, Alert
- framer-motion for animations
- lucide-react for icons (Check, Loader, AlertCircle)
- Lottie for animated illustrations

MOBILE OPTIMIZATION:
- Stack timeline vertically
- Larger touch targets for buttons
- Prevent screen sleep (keep-awake)
- Show "Safe to close" message (email notification)
```

### Prompt 4.2: Results View Page

```
Create comprehensive results page displaying analysis outcomes.

ROUTE: /projects/:projectId/results

PAGE LAYOUT:

────────────────────────────────────

HERO SECTION (full-width, gradient background):

1. SUCCESS BANNER:
   - Large checkmark icon (green)
   - Heading: "Analysis Complete for [Property Name]"
   - Processing time: "Completed in 47 seconds"
   - Date/time stamp

2. SAVINGS CALLOUT (prominent):
   - HUGE number: "$15,234"
   - Subtext: "Potential Annual Savings Identified"
   - Green color, bold
   - Animated counter effect (count up)

3. KEY METRICS (3 cards, horizontal):
   - Monthly Cost: "$2,487"
   - Cost Per Door: "$12.44"
   - Efficiency Score: "73%" (with progress ring)

────────────────────────────────────

DOWNLOAD SECTION (container, max-width 1200px):

Large download cards (2 columns on desktop):

Card 1: Excel Workbook
- Icon: Excel file icon (green)
- Title: "Detailed Analysis Workbook"
- Description: "8-tab Excel with comprehensive breakdown"
- File size: "2.3 MB"
- Features list:
  * Expense analysis by month
  * Optimization opportunities
  * Contract risk assessment
  * Regulatory compliance
- Large "Download Excel" button (primary)
- "Quick preview" link (opens preview modal)

Card 2: Interactive Dashboard
- Icon: Globe/chart icon (blue)
- Title: "Interactive HTML Dashboard"
- Description: "6-tab visual report with charts"
- File size: "1.8 MB"
- Features list:
  * Executive KPIs
  * Monthly trends
  * Optimization details
  * Compliance checklist
- Large "View Dashboard" button (primary, opens in new tab)
- "Download HTML" button (secondary)

Additional Option:
- Small "Download Both (ZIP)" button below cards
- Bundles both files

────────────────────────────────────

EXECUTIVE SUMMARY TABS:

Tab-based interface showing key findings:

Tab 1: OPTIMIZATION OPPORTUNITIES
- 3 opportunity cards (if identified):
  
  Opportunity 1: Install Compactor Monitors
  - Description (2-3 sentences)
  - Annual savings: $8,500
  - ROI: 240%
  - Payback: 4.2 months
  - Implementation timeline: 2-4 weeks
  - Contact info: Keith Conrad (DSQ Technologies)
  - "Learn More" button
  
  (Similar cards for opportunities 2 & 3)

- If no opportunities:
  "Your waste management is already optimized! No cost savings opportunities identified at this time."

Tab 2: REGULATORY COMPLIANCE
- Confidence score badge: HIGH/MEDIUM/LOW
- Quick checklist:
  ✓ Recycling compliance verified
  ✓ Composting requirements met
  ⚠ Annual verification due in 60 days
- "View Full Compliance Report" link
- Map showing property location

Tab 3: MONTHLY TRENDS
- Line chart: Cost per door over time
- Bar chart: Expense breakdown by category
- Key insights (AI-generated):
  * Bulk charges increased 15% in last 3 months
  * Contamination fees decreased (good!)
  * Consider negotiating contract renewal

Tab 4: CONTRACT INSIGHTS (if contract provided)
- Contract term: X years
- Expiration date (highlighted if within 6 months)
- Key risks identified: 2 HIGH, 1 MEDIUM
- Calendar reminders set
- "View Contract Analysis" link

────────────────────────────────────

ACTIONS SECTION:

Primary Actions (prominent buttons):
- "Share Report" - Generate shareable link
- "Start Another Analysis" - Go to new analysis page
- "Export to PDF" (future feature, grayed out)

Secondary Actions (smaller links):
- "Add to Favorites" - Star this project
- "Schedule Follow-Up" - Set reminder
- "Print Summary" - Opens print dialog
- "Contact Support" - For questions

────────────────────────────────────

SHARE MODAL (triggered by "Share Report" button):

Modal Content:
- Title: "Share This Report"
- Options:
  1. Generate Public Link
     - Checkbox: "Password protect"
     - Password input (if checked)
     - Expiration dropdown: 7 days / 30 days / Never
     - "Generate Link" button
     - Once generated: Copy link button, QR code
  
  2. Send via Email
     - Email input (multiple recipients)
     - Message textarea (optional)
     - "Send" button

- Note: "Recipients will be able to view results but not download files"

────────────────────────────────────

DOWNLOAD IMPLEMENTATION:

```typescript
const downloadExcel = async () => {
  try {
    // Get signed URL from Supabase
    const { data: urlData, error } = await supabase.storage
      .from('outputs')
      .createSignedUrl(analysis.excel_file_path, 3600);

    if (error) throw error;

    // Trigger download
    const link = document.createElement('a');
    link.href = urlData.signedUrl;
    link.download = `${project.property_name}_Analysis.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track download
    await trackDownload(projectId, 'excel');

    // Show success toast
    toast.success('Excel workbook downloaded!');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file. Please try again.');
  }
};

const viewDashboard = async () => {
  try {
    // Get signed URL
    const { data: urlData, error } = await supabase.storage
      .from('outputs')
      .createSignedUrl(analysis.html_file_path, 3600);

    if (error) throw error;

    // Open in new tab
    window.open(urlData.signedUrl, '_blank');

    // Track view
    await trackDownload(projectId, 'html_view');
  } catch (error) {
    console.error('View error:', error);
    toast.error('Failed to open dashboard. Please try again.');
  }
};

const downloadBothAsZip = async () => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Get both files
    const excelResponse = await fetch(excelSignedUrl);
    const excelBlob = await excelResponse.blob();
    
    const htmlResponse = await fetch(htmlSignedUrl);
    const htmlBlob = await htmlResponse.blob();

    // Add to zip
    zip.file(`${project.property_name}_Analysis.xlsx`, excelBlob);
    zip.file(`${project.property_name}_Dashboard.html`, htmlBlob);

    // Generate zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${project.property_name}_WasteWise_Reports.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Reports downloaded as ZIP!');
  } catch (error) {
    console.error('ZIP download error:', error);
    toast.error('Failed to create ZIP file.');
  }
};
```

────────────────────────────────────

DATA FETCHING:

On page load:
1. Fetch project details
2. Fetch analysis results
3. Parse summary_data JSONB
4. Generate signed URLs for downloads
5. Show loading skeleton while fetching

Real-time updates:
- Subscribe to analysis_results table
- Update page if results change
- Handle multiple users viewing same project

────────────────────────────────────

COMPONENTS:
- shadcn/ui: Card, Button, Tabs, Badge, Dialog, Progress
- framer-motion for animations
- Chart.js / Recharts for charts
- JSZip for ZIP downloads
- lucide-react for icons

MOBILE OPTIMIZATION:
- Stack download cards vertically
- Collapsible sections
- Simplified charts
- Sticky "Download" button at bottom
```

---

*End of Phase 4 prompts. Continue with Phase 5 (Polish & Production) when ready.*
