# Getting Started with WasteWise

Welcome to WasteWise by THE Trash Hub! This guide will walk you through creating your first waste management analysis in just 7 simple steps.

**Estimated Time**: 10-15 minutes
**What You'll Need**: Waste service invoices and hauler logs (PDF, Excel, or images)

---

## Prerequisites

Before you begin, gather the following information about your property:

- **Property Details**: Name, address, number of units
- **Equipment Type**: Compactor, open-top dumpster, or mixed
- **Service Period**: At least 3 months of historical data recommended
- **Documents**:
  - Waste service invoices (PDF or images)
  - Hauler logs or service reports (if available)
  - Current waste service contract (optional but helpful)

---

## Step 1: Create Your Account

### Sign Up

1. Visit [https://wastewise.thetrashub.com](https://wastewise.thetrashub.com) (or your local development server at http://localhost:3000)
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in your details:
   - **Email address**: Use your work email
   - **Password**: At least 8 characters with letters and numbers
   - **Company name**: Your property management company
   - **Full name**: Your name
4. Click **"Create Account"**
5. Check your email for a verification link
6. Click the link to verify your account

### Sign In

For local development, you can use the test account:

- **Email**: `test@wastewise.local`
- **Password**: `TestPassword123!`

---

## Step 2: Create Your First Project

Once logged in, you'll see the Dashboard.

1. Click **"New Analysis"** or **"Create Project"**
2. Fill in the Project Wizard:

### Property Information

- **Project Name**: Give your analysis a descriptive name
  - Example: "Riverside Gardens - Q1 2025 Analysis"
- **Property Name**: Official property name
  - Example: "Riverside Gardens Apartments"
- **Address**: Full street address
  - Example: "1234 Main Street, Austin, TX 78701"
- **Number of Units**: Total residential units
  - Example: `250`
- **Property Type**: Select from dropdown
  - Garden-Style (1-3 stories)
  - Mid-Rise (4-8 stories)
  - High-Rise (9+ stories)

### Equipment Information

- **Equipment Type**: Select your primary waste equipment
  - **COMPACTOR**: For compacted trash service
  - **OPEN_TOP**: For traditional dumpsters/roll-offs
  - **MIXED**: If you have both types

**IMPORTANT**: The equipment type determines which calculations apply. Compactor and open-top containers have different capacity characteristics.

### Service Information

- **Hauler/Vendor**: Current waste service provider
  - Example: "Waste Management", "Republic Services"
- **Service Start Date**: When current contract began
- **Service End Date**: When contract expires (if known)

3. Click **"Create Project"**

You'll be redirected to the project detail page.

---

## Step 3: Upload Your Invoices

WasteWise uses AI to extract data from your invoices automatically.

### Supported File Types

- PDF documents
- Excel spreadsheets (.xlsx, .xls)
- Images (JPG, PNG) of invoices
- Scanned documents

### Upload Process

1. On your project page, find the **"Upload Files"** section
2. Click **"Choose Files"** or drag and drop files into the upload area
3. Select your invoice files:
   - **Recommended**: 3-6 months of monthly invoices
   - **Minimum**: At least 1 month for basic analysis
4. Click **"Upload"**
5. Wait for files to upload (you'll see progress bars)
6. Files appear in the **"Uploaded Files"** list

### Upload Tips

- **File Names**: Use descriptive names like `Jan-2025-Invoice.pdf`
- **Quality**: Ensure scanned documents are clear and readable
- **Completeness**: Include all pages of multi-page invoices
- **Organization**: Upload files in chronological order

### Optional: Upload Hauler Logs

If you have detailed service logs (pickup dates, tons collected, etc.):

1. Click **"Upload Haul Log"** tab
2. Upload Excel or CSV files with service records
3. Required columns:
   - Date (pickup date)
   - Tons or Weight
   - Service Type

**Why hauler logs?** They provide more accurate data for capacity utilization analysis.

---

## Step 4: Start Your Analysis

Now that your documents are uploaded, it's time to analyze them.

1. On the project page, find the **"Analysis"** section
2. Review the information you've entered
3. Click **"Start Analysis"**
4. A confirmation dialog appears:
   - Review project details
   - Confirm you've uploaded necessary files
   - Click **"Confirm and Analyze"**

### What Happens Next?

The system creates an **analysis job** that runs in the background:

1. **Invoice Extraction** (30-60 seconds)
   - AI extracts line items, charges, service dates
2. **Data Validation** (5-10 seconds)
   - Checks for completeness and consistency
3. **Optimization Analysis** (30-60 seconds)
   - Calculates capacity utilization
   - Identifies over-servicing opportunities
   - Compares to industry benchmarks
4. **Report Generation** (30-45 seconds)
   - Creates Excel workbook
   - Generates interactive HTML dashboard

**Total Time**: Typically 2-4 minutes

---

## Step 5: Monitor Progress

You don't need to stay on the page, but you can watch real-time progress.

### Progress Indicators

The processing page shows:

1. **Current Step**: What's happening now
   - "Extracting invoice data..."
   - "Analyzing compactor utilization..."
   - "Generating reports..."
2. **Progress Bar**: Visual completion percentage
3. **Step Counter**: e.g., "Step 3 of 5"
4. **Estimated Time**: Time remaining (approximate)

### Progress Steps

1. ✅ **Job Created** - Analysis queued
2. 🔄 **Processing Invoices** - AI extraction in progress
3. 🔄 **Analyzing Data** - Running calculations
4. 🔄 **Generating Reports** - Creating Excel and HTML
5. ✅ **Complete** - Results ready!

### If Something Goes Wrong

- **Error messages** will appear with clear explanations
- **Common issues**:
  - Missing data in invoices → Upload more complete files
  - Unreadable documents → Use higher quality scans
  - Invalid file format → Check supported file types
- **Retry**: You can start a new analysis after fixing issues

---

## Step 6: Review Your Results

When analysis is complete, you'll see the **Results Dashboard**.

### Dashboard Overview

The results page shows:

1. **Summary Cards**
   - Total Monthly Cost
   - Cost Per Door
   - Yards Per Door
   - Potential Savings

2. **Key Findings**
   - Optimization opportunities
   - Over-servicing detection
   - Contamination issues
   - Bulk item recommendations

3. **Visual Charts**
   - Cost trends over time
   - Capacity utilization
   - Service frequency analysis
   - Benchmark comparisons

### Understanding Your Results

#### For Compactor Properties

**Capacity Utilization**:

- **Target**: 8.5 tons per haul (optimal)
- **Your Result**: Displayed as percentage
- **Below 6.0 tons/haul?** → Consider DSQ monitors (recommendation provided)

**Yards Per Door**:

- **Your Result**: Compacted cubic yards per unit per week
- **Benchmark Range**: 0.08 - 0.15 (depending on property type)

**Optimization Recommendations**:

- If under-utilizing capacity → Reduce pickup frequency
- If exceeding minimums → Adjust service schedule
- ROI calculations for DSQ monitors (if applicable)

#### For Open-Top Properties

**Yards Per Door**:

- Calculated differently (no compression ratio)
- Based on container size × frequency × weeks per month

**Service Frequency**:

- Compared to actual waste generation
- Recommendations for right-sizing containers

### Benchmark Comparisons

Your property is compared to:

- **Property Type**: Garden-Style, Mid-Rise, or High-Rise
- **Industry Standards**: Regional and national benchmarks
- **Historical Data**: Your property's trends over time

---

## Step 7: Download Your Reports

WasteWise generates two comprehensive reports:

### Excel Workbook

**File Name**: `WasteWise_Analysis_[PropertyName]_[Date].xlsx`

**Tabs Included**:

1. **Dashboard** - Summary metrics and key findings
2. **Expense Analysis** - Detailed cost breakdown
3. **Haul Log** - Service event records
4. **Optimization** - Savings opportunities with ROI
5. **Contract Terms** - Extracted contract details (if contract uploaded)
6. **Regulatory Compliance** - Local ordinance research (if applicable)

**Download**:

1. Click **"Download Excel Report"** button
2. File downloads to your computer
3. Open in Microsoft Excel, Google Sheets, or LibreOffice

**Use Cases**:

- Present to stakeholders
- Share with vendor for negotiation
- Include in portfolio reports
- Perform custom calculations

### Interactive HTML Dashboard

**File Name**: `WasteWise_Dashboard_[PropertyName]_[Date].html`

**Features**:

- Interactive charts (hover for details)
- Filterable data tables
- Responsive design (works on mobile)
- No internet required (standalone file)
- Professional branding

**Download**:

1. Click **"Download HTML Dashboard"** button
2. File downloads to your computer
3. Open in any web browser

**Use Cases**:

- Presentations in meetings
- Email to property managers
- View on mobile devices
- Share with non-Excel users

### Report Contents Explained

**Cost Per Door**:

- Your monthly waste cost divided by number of units
- Compare to benchmark range for your property type

**Yards Per Door**:

- Waste volume per unit per week
- Key metric for identifying over/under-servicing

**Savings Opportunities**:

- Dollar amounts with specific recommendations
- ROI calculations for equipment upgrades
- Payback periods for investments

**Compliance Checklist**:

- Local recycling requirements
- Reporting obligations
- Container placement rules

---

## Next Steps

Congratulations! You've completed your first WasteWise analysis. Here's what to do next:

### Immediate Actions

1. **Review Recommendations**: Read through optimization suggestions
2. **Validate Findings**: Verify numbers match your expectations
3. **Share Results**: Distribute reports to stakeholders
4. **Plan Changes**: Prioritize recommendations by ROI

### Take Action

- **Negotiate with Vendor**: Use data to request service adjustments
- **Implement Monitors**: If DSQ monitors recommended, get quotes
- **Adjust Frequency**: Work with hauler to optimize pickup schedule
- **Address Contamination**: If identified, implement reduction program

### Continue Using WasteWise

- **Create More Projects**: Analyze other properties in your portfolio
- **Monthly Monitoring**: Re-run analyses quarterly to track improvements
- **Batch Processing**: Upload multiple properties at once (coming soon)
- **Regulatory Research**: Check compliance for new properties

### Advanced Features

- **Contract Intelligence**: Upload contracts for automated extraction
- **Regulatory Compliance**: Automatic ordinance research for your location
- **Batch Analysis**: Process entire portfolios simultaneously
- **Custom Benchmarks**: Set your own performance targets

---

## Common Questions

### How accurate is the AI extraction?

WasteWise uses Claude Vision, achieving:

- **95%+ accuracy** on standard invoices
- **90%+ accuracy** on scanned documents
- **85%+ accuracy** on handwritten logs

All extracted data is validated, and you can manually correct any errors.

### Can I edit the data after extraction?

Yes! On the project page:

1. Click **"View Extracted Data"**
2. Click **"Edit"** on any line item
3. Make corrections
4. Click **"Save"** and re-run analysis

### What if my invoice format isn't supported?

WasteWise handles most formats, but if extraction fails:

1. Try a higher quality scan
2. Convert to PDF if possible
3. Contact support@thetrashub.com with a sample

We continuously train the AI on new formats.

### How often should I run analyses?

**Recommended Frequency**:

- **New Properties**: Immediately after onboarding
- **Ongoing Monitoring**: Quarterly (every 3 months)
- **Contract Renewals**: 60-90 days before expiration
- **After Changes**: Whenever service is adjusted

### Can I export data for my own analysis?

Yes! The Excel report includes:

- Raw data tabs
- Pivot-ready tables
- Formulas you can modify

You have full access to all extracted and calculated data.

### Is my data secure?

Absolutely:

- **Encrypted storage** (AES-256)
- **Row-level security** (only you see your data)
- **SOC 2 compliance** (in progress)
- **No data sharing** without explicit consent

See our [Privacy Policy](https://wastewise.thetrashub.com/privacy) for details.

---

## Need Help?

### Documentation

- **[User Manual](./user-manual.md)** - Complete feature reference _(coming soon)_
- **[FAQ](./faq.md)** - Frequently asked questions _(coming soon)_
- **[API Documentation](../api/API_DOCUMENTATION_COMPLETE.md)** - For developers

### Support

- **Email**: support@thetrashub.com
- **Response Time**: Within 24 hours (business days)
- **Phone**: Contact sales@thetrashub.com for phone support

### Training

- **Video Tutorials**: [YouTube Channel](https://youtube.com/@thetrashub) _(coming soon)_
- **Webinars**: Monthly training sessions for new users
- **On-Site Training**: Available for enterprise customers

### Feedback

We love hearing from users!

- **Feature Requests**: feedback@thetrashub.com
- **Bug Reports**: support@thetrashub.com
- **Success Stories**: Tell us how WasteWise helped you save money!

---

## What's Next?

Now that you've completed your first analysis, explore advanced features:

1. **[User Manual](./user-manual.md)** - Deep dive into all features _(coming soon)_
2. **[Best Practices](./best-practices.md)** - Tips for maximum savings _(coming soon)_
3. **[API Integration](../api/API_DOCUMENTATION_COMPLETE.md)** - Automate your workflow

---

**Built with ❤️ by THE Trash Hub**

**Last Updated**: 2025-11-22
**Version**: 1.0.0
