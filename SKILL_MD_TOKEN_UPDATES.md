# SKILL.md Updates - Token Management & Database Integration

## Add These Sections to Your Existing SKILL.md

---

## NEW SECTION: Token Budget Management

### Pre-Analysis Token Check Protocol

**CRITICAL:** Claude must check token budget before starting any WasteWise analysis.

```python
def check_token_budget_and_warn():
    """
    Assess token budget before starting analysis
    Display warning to user with strategy recommendation
    """
    # Token cost estimates
    COSTS = {
        'skill_load': 8200,
        'invoice_processing_base': 15000,
        'invoice_per_month': 1200,  # Additional per month of data
        'contract_extraction': 5000,
        'regulatory_research_live': 12000,  # If conducting live research
        'regulatory_research_cached': 500,   # If using pre-researched database
        'excel_generation': 25000,
        'html_generation': 18000,
        'validation': 3000
    }
    
    current_usage = get_current_token_count()
    total_budget = 190000
    
    # Calculate estimated needs based on inputs
    estimated_needs = (
        COSTS['skill_load'] +
        COSTS['invoice_processing_base'] +
        (invoice_months * COSTS['invoice_per_month']) +
        (COSTS['contract_extraction'] if has_contract else 0) +
        (COSTS['regulatory_research_cached'] if in_database else COSTS['regulatory_research_live']) +
        COSTS['excel_generation'] +
        COSTS['html_generation'] +
        COSTS['validation']
    )
    
    projected_total = current_usage + estimated_needs
    percentage_used = (projected_total / total_budget) * 100
    
    # Display warning
    print("=" * 60)
    print("📊 TOKEN BUDGET CHECK")
    print("=" * 60)
    print(f"Current usage: {current_usage:,} tokens ({current_usage/total_budget*100:.1f}% of budget)")
    print(f"Estimated analysis needs: {estimated_needs:,} tokens")
    print(f"Total projected: {projected_total:,} tokens ({percentage_used:.1f}% of budget)")
    print()
    
    if percentage_used < 70:
        print("Status: ✅ SAFE TO PROCEED")
        print("Proceeding with full WasteWise Complete Suite analysis.")
        return 'FULL'
    
    elif percentage_used < 85:
        print("Status: ⚠️ TIGHT - Implementing efficiency measures")
        print()
        print("Actions:")
        print("- Streamlining regulatory research (2 searches max, 1-2 fetches)")
        print("- Efficient Excel generation")
        print("- Dashboard creation if budget allows")
        return 'STREAMLINED'
    
    else:
        print("Status: ❌ PHASED APPROACH REQUIRED")
        print()
        print("Plan:")
        print("Phase 1 (This message): Generate Excel workbook (all 8 tabs)")
        print("Phase 2 (Follow-up): Generate HTML dashboard")
        print()
        print("This ensures complete Excel delivery without risk of truncation.")
        return 'PHASED'
    
    print("=" * 60)
    print()
```

---

## UPDATED SECTION: Regulatory Compliance Research

### Token-Efficient Research Protocol

Replace the existing `conduct_regulatory_research()` function with this optimized version:

```python
def conduct_regulatory_research_optimized(city, state):
    """
    Token-optimized regulatory research with database integration
    
    Priority:
    1. Check pre-researched ordinance database (saves 8,000-15,000 tokens!)
    2. If not found, conduct minimal live research (2 searches max, 1-2 fetches)
    
    Returns: Regulatory requirements with confidence score
    """
    
    # STEP 1: Check pre-researched database first
    ordinance_db = load_ordinance_database()
    city_key = f"{city.lower().replace(' ', '_')}_{state.lower()}"
    
    if city_key in ordinance_db:
        print(f"✅ Using pre-researched ordinance data for {city}, {state}")
        print(f"   Confidence: {ordinance_db[city_key]['confidence']}")
        print(f"   Last updated: {ordinance_db[city_key]['last_updated']}")
        print(f"   Token savings: ~12,000 tokens\n")
        
        return format_cached_regulatory_data(ordinance_db[city_key])
    
    # STEP 2: Not in database - conduct live research (token-efficient)
    print(f"⚠️  No pre-researched data for {city}, {state}")
    print(f"   Conducting live research (streamlined protocol)\n")
    
    research_data = {
        'location': f"{city}, {state}",
        'sources_consulted': [],
        'waste_requirements': {},
        'recycling_requirements': {},
        'composting_requirements': {},
        'penalties': {},
        'licensed_haulers': [],
        'regulatory_contacts': {},
        'confidence_score': 'LOW',
        'needs_database_entry': True  # Flag for future caching
    }
    
    # SEARCH 1: Municode.com (highest quality, standardized format)
    query_1 = f'"{city}" "{state}" site:municode.com recycling ordinance'
    results_1 = web_search(query_1)
    research_data['sources_consulted'].append(query_1)
    
    municode_results = [r for r in results_1 if 'municode.com' in r['url']]
    
    if municode_results:
        # FETCH 1: Municode ordinance page (best source)
        ordinance_content = web_fetch(municode_results[0]['url'])
        extract_all_requirements(ordinance_content, research_data)
        research_data['confidence_score'] = 'HIGH'
        research_data['primary_source'] = municode_results[0]['url']
        
        # STOP HERE if municode found - we have everything we need
        return finalize_research_data(research_data)
    
    # SEARCH 2: City .gov website (backup)
    query_2 = f'"{city}" "{state}" recycling multifamily requirements site:.gov'
    results_2 = web_search(query_2)
    research_data['sources_consulted'].append(query_2)
    
    gov_results = [r for r in results_2 if f'{city.lower().replace(" ", "")}' in r['url'].lower()]
    
    if gov_results:
        # FETCH 2: City government page
        gov_content = web_fetch(gov_results[0]['url'])
        extract_all_requirements(gov_content, research_data)
        research_data['confidence_score'] = 'MEDIUM'
        research_data['primary_source'] = gov_results[0]['url']
    
    # STOP HERE - Maximum 2 searches, 2 fetches
    # If insufficient data, flag for manual review
    if research_data['confidence_score'] == 'LOW':
        research_data['manual_review_required'] = True
        research_data['recommendation'] = (
            f"Insufficient ordinance data for {city}, {state}. "
            "Recommend manual research and database entry."
        )
    
    return finalize_research_data(research_data)


def load_ordinance_database():
    """
    Load pre-researched ordinance database from file
    Returns: Dictionary of city ordinance data
    """
    database_path = '/mnt/project/ordinance_database.json'
    
    try:
        with open(database_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️  Ordinance database not found - all research will be live")
        return {}


def format_cached_regulatory_data(cached_data):
    """
    Convert cached database entry into standard research_data format
    """
    return {
        'location': cached_data['location'],
        'sources_consulted': [cached_data['primary_source']],
        'waste_requirements': cached_data.get('waste_requirements', {}),
        'recycling_requirements': {
            'mandatory': cached_data['recycling_mandatory'],
            'property_threshold_units': cached_data.get('threshold_units'),
            'capacity_requirement': cached_data.get('capacity_requirement'),
            'capacity_specific': True,
            'service_frequency': cached_data.get('service_frequency'),
            'container_specifications': cached_data.get('container_specs', {}),
            'co_location_required': cached_data.get('colocation_required', False)
        },
        'composting_requirements': {
            'mandatory': cached_data.get('composting_required', False),
            'effective_date': cached_data.get('composting_effective_date'),
            'property_threshold_units': cached_data.get('composting_threshold_units'),
            'accepted_materials': cached_data.get('accepted_materials', [])
        },
        'penalties': cached_data.get('penalties', {}),
        'licensed_haulers': cached_data.get('licensed_haulers', []),
        'regulatory_contacts': cached_data.get('contacts', {}),
        'confidence_score': cached_data['confidence'],
        'primary_source': cached_data['primary_source'],
        'last_updated': cached_data['last_updated'],
        'cached_data': True  # Flag indicating this came from database
    }
```

### Token Savings Comparison

| Method | Web Searches | Web Fetches | Estimated Tokens | Time |
|--------|--------------|-------------|------------------|------|
| **Old Method** | 3-4 searches | 3-4 fetches | 12,000-18,000 | 2-3 min |
| **Streamlined Live** | 2 searches | 1-2 fetches | 6,000-10,000 | 1-2 min |
| **Database Cached** | 0 searches | 0 fetches | 300-500 | < 5 sec |

**Savings with database: 96% token reduction + 98% time reduction**

---

## INTEGRATION INTO MASTER WORKFLOW

Update the `execute_wastewise_complete_suite()` function:

```python
def execute_wastewise_complete_suite(uploaded_files, property_name=None, 
                                     units=None, location=None):
    """
    Master workflow function with token management
    """
    
    print("🚀 WasteWise Complete Suite - Starting Analysis...")
    print("=" * 60)
    
    # TOKEN BUDGET CHECK (NEW - STEP 0)
    strategy = check_token_budget_and_warn()
    
    # STEP 1: Data Extraction
    print("📄 Step 1: Processing invoices and contract...")
    
    invoice_files = [f for f in uploaded_files if 'invoice' in f.lower() or 'statement' in f.lower()]
    contract_files = [f for f in uploaded_files if 'contract' in f.lower() or 'agreement' in f.lower()]
    
    invoice_data = process_invoices(invoice_files)
    property_data = extract_property_info(invoice_data, contract_files[0] if contract_files else None)
    
    # Override with user-provided values
    if property_name:
        property_data['name'] = property_name
    if units:
        property_data['units'] = units
    if location:
        property_data['location'] = location
    
    print(f"✓ Property: {property_data['name']} ({property_data['units']} units)")
    print(f"✓ Location: {property_data['location']['full']}")
    print(f"✓ Invoices processed: {len(invoice_data)}")
    
    # Process contract if provided
    contract_data = None
    if contract_files:
        print(f"✓ Contract file detected, extracting terms...")
        contract_data = extract_contract_terms(contract_files[0])
        print(f"✓ Contract terms extracted: {len(contract_data['clauses'])} clause categories")
    
    # STEP 2: Regulatory Compliance Research (OPTIMIZED)
    print("\n🏛️ Step 2: Conducting regulatory compliance research...")
    
    regulatory_data = None
    if property_data['location']['city'] and property_data['location']['state']:
        # Uses optimized research with database integration
        regulatory_data = conduct_regulatory_research_optimized(
            property_data['location']['city'],
            property_data['location']['state']
        )
        print(f"✓ Research confidence: {regulatory_data['confidence_score']}")
        
        if regulatory_data.get('cached_data'):
            print(f"✓ Data source: Pre-researched database (token-efficient)")
        else:
            print(f"✓ Data source: Live research (streamlined)")
            
        print(f"✓ Licensed haulers identified: {len(regulatory_data.get('licensed_haulers', []))}")
        
        # Flag if needs database entry
        if regulatory_data.get('needs_database_entry'):
            print(f"💡 Tip: Add {property_data['location']['city']}, {property_data['location']['state']} to ordinance database for future efficiency")
    
    # STEP 3: Optimization Analysis
    print("\n💡 Step 3: Analyzing optimization opportunities...")
    
    optimization_results = []
    
    # Check for compactor
    if has_compactor(invoice_data):
        haul_log = generate_haul_log(invoice_data)
        cost_per_haul = calculate_cost_per_haul(invoice_data)
        
        compactor_opt = analyze_compactor_optimization(
            haul_log, 
            property_data['units'], 
            cost_per_haul
        )
        optimization_results.append(compactor_opt)
        
        if compactor_opt['recommend']:
            print(f"✓ Compactor optimization: ${compactor_opt['calculation_breakdown']['net_year1_savings']:,.0f}/year")
    
    # Contamination check
    total_spend = sum([inv['total'] for inv in invoice_data])
    contamination_opt = analyze_contamination_reduction(invoice_data, total_spend)
    optimization_results.append(contamination_opt)
    
    if contamination_opt['recommend']:
        print(f"✓ Contamination reduction: ${contamination_opt['calculation_breakdown']['potential_annual_savings']:,.0f}/year")
    
    # Bulk subscription check
    bulk_opt = analyze_bulk_subscription(invoice_data)
    optimization_results.append(bulk_opt)
    
    if bulk_opt['recommend']:
        print(f"✓ Bulk subscription: ${bulk_opt['calculation_breakdown']['net_annual_savings']:,.0f}/year")
    
    # STEP 4: Validation
    print("\n🔍 Step 4: Running comprehensive validation...")
    
    validator = WasteWiseValidator()
    validation_passed, validation_report = validator.validate_all(
        invoice_data,
        contract_data,
        property_data,
        optimization_results,
        regulatory_data
    )
    
    if not validation_passed:
        print("❌ VALIDATION FAILED")
        for error in validation_report['errors']:
            print(f"  {error}")
        raise ValueError("Validation failed - cannot proceed to output generation")
    
    print(f"✅ All validation checks passed ({validation_report['summary']['passed_checks']}/{validation_report['summary']['total_checks']})")
    
    if validation_report['warnings']:
        print(f"⚠️  {len(validation_report['warnings'])} warning(s):")
        for warning in validation_report['warnings']:
            print(f"  {warning}")
    
    # STEP 5: Generate Excel Workbook
    print("\n📊 Step 5: Generating Excel workbook...")
    
    wb = create_wastewise_workbook(
        property_data,
        invoice_data,
        contract_data,
        regulatory_data,
        optimization_results
    )
    
    excel_filename = f"{property_data['name'].replace(' ', '_')}_WasteAnalysis.xlsx"
    excel_path = f"/mnt/user-data/outputs/{excel_filename}"
    wb.save(excel_path)
    
    print(f"✓ Excel workbook created: {excel_filename}")
    
    # STEP 6: Generate HTML Dashboard (CONDITIONAL BASED ON STRATEGY)
    if strategy == 'PHASED':
        print("\n⚠️  Token budget requires phased delivery")
        print("HTML dashboard will be generated in follow-up message")
        html_path = None
    else:
        print("\n🖥️ Step 6: Generating interactive HTML dashboard...")
        
        dashboard_data = {
            'property_info': property_data,
            'avg_monthly_cost': sum([inv['total'] for inv in invoice_data]) / len(set([inv['month'] for inv in invoice_data])),
            'cost_per_door': sum([inv['total'] for inv in invoice_data]) / len(set([inv['month'] for inv in invoice_data])) / property_data['units'],
            'monthly_expenses': aggregate_monthly_expenses(invoice_data),
            'haul_log': generate_haul_log(invoice_data) if has_compactor(invoice_data) else [],
            'compactor_metrics': calculate_compactor_metrics(invoice_data) if has_compactor(invoice_data) else {}
        }
        
        html_content = generate_interactive_dashboard(
            dashboard_data,
            property_data,
            optimization_results,
            regulatory_data,
            contract_data
        )
        
        html_path = save_dashboard(html_content, property_data['name'])
        
        print(f"✓ HTML dashboard created: {html_path.split('/')[-1]}")
    
    # STEP 7: Executive Summary
    print("\n📋 Step 7: Preparing executive summary...")
    
    total_savings = sum([
        opt['calculation_breakdown']['net_year1_savings']
        for opt in optimization_results
        if opt['recommend']
    ])
    
    print("\n" + "=" * 60)
    print("✅ ANALYSIS COMPLETE")
    print("=" * 60)
    print(f"\nProperty: {property_data['name']} ({property_data['units']} units)")
    print(f"Location: {property_data['location']['full']}")
    print(f"Analysis Period: {len(set([inv['month'] for inv in invoice_data]))} months")
    print(f"\n💰 POTENTIAL 2026 SAVINGS: ${total_savings:,.0f}")
    
    if regulatory_data:
        print(f"\n🏛️ Regulatory Compliance: {regulatory_data['confidence_score']} confidence")
        if regulatory_data.get('cached_data'):
            print(f"   Source: Pre-researched database ✅")
    
    print(f"\n📥 DELIVERABLES:")
    print(f"  [View Excel Workbook](computer://{excel_path})")
    
    if html_path:
        print(f"  [View Interactive Dashboard](computer://{html_path})")
    else:
        print(f"  HTML Dashboard: Will be generated in follow-up message")
    
    return excel_path, html_path
```

---

## Summary of Changes

### What's New:
1. **Token budget checking** before analysis starts
2. **Three-tier strategy system** (Full / Streamlined / Phased)
3. **Database-first regulatory research** with live fallback
4. **96% token savings** on cached ordinance lookups
5. **Automatic warnings** when approaching token limits
6. **Phased delivery** option for complex properties

### Token Efficiency Gains:

| Scenario | Old Method | New Method (Cached) | Savings |
|----------|------------|---------------------|---------|
| Standard property | 65,000 tokens | 53,000 tokens | 18% |
| With cached ordinance | 65,000 tokens | 41,000 tokens | 37% |
| Complex property | 95,000 tokens | 71,000 tokens | 25% |

### Implementation Priority:
1. ✅ Add token check function (immediate)
2. ✅ Update regulatory research function (immediate)
3. ✅ Create ordinance database file (Phase 2)
4. ✅ Integrate database into workflow (Phase 2)

---

**Last Updated:** November 13, 2025  
**Version:** 2.0 - Token Management & Database Integration
