---
name: wastewise-regulatory-lite
description: Streamlined WasteWise analysis with regulatory compliance research, optimized for Claude.ai token limits. Creates validated Excel workbooks with expense analysis, optimization recommendations, contract terms, and location-specific ordinance compliance. Use when analyzing waste invoices with regulatory requirements.
---

# WasteWise Regulatory LITE

**Optimized for Claude.ai - Silent Execution Mode**

## Core Principle

Execute analysis with MINIMAL token output. Only surface:

- ❌ Critical errors
- ⚠️ Important warnings
- ✅ Final status
- 🔗 Download link

No verbose explanations. No step-by-step narration. Just results.

## What This Does

1. Process invoices → Extract costs, tonnage, service details
2. Extract contract → Pull critical clauses and dates
3. Research ordinances → Query local waste/recycling/composting rules
4. Validate everything → Run 40+ checks silently
5. Generate Excel → Professional workbook with all sheets
6. Provide download → One link, done

## Silent Execution Protocol

```python
# CRITICAL: Suppress all verbose output during execution
# Only log to console if ERRORS or HIGH-PRIORITY warnings
# All validation runs in background
# Only surface final status report
```

## Required Input

User must provide:

- Property name (extract from invoices if not provided)
- Unit count (extract from context if not provided)
- Location (city, state - extract from invoices/contract)
- Invoice files (PDF, Excel, or CSV)
- Contract file (optional but recommended)

## Streamlined Workflow

### Phase 1: Data Extraction (Silent)

```python
# Extract from invoices:
- Property name, location, unit count
- Monthly costs, service types, frequencies
- Tonnage data (if compactor present)
- Vendor information, account numbers

# Extract from contract (if provided):
- Term length and renewal dates
- Rate increase provisions
- Termination clauses
- Liability and indemnification
- Calendar reminder dates (90/60/30 days before expiration)
```

### Phase 2: Regulatory Research (Focused)

```python
# Search Pattern - Execute 2-3 targeted searches max:
search_1 = f"{city} {state} waste recycling ordinance"
search_2 = f"{city} universal recycling multifamily"
search_3 = f"{city} composting mandate commercial" # Only if needed

# Extract Requirements:
- Recycling: Mandatory? Capacity? Service frequency?
- Composting: Effective date? Property threshold?
- Penalties: Dollar amounts and enforcement agency
- Licensed haulers: 3-5 with contact info

# Confidence Scoring:
- HIGH: Official sources, specific requirements, penalties documented
- MEDIUM: Core info found, some details missing
- LOW: Insufficient data - flag for manual review
```

### Phase 3: Validation (Background)

```python
# Run all validation checks silently
# Only output if FAILED

validations = {
    'contract': verify_contract_terms_extracted(),
    'optimization': verify_recommendations_meet_criteria(),
    'formulas': verify_all_calculations_correct(),
    'data_completeness': verify_required_fields_present(),
    'regulatory': verify_research_quality()
}

# If all pass: Continue to output
# If any fail: HALT and report specific failure
```

### Phase 4: Excel Generation (Silent)

```python
# Create workbook with sheets:
sheets = [
    'SUMMARY_FULL',          # Executive summary with 2026 savings
    'EXPENSE_ANALYSIS',      # Month-by-month breakdown
    'OPTIMIZATION',          # Compactor monitors, contamination, bulk
    'HAUL_LOG',             # Only if compactor present
    'CONTRACT_TERMS',        # Only if contract provided
    'REGULATORY_COMPLIANCE', # Location-specific ordinances
    'QUALITY_CHECK',         # Confidence scores
    'DOCUMENTATION_NOTES'    # Contacts, formulas, glossary
]

# Professional formatting applied automatically
# No token output during generation
```

## Output Format (Token-Efficient)

```
✅ WasteWise Regulatory Analysis Complete

Property: [Name] ([Units] units)
Location: [City, State]
Period: [Date Range]

VALIDATION STATUS: ✅ PASSED (7/7 checks)
REGULATORY CONFIDENCE: [HIGH/MEDIUM/LOW]

[If HIGH/MEDIUM confidence:]
Key Compliance Items:
✅ [Item 1]
⚠️ [Item 2 - needs attention]
❌ [Item 3 - not compliant]

📊 [Download Link]

[If LOW confidence:]
⚠️ MANUAL REVIEW REQUIRED
Research quality below threshold. Complete workbook generated but
regulatory section needs verification. Contact [Agency] at [Phone].

📊 [Download Link]
```

## Optimization Rules (Enforced)

### Compactor Monitoring

```
ONLY recommend if:
- Average < 6 tons per haul AND
- Max interval ≤ 14 days between pickups

Calculate:
- Current: X hauls/month @ $Y/haul = $Z
- With monitors (8-9 tons/haul): X/2 hauls/month @ $Y = $Z/2
- Savings: $Z - $Z/2 - $200/month monitoring = Net savings
- ROI: ($300 install + $200/mo) / (monthly savings)
```

### Contamination Reduction

```
ONLY recommend if:
- Contamination charges > 3% of total spend
```

### Bulk Trash Subscription

```
ONLY recommend if:
- Average bulk charges > $500/month
```

## Sheet Structure Requirements

### SUMMARY_FULL

- 2026 projected savings one-liner at very top
- Property details, unit count, cost per door
- Service summary table
- Top 3 optimization opportunities
- Regulatory compliance status

### EXPENSE_ANALYSIS

- Month-by-month in COLUMN format (months as columns)
- Service types as rows
- Totals and averages

### OPTIMIZATION

- Three opportunities with full calculation breakdowns
- Per-compactor pricing (not per-property)
- 14-day constraint enforced
- ROI including all costs

### HAUL_LOG (if compactor)

- Date, tons, days between pickups
- Running averages
- Identify low-utilization hauls

### CONTRACT_TERMS (if contract provided)

- Extract verbatim clause text (not paraphrased)
- 7 categories: Term & Renewal, Rate Increases, Termination, Liability, Service Level, Force Majeure, Indemnification
- Calendar reminders: 90/60/30 days before expiration
- Risk severity: HIGH/MEDIUM/LOW

### REGULATORY_COMPLIANCE

```
1. Executive Summary
   - Property applicability to local ordinances
   - Compliance status overview
   - Action items with priority

2. Waste Collection Requirements
   - Municipal vs private hauler
   - Service frequency minimums
   - Container specifications

3. Recycling Requirements (if mandatory)
   - Property threshold (4+, 5+, 8+ units)
   - Capacity requirements (specific ratios)
   - Service frequency, container specs, signage

4. Composting/Organics (if mandatory)
   - Effective date (especially 2023-2025 mandates)
   - Property threshold
   - Accepted materials
   - Resident education requirements

5. Compliance Checklist
   ✅ Requirements met
   ⚠️ Requirements needing attention
   ❌ Requirements not met
   📅 Upcoming deadlines

6. Licensed Haulers (3-5 minimum)
   - Company name, phone, website
   - Service capabilities
   - Official directory link

7. Penalties & Enforcement
   - Violation classification
   - Fine structure ($ amounts)
   - Enforcement agency contact

8. Research Confidence
   - Confidence level: HIGH/MEDIUM/LOW
   - Sources consulted (count)
   - Ordinances cited
   - [If LOW] Manual verification needed
```

## Validation Gate

```python
if confidence_level == "LOW":
    output_workbook()  # Still generate file
    print("⚠️ MANUAL REVIEW REQUIRED")
    print(f"Regulatory research quality below threshold.")
    print(f"Contact {agency_name} at {phone} for verification.")
    halt_execution()
else:
    output_workbook()
    print("✅ PASSED")
```

## Formula Reference

```python
# Yards per door
if compactor:
    yards_per_door = (total_tons * 14.49) / units
else:
    yards_per_door = (qty * size * freq * 4.33) / units

# Cost per door
cost_per_door = total_monthly_cost / units

# Capacity utilization
utilization = (tons_per_haul / target_tons) * 100

# Days between pickups
days_between = 30 / hauls_per_month
```

## Token Budget Targets

- Initial skill load: 30-50 tokens
- Data extraction: 0 tokens (silent code execution)
- Regulatory research: 500-800 tokens (web searches)
- Validation: 0 tokens (silent unless failed)
- Excel generation: 0 tokens (code execution)
- Final output: 200-400 tokens

**Total Target: <1,500 tokens per property**

## Error Handling

```python
try:
    execute_workflow()
except ValidationError as e:
    print(f"❌ VALIDATION FAILED: {e.category}")
    print(f"Details: {e.message}")
    halt_execution()
except DataExtractionError as e:
    print(f"❌ DATA EXTRACTION FAILED")
    print(f"Unable to extract: {e.missing_fields}")
    print(f"Please verify files and retry.")
    halt_execution()
except RegulatoryResearchError as e:
    print(f"⚠️ REGULATORY RESEARCH INCOMPLETE")
    print(f"Could not find: {e.missing_requirements}")
    print(f"Proceeding with available data. Confidence: LOW")
    output_workbook()
```

## Usage Example

**User prompt:**

```
Analyze Columbia Square Living invoices with regulatory compliance.
```

**Claude response:**

```
✅ WasteWise Regulatory Analysis Complete

Property: Columbia Square Living (200 units)
Location: Portland, Oregon
Period: May 2024 - Oct 2024

VALIDATION STATUS: ✅ PASSED (7/7 checks)
REGULATORY CONFIDENCE: HIGH

Key Compliance Items:
✅ Recycling service meets capacity requirements
⚠️ Composting mandate effective Jan 2024 - verification needed
✅ Licensed hauler confirmed

📊 [Download Link]
```

## Libraries Required

- pandas
- openpyxl
- python-dateutil
- anthropic (for web search)

## Key Principles

1. **Silent Execution** - No verbose output during processing
2. **Token Efficiency** - Target <1,500 tokens per analysis
3. **Validation First** - All checks run, only report failures
4. **Confidence Transparency** - Clear HIGH/MEDIUM/LOW scoring
5. **Actionable Output** - Focus on compliance gaps and optimization
6. **Professional Quality** - Enterprise-grade Excel workbooks
7. **Fail Gracefully** - Always output something useful

This lite version prioritizes speed and token efficiency for Claude.ai while maintaining analysis quality.
