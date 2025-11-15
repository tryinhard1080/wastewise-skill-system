# WasteWise Analytics - Validated Edition - Setup Guide

## Installation

**For Claude.ai (Browser)**
1. Download the skill folder as a zip file: `wastewise-analytics-validated.zip`
2. Go to Settings → Capabilities → Skills
3. Click "Upload Skill" and select the zip file
4. Skill will appear in your available skills list

**For Claude Code (CLI)**
```bash
# Copy to personal skills directory
cp -r wastewise-analytics-validated ~/.claude/skills/

# Or add to project-specific skills
cp -r wastewise-analytics-validated .claude/skills/
```

**For Claude API**
- Use the `/v1/skills` endpoint to upload the skill package
- Reference in API calls with skill name: `wastewise-analytics-validated`

## What's Included

- `SKILL.md` - Main skill definition with validation framework
- `demo-prompt.txt` - Quick reference for usage
- `VALIDATION_CHECKLIST.md` - Detailed validation requirements
- `SETUP.md` - This file

## Quick Start

### Step 1: Prepare Your Files

You need:
- **Waste invoices** (PDF/scanned) - Minimum 3-6 months recommended
- **Waste service contract** (optional but recommended for CONTRACT_TERMS sheet)
- **Property details**: Name and unit count

### Step 2: Upload Files

Upload all invoice PDFs and the contract file to Claude. The skill will automatically detect:
- Which files are invoices vs contracts
- Whether property has compactor (determines HAUL_LOG sheet)
- Contract presence (determines CONTRACT_TERMS sheet)

### Step 3: Invoke the Skill

Use this prompt format:
```
"I just uploaded [X] months of waste invoices and a service contract for [Property Name] 
([Units] units). Run the validated WasteWise analysis."
```

### Step 4: Review Validation Report

The skill will run comprehensive validation checks and show you:
```
📊 VALIDATION RESULTS:
   ✅ Contract Validation: PASSED
   ✅ Optimization Validation: PASSED
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED
   ✅ Data Completeness Validation: PASSED
   ✅ Cross Validation: PASSED
```

**If validation fails**, you'll see detailed errors:
```
❌ ERRORS FOUND:
   ❌ CONTRACT EXTRACTION FAILED: Only 1 clauses found. Expected at least 3
   ❌ COMPACTOR OPTIMIZATION INVALID: Avg tons 6.50 is not below 6.0 tons/haul threshold
```

### Step 5: Download Results

If all validations pass:
- Download the Excel workbook from `/mnt/user-data/outputs/`
- Review the QUALITY_CHECK sheet for validation details
- Check CONTRACT_TERMS sheet for calendar reminders

## Validation Framework

This skill includes a **mandatory validation gate** with 6 categories:

### 1. Contract Validation ✅
- Verifies CONTRACT_TERMS sheet is created when contract provided
- Checks for minimum 3 clause extractions from 7 categories
- Validates calendar reminders for critical dates
- Ensures verbatim text extraction (not paraphrased)

### 2. Optimization Validation ✅
- Compactor: Only if avg < 6 tons/haul + 14-day max constraint
- Contamination: Only if > 3-5% of spend
- Bulk subscription: Only if > $500/month average
- Per-compactor pricing validation

### 3. Formula Validation ✅
- Yards per door: Correct formula by equipment type
- Cost per door calculations
- Capacity utilization percentages
- Days between pickups

### 4. Sheet Structure Validation ✅
- Verifies expected sheets based on data
- HAUL_LOG required if compactor present
- CONTRACT_TERMS required if contract provided
- Minimum 5 sheets, maximum 7 sheets

### 5. Data Completeness Validation ✅
- Property name and unit count required
- Invoice dates, amounts, service types
- Tonnage data (if compactor)
- Vendor information

### 6. Cross-Validation ✅
- Summary totals match expense analysis
- Optimization calculations match invoice data
- Contract dates align with calendar reminders
- Cost per door consistent across sheets

## Understanding Validation Results

### ✅ All Checks Passed
```
✅ ALL VALIDATIONS PASSED - Proceeding to output generation
```
- Workbook will be generated
- All sheets created according to requirements
- Quality report included in QUALITY_CHECK sheet

### ❌ Validation Failed
```
🛑 VALIDATION FAILED - Cannot proceed to output generation
   Please fix the errors above and re-run the analysis
```
- NO workbook will be generated
- Review error messages for specific issues
- Fix issues and re-run with corrected data

### ⚠️ Warnings
- Workbook still generated
- Review warnings for potential data quality issues
- May indicate missing optional data

## Expected Output Structure

### With Contract + Compactor (7 sheets):
1. SUMMARY_FULL
2. EXPENSE_ANALYSIS
3. OPTIMIZATION
4. QUALITY_CHECK ← Validation report
5. DOCUMENTATION_NOTES
6. HAUL_LOG ← Compactor present
7. CONTRACT_TERMS ← Contract provided

### With Contract Only (6 sheets):
1. SUMMARY_FULL
2. EXPENSE_ANALYSIS
3. OPTIMIZATION
4. QUALITY_CHECK
5. DOCUMENTATION_NOTES
6. CONTRACT_TERMS

### No Contract (5 sheets minimum):
1. SUMMARY_FULL
2. EXPENSE_ANALYSIS
3. OPTIMIZATION
4. QUALITY_CHECK
5. DOCUMENTATION_NOTES

## CONTRACT_TERMS Sheet Structure

When a contract is provided, expect:

### Calendar Reminders Section
- **Date** - When action must be taken
- **Action Required** - Specific task (e.g., "Submit termination notice")
- **Criticality** - HIGH/MEDIUM/LOW
- **Days Until** - Countdown to deadline
- **Notes** - Additional guidance

### Contract Clauses Section (7 Categories)
1. **Term & Renewal** - Contract length and auto-renewal conditions
2. **Rate Increases** - Price adjustment provisions
3. **Termination** - Exit conditions and notice requirements
4. **Liability** - Limitation of liability clauses
5. **Service Level** - Performance standards and guarantees
6. **Force Majeure** - Acts of God and service disruptions
7. **Indemnification** - Hold harmless provisions

Each clause includes:
- **Category** - Clause type
- **Verbatim Contract Language** - Exact text from contract
- **Risk Level** - HIGH/MEDIUM/LOW (color-coded)
- **Impact** - Business consequence
- **Recommended Action** - Mitigation steps

## Troubleshooting

### Issue: "CONTRACT EXTRACTION FAILED: Only X clauses found"
**Solution**: 
- Ensure uploaded file is actually the service contract
- Check that contract PDF is readable (not just scanned image)
- Contract should have clear section headers for clauses

### Issue: "COMPACTOR OPTIMIZATION INVALID: Avg tons X.XX is not below 6.0"
**Solution**:
- This is working correctly - optimization only recommended when needed
- If avg is above 6 tons/haul, no compactor monitoring needed
- Validation prevents unnecessary recommendations

### Issue: "HAUL_LOG sheet REQUIRED but not in sheet list"
**Solution**:
- Ensure invoices include tonnage data
- Check that service type is correctly identified as "compactor"
- May need to explicitly specify compactor in property details

### Issue: "Days between pickups exceeds 14-day maximum"
**Solution**:
- Validation correctly blocked invalid optimization
- 14-day constraint is odor management requirement
- Optimization will be adjusted or excluded

## Best Practices

1. **Upload All Available Data**
   - More months = better pattern analysis (12 months ideal)
   - Include contract whenever possible for risk analysis
   - Provide accurate property details upfront

2. **Review Validation Report First**
   - Check QUALITY_CHECK sheet before reviewing data
   - Address any warnings for improved accuracy
   - Validation timestamp shows when checks were run

3. **Understand Calendar Reminders**
   - Set actual calendar reminders in Outlook/Google
   - Critical dates often have narrow windows (60-90 days)
   - Missing termination windows can lock you into multi-year renewals

4. **Verify Optimization Criteria**
   - Understand why each optimization was/wasn't recommended
   - Validation ensures recommendations are implementable
   - Contact vendors listed for implementation support

## Support & Questions

For issues with the validation framework or unexpected results:
- Review the QUALITY_CHECK sheet for detailed diagnostics
- Check VALIDATION_CHECKLIST.md for complete requirements
- Ensure all uploaded files are correct document types

## Version History

- **v1.0** - Initial validated edition with 6-category validation framework
