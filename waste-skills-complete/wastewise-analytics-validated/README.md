# WasteWise Analytics - Validated Edition

**Enterprise-grade waste management analysis with comprehensive validation framework**

## 🎯 What This Skill Does

Enhanced version of WasteWise Complete Analysis that includes a **mandatory validation gate** ensuring:

- ✅ **Contract tabs are generated** when contracts are provided
- ✅ **All contract clauses extracted** and categorized properly  
- ✅ **Optimization recommendations meet strict criteria** (no invalid suggestions)
- ✅ **All formulas calculated correctly** based on equipment type
- ✅ **Data completeness** across all sheets
- ✅ **Professional formatting standards** maintained
- ✅ **Cross-sheet data consistency** validated

**Critical Feature**: This skill will **NOT produce output** unless ALL validation checks pass.

## 📦 Package Contents

```
wastewise-analytics-validated/
├── SKILL.md                      # Main skill implementation (22KB)
├── demo-prompt.txt              # Quick start usage guide
├── SETUP.md                     # Installation instructions (10KB)
├── VALIDATION_CHECKLIST.md      # Complete validation reference (16KB)
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Install the Skill

**Claude.ai (Browser):**
```
Settings → Capabilities → Skills → Upload wastewise-analytics-validated.zip
```

**Claude Code (CLI):**
```bash
cp -r wastewise-analytics-validated ~/.claude/skills/
```

### 2. Prepare Your Data

You need:
- **Waste invoices** (PDF/scanned) - 3-6 months minimum recommended
- **Waste service contract** (optional but recommended)
- **Property details**: Name and unit count

### 3. Run the Analysis

```
"I uploaded 6 months of invoices and a contract for The Club at Millenia 
(560 units). Run the validated WasteWise analysis."
```

### 4. Review Results

The skill will:
1. Run 30+ validation checks across 6 categories
2. Show you exactly what passed/failed
3. Generate workbook ONLY if all validations pass
4. Include detailed QUALITY_CHECK sheet with validation results

## 🔐 Validation Framework

### 6 Validation Categories

| Category | What It Checks | Critical? |
|----------|---------------|-----------|
| **Contract Validation** | CONTRACT_TERMS sheet created when contract provided, minimum 3 clauses extracted, verbatim text present, calendar reminders | ✅ CRITICAL |
| **Optimization Validation** | Recommendations meet strict criteria (compactor < 6 tons/haul, contamination > 3%, bulk > $500/mo, 14-day constraint) | ✅ CRITICAL |
| **Formula Validation** | Correct formulas for yards/door (tonnage-based for compactors), cost per door, capacity utilization | ✅ CRITICAL |
| **Sheet Structure Validation** | 5-7 sheets based on data, HAUL_LOG if compactor, CONTRACT_TERMS if contract | ✅ CRITICAL |
| **Data Completeness Validation** | Property info present, invoices have required fields, tonnage for compactors | ✅ CRITICAL |
| **Cross-Validation** | Data consistency across sheets, totals match, calculations align | ✅ CRITICAL |

### Example Validation Report

**Success:**
```
📊 VALIDATION RESULTS:
   ✅ Contract Validation: PASSED (7 clauses, 2 reminders)
   ✅ Optimization Validation: PASSED (2 opportunities)
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED (7 sheets)
   ✅ Data Completeness Validation: PASSED (12 invoices)
   ✅ Cross Validation: PASSED

✅ ALL VALIDATIONS PASSED - Proceeding to output generation
```

**Failure:**
```
📊 VALIDATION RESULTS:
   ❌ Contract Validation: FAILED
   ✅ Optimization Validation: PASSED
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED
   ✅ Data Completeness Validation: PASSED
   ✅ Cross Validation: PASSED

❌ ERRORS FOUND:
   ❌ CONTRACT EXTRACTION FAILED: Only 2 clauses found. 
      Expected at least 3 of: Term & Renewal, Rate Increases, 
      Termination, Liability, Service Level, Force Majeure, 
      Indemnification

🛑 VALIDATION FAILED - Cannot proceed to output generation
```

## 📊 Output Structure

### With Contract + Compactor (7 sheets):
1. **SUMMARY_FULL** - Executive overview with 2026 savings projection
2. **EXPENSE_ANALYSIS** - Month-by-month breakdown (dashboard column format)
3. **OPTIMIZATION** - Validated opportunities with detailed breakdowns
4. **QUALITY_CHECK** - Validation report showing all checks ← NEW!
5. **DOCUMENTATION_NOTES** - Formulas, glossary, vendor contacts
6. **HAUL_LOG** - Detailed compactor haul tracking (if compactor present)
7. **CONTRACT_TERMS** - Verbatim clause extraction with calendar reminders (if contract provided) ← GUARANTEED!

### CONTRACT_TERMS Sheet Features

When a contract is provided, you get:

#### 📅 Calendar Reminders Section
- Critical dates with countdown timers
- Action items (e.g., "Submit termination notice")
- Criticality levels (HIGH/MEDIUM/LOW)
- Color-coded urgency (red < 90 days, yellow < 180 days)

#### 📄 Contract Clauses Section (7 Categories)
1. **Term & Renewal** - Contract length, auto-renewal conditions
2. **Rate Increases** - Price adjustment provisions  
3. **Termination** - Exit conditions, notice requirements
4. **Liability** - Limitation of liability clauses
5. **Service Level** - Performance standards
6. **Force Majeure** - Acts of God, service disruptions
7. **Indemnification** - Hold harmless provisions

Each clause includes:
- **Verbatim Contract Language** (exact text, not paraphrased)
- **Risk Level** (HIGH/MEDIUM/LOW with color coding)
- **Business Impact** (what this means for your property)
- **Recommended Action** (mitigation steps)

## 🛡️ Key Validation Features

### 1. Contract Tab Enforcement
```
IF contract uploaded:
    → Extract minimum 3 clauses
    → Generate CONTRACT_TERMS sheet
    → Include verbatim text (not paraphrased)
    → Calculate calendar reminders
ELSE:
    → Skip CONTRACT_TERMS (not an error)
```

### 2. Optimization Criteria Enforcement
```
Compactor Monitoring:
✅ ONLY if avg < 6 tons/haul
✅ ONLY if optimized interval ≤ 14 days
✅ Per-compactor pricing ($300 install + $200/mo per unit)

Contamination Reduction:
✅ ONLY if charges > 3-5% of spend

Bulk Subscription:
✅ ONLY if avg > $500/month
```

### 3. Formula Accuracy Enforcement
```
Compactors MUST use:
  Yards per door = (Tons × 14.49) / Units

Standard Dumpsters MUST use:
  Yards per door = (Qty × Size × Freq × 4.33) / Units

❌ Wrong formula = validation FAILS
```

### 4. Sheet Structure Enforcement
```
Compactor present → HAUL_LOG required
Contract provided → CONTRACT_TERMS required
Missing required sheet → validation FAILS
```

## 📚 Documentation

- **SKILL.md** - Full implementation with validation framework code
- **SETUP.md** - Installation guide with troubleshooting
- **VALIDATION_CHECKLIST.md** - Complete reference of all 30+ checks
- **demo-prompt.txt** - Quick start examples

## 🔍 Use Cases

### Perfect For:
- ✅ Property managers who need **reliable, validated analysis**
- ✅ Regional directors requiring **contract risk management**
- ✅ Finance teams needing **accurate budget projections**
- ✅ Operations teams implementing **verified optimizations**
- ✅ Compliance teams tracking **contract terms and deadlines**

### Key Benefits:
1. **No Invalid Recommendations** - Only suggests what's actually implementable
2. **Contract Visibility** - See exact contract language with risk levels
3. **Calendar Management** - Never miss critical termination windows
4. **Quality Assurance** - Built-in validation report in every workbook
5. **Audit Trail** - Timestamp and validation results embedded

## ⚠️ Important Notes

### This Skill Will HALT If:
- ❌ Contract provided but only 1-2 clauses extracted
- ❌ Optimization recommendations violate criteria
- ❌ Formula calculations are incorrect
- ❌ Required sheets are missing based on data
- ❌ Data is incomplete (missing property details)

### This Ensures:
- ✅ You never get a workbook with missing contract analysis
- ✅ All recommendations are actually implementable
- ✅ Calculations are mathematically correct
- ✅ Output meets professional standards
- ✅ Data quality is verifiable

## 🎓 Examples

### Example 1: Full Analysis with Contract
```
Input:
- 12 months of invoices
- Service contract with clear clauses
- Property has 2 compactors
- Avg 4.5 tons/haul
- Contamination 4.2% of spend

Output:
- 7 sheets generated
- CONTRACT_TERMS with 7 clause categories
- HAUL_LOG with 144 entries
- 2 optimizations recommended:
  1. Compactor monitors (validated)
  2. Contamination reduction (validated)
- All validations PASSED
```

### Example 2: Analysis Halted - Invalid Contract
```
Input:
- 6 months of invoices
- Contract file (poor scan quality)
- Property has compactor

Validation Results:
❌ CONTRACT EXTRACTION FAILED: Only 2 clauses found

Output:
- NO workbook generated
- Error message with details
- Suggestion to re-scan contract
```

## 🆚 Standard vs. Validated Edition

| Feature | Standard WasteWise | Validated Edition |
|---------|-------------------|-------------------|
| Invoice processing | ✅ | ✅ |
| Optimization recommendations | ✅ | ✅ + Validation |
| Contract extraction | ✅ | ✅ + Mandatory checks |
| Formula calculations | ✅ | ✅ + Validation |
| CONTRACT_TERMS tab | Sometimes | **Guaranteed if contract** |
| Quality checks | Basic | **Comprehensive (30+ checks)** |
| Validation report | No | **Yes (QUALITY_CHECK sheet)** |
| Halt on errors | No | **Yes (prevents bad output)** |

## 💡 Tips for Best Results

1. **Upload contracts whenever possible** - Enables CONTRACT_TERMS sheet
2. **Provide 6-12 months of invoices** - Better pattern analysis
3. **Include property details upfront** - Reduces validation errors
4. **Check for tonnage data** - Required for compactor optimization
5. **Review validation report first** - Understand what was checked

## 🔧 Troubleshooting

**Issue**: "CONTRACT EXTRACTION FAILED: Only X clauses found"
- **Solution**: Ensure contract PDF is readable, has clear section headers
- **Alternative**: Re-scan contract at higher quality

**Issue**: "COMPACTOR OPTIMIZATION INVALID"
- **Solution**: This is working correctly - optimization only when needed
- **Explanation**: Validates recommendations are actually beneficial

**Issue**: "Days between pickups exceeds 14-day maximum"
- **Solution**: Validation correctly blocked invalid optimization
- **Explanation**: 14-day constraint is odor management requirement

See **SETUP.md** for complete troubleshooting guide.

## 📞 Support

For questions about validation results:
1. Review the **QUALITY_CHECK** sheet in your workbook
2. Check **VALIDATION_CHECKLIST.md** for detailed criteria
3. Verify your input files match expected formats

## 🔄 Version History

**v1.0** (2025-11-02)
- Initial validated edition
- 6-category validation framework
- 30+ individual validation checks
- CONTRACT_TERMS tab enforcement
- Comprehensive QUALITY_CHECK sheet
- Halt-on-error functionality

## 📄 License

Part of Advantage Waste / Greystar skill suite  
For internal use by authorized Greystar personnel

---

**Need Help?** Check the full documentation:
- Installation: `SETUP.md`
- Validation Details: `VALIDATION_CHECKLIST.md`
- Implementation: `SKILL.md`
- Quick Start: `demo-prompt.txt`
