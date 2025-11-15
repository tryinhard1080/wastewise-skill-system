# EXPENSE_ANALYSIS Sheet - ROW-BASED FORMAT (Correct Version)

## This is the format shown in your screenshot - REPLACE the column-based version in SKILL__2_.md

```python
def create_expense_analysis_sheet(wb, invoice_data, property_data):
    """
    CRITICAL FORMAT: Each INVOICE as a ROW (NOT column-based)
    
    Columns: Month | Vendor | Service Type | Invoice Number | Amount | Cost/Door | Notes
    
    Must include:
    - Each invoice as separate row
    - Monthly subtotal rows with budget calculation
    - Grand total at bottom
    - All invoice numbers clearly visible
    """
    ws = wb.create_sheet("EXPENSE_ANALYSIS")
    
    # Title
    ws['A1'] = "DETAILED MONTHLY EXPENSE ANALYSIS"
    ws['A1'].font = Font(bold=True, size=14, color="FFFFFF")
    ws['A1'].fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    ws.merge_cells('A1:G1')
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[1].height = 25
    
    # Header Row (row 3)
    headers = ['Month', 'Vendor', 'Service Type', 'Invoice Number', 'Amount', 'Cost/Door', 'Notes']
    
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col)
        cell.value = header
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.alignment = Alignment(horizontal='center', vertical='center')
    
    ws.row_dimensions[3].height = 20
    
    # Sort invoices by date
    sorted_invoices = sorted(invoice_data, key=lambda x: x['date'])
    
    # Group by month
    from itertools import groupby
    from operator import itemgetter
    
    grouped_invoices = {}
    for inv in sorted_invoices:
        month_key = inv['date'].strftime('%B %Y')
        if month_key not in grouped_invoices:
            grouped_invoices[month_key] = []
        grouped_invoices[month_key].append(inv)
    
    row = 4
    grand_total = 0
    
    # Process each month
    for month, invoices in grouped_invoices.items():
        month_total = 0
        
        # Add each invoice as a row
        for invoice in invoices:
            ws.cell(row=row, column=1).value = month
            ws.cell(row=row, column=2).value = invoice.get('vendor_name', 'Unknown Vendor')
            ws.cell(row=row, column=3).value = invoice.get('service_type', 'Waste Service')
            ws.cell(row=row, column=4).value = invoice.get('invoice_number', 'N/A')
            
            # Amount
            amount = invoice.get('total', 0)
            ws.cell(row=row, column=5).value = amount
            ws.cell(row=row, column=5).number_format = '$#,##0.00'
            
            # Cost per door
            cost_per_door = amount / property_data['units']
            ws.cell(row=row, column=6).value = cost_per_door
            ws.cell(row=row, column=6).number_format = '$#,##0.00'
            
            # Notes
            notes = invoice.get('notes', '')
            if not notes:
                # Generate default note based on service type
                service_type = invoice.get('service_type', '').lower()
                if 'bulk' in service_type:
                    notes = 'Monthly bulk trash removal service'
                elif 'compactor' in service_type:
                    notes = 'Compactor maintenance and service fees'
                elif 'haul' in service_type or 'dumpster' in service_type:
                    notes = 'Regular waste hauling service'
                else:
                    notes = 'Waste management service'
            
            ws.cell(row=row, column=7).value = notes
            ws.cell(row=row, column=7).alignment = Alignment(wrap_text=True)
            
            month_total += amount
            row += 1
        
        # Add monthly subtotal row
        ws.cell(row=row, column=4).value = f"{month} TOTAL:"
        ws.cell(row=row, column=4).font = Font(bold=True, italic=True)
        ws.cell(row=row, column=4).alignment = Alignment(horizontal='right')
        
        ws.cell(row=row, column=5).value = month_total
        ws.cell(row=row, column=5).number_format = '$#,##0.00'
        ws.cell(row=row, column=5).font = Font(bold=True)
        ws.cell(row=row, column=5).fill = PatternFill(start_color="E7E6E6", end_color="E7E6E6", fill_type="solid")
        
        # Monthly budget per door
        monthly_cpd = month_total / property_data['units']
        ws.cell(row=row, column=6).value = monthly_cpd
        ws.cell(row=row, column=6).number_format = '$#,##0.00'
        ws.cell(row=row, column=6).font = Font(bold=True)
        ws.cell(row=row, column=6).fill = PatternFill(start_color="E7E6E6", end_color="E7E6E6", fill_type="solid")
        
        ws.cell(row=row, column=7).value = f"Monthly budget: ${monthly_cpd:.2f}/door"
        ws.cell(row=row, column=7).font = Font(italic=True)
        ws.cell(row=row, column=7).fill = PatternFill(start_color="E7E6E6", end_color="E7E6E6", fill_type="solid")
        
        grand_total += month_total
        row += 1
    
    # Add blank row before grand total
    row += 1
    
    # Grand Total Row
    ws.cell(row=row, column=4).value = "GRAND TOTAL:"
    ws.cell(row=row, column=4).font = Font(bold=True, size=12)
    ws.cell(row=row, column=4).alignment = Alignment(horizontal='right')
    
    ws.cell(row=row, column=5).value = grand_total
    ws.cell(row=row, column=5).number_format = '$#,##0.00'
    ws.cell(row=row, column=5).font = Font(bold=True, size=12)
    ws.cell(row=row, column=5).fill = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
    
    # Average monthly budget
    num_months = len(grouped_invoices)
    avg_monthly_cpd = (grand_total / num_months) / property_data['units']
    
    ws.cell(row=row, column=6).value = avg_monthly_cpd
    ws.cell(row=row, column=6).number_format = '$#,##0.00'
    ws.cell(row=row, column=6).font = Font(bold=True, size=12)
    ws.cell(row=row, column=6).fill = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
    
    ws.cell(row=row, column=7).value = f"Avg monthly budget: ${avg_monthly_cpd:.2f}/door"
    ws.cell(row=row, column=7).font = Font(bold=True, italic=True)
    ws.cell(row=row, column=7).fill = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
    
    # Column widths
    ws.column_dimensions['A'].width = 15  # Month
    ws.column_dimensions['B'].width = 20  # Vendor
    ws.column_dimensions['C'].width = 20  # Service Type
    ws.column_dimensions['D'].width = 18  # Invoice Number
    ws.column_dimensions['E'].width = 12  # Amount
    ws.column_dimensions['F'].width = 10  # Cost/Door
    ws.column_dimensions['G'].width = 45  # Notes
    
    # Freeze panes (freeze header row)
    ws.freeze_panes = 'A4'
    
    # Add borders to all cells
    thin_border = Border(
        left=Side(style='thin', color='000000'),
        right=Side(style='thin', color='000000'),
        top=Side(style='thin', color='000000'),
        bottom=Side(style='thin', color='000000')
    )
    
    for row_num in range(3, row + 1):
        for col_num in range(1, 8):
            ws.cell(row=row_num, column=col_num).border = thin_border
```

---

## Updated EXPENSE FORMAT TEMPLATE

**Replace the entire wastewise_expense_format_template.md with this:**

```markdown
# WasteWise Expense Analysis Format Template

## Purpose
This template shows the exact formatting standard for the EXPENSE_ANALYSIS tab in all WasteWise Excel workbooks. Use this as a reference to ensure consistency across all property analyses.

---

## Format Requirements

### Structure
- **Format:** Row-based (each invoice is a separate row)
- **Header:** "DETAILED MONTHLY EXPENSE ANALYSIS"
- **Columns:** Month | Vendor | Service Type | Invoice Number | Amount | Cost/Door | Notes
- **Monthly Subtotals:** After each month's invoices
- **Grand Total:** At bottom with average monthly budget

### Required Elements
✓ Each invoice as separate row  
✓ Monthly grouping with subtotals  
✓ All invoice numbers clearly visible  
✓ Service type description for each line  
✓ Cost per door calculated for each invoice  
✓ Monthly budget per door in subtotal rows  
✓ Notes column with service description  
✓ Grand total with average monthly budget  

---

## Example Format

### DETAILED MONTHLY EXPENSE ANALYSIS

| Month | Vendor | Service Type | Invoice Number | Amount | Cost/Door | Notes |
|-------|--------|--------------|----------------|--------|-----------|-------|
| October 2024 | Ally Waste | Bulk Trash Removal | 41953 | $909.33 | $5.05 | Monthly bulk trash removal service |
| **October 2024 TOTAL:** | | | | **$909.33** | **$5.05** | *Monthly budget: $5.05/door* |
| November 2024 | Waste Management | Dumpster Hauling | 5998169-1571-5 | $1,388.51 | $7.71 | Regular waste hauling service |
| November 2024 | Waste Management | Compactor Service | RI1370230 | $500.44 | $2.78 | Compactor maintenance and service fees |
| November 2024 | Ally Waste | Bulk Trash Removal | 43819 | $368.55 | $2.05 | Monthly bulk trash removal service |
| **November 2024 TOTAL:** | | | | **$2,257.50** | **$12.54** | *Monthly budget: $12.54/door* |
| December 2024 | Waste Management | Compactor Service | RI1376420 | $506.87 | $2.82 | Compactor maintenance and service fees |
| December 2024 | Ally Waste | Bulk Trash Removal | 46450 | $563.55 | $3.13 | Monthly bulk trash removal service |
| December 2024 | Waste Management | Dumpster Hauling | N/A | $506.87 | $2.82 | Regular waste hauling service |
| December 2024 | Waste Management | Dumpster Hauling | N/A | $1,825.12 | $10.14 | Regular waste hauling service |
| **December 2024 TOTAL:** | | | | **$3,402.41** | **$18.90** | *Monthly budget: $18.90/door* |
| | | | | | | |
| | | | **GRAND TOTAL:** | **$34,460.72** | **$14.73** | *Avg monthly budget: $14.73/door* |

---

## Key Formatting Rules

### 1. Header Row
- Dark blue background (#4472C4)
- White text, bold
- Centered alignment
- Columns: Month | Vendor | Service Type | Invoice Number | Amount | Cost/Door | Notes

### 2. Invoice Rows
- One row per invoice
- Month in first column (repeated for all invoices in that month)
- Vendor name
- Service type description
- Invoice number (or "N/A" if not available)
- Amount in currency format ($#,##0.00)
- Cost per door calculated (amount ÷ units)
- Notes describing the service

### 3. Monthly Subtotal Rows
- Format: "[Month Year] TOTAL:" in Invoice Number column
- Bold, italic text
- Light gray background (#E7E6E6)
- Amount: Sum of month's invoices
- Cost/Door: Monthly total ÷ units
- Notes: "Monthly budget: $X.XX/door" in italics

### 4. Grand Total Row
- Blank row before grand total
- "GRAND TOTAL:" in Invoice Number column
- Bold, larger font (12pt)
- Medium gray background (#D9D9D9)
- Amount: Sum of all invoices
- Cost/Door: Average monthly cost per door
- Notes: "Avg monthly budget: $X.XX/door"

### 5. Visual Styling
- Title row: Dark blue background, white text, merged across all columns
- Header row: Blue background, white text, bold
- Data rows: White background, black text
- Subtotal rows: Light gray background, bold amounts
- Grand total: Medium gray background, bold large font
- Borders: Thin black borders on all cells

---

## Column Specifications

| Column | Width | Format | Alignment |
|--------|-------|--------|-----------|
| A - Month | 15 char | Text | Left |
| B - Vendor | 20 char | Text | Left |
| C - Service Type | 20 char | Text | Left |
| D - Invoice Number | 18 char | Text | Center |
| E - Amount | 12 char | Currency | Right |
| F - Cost/Door | 10 char | Currency | Right |
| G - Notes | 45 char | Text | Left, Wrap |

---

## Notes Column Standards

### Default Service Descriptions:
- **Bulk Trash:** "Monthly bulk trash removal service"
- **Compactor Service:** "Compactor maintenance and service fees"
- **Dumpster Hauling:** "Regular waste hauling service"
- **Container Rental:** "Container rental fees"
- **Contamination:** "Contamination charge for [reason]"
- **Environmental Fee:** "Environmental/fuel surcharge"

Add specific details when available (e.g., "3x weekly service", "8-yard container")

---

## Excel Implementation

### Key Formulas:
```
Cost Per Door: =E4/[units]
Monthly Subtotal Amount: =SUM(E4:E6)
Monthly Subtotal CPD: =E10/[units]
Grand Total: =SUM(E10+E20+E30...)
Average Monthly CPD: =(E50/[num_months])/[units]
```

### Freeze Panes:
Freeze at row 4 (keep header visible when scrolling)

### Conditional Formatting:
- Highlight subtotal rows with light gray fill
- Highlight grand total row with medium gray fill
- Bold all subtotal and total amounts

---

## Quality Checks Before Delivery

✓ Every invoice has a row  
✓ All invoice numbers visible (or marked "N/A")  
✓ Service types clearly described  
✓ Monthly subtotals calculate correctly  
✓ Cost per door = amount ÷ unit count  
✓ Grand total matches sum of monthly subtotals  
✓ Notes column provides context  
✓ Formatting consistent (colors, fonts, borders)  
✓ Column widths optimized for readability  

---

## Benefits of This Format

### For Regional Managers:
1. **Invoice Verification** - See every individual invoice number for audit
2. **Vendor Tracking** - Identify all vendors serving the property
3. **Service Detail** - Understand what each charge is for
4. **Budget Planning** - Monthly totals show cost per door for budgeting
5. **Cost Allocation** - Track spending by vendor and service type
6. **Trend Analysis** - Compare monthly budgets over time

### For Property Teams:
1. **Complete Transparency** - Every charge documented
2. **Easy Reconciliation** - Match to actual invoices
3. **Service Verification** - Confirm services performed
4. **Dispute Resolution** - Reference specific invoice numbers

---

**Last Updated:** November 13, 2025  
**Format Version:** 2.0 - Row-Based (Mandarina Standard)  
**Status:** Official WasteWise Format
```

---

## What This Changes

### OLD (Column-Based):
- Months as columns
- Expense categories as rows
- Hard to see individual invoices

### NEW (Row-Based):
- Each invoice as a row
- Months grouped with subtotals
- Complete invoice visibility
- Better for audit and verification

---

## This Is Now The Standard

All future WasteWise analyses should use this ROW-BASED format for the EXPENSE_ANALYSIS tab.
