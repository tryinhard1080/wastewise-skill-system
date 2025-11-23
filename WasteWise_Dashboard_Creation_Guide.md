# How to Create WasteWise Dashboards in Claude.ai

**Complete Step-by-Step Guide for Generating Interactive HTML Dashboards**

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] Access to Claude.ai (Projects feature)
- [ ] WasteWise Complete Suite skill loaded in your project
- [ ] Property invoice files (PDF, Excel, or CSV format)
- [ ] Optional: Service contract file (PDF)
- [ ] Property information (name, units, location)

---

## 🚀 Method 1: Automatic Generation (Recommended)

### Step 1: Upload Files to Claude.ai

1. Navigate to your **WasteWise project** in Claude.ai
2. Click the **📎 Attach files** button in the chat interface
3. Upload your files:
   - ✅ All invoice files (e.g., "Orion_Jan_2025.pdf", "Orion_Feb_2025.pdf")
   - ✅ Contract file (optional, e.g., "Republic_Services_Agreement.pdf")
4. Wait for files to upload (green checkmarks appear)

### Step 2: Request Analysis with Dashboard

**Copy and paste this prompt:**

```
Please analyze these waste invoices using the WasteWise Complete Suite skill.

Property Details:
- Name: [Property Name]
- Units: [Number of units]
- Location: [City, State]
- Property Type: [Garden-Style / Mid-Rise / High-Rise]

Deliverables needed:
1. Complete Excel workbook (9 tabs)
2. Interactive HTML dashboard (6 tabs)

Please generate both files following the WasteWise standards.
```

**Example:**

```
Please analyze these waste invoices using the WasteWise Complete Suite skill.

Property Details:
- Name: Orion Prosper Lakes
- Units: 308
- Location: Prosper, TX
- Property Type: Garden-Style

Deliverables needed:
1. Complete Excel workbook (9 tabs)
2. Interactive HTML dashboard (6 tabs)

Please generate both files following the WasteWise standards.
```

### Step 3: Wait for Analysis

Claude will:

1. ✅ Read the WasteWise skill (automatically)
2. ✅ Process all invoices
3. ✅ Extract property data
4. ✅ Conduct regulatory research (if location provided)
5. ✅ Calculate optimization opportunities
6. ✅ Validate all data (40+ checks)
7. ✅ Generate Excel workbook
8. ✅ Generate HTML dashboard

**Expected time:** 2-4 minutes

### Step 4: Download Your Files

Claude will provide two download links:

```
📊 DELIVERABLES:
[View Excel Workbook](computer://...)
[View Interactive Dashboard](computer://...)
```

**Click each link to download:**

- Excel file: `[Property_Name]_WasteWise_Analysis.xlsx`
- HTML file: `[Property_Name]_Dashboard.html`

---

## 🎯 Method 2: Request Only HTML Dashboard

If you already have an Excel workbook and only need the dashboard:

### Prompt Template:

```
I have already completed the WasteWise analysis for [Property Name].

Can you create ONLY the interactive HTML dashboard using the following data:

**Property Info:**
- Name: [Property Name]
- Units: [Number]
- Location: [City, State]
- Property Type: [Type]

**Key Metrics:**
- Avg Monthly Cost: $[Amount]
- Cost Per Door: $[Amount]
- Annual Savings Opportunity: $[Amount]
- Average Tons/Haul: [Number]
- Target Tons/Haul: 8.0

**Monthly Data:**
[Paste your monthly invoice summary]

**Haul Log:**
[Paste your haul-by-haul data]

Please create the 6-tab interactive HTML dashboard with:
- Dashboard (KPIs + Charts)
- Expense Analysis (with filters)
- Haul Log (with filters)
- Optimization (ROI analysis)
- Contract Terms (if available)
- Regulatory Compliance

Include all enhancements: accessibility, print support, benchmark overlays, and Excel export functionality.
```

---

## 🛠️ Method 3: Manual Customization

### Option A: Customize Existing Dashboard

If you want to modify the dashboard I just created:

1. **Download the improved dashboard:**
   [View Improved Dashboard](computer:///mnt/user-data/outputs/orion_prosper_dashboard_IMPROVED.html)

2. **Open in text editor** (VS Code, Sublime, or even Notepad)

3. **Find and replace your data:**

**Search for:** `const kpi = {`
**Replace with your values:**

```javascript
const kpi = {
  avgCost: 4508.21, // YOUR AVERAGE MONTHLY COST
  cpd: 14.64, // YOUR COST PER DOOR
  savings: 18128, // YOUR ANNUAL SAVINGS
};
```

**Search for:** `const invoiceData = [`
**Replace with your invoice data** (follow same format)

**Search for:** `const haulLogData = [`
**Replace with your haul data** (follow same format)

4. **Save and open in browser** to preview changes

### Option B: Request Custom Dashboard from Scratch

**Use this detailed prompt:**

```
Please create a custom WasteWise HTML dashboard for me with these exact specifications:

**PROPERTY DETAILS:**
- Name: [Your Property]
- Units: [Number]
- Location: [City, State]
- Type: [Garden-Style/Mid-Rise/High-Rise]

**BRANDING:**
- Title: "WasteWise by THE Trash Hub"
- Colors: Tailwind slate/blue palette
- Logo position: Top right

**DATA TO INCLUDE:**
[Paste your processed data here - monthly costs, haul log, etc.]

**REQUIRED FEATURES:**
✅ 6 tabs: Dashboard, Expense Analysis, Haul Log, Optimization, Contract, Regulatory
✅ Interactive filters (month, status, account)
✅ Chart.js visualizations with benchmarks
✅ Excel export functionality (SheetJS)
✅ Print-friendly CSS
✅ ARIA labels for accessibility
✅ Mobile responsive design
✅ Color-blind friendly palette
✅ XSS security (input sanitization)

**CHARTS NEEDED:**
1. Projected Spend (Actual vs Optimized vs Benchmark)
2. Haul Efficiency (Actual vs Target with optimal range annotation)
3. Monthly Cost Trend

**INTERACTIVE ELEMENTS:**
- Month filter dropdown on Expense tab
- Status filter (Low/Good/High) on Haul Log
- Account filter on Haul Log
- Haul log summary stats boxes

Please generate the complete HTML file as a single self-contained document with all JavaScript and CSS inline.
```

---

## 📊 What You Get

### Excel Workbook (9 tabs):

1. **SUMMARY_FULL** - Executive overview with 2026 savings headline
2. **EXPENSE_ANALYSIS** - Row-based format with all invoice numbers
3. **HAUL_LOG** - Compactor pickups (if applicable)
4. **OPTIMIZATION** - Three opportunities with ROI calculations
5. **CONTRACT_TERMS** - Risk analysis (if contract provided)
6. **REGULATORY_COMPLIANCE** - Local ordinance compliance
7. **LEASE-UP_NOTES** - Phase assessment (if applicable)
8. **DOCUMENTATION_NOTES** - Vendor contacts and formulas
9. **QUALITY_CHECK** - Validation summary

### HTML Dashboard (6 tabs):

1. **Dashboard** - KPI cards + projected spend/tonnage charts
2. **Expense Analysis** - Monthly trends + detailed table with filters
3. **Haul Log** - Filterable table + summary stats
4. **Optimization** - ROI analysis + benchmark comparison
5. **Contract Terms** - Risk matrix (or placeholder if none)
6. **Regulatory Compliance** - Ordinance findings

### Key Features Included:

✅ **Accessibility:** ARIA labels, keyboard navigation, focus states
✅ **Print Support:** Optimized print CSS, dedicated print button
✅ **Mobile Responsive:** Stacks on small screens, collapsible elements
✅ **Interactive Filters:** Month, status, and account filters
✅ **Benchmark Overlays:** Industry comparisons on charts
✅ **Chart Annotations:** Optimal ranges, target lines
✅ **Excel Export:** Download button generates .xlsx file
✅ **Color-Blind Friendly:** Uses blue/orange instead of red/green
✅ **Security:** XSS prevention with HTML escaping
✅ **Data Quality Indicator:** Shows confidence level and source count

---

## 🎨 Customization Options

### Change Colors

In the HTML file, find the style section and modify:

```css
/* Primary brand color */
.text-blue-600 {
  color: #2563eb;
} /* Change to your brand color */

/* Success/savings color */
.text-green-600 {
  color: #22c55e;
} /* Change if needed */

/* Alert color */
.text-red-600 {
  color: #dc2626;
} /* Change if needed */
```

### Add Your Logo

Find the header section and add:

```html
<img src="your-logo.png" alt="Company Logo" class="h-12 w-auto" />
```

### Modify Chart Colors

In the JavaScript section, find chart configurations:

```javascript
borderColor: '#DC2626', // Change this hex code
backgroundColor: 'rgba(220, 38, 38, 0.1)', // And this RGBA value
```

---

## 🔧 Troubleshooting

### "Token budget too high" warning

**Solution:** Use the streamlined workflow

```
Please generate the WasteWise analysis in two phases:

Phase 1 (this message): Excel workbook only
Phase 2 (follow-up): HTML dashboard only

This avoids token limits. Start with Phase 1.
```

### Charts not displaying

**Check:**

1. Internet connection (CDN libraries need to load)
2. Browser console for JavaScript errors (F12 → Console tab)
3. Chart.js CDN links are accessible

**Fix:** Open the HTML file and verify these CDN links work:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@2.0.0"></script>
```

### Excel export not working

**Check:**

1. SheetJS library loaded: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
2. Browser allows downloads (check permissions)
3. JavaScript console for errors

### Filters not working

**Check:**

1. Filter dropdown IDs match JavaScript: `month-filter`, `status-filter`, `account-filter`
2. Event listeners attached correctly
3. No JavaScript errors in console

### Print layout broken

**Try:**

1. Use Chrome/Edge (best print support)
2. Check print preview before printing
3. Ensure `@media print` CSS rules are present

---

## 💡 Pro Tips

### 1. Batch Processing Multiple Properties

Create a list and process them one at a time:

```
I have 5 properties to analyze. Let's do them one at a time to manage token budget.

Property 1: Columbia Square (200 units, Portland OR)
[Upload files for Property 1]

Please analyze Property 1 first, then I'll upload files for Property 2.
```

### 2. Reuse Dashboard Template

Save the HTML file as a template. For new properties, just update the data arrays:

- `kpi` object
- `invoiceData` array
- `haulLogData` array
- `projectedSpendData` object
- `projectedTonnageData` object

### 3. Share Dashboards Internally

**Option A: Email**

- Attach HTML file directly
- Recipients can open in any browser
- All functionality works offline (except CDN libraries)

**Option B: Internal SharePoint/Google Drive**

- Upload HTML file
- Share link with team
- Everyone sees same interactive dashboard

**Option C: Embed in Intranet**

- Host on internal web server
- Iframe into existing pages
- No external dependencies except CDN

### 4. Schedule Regular Updates

Create a workflow:

1. Download invoices monthly (1st week of month)
2. Upload to Claude.ai
3. Generate updated dashboard
4. Email to regional managers
5. Archive in SharePoint

### 5. Use as Presentation Tool

During meetings:

- Open dashboard in browser
- Use tabs to navigate topics
- Print specific tabs for handouts
- Export Excel for detailed review

---

## 📞 Support & Resources

### Getting Help in Claude.ai

If something isn't working, ask:

```
I'm having trouble with [specific issue] in my WasteWise dashboard.

Here's what I'm seeing:
[Describe the problem]

Here's what I expected:
[Describe expected behavior]

Can you help troubleshoot?
```

### Request Enhancements

```
Can you add [feature] to my WasteWise dashboard?

Feature needed:
[Describe what you want]

Use case:
[Explain why you need it]

Example:
[Show example if possible]
```

### Common Requests

**Add new chart:**

```
Add a pie chart showing expense breakdown by category (disposal, rental, contamination, etc.)
```

**Change benchmark:**

```
Change the garden-style benchmark from $15/door to $18/door based on our regional data
```

**Add export option:**

```
Add a "Download CSV" button for the haul log table
```

**Modify colors:**

```
Change the color scheme to match Greystar branding (use #003B5C as primary color)
```

---

## 🎓 Learning Resources

### Understanding the Code

**HTML Structure:**

- `<head>` - CDN libraries, CSS styles
- `<body>` - Dashboard content (header, tabs, charts, tables)
- `<script>` - JavaScript for interactivity

**Key JavaScript Components:**

- `const kpi = {...}` - KPI data
- `function showTab(tabId)` - Tab switching logic
- `function createProjectedSpendChart()` - Chart generation
- `function populateExpenseTable()` - Table population
- Event listeners - Button clicks, filter changes

### Chart.js Documentation

For customizing charts: https://www.chartjs.org/docs/latest/

**Common modifications:**

- Colors: `borderColor`, `backgroundColor`
- Type: `type: 'line'` vs `type: 'bar'`
- Labels: `label: 'Your Label'`
- Axes: `scales: { y: { ... } }`

### Tailwind CSS

For styling customization: https://tailwindcss.com/docs

**Common classes:**

- Colors: `text-blue-600`, `bg-green-50`
- Spacing: `p-4` (padding), `m-2` (margin)
- Layout: `flex`, `grid`, `hidden`
- Responsive: `sm:`, `md:`, `lg:` prefixes

---

## ✅ Quality Checklist

Before sharing your dashboard with stakeholders, verify:

### Data Accuracy

- [ ] Property name is correct
- [ ] Unit count is accurate
- [ ] All invoice numbers included
- [ ] Monthly totals add up correctly
- [ ] Savings calculations validated
- [ ] Haul log dates in chronological order

### Functionality

- [ ] All 6 tabs load correctly
- [ ] Charts render properly
- [ ] Filters work on Expense and Haul Log tabs
- [ ] Excel export downloads successfully
- [ ] Print preview shows all content
- [ ] Mobile view is readable

### Branding

- [ ] "WasteWise by THE Trash Hub" appears correctly
- [ ] No mention of "Advantage Waste" anywhere
- [ ] Contact info is accurate (Keith Conrad, Cole Myers)
- [ ] Colors match your brand guidelines

### Professional Polish

- [ ] No spelling errors
- [ ] Numbers formatted consistently ($X,XXX.XX)
- [ ] Charts have proper labels and legends
- [ ] Tables have clear headers
- [ ] Regulatory compliance status is clear

---

## 🚀 Next Steps

1. **Download the improved dashboard** I just created
2. **Test it in your browser** to see all enhancements
3. **Try generating a dashboard** for another property using Method 1
4. **Customize colors/branding** to match Greystar standards
5. **Share with your team** and gather feedback
6. **Iterate and improve** based on real-world usage

---

## 📝 Example Workflow (Complete)

**Day 1 - Setup:**

1. Create WasteWise project in Claude.ai (if not already done)
2. Ensure skill is loaded
3. Organize invoice files in a folder

**Day 2 - Generate First Dashboard:**

1. Upload 6-12 months of invoices for one property
2. Use Method 1 prompt template
3. Download Excel + HTML
4. Review for accuracy
5. Share with property manager for feedback

**Day 3 - Iterate:**

1. Make any needed corrections
2. Customize branding
3. Test print functionality
4. Practice presenting dashboard

**Week 2 - Scale:**

1. Process 5 more properties
2. Build library of dashboards
3. Train regional managers on how to use
4. Set up monthly update schedule

**Ongoing:**

1. Update dashboards monthly as new invoices arrive
2. Track savings from implemented recommendations
3. Refine benchmarks based on actual results
4. Add new properties as needed

---

**Created:** November 14, 2025  
**Version:** 2.0 - Comprehensive Guide with Improvements  
**Author:** WasteWise by THE Trash Hub  
**For:** Greystar Advantage Waste Team
