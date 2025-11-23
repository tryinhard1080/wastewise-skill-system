# WasteWise Regulatory Compliance Test Suite

## Purpose

This test suite provides comprehensive test cases to validate both:

1. The regulatory compliance research functionality
2. The LLM Judge evaluation system

## Test Structure

Each test case includes:

- **Test ID**: Unique identifier
- **Test Type**: Research Quality, Judge Accuracy, Integration, Edge Case
- **Input Data**: Property information and research context
- **Expected Behavior**: What should happen
- **Success Criteria**: How to measure success
- **Judge Expected Assessment**: What the judge should conclude

## Test Case Categories

### Category 1: High-Quality Research Tests

Tests where research should pass all validations

### Category 2: Medium-Quality Research Tests

Tests where research has minor issues but should proceed with warnings

### Category 3: Low-Quality Research Tests

Tests where research should fail validation and require human review

### Category 4: Judge Accuracy Tests

Tests specifically designed to evaluate judge decision-making

### Category 5: Edge Case Tests

Tests for unusual or boundary conditions

---

## TEST CASES

### Test Case 1.1: Ideal High-Quality Research

**Test ID:** HQR-001  
**Type:** Research Quality - High  
**Objective:** Verify system correctly identifies excellent research

**Input Property Data:**

```json
{
  "property_name": "The Park at Meadowmont",
  "unit_count": 328,
  "location": {
    "city": "Chapel Hill",
    "county": "Orange County",
    "state": "North Carolina",
    "zip": "27517"
  },
  "property_type": "Garden-style multifamily",
  "building_stories": 3
}
```

**Research Output:**

```json
{
  "location_verified": true,
  "sources_consulted": [
    {
      "name": "Town of Chapel Hill Solid Waste Ordinance",
      "url": "https://www.townofchapelhill.org/ordinances",
      "type": "official_gov",
      "date_accessed": "2025-11-08"
    },
    {
      "name": "Orange County Solid Waste Management",
      "url": "https://www.orangecountync.gov/departments/solid_waste",
      "type": "official_gov",
      "date_accessed": "2025-11-08"
    },
    {
      "name": "NC DEQ Recycling Requirements",
      "url": "https://deq.nc.gov/about/divisions/waste-management",
      "type": "official_gov",
      "date_accessed": "2025-11-08"
    }
  ],
  "ordinances_cited": [
    "Chapel Hill Town Code §11-5: Solid Waste Collection",
    "NC General Statute §130A-309.09A: Recycling Requirements"
  ],
  "requirements": {
    "waste": {
      "municipal_service": false,
      "private_hauler_required": true,
      "minimum_frequency": "3 times per week for 300+ units",
      "container_specifications": "6-8 cubic yard dumpsters or 30-cubic yard compactor",
      "licensed_hauler_required": true
    },
    "recycling": {
      "mandatory": true,
      "property_threshold": "All multifamily properties 5+ units",
      "applies_to_property": true,
      "capacity_requirement": "Equal to 50% of waste capacity",
      "capacity_calculation": "328 units × 2.5 yards per door × 0.5 = 410 cubic yards per month",
      "minimum_frequency": "2 times per week minimum",
      "accepted_materials": "Single-stream: paper, cardboard, glass, metal, plastics #1-7",
      "container_specifications": "Blue-lid toters minimum 64 gallons OR blue-lid 4-6 yard dumpsters",
      "signage_required": true,
      "signage_details": "Material lists in English and Spanish, contamination warnings, recycling symbol required",
      "co_location": "Recycling containers must be within 10 feet of waste containers"
    },
    "composting": {
      "mandatory": false,
      "voluntary_program": true,
      "details": "Chapel Hill offers voluntary food waste collection for multifamily properties upon request"
    }
  },
  "penalties": {
    "violation_type": "Civil violation",
    "fine_per_offense": "Up to $500",
    "fine_per_day": "Up to $100 per day for continuing violations",
    "maximum_penalty": "$2,500 per violation series",
    "enforcement_agency": "Chapel Hill Code Compliance",
    "enforcement_contact": {
      "phone": "(919) 968-2743",
      "email": "codecompliance@townofchapelhill.org"
    }
  },
  "licensed_haulers": [
    {
      "name": "Waste Industries",
      "phone": "(919) 968-2000",
      "website": "https://wasteindustries.com",
      "services": ["waste", "recycling", "compactor_hauls"]
    },
    {
      "name": "GFL Environmental",
      "phone": "(919) 942-4500",
      "website": "https://gflenv.com",
      "services": ["waste", "recycling", "bulk_pickup"]
    },
    {
      "name": "Republic Services",
      "phone": "(919) 544-5550",
      "website": "https://republicservices.com",
      "services": ["waste", "recycling", "compactor_hauls"]
    },
    {
      "name": "Orange County Solid Waste",
      "phone": "(919) 968-2788",
      "website": "https://www.orangecountync.gov/departments/solid_waste",
      "services": ["recycling", "yard_waste"]
    }
  ],
  "compliance_checklist": [
    {
      "requirement": "Private licensed hauler contracted",
      "status": "needs_verification",
      "priority": "high"
    },
    {
      "requirement": "Recycling capacity at 50% of waste capacity (410 cu yd/month)",
      "status": "needs_calculation",
      "priority": "high"
    },
    {
      "requirement": "Blue-lid recycling containers with proper signage",
      "status": "needs_verification",
      "priority": "medium"
    },
    {
      "requirement": "Bilingual signage (English/Spanish) on all containers",
      "status": "needs_verification",
      "priority": "medium"
    },
    {
      "requirement": "Recycling containers within 10 feet of waste containers",
      "status": "needs_verification",
      "priority": "medium"
    }
  ]
}
```

**Expected Judge Assessment:**

- **Completeness Score:** 40/40
- **Source Quality Score:** 25/25
- **Specificity Score:** 20/20
- **Verification Score:** 15/15
- **Total Score:** 100/100
- **Confidence Level:** HIGH
- **Critical Errors:** 0
- **Human Review Required:** NO

**Success Criteria:**

- ✅ All 3 waste streams addressed
- ✅ 3+ official .gov sources
- ✅ Ordinances properly cited
- ✅ All capacity requirements numerical
- ✅ 4+ licensed haulers with full contact info
- ✅ Specific compliance checklist generated
- ✅ Judge assigns HIGH confidence
- ✅ No human review required

---

### Test Case 2.1: Medium-Quality Research - Missing Details

**Test ID:** MQR-001  
**Type:** Research Quality - Medium  
**Objective:** Verify system correctly identifies acceptable research with minor gaps

**Input Property Data:**

```json
{
  "property_name": "Riverside Apartments",
  "unit_count": 245,
  "location": {
    "city": "Portland",
    "county": "Multnomah County",
    "state": "Oregon",
    "zip": "97214"
  }
}
```

**Research Output:**

```json
{
  "location_verified": true,
  "sources_consulted": [
    {
      "name": "Portland Bureau of Planning and Sustainability",
      "url": "https://www.portland.gov/bps",
      "type": "official_gov"
    },
    {
      "name": "Metro Portland Waste Management",
      "url": "https://www.oregonmetro.gov/tools-living/garbage-and-recycling",
      "type": "official_gov"
    },
    {
      "name": "Oregon DEQ Commercial Recycling",
      "url": "https://www.oregon.gov/deq",
      "type": "official_gov"
    }
  ],
  "ordinances_cited": ["Portland City Code §17.102: Solid Waste and Recycling"],
  "requirements": {
    "waste": {
      "municipal_service": false,
      "private_hauler_required": true,
      "minimum_frequency": "Not specified",
      "container_specifications": "Not specified"
    },
    "recycling": {
      "mandatory": true,
      "property_threshold": "All multifamily properties",
      "applies_to_property": true,
      "capacity_requirement": "Equal to waste capacity",
      "capacity_calculation": "Must match waste container volume",
      "minimum_frequency": "Same as waste collection",
      "accepted_materials": "Paper, cardboard, glass, metal, plastics",
      "container_specifications": "Must be clearly marked for recycling",
      "signage_required": true,
      "signage_details": "Material lists required, specific language not documented"
    },
    "composting": {
      "mandatory": true,
      "property_threshold": "Commercial properties generating 1 cubic yard or more per week",
      "effective_date": "July 1, 2023",
      "capacity_requirement": "Not specified numerically",
      "accepted_materials": "Food scraps, food-soiled paper"
    }
  },
  "penalties": {
    "violation_type": "Civil violation",
    "fine_per_offense": "Penalties may be assessed",
    "enforcement_agency": "Bureau of Planning and Sustainability",
    "enforcement_contact": {
      "phone": "(503) 823-7202"
    }
  },
  "licensed_haulers": [
    {
      "name": "Waste Management",
      "phone": "(503) 249-8078",
      "services": ["waste", "recycling"]
    },
    {
      "name": "Recology",
      "phone": "(503) 249-4500",
      "services": ["waste", "recycling", "composting"]
    }
  ]
}
```

**Expected Judge Assessment:**

- **Completeness Score:** 28/40 (Waste details missing, composting capacity vague)
- **Source Quality Score:** 22/25 (Good sources but limited detail extraction)
- **Specificity Score:** 12/20 (Multiple vague requirements)
- **Verification Score:** 9/15 (Only 2 haulers, incomplete contact info)
- **Total Score:** 71/100
- **Confidence Level:** MEDIUM
- **Critical Errors:** 0
- **Human Review Required:** YES (Priority: MEDIUM)

**Specific Issues Identified:**

- ⚠️ Waste collection frequency not specified
- ⚠️ Container specifications vague
- ⚠️ Composting capacity requirement not numerical
- ⚠️ Penalty amounts not specific ($)
- ⚠️ Only 2 licensed haulers (need 3+)
- ⚠️ Missing hauler contact details (websites)
- ⚠️ Signage details incomplete

**Judge Recommendations:**

1. Contact Portland BPS directly to confirm composting capacity formula
2. Obtain specific container size requirements from ordinance text
3. Document exact penalty amounts from Portland City Code
4. Add at least 1 more licensed hauler with complete contact info
5. Clarify bilingual signage requirements

**Success Criteria:**

- ✅ Judge correctly identifies as MEDIUM quality
- ✅ Judge lists specific gaps requiring attention
- ✅ Judge recommends MEDIUM priority human review
- ✅ Output allowed but flagged for verification
- ✅ Actionable recommendations provided

---

### Test Case 3.1: Low-Quality Research - Critical Gaps

**Test ID:** LQR-001  
**Type:** Research Quality - Low  
**Objective:** Verify system correctly rejects inadequate research

**Input Property Data:**

```json
{
  "property_name": "Sunset Villas",
  "unit_count": 156,
  "location": {
    "city": "Phoenix",
    "state": "Arizona",
    "zip": "85016"
  }
}
```

**Research Output:**

```json
{
  "location_verified": true,
  "sources_consulted": [
    {
      "name": "Phoenix Recycling Information",
      "url": "https://www.phoenix.gov/publicworks",
      "type": "official_gov"
    },
    {
      "name": "Arizona Recycling Guide",
      "url": "https://recycling-guide-arizona.com",
      "type": "third_party_website"
    }
  ],
  "ordinances_cited": [],
  "requirements": {
    "waste": {
      "details": "Standard waste collection applies"
    },
    "recycling": {
      "mandatory": "Unclear",
      "capacity_requirement": "Properties should provide adequate recycling",
      "minimum_frequency": "Regular pickup recommended",
      "signage_required": "Information not found"
    },
    "composting": {
      "mandatory": "Unknown"
    }
  },
  "penalties": {
    "details": "Information not available"
  },
  "licensed_haulers": []
}
```

**Expected Judge Assessment:**

- **Completeness Score:** 8/40 (Major gaps in all streams)
- **Source Quality Score:** 5/25 (Only 1 official source, no citations)
- **Specificity Score:** 0/20 (All vague language)
- **Verification Score:** 0/15 (No haulers, no contacts, no verification)
- **Total Score:** 13/100
- **Confidence Level:** FAILED
- **Critical Errors:** 6+

**Critical Errors:**

1. ❌ Only 1 official government source
2. ❌ Zero ordinance citations
3. ❌ Recycling requirements entirely vague ("adequate", "regular")
4. ❌ Composting requirements not researched ("unknown")
5. ❌ No penalty information
6. ❌ Zero licensed haulers identified
7. ❌ No regulatory contact information

**Expected Judge Decision:**

- **Human Review Required:** YES (Priority: CRITICAL)
- **Output Generation:** BLOCKED
- **Recommendation:** Complete research redo required

**Success Criteria:**

- ✅ Judge correctly identifies as FAILED
- ✅ Judge lists all critical errors
- ✅ Judge blocks output generation
- ✅ Judge recommends complete redo
- ✅ Specific gaps clearly articulated

---

### Test Case 4.1: Judge Accuracy - False Positive Detection

**Test ID:** JA-001  
**Type:** Judge Accuracy  
**Objective:** Verify judge can detect research that APPEARS good but has hidden flaws

**Input Research:**

```json
{
  "location": { "city": "Denver", "state": "Colorado" },
  "sources_consulted": [
    {
      "name": "Denver Environmental Health",
      "url": "denvergov.org",
      "type": "official_gov"
    },
    {
      "name": "Colorado DEQ",
      "url": "colorado.gov/cdphe",
      "type": "official_gov"
    },
    {
      "name": "Denver Waste Management",
      "url": "denvergov.org/waste",
      "type": "official_gov"
    }
  ],
  "ordinances_cited": [
    "Denver Revised Municipal Code §48-151",
    "Denver Revised Municipal Code §48-155"
  ],
  "requirements": {
    "recycling": {
      "mandatory": true,
      "capacity_requirement": "50% of waste capacity",
      "minimum_frequency": "2 times per week",
      "container_specifications": "4-6 cubic yard blue dumpsters"
    },
    "composting": {
      "mandatory": true,
      "effective_date": "January 1, 2024",
      "capacity_requirement": "25% of waste capacity",
      "minimum_frequency": "Weekly collection"
    }
  },
  "penalties": {
    "fine_per_offense": "$150-$999",
    "enforcement_agency": "Denver Environmental Health"
  },
  "licensed_haulers": [
    { "name": "Waste Management", "phone": "(303) 797-1600" },
    { "name": "Republic Services", "phone": "(303) 288-2100" },
    { "name": "Alpine Waste", "phone": "(303) 744-9881" }
  ]
}
```

**Hidden Flaw:** The composting mandate effective date of "January 1, 2024" is **fabricated** - Denver has NO mandatory composting ordinance as of November 2025.

**Expected Judge Assessment:**

- Judge should flag this as **SUSPICIOUS** due to:
  - Recent composting mandate (2024) not widely reported
  - Lack of specific ordinance citation for composting (only recycling cited)
  - Round percentage (25%) seems estimated rather than researched

**Judge Should Recommend:**

- ⚠️ **VERIFICATION NEEDED** on composting mandate
- 🔍 Human review to confirm recent ordinance changes
- Priority: HIGH (potential misinformation)

**Success Criteria:**

- ✅ Judge identifies potential fabrication
- ✅ Judge flags recent ordinance claims for verification
- ✅ Judge notes missing ordinance citation for composting
- ✅ Confidence downgraded to MEDIUM or LOW
- ✅ Human review recommended specifically for composting requirement

---

### Test Case 4.2: Judge Accuracy - False Negative Detection

**Test ID:** JA-002  
**Type:** Judge Accuracy  
**Objective:** Verify judge doesn't incorrectly fail adequate research

**Input Research:**

```json
{
  "location": { "city": "San Francisco", "state": "California" },
  "sources_consulted": [
    {
      "name": "SF Environment",
      "url": "sfenvironment.org",
      "type": "official_gov"
    },
    {
      "name": "CalRecycle Commercial Recycling",
      "url": "calrecycle.ca.gov",
      "type": "official_gov"
    }
  ],
  "ordinances_cited": ["SF Environment Code Chapter 19", "California AB 1826"],
  "requirements": {
    "recycling": {
      "mandatory": true,
      "capacity_requirement": "Based on waste stream composition study",
      "note": "SF requires waste characterization study rather than fixed ratio"
    },
    "composting": {
      "mandatory": true,
      "capacity_requirement": "Based on waste stream composition study",
      "note": "SF requires waste characterization study for organics diversion"
    }
  }
}
```

**Context:** San Francisco's approach IS different - they require waste characterization studies rather than fixed capacity ratios. This is CORRECT and well-documented.

**Expected Judge Assessment:**

- Judge should recognize this is a **LEGITIMATE ALTERNATIVE APPROACH**
- Judge should NOT penalize for "vague" requirements
- Judge should note the unique SF requirement in assessment
- Confidence: HIGH or MEDIUM (not LOW)

**Success Criteria:**

- ✅ Judge recognizes legitimate alternative regulatory approach
- ✅ Judge doesn't penalize for non-numerical requirements when appropriate
- ✅ Judge notes the unique local requirement
- ✅ Judge allows research to proceed
- ✅ No false failure

---

### Test Case 5.1: Edge Case - Rural Location with Limited Regulations

**Test ID:** EC-001  
**Type:** Edge Case  
**Objective:** Handle locations with minimal or no waste regulations

**Input Property Data:**

```json
{
  "property_name": "Country Meadows",
  "unit_count": 48,
  "location": {
    "city": "Livingston",
    "county": "Park County",
    "state": "Montana",
    "zip": "59047"
  }
}
```

**Research Output:**

```json
{
  "location_verified": true,
  "sources_consulted": [
    {
      "name": "Park County Solid Waste",
      "url": "parkcounty.org",
      "type": "official_gov"
    },
    {
      "name": "Montana DEQ Solid Waste",
      "url": "deq.mt.gov",
      "type": "official_gov"
    },
    {
      "name": "Livingston City Government",
      "url": "livingstonmontana.org",
      "type": "official_gov"
    }
  ],
  "ordinances_cited": [],
  "findings": {
    "summary": "No mandatory recycling or composting ordinances found at city, county, or state level for properties of this size.",
    "waste": {
      "municipal_service": true,
      "private_hauler_option": true,
      "requirements": "Basic refuse collection available, no specific multifamily requirements"
    },
    "recycling": {
      "mandatory": false,
      "voluntary_options": "Park County Transfer Station accepts recyclables during business hours"
    },
    "composting": {
      "mandatory": false,
      "programs": "No commercial composting programs available in area"
    }
  },
  "licensed_haulers": [
    { "name": "Park County Refuse", "phone": "(406) 222-4155" },
    { "name": "Livingston Sanitation", "phone": "(406) 222-4000" }
  ]
}
```

**Expected Judge Assessment:**

- **Confidence Level:** HIGH (for confirming ABSENCE of regulations)
- **Critical Errors:** 0
- **Special Note:** "Research correctly identifies absence of mandatory requirements"

**Judge Should Note:**

- ✅ Thorough search conducted (3 gov sources)
- ✅ Absence of requirements is well-documented
- ✅ Voluntary options identified
- ✅ Available haulers listed
- ⚠️ Consider recommending voluntary best practices

**Success Criteria:**

- ✅ Judge recognizes valid "no requirements found" research
- ✅ Judge doesn't penalize for lack of mandatory ordinances
- ✅ Judge validates thoroughness of search
- ✅ HIGH or MEDIUM confidence assigned
- ✅ No false failure

---

### Test Case 5.2: Edge Case - Recent Ordinance Change During Research

**Test ID:** EC-002  
**Type:** Edge Case  
**Objective:** Handle conflicting information due to very recent changes

**Input Property Data:**

```json
{
  "property_name": "Metro Plaza",
  "unit_count": 412,
  "location": {
    "city": "Seattle",
    "state": "Washington"
  }
}
```

**Research Output:**

```json
{
  "sources_consulted": [
    {
      "name": "Seattle Public Utilities",
      "url": "seattle.gov/utilities",
      "date_accessed": "2025-11-08",
      "composting_status": "Mandatory for 10+ units as of October 1, 2025"
    },
    {
      "name": "King County Solid Waste",
      "url": "kingcounty.gov/solid-waste",
      "date_accessed": "2025-11-08",
      "composting_status": "Planned mandate, effective date TBD"
    }
  ],
  "requirements": {
    "composting": {
      "mandatory": "Recently changed",
      "effective_date": "October 1, 2025 per Seattle.gov, but not confirmed in county sources",
      "status": "CONFLICTING INFORMATION FOUND",
      "note": "Ordinance appears to have just taken effect, county website may not be updated"
    }
  },
  "confidence_note": "Recent ordinance change detected. Sources show conflicting information, likely due to very recent effective date."
}
```

**Expected Judge Assessment:**

- **Confidence Level:** MEDIUM
- **Human Review Required:** YES (Priority: HIGH)
- **Reason:** "Conflicting sources regarding recent ordinance change"

**Judge Should Recommend:**

- 📞 Direct phone call to Seattle Public Utilities to confirm effective date
- 📋 Request copy of final ordinance text
- ⏰ Verify grace period or phase-in schedule
- 🔄 Re-check sources in 30 days for consistency

**Success Criteria:**

- ✅ Judge recognizes legitimate conflict due to recency
- ✅ Judge doesn't fail research for documented conflicts
- ✅ Judge recommends appropriate verification steps
- ✅ Confidence adjusted appropriately (MEDIUM not LOW)
- ✅ Clear path forward provided

---

## Test Execution Framework

### Automated Test Runner

```python
def run_test_case(test_case: Dict) -> Dict:
    """
    Execute a single test case and compare results to expectations
    """

    # Extract test data
    property_data = test_case['input_property_data']
    research_output = test_case['research_output']
    expected_assessment = test_case['expected_judge_assessment']

    # Run regulatory research validator
    validator = RegulatoryComplianceValidator()
    passed, confidence = validator.validate_regulatory_research(
        research_output, property_data
    )

    # Run LLM judge
    judge_evaluation = evaluate_regulatory_research(
        research_output, property_data
    )

    # Compare results to expectations
    test_results = {
        'test_id': test_case['test_id'],
        'test_type': test_case['type'],
        'validator_passed': passed,
        'validator_confidence': confidence,
        'judge_score': judge_evaluation['total_score'],
        'judge_confidence': judge_evaluation['confidence_level'],
        'expected_confidence': expected_assessment['confidence_level'],
        'expected_score_range': expected_assessment.get('score_range'),
        'confidence_match': judge_evaluation['confidence_level'] == expected_assessment['confidence_level'],
        'critical_errors_found': len(judge_evaluation['critical_errors']),
        'expected_critical_errors': expected_assessment['critical_errors'],
        'human_review_required': judge_evaluation['human_review_required'],
        'expected_human_review': expected_assessment['human_review_required']
    }

    # Evaluate test success
    test_results['test_passed'] = (
        test_results['confidence_match'] and
        test_results['human_review_required'] == test_results['expected_human_review'] and
        abs(test_results['critical_errors_found'] - test_results['expected_critical_errors']) <= 1
    )

    return test_results


def run_full_test_suite(test_cases: List[Dict]) -> Dict:
    """
    Run all test cases and generate comprehensive report
    """

    results = {
        'timestamp': datetime.now().isoformat(),
        'total_tests': len(test_cases),
        'tests_passed': 0,
        'tests_failed': 0,
        'test_results': [],
        'summary_by_category': {}
    }

    for test_case in test_cases:
        test_result = run_test_case(test_case)
        results['test_results'].append(test_result)

        if test_result['test_passed']:
            results['tests_passed'] += 1
        else:
            results['tests_failed'] += 1

    # Calculate pass rate
    results['pass_rate'] = results['tests_passed'] / results['total_tests'] * 100

    # Generate summary by category
    categories = set(tc['type'] for tc in test_cases)
    for category in categories:
        category_tests = [r for r in results['test_results'] if r['test_type'] == category]
        category_passed = sum(1 for r in category_tests if r['test_passed'])

        results['summary_by_category'][category] = {
            'total': len(category_tests),
            'passed': category_passed,
            'failed': len(category_tests) - category_passed,
            'pass_rate': category_passed / len(category_tests) * 100
        }

    return results


def generate_test_report(results: Dict) -> str:
    """
    Generate human-readable test report
    """

    report = f"""

============================================================
    WASTEWISE REGULATORY COMPLIANCE TEST REPORT
============================================================

Test Execution: {results['timestamp']}
Total Tests: {results['total_tests']}
Tests Passed: {results['tests_passed']}
Tests Failed: {results['tests_failed']}
Overall Pass Rate: {results['pass_rate']:.1f}%

------------------------------------------------------------
RESULTS BY CATEGORY
------------------------------------------------------------
"""

    for category, summary in results['summary_by_category'].items():
        report += f"""
{category}:
  Total: {summary['total']}
  Passed: {summary['passed']}
  Failed: {summary['failed']}
  Pass Rate: {summary['pass_rate']:.1f}%
"""

    report += """
------------------------------------------------------------
DETAILED TEST RESULTS
------------------------------------------------------------
"""

    for test_result in results['test_results']:
        status = "✅ PASSED" if test_result['test_passed'] else "❌ FAILED"

        report += f"""
{status} - {test_result['test_id']} ({test_result['test_type']})
  Judge Score: {test_result['judge_score']}/100
  Judge Confidence: {test_result['judge_confidence']}
  Expected Confidence: {test_result['expected_confidence']}
  Confidence Match: {test_result['confidence_match']}
  Critical Errors: {test_result['critical_errors_found']} (Expected: {test_result['expected_critical_errors']})
  Human Review: {test_result['human_review_required']} (Expected: {test_result['expected_human_review']})
"""

        if not test_result['test_passed']:
            report += f"  ⚠️  DISCREPANCY: Judge assessment did not match expectations\n"

    report += """
============================================================
"""

    return report
```

### Test Suite Acceptance Criteria

The test suite is considered successful if:

1. **Overall Pass Rate ≥ 90%**
2. **High-Quality Research Tests: 100% pass rate** (no false negatives)
3. **Low-Quality Research Tests: 100% pass rate** (no false positives)
4. **Judge Accuracy Tests: ≥ 85% pass rate**
5. **Edge Case Tests: ≥ 80% pass rate**

### Continuous Testing

Run the test suite:

- **After every judge prompt update**
- **After every validator code change**
- **Weekly on production system**
- **Before deploying to Greystar properties**

### Test Suite Maintenance

Update test cases when:

- New ordinance formats encountered
- Judge makes systematic errors
- New regulatory patterns emerge
- False positives/negatives detected in production

---

## Success Metrics

Track these metrics from test suite execution:

1. **Judge Accuracy Rate**: % of correct confidence assignments
2. **False Positive Rate**: % of LOW/FAILED that should be MEDIUM/HIGH
3. **False Negative Rate**: % of HIGH/MEDIUM that should be LOW/FAILED (CRITICAL)
4. **Critical Error Detection**: % of critical errors caught
5. **Human Review Precision**: % of human reviews that were necessary

### Target Metrics:

- Judge Accuracy: ≥95%
- False Positive Rate: ≤10%
- False Negative Rate: ≤2% (critical - better to over-flag than miss issues)
- Critical Error Detection: 100%
- Human Review Precision: ≥85%
