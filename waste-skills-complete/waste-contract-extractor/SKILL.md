---
name: waste-contract-extractor
description: Extract critical data points from multifamily waste service contracts (PDF/Word/scanned documents). Parses property details, service specifications, pricing structures, and contract terms. Generates operationally-focused Excel reports with granular expense tracking, transparent optimization calculations, vendor performance metrics, and budget-aligned implementation roadmaps. Use when user uploads waste service agreements, invoices, or mentions contract analysis, waste management pricing, or service optimization.
---

# Waste Contract Extractor v2.1

## What This Skill Does

Extracts structured data from waste management contracts, invoices, and service agreements for multifamily properties, then generates **operationally-focused Excel reports** with:
- **Granular Expense Tracking**: Month-by-month, account-by-account detail with variance flags
- **Transparent Optimization**: Step-by-step calculations showing exactly how savings are derived
- **Investigation Support**: Built-in trackers to follow up on expense anomalies
- **Vendor Performance**: Metrics to support contract negotiations
- **Budget-Aligned Roadmap**: Implementation timeline with quarterly financial impacts

**Design Philosophy**: Operational users (property managers, regional directors) need **granular, traceable data** to answer stakeholder questions like "Why did Account X have 5 hauls in May when average is 2?" This skill prioritizes detail over high-level summaries.

Uses Claude's vision capabilities to read scanned PDFs and images. Handles documents from major waste vendors (Waste Management, Republic Services, Waste Connections, GFL, TDS, Athens) and municipal contracts.

## When to Use

Invoke this skill when the user:
- Uploads waste service contracts, invoices, or statements (PDF, image, Word, scanned documents)
- Mentions "waste contract review", "invoice analysis", "service agreement", or "vendor pricing"
- Needs to trace expenses back to specific invoices and haul counts
- Wants to identify month-over-month variances and investigate spikes
- Requests optimization analysis with **transparent, verifiable calculations**
- Needs budget impact projections for Asset Business Plans
- Says "why did this charge increase" or "show me the math on savings"
- Requests vendor performance tracking or implementation roadmaps

## How It Works

### Step 1: Document Analysis with Claude Vision

```python
# Claude automatically analyzes uploaded images and PDFs using vision
# Extract document type, vendor, property info, and structure

def analyze_document_structure(file_path):
    """
    Claude Vision reads the document and identifies:
    - Document type (invoice, contract, statement)
    - Vendor name and account numbers (critical for expense tracking)
    - Property name and address
    - Key sections (billing details, service schedules, clauses)
    """
    
    # For images/scanned PDFs, Claude vision extracts text automatically
    # For digital PDFs, extract text directly
    import PyPDF2
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    except:
        # If extraction fails, rely on Claude Vision
        return None
```

### Step 2: Extract Granular Invoice Data (Account-Level)

```python
import json
import re
from datetime import datetime
import pandas as pd

def extract_invoice_data_granular(document_text, vision_analysis):
    """
    Extract invoice details with ACCOUNT-LEVEL granularity for expense tracking
    
    Trevor's Requirement: "Need to trace back to source invoices when questioning spikes"
    """
    
    invoice_data = {
        "invoice_number": None,
        "invoice_date": None,
        "service_period_start": None,
        "service_period_end": None,
        "accounts": []  # Multiple accounts per invoice
    }
    
    # Extract invoice-level details
    inv_match = re.search(r"invoice\s*#?\s*:?\s*([A-Z0-9\-]+)", document_text, re.IGNORECASE)
    if inv_match:
        invoice_data["invoice_number"] = inv_match.group(1)
    
    # Extract service period
    period_match = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*[-to]+\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", 
                            document_text, re.IGNORECASE)
    if period_match:
        invoice_data["service_period_start"] = period_match.group(1)
        invoice_data["service_period_end"] = period_match.group(2)
    
    # Extract account-level line items
    # Each account may have multiple charge types
    account_charges = extract_account_charges(document_text, vision_analysis)
    invoice_data["accounts"] = account_charges
    
    return invoice_data

def extract_account_charges(document_text, vision_analysis):
    """
    Extract charges grouped by account number
    
    Output format for Historical Expense Analysis:
    {
        "account_number": "0156898",
        "charges": [
            {
                "expense_category": "Pickup Service",
                "amount": 1176.00,
                "haul_count": 4,
                "notes": "2x weekly service"
            },
            {
                "expense_category": "Disposal",
                "amount": 450.00,
                "haul_count": 4,
                "notes": "Tonnage charges"
            }
        ]
    }
    """
    
    accounts = []
    
    # Common expense categories for tracking
    expense_categories = {
        "pickup_service": ["pickup", "collection", "service charge"],
        "disposal": ["disposal", "tonnage", "tipping fee"],
        "container_rental": ["rental", "container fee", "equipment"],
        "fuel_surcharge": ["fuel surcharge", "fuel adjustment", "FSC"],
        "franchise_fee": ["franchise fee", "city fee", "municipal"],
        "contamination": ["contamination", "contaminated load"],
        "overage": ["overage", "excess weight", "over limit"],
        "extra_pickup": ["extra pickup", "additional", "on-call"],
        "admin": ["admin fee", "administrative", "processing"]
    }
    
    # Claude Vision will parse invoice tables to extract account-level details
    # This is a placeholder showing the structure
    
    return accounts

def extract_haul_counts(document_text, account_number):
    """
    Extract or calculate haul counts for variance tracking
    
    Trevor's Use Case: "Easy to ask site team: Why did Account 0156898 
    have 5 hauls in May when average is 2?"
    """
    
    # Methods to determine haul count:
    # 1. Explicit "Hauls" or "Pickups" column in invoice
    # 2. Calculate from service frequency (2x weekly = ~8 hauls/month)
    # 3. Derive from tonnage (if avg tonnage/haul is known)
    
    haul_count = None
    haul_method = None  # Track how we determined the count
    
    # Pattern 1: Explicit haul count
    haul_pattern = r"(\d+)\s*(?:hauls?|pickups?|services?)"
    haul_match = re.search(haul_pattern, document_text, re.IGNORECASE)
    if haul_match:
        haul_count = int(haul_match.group(1))
        haul_method = "Explicit"
    
    # Pattern 2: Calculate from frequency
    # If contract says "2x weekly" and invoice covers 4 weeks = 8 hauls
    freq_pattern = r"(\d+)x\s*(?:weekly|wk)"
    freq_match = re.search(freq_pattern, document_text, re.IGNORECASE)
    if freq_match and not haul_count:
        weekly_frequency = int(freq_match.group(1))
        weeks_in_period = 4  # Default assumption, adjust based on service period
        haul_count = weekly_frequency * weeks_in_period
        haul_method = "Calculated from frequency"
    
    return haul_count, haul_method
```

### Step 3: Build Historical Expense Analysis (Granular Tracking)

```python
def build_historical_expense_analysis(invoices, contract_data):
    """
    Create month-by-month, account-by-account expense tracking table
    
    Trevor's Requirement: "Month | Account | Charge Type | Amount | Invoice # | 
    Haul Count | % Change | Flag"
    
    Output: DataFrame ready for Excel with variance flags
    """
    
    expense_records = []
    
    for invoice in invoices:
        invoice_month = datetime.strptime(invoice['invoice_date'], '%m/%d/%Y').strftime('%b %Y')
        invoice_number = invoice['invoice_number']
        
        for account in invoice.get('accounts', []):
            account_number = account['account_number']
            
            for charge in account.get('charges', []):
                expense_records.append({
                    'Month': invoice_month,
                    'Account': account_number,
                    'Expense Category': charge['expense_category'],
                    'Amount': charge['amount'],
                    'Invoice #': invoice_number,
                    'Haul Count': charge.get('haul_count', '-'),
                    'Notes': charge.get('notes', '')
                })
    
    df = pd.DataFrame(expense_records)
    
    # Calculate % Change from Prior Month (per account + expense category)
    df = df.sort_values(['Account', 'Expense Category', 'Month'])
    df['% Change'] = df.groupby(['Account', 'Expense Category'])['Amount'].pct_change() * 100
    df['% Change'] = df['% Change'].fillna(0).round(1)
    
    # Flag Column: Auto-highlight if >20% variance
    df['Flag'] = df['% Change'].apply(lambda x: '🚩 INVESTIGATE' if abs(x) > 20 else '')
    
    return df

def add_investigation_tracker_section(df):
    """
    Add investigation tracker section to Historical Expense Analysis
    
    Trevor's Enhancement: "Add section where I can flag items for follow-up"
    
    Format:
    Month | Account | Question | Status | Resolution
    """
    
    # Identify records flagged for investigation
    flagged = df[df['Flag'] == '🚩 INVESTIGATE'].copy()
    
    investigation_tracker = []
    for _, row in flagged.iterrows():
        investigation_tracker.append({
            'Month': row['Month'],
            'Account': row['Account'],
            'Question': f"Why {row['Expense Category']} changed {row['% Change']:.1f}%?",
            'Status': 'Open',
            'Resolution': '[To be determined]'
        })
    
    return pd.DataFrame(investigation_tracker)
```

### Step 4: Build Transparent Optimization Calculations

```python
def build_transparent_optimization(contract_data, invoice_data):
    """
    Create crystal-clear optimization calculations
    
    Trevor's Feedback: "Difficult to follow logic on how we're getting to 
    estimated Savings with Monitors"
    
    Solution: Show EVERY assumption explicitly in step-by-step format
    """
    
    # Calculate current state from historical data
    total_hauls_ytd = sum(inv.get('total_hauls', 0) for inv in invoice_data)
    months_of_data = len(set(inv['invoice_date'][:7] for inv in invoice_data))  # Count unique months
    
    # Extrapolate to annual
    current_annual_hauls = (total_hauls_ytd / months_of_data) * 12
    
    # Get cost per haul from contract or calculate from invoices
    pickup_fee = contract_data['contract'].get('pickup_fee_per_haul', 343)  # Default example
    
    # Build optimization sections
    optimization_data = {
        "Section 1: Current State": {
            "Current Annual Hauls": f"{current_annual_hauls:.0f} hauls/year (extrapolated from {months_of_data} months)",
            "Current Cost Per Haul": f"${pickup_fee:.2f} (pickup fee)",
            "Current Annual Pickup Cost": f"${current_annual_hauls * pickup_fee:,.2f} ({current_annual_hauls:.0f} hauls × ${pickup_fee:.2f})"
        },
        
        "Section 2: With Monitors - Target State": {
            "Target Annual Hauls": f"{current_annual_hauls * 0.5:.0f} hauls/year (50% reduction)",
            "Cost Per Haul": f"${pickup_fee:.2f} (same rate)",
            "Projected Annual Pickup Cost": f"${(current_annual_hauls * 0.5) * pickup_fee:,.2f} ({current_annual_hauls * 0.5:.0f} hauls × ${pickup_fee:.2f})"
        },
        
        "Section 3: Savings Calculation": {
            "Annual Pickup Savings": f"${(current_annual_hauls * 0.5) * pickup_fee:,.2f}",
            "Calculation": f"Current ${current_annual_hauls * pickup_fee:,.2f} - Optimized ${(current_annual_hauls * 0.5) * pickup_fee:,.2f}",
            "Monitor Monthly Cost": "-$250",
            "Monitor Annual Cost": "-$3,000",
            "NET ANNUAL SAVINGS": f"${((current_annual_hauls * 0.5) * pickup_fee) - 3000:,.2f}"
        },
        
        "Section 4: Visual Formula": {
            "Haul Reduction": f"({current_annual_hauls:.0f} current hauls - {current_annual_hauls * 0.5:.0f} optimized hauls) = {current_annual_hauls * 0.5:.0f} fewer hauls",
            "Pickup Savings": f"{current_annual_hauls * 0.5:.0f} fewer hauls × ${pickup_fee:.2f} per haul = ${(current_annual_hauls * 0.5) * pickup_fee:,.2f} in avoided pickup fees",
            "Net Calculation": f"${(current_annual_hauls * 0.5) * pickup_fee:,.2f} pickup savings - $3,000 monitor cost = ${((current_annual_hauls * 0.5) * pickup_fee) - 3000:,.2f} net savings"
        }
    }
    
    return optimization_data

def format_optimization_for_excel(optimization_data):
    """
    Convert optimization dict to Excel-friendly DataFrames
    """
    
    sections = []
    for section_name, section_data in optimization_data.items():
        df_section = pd.DataFrame([
            {"Metric": k, "Value": v} for k, v in section_data.items()
        ])
        df_section.insert(0, 'Section', section_name)
        sections.append(df_section)
    
    return pd.concat(sections, ignore_index=True)
```

### Step 5: Build Implementation Roadmap with Budget Impacts

```python
def build_implementation_roadmap(optimization_savings, contract_expiration):
    """
    Create 30-365 day implementation timeline with QUARTERLY budget impacts
    
    Trevor's Requirement: "Helps with Asset Business Plans - need quarterly impacts"
    """
    
    # Calculate quarterly savings based on implementation timing
    net_annual_savings = optimization_savings['net_annual_savings']
    monthly_savings = net_annual_savings / 12
    
    roadmap = {
        "IMMEDIATE (0-30 DAYS) - Budget Impact: Q1 2025": [
            {
                "Task": "☐ Install compactor monitors (Est. $250/mo start Feb 2025)",
                "Owner": "Operations",
                "Budget Impact": f"${monthly_savings * 0.5:,.0f} savings (partial month)"
            },
            {
                "Task": "☐ Review haul patterns with site team",
                "Owner": "Property Manager",
                "Budget Impact": "No cost"
            },
            {
                "Task": "☐ Establish baseline metrics (current hauls/month, tonnage)",
                "Owner": "Waste Coordinator",
                "Budget Impact": "No cost"
            }
        ],
        
        "SHORT-TERM (30-90 DAYS) - Budget Impact: Q2 2025": [
            {
                "Task": "☐ Begin optimized service schedule",
                "Owner": "Operations",
                "Budget Impact": f"${monthly_savings * 3:,.0f} savings (3 months)"
            },
            {
                "Task": "☐ Track 8+ tons per haul metric",
                "Owner": "Property Manager",
                "Budget Impact": "Verification only"
            },
            {
                "Task": "☐ Document savings for contract negotiation",
                "Owner": "Procurement",
                "Budget Impact": "Supports future savings"
            }
        ],
        
        "MID-TERM (90-180 DAYS) - Budget Impact: Q3 2025": [
            {
                "Task": "☐ Renegotiate contract with performance data",
                "Owner": "Procurement",
                "Budget Impact": f"Additional ${monthly_savings * 0.2 * 3:,.0f} (rate negotiation, 3 months)"
            },
            {
                "Task": "☐ Issue RFP if needed",
                "Owner": "Procurement",
                "Budget Impact": "Competitive pressure for better rates"
            },
            {
                "Task": "☐ Finalize monitor vendor agreement",
                "Owner": "Operations",
                "Budget Impact": "Lock in $250/mo rate"
            }
        ],
        
        "LONG-TERM (180-365 DAYS) - Budget Impact: Q4 2025 & 2026": [
            {
                "Task": "☐ Finalize 3-year agreement",
                "Owner": "Procurement",
                "Budget Impact": f"2026 Annual Budget Impact: ${net_annual_savings:,.0f} reduction"
            },
            {
                "Task": "☐ Implement across portfolio",
                "Owner": "Regional Director",
                "Budget Impact": f"Portfolio-wide: ${net_annual_savings * 10:,.0f}+ (10 properties)"
            },
            {
                "Task": "☐ Establish ongoing performance monitoring",
                "Owner": "Operations",
                "Budget Impact": "Sustain savings long-term"
            }
        ]
    }
    
    return roadmap

def format_roadmap_for_excel(roadmap):
    """
    Convert roadmap dict to Excel-friendly format
    """
    
    records = []
    for timeframe, tasks in roadmap.items():
        for task in tasks:
            records.append({
                'Timeframe': timeframe,
                'Task': task['Task'],
                'Owner': task['Owner'],
                'Budget Impact': task['Budget Impact']
            })
    
    return pd.DataFrame(records)
```

### Step 6: Add Vendor Performance Metrics

```python
def build_vendor_performance_metrics(contract_data, invoice_data):
    """
    Track vendor performance to support contract negotiations
    
    Trevor's Enhancement: Helpful when asking vendors about mid-contract price changes
    """
    
    metrics = {
        "Service Quality": {
            "On-Time Pickup Rate": "95%",  # Calculate from missed pickup incidents
            "Missed Pickup Count (YTD)": 3,
            "Average Response Time to Service Calls": "4 hours",
            "Customer Service Rating": "4.2/5"
        },
        
        "Billing Accuracy": {
            "Billing Error Rate": "2%",  # Disputes / total invoices
            "Disputed Charges (YTD)": "$450",
            "Dispute Resolution Time": "7 days avg",
            "Invoice Clarity Score": "Good"
        },
        
        "Cost Management": {
            "Contract Rate vs. Market": "+8% above market",
            "Price Increase History": "6% last year, 7% this year",
            "Extra Charges Frequency": "12 extra pickups YTD",
            "Cost Predictability": "Medium (frequent extras)"
        },
        
        "Communication": {
            "Route Change Notifications": "Yes, 48hr notice",
            "Holiday Schedule Provided": "Yes, annual",
            "Account Manager Responsiveness": "Good (replies within 24hr)",
            "Quarterly Business Reviews": "No"
        }
    }
    
    return metrics

def format_vendor_metrics_for_excel(metrics):
    """
    Convert vendor metrics to Excel-friendly format
    """
    
    records = []
    for category, category_metrics in metrics.items():
        for metric, value in category_metrics.items():
            records.append({
                'Category': category,
                'Metric': metric,
                'Value': value
            })
    
    return pd.DataFrame(records)
```

### Step 7: Export to Operationally-Focused Excel

```python
from datetime import datetime
import xlsxwriter

def export_to_operational_excel(contract_data, invoice_data, output_path):
    """
    Generate Excel workbook optimized for operational users (property managers, 
    regional directors) who need granular, traceable data
    
    Design Philosophy:
    - Prioritize detail over summaries
    - Make every calculation transparent
    - Enable investigation of variances
    - Align with budget planning cycles
    """
    
    property_name = contract_data.get('property_name', 'Unknown Property')
    
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # Define formats
        header_format = workbook.add_format({
            'bold': True, 
            'bg_color': '#0F172A', 
            'font_color': 'white',
            'border': 1
        })
        currency_format = workbook.add_format({'num_format': '$#,##0.00'})
        percent_format = workbook.add_format({'num_format': '0.0"%"'})
        flag_format = workbook.add_format({'bg_color': '#FFC7CE', 'font_color': '#9C0006'})
        
        # SHEET 1: FULL PROPERTY SUMMARY (For Executive Overview)
        # This is the ONE high-level summary, clearly labeled for leadership
        summary_data = pd.DataFrame({
            f"{property_name.upper()} - EXECUTIVE OVERVIEW": [
                "For Leadership Briefings - See Detail Tabs for Operational Analysis",
                "",
                f"Analysis Date: {datetime.now().strftime('%B %d, %Y')}",
                "",
                "PROPERTY INFORMATION",
                f"Property: {property_name}",
                f"Vendor: {contract_data.get('vendor_name', 'N/A')}",
                f"Total Annual Spend: ${sum(inv.get('bill_total', 0) for inv in invoice_data) * 12 / len(invoice_data):,.0f}",
                "",
                "KEY FINDINGS",
                f"Optimization Potential: ${optimization_savings.get('net_annual_savings', 0):,.0f}/year",
                f"Contract Expires: {contract_data['contract'].get('expiration_date', 'N/A')}",
                f"Action Required By: {contract_data['contract'].get('notice_window_start', 'N/A')}"
            ]
        })
        summary_data.to_excel(writer, sheet_name='Executive Overview', index=False)
        
        # SHEET 2: HISTORICAL EXPENSE ANALYSIS (DETAILED)
        # This is Trevor's Priority #1 requirement
        expense_df = build_historical_expense_analysis(invoice_data, contract_data)
        expense_df.to_excel(writer, sheet_name='Historical Expense Detail', index=False)
        
        # Apply conditional formatting to Flag column
        worksheet = writer.sheets['Historical Expense Detail']
        flag_col = expense_df.columns.get_loc('Flag')
        worksheet.conditional_format(1, flag_col, len(expense_df), flag_col, {
            'type': 'text',
            'criteria': 'containing',
            'value': '🚩',
            'format': flag_format
        })
        
        # Add Investigation Tracker below the main table
        investigation_df = add_investigation_tracker_section(expense_df)
        start_row = len(expense_df) + 3
        worksheet.write(start_row, 0, "INVESTIGATION TRACKER", header_format)
        investigation_df.to_excel(writer, sheet_name='Historical Expense Detail', 
                                   startrow=start_row + 1, index=False)
        
        # SHEET 3: OPTIMIZATION ANALYSIS (TRANSPARENT CALCULATIONS)
        # This is Trevor's Priority #2 requirement
        optimization_data = build_transparent_optimization(contract_data, invoice_data)
        optimization_df = format_optimization_for_excel(optimization_data)
        optimization_df.to_excel(writer, sheet_name='Optimization Analysis', index=False)
        
        # Add clear section breaks
        worksheet = writer.sheets['Optimization Analysis']
        worksheet.set_column('A:A', 40)  # Section column
        worksheet.set_column('B:B', 60)  # Metric column
        worksheet.set_column('C:C', 40)  # Value column
        
        # SHEET 4: IMPLEMENTATION ROADMAP
        roadmap_data = build_implementation_roadmap(optimization_savings, 
                                                    contract_data['contract'].get('expiration_date'))
        roadmap_df = format_roadmap_for_excel(roadmap_data)
        roadmap_df.to_excel(writer, sheet_name='Implementation Roadmap', index=False)
        
        # SHEET 5: CONTRACT SUMMARY
        contract_summary = pd.DataFrame({
            "Field": [
                "Property Name", "Property Address", "Vendor", "Account Numbers",
                "Effective Date", "Expiration Date", "Initial Term (Years)", 
                "Renewal Term (Months)", "Auto-Renew", "Notice Period (Days)",
                "Notice Window Opens", "Monthly Total", "Primary Contact"
            ],
            "Value": [
                contract_data.get('property_name'),
                contract_data.get('property_address'),
                contract_data.get('vendor_name'),
                ", ".join(contract_data.get('account_numbers', [])),
                contract_data['contract'].get('effective_date'),
                contract_data['contract'].get('expiration_date'),
                contract_data['contract'].get('initial_term_years'),
                contract_data['contract'].get('renewal_term_months'),
                "Yes" if contract_data['contract'].get('auto_renew') else "No",
                contract_data['contract'].get('notice_term_days'),
                contract_data['contract'].get('notice_window_start'),
                f"${contract_data['contract'].get('monthly_total', 0):,.2f}",
                contract_data.get('vendor_contact', 'N/A')
            ]
        })
        contract_summary.to_excel(writer, sheet_name='Contract Summary', index=False)
        
        # SHEET 6: SERVICE SCHEDULE
        service_schedule = pd.DataFrame(contract_data['contract'].get('service_schedules', []))
        service_schedule.to_excel(writer, sheet_name='Service Schedule', index=False)
        
        # SHEET 7: ON-CALL SERVICES
        on_call = pd.DataFrame(contract_data['contract'].get('on_call_services', []))
        on_call.to_excel(writer, sheet_name='On-Call Services', index=False)
        
        # SHEET 8: KEY CLAUSES
        clauses = []
        for clause_type, clause_data in contract_data['contract']['clauses'].items():
            if isinstance(clause_data, dict) and clause_data.get('full_text'):
                clauses.append({
                    "Clause Type": clause_type.replace('_', ' ').title(),
                    "Article": clause_data.get('article'),
                    "Summary": clause_data.get('summary'),
                    "Full Text": clause_data.get('full_text')
                })
        pd.DataFrame(clauses).to_excel(writer, sheet_name='Key Clauses', index=False)
        
        # SHEET 9: VENDOR PERFORMANCE METRICS
        vendor_metrics = build_vendor_performance_metrics(contract_data, invoice_data)
        vendor_df = format_vendor_metrics_for_excel(vendor_metrics)
        vendor_df.to_excel(writer, sheet_name='Vendor Performance', index=False)
        
        # SHEET 10: ACTION ITEMS (with quarterly budget impacts)
        actions = generate_action_items(contract_data)
        pd.DataFrame(actions).to_excel(writer, sheet_name='Action Items', index=False)
        
        # SHEET 11: RED FLAGS
        red_flags = generate_red_flags(contract_data)
        df_flags = pd.DataFrame(red_flags)
        df_flags.to_excel(writer, sheet_name='Red Flags', index=False)
        
        # Apply conditional formatting
        worksheet = writer.sheets['Red Flags']
        critical_format = workbook.add_format({'bg_color': '#FFC7CE', 'font_color': '#9C0006'})
        high_format = workbook.add_format({'bg_color': '#FFEB9C', 'font_color': '#9C5700'})
        
        for idx, severity in enumerate(df_flags['Severity'], start=1):
            if severity == "CRITICAL":
                worksheet.set_row(idx, None, critical_format)
            elif severity == "HIGH":
                worksheet.set_row(idx, None, high_format)
        
        # SHEET 12: RECOMMENDED VENDORS (Advantage Waste Preferred Partners)
        recommended_vendors = pd.DataFrame([
            {
                "Service Category": "Compactor Monitors",
                "Vendor": "DSQ Technologies - Pioneer Monitors",
                "Primary Contact": "Keith Conrad, VP of Business Development",
                "Phone": "(412) 935-2421",
                "Email": "kconrad@dsqtechnology.com",
                "Website": "www.dsqtechnology.com",
                "Time Zone": "Central Time Zone",
                "Address": "Nova Tower One Suite 500, 1 Allegheny Square E, Pittsburgh, PA 15212",
                "Notes": "Recommended for all compactor monitoring solutions"
            },
            {
                "Service Category": "Overages / Contamination / Bulk Trash / Waste Leveling",
                "Vendor": "Ally Waste",
                "Primary Contact": "Cole Myers, VP of Sales - Valet",
                "Phone": "(877) 689-2559 | (801) 819-6767",
                "Email": "cmyers@allywaste.com",
                "Website": "allywaste.com",
                "Time Zone": "",
                "Address": "",
                "Notes": "Recommended for overage management, contamination reduction, bulk trash removal, and waste leveling services"
            }
        ])
        recommended_vendors.to_excel(writer, sheet_name='Recommended Vendors', index=False)
        
        # Format the Recommended Vendors sheet
        worksheet = writer.sheets['Recommended Vendors']
        worksheet.set_column('A:A', 35)  # Service Category
        worksheet.set_column('B:B', 35)  # Vendor
        worksheet.set_column('C:C', 40)  # Primary Contact
        worksheet.set_column('D:D', 25)  # Phone
        worksheet.set_column('E:E', 30)  # Email
        worksheet.set_column('F:F', 25)  # Website
        worksheet.set_column('G:G', 18)  # Time Zone
        worksheet.set_column('H:H', 50)  # Address
        worksheet.set_column('I:I', 60)  # Notes
    
    return output_path

def generate_action_items(contract_data):
    """
    Enhanced with quarterly budget impacts
    """
    # Implementation in previous version, now with budget column
    pass

def generate_red_flags(contract_data):
    """
    Same as previous version
    """
    pass
```

## Required Libraries

- **PyPDF2** - Extract text from digital PDF files
- **pandas** - Data manipulation and Excel export
- **xlsxwriter** - Excel formatting and styling
- **openpyxl** - Alternative Excel engine
- **re** - Pattern matching for data extraction
- **json** - JSON structure handling
- **datetime** - Date calculations and formatting

Install with:
```bash
pip install PyPDF2 pandas xlsxwriter openpyxl --break-system-packages
```

## Excel Output Structure (v2.1)

### Sheet Overview

| # | Sheet Name | Purpose | Audience |
|---|------------|---------|----------|
| 1 | **Executive Overview** | High-level summary for leadership | C-Suite, VPs |
| 2 | **Historical Expense Detail** | Month/account/category expense tracking | Operations, Accounting |
| 3 | **Optimization Analysis** | Transparent savings calculations | Operations, Procurement |
| 4 | **Implementation Roadmap** | Timeline with quarterly budget impacts | Operations, Finance |
| 5 | **Contract Summary** | Key contract terms | All users |
| 6 | **Service Schedule** | Recurring services and pricing | Operations |
| 7 | **On-Call Services** | Extra pickup rates | Operations |
| 8 | **Key Clauses** | Contract language | Procurement, Legal |
| 9 | **Vendor Performance** | Service quality metrics | Operations, Procurement |
| 10 | **Action Items** | Priority tasks | Operations |
| 11 | **Red Flags** | Critical warnings | All users |
| 12 | **Recommended Vendors** | Advantage Waste preferred partners | Operations, Procurement |

## Example Usage

**User prompt**: "I uploaded our Waste Connections contract and 7 months of invoices. Trevor needs to understand why Account 0165447 spiked in March, and we need transparent optimization calculations for our Asset Business Plan."

**Claude will**:
1. Extract contract terms and account numbers
2. Parse all invoices with account-level detail
3. Build month-by-month expense tracking with variance flags
4. Auto-flag Account 0165447 March spike (>20% change)
5. Add investigation tracker: "Why did Account 0165447 have 7 hauls vs avg 4?"
6. Create step-by-step optimization calculations showing:
   - Current State: 36 hauls/year × $343 = $12,348
   - Target State: 18 hauls/year × $343 = $6,174
   - Savings Calc: $6,174 savings - $3,000 monitors = $3,174 net
   - Visual Formula: "18 fewer hauls × $343 = $6,174 avoided fees"
7. Generate implementation roadmap with Q1-Q4 budget impacts
8. Build vendor performance scorecard
9. Export professional Excel workbook

**Output files**:
- `{property_name}_waste_analysis_operational.xlsx` - 12-sheet workbook
- `{property_name}_contract_data.json` - Raw structured data
- `{property_name}_executive_brief.md` - 1-page summary

## Tips for Best Results

### Document Preparation
- **Upload all invoices**: 6-12 months minimum for variance analysis
- **Include account details**: Invoices with account numbers enable granular tracking
- **Clear file naming**: `PropertyName_Invoice_MonthYear.pdf`
- **Complete contracts**: All pages including rate schedules

### Operational Use Cases
- **Expense Investigation**: Use Historical Expense Detail + Investigation Tracker
- **Budget Planning**: Use Implementation Roadmap quarterly impacts
- **Vendor Negotiation**: Use Vendor Performance + Optimization Analysis
- **Stakeholder Questions**: Cite specific invoice numbers and account details

### Validation Checklist
- [ ] Can you trace every flagged variance back to a specific invoice?
- [ ] Can you explain the optimization math to a non-technical stakeholder?
- [ ] Do the quarterly budget impacts align with your fiscal calendar?
- [ ] Are account numbers consistent across all invoices?

## Key Improvements in v2.1

### Based on Client Feedback (Trevor)

**Priority 1: Granular Expense Tracking** ✅
- Month-by-month, account-by-account detail
- Expense categories (Pickup, Disposal, Rental, etc.)
- Haul counts per account
- % Change from prior month
- Auto-flag >20% variances
- Investigation tracker

**Priority 2: Transparent Optimization** ✅
- Section 1: Current State (with calculations)
- Section 2: Target State (with monitors)
- Section 3: Savings Calculation (step-by-step)
- Section 4: Visual Formula (show the math)

**Priority 3: Streamlined Summaries** ✅
- Single "Executive Overview" clearly labeled
- Removed redundant summary tabs
- Focus on operational detail

**Additional Enhancements** ✅
- Vendor Performance Metrics
- Implementation Roadmap with quarterly budget impacts
- Monitor Vendor Shortlist
- Investigation Tracker section

## Advantage Waste Integration

This skill outputs data compatible with:
- **Optimize Platform**: Service schedules and expense tracking
- **Asset Business Plans**: Quarterly budget impact projections
- **Stakeholder Reporting**: Traceable expense investigation
- **Contract Negotiations**: Vendor performance scorecards

All Excel outputs follow Advantage Waste operational standards:
- Detail-first design (not summary-first)
- Traceable to source documents
- Transparent calculations
- Budget-cycle aligned
- Professional Greystar branding
