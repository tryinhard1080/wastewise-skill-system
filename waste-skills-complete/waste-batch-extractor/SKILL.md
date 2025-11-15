---
name: waste-batch-extractor
description: Batch process multiple waste invoices, contracts, and Excel expense reports to extract structured data organized by location. Uses Claude Vision API for document analysis and creates location-specific Excel tabs with validation reports. Use when user uploads multiple waste documents, mentions batch processing, location-based reporting, or needs to validate extraction accuracy across properties.
---

# Waste Batch Extractor

## What This Skill Does

Processes folders of waste management documents (invoices, contracts, Excel reports) in batch, extracts structured data using Claude's Vision API, organizes results by property location, and validates extraction accuracy. Creates multi-tabbed Excel workbooks with location-specific sheets and comprehensive quality reports.

## When to Use

Invoke this skill when the user:
- Uploads multiple waste documents for batch processing
- Mentions "process all invoices", "extract from folder", or "batch analysis"
- Wants data organized by location/property
- Needs validation reports to verify extraction accuracy
- References Excel expense reports that need data extraction
- Says "check my extraction", "validate the data", or "quality report"
- Has mixed document types (PDFs, images, scanned docs, Excel files)
- Needs location-specific tabs or property-level breakdowns
- Mentions property names like Columbia Square, Jardine, or other Greystar locations

## How It Works

### Step 1: Scan and Categorize Documents

```python
import os
import base64
from pathlib import Path
import mimetypes

def scan_document_folder(folder_path):
    """
    Scan folder and categorize documents by type
    """
    documents = {
        "invoices": [],
        "contracts": [],
        "excel_reports": [],
        "images": [],
        "unknown": []
    }
    
    supported_extensions = {
        ".pdf": "pdf",
        ".xlsx": "excel",
        ".xls": "excel",
        ".csv": "csv",
        ".png": "image",
        ".jpg": "image",
        ".jpeg": "image",
        ".tif": "image",
        ".tiff": "image"
    }
    
    for file_path in Path(folder_path).rglob("*"):
        if file_path.is_file():
            ext = file_path.suffix.lower()
            if ext in supported_extensions:
                file_info = {
                    "path": str(file_path),
                    "name": file_path.name,
                    "size": file_path.stat().st_size,
                    "type": supported_extensions[ext]
                }
                
                # Categorize by filename patterns
                name_lower = file_path.name.lower()
                if "invoice" in name_lower or "statement" in name_lower:
                    documents["invoices"].append(file_info)
                elif "contract" in name_lower or "agreement" in name_lower:
                    documents["contracts"].append(file_info)
                elif ext in [".xlsx", ".xls"]:
                    documents["excel_reports"].append(file_info)
                elif ext in [".png", ".jpg", ".jpeg", ".tif", ".tiff"]:
                    documents["images"].append(file_info)
                else:
                    documents["unknown"].append(file_info)
    
    return documents

def encode_image_base64(image_path):
    """
    Encode image to base64 for Claude Vision API
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
```

### Step 2: Extract Using Claude Vision API

```python
import anthropic
import json

def extract_with_claude_vision(file_path, document_type="invoice"):
    """
    Use Claude's Vision API to extract structured data from documents
    """
    
    client = anthropic.Anthropic()
    
    # Read file as base64
    with open(file_path, "rb") as f:
        file_data = base64.b64encode(f.read()).decode("utf-8")
    
    # Determine media type
    mime_type = mimetypes.guess_type(file_path)[0] or "application/pdf"
    
    # Schema for extraction based on document type
    if document_type == "invoice":
        extraction_schema = {
            "source_file": "",
            "document_type": "invoice",
            "property_name": None,
            "property_address": None,
            "vendor_name": None,
            "vendor_account_number": None,
            "billing_period": {
                "start_date": None,
                "end_date": None,
                "raw": None
            },
            "invoice": {
                "invoice_number": None,
                "invoice_date": None,
                "due_date": None,
                "amount_due": None,
                "subtotal": None,
                "line_items": []
            }
        }
        
        prompt = f"""Extract all information from this waste management invoice into structured JSON.

Return ONLY valid JSON in this exact format:
{json.dumps(extraction_schema, indent=2)}

For line_items, include:
- date: Service date (YYYY-MM-DD)
- description: Full line item description
- category: One of [base, extra_pickup, contamination, overage, fuel_surcharge, franchise_fee, admin, env_charge]
- quantity: Number value
- uom: Unit of measure (month, lift, incident, etc)
- container_size_yd: Container size in yards (number or null)
- container_type: FEL, COMPACTOR, REL, or null
- frequency_per_week: Number or null
- unit_rate: Numeric string without $
- extended_amount: Numeric string without $
- notes: Any additional context or null

Extract ALL amounts as strings without $ or commas (e.g., "1250.00")
Extract ALL dates in YYYY-MM-DD format
If a field cannot be found, use null
Property name is critical - extract carefully"""

    elif document_type == "contract":
        extraction_schema = {
            "source_file": "",
            "document_type": "contract",
            "property_name": None,
            "vendor_name": None,
            "contract": {
                "effective_date": None,
                "expiration_date": None,
                "initial_term_years": None,
                "renewal_term_months": None,
                "auto_renew": None,
                "notice_term_days": None,
                "monthly_total": None,
                "service_schedules": [],
                "clauses": {}
            }
        }
        
        prompt = f"""Extract all contract information into structured JSON.

Return ONLY valid JSON in this format:
{json.dumps(extraction_schema, indent=2)}

Focus on:
- Contract terms (dates, renewal, notice periods)
- Monthly service costs and schedules
- Key clauses (price increase, termination, renewal)
- Service schedules with container types and frequencies

Property name is critical - extract carefully"""
    
    # Call Claude Vision API
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document" if mime_type == "application/pdf" else "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": file_data
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    
    # Parse response
    response_text = message.content[0].text
    
    # Clean markdown code blocks if present
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()
    
    extracted_data = json.loads(response_text)
    extracted_data["source_file"] = os.path.basename(file_path)
    
    return extracted_data

def extract_excel_expenses(excel_path):
    """
    Extract expense data from Excel files
    """
    import pandas as pd
    
    # Try to read Excel file
    try:
        df = pd.read_excel(excel_path, sheet_name=0)
    except:
        df = pd.read_csv(excel_path)
    
    # Look for common waste expense patterns
    expense_columns = {
        "property": ["property", "location", "site", "name"],
        "vendor": ["vendor", "supplier", "company", "hauler"],
        "date": ["date", "period", "month", "invoice date"],
        "amount": ["amount", "total", "cost", "expense", "charge"],
        "description": ["description", "service", "line item", "detail"]
    }
    
    # Map columns
    column_mapping = {}
    for key, patterns in expense_columns.items():
        for col in df.columns:
            if any(pattern in col.lower() for pattern in patterns):
                column_mapping[key] = col
                break
    
    # Extract records
    records = []
    for _, row in df.iterrows():
        record = {
            "source_file": os.path.basename(excel_path),
            "document_type": "expense_report",
            "property_name": row.get(column_mapping.get("property")) if "property" in column_mapping else None,
            "vendor_name": row.get(column_mapping.get("vendor")) if "vendor" in column_mapping else None,
            "date": str(row.get(column_mapping.get("date"))) if "date" in column_mapping else None,
            "amount": str(row.get(column_mapping.get("amount"))) if "amount" in column_mapping else None,
            "description": row.get(column_mapping.get("description")) if "description" in column_mapping else None
        }
        records.append(record)
    
    return records
```

### Step 3: Validate Extraction Quality

```python
def validate_extraction(extracted_data):
    """
    Validate extraction accuracy and calculate confidence scores
    """
    
    validation_report = {
        "source_file": extracted_data.get("source_file"),
        "document_type": extracted_data.get("document_type"),
        "property_name": extracted_data.get("property_name"),
        "confidence_score": 1.0,
        "critical_missing": [],
        "warnings": [],
        "needs_review": False,
        "validation_checks": {}
    }
    
    # Check critical fields
    critical_fields = {
        "invoice": ["property_name", "vendor_name", "invoice.invoice_number", 
                   "invoice.invoice_date", "invoice.amount_due"],
        "contract": ["property_name", "vendor_name", "contract.effective_date",
                    "contract.expiration_date"]
    }
    
    doc_type = extracted_data.get("document_type")
    if doc_type in critical_fields:
        for field_path in critical_fields[doc_type]:
            parts = field_path.split(".")
            value = extracted_data
            for part in parts:
                value = value.get(part) if isinstance(value, dict) else None
                if value is None:
                    break
            
            if value is None:
                validation_report["critical_missing"].append(field_path)
                validation_report["confidence_score"] -= 0.15
    
    # Invoice-specific validations
    if doc_type == "invoice":
        inv = extracted_data.get("invoice", {})
        
        # Check line items sum to total
        if inv.get("line_items"):
            line_total = sum(
                float(item.get("extended_amount", 0) or 0) 
                for item in inv["line_items"]
            )
            invoice_total = float(inv.get("amount_due", 0) or 0)
            
            if abs(line_total - invoice_total) > 1.0:
                validation_report["warnings"].append(
                    f"Line items total (${line_total:.2f}) != Invoice total (${invoice_total:.2f})"
                )
                validation_report["confidence_score"] -= 0.10
            
            validation_report["validation_checks"]["line_items_match_total"] = \
                abs(line_total - invoice_total) <= 1.0
        
        # Check date consistency
        if inv.get("invoice_date") and inv.get("due_date"):
            from datetime import datetime
            try:
                inv_date = datetime.fromisoformat(inv["invoice_date"])
                due_date = datetime.fromisoformat(inv["due_date"])
                
                if due_date <= inv_date:
                    validation_report["warnings"].append(
                        "Due date is not after invoice date"
                    )
                    validation_report["confidence_score"] -= 0.05
            except:
                pass
    
    # Determine if review needed
    validation_report["needs_review"] = (
        validation_report["confidence_score"] < 0.70 or
        len(validation_report["critical_missing"]) > 0
    )
    
    validation_report["confidence_score"] = round(
        max(0, validation_report["confidence_score"]), 2
    )
    
    return validation_report

def cross_validate_batch(all_extractions):
    """
    Cross-validate data across multiple documents for same property
    """
    
    # Group by property
    by_property = {}
    for record in all_extractions:
        prop = record.get("property_name")
        if prop:
            if prop not in by_property:
                by_property[prop] = []
            by_property[prop].append(record)
    
    validation_summary = {}
    
    for property_name, records in by_property.items():
        # Check vendor consistency
        vendors = set(r.get("vendor_name") for r in records if r.get("vendor_name"))
        
        # Check address consistency
        addresses = set(r.get("property_address") for r in records if r.get("property_address"))
        
        validation_summary[property_name] = {
            "document_count": len(records),
            "vendors": list(vendors),
            "vendor_consistent": len(vendors) <= 1,
            "addresses": list(addresses),
            "address_consistent": len(addresses) <= 1,
            "needs_review": len(vendors) > 1 or len(addresses) > 1
        }
    
    return validation_summary
```

### Step 4: Organize by Location and Export to Excel

```python
import pandas as pd
from datetime import datetime

def organize_by_location(all_extractions, validation_reports):
    """
    Organize extracted data by property location
    """
    
    # Group by property name
    by_location = {}
    
    for record, validation in zip(all_extractions, validation_reports):
        prop_name = record.get("property_name") or "Unknown Location"
        
        if prop_name not in by_location:
            by_location[prop_name] = {
                "invoices": [],
                "contracts": [],
                "expenses": [],
                "validations": []
            }
        
        doc_type = record.get("document_type")
        
        if doc_type == "invoice":
            by_location[prop_name]["invoices"].append(record)
        elif doc_type == "contract":
            by_location[prop_name]["contracts"].append(record)
        elif doc_type == "expense_report":
            by_location[prop_name]["expenses"].append(record)
        
        by_location[prop_name]["validations"].append(validation)
    
    return by_location

def export_to_excel(by_location, output_path):
    """
    Create Excel workbook with tabs for each location
    """
    
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # Summary sheet
        summary_data = []
        for location, data in by_location.items():
            summary_data.append({
                "Location": location,
                "Invoices": len(data["invoices"]),
                "Contracts": len(data["contracts"]),
                "Expenses": len(data["expenses"]),
                "Needs Review": sum(v["needs_review"] for v in data["validations"]),
                "Avg Confidence": round(
                    sum(v["confidence_score"] for v in data["validations"]) / 
                    len(data["validations"]) if data["validations"] else 0, 2
                )
            })
        
        df_summary = pd.DataFrame(summary_data)
        df_summary.to_excel(writer, sheet_name='Summary', index=False)
        
        # Format summary sheet
        worksheet = writer.sheets['Summary']
        header_format = workbook.add_format({
            'bold': True, 
            'bg_color': '#4472C4', 
            'font_color': 'white'
        })
        for col_num, value in enumerate(df_summary.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Create sheet for each location
        for location, data in by_location.items():
            # Clean sheet name (Excel has 31 char limit)
            sheet_name = location[:28] + "..." if len(location) > 31 else location
            sheet_name = sheet_name.replace("/", "-").replace("\\", "-")
            
            # Combine all records for this location
            location_rows = []
            
            # Add invoices
            for inv_record in data["invoices"]:
                inv = inv_record.get("invoice", {})
                base_row = {
                    "Source File": inv_record.get("source_file"),
                    "Doc Type": "Invoice",
                    "Property": inv_record.get("property_name"),
                    "Vendor": inv_record.get("vendor_name"),
                    "Account Number": inv_record.get("vendor_account_number"),
                    "Invoice Number": inv.get("invoice_number"),
                    "Invoice Date": inv.get("invoice_date"),
                    "Due Date": inv.get("due_date"),
                    "Amount Due": inv.get("amount_due"),
                    "Subtotal": inv.get("subtotal")
                }
                
                # Expand line items
                for item in inv.get("line_items", []):
                    row = base_row.copy()
                    row.update({
                        "Line Date": item.get("date"),
                        "Description": item.get("description"),
                        "Category": item.get("category"),
                        "Quantity": item.get("quantity"),
                        "Container Size": item.get("container_size_yd"),
                        "Container Type": item.get("container_type"),
                        "Frequency/Week": item.get("frequency_per_week"),
                        "Unit Rate": item.get("unit_rate"),
                        "Extended Amount": item.get("extended_amount")
                    })
                    location_rows.append(row)
            
            # Add contracts
            for con_record in data["contracts"]:
                con = con_record.get("contract", {})
                location_rows.append({
                    "Source File": con_record.get("source_file"),
                    "Doc Type": "Contract",
                    "Property": con_record.get("property_name"),
                    "Vendor": con_record.get("vendor_name"),
                    "Effective Date": con.get("effective_date"),
                    "Expiration Date": con.get("expiration_date"),
                    "Term Years": con.get("initial_term_years"),
                    "Renewal Months": con.get("renewal_term_months"),
                    "Auto Renew": con.get("auto_renew"),
                    "Notice Days": con.get("notice_term_days"),
                    "Monthly Total": con.get("monthly_total")
                })
            
            # Add expenses
            for exp_record in data["expenses"]:
                location_rows.append({
                    "Source File": exp_record.get("source_file"),
                    "Doc Type": "Expense",
                    "Property": exp_record.get("property_name"),
                    "Vendor": exp_record.get("vendor_name"),
                    "Date": exp_record.get("date"),
                    "Amount": exp_record.get("amount"),
                    "Description": exp_record.get("description")
                })
            
            if location_rows:
                df_location = pd.DataFrame(location_rows)
                df_location.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Format
                worksheet = writer.sheets[sheet_name]
                for col_num, value in enumerate(df_location.columns.values):
                    worksheet.write(0, col_num, value, header_format)
        
        # Validation Report sheet
        validation_rows = []
        for location, data in by_location.items():
            for val in data["validations"]:
                validation_rows.append({
                    "Location": location,
                    "Source File": val["source_file"],
                    "Doc Type": val["document_type"],
                    "Confidence": val["confidence_score"],
                    "Needs Review": val["needs_review"],
                    "Missing Fields": "; ".join(val["critical_missing"]),
                    "Warnings": "; ".join(val["warnings"])
                })
        
        df_validation = pd.DataFrame(validation_rows)
        df_validation.to_excel(writer, sheet_name='Validation', index=False)
        
        # Highlight needs_review rows
        worksheet = writer.sheets['Validation']
        red_format = workbook.add_format({'bg_color': '#FFC7CE'})
        yellow_format = workbook.add_format({'bg_color': '#FFEB9C'})
        
        for idx, row in enumerate(validation_rows, start=1):
            if row["needs_review"]:
                worksheet.set_row(idx, None, red_format)
            elif row["confidence"] < 0.85:
                worksheet.set_row(idx, None, yellow_format)
    
    return output_path
```

### Step 5: Generate Validation Report

```python
def generate_validation_report(all_validations, cross_validation, output_path):
    """
    Create a detailed validation report
    """
    
    report = []
    report.append("# WASTE DOCUMENT EXTRACTION - VALIDATION REPORT")
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"\n## SUMMARY\n")
    
    total_docs = len(all_validations)
    needs_review = sum(1 for v in all_validations if v["needs_review"])
    avg_confidence = sum(v["confidence_score"] for v in all_validations) / total_docs if total_docs > 0 else 0
    
    report.append(f"- **Total Documents Processed**: {total_docs}")
    report.append(f"- **Documents Needing Review**: {needs_review} ({needs_review/total_docs*100:.1f}%)")
    report.append(f"- **Average Confidence Score**: {avg_confidence:.2f}")
    
    # Critical issues
    critical_count = sum(1 for v in all_validations if v["critical_missing"])
    if critical_count > 0:
        report.append(f"\n⚠️ **{critical_count} documents have critical missing fields**\n")
    
    # Property-level validation
    report.append("\n## PROPERTY-LEVEL VALIDATION\n")
    for property_name, val_data in cross_validation.items():
        status = "✅" if not val_data["needs_review"] else "⚠️"
        report.append(f"{status} **{property_name}**")
        report.append(f"   - Documents: {val_data['document_count']}")
        report.append(f"   - Vendors: {', '.join(val_data['vendors'])}")
        if not val_data["vendor_consistent"]:
            report.append(f"   - ⚠️ Multiple vendors detected")
        if not val_data["address_consistent"]:
            report.append(f"   - ⚠️ Inconsistent addresses: {', '.join(val_data['addresses'])}")
    
    # Documents requiring review
    if needs_review > 0:
        report.append("\n## DOCUMENTS REQUIRING REVIEW\n")
        for val in all_validations:
            if val["needs_review"]:
                report.append(f"\n### {val['source_file']}")
                report.append(f"- **Confidence**: {val['confidence_score']}")
                if val["critical_missing"]:
                    report.append(f"- **Missing Fields**: {', '.join(val['critical_missing'])}")
                if val["warnings"]:
                    for warning in val["warnings"]:
                        report.append(f"- ⚠️ {warning}")
    
    # Write report
    with open(output_path, "w") as f:
        f.write("\n".join(report))
    
    return output_path
```

## Required Libraries

- **anthropic** - Claude API client for Vision extraction
- **pandas** - Data manipulation and Excel export
- **xlsxwriter** - Excel formatting and styling
- **PyPDF2** - PDF text extraction (fallback)
- **openpyxl** - Excel file reading

Install with:
```bash
pip install anthropic pandas xlsxwriter PyPDF2 openpyxl --break-system-packages
```

## Example Usage

**User prompt**: "I have a folder with 15 waste invoices and 3 contracts from different properties. Can you extract everything, organize it by location, and validate the data?"

**Claude will**:
1. Scan the folder and categorize documents by type
2. Use Vision API to extract data from each PDF, image, and scanned document
3. Extract expense data from any Excel files
4. Validate each extraction for completeness and accuracy
5. Cross-validate data across properties (check vendor/address consistency)
6. Calculate confidence scores and flag documents needing review
7. Create Excel workbook with tabs for each property location
8. Generate Summary sheet with extraction statistics
9. Create Validation sheet highlighting quality issues
10. Output detailed validation report in Markdown

**Output files**:
- `waste_extraction_by_location.xlsx` - Multi-tab Excel workbook organized by property
- `validation_report.md` - Detailed quality assessment
- `extraction_data.json` - Raw JSON data for all documents

## Tips for Best Results

- **Organize files first**: Name files with property names (e.g., `ColumbiaSquare_WM_Invoice_Oct2024.pdf`)
- **Upload in batch**: Process all documents at once for best cross-validation
- **Check validation report**: Always review documents with confidence < 0.70
- **Excel format**: For Excel expense reports, ensure clear column headers (Property, Vendor, Amount, Date)
- **Image quality**: Scanned documents should be 300 DPI or higher for best Vision API results
- **Property names**: Consistent property names across documents improve organization
- **Review yellow/red flags**: Check Validation sheet for highlighted rows
- **Use validation script**: Run secondary validation for critical workflows

## Validation Levels

**High Confidence (0.85+)**: ✅ All critical fields extracted, totals match, no warnings
**Medium Confidence (0.70-0.84)**: ⚠️ Minor missing fields or warnings, recommend review
**Low Confidence (<0.70)**: ❌ Critical missing data or major inconsistencies, requires manual review

## Location Organization

The Excel output includes:
- **Summary** tab: Overview of all locations with document counts and quality metrics
- **[Property Name]** tabs: Individual sheets for each location with all invoices, contracts, and expenses
- **Validation** tab: Quality report for all documents with color-coded flags
