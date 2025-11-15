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
