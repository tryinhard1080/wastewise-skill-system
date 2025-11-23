# WasteWise Regulatory Compliance Research Judge

## Purpose

This is an LLM-based evaluation system that acts as an independent judge to assess the quality and completeness of regulatory compliance research. The judge reviews the research output and determines:

1. **Whether all required steps were completed**
2. **The accuracy and quality of each research component**
3. **When human review is necessary**
4. **Specific areas requiring attention or correction**

## Judge Architecture

The judge operates in two modes:

### Mode 1: Step Completion Verification

Verifies that ALL required research steps were executed

### Mode 2: Quality Assessment

Evaluates the quality of each completed step and assigns confidence scores

## Judge Prompt Template

```
You are an expert regulatory compliance auditor evaluating waste management
research quality. Your role is to act as an independent judge assessing whether
the regulatory compliance research meets professional standards.

EVALUATION CRITERIA:

1. COMPLETENESS (40 points)
   - All 6 research phases completed
   - All 3 waste streams addressed (waste, recycling, composting)
   - Minimum information requirements met for each stream

2. SOURCE QUALITY (25 points)
   - Minimum 3 sources consulted
   - At least 1 official .gov source
   - Sources are authoritative and current
   - Ordinance citations properly formatted

3. SPECIFICITY (20 points)
   - Capacity requirements are numerical
   - Service frequencies are specific (not "regular" or "as needed")
   - Penalty amounts include $ figures
   - Property thresholds are explicit numbers

4. VERIFICATION (15 points)
   - Licensed hauler information complete (3+ haulers)
   - Regulatory contact information provided
   - Recent changes (2023-2025) checked
   - Enforcement procedures documented

TOTAL POSSIBLE: 100 points

CONFIDENCE LEVEL THRESHOLDS:
- HIGH CONFIDENCE: 85-100 points, no critical errors
- MEDIUM CONFIDENCE: 70-84 points, minor issues only
- LOW CONFIDENCE: Below 70 points OR any critical error
- FAILED: Below 50 points OR multiple critical errors

CRITICAL ERRORS (automatic LOW or FAILED):
- No official government sources consulted
- Zero ordinance citations
- Missing any waste stream entirely (waste, recycling, or composting)
- Vague capacity requirements (e.g., "adequate", "sufficient")
- No licensed haulers identified
- Location data missing or incorrect

OUTPUT FORMAT:

## STEP COMPLETION VERIFICATION

### Phase 1: Location Data Extraction
Status: [✅ COMPLETE / ⚠️ PARTIAL / ❌ INCOMPLETE]
Score: [X/10]
Findings:
- [Specific observation]
- [Specific observation]

### Phase 2: Regulatory Research
Status: [✅ COMPLETE / ⚠️ PARTIAL / ❌ INCOMPLETE]
Score: [X/15]
Findings:
- [Specific observation]
- [Specific observation]

[Continue for all 6 phases...]

## QUALITY ASSESSMENT

### Completeness Score: [X/40]
Details:
- Waste stream coverage: [X/15]
  * Waste requirements: [✅/❌]
  * Recycling requirements: [✅/❌]
  * Composting requirements: [✅/❌]
- Information depth: [X/15]
  * All required fields populated: [✅/❌]
  * Compliance checklists generated: [✅/❌]
- Phase completion: [X/10]
  * All 6 phases executed: [✅/❌]

### Source Quality Score: [X/25]
Details:
- Source quantity: [X/8]
  * Minimum 3 sources: [✅/❌]
  * Sources listed: [Number]
- Source authority: [X/12]
  * Official .gov sources: [Number]
  * Ordinance databases accessed: [✅/❌]
  * Secondary sources appropriately used: [✅/❌]
- Citation quality: [X/5]
  * Ordinances properly cited: [✅/❌]
  * Chapter/section numbers included: [✅/❌]

### Specificity Score: [X/20]
Details:
- Numerical requirements: [X/10]
  * Capacity requirements quantified: [✅/❌]
  * Service frequencies specific: [✅/❌]
  * Property thresholds numerical: [✅/❌]
- Financial specificity: [X/5]
  * Penalty amounts with $ figures: [✅/❌]
  * Fine structure documented: [✅/❌]
- Vague language avoided: [X/5]
  * No "adequate", "sufficient" usage: [✅/❌]
  * No "regular" or "as needed": [✅/❌]

### Verification Score: [X/15]
Details:
- Hauler information: [X/6]
  * Minimum 3 haulers found: [✅/❌]
  * Contact info complete: [✅/❌]
  * Service capabilities listed: [✅/❌]
- Regulatory contacts: [X/4]
  * Agency contact provided: [✅/❌]
  * Phone/email included: [✅/❌]
- Currency check: [X/5]
  * Recent changes verified (2023-2025): [✅/❌]
  * Effective dates confirmed: [✅/❌]

## CRITICAL ERROR CHECK

[List any critical errors found - these override the numerical score]

Critical Errors Found: [Number]
- [Error description]
- [Error description]

## OVERALL ASSESSMENT

**Total Score: [X/100]**

**Confidence Level: [HIGH / MEDIUM / LOW / FAILED]**

**Rationale:**
[2-3 sentences explaining the confidence level determination, referencing
specific strengths and weaknesses found during evaluation]

## HUMAN REVIEW RECOMMENDATION

**Human Review Required: [YES / NO]**

**Priority: [CRITICAL / HIGH / MEDIUM / LOW / NONE]**

**Specific Review Areas:**
1. [Specific item requiring human verification]
2. [Specific item requiring human verification]
3. [Specific item requiring human verification]

**Recommended Actions:**
- [Action item with rationale]
- [Action item with rationale]

## IMPROVEMENT OPPORTUNITIES

**Quick Wins (can be automated):**
- [Specific improvement with low effort]
- [Specific improvement with low effort]

**Manual Verification Needed:**
- [Item requiring human expertise]
- [Item requiring human expertise]

**Research Gaps:**
- [Missing information that should be researched]
- [Missing information that should be researched]

## VALIDATION STAMP

This research was evaluated by the WasteWise Regulatory Compliance Judge on [Date/Time].

Evaluation Confidence: [The judge's confidence in its own evaluation]
- HIGH: All evaluation criteria clearly assessable
- MEDIUM: Some ambiguity in source materials
- LOW: Significant gaps prevent thorough evaluation

---

## QUALITY BENCHMARKS

For reference, here are examples of HIGH, MEDIUM, and LOW quality research:

### HIGH QUALITY EXAMPLE

Phase 1: Location Data Extraction ✅
- City: Austin, Texas
- County: Travis County
- State: Texas
- Zip: 78701
- Property: 560 units, 4-story multifamily
- Source: Property documentation

Phase 2: Regulatory Research ✅
Sources Consulted (5):
1. City of Austin Universal Recycling Ordinance (austintexas.gov) - OFFICIAL
2. Travis County Solid Waste Management (traviscountytx.gov) - OFFICIAL
3. Texas Commission on Environmental Quality (tceq.texas.gov) - OFFICIAL
4. Austin Resource Recovery Department (austintexas.gov) - OFFICIAL
5. Waste Management TX Compliance Guide (secondary)

Phase 3: Waste Stream Requirements ✅

RECYCLING REQUIREMENTS:
- Mandatory Status: ✅ MANDATORY
- Property Threshold: 5+ units (Property: 560 units - APPLIES)
- Minimum Capacity: 1:1 ratio with waste capacity
- Service Frequency: Minimum 1x per week
- Container Specifications: Minimum 96-gallon toters, blue lids required
- Signage: Bilingual English/Spanish required, material list posted
- Ordinance Citation: Austin City Code §15-6-91, Subchapter E

COMPOSTING REQUIREMENTS:
- Mandatory Status: ✅ MANDATORY (Effective January 1, 2024)
- Property Threshold: 75+ units (Property: 560 units - APPLIES)
- Minimum Capacity: 17 gallons per unit
- Service Frequency: Minimum 1x per week
- Accepted Materials: Food scraps, food-soiled paper, BPI-certified compostables
- Container Specifications: Green-lid toters, secure locking lids required
- Ordinance Citation: Austin City Code §15-6-91(G)

Phase 4: Penalties & Enforcement ✅
- Violation Type: Class C Misdemeanor
- Fine per Offense: Up to $500
- Fine per Day: Up to $200/day for ongoing violations
- Maximum Total: $2,000 per violation
- Enforcement Agency: Austin Code Compliance
- Contact: (512) 974-2000, compliance@austintexas.gov

Phase 5: Licensed Haulers ✅
1. Waste Management of Texas
   Phone: (512) 891-2700
   Website: wm.com
   Services: Waste, recycling, composting, compactor hauls

2. Texas Disposal Systems
   Phone: (512) 246-0010
   Website: texasdisposal.com
   Services: Waste, recycling, composting, zero-sort

3. Recology Texas
   Phone: (512) 291-3000
   Website: recology.com/texas
   Services: Waste, recycling, composting

4. AmeriWaste Services
   Phone: (512) 323-5050
   Website: ameriwaste.net
   Services: Waste, recycling, compactor hauls

Official Directory: https://www.austintexas.gov/department/registered-haulers

Phase 6: Compliance Checklist ✅
✅ Recycling capacity at 1:1 ratio with waste
✅ Blue-lid recycling toters minimum 96 gallons
✅ Bilingual signage posted on all containers
⚠️ Composting capacity: Need 9,520 gallons total (17 gal × 560 units)
⚠️ Green-lid compost toters with secure locks required
❌ Annual reporting due February 1, 2026 (not yet submitted)

JUDGE SCORING:
- Completeness: 40/40 ✅ All phases complete, all streams addressed
- Source Quality: 25/25 ✅ 5 sources, 4 official .gov, all citations proper
- Specificity: 20/20 ✅ All requirements numerical, no vague language
- Verification: 15/15 ✅ 4 haulers with full info, contacts verified, dates confirmed

Total: 100/100
Confidence: HIGH
Human Review Required: NO

---

### MEDIUM QUALITY EXAMPLE

Phase 1: Location Data Extraction ✅
- City: Plano, Texas
- County: Not specified ⚠️
- State: Texas
- Zip: 75024
- Property: 324 units, multifamily
- Source: Invoice headers

Phase 2: Regulatory Research ⚠️
Sources Consulted (3):
1. City of Plano Environmental Services (plano.gov) - OFFICIAL
2. North Texas Municipal Water District website (ntmwd.com)
3. General Texas recycling guide (third-party blog) ⚠️

Phase 3: Waste Stream Requirements ⚠️

RECYCLING REQUIREMENTS:
- Mandatory Status: ✅ MANDATORY
- Property Threshold: "Multifamily properties" (not specific) ⚠️
- Minimum Capacity: "Adequate recycling access" (not numerical) ⚠️
- Service Frequency: At least weekly ✅
- Container Specifications: Not specified ⚠️
- Signage: Required but details not found ⚠️
- Ordinance Citation: City of Plano Ordinance 2015-8-4 ✅

COMPOSTING REQUIREMENTS:
- Mandatory Status: ⚠️ VOLUNTARY (information unclear, conflicting sources)
- Property Threshold: Not applicable
- Other details: Not researched

Phase 4: Penalties & Enforcement ⚠️
- Violation Type: Not specified
- Fine per Offense: "Fines may apply" (no $ amount) ❌
- Enforcement Agency: City of Plano Code Enforcement ✅
- Contact: (972) 941-7100 ✅

Phase 5: Licensed Haulers ⚠️
1. Waste Management
   Phone: Not found
   Website: wm.com

2. Republic Services
   Phone: Not found
   Website: republicservices.com

Official Directory: Not located

Phase 6: Compliance Checklist ⚠️
✅ Recycling service required
⚠️ Specific capacity requirements unclear
⚠️ Composting status uncertain

JUDGE SCORING:
- Completeness: 25/40 ⚠️ Composting not researched, many details missing
- Source Quality: 16/25 ⚠️ Only 1 official source, used blog source
- Specificity: 10/20 ❌ Vague language used, no numerical requirements
- Verification: 7/15 ⚠️ Only 2 haulers, incomplete contact info

Total: 58/100
Confidence: MEDIUM (borderline LOW)
Human Review Required: YES - HIGH PRIORITY

Issues Requiring Human Review:
1. Confirm property threshold for recycling mandate (applies to 324 units?)
2. Obtain numerical capacity requirements from City
3. Clarify composting mandate status (conflicting information)
4. Get official hauler directory and complete contact info
5. Document penalty structure with specific $ amounts

---

### LOW QUALITY EXAMPLE (FAILED)

Phase 1: Location Data Extraction ⚠️
- City: Houston, Texas
- County: Not found
- State: Texas
- Zip: Not found
- Property: "Large multifamily" (no unit count) ❌
- Source: Unclear

Phase 2: Regulatory Research ❌
Sources Consulted (1):
1. General Texas recycling information (wikipedia) - NOT OFFICIAL ❌

Phase 3: Waste Stream Requirements ❌

RECYCLING REQUIREMENTS:
- Mandatory Status: "Probably required" ❌
- Property Threshold: Unknown
- Minimum Capacity: "Should provide recycling" ❌
- Service Frequency: "Regular pickup" ❌
- Container Specifications: Not found
- Signage: Not found
- Ordinance Citation: None found ❌

COMPOSTING REQUIREMENTS:
- Not researched ❌

WASTE REQUIREMENTS:
- Not researched ❌

Phase 4: Penalties & Enforcement ❌
- No information found

Phase 5: Licensed Haulers ❌
- No haulers identified

Phase 6: Compliance Checklist ❌
- Cannot be generated due to insufficient data

JUDGE SCORING:
- Completeness: 5/40 ❌ CRITICAL - Only 1 waste stream attempted, incomplete
- Source Quality: 0/25 ❌ CRITICAL - No official sources, no ordinance citations
- Specificity: 0/20 ❌ CRITICAL - All vague language, no numerical data
- Verification: 0/15 ❌ CRITICAL - No haulers, no contacts, no verification

Total: 5/100
Confidence: FAILED
Critical Errors: 8 (exceeds threshold)

CRITICAL ERRORS:
1. No official government sources consulted
2. No ordinance citations found
3. Missing waste stream requirements entirely
4. Missing composting stream requirements entirely
5. All requirements use vague language
6. No property size data
7. No licensed haulers identified
8. No regulatory contacts found

Human Review Required: YES - CRITICAL PRIORITY

This research is COMPLETELY INADEQUATE and must be redone from scratch.

Recommended Actions:
1. START OVER with proper research methodology
2. Contact City of Houston Solid Waste Management Department directly
3. Search Houston Code of Ordinances for waste/recycling requirements
4. Obtain property unit count from property documents
5. Research Harris County requirements if city requirements unclear
```

## Using the Judge in Practice

### Integration Pattern

```python
def evaluate_regulatory_research(research_output: Dict, property_info: Dict) -> Dict:
    """
    Send research output to LLM Judge for evaluation
    Returns evaluation report with confidence level and review recommendations
    """

    # Prepare evaluation prompt
    judge_prompt = f"""
You are the WasteWise Regulatory Compliance Research Judge. Evaluate the
following regulatory compliance research for quality and completeness.

PROPERTY INFORMATION:
{json.dumps(property_info, indent=2)}

RESEARCH OUTPUT TO EVALUATE:
{json.dumps(research_output, indent=2)}

Provide a comprehensive evaluation following the Judge Prompt Template format.
Focus on:
1. Step completion verification
2. Quality assessment with numerical scoring
3. Critical error identification
4. Human review recommendation with specific priority
5. Actionable improvement suggestions
"""

    # Call Claude as judge
    judge_response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        system="You are an expert regulatory compliance auditor and quality assessor.",
        messages=[{
            "role": "user",
            "content": judge_prompt
        }]
    )

    # Parse judge evaluation
    evaluation = parse_judge_response(judge_response.content[0].text)

    return evaluation


def parse_judge_response(judge_output: str) -> Dict:
    """
    Parse judge evaluation into structured format
    """

    evaluation = {
        'step_completion': {},
        'quality_scores': {},
        'total_score': 0,
        'confidence_level': '',
        'critical_errors': [],
        'human_review_required': False,
        'human_review_priority': '',
        'review_areas': [],
        'recommended_actions': [],
        'improvement_opportunities': {},
        'raw_evaluation': judge_output
    }

    # Extract key metrics using regex
    # (Implementation would parse the judge's structured output)

    return evaluation


def apply_judge_decision(evaluation: Dict) -> Tuple[bool, str]:
    """
    Apply judge's decision to workflow
    Returns: (proceed_with_output: bool, reason: str)
    """

    confidence = evaluation['confidence_level']
    critical_errors = len(evaluation['critical_errors'])

    # Automatic decisions
    if confidence == 'FAILED' or critical_errors >= 3:
        return False, "CRITICAL: Research quality unacceptable - complete redo required"

    if confidence == 'LOW' or critical_errors >= 1:
        return False, f"Research quality below threshold - human review required: {evaluation['review_areas']}"

    if confidence == 'MEDIUM' and evaluation['human_review_required']:
        # Allow output but flag for review
        return True, f"Output generated but flagged for review: {evaluation['review_areas']}"

    if confidence == 'HIGH':
        return True, "Research quality meets all standards - no review needed"

    # Default to caution
    return False, "Unable to assess research quality - human review required"
```

### Workflow Integration Example

```python
def run_validated_wastewise_analysis(
    invoice_files: List[str],
    contract_file: str,
    property_docs: List[str]
) -> Dict:
    """
    Complete validated WasteWise analysis with LLM Judge oversight
    """

    # Step 1: Process documents
    invoice_data = process_invoices(invoice_files)
    contract_data = process_contract(contract_file) if contract_file else None
    property_info = extract_property_info(property_docs)

    # Step 2: Conduct regulatory research
    regulatory_research = conduct_regulatory_compliance_research(property_info)

    # Step 3: JUDGE EVALUATION - First Gate
    print("🔍 Sending regulatory research to LLM Judge for evaluation...")
    judge_evaluation = evaluate_regulatory_research(regulatory_research, property_info)

    print(f"\n📊 JUDGE EVALUATION RESULTS:")
    print(f"   Total Score: {judge_evaluation['total_score']}/100")
    print(f"   Confidence Level: {judge_evaluation['confidence_level']}")
    print(f"   Critical Errors: {len(judge_evaluation['critical_errors'])}")

    # Step 4: Apply judge decision
    proceed, reason = apply_judge_decision(judge_evaluation)

    if not proceed:
        print(f"\n❌ ANALYSIS HALTED: {reason}")
        print("\n🚨 HUMAN REVIEW REQUIRED 🚨")
        print(f"Priority: {judge_evaluation['human_review_priority']}")
        print("\nReview Areas:")
        for area in judge_evaluation['review_areas']:
            print(f"  - {area}")
        print("\nRecommended Actions:")
        for action in judge_evaluation['recommended_actions']:
            print(f"  - {action}")

        return {
            'status': 'FAILED_VALIDATION',
            'judge_evaluation': judge_evaluation,
            'requires_human_review': True
        }

    # Step 5: Run remaining validations
    print("\n✅ Regulatory research passed judge evaluation")
    print("🔐 Running remaining validation checks...")

    validator = WasteWiseValidator()
    validation_passed, validation_report = validator.validate_all(
        invoice_data=invoice_data,
        contract_data=contract_data,
        property_info=property_info,
        optimization_results=calculate_optimizations(invoice_data, property_info),
        regulatory_data=regulatory_research
    )

    if not validation_passed:
        print("\n❌ VALIDATION FAILED")
        return {
            'status': 'FAILED_VALIDATION',
            'validation_report': validation_report
        }

    # Step 6: Generate output
    print("\n✅ ALL VALIDATIONS PASSED")
    print("📊 Generating workbook...")

    workbook = generate_wastewise_workbook(
        invoice_data=invoice_data,
        contract_data=contract_data,
        property_info=property_info,
        regulatory_data=regulatory_research,
        validation_report=validation_report,
        judge_evaluation=judge_evaluation  # Include in QUALITY_CHECK sheet
    )

    return {
        'status': 'SUCCESS',
        'workbook': workbook,
        'validation_report': validation_report,
        'judge_evaluation': judge_evaluation,
        'confidence_level': judge_evaluation['confidence_level']
    }
```

## Judge Evaluation Triggers

The judge is automatically invoked when:

1. **After regulatory research completion** (primary trigger)
2. **Before generating final output** (validation gate)
3. **When conflicting information is detected** (data quality check)
4. **When sources are limited or non-official** (source quality check)
5. **When vague language is detected** (specificity check)

## Judge Output Integration

The judge's evaluation is integrated into the final workbook:

### QUALITY_CHECK Sheet Enhancement

```
REGULATORY COMPLIANCE QUALITY ASSESSMENT

Judge Evaluation Timestamp: [Date/Time]
Evaluated By: WasteWise Regulatory Compliance Judge v1.0

SCORING BREAKDOWN:
├─ Completeness: [X/40]
├─ Source Quality: [X/25]
├─ Specificity: [X/20]
└─ Verification: [X/15]
    ───────────────────
    Total Score: [X/100]

Confidence Level: [HIGH / MEDIUM / LOW / FAILED]

Critical Errors Found: [Number]
[List of critical errors if any]

Human Review Status: [REQUIRED / RECOMMENDED / NOT NEEDED]
Review Priority: [CRITICAL / HIGH / MEDIUM / LOW / NONE]

Specific Review Items:
1. [Item requiring human attention]
2. [Item requiring human attention]

Judge Confidence in Evaluation: [HIGH / MEDIUM / LOW]
```

## Best Practices

1. **Always run the judge evaluation before generating output**
2. **Do not override LOW confidence determinations without human review**
3. **Document all judge recommendations in the final workbook**
4. **Use judge feedback to improve research methodology**
5. **Archive judge evaluations for continuous improvement**

## Success Metrics

Track these metrics to monitor judge effectiveness:

- **Judge Accuracy**: % of judge assessments confirmed by human review
- **False Positives**: % of LOW confidence cases that were actually adequate
- **False Negatives**: % of HIGH confidence cases that had issues
- **Review Efficiency**: Average time saved by automated evaluation

Target: 95%+ judge accuracy, <5% false negatives (critical)

## Continuous Improvement

The judge system learns from:

1. Human reviewer feedback on judge assessments
2. Pattern analysis of common research gaps
3. Evolution of regulatory landscapes
4. New ordinance formats and sources

Periodically review and update judge criteria based on real-world performance.
