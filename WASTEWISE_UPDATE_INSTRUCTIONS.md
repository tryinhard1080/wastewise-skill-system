# WasteWise SKILL File Update - Complete Instructions

**Purpose:** Update SKILL\__2_.md and wastewise_expense_format_template.md to standardized formats  
**Date:** November 13, 2025  
**Context:** Context window constraints require manual update approach

---

## SUMMARY OF CHANGES

### File 1: SKILL\__2_.md

**Current:** 2,503 lines  
**Updated:** ~3,200 lines  
**Changes:**

1. Update workbook structure (line ~852) - Change from 8 to 9 tabs
2. REPLACE EXPENSE_ANALYSIS function (lines 1019-1114) - Column → Row format
3. REPLACE REGULATORY_COMPLIANCE function (lines 1119-1400) - Basic → Orlando format
4. ADD 3 new tab functions after regulatory (line ~1401)
5. ADD helper functions

### File 2: wastewise_expense_format_template.md

**Action:** REPLACE entire file with row-based format

---

## STEP-BY-STEP INSTRUCTIONS

### STEP 1: Update Workbook Structure (Line ~852)

**Find this code (around line 852):**

```python
def create_wastewise_workbook(property_data, invoice_data, contract_data,
                               regulatory_data, optimization_results):
    """
    Generate complete Excel workbook with 8 tabs
```

**REPLACE the docstring with:**

```python
def create_wastewise_workbook(property_data, invoice_data, contract_data,
                               regulatory_data, optimization_results):
    """
    Generate complete Excel workbook with 9 tabs

    Tab structure:
    1. SUMMARY_FULL - Detailed findings (starts with 2026 savings)
    2. EXPENSE_ANALYSIS - Each invoice as row (ROW-BASED format)
    3. HAUL_LOG - Compactor pickups (only if compactor present)
    4. OPTIMIZATION - Three opportunities with calculations
    5. CONTRACT_TERMS - Risk analysis (only if contract provided)
    6. REGULATORY_COMPLIANCE - Orlando-style ordinance compliance
    7. LEASE-UP_NOTES - Lease-up phase assessment (if applicable)
    8. DOCUMENTATION_NOTES - Vendor contacts and formulas
    9. QUALITY_CHECK - Validation summary
    """
```

**Then update the function body to add new tabs (find the section after `create_regulatory_compliance_sheet` call):**

Add these lines BEFORE the `return wb` statement:

```python
    # New tabs - check if lease-up
    equipment_type = 'COMPACTOR' if has_compactor(invoice_data) else 'DUMPSTER'

    if equipment_type == 'COMPACTOR':
        haul_log = generate_haul_log(invoice_data)
        total_tons = sum([h['tonnage'] for h in haul_log])
        yards_per_door = (total_tons * 14.49) / property_data['units']
    else:
        qty, size, freq = extract_dumpster_info(invoice_data)
        yards_per_door = (qty * size * freq * 4.33) / property_data['units']

    prop_type_key = property_data['property_type'].lower().replace('-', '_')
    benchmark_min = BENCHMARKS.get(prop_type_key, {}).get('yards_per_door', (2.0, 2.5))[0]
    variance = ((yards_per_door - benchmark_min) / benchmark_min) * 100

    if variance < -40:
        create_lease_up_notes_sheet(wb, property_data, invoice_data)

    create_documentation_notes_sheet(wb, property_data, invoice_data, contract_data)
    create_quality_check_sheet(wb, validation_results)

    return wb
```

---

### STEP 2: REPLACE EXPENSE_ANALYSIS Function (Lines 1019-1114)

**Find this function:**

```python
def create_expense_analysis_sheet(wb, invoice_data, property_data):
    """
    CRITICAL FORMAT: Months as COLUMNS, expense types as ROWS
```

**REPLACE entire function (from `def create_expense_analysis_sheet` to the closing of its code block, ending before the next `###` or `def`) with the code from:**

`/mnt/user-data/outputs/EXPENSE_ANALYSIS_ROW_FORMAT.md`

**The replacement function starts with:**

```python
def create_expense_analysis_sheet(wb, invoice_data, property_data):
    """
    CRITICAL FORMAT: Each INVOICE as a ROW (NOT column-based)

    Columns: Month | Vendor | Service Type | Invoice Number | Amount | Cost/Door | Notes
```

**Key: This changes from COLUMN-based (months as columns) to ROW-based (each invoice as row)**

---

### STEP 3: REPLACE REGULATORY_COMPLIANCE Function (Lines 1119-1400)

**Find this function:**

```python
def create_regulatory_compliance_sheet(wb, regulatory_data, property_data):
    """
    Create comprehensive regulatory compliance documentation

    8 required sections:
```

**REPLACE entire function with the code from:**

`/mnt/user-data/outputs/REGULATORY_COMPLIANCE_CORRECT_FORMAT.md`

**The replacement function starts with:**

```python
def create_regulatory_compliance_sheet(wb, regulatory_data, property_data):
    """
    Create comprehensive regulatory compliance documentation
    Format matches Orlando ordinance compliance example

    Sections:
    1. Header with property info and ordinance status
    2. Ordinance Overview
    3. Mandatory Requirements (table)
```

**Key: This changes to Orlando-style format with tables and structured sections**

---

### STEP 4: ADD 3 New Tab Functions (After line ~1400)

**Location:** After the `create_regulatory_compliance_sheet` function closes, BEFORE Section 6 starts

**Insert these 3 complete functions from:**

`/mnt/user-data/outputs/NEW_TAB_FUNCTIONS.md`

The functions to add are:

1. `create_lease_up_notes_sheet(wb, property_data, invoice_data)`
2. `create_documentation_notes_sheet(wb, property_data, invoice_data, contract_data)`
3. `create_quality_check_sheet(wb, validation_results)`
4. `extract_dumpster_info(invoice_data)` - helper function

**Insert Point:** Right after the closing of `create_regulatory_compliance_sheet` function, add:

````python
---

### LEASE-UP_NOTES Sheet

```python
def create_lease_up_notes_sheet(wb, property_data, invoice_data):
    """
    Create dedicated lease-up phase assessment tab
    ...
````

_(Then paste the complete function code from NEW_TAB_FUNCTIONS.md)_

---

### STEP 5: UPDATE wastewise_expense_format_template.md

**Action:** REPLACE the entire file

**Original:** Column-based format example (156 lines)  
**New:** Row-based format example (~200 lines)

**Source:** `/mnt/user-data/outputs/EXPENSE_ANALYSIS_ROW_FORMAT.md`

**Look for the section titled:**

```markdown
## Updated EXPENSE FORMAT TEMPLATE

**Replace the entire wastewise_expense_format_template.md with this:**
```

**Copy everything from that point (the complete markdown template) and replace the entire contents of wastewise_expense_format_template.md**

---

## VERIFICATION CHECKLIST

After making all updates, verify:

### SKILL\__2_.md:

- [ ] Workbook structure updated to 9 tabs
- [ ] EXPENSE_ANALYSIS function uses row-based format (each invoice = row)
- [ ] REGULATORY_COMPLIANCE function uses Orlando-style format (tables)
- [ ] 3 new tab functions added (LEASE-UP_NOTES, DOCUMENTATION_NOTES, QUALITY_CHECK)
- [ ] Helper function `extract_dumpster_info()` added
- [ ] File compiles/renders correctly

### wastewise_expense_format_template.md:

- [ ] Shows row-based format (Month | Vendor | Service Type | Invoice# | Amount | Cost/Door | Notes)
- [ ] Has monthly subtotals with budget calculations
- [ ] Has grand total at bottom
- [ ] Includes all formatting specifications

---

## SOURCE FILES (Reference)

All code is ready in these files:

1. `/mnt/user-data/outputs/EXPENSE_ANALYSIS_ROW_FORMAT.md`
   - New EXPENSE_ANALYSIS function
   - New template content

2. `/mnt/user-data/outputs/REGULATORY_COMPLIANCE_CORRECT_FORMAT.md`
   - New REGULATORY_COMPLIANCE function

3. `/mnt/user-data/outputs/NEW_TAB_FUNCTIONS.md`
   - 3 new tab functions
   - Helper functions

4. `/mnt/user-data/outputs/COMPLETE_ACTION_PLAN.md`
   - Overview and context

---

## ESTIMATED TIME

- Reading and understanding: 10 minutes
- Making updates: 20-30 minutes
- Verification: 5 minutes
- **Total: 35-45 minutes**

---

## ALTERNATIVE: Use New Chat

If you prefer to have Claude complete this automatically, start a new chat with:

```
I need you to update two files for WasteWise Complete Suite:

Files to update:
1. /mnt/project/SKILL__2_.md
2. /mnt/project/wastewise_expense_format_template.md

Reference the instruction file:
/mnt/user-data/outputs/WASTEWISE_UPDATE_INSTRUCTIONS.md

And use the code from:
- /mnt/user-data/outputs/EXPENSE_ANALYSIS_ROW_FORMAT.md
- /mnt/user-data/outputs/REGULATORY_COMPLIANCE_CORRECT_FORMAT.md
- /mnt/user-data/outputs/NEW_TAB_FUNCTIONS.md

Create complete updated versions of both files.
```

---

## QUESTIONS?

If anything is unclear:

1. Check the source files listed above - they have complete working code
2. The COMPLETE_ACTION_PLAN.md has additional context
3. Start a new chat with Claude using the alternative approach above

---

**Status:** COMPLETE INSTRUCTIONS PROVIDED  
**All Required Code:** Available in output files  
**Ready to Execute:** YES
