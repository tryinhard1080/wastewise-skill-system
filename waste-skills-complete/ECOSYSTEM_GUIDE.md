# Advantage Waste Skills Ecosystem - Workflow Guide

**Comprehensive guide to leveraging the complete Claude Skills ecosystem for waste management analysis**

---

## Table of Contents

1. [Skill Comparison Matrix](#skill-comparison-matrix)
2. [Decision Trees](#decision-trees)
3. [Advanced Workflows](#advanced-workflows)
4. [Integration Patterns](#integration-patterns)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Skill Comparison Matrix

| Skill Name | Primary Use Case | Processing Time | Output Format | Validation Level |
|-----------|-----------------|----------------|---------------|-----------------|
| **wastewise-regulatory-lite** | Fast invoice analysis | <2 min | Excel (8-10 sheets) | Standard |
| **wastewise-regulatory** | Complete analysis + compliance | 3-5 min | Excel (12-14 sheets) | Enhanced + Regulatory |
| **wastewise-analytics-validated** | Maximum quality assurance | 4-6 min | Excel + Quality Report | Enterprise-grade (40+ checks) |
| **waste-contract-extractor** | Contract parsing | 2-3 min | Excel + Confidence Scores | Extraction Validation |
| **waste-batch-extractor** | Multi-location processing | 5-10 min | Excel (location tabs) | Batch Validation |
| **compactor-optimization** | Compactor ROI analysis | 1-2 min | Excel + ROI Calculator | Equipment-Specific |
| **waste-visual-reporter** | Interactive dashboards | 2-3 min | HTML (5 tabs, Chart.js) | Visual QA |
| **waste-dev-report-visualizer** | Development projects | 3-4 min | HTML (dashboard + spec) | Development Standards |
| **trash-management-planner** | Comprehensive planning | 5-8 min | 14-Section Document | Industry Standards |

---

## Decision Trees

### Tree 1: "I have invoices - which skill do I use?"

```
Do you have a contract PDF?
├─ YES → Start with waste-contract-extractor
│   │     ↓
│   └─ Then run wastewise-regulatory (includes contract in analysis)
│
└─ NO → How many properties?
    ├─ Single Property
    │   │
    │   ├─ Need fast results? → wastewise-regulatory-lite
    │   ├─ Need compliance research? → wastewise-regulatory
    │   └─ Need maximum validation? → wastewise-analytics-validated
    │
    └─ Multiple Properties → waste-batch-extractor
        │
        └─ Then run wastewise-regulatory on each location
```

### Tree 2: "I need to present findings - what do I create?"

```
Who is the audience?
├─ Property Managers (need operational detail)
│   └─ Use: wastewise-analytics-validated
│       ↓
│       Generate: Excel with granular data
│
├─ Regional Directors (need portfolio overview)
│   └─ Use: waste-visual-reporter
│       ↓
│       Generate: HTML dashboard with filters
│
├─ Executives (need high-level summary)
│   └─ Use: wastewise-regulatory (SUMMARY_FULL tab)
│       ↓
│       Generate: Executive summary with ROI
│
└─ Development Team (need equipment specs)
    └─ Use: trash-management-planner + waste-dev-report-visualizer
        ↓
        Generate: Spec sheets + cost comparisons
```

### Tree 3: "I need to optimize costs - where do I start?"

```
What type of service?
├─ Compactor Service
│   ├─ Average < 6 tons per haul?
│   │   └─ YES → compactor-optimization
│   │       ↓
│   │       Recommendation: Monitoring systems
│   │
│   └─ Days between pickups > 14?
│       └─ YES → compactor-optimization
│           ↓
│           Recommendation: Increase frequency
│
├─ Open Top / Loose Service
│   └─ Use: wastewise-regulatory
│       ↓
│       Review: OPTIMIZATION sheet for recommendations
│
└─ Don't Know / Mixed Service
    └─ Use: wastewise-analytics-validated
        ↓
        Review: Full validation report with all optimization types
```

---

## Advanced Workflows

### Workflow A: Complete Property Assessment (Single Location)

**Goal:** Comprehensive analysis from raw invoices to stakeholder presentation

**Time Required:** 15-20 minutes

**Steps:**
1. **Gather Documents** (5 min)
   - Collect 6+ months of invoices (PDF/Excel/CSV)
   - Find service contract (if available)
   - Note property details (name, units, location)

2. **Extract Contract** (2 min)
   ```
   Prompt: "Extract terms from this Waste Management contract. 
   Focus on rate increases, termination clauses, and renewal dates."
   
   Skill: waste-contract-extractor
   Output: Contract_Terms_Extracted.xlsx
   ```

3. **Run Complete Analysis** (4 min)
   ```
   Prompt: "Analyze Columbia Square Living invoices with regulatory 
   compliance for Portland, Oregon. Include the extracted contract terms."
   
   Skill: wastewise-analytics-validated
   Output: ColumbiaSquare_WasteAnalysis_Validated.xlsx
   ```

4. **Generate Visual Dashboard** (3 min)
   ```
   Prompt: "Create an interactive HTML dashboard from this analysis. 
   I need 5 tabs: Dashboard, Expense Analysis, Haul Log, Optimization, 
   and Contract Terms."
   
   Skill: waste-visual-reporter
   Output: ColumbiaSquare_Dashboard.html
   ```

5. **Review & Share** (6 min)
   - Open Excel: Review QUALITY_CHECK tab for validation results
   - Open HTML: Test interactive filters and charts
   - Export key findings for email/presentation
   - Share both files with stakeholders

**Deliverables:**
- Validated Excel workbook (12 sheets, 40+ checks passed)
- Interactive HTML dashboard (5 tabs, Chart.js visualizations)
- Executive summary with 2026 savings projection
- Calendar reminders for contract renewal

---

### Workflow B: Portfolio-Wide Assessment (Multiple Locations)

**Goal:** Batch process 10-20 properties for regional portfolio review

**Time Required:** 30-45 minutes

**Steps:**
1. **Organize Documents by Location** (10 min)
   - Create folders: Property1/, Property2/, etc.
   - Place all invoices in respective folders
   - Note: Contracts optional but recommended

2. **Run Batch Extractor** (8 min)
   ```
   Prompt: "I have invoices for 12 properties across Texas and California. 
   Extract all data, organize by location, create validation reports."
   
   Skill: waste-batch-extractor
   Output: Portfolio_Waste_Analysis_Batch.xlsx
   
   Result: 
   - Tab 1: Summary Dashboard
   - Tabs 2-13: Individual property data
   - Tab 14: Validation Report
   - Tab 15: Confidence Scores
   ```

3. **Identify Top Opportunities** (10 min)
   - Review Summary Dashboard for highest costs per door
   - Check Validation Report for data quality issues
   - Flag properties with >$35/unit/month for deep dive

4. **Deep Dive on Priority Properties** (12 min)
   - Select top 3 properties with highest optimization potential
   - Run wastewise-regulatory on each individually
   - Generate detailed optimization recommendations

5. **Create Portfolio Report** (5 min)
   ```
   Prompt: "Create a portfolio-level HTML dashboard showing all 12 
   properties with cost comparisons, optimization opportunities, and 
   ranking by cost per door."
   
   Skill: waste-visual-reporter (portfolio mode)
   Output: Regional_Portfolio_Dashboard.html
   ```

**Deliverables:**
- Master Excel with all locations (15+ tabs)
- Individual property analyses (top 3 properties)
- Portfolio-wide HTML dashboard
- Prioritized action list with ROI estimates

---

### Workflow C: New Development Project Planning

**Goal:** Complete trash management plan for 3-building mixed-use development

**Time Required:** 25-30 minutes

**Steps:**
1. **Gather Project Details** (5 min)
   - Building names, unit counts, square footage
   - Number of stories, ground floor units
   - Project address (for regulatory research)
   - Developer priorities (cost vs sustainability)

2. **Generate Comprehensive Plan** (8 min)
   ```
   Prompt: "Create a trash management plan for Bundy Blocks Development 
   in Los Angeles. 3 buildings: Building A (220 units, 8 stories), 
   Building B (180 units, 6 stories), Building C (220 units, 8 stories). 
   Ground floor has 15,000 SF restaurant space. Project goal: balanced 
   cost-effectiveness and sustainability."
   
   Skill: trash-management-planner
   Output: BundyBlocks_Trash_Plan.docx (14 sections)
   ```

3. **Create Visual Dashboard** (7 min)
   ```
   Prompt: "Generate interactive dashboard and spec sheet for this 
   development project. Show volume calculations, cost comparisons 
   (loose vs compacted), ROI analysis, and equipment specs."
   
   Skill: waste-dev-report-visualizer
   Output: 
   - BundyBlocks_Dashboard.html (6 charts, building selector)
   - BundyBlocks_Spec_Sheet.html (20+ pages, print-ready)
   ```

4. **Calculate Compactor ROI** (5 min)
   ```
   Prompt: "Analyze compactor ROI for Buildings A and C. Compare 
   scenarios: loose service, single compactor each, dual compactors."
   
   Skill: compactor-optimization
   Output: BundyBlocks_Compactor_Analysis.xlsx
   ```

5. **Compile Stakeholder Package** (5 min)
   - Executive Summary (from trash plan Section 1)
   - Visual Dashboard (for presentations)
   - Spec Sheet (for contractor bids)
   - ROI Analysis (for financial review)

**Deliverables:**
- 14-section trash management plan (25+ pages)
- Interactive HTML dashboard with building selector
- Comprehensive spec sheet (print-ready PDF)
- Compactor ROI analysis with payback periods
- Complete stakeholder presentation package

---

### Workflow D: Contract Renewal Preparation

**Goal:** Review existing contract, compare with market, prepare for renewal negotiation

**Time Required:** 20-25 minutes

**Steps:**
1. **Extract Current Contract Terms** (3 min)
   ```
   Prompt: "Extract all terms from this Republic Services contract. 
   Focus on: term length, rate increases, termination clauses, 
   liability, and indemnification."
   
   Skill: waste-contract-extractor
   Output: RepublicServices_Contract_Extract.xlsx
   ```

2. **Analyze Current Performance** (6 min)
   ```
   Prompt: "Analyze 12 months of invoices under this Republic Services 
   contract. Calculate actual cost per door, identify any rate increases 
   that occurred, and compare to contract terms."
   
   Skill: wastewise-regulatory
   Output: CurrentPerformance_Analysis.xlsx
   ```

3. **Benchmark Against Market** (5 min)
   - Review industry benchmarks ($18-35/door for garden-style)
   - Compare current cost per door to target
   - Identify optimization opportunities from analysis

4. **Calculate Leverage Points** (6 min)
   ```
   Prompt: "Based on this analysis, what are our negotiation leverage 
   points? Consider: payment history, contract length, multi-property 
   opportunities, and optimization potential."
   
   Use: wastewise-analytics-validated (OPTIMIZATION sheet)
   Review: Savings opportunities that could reduce costs
   ```

5. **Prepare Renewal Strategy** (5 min)
   - Document current contract weaknesses
   - List desired improvements (rate caps, termination rights)
   - Quantify optimization potential as negotiation tool
   - Set calendar reminders (90/60/30 days before expiration)

**Deliverables:**
- Contract terms extraction with risk scoring
- 12-month performance analysis
- Market benchmark comparison
- Negotiation strategy document
- Calendar reminders for renewal timeline

---

## Integration Patterns

### Pattern 1: Extraction → Analysis → Visualization

**Use Case:** Going from raw PDFs to stakeholder presentation

```
waste-contract-extractor
    ↓ (structured contract data)
wastewise-analytics-validated
    ↓ (complete Excel workbook)
waste-visual-reporter
    ↓ (interactive HTML dashboard)
[Share with stakeholders]
```

**Example:**
```bash
# Step 1
"Extract contract terms from WM_Contract.pdf"

# Step 2
"Analyze invoices using the extracted contract terms"

# Step 3
"Create HTML dashboard from this analysis"
```

---

### Pattern 2: Batch → Individual → Dashboard

**Use Case:** Portfolio assessment with deep dives

```
waste-batch-extractor
    ↓ (identify priority properties)
wastewise-regulatory × 3
    ↓ (detailed analysis of top 3)
waste-visual-reporter
    ↓ (portfolio dashboard)
[Executive presentation]
```

**Example:**
```bash
# Step 1
"Batch process these 15 properties"

# Step 2 (for each priority property)
"Full analysis for Columbia Square Living"
"Full analysis for Jardine Apartments"
"Full analysis for Sherman Plaza"

# Step 3
"Create portfolio dashboard comparing all properties"
```

---

### Pattern 3: Planning → Specification → Optimization

**Use Case:** New development projects

```
trash-management-planner
    ↓ (regulatory + service design)
waste-dev-report-visualizer
    ↓ (specs + cost analysis)
compactor-optimization
    ↓ (equipment ROI)
[Development team deliverables]
```

**Example:**
```bash
# Step 1
"Create trash plan for this development in Austin, TX"

# Step 2
"Generate spec sheet and dashboard for the plan"

# Step 3
"Calculate compactor ROI for all buildings"
```

---

## Best Practices

### Data Quality

**Invoice Preparation:**
- ✅ Scan at 300 DPI minimum for PDF invoices
- ✅ Use original files when possible (not photocopies)
- ✅ Include all pages (summary, detail, backup)
- ✅ Organize by month or date range
- ❌ Don't combine multiple properties in one file
- ❌ Don't redact key data (vendor, amounts, dates)

**Contract Preparation:**
- ✅ Upload complete contract (all exhibits, addendums)
- ✅ Ensure text is searchable (not scanned images)
- ✅ Include rate schedules and service level agreements
- ✅ Note any verbal amendments in a separate file
- ❌ Don't upload partial contracts
- ❌ Don't mix multiple contracts in one PDF

### Skill Selection

**When to use wastewise-regulatory-lite:**
- Single property, straightforward analysis
- Time-sensitive requests (<5 minutes needed)
- No complex regulatory requirements
- Property manager needs operational detail

**When to use wastewise-regulatory:**
- Need regulatory compliance research
- Multiple waste streams (trash, recycling, compost)
- Executive stakeholders need comprehensive report
- Contract terms need to be integrated

**When to use wastewise-analytics-validated:**
- Enterprise-grade quality control required
- Financial audit or compliance review
- Complex multi-building properties
- Need detailed validation reporting

### Prompt Engineering

**Good Prompts:**
```
"Analyze Columbia Square Living invoices (200 units, Portland OR) 
with regulatory compliance. Focus on compactor optimization."

"Batch process 8 properties in California. Flag any that exceed 
$35/unit/month or have contamination charges >5% of spend."

"Create a trash plan for this Austin development with emphasis on 
AB 341 recycling compliance and cost optimization."
```

**Poor Prompts:**
```
"Analyze these invoices" (missing property details)

"Do waste analysis" (no specific skill trigger)

"Check my files" (unclear objective)
```

### Output Review

**Always Check:**
1. **QUALITY_CHECK tab** - Verify all validations passed
2. **SUMMARY_FULL tab** - Confirm 2026 savings projection makes sense
3. **OPTIMIZATION tab** - Review recommendations against criteria
4. **REGULATORY_COMPLIANCE tab** - Check confidence level (HIGH/MEDIUM/LOW)

**Red Flags:**
- ⚠️ Confidence level: LOW (requires manual review)
- ⚠️ Validation failures in QUALITY_CHECK
- ⚠️ Cost per door >$50/month (unusual for most properties)
- ⚠️ Yards per door >3.0 (check for data extraction errors)

---

## Troubleshooting

### Issue: Skill not triggering correctly

**Symptoms:**
- Claude doesn't invoke the skill
- Wrong skill is invoked
- Generic response instead of skill execution

**Solutions:**
1. Use specific trigger keywords from skill descriptions
2. Mention the skill name explicitly: "Use the wastewise-regulatory skill"
3. Upload files before prompting (skills need context)
4. Check that skill is properly installed in ~/.claude/skills/

### Issue: Data extraction errors

**Symptoms:**
- Missing invoices in output
- Incorrect amounts or dates
- "Unable to extract" warnings

**Solutions:**
1. Verify PDFs are searchable (not scanned images)
2. Check file names don't have special characters
3. Ensure invoice format is recognizable (standard layouts work best)
4. Try uploading one file at a time for debugging
5. Check Vision API quota (if using Claude API)

### Issue: Validation failures

**Symptoms:**
- "VALIDATION FAILED" message
- Missing required sheets in output
- Inconsistent data across sheets

**Solutions:**
1. Review which specific validation failed
2. Check input data completeness (units, dates, amounts)
3. Ensure contract is uploaded if CONTRACT_TERMS expected
4. Verify compactor data present if HAUL_LOG expected
5. Re-run with validated input data

### Issue: Low regulatory confidence

**Symptoms:**
- "MANUAL REVIEW REQUIRED" warning
- Confidence level: LOW in REGULATORY_COMPLIANCE tab
- Missing ordinance citations

**Solutions:**
1. Verify property address is complete and accurate
2. Search manually for city waste ordinances
3. Check if municipality has recent regulation changes
4. Contact local waste authority directly for clarification
5. Document findings and override LOW confidence if verified

### Issue: Optimization recommendations don't apply

**Symptoms:**
- Compactor monitoring recommended but already installed
- Contamination reduction suggested but charges are minimal
- Recommendations don't match property type

**Solutions:**
1. Review OPTIMIZATION tab criteria
2. Verify data extraction captured all service types
3. Check if custom rates differ from standard assumptions
4. Manually override recommendations in your final report
5. Provide feedback to improve skill logic

---

## Advanced Tips

### Chaining Skills Efficiently

**Tip:** Use consistent file naming between skill outputs
```bash
# Step 1: Contract extraction
Output: Property_Contract.xlsx

# Step 2: Reference in next prompt
"Analyze invoices using Property_Contract.xlsx from the previous step"
```

### Customizing Outputs

**Tip:** Request specific formatting in your prompts
```
"Generate dashboard with Greystar purple branding (#6B46C1) and 
include only expense analysis and optimization tabs."
```

### Batch Processing at Scale

**Tip:** Process in groups of 5-10 properties for optimal performance
```
"Batch process properties 1-10 first, then I'll provide 11-20."
```

### Exporting for Different Audiences

**Tip:** Generate multiple formats from one analysis
```
"From this analysis, create:
1. Excel for property managers (detailed)
2. HTML dashboard for regional directors (visual)
3. PDF summary for executives (high-level)"
```

---

## Conclusion

This ecosystem is designed to transform your waste management workflows from time-intensive manual processes into efficient, automated analysis pipelines. By following these workflows and best practices, you can:

- **Save 80-90% of analysis time**
- **Generate unlimited professional reports**
- **Identify 500-900% ROI optimization opportunities**
- **Maintain enterprise-grade quality control**

For questions, custom workflows, or feedback:  
**Richard Bates, Director of Waste & Diversion Strategies**  
**Advantage Waste / Greystar Real Estate Partners**

---

**Last Updated:** November 14, 2025  
**Version:** 2.0  
**Next Review:** Q1 2026
