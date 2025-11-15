---
name: wastewise-regulatory
description: WasteWise Complete Analysis with automated regulatory compliance research and LLM Judge validation. Includes all standard analysis features PLUS automated ordinance research, compliance checklists, and quality-scored evaluation. Use when you need both waste analysis AND regulatory compliance documentation.
---

# WasteWise Regulatory - Complete Analysis with Compliance Research

## What This Skill Does

Enhanced version of WasteWise Complete Analysis with:

### Core Validation Framework
- ✅ Contract tabs are generated when contracts are provided
- ✅ Contract clauses are properly extracted and categorized
- ✅ Optimization recommendations meet strict criteria
- ✅ All formulas are correctly calculated
- ✅ Data completeness across all sheets
- ✅ Professional formatting standards
- ✅ Cross-sheet data consistency

### NEW: Regulatory Compliance Research
- ✅ Automated research of local waste/recycling/organics ordinances
- ✅ Extraction of mandatory requirements and thresholds
- ✅ Documentation of penalties and enforcement
- ✅ Licensed hauler identification
- ✅ Compliance checklist generation
- ✅ Confidence scoring for research quality

**This skill will NOT produce output until ALL validation checks pass, including regulatory compliance research validation.**

## Pre-Flight Validation Checklist

Before generating the final workbook, this skill runs a **mandatory validation suite**:

### 1. Contract Validation
```
☐ If contract file detected → CONTRACT_TERMS sheet MUST be created
☐ Extract 7 clause types: Term & Renewal, Rate Increases, Termination, Liability, 
   Service Level, Force Majeure, Indemnification
☐ Calendar reminders calculated for critical dates
☐ Verbatim clause text extracted (not paraphrased)
☐ Risk severity assigned (high/medium/low)
```

### 2. Optimization Validation
```
☐ Compactor optimization: Only if avg < 6 tons/haul AND 14-day max interval
☐ Contamination reduction: Only if charges > 3-5% of spend
☐ Bulk subscription: Only if avg > $500/month
☐ Per-compactor pricing validated (not per-property)
☐ ROI calculations include all costs (install + monitoring)
☐ 14-day constraint enforced in recommendations
```

### 3. Formula Validation
```
☐ Yards per door: Correct formula for equipment type
   - Compactors: (Total Tons × 14.49) / Units
   - Dumpsters: (Qty × Size × Freq × 4.33) / Units
☐ Cost per door: Total Monthly Cost / Units
☐ Capacity utilization: (Tons Per Haul / Target Tons) × 100%
☐ Days between pickups: 30 / (Hauls Per Month)
```

### 4. Sheet Structure Validation
```
☐ SUMMARY_FULL: 2026 savings one-liner at top
☐ EXPENSE_ANALYSIS: Month-by-month COLUMN format
☐ OPTIMIZATION: All 3 opportunities with calculation breakdowns
☐ QUALITY_CHECK: Confidence scores and validation metrics
☐ DOCUMENTATION_NOTES: Vendor contacts, formulas, glossary
☐ HAUL_LOG: Created only if compactor present
☐ CONTRACT_TERMS: Created only if contract provided
☐ REGULATORY_COMPLIANCE: Created with location-based research
```

### 5. Data Completeness Validation
```
☐ Property name extracted
☐ Unit count specified
☐ All invoice dates parsed
☐ Tonnage data present (if compactor)
☐ Service types identified
☐ Account numbers captured
☐ Vendor name extracted
☐ Location data extracted (city, county, state, zip)
```

### 6. Cross-Validation
```
☐ SUMMARY totals match EXPENSE_ANALYSIS
☐ HAUL_LOG tonnage matches OPTIMIZATION calculations
☐ CONTRACT_TERMS dates align with calendar reminders
☐ Cost per door consistent across all sheets
☐ REGULATORY_COMPLIANCE location matches property data
```

### 7. NEW: Regulatory Compliance Validation
```
☐ Location data successfully extracted from property documents
☐ Minimum 3 official government sources (.gov) consulted
☐ Waste, recycling, AND organics requirements researched
☐ Mandatory vs voluntary status explicitly documented
☐ Capacity requirements are numerical (not "adequate" or "sufficient")
☐ Service frequencies are specific (not "regular" or "as needed")
☐ Penalty amounts documented with $ figures
☐ At least 3-5 licensed haulers identified with full contact info
☐ Ordinance citations include chapter/section numbers
☐ Property size thresholds verified (4+, 5+, 8+, 10+ units)
☐ Recent regulatory changes (2023-2025) checked
☐ Confidence score assigned (HIGH/MEDIUM/LOW)
```

## Regulatory Compliance Research Protocol

### Phase 1: Extract Location Data

From uploaded documentation, identify:
- City name
- County (if available)
- State
- Zip code
- Property type and size (unit count)
- Building stories/height (for threshold determination)

### Phase 2: Conduct Regulatory Research

**Search Pattern Sequence:**
1. `"[City Name] [State]" waste recycling ordinance`
2. `"[City Name]" universal recycling ordinance`
3. `"[City Name]" mandatory composting multifamily`
4. `"[City Name]" solid waste code`
5. `"[County Name] County" waste management requirements`
6. `"[State]" recycling law commercial properties`

**Priority Sources:**
- Municipal solid waste/sanitation department websites (.gov)
- City/county ordinance databases (Municode, American Legal)
- State environmental agency waste division pages
- Regional waste authority sites

### Phase 3: Extract Regulatory Requirements

For each waste stream (Trash, Recycling, Composting/Organics), document:

#### TRASH/WASTE COLLECTION
- Municipal service availability for property size
- Private licensed hauler requirement (mandatory/optional)
- Minimum service frequency requirements
- Container size/type specifications
- Placement restrictions
- Licensed hauler directory URL

#### RECYCLING REQUIREMENTS
- Mandatory vs voluntary status
- Property size threshold for mandate
- Minimum capacity requirement (% of waste, gallons per unit, or total volume)
- Accepted materials list
- Service frequency minimum
- Container specifications (size, type, color)
- Placement requirements
- Signage requirements (language, symbols, content)
- Co-location rules

#### COMPOSTING/ORGANICS REQUIREMENTS
- Mandatory vs voluntary status
- Effective date (especially 2023-2025 mandates)
- Property size threshold
- Minimum capacity requirement
- Service frequency minimum
- Accepted materials (food scraps, food-soiled paper, yard waste, BPI-certified)
- Container specifications
- Resident education requirements

### Phase 4: Document Penalties & Enforcement

Extract:
- Violation classification (misdemeanor, civil, criminal)
- Fine structure (per offense, per day, maximum)
- Enforcement agency name and contact
- Warning vs citation procedures
- Repeat violation escalation

### Phase 5: Identify Licensed Haulers

Compile minimum 3-5 haulers with:
- Company name
- Phone number
- Website URL
- Service capabilities (waste, recycling, composting, compactor hauls)
- Official hauler directory URL

### Phase 6: Generate Compliance Checklist

Create property-specific checklist showing:
- ✅ Requirements currently met
- ⚠️ Requirements needing attention
- ❌ Requirements not met
- 📅 Upcoming compliance deadlines

## Confidence Scoring System

After completing regulatory research, assign confidence level:

### HIGH CONFIDENCE
- All waste streams documented with official ordinance citations
- Penalty amounts and enforcement agency confirmed
- Licensed hauler directory found and verified
- Reporting requirements fully documented
- All sources from official .gov domains
- Capacity requirements are specific numerical values
- Recent regulatory changes confirmed

### MEDIUM CONFIDENCE
- Core requirements found but some details missing
- Ordinance cited but specific sections unclear
- Hauler list incomplete (fewer than 3 haulers)
- Some sources from non-official websites
- Mixed specificity in requirements

### LOW CONFIDENCE - FLAG FOR HUMAN REVIEW
- Limited official information available
- Conflicting sources found
- Recent changes not confirmed
- No licensed hauler directory located
- Key requirements vague or missing
- Property size threshold unclear
- **REQUIRES MANUAL VERIFICATION**

## Enhanced Validation Implementation

### Regulatory Compliance Validator Class

```python
class RegulatoryComplianceValidator:
    """Validates regulatory compliance research quality"""
    
    def __init__(self):
        self.validation_results = {
            'location_extraction': {},
            'source_quality': {},
            'requirement_specificity': {},
            'completeness': {},
            'confidence_assessment': {}
        }
        self.errors = []
        self.warnings = []
        self.confidence_score = None
        
    def validate_regulatory_research(self, regulatory_data: Dict, 
                                    property_info: Dict) -> Tuple[bool, str]:
        """
        Validate regulatory compliance research quality
        Returns: (passed: bool, confidence_level: str)
        """
        
        # 1. Validate location extraction
        location_valid = self.validate_location_data(
            regulatory_data.get('location', {}),
            property_info
        )
        
        # 2. Validate source quality
        sources_valid = self.validate_sources(
            regulatory_data.get('sources', [])
        )
        
        # 3. Validate requirement specificity
        specificity_valid = self.validate_requirement_specificity(
            regulatory_data.get('requirements', {})
        )
        
        # 4. Validate completeness
        completeness_valid = self.validate_completeness(
            regulatory_data
        )
        
        # 5. Assess confidence level
        confidence_level = self.assess_confidence(
            location_valid, sources_valid, specificity_valid, completeness_valid
        )
        
        # Determine if research passed minimum standards
        passed = confidence_level in ['HIGH', 'MEDIUM']
        
        if confidence_level == 'LOW':
            self.errors.append(
                "❌ REGULATORY RESEARCH CONFIDENCE TOO LOW: "
                "Research quality insufficient for automated compliance assessment. "
                "HUMAN REVIEW REQUIRED."
            )
        
        return passed, confidence_level
    
    def validate_location_data(self, location: Dict, property_info: Dict) -> bool:
        """Validate location extraction quality"""
        
        required_fields = ['city', 'state']
        optional_fields = ['county', 'zip_code']
        
        missing_required = [f for f in required_fields if not location.get(f)]
        
        if missing_required:
            self.errors.append(
                f"❌ LOCATION DATA INCOMPLETE: Missing required fields: "
                f"{', '.join(missing_required)}"
            )
            return False
        
        # Check for property size data
        if not property_info.get('unit_count'):
            self.warnings.append(
                "⚠️  Unit count not specified - may affect threshold applicability"
            )
        
        self.validation_results['location_extraction'] = {
            'status': 'PASSED',
            'city': location.get('city'),
            'state': location.get('state'),
            'county': location.get('county'),
            'unit_count': property_info.get('unit_count')
        }
        
        return True
    
    def validate_sources(self, sources: List[Dict]) -> bool:
        """Validate research source quality"""
        
        if len(sources) < 3:
            self.errors.append(
                f"❌ INSUFFICIENT SOURCES: Only {len(sources)} sources consulted. "
                f"Minimum 3 required."
            )
            return False
        
        # Check for .gov sources
        gov_sources = [s for s in sources if '.gov' in s.get('url', '')]
        
        if len(gov_sources) == 0:
            self.warnings.append(
                "⚠️  No official .gov sources found - relying on secondary sources"
            )
        
        self.validation_results['source_quality'] = {
            'status': 'PASSED' if len(gov_sources) >= 1 else 'WARNING',
            'total_sources': len(sources),
            'gov_sources': len(gov_sources),
            'source_list': [s.get('name', 'Unknown') for s in sources]
        }
        
        return True
    
    def validate_requirement_specificity(self, requirements: Dict) -> bool:
        """Validate that requirements are specific and measurable"""
        
        vague_terms = ['adequate', 'sufficient', 'appropriate', 'regular', 'as needed']
        specificity_issues = []
        
        # Check recycling requirements
        recycling = requirements.get('recycling', {})
        capacity = recycling.get('capacity_requirement', '')
        
        if any(term in str(capacity).lower() for term in vague_terms):
            specificity_issues.append("Recycling capacity uses vague terms")
        
        if recycling.get('service_frequency', '') in ['regular', 'as needed', '']:
            specificity_issues.append("Recycling frequency not specific")
        
        # Check composting requirements
        composting = requirements.get('composting', {})
        if composting.get('mandatory'):
            comp_capacity = composting.get('capacity_requirement', '')
            if any(term in str(comp_capacity).lower() for term in vague_terms):
                specificity_issues.append("Composting capacity uses vague terms")
        
        # Check penalties
        penalties = requirements.get('penalties', {})
        if not penalties.get('fine_per_offense') or '$' not in str(penalties.get('fine_per_offense')):
            specificity_issues.append("Penalty amounts not specified with $ values")
        
        if specificity_issues:
            for issue in specificity_issues:
                self.warnings.append(f"⚠️  SPECIFICITY: {issue}")
        
        self.validation_results['requirement_specificity'] = {
            'status': 'PASSED' if len(specificity_issues) == 0 else 'WARNING',
            'issues_found': len(specificity_issues),
            'issues': specificity_issues
        }
        
        return len(specificity_issues) == 0
    
    def validate_completeness(self, regulatory_data: Dict) -> bool:
        """Validate completeness of regulatory research"""
        
        requirements = regulatory_data.get('requirements', {})
        
        # Check all three waste streams are addressed
        waste_streams = ['waste', 'recycling', 'composting']
        missing_streams = []
        
        for stream in waste_streams:
            if stream not in requirements or not requirements[stream]:
                missing_streams.append(stream)
        
        if missing_streams:
            self.warnings.append(
                f"⚠️  INCOMPLETE RESEARCH: Missing waste streams: {', '.join(missing_streams)}"
            )
        
        # Check for licensed haulers
        haulers = regulatory_data.get('licensed_haulers', [])
        if len(haulers) < 3:
            self.warnings.append(
                f"⚠️  INSUFFICIENT HAULERS: Only {len(haulers)} licensed haulers found. "
                f"Minimum 3 recommended."
            )
        
        # Check for ordinance citations
        ordinances = regulatory_data.get('ordinances', [])
        if len(ordinances) == 0:
            self.errors.append(
                "❌ NO ORDINANCE CITATIONS: No ordinances referenced in research"
            )
            return False
        
        self.validation_results['completeness'] = {
            'status': 'PASSED' if len(missing_streams) == 0 else 'WARNING',
            'waste_streams_covered': len(waste_streams) - len(missing_streams),
            'haulers_found': len(haulers),
            'ordinances_cited': len(ordinances)
        }
        
        return len(missing_streams) <= 1  # Allow 1 missing stream
    
    def assess_confidence(self, location_valid: bool, sources_valid: bool,
                         specificity_valid: bool, completeness_valid: bool) -> str:
        """
        Assess overall confidence level for regulatory research
        Returns: 'HIGH', 'MEDIUM', or 'LOW'
        """
        
        # Count validations passed
        validations_passed = sum([
            location_valid,
            sources_valid,
            specificity_valid,
            completeness_valid
        ])
        
        # Get detailed metrics
        source_quality = self.validation_results.get('source_quality', {})
        requirement_specificity = self.validation_results.get('requirement_specificity', {})
        completeness = self.validation_results.get('completeness', {})
        
        gov_sources = source_quality.get('gov_sources', 0)
        specificity_issues = requirement_specificity.get('issues_found', 0)
        haulers_found = completeness.get('haulers_found', 0)
        
        # HIGH CONFIDENCE criteria
        if (validations_passed == 4 and 
            gov_sources >= 2 and 
            specificity_issues == 0 and 
            haulers_found >= 3):
            confidence = 'HIGH'
        
        # MEDIUM CONFIDENCE criteria
        elif (validations_passed >= 3 and 
              gov_sources >= 1 and 
              specificity_issues <= 2):
            confidence = 'MEDIUM'
        
        # LOW CONFIDENCE
        else:
            confidence = 'LOW'
        
        self.confidence_score = confidence
        
        self.validation_results['confidence_assessment'] = {
            'level': confidence,
            'validations_passed': f"{validations_passed}/4",
            'gov_sources': gov_sources,
            'specificity_issues': specificity_issues,
            'haulers_found': haulers_found
        }
        
        return confidence
```

### Integration with Main Validator

```python
class WasteWiseValidator:
    """Comprehensive validation framework for WasteWise Analysis"""
    
    def __init__(self):
        self.validation_results = {
            'contract_validation': {},
            'optimization_validation': {},
            'formula_validation': {},
            'sheet_structure_validation': {},
            'data_completeness_validation': {},
            'cross_validation': {},
            'regulatory_compliance_validation': {}  # NEW
        }
        self.errors = []
        self.warnings = []
        self.regulatory_validator = RegulatoryComplianceValidator()  # NEW
        
    def validate_all(self, invoice_data: List[Dict], contract_data: Dict, 
                     property_info: Dict, optimization_results: Dict,
                     regulatory_data: Dict) -> Tuple[bool, Dict]:  # NEW parameter
        """
        Run all validation checks including regulatory compliance
        Returns: (passed: bool, validation_report: dict)
        """
        
        # 1-6. Original validations (contract, optimization, formula, etc.)
        contract_valid = self.validate_contract(contract_data, invoice_data)
        optimization_valid = self.validate_optimizations(optimization_results, invoice_data)
        formula_valid = self.validate_formulas(invoice_data, property_info)
        structure_valid = self.validate_sheet_structure(
            invoice_data, contract_data, optimization_results, regulatory_data  # NEW
        )
        completeness_valid = self.validate_data_completeness(
            invoice_data, property_info
        )
        cross_valid = self.validate_cross_references(
            invoice_data, optimization_results, contract_data
        )
        
        # 7. NEW: Regulatory compliance validation
        regulatory_valid, confidence_level = self.regulatory_validator.validate_regulatory_research(
            regulatory_data, property_info
        )
        
        # Store regulatory validation results
        self.validation_results['regulatory_compliance_validation'] = {
            'status': 'PASSED' if regulatory_valid else 'FAILED',
            'confidence_level': confidence_level,
            'details': self.regulatory_validator.validation_results
        }
        
        # Merge errors and warnings from regulatory validator
        self.errors.extend(self.regulatory_validator.errors)
        self.warnings.extend(self.regulatory_validator.warnings)
        
        all_passed = all([
            contract_valid,
            optimization_valid,
            formula_valid,
            structure_valid,
            completeness_valid,
            cross_valid,
            regulatory_valid  # NEW
        ])
        
        return all_passed, self.generate_validation_report()
```

## REGULATORY_COMPLIANCE Sheet Structure

### Section 1: Jurisdiction Overview
```
SECTION 1: REGULATORY COMPLIANCE - [City, State]

Governing Ordinances:
- [City Code Chapter X-Y: Full Name]
- [County Code Section X: Full Name]
- [State Law/Statute: Full Name]

Property Classification: [Based on unit count/size threshold]
Regulatory Summary: [1-2 sentences on key mandates]
```

### Section 2: Waste Collection Requirements
```
Municipal Service: Available / Not Available
Private Hauler Requirement: ✅ MANDATORY / ⚠️ OPTIONAL

Key Requirements:
- Licensed hauler required: Yes/No
- Minimum service frequency: [X times per week]
- Container requirements: [Size, type specifications]
- Placement restrictions: [Details]

Licensed Hauler Directory: [URL]
```

### Section 3: Recycling Requirements
```
MANDATORY STATUS: ✅ MANDATORY / ⚠️ VOLUNTARY

Capacity Requirements:
- Minimum capacity: [Specific measurement]
- Based on: [Formula or standard]

Service Requirements:
- Minimum frequency: [Specific]
- Accepted materials: [List]

Container Specifications:
- Size/type: [Details]
- Color requirements: [If any]
- Placement: [Requirements]

Signage Requirements:
- Languages: [Required languages]
- Required symbols: [Details]
- Content: [Required information]

Compliance Checklist:
✅ [Specific requirement with measurable standard]
✅ [Specific requirement with measurable standard]
⚠️ [Requirement needing attention]
```

### Section 4: Composting/Organics Requirements
```
⚠️ IMPORTANT: [Note if recent requirement]

MANDATORY STATUS: ✅ MANDATORY / ⚠️ VOLUNTARY
Effective Date: [If applicable]

Capacity Requirements:
- Minimum capacity: [Specific measurement]
- Formula: [If provided]

Service Requirements:
- Minimum frequency: [Specific]
- Accepted materials:
  ✓ Food scraps
  ✓ Food-soiled paper
  ✓ Yard waste [if applicable]
  ✓ BPI-certified compostables [if accepted]

Container Specifications:
- Size: [Details]
- Type: [Details]
- Features: [Locking lids, color, etc.]

Resident Education:
- Required materials: [Details]
- Language requirements: [Details]

Compliance Checklist:
✅ [Specific requirement]
⚠️ [Requirement needing attention]
❌ [Requirement not met]
```

### Section 5: Penalties & Enforcement
```
Violation Type: [Classification]

Fine Structure:
- Per offense: Up to $[amount]
- Per day: Up to $[amount] per day
- Maximum: $[amount] total

Enforcement:
- Agency: [Name]
- Contact: [Phone and email]

Example Violations:
- [List common violations]
```

### Section 6: Licensed Haulers
```
FULL-SERVICE PROVIDERS:

1. [Company Name]
   Phone: [Number]
   Website: [URL]
   Services: Waste, recycling, composting, compactor hauls

2. [Company Name]
   Phone: [Number]
   Website: [URL]
   Services: [List]

[Additional haulers...]

Official Hauler Directory: [URL]
```

### Section 7: Regulatory Contacts
```
PRIMARY AGENCY:
Agency: [Full name]
Phone: [Number]
Email: [Address]
Website: [URL]

COMPLIANCE QUESTIONS:
Contact: [Name or department]
Phone: [Number]
Email: [Address]
```

### Section 8: Research Confidence Assessment
```
RESEARCH QUALITY ASSESSMENT

Confidence Level: [HIGH / MEDIUM / LOW]

Quality Metrics:
- Government sources consulted: [Number]
- Official ordinances cited: [Number]
- Licensed haulers identified: [Number]
- Specificity issues: [Number]

[If LOW confidence:]
⚠️ HUMAN REVIEW REQUIRED
This research requires manual verification due to:
- [List specific concerns]
- [Conflicting information found]
- [Recent regulatory changes unconfirmed]
```

## Complete Workflow with Regulatory Compliance

### Step 1: Initial Data Processing
1. Process uploaded invoices
2. Extract contract (if provided)
3. **NEW:** Extract location data from property documents
4. Identify property characteristics (units, type, building height)

### Step 2: Regulatory Research Phase
1. Execute search pattern sequence
2. Consult minimum 3 official sources
3. Extract waste, recycling, and organics requirements
4. Document penalties and licensed haulers
5. Generate compliance checklists
6. Assign confidence score

### Step 3: Comprehensive Validation
1. Run contract validation
2. Run optimization validation
3. Run formula validation
4. Run sheet structure validation
5. Run data completeness validation
6. Run cross-validation
7. **NEW:** Run regulatory compliance validation
8. Assess overall confidence level

### Step 4: Validation Gate
- **HIGH/MEDIUM Confidence:** Proceed to output
- **LOW Confidence:** HALT and flag for human review

### Step 5: Generate Output
1. Create all standard sheets (SUMMARY, EXPENSE_ANALYSIS, OPTIMIZATION, etc.)
2. **NEW:** Create REGULATORY_COMPLIANCE sheet
3. Create QUALITY_CHECK sheet with regulatory confidence score
4. Generate executive summary with compliance status

## Enhanced Validation Report Example

```
🔐 STEP 3: Validation Gate - Running All Checks...
------------------------------------------------------------

📊 VALIDATION RESULTS:
   ✅ Contract Validation: PASSED
   ✅ Optimization Validation: PASSED
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED
   ✅ Data Completeness Validation: PASSED
   ✅ Cross Validation: PASSED
   ✅ Regulatory Compliance Validation: PASSED (CONFIDENCE: HIGH)

🏛️ REGULATORY RESEARCH SUMMARY:
   Location: Austin, Texas
   Sources Consulted: 5 (.gov: 3, Other: 2)
   Ordinances Cited: 3
   Licensed Haulers Found: 6
   Confidence Level: HIGH
   
   Key Findings:
   ✅ Universal Recycling Ordinance applies (8+ units)
   ✅ Mandatory composting effective January 2024
   ✅ Minimum 1:1 recycling:waste capacity ratio required
   ⚠️  Annual reporting required by February 1, 2026

⚠️  WARNINGS:
   ⚠️  Property may need additional compost capacity
   ⚠️  Annual reporting deadline in 85 days

============================================================
VALIDATION SUMMARY:
   Total Checks: 7
   Passed: 7
   Failed: 0
   Warnings: 2
   Regulatory Confidence: HIGH
============================================================

✅ ALL VALIDATIONS PASSED - Proceeding to output generation
```

## Low Confidence Example - Human Review Required

```
🔐 STEP 3: Validation Gate - Running All Checks...
------------------------------------------------------------

📊 VALIDATION RESULTS:
   ✅ Contract Validation: PASSED
   ✅ Optimization Validation: PASSED
   ✅ Formula Validation: PASSED
   ✅ Sheet Structure Validation: PASSED
   ✅ Data Completeness Validation: PASSED
   ✅ Cross Validation: PASSED
   ❌ Regulatory Compliance Validation: FAILED (CONFIDENCE: LOW)

🏛️ REGULATORY RESEARCH SUMMARY:
   Location: [City], [State]
   Sources Consulted: 2 (.gov: 0, Other: 2)
   Ordinances Cited: 0
   Licensed Haulers Found: 1
   Confidence Level: LOW
   
   Issues Identified:
   ❌ No official .gov sources found
   ❌ No ordinance citations located
   ❌ Insufficient hauler information
   ⚠️  Conflicting information on composting mandate
   ⚠️  Recent ordinance changes (2024) not confirmed

🚨 HUMAN REVIEW REQUIRED 🚨

The regulatory compliance research did not meet minimum quality 
standards for automated assessment. Manual verification needed for:

1. Composting mandate status (conflicting sources)
2. Property size threshold applicability
3. Enforcement penalties (not documented)
4. Licensed hauler requirements

Recommend: Contact [City] Solid Waste Department directly
Phone: [If available]
Website: [If available]

============================================================
VALIDATION SUMMARY:
   Total Checks: 7
   Passed: 6
   Failed: 1
   Warnings: 4
   Regulatory Confidence: LOW - MANUAL REVIEW REQUIRED
============================================================

❌ VALIDATION FAILED - Output generation halted
Please complete manual regulatory verification before proceeding.
```

## Required Libraries

- **anthropic** - Claude API for document processing and web research
- **pandas** - Data manipulation and analysis
- **openpyxl** - Excel workbook generation with formatting
- **python-dateutil** - Date parsing and calendar calculations
- **typing** - Type hints for validation functions
- **requests** - Web research for regulatory compliance
- **beautifulsoup4** - HTML parsing for ordinance extraction

## Example Usage

**User prompt**: "I uploaded 6 months of invoices, the waste service contract, and property documents for The Club at Millenia (560 units, Austin TX). Run the validated analysis with regulatory compliance research."

**Claude will**:
1. ✅ Process all invoices and extract contract
2. ✅ Extract location data (Austin, Travis County, Texas)
3. ✅ Research Austin waste/recycling/composting ordinances
4. ✅ Consult official sources (austintexas.gov, Travis County)
5. ✅ Extract Universal Recycling Ordinance requirements
6. ✅ Document composting mandate (effective 2024)
7. ✅ Identify 5+ licensed haulers
8. ✅ Run comprehensive validation suite (7 categories, 40+ checks)
9. ✅ Assign confidence level (HIGH/MEDIUM/LOW)
10. ✅ **HALT if LOW confidence or any validation fails**
11. ✅ Generate REGULATORY_COMPLIANCE sheet
12. ✅ Generate CONTRACT_TERMS sheet
13. ✅ Create HAUL_LOG if compactor detected
14. ✅ Validate all formulas and calculations
15. ✅ Cross-reference data across sheets
16. ✅ Generate validated Excel workbook with quality report

**Output files**:
- `TheClubAtMillenia_WasteAnalysis_Validated.xlsx` - Complete workbook with all sheets including regulatory compliance
- Executive summary with validation status and regulatory confidence level

## Key Principles

1. **Validation-First** - No output until ALL checks pass (including regulatory)
2. **Research Quality** - Minimum 3 sources, preference for .gov domains
3. **Specificity Required** - Vague terms trigger warnings or failures
4. **Confidence Transparency** - Clear scoring of research quality
5. **Human-in-the-Loop** - LOW confidence requires manual review
6. **Contract-Aware** - Mandatory CONTRACT_TERMS if contract provided
7. **Compliance-Focused** - Property-specific regulatory checklists
8. **Formula Accuracy** - Validates every calculation
9. **Cross-Referenced** - Ensures data consistency across sheets
10. **Quality Assurance** - Built-in QUALITY_CHECK sheet with regulatory confidence

This enhanced validated edition provides enterprise-grade quality control for waste management analysis with comprehensive regulatory compliance research.
