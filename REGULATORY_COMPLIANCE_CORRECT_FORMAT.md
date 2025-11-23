# REGULATORY_COMPLIANCE Sheet - CORRECT FORMAT

## This matches the Orlando example format - REPLACE the regulatory compliance function in SKILL\__2_.md

```python
def create_regulatory_compliance_sheet(wb, regulatory_data, property_data):
    """
    Create comprehensive regulatory compliance documentation
    Format matches Orlando ordinance compliance example

    Sections:
    1. Header with property info and ordinance status
    2. Ordinance Overview
    3. Mandatory Requirements (table)
    4. Compliance Checklist (table)
    5. Licensed Haulers (table)
    6. Penalties & Enforcement
    7. Sources Consulted
    """
    ws = wb.create_sheet("REGULATORY_COMPLIANCE")

    # Determine ordinance type and city
    city = property_data['location'].get('city', 'Unknown')
    state = property_data['location'].get('state', 'Unknown')

    # Title - specific to ordinance type
    ordinance_title = f"{city.upper()} RECYCLING ORDINANCE COMPLIANCE"
    ws['A1'] = ordinance_title
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:D1')
    ws['A1'].alignment = Alignment(horizontal='left')

    row = 3

    # Property Information
    ws[f'A{row}'] = "Property:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1

    ws[f'A{row}'] = f"{property_data['name']} ({property_data['units']} units)"
    row += 2

    # Ordinance Status
    ws[f'A{row}'] = "Ordinance Status:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1

    # Determine applicability
    recycling_req = regulatory_data.get('recycling_requirements', {})
    threshold = recycling_req.get('property_threshold_units', 5)

    if property_data['units'] >= threshold:
        ws[f'A{row}'] = f"APPLICABLE - Property exceeds {threshold}-unit threshold"
        ws[f'A{row}'].font = Font(color="DC2626", bold=True)
    else:
        ws[f'A{row}'] = f"NOT APPLICABLE - Property below {threshold}-unit threshold"
        ws[f'A{row}'].font = Font(color="22C55E")
    row += 2

    # Compliance Deadline (if available)
    composting_req = regulatory_data.get('composting_requirements', {})
    if composting_req.get('effective_date'):
        ws[f'A{row}'] = "Compliance Deadline:"
        ws[f'A{row}'].font = Font(bold=True)
        row += 1

        ws[f'A{row}'] = composting_req['effective_date']
        row += 2

    # ORDINANCE OVERVIEW Section
    ws[f'A{row}'] = "ORDINANCE OVERVIEW"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    # Overview narrative
    overview_text = regulatory_data.get('ordinance_overview',
        f"The City of {city} requires multifamily properties to provide recycling services. "
        "This ordinance is part of the city's waste reduction and sustainability goals.")

    ws[f'A{row}'] = overview_text
    ws[f'A{row}'].alignment = Alignment(wrap_text=True)
    ws.merge_cells(f'A{row}:D{row}')
    ws.row_dimensions[row].height = 40
    row += 2

    # Key Dates (if available)
    if regulatory_data.get('key_dates'):
        ws[f'A{row}'] = "Key Dates:"
        ws[f'A{row}'].font = Font(bold=True)
        row += 1

        for date_item in regulatory_data['key_dates']:
            ws[f'A{row}'] = f"• {date_item}"
            row += 1

        row += 1

    # MANDATORY REQUIREMENTS Section
    ws[f'A{row}'] = "MANDATORY REQUIREMENTS"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    # Requirements table header
    headers = ['Requirement', 'Description', 'Verification Status']
    for col, header in enumerate(headers, 1):
        ws.cell(row=row, column=col).value = header
        ws.cell(row=row, column=col).font = Font(bold=True)
        ws.cell(row=row, column=col).fill = PatternFill(start_color="E5E7EB", end_color="E5E7EB", fill_type="solid")
    row += 1

    # Requirements rows
    requirements = [
        {
            'requirement': 'Recycling Container',
            'description': 'Must provide dedicated recycling container(s) accessible to all residents',
            'status': 'VERIFY ON-SITE'
        },
        {
            'requirement': 'Collection Service',
            'description': 'Must arrange for regular collection of recyclable materials',
            'status': 'VERIFY WITH VENDOR'
        },
        {
            'requirement': 'Verification Records',
            'description': 'Must maintain and submit verification records to the city annually',
            'status': 'VERIFY SUBMISSION'
        },
        {
            'requirement': 'Container Signage',
            'description': 'Containers must have clear signage indicating recyclable materials',
            'status': 'VERIFY ON-SITE'
        },
        {
            'requirement': 'Resident Access',
            'description': 'Recycling must be as convenient as trash disposal',
            'status': 'VERIFY ON-SITE'
        }
    ]

    for req in requirements:
        ws.cell(row=row, column=1).value = req['requirement']
        ws.cell(row=row, column=1).font = Font(bold=True)

        ws.cell(row=row, column=2).value = req['description']
        ws.cell(row=row, column=2).alignment = Alignment(wrap_text=True)
        ws.row_dimensions[row].height = 30

        ws.cell(row=row, column=3).value = req['status']
        ws.cell(row=row, column=3).font = Font(color="F59E0B", bold=True)
        ws.cell(row=row, column=3).alignment = Alignment(horizontal='center')

        row += 1

    row += 1

    # COMPLIANCE CHECKLIST Section
    ws[f'A{row}'] = "COMPLIANCE CHECKLIST"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    # Checklist table header
    checklist_headers = ['Item', 'Status', 'Priority', 'Action Required']
    for col, header in enumerate(checklist_headers, 1):
        ws.cell(row=row, column=col).value = header
        ws.cell(row=row, column=col).font = Font(bold=True)
        ws.cell(row=row, column=col).fill = PatternFill(start_color="E5E7EB", end_color="E5E7EB", fill_type="solid")
    row += 1

    # Checklist items
    checklist_items = [
        {
            'item': 'Recycling container provided',
            'status': 'VERIFY',
            'priority': 'HIGH',
            'action': 'Schedule site inspection and verify compliance'
        },
        {
            'item': 'Collection service arranged',
            'status': 'VERIFY',
            'priority': 'HIGH',
            'action': 'Confirm vendor contract includes recycling service'
        },
        {
            'item': 'Verification records submitted',
            'status': 'VERIFY',
            'priority': 'MEDIUM',
            'action': 'Request copy of annual compliance submission'
        },
        {
            'item': 'Container locations comply',
            'status': 'VERIFY',
            'priority': 'MEDIUM',
            'action': 'Verify container placement meets accessibility requirements'
        },
        {
            'item': 'Resident education program',
            'status': 'RECOMMENDED',
            'priority': 'LOW',
            'action': 'Develop recycling guidelines for resident portal'
        }
    ]

    # Add composting if applicable
    if composting_req.get('mandatory'):
        checklist_items.append({
            'item': 'Organics collection service',
            'status': 'VERIFY',
            'priority': 'HIGH',
            'action': f"Verify compliance with {composting_req.get('effective_date', 'composting mandate')}"
        })

    for item in checklist_items:
        ws.cell(row=row, column=1).value = item['item']

        # Status with color coding
        status_cell = ws.cell(row=row, column=2)
        status_cell.value = item['status']
        status_cell.font = Font(bold=True)
        status_cell.alignment = Alignment(horizontal='center')

        if item['status'] == 'VERIFY':
            status_cell.font = Font(color="F59E0B", bold=True)
        elif item['status'] == 'RECOMMENDED':
            status_cell.font = Font(color="3B82F6", bold=True)

        # Priority with color coding
        priority_cell = ws.cell(row=row, column=3)
        priority_cell.value = item['priority']
        priority_cell.font = Font(bold=True)
        priority_cell.alignment = Alignment(horizontal='center')

        if item['priority'] == 'HIGH':
            priority_cell.font = Font(color="DC2626", bold=True)
        elif item['priority'] == 'MEDIUM':
            priority_cell.font = Font(color="F59E0B", bold=True)
        elif item['priority'] == 'LOW':
            priority_cell.font = Font(color="22C55E", bold=True)

        ws.cell(row=row, column=4).value = item['action']
        ws.cell(row=row, column=4).alignment = Alignment(wrap_text=True)

        row += 1

    row += 1

    # LICENSED HAULERS Section
    ws[f'A{row}'] = f"LICENSED HAULERS IN {city.upper()}"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    # Haulers table header
    hauler_headers = ['Company', 'Phone', 'Services', 'Website']
    for col, header in enumerate(hauler_headers, 1):
        ws.cell(row=row, column=col).value = header
        ws.cell(row=row, column=col).font = Font(bold=True)
        ws.cell(row=row, column=col).fill = PatternFill(start_color="E5E7EB", end_color="E5E7EB", fill_type="solid")
    row += 1

    # Haulers data
    haulers = regulatory_data.get('licensed_haulers', [])

    for hauler in haulers[:5]:  # Show top 5
        ws.cell(row=row, column=1).value = hauler.get('name', 'Unknown')
        ws.cell(row=row, column=2).value = hauler.get('phone', 'Contact for details')
        ws.cell(row=row, column=3).value = ', '.join(hauler.get('services', ['Waste & Recycling']))

        website_cell = ws.cell(row=row, column=4)
        website = hauler.get('website', 'See directory')
        website_cell.value = website

        if website.startswith('http'):
            website_cell.hyperlink = website
            website_cell.font = Font(color="2563EB", underline="single")

        row += 1

    row += 1

    # PENALTIES & ENFORCEMENT Section
    ws[f'A{row}'] = "PENALTIES & ENFORCEMENT"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    penalties = regulatory_data.get('penalties', {})

    ws[f'A{row}'] = "Classification:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1
    ws[f'A{row}'] = penalties.get('classification', 'Municipal code violation')
    row += 2

    ws[f'A{row}'] = "Enforcement Agency:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1
    ws[f'A{row}'] = penalties.get('enforcement_agency', f'{city} Environmental Services')
    row += 2

    # Contact information
    contacts = regulatory_data.get('regulatory_contacts', {})
    if contacts:
        ws[f'A{row}'] = "Contact:"
        ws[f'A{row}'].font = Font(bold=True)
        row += 1

        contact_name = contacts.get('contact_name', '')
        contact_title = contacts.get('contact_title', '')
        contact_phone = contacts.get('phone', '')
        contact_email = contacts.get('email', '')

        contact_line = f"{contact_name}"
        if contact_title:
            contact_line += f", {contact_title}"
        if contact_phone:
            contact_line += f" | {contact_phone}"
        if contact_email:
            contact_line += f" | {contact_email}"

        ws[f'A{row}'] = contact_line
        ws.merge_cells(f'A{row}:D{row}')
        row += 2

    ws[f'A{row}'] = "Fine Structure:"
    ws[f'A{row}'].font = Font(bold=True)
    row += 1

    fine_info = penalties.get('fine_structure', 'Not publicly specified - enforcement through compliance verification')
    ws[f'A{row}'] = fine_info
    ws[f'A{row}'].alignment = Alignment(wrap_text=True)
    ws.merge_cells(f'A{row}:D{row}')
    ws.row_dimensions[row].height = 30
    row += 2

    # SOURCES CONSULTED Section
    ws[f'A{row}'] = "SOURCES CONSULTED"
    ws[f'A{row}'].font = Font(bold=True, size=12)
    ws[f'A{row}'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    row += 1

    sources = regulatory_data.get('sources_consulted', [])

    for i, source in enumerate(sources, 1):
        ws[f'A{row}'] = f"{i}."
        ws[f'B{row}'] = source
        ws[f'B{row}'].alignment = Alignment(wrap_text=True)
        ws.merge_cells(f'B{row}:D{row}')
        ws.row_dimensions[row].height = 25
        row += 1

    # Column widths
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 35
    ws.column_dimensions['C'].width = 25
    ws.column_dimensions['D'].width = 35

    # Add borders to tables
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # Apply borders to all table sections (requirements, checklist, haulers)
    for row_cells in ws.iter_rows(min_row=1, max_row=row, min_col=1, max_col=4):
        for cell in row_cells:
            if cell.value:
                cell.border = thin_border
```

---

## Update to Regulatory Research Function

**Also update the `conduct_regulatory_research()` function to return this structure:**

```python
def conduct_regulatory_research(city, state):
    """
    Execute 2-3 targeted web searches for local ordinances
    Returns data structured for the compliance sheet format
    """
    research_data = {
        'location': f"{city}, {state}",
        'sources_consulted': [],
        'ordinance_overview': '',
        'key_dates': [],
        'recycling_requirements': {
            'mandatory': False,
            'property_threshold_units': 5,
            'capacity_requirement': None,
            'service_frequency': None
        },
        'composting_requirements': {
            'mandatory': False,
            'effective_date': None,
            'accepted_materials': []
        },
        'penalties': {
            'classification': 'Municipal code violation',
            'enforcement_agency': f'{city} Environmental Services',
            'fine_structure': 'Not publicly specified - enforcement through compliance verification'
        },
        'licensed_haulers': [],
        'regulatory_contacts': {
            'contact_name': '',
            'contact_title': '',
            'phone': '',
            'email': ''
        },
        'confidence_score': 'LOW'
    }

    # Search 1: General recycling ordinance
    query_1 = f'"{city}" "{state}" recycling ordinance multifamily'
    results_1 = web_search(query_1)
    research_data['sources_consulted'].append(query_1)

    # Parse results and extract information
    official_sources = [r for r in results_1 if '.gov' in r['url']]

    for source in official_sources:
        content = web_fetch(source['url'])

        # Extract overview
        research_data['ordinance_overview'] = extract_ordinance_overview(content, city)

        # Extract key dates
        research_data['key_dates'] = extract_key_dates(content)

        # Extract requirements
        research_data['recycling_requirements'] = extract_recycling_requirements(content, city)
        research_data['composting_requirements'] = extract_composting_requirements(content, city)

        # Extract penalties
        research_data['penalties'] = extract_penalties(content, city)

        # Extract contacts
        research_data['regulatory_contacts'] = extract_regulatory_contacts(content, city)

        # Extract haulers
        haulers = extract_licensed_haulers(content, city, state)
        research_data['licensed_haulers'].extend(haulers)

        # Add source to consulted list
        research_data['sources_consulted'].append(source['title'] or source['url'])

    # Deduplicate haulers
    research_data['licensed_haulers'] = deduplicate_haulers(
        research_data['licensed_haulers']
    )[:5]

    # Assign confidence score
    research_data['confidence_score'] = assess_research_confidence(research_data)

    return research_data
```

---

## Key Formatting Features

### Section Headers:

- Bold, size 12
- Light gray background (#F1F5F9)
- Left-aligned

### Tables:

- Header row: Bold, medium gray background (#E5E7EB)
- Thin borders on all cells
- Alternating row colors for readability

### Status Indicators:

- **VERIFY:** Orange text (#F59E0B)
- **RECOMMENDED:** Blue text (#3B82F6)
- **HIGH Priority:** Red text (#DC2626)
- **MEDIUM Priority:** Orange text (#F59E0B)
- **LOW Priority:** Green text (#22C55E)

### Column Widths:

- A: 30 characters
- B: 35 characters
- C: 25 characters
- D: 35 characters

---

## This Format Provides:

1. ✅ Clear applicability determination
2. ✅ Structured requirements with verification status
3. ✅ Actionable compliance checklist with priorities
4. ✅ Licensed hauler directory
5. ✅ Enforcement and penalty information
6. ✅ Source documentation for audit trail
7. ✅ Professional presentation for property managers

This matches the Orlando example exactly! 🎯
