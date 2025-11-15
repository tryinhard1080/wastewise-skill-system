# WasteWise Analytics - Validation Checklist

This document provides a comprehensive reference for all validation checks performed by the WasteWise Analytics - Validated Edition skill.

---

## Overview

The validation framework performs **6 major categories** of checks with **30+ individual validations** before generating output. If ANY critical validation fails, the workbook will NOT be generated.

---

## 1. CONTRACT VALIDATION

### 1.1 Contract Detection
- [ ] Check if any uploaded file contains "contract" or "agreement" in filename
- [ ] Verify contract file is readable (not corrupted)
- [ ] Confirm file type is supported (PDF, Word, scanned)

### 1.2 Clause Extraction (CRITICAL)
**If contract provided, ALL of these must pass:**

- [ ] Minimum 3 clauses extracted from contract
- [ ] Clauses categorized into 7 standard types:
  - [ ] Term & Renewal
  - [ ] Rate Increases
  - [ ] Termination
  - [ ] Liability
  - [ ] Service Level
  - [ ] Force Majeure
  - [ ] Indemnification

**FAILURE CRITERIA:**
```
❌ Less than 3 clauses extracted
❌ No verbatim text in any clause
❌ Contract file provided but no clauses found
```

### 1.3 Verbatim Text Validation
For each extracted clause:
- [ ] Contains 'verbatim_text' field
- [ ] Verbatim text is at least 20 characters
- [ ] Text appears to be actual contract language (not paraphrased)

**WARNING CRITERIA:**
```
⚠️  Clause has < 20 characters of verbatim text
⚠️  Clause text appears paraphrased
```

### 1.4 Calendar Reminders
- [ ] Calendar reminders extracted for critical dates
- [ ] Each reminder has: date, action, criticality
- [ ] Reminder dates are in the future (or within contract term)

**WARNING CRITERIA:**
```
⚠️  No calendar reminders found (check for termination windows)
```

### 1.5 Risk Assessment
For each clause:
- [ ] Risk severity assigned (high/medium/low)
- [ ] Impact statement provided
- [ ] Action required specified

### 1.6 Sheet Generation
**CRITICAL REQUIREMENT:**
- [ ] If contract provided → CONTRACT_TERMS sheet MUST be created
- [ ] Sheet includes both Calendar Reminders and Contract Clauses sections

**FAILURE CRITERIA:**
```
❌ Contract provided but CONTRACT_TERMS sheet not created
❌ CONTRACT_TERMS sheet created but contract not provided
```

---

## 2. OPTIMIZATION VALIDATION

All optimization recommendations must meet **strict, validated criteria**. Invalid optimizations are rejected.

### 2.1 Compactor Optimization

**Trigger Criteria (ALL must be true):**
- [ ] Property has compactor service
- [ ] Average tonnage per haul < 6.0 tons
- [ ] Tonnage data available for at least 3 months

**14-Day Constraint Validation (CRITICAL):**
- [ ] Target haul frequency calculated
- [ ] Days between pickups = 30 / (Target Hauls Per Month)
- [ ] Days between pickups ≤ 14 days

**FAILURE CRITERIA:**
```
❌ Avg tonnage ≥ 6.0 tons/haul
❌ Days between optimized pickups > 14 days
❌ Insufficient tonnage data
```

**Example Valid Recommendation:**
```
Current: 10.5 hauls/month at 4.7 tons avg
Target: 6 hauls/month at 8.0 tons avg
Days between: 30 / 6 = 5 days ✅ (< 14 days)
```

**Example Invalid Recommendation:**
```
Current: 8 hauls/month at 5.8 tons avg
Target: 2 hauls/month at 8.0 tons avg
Days between: 30 / 2 = 15 days ❌ (> 14 days)
```

### 2.2 Per-Compactor Pricing Validation

**CRITICAL: Costs are PER COMPACTOR UNIT**

- [ ] Number of compactors identified
- [ ] Install cost = $300 × number of compactors
- [ ] Annual monitoring = $200/month × 12 × number of compactors

**FAILURE CRITERIA:**
```
❌ Install cost ≠ ($300 × num_compactors)
❌ Annual monitoring ≠ ($2,400 × num_compactors)
```

**Examples:**
```
1 compactor:
  Install: $300 ✅
  Annual: $2,400 ✅

2 compactors:
  Install: $600 ✅
  Annual: $4,800 ✅

Property-level (wrong):
  Install: $300 for all ❌
  Annual: $2,400 for all ❌
```

### 2.3 Contamination/Overage Reduction

**Trigger Criteria:**
- [ ] Contamination charges identified in invoices
- [ ] Overage charges identified in invoices
- [ ] Combined charges ≥ 3% of total spend

**Calculation Validation:**
- [ ] Total contamination charges summed across all invoices
- [ ] Total overage charges summed across all invoices
- [ ] Percentage = (Contamination + Overage) / Total Spend × 100
- [ ] Percentage ≥ 3.0%

**FAILURE CRITERIA:**
```
❌ Contamination + overage < 3% of spend
❌ No contamination/overage charges found
```

**Example Valid:**
```
Total Spend: $70,000
Contamination: $1,500
Overage: $800
Percentage: ($1,500 + $800) / $70,000 × 100 = 3.3% ✅
```

**Example Invalid:**
```
Total Spend: $70,000
Contamination: $800
Overage: $600
Percentage: ($800 + $600) / $70,000 × 100 = 2.0% ❌
```

### 2.4 Bulk Trash Subscription

**Trigger Criteria:**
- [ ] Bulk service charges identified in invoices
- [ ] Average monthly bulk charges ≥ $500

**Calculation Validation:**
- [ ] Sum all bulk charges across invoices
- [ ] Divide by number of months
- [ ] Average ≥ $500/month

**FAILURE CRITERIA:**
```
❌ Average bulk charges < $500/month
❌ No bulk service charges found
```

### 2.5 Optimization Count Limit
- [ ] Maximum 3 optimization types recommended
- [ ] Only include optimizations meeting ALL trigger criteria
- [ ] Each optimization has detailed calculation breakdown

---

## 3. FORMULA VALIDATION

All calculations must use correct formulas based on equipment type.

### 3.1 Yards Per Door - Standard Dumpsters

**Formula:**
```
Yards Per Door = (Qty × Size × Freq × 4.33) / Units
```

**Validation:**
- [ ] Quantity (number of containers) extracted
- [ ] Size (yards) extracted
- [ ] Frequency (pickups/week) extracted
- [ ] Units (property unit count) provided
- [ ] Calculation matches formula

**Example:**
```
2 containers × 8 YD × 3x/week × 4.33 / 200 units = 2.08 yards/door ✅
```

### 3.2 Yards Per Door - Compactors (CRITICAL)

**Formula:**
```
Yards Per Door = (Total Tons × 14.49) / Units
```

**The 14.49 Factor:**
```
tons × 2,000 lbs/ton / 138 lbs/yd³ = 14.49 yards per ton
```

**Validation:**
- [ ] Service type identified as "compactor"
- [ ] Tonnage data extracted from invoice
- [ ] Formula uses tonnage (NOT container size)
- [ ] Calculation matches formula

**FAILURE CRITERIA:**
```
❌ Compactor calculation uses container size instead of tonnage
❌ Formula doesn't use 14.49 conversion factor
```

**Example Valid:**
```
10 tons × 14.49 / 200 units = 0.72 yards/door ✅
```

**Example Invalid:**
```
1 container × 40 YD × 3x/week × 4.33 / 200 units ❌
(Wrong - uses container size for compactor)
```

### 3.3 Cost Per Door

**Formula:**
```
Cost Per Door = Total Monthly Cost / Units
```

**Validation:**
- [ ] Total cost includes all charges (disposal + haul + rental + bulk)
- [ ] Units match property info
- [ ] Calculation accurate to 2 decimal places

### 3.4 Capacity Utilization (Compactors)

**Formula:**
```
Capacity Utilization = (Tons Per Haul / Target Tons) × 100%
```

**Validation:**
- [ ] Target tons = 8.0 (industry standard)
- [ ] Actual tons per haul calculated from invoices
- [ ] Percentage calculated correctly

**Interpretation:**
```
< 60%: POOR (monitoring needed)
60-75%: GOOD
75-85%: OPTIMAL
> 85%: OVER-FILLED
```

### 3.5 Days Between Pickups

**Formula:**
```
Days Between Pickups = 30 / (Hauls Per Month)
```

**Validation:**
- [ ] Hauls per month calculated from invoice frequency
- [ ] Days calculated correctly
- [ ] Used to enforce 14-day maximum constraint

---

## 4. SHEET STRUCTURE VALIDATION

### 4.1 Core Sheets (ALWAYS Required)
- [ ] SUMMARY_FULL created
- [ ] EXPENSE_ANALYSIS created
- [ ] OPTIMIZATION created
- [ ] QUALITY_CHECK created
- [ ] DOCUMENTATION_NOTES created

### 4.2 Conditional Sheet: HAUL_LOG

**Creation Criteria:**
- [ ] At least one invoice has service type containing "compactor"
- [ ] Tonnage data available

**FAILURE CRITERIA:**
```
❌ Property has compactor but HAUL_LOG not created
❌ HAUL_LOG created but property has no compactor
```

### 4.3 Conditional Sheet: CONTRACT_TERMS

**Creation Criteria:**
- [ ] Contract file was uploaded
- [ ] At least 3 clauses extracted

**FAILURE CRITERIA:**
```
❌ Contract provided but CONTRACT_TERMS not created
❌ CONTRACT_TERMS created but no contract provided
```

### 4.4 Sheet Count Validation

**Expected Counts:**
```
No compactor, no contract: 5 sheets ✅
Compactor, no contract: 6 sheets ✅
No compactor, contract: 6 sheets ✅
Compactor + contract: 7 sheets ✅
```

**FAILURE CRITERIA:**
```
❌ Less than 5 sheets created
❌ More than 7 sheets created
❌ Sheet count doesn't match data conditions
```

### 4.5 SUMMARY_FULL Structure
- [ ] 2026 savings one-liner at top of sheet
- [ ] Property metrics section
- [ ] Container configuration integrated (not separate sheet)
- [ ] Optimization breakdown included

### 4.6 EXPENSE_ANALYSIS Structure
- [ ] Month-by-month breakdown
- [ ] COLUMN format (months across the top)
- [ ] Expense categories as rows
- [ ] Cost per door for each month

**FAILURE CRITERIA:**
```
❌ Months arranged as rows (should be columns)
❌ Missing cost per door breakdown
```

---

## 5. DATA COMPLETENESS VALIDATION

### 5.1 Property Information
**Required Fields:**
- [ ] Property name provided
- [ ] Unit count provided and > 0
- [ ] Service period specified (start/end dates)

**FAILURE CRITERIA:**
```
❌ Property name missing or empty
❌ Unit count = 0 or missing
```

### 5.2 Invoice Data
**Minimum Requirements:**
- [ ] At least 1 invoice processed
- [ ] Recommended: 3-6 months minimum

**Required Fields Per Invoice:**
- [ ] Date extracted and parsed
- [ ] Total amount extracted and > 0
- [ ] Service type identified
- [ ] Vendor name extracted

**Optional But Important:**
- [ ] Account number (for multi-account properties)
- [ ] Tonnage (for compactors)
- [ ] Container specifications
- [ ] Breakdown by charge type

**WARNING CRITERIA:**
```
⚠️  Less than 3 months of data
⚠️  Missing tonnage data on compactor invoices
⚠️  Missing account numbers on multi-account property
```

### 5.3 Compactor-Specific Data
If property has compactor:
- [ ] Tonnage data for at least 3 invoices
- [ ] Haul dates extracted
- [ ] Cost per haul calculated

### 5.4 Contract Data
If contract provided:
- [ ] Contract effective date extracted
- [ ] Contract term length extracted
- [ ] Vendor name matches invoice vendor

---

## 6. CROSS-VALIDATION

### 6.1 Summary vs. Expense Analysis
- [ ] Total spend in SUMMARY matches EXPENSE_ANALYSIS total
- [ ] Monthly averages consistent
- [ ] Cost per door calculations match

**Tolerance: ±$0.01**

### 6.2 Haul Log vs. Optimization
- [ ] Tonnage totals in HAUL_LOG match optimization calculations
- [ ] Haul count matches invoice frequency
- [ ] Average tons per haul consistent

### 6.3 Contract Terms vs. Calendar Reminders
- [ ] Reminder dates derived from contract dates
- [ ] Termination window dates align with contract term
- [ ] Critical dates flagged appropriately

### 6.4 Cost Per Door Consistency
- [ ] SUMMARY cost per door
- [ ] EXPENSE_ANALYSIS monthly cost per door
- [ ] All calculations use same unit count
- [ ] Differences explained (monthly variance)

---

## Validation Report Format

### Success Report
```
🔐 STEP 3: Validation Gate - Running All Checks...
------------------------------------------------------------

📊 VALIDATION RESULTS:
   ✅ Contract Validation: PASSED (7 clauses extracted, 2 reminders)
   ✅ Optimization Validation: PASSED (2 opportunities identified)
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED (7 sheets expected)
   ✅ Data Completeness Validation: PASSED (12 invoices)
   ✅ Cross Validation: PASSED

============================================================
VALIDATION SUMMARY:
   Total Checks: 6
   Passed: 6
   Failed: 0
   Warnings: 0
============================================================

✅ ALL VALIDATIONS PASSED - Proceeding to output generation
```

### Failure Report
```
🔐 STEP 3: Validation Gate - Running All Checks...
------------------------------------------------------------

📊 VALIDATION RESULTS:
   ❌ Contract Validation: FAILED
   ✅ Optimization Validation: PASSED
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED
   ✅ Data Completeness Validation: PASSED
   ✅ Cross Validation: PASSED

❌ ERRORS FOUND:
   ❌ CONTRACT EXTRACTION FAILED: Only 2 clauses found. Expected at least 3 of: 
      Term & Renewal, Rate Increases, Termination, Liability, Service Level, 
      Force Majeure, Indemnification

============================================================
VALIDATION SUMMARY:
   Total Checks: 6
   Passed: 5
   Failed: 1
   Warnings: 0
============================================================

🛑 VALIDATION FAILED - Cannot proceed to output generation
   Please fix the errors above and re-run the analysis
```

---

## Implementation Checklist

For developers implementing this validation framework:

### Pre-Generation Phase
- [ ] Extract all data from documents
- [ ] Identify data conditions (compactor, contract)
- [ ] Calculate all optimizations
- [ ] Instantiate WasteWiseValidator class

### Validation Phase
- [ ] Run validate_all() method
- [ ] Capture validation_report dictionary
- [ ] Check passed boolean flag
- [ ] Display results to user

### Gate Decision
- [ ] If passed = True → proceed to workbook generation
- [ ] If passed = False → halt, display errors, return failure status

### Post-Generation Phase
- [ ] Include validation report in QUALITY_CHECK sheet
- [ ] Add validation timestamp
- [ ] Embed validation results in workbook metadata

---

## Maintenance & Updates

### Adding New Validations
When adding new validation checks:
1. Add to appropriate category in WasteWiseValidator class
2. Update validation_results dictionary structure
3. Include in generate_validation_report()
4. Update this VALIDATION_CHECKLIST.md
5. Test with both passing and failing scenarios

### Modifying Validation Criteria
If thresholds change (e.g., compactor trigger changes from 6 to 5 tons):
1. Update trigger criteria in validate_optimizations()
2. Update SKILL.md documentation
3. Update this checklist
4. Update error messages to reflect new criteria

---

## Testing Scenarios

### Test Case 1: Full Valid Analysis
- ✅ 12 months of invoices
- ✅ Contract with all 7 clause types
- ✅ Compactor with tonnage below 6 tons/haul
- ✅ Contamination above 3%
- **Expected**: 7 sheets, all validations pass

### Test Case 2: No Contract
- ✅ 6 months of invoices
- ❌ No contract
- ✅ Compactor with tonnage below 6 tons/haul
- **Expected**: 6 sheets (no CONTRACT_TERMS), all validations pass

### Test Case 3: Invalid Compactor Optimization
- ✅ 6 months of invoices
- ✅ Contract
- ❌ Compactor with avg 7 tons/haul (above threshold)
- **Expected**: Compactor optimization rejected, other validations pass

### Test Case 4: Contract Extraction Failure
- ✅ 6 months of invoices
- ❌ Contract file with only 2 extractable clauses
- **Expected**: Contract validation FAILS, output halted

### Test Case 5: 14-Day Constraint Violation
- ✅ 6 months of invoices
- ✅ Compactor with 5 tons/haul average
- ❌ Optimization would require 16-day interval
- **Expected**: Compactor optimization rejected, validation fails

---

## Appendix: Common Error Messages

### Contract Errors
```
❌ CONTRACT EXTRACTION FAILED: Only 1 clauses found. Expected at least 3
❌ CONTRACT_TERMS sheet REQUIRED but not in sheet list (contract provided)
⚠️  Clause 'Term & Renewal' may not have verbatim text extracted
⚠️  No calendar reminders found in contract
```

### Optimization Errors
```
❌ COMPACTOR OPTIMIZATION INVALID: Avg tons 6.50 is not below 6.0 tons/haul threshold
❌ COMPACTOR OPTIMIZATION INVALID: Days between pickups (15.0) exceeds 14-day maximum
❌ INSTALL COST ERROR: Expected $600 ($300 × 2 compactors), got $300
❌ CONTAMINATION REDUCTION INVALID: 2.5% is below 3% threshold
❌ BULK SUBSCRIPTION INVALID: $450/month is below $500 threshold
```

### Formula Errors
```
❌ YARDS PER DOOR FORMULA ERROR (Compactor): Expected 0.725, got 2.080
❌ COST PER DOOR FORMULA ERROR: Expected $23.45, got $25.00
```

### Structure Errors
```
❌ HAUL_LOG sheet REQUIRED but not in sheet list (property has compactor)
❌ Less than 5 sheets created
```

### Data Errors
```
❌ MISSING PROPERTY DATA: 'unit_count' is required
❌ NO INVOICE DATA: At least one invoice required
❌ INVOICE 3 MISSING: 'date' is required
```

### Cross-Validation Errors
```
❌ CROSS-VALIDATION ERROR: Contamination % mismatch. Calculated: 3.5%, Stated: 4.2%
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-02  
**Skill Version**: wastewise-analytics-validated v1.0
