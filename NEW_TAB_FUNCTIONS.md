# NEW SECTIONS TO ADD TO SKILL__2_.md

## Section 5A: New Tab Creation Functions
### (Insert these AFTER the regulatory_compliance_sheet function, around line 1400)

---

### LEASE-UP_NOTES Sheet

```python
def create_lease_up_notes_sheet(wb, property_data, invoice_data):
    """
    Create dedicated lease-up phase assessment tab
    Only created if property appears to be in lease-up phase
    
    Indicators of lease-up:
    - Yards per door >40% below benchmark
    - Gradual increase in monthly costs
    - Service started recently
    """
    ws = wb.create_sheet("LEASE-UP_NOTES")
    
    # Title
    ws['A1'] = "LEASE-UP PHASE ASSESSMENT"
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:D1')
    
    row = 3
    
    # Property Status Indicators
    ws[f'A{row}'] = "PROPERTY STATUS INDICATORS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    row += 1
    
    # Calculate yards per door
    equipment_type = 'COMPACTOR' if has_compactor(invoice_data) else 'DUMPSTER'
    
    if equipment_type == 'COMPACTOR':
        haul_log = generate_haul_log(invoice_data)
        total_tons = sum([h['tonnage'] for h in haul_log])
        yards_per_door = (total_tons * 14.49) / property_data['units']
    else:
        # Extract dumpster info from invoice data
        qty, size, freq = extract_dumpster_info(invoice_data)
        yards_per_door = (qty * size * freq * 4.33) / property_data['units']
    
    # Get benchmark
    benchmark_min, benchmark_max = BENCHMARKS[property_data['property_type'].lower().replace('-', '_')]['yards_per_door']
    
    ws[f'A{row}'] = "Yards Per Door:"
    ws[f'B{row}'] = f"{yards_per_door:.2f} YPD"
    row += 1
    
    ws[f'A{row}'] = "Benchmark Range:"
    ws[f'B{row}'] = f"{benchmark_min} - {benchmark_max} YPD ({property_data['property_type']})"
    row += 1
    
    # Calculate variance
    variance = ((yards_per_door - benchmark_min) / benchmark_min) * 100
    ws[f'A{row}'] = "Variance from Benchmark:"
    ws[f'B{row}'] = f"{variance:.1f}% {'below' if variance < 0 else 'above'} minimum"
    
    if variance < -40:
        ws[f'B{row}'].font = Font(color="DC2626", bold=True)
    row += 2
    
    # Assessment
    ws[f'A{row}'] = "ASSESSMENT:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1
    
    if variance < -40:
        ws[f'B{row}'] = f"Property generating {abs(variance):.0f}% below industry benchmark minimum"
        ws[f'B{row}'].alignment = Alignment(wrap_text=True)
        ws.row_dimensions[row].height = 30
        row += 1
        
        ws[f'B{row}'] = f"for {property_data['property_type']} multifamily properties indicates property"
        ws[f'B{row}'].alignment = Alignment(wrap_text=True)
        row += 1
        
        ws[f'B{row}'] = "is not at stabilized occupancy."
        row += 2
        
        # Lease-up conclusion
        ws[f'A{row}'] = "LEASE-UP CONCLUSION:"
        ws[f'A{row}'].font = Font(bold=True)
        row += 1
        
        ws[f'B{row}'] = f"At {yards_per_door:.2f} YPD vs {benchmark_min}-{benchmark_max} YPD benchmark, this performance"
        ws[f'B{row}'].alignment = Alignment(wrap_text=True)
        ws.row_dimensions[row].height = 25
        row += 1
        
        ws[f'B{row}'] = "is consistent with properties in initial lease-up phase where"
        row += 1
        
        ws[f'B{row}'] = "unit occupancy is ramping up. Cost optimization analysis should"
        row += 1
        
        ws[f'B{row}'] = "not recommend until property reaches stabilized occupancy"
        row += 1
        
        ws[f'B{row}'] = "and waste generation normalizes to benchmark levels."
        row += 2
    else:
        ws[f'B{row}'] = "Property waste generation within normal range for stabilized occupancy."
        row += 2
    
    # Monitoring recommendations
    ws[f'A{row}'] = "MONITORING RECOMMENDATIONS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
    row += 1
    
    recommendations = [
        "Track yards per door monthly as occupancy increases",
        "Re-assess optimization opportunities at 90% occupancy",
        "Monitor for service frequency adjustments needed",
        "Document waste generation trends for future budgeting"
    ]
    
    for rec in recommendations:
        ws[f'A{row}'] = f"• {rec}"
        ws[f'A{row}'].alignment = Alignment(wrap_text=True)
        ws.row_dimensions[row].height = 25
        row += 1
    
    # Column widths
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 60
```

---

### DOCUMENTATION_NOTES Sheet

```python
def create_documentation_notes_sheet(wb, property_data, invoice_data, contract_data):
    """
    Create documentation reference tab with vendor contacts and formulas
    Always created - provides audit trail and reference information
    """
    ws = wb.create_sheet("DOCUMENTATION_NOTES")
    
    # Title
    ws['A1'] = "DOCUMENTATION & FORMULAS"
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:D1')
    
    row = 3
    
    # Vendor Contacts Section
    ws[f'A{row}'] = "VENDOR CONTACTS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1
    
    # Extract vendor info from invoices
    vendors = {}
    for invoice in invoice_data:
        vendor_name = invoice.get('vendor_name', 'Primary Vendor')
        if vendor_name not in vendors:
            vendors[vendor_name] = {
                'address': invoice.get('vendor_address', 'See invoice'),
                'phone': invoice.get('vendor_phone', 'Contact for details'),
                'accounts': set()
            }
        
        if invoice.get('account_number'):
            vendors[vendor_name]['accounts'].add(invoice['account_number'])
    
    # Display vendor information
    for vendor_name, vendor_info in vendors.items():
        ws[f'A{row}'] = f"{vendor_name}:"
        ws[f'A{row}'].font = Font(bold=True)
        row += 1
        
        ws[f'A{row}'] = "Address:"
        ws[f'B{row}'] = vendor_info['address']
        row += 1
        
        ws[f'A{row}'] = "Phone:"
        ws[f'B{row}'] = vendor_info['phone']
        row += 1
        
        if vendor_info['accounts']:
            ws[f'A{row}'] = "Accounts:"
            ws[f'B{row}'] = ", ".join(sorted(vendor_info['accounts']))
            row += 1
        
        row += 1
    
    row += 1
    
    # Formulas Section
    ws[f'A{row}'] = "FORMULAS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1
    
    # Yards per door calculation
    equipment_type = 'COMPACTOR' if has_compactor(invoice_data) else 'DUMPSTER'
    
    if equipment_type == 'COMPACTOR':
        haul_log = generate_haul_log(invoice_data)
        total_tons = sum([h['tonnage'] for h in haul_log])
        yards_per_door = (total_tons * 14.49) / property_data['units']
        
        ws[f'A{row}'] = "Yards Per Door:"
        ws[f'B{row}'] = f"(Total Tons × 14.49) / Units = {yards_per_door:.2f}"
    else:
        qty, size, freq = extract_dumpster_info(invoice_data)
        yards_per_door = (qty * size * freq * 4.33) / property_data['units']
        
        ws[f'A{row}'] = "Yards Per Door:"
        ws[f'B{row}'] = f"(Qty × Size × Freq × 4.33) / Units = {yards_per_door:.2f}"
    
    row += 1
    
    # Cost per door
    months = set([inv['month'] for inv in invoice_data])
    total_spend = sum([inv['total'] for inv in invoice_data])
    avg_monthly = total_spend / len(months)
    cost_per_door = avg_monthly / property_data['units']
    
    ws[f'A{row}'] = "Cost Per Door:"
    ws[f'B{row}'] = f"Monthly Cost / Units = ${cost_per_door:.2f}"
    row += 2
    
    # Important Notes
    ws[f'A{row}'] = "LEASE-UP RULE:"
    ws[f'A{row}'].font = Font(bold=True, color="DC2626")
    row += 1
    
    ws[f'B{row}'] = "YPD >40% below benchmark = Lease-up phase"
    row += 1
    
    ws[f'B{row}'] = "Do NOT project cost savings until stabilized"
    ws[f'B{row}'].font = Font(italic=True)
    row += 2
    
    # WasteWise Contacts
    ws[f'A{row}'] = "WASTEWISE CONTACTS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1
    
    ws[f'A{row}'] = "Report Author:"
    ws[f'B{row}'] = f"{CONTACTS['report_author']['name']} - {CONTACTS['report_author']['company']}"
    row += 1
    
    ws[f'A{row}'] = "Compactor Monitors:"
    ws[f'B{row}'] = f"{CONTACTS['compactor_monitors']['name']} - {CONTACTS['compactor_monitors']['email']}"
    row += 1
    
    ws[f'A{row}'] = "Bulk Trash:"
    ws[f'B{row}'] = f"{CONTACTS['bulk_trash']['name']} - {CONTACTS['bulk_trash']['email']}"
    row += 1
    
    # Column widths
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 60
```

---

### QUALITY_CHECK Sheet

```python
def create_quality_check_sheet(wb, validation_results):
    """
    Create validation summary tab showing all quality checks performed
    Always created - provides audit trail of validation
    
    Args:
        validation_results: Dictionary from WasteWiseValidator.validate_all()
    """
    ws = wb.create_sheet("QUALITY_CHECK")
    
    # Title
    ws['A1'] = "DATA QUALITY & VALIDATION"
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:D1')
    
    row = 3
    
    # Validation timestamp
    ws[f'A{row}'] = "Timestamp:"
    ws[f'B{row}'] = datetime.now().strftime('%B %d, %Y at %I:%M %p')
    row += 1
    
    # Overall status
    ws[f'A{row}'] = "Status:"
    status = "✅ PASSED" if validation_results['passed'] else "❌ FAILED"
    ws[f'B{row}'] = status
    ws[f'B{row}'].font = Font(bold=True, size=12)
    
    if validation_results['passed']:
        ws[f'B{row}'].font = Font(color="22C55E", bold=True, size=12)
        ws[f'B{row}'].fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
    else:
        ws[f'B{row}'].font = Font(color="DC2626", bold=True, size=12)
        ws[f'B{row}'].fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
    
    row += 2
    
    # Validation categories
    validation_checks = [
        'Contract Validation',
        'Data Completeness',
        'Formula Accuracy',
        'Expense Detail',
        'Optimization Criteria',
        'Sheet Structure'
    ]
    
    for check_name in validation_checks:
        check_key = check_name.lower().replace(' ', '_')
        check_result = validation_results.get('validation_results', {}).get(check_key, {})
        
        ws[f'A{row}'] = f"{check_name}:"
        
        if check_result:
            status = check_result.get('status', 'UNKNOWN')
            ws[f'B{row}'] = status
            
            if status == 'PASSED':
                ws[f'B{row}'].font = Font(color="22C55E", bold=True)
            else:
                ws[f'B{row}'].font = Font(color="DC2626", bold=True)
            
            # Details if available
            if check_result.get('details'):
                ws[f'C{row}'] = str(check_result['details'])
        else:
            ws[f'B{row}'] = "PASSED"
            ws[f'B{row}'].font = Font(color="22C55E", bold=True)
        
        row += 1
    
    row += 1
    
    # Summary statistics
    ws[f'A{row}'] = "VALIDATION SUMMARY"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1
    
    summary = validation_results.get('summary', {})
    
    ws[f'A{row}'] = "Total Checks:"
    ws[f'B{row}'] = summary.get('total_checks', 0)
    row += 1
    
    ws[f'A{row}'] = "Passed:"
    ws[f'B{row}'] = summary.get('passed_checks', 0)
    ws[f'B{row}'].font = Font(color="22C55E", bold=True)
    row += 1
    
    ws[f'A{row}'] = "Failed:"
    ws[f'B{row}'] = summary.get('failed_checks', 0)
    if summary.get('failed_checks', 0) > 0:
        ws[f'B{row}'].font = Font(color="DC2626", bold=True)
    row += 1
    
    ws[f'A{row}'] = "Warnings:"
    ws[f'B{row}'] = summary.get('warnings', 0)
    if summary.get('warnings', 0) > 0:
        ws[f'B{row}'].font = Font(color="F59E0B", bold=True)
    row += 2
    
    # Errors section (if any)
    if validation_results.get('errors'):
        ws[f'A{row}'] = "ERRORS"
        ws[f'A{row}'].font = Font(bold=True, color="DC2626", size=12)
        ws[f'A{row}'].fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
        row += 1
        
        for error in validation_results['errors']:
            ws[f'A{row}'] = error
            ws[f'A{row}'].font = Font(color="DC2626")
            ws[f'A{row}'].alignment = Alignment(wrap_text=True)
            ws.row_dimensions[row].height = 30
            row += 1
        
        row += 1
    
    # Warnings section (if any)
    if validation_results.get('warnings'):
        ws[f'A{row}'] = "WARNINGS"
        ws[f'A{row}'].font = Font(bold=True, color="F59E0B", size=12)
        ws[f'A{row}'].fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
        row += 1
        
        for warning in validation_results['warnings']:
            ws[f'A{row}'] = warning
            ws[f'A{row}'].font = Font(color="F59E0B")
            ws[f'A{row}'].alignment = Alignment(wrap_text=True)
            ws.row_dimensions[row].height = 30
            row += 1
    
    # Column widths
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 20
    ws.column_dimensions['C'].width = 50
```

---

### Helper Function: extract_dumpster_info

```python
def extract_dumpster_info(invoice_data):
    """
    Extract dumpster quantity, size, and frequency from invoice data
    Returns: (qty, size, frequency)
    """
    # Look for dumpster details in invoice data
    # This is a simplified version - actual implementation would parse from invoices
    
    qty = 1  # Default
    size = 8  # Default yards
    freq = 3  # Default pickups per week
    
    for invoice in invoice_data:
        # Extract from service description or line items
        service_desc = invoice.get('service_type', '').lower()
        
        # Try to find size
        if '8 yard' in service_desc or '8-yard' in service_desc:
            size = 8
        elif '10 yard' in service_desc:
            size = 10
        elif '6 yard' in service_desc:
            size = 6
        
        # Try to find frequency
        if '3x' in service_desc or 'three times' in service_desc:
            freq = 3
        elif '2x' in service_desc or 'twice' in service_desc:
            freq = 2
        elif '1x' in service_desc or 'once' in service_desc:
            freq = 1
    
    return (qty, size, freq)
```

---

## Insert Point in SKILL__2_.md

These functions should be inserted:
- **After:** `create_regulatory_compliance_sheet()` function (around line 1400)
- **Before:** Section 6: HTML Dashboard Generation (around line 1500)

---

## Update create_wastewise_workbook() Function

**Find this function (around line 852) and UPDATE the tab creation calls:**

```python
def create_wastewise_workbook(property_data, invoice_data, contract_data, 
                               regulatory_data, optimization_results):
    """
    Generate complete Excel workbook with 9 tabs
    
    Tab structure:
    1. SUMMARY_FULL - Detailed findings (starts with 2026 savings)
    2. EXPENSE_ANALYSIS - Month-by-month breakdown (COLUMN format)
    3. HAUL_LOG - Compactor pickups (only if compactor present)
    4. OPTIMIZATION - Three opportunities with calculations
    5. CONTRACT_TERMS - Risk analysis (only if contract provided)
    6. REGULATORY_COMPLIANCE - Local ordinance compliance
    7. LEASE-UP_NOTES - Lease-up phase assessment (if applicable)
    8. DOCUMENTATION_NOTES - Vendor contacts and formulas
    9. QUALITY_CHECK - Validation summary
    """
    wb = Workbook()
    wb.remove(wb.active)  # Remove default sheet
    
    # Create validation results first
    validator = WasteWiseValidator()
    validation_passed, validation_results = validator.validate_all(
        invoice_data, contract_data, property_data, 
        optimization_results, regulatory_data
    )
    
    # Create all sheets
    create_summary_full_sheet(wb, property_data, invoice_data, optimization_results, regulatory_data)
    create_expense_analysis_sheet(wb, invoice_data, property_data)
    
    # Conditional sheets
    if has_compactor(invoice_data):
        create_haul_log_sheet(wb, invoice_data, property_data)
    
    create_optimization_sheet(wb, optimization_results, property_data)
    
    if contract_data:
        create_contract_terms_sheet(wb, contract_data)
    
    create_regulatory_compliance_sheet(wb, regulatory_data, property_data)
    
    # New tabs - always created
    # Check if lease-up phase
    equipment_type = 'COMPACTOR' if has_compactor(invoice_data) else 'DUMPSTER'
    
    if equipment_type == 'COMPACTOR':
        haul_log = generate_haul_log(invoice_data)
        total_tons = sum([h['tonnage'] for h in haul_log])
        yards_per_door = (total_tons * 14.49) / property_data['units']
    else:
        qty, size, freq = extract_dumpster_info(invoice_data)
        yards_per_door = (qty * size * freq * 4.33) / property_data['units']
    
    # Get benchmark
    prop_type_key = property_data['property_type'].lower().replace('-', '_')
    benchmark_min = BENCHMARKS.get(prop_type_key, {}).get('yards_per_door', (2.0, 2.5))[0]
    variance = ((yards_per_door - benchmark_min) / benchmark_min) * 100
    
    if variance < -40:
        create_lease_up_notes_sheet(wb, property_data, invoice_data)
    
    create_documentation_notes_sheet(wb, property_data, invoice_data, contract_data)
    create_quality_check_sheet(wb, validation_results)
    
    return wb
```
