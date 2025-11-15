#!/usr/bin/env python3
"""
Waste Document Batch Extractor

Complete batch processing script for waste management documents.
Processes multiple invoices, contracts, and Excel files using Claude Vision API.

Usage:
    python batch_extractor.py --input ./documents --output ./results
    python batch_extractor.py --input ./documents --output ./results --validate
"""

import os
import sys
import json
import argparse
import base64
import mimetypes
from pathlib import Path
from datetime import datetime

try:
    import anthropic
    import pandas as pd
except ImportError:
    print("Error: Required libraries not installed")
    print("Run: pip install anthropic pandas xlsxwriter --break-system-packages")
    sys.exit(1)


class WasteBatchExtractor:
    """Batch process waste management documents"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key required. Set ANTHROPIC_API_KEY environment variable.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.results = []
        
    def scan_folder(self, folder_path):
        """Scan folder and categorize documents"""
        
        print(f"\n📁 Scanning folder: {folder_path}")
        
        documents = []
        supported_extensions = {
            ".pdf", ".xlsx", ".xls", ".csv",
            ".png", ".jpg", ".jpeg", ".tif", ".tiff"
        }
        
        for file_path in Path(folder_path).rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                documents.append({
                    "path": str(file_path),
                    "name": file_path.name,
                    "extension": file_path.suffix.lower()
                })
        
        print(f"✅ Found {len(documents)} documents to process\n")
        return documents
    
    def extract_document(self, file_path, document_name):
        """Extract data from a single document using Claude Vision"""
        
        print(f"📄 Processing: {document_name}")
        
        extension = Path(file_path).suffix.lower()
        
        # Handle Excel files separately
        if extension in [".xlsx", ".xls", ".csv"]:
            return self._extract_excel(file_path, document_name)
        
        # For PDFs and images, use Claude Vision
        return self._extract_with_vision(file_path, document_name)
    
    def _extract_excel(self, file_path, document_name):
        """Extract from Excel/CSV files"""
        
        try:
            if file_path.endswith(".csv"):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, sheet_name=0)
        except Exception as e:
            print(f"  ❌ Error reading Excel: {e}")
            return None
        
        # Try to identify expense data
        expense_records = []
        
        # Look for common column patterns
        columns_lower = {col: col.lower() for col in df.columns}
        
        property_col = next((col for col, lower in columns_lower.items() 
                           if "property" in lower or "location" in lower), None)
        vendor_col = next((col for col, lower in columns_lower.items() 
                         if "vendor" in lower or "supplier" in lower), None)
        amount_col = next((col for col, lower in columns_lower.items() 
                         if "amount" in lower or "total" in lower or "cost" in lower), None)
        date_col = next((col for col, lower in columns_lower.items() 
                       if "date" in lower or "period" in lower), None)
        
        for _, row in df.iterrows():
            expense_records.append({
                "source_file": document_name,
                "document_type": "expense_report",
                "property_name": str(row[property_col]) if property_col and pd.notna(row[property_col]) else None,
                "vendor_name": str(row[vendor_col]) if vendor_col and pd.notna(row[vendor_col]) else None,
                "date": str(row[date_col]) if date_col and pd.notna(row[date_col]) else None,
                "amount": str(row[amount_col]) if amount_col and pd.notna(row[amount_col]) else None,
                "description": None
            })
        
        print(f"  ✅ Extracted {len(expense_records)} expense records")
        return expense_records
    
    def _extract_with_vision(self, file_path, document_name):
        """Extract using Claude Vision API"""
        
        # Read file as base64
        try:
            with open(file_path, "rb") as f:
                file_data = base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            print(f"  ❌ Error reading file: {e}")
            return None
        
        # Determine media type
        mime_type = mimetypes.guess_type(file_path)[0] or "application/pdf"
        
        # Determine document type from filename
        name_lower = document_name.lower()
        if "invoice" in name_lower or "statement" in name_lower:
            doc_type = "invoice"
        elif "contract" in name_lower or "agreement" in name_lower:
            doc_type = "contract"
        else:
            # Let Claude determine
            doc_type = "auto"
        
        # Create extraction prompt
        schema = self._get_extraction_schema(doc_type)
        prompt = self._get_extraction_prompt(doc_type, schema)
        
        # Call Claude Vision
        try:
            message = self.client.messages.create(
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
            
            response_text = message.content[0].text
            
            # Clean markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            extracted = json.loads(response_text)
            extracted["source_file"] = document_name
            
            print(f"  ✅ Extracted successfully")
            return extracted
            
        except Exception as e:
            print(f"  ❌ Extraction error: {e}")
            return None
    
    def _get_extraction_schema(self, doc_type):
        """Get JSON schema for document type"""
        
        if doc_type == "invoice":
            return {
                "source_file": "",
                "document_type": "invoice",
                "property_name": None,
                "property_address": None,
                "vendor_name": None,
                "vendor_account_number": None,
                "billing_period": {
                    "start_date": None,
                    "end_date": None
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
        elif doc_type == "contract":
            return {
                "source_file": "",
                "document_type": "contract",
                "property_name": None,
                "vendor_name": None,
                "contract": {
                    "effective_date": None,
                    "expiration_date": None,
                    "initial_term_years": None,
                    "monthly_total": None,
                    "service_schedules": []
                }
            }
        else:
            return {
                "source_file": "",
                "document_type": None,
                "property_name": None,
                "vendor_name": None
            }
    
    def _get_extraction_prompt(self, doc_type, schema):
        """Generate extraction prompt"""
        
        base_prompt = f"""Extract all information from this waste management document into structured JSON.

Return ONLY valid JSON in this exact format:
{json.dumps(schema, indent=2)}

CRITICAL REQUIREMENTS:
- Property name is CRITICAL - extract carefully from any location in document
- Extract ALL amounts as strings without $ or commas (e.g., "1250.00")
- Extract ALL dates in YYYY-MM-DD format
- If a field cannot be found, use null
- For line_items, include date, description, category, quantity, amounts"""

        if doc_type == "invoice":
            base_prompt += """

Line item categories must be one of:
- base: Regular service
- extra_pickup: Additional pickups
- contamination: Contamination charges
- overage: Overage or excess charges
- fuel_surcharge: Fuel surcharges
- franchise_fee: City/franchise fees
- admin: Administrative fees
- env_charge: Environmental fees"""
        
        return base_prompt
    
    def organize_by_location(self, all_extractions):
        """Organize extracted data by property location"""
        
        print("\n📊 Organizing by location...")
        
        by_location = {}
        
        for record in all_extractions:
            if isinstance(record, list):
                # Excel expense records
                for expense in record:
                    prop_name = expense.get("property_name") or "Unknown Location"
                    if prop_name not in by_location:
                        by_location[prop_name] = {
                            "invoices": [],
                            "contracts": [],
                            "expenses": []
                        }
                    by_location[prop_name]["expenses"].append(expense)
            else:
                # Single document
                prop_name = record.get("property_name") or "Unknown Location"
                if prop_name not in by_location:
                    by_location[prop_name] = {
                        "invoices": [],
                        "contracts": [],
                        "expenses": []
                    }
                
                doc_type = record.get("document_type")
                if doc_type == "invoice":
                    by_location[prop_name]["invoices"].append(record)
                elif doc_type == "contract":
                    by_location[prop_name]["contracts"].append(record)
        
        print(f"✅ Organized into {len(by_location)} locations")
        return by_location
    
    def export_to_excel(self, by_location, output_path):
        """Export to multi-tab Excel workbook"""
        
        print(f"\n📝 Creating Excel workbook: {output_path}")
        
        with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # Header format
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#0F172A',
                'font_color': 'white',
                'border': 1
            })
            
            # Summary sheet
            summary_data = []
            for location, data in by_location.items():
                summary_data.append({
                    "Location": location,
                    "Invoices": len(data["invoices"]),
                    "Contracts": len(data["contracts"]),
                    "Expenses": len(data["expenses"]),
                    "Total Documents": len(data["invoices"]) + len(data["contracts"]) + len(data["expenses"])
                })
            
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            worksheet = writer.sheets['Summary']
            for col_num, value in enumerate(df_summary.columns.values):
                worksheet.write(0, col_num, value, header_format)
            
            # Location sheets
            for location, data in by_location.items():
                sheet_name = location[:28] + "..." if len(location) > 31 else location
                sheet_name = sheet_name.replace("/", "-").replace("\\", "-")
                
                location_rows = []
                
                # Add invoices
                for inv_record in data["invoices"]:
                    inv = inv_record.get("invoice", {})
                    base = {
                        "Source": inv_record.get("source_file"),
                        "Type": "Invoice",
                        "Property": inv_record.get("property_name"),
                        "Vendor": inv_record.get("vendor_name"),
                        "Account": inv_record.get("vendor_account_number"),
                        "Invoice #": inv.get("invoice_number"),
                        "Date": inv.get("invoice_date"),
                        "Amount": inv.get("amount_due")
                    }
                    
                    if inv.get("line_items"):
                        for item in inv["line_items"]:
                            row = base.copy()
                            row.update({
                                "Description": item.get("description"),
                                "Category": item.get("category"),
                                "Line Amount": item.get("extended_amount")
                            })
                            location_rows.append(row)
                    else:
                        location_rows.append(base)
                
                # Add contracts
                for con_record in data["contracts"]:
                    con = con_record.get("contract", {})
                    location_rows.append({
                        "Source": con_record.get("source_file"),
                        "Type": "Contract",
                        "Property": con_record.get("property_name"),
                        "Vendor": con_record.get("vendor_name"),
                        "Effective": con.get("effective_date"),
                        "Expires": con.get("expiration_date"),
                        "Monthly": con.get("monthly_total")
                    })
                
                # Add expenses
                for exp in data["expenses"]:
                    location_rows.append({
                        "Source": exp.get("source_file"),
                        "Type": "Expense",
                        "Property": exp.get("property_name"),
                        "Vendor": exp.get("vendor_name"),
                        "Date": exp.get("date"),
                        "Amount": exp.get("amount")
                    })
                
                if location_rows:
                    df = pd.DataFrame(location_rows)
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    
                    worksheet = writer.sheets[sheet_name]
                    for col_num, value in enumerate(df.columns.values):
                        worksheet.write(0, col_num, value, header_format)
        
        print(f"✅ Excel workbook created")


def main():
    parser = argparse.ArgumentParser(
        description="Batch extract waste management documents"
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Input folder containing documents"
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output folder for results"
    )
    parser.add_argument(
        "--validate", "-v",
        action="store_true",
        help="Run validation after extraction"
    )
    
    args = parser.parse_args()
    
    # Create output folder
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("="*60)
    print("WASTE DOCUMENT BATCH EXTRACTOR")
    print("="*60)
    
    # Initialize extractor
    try:
        extractor = WasteBatchExtractor()
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    # Scan folder
    documents = extractor.scan_folder(args.input)
    
    if not documents:
        print("❌ No documents found")
        return 1
    
    # Extract
    print("🔍 Starting extraction...\n")
    all_extractions = []
    
    for doc in documents:
        result = extractor.extract_document(doc["path"], doc["name"])
        if result:
            all_extractions.append(result)
    
    if not all_extractions:
        print("\n❌ No data extracted")
        return 1
    
    print(f"\n✅ Successfully extracted {len(all_extractions)} documents")
    
    # Flatten expense records
    flattened = []
    for result in all_extractions:
        if isinstance(result, list):
            flattened.extend(result)
        else:
            flattened.append(result)
    
    # Save JSON
    json_path = output_dir / "extraction_data.json"
    with open(json_path, "w") as f:
        json.dump({"document_records": flattened}, f, indent=2)
    print(f"✅ Saved JSON: {json_path}")
    
    # Organize by location
    by_location = extractor.organize_by_location(all_extractions)
    
    # Export to Excel
    excel_path = output_dir / "waste_extraction_by_location.xlsx"
    extractor.export_to_excel(by_location, excel_path)
    
    # Validation
    if args.validate:
        print("\n🔍 Running validation...")
        try:
            from validation_script import WasteExtractionValidator
            
            validator = WasteExtractionValidator()
            all_validations = [validator.validate_document(rec) for rec in flattened]
            cross_val = validator.cross_validate_batch(flattened)
            
            report = validator.generate_report(all_validations, cross_val)
            
            report_path = output_dir / "validation_report.md"
            with open(report_path, "w") as f:
                f.write(report)
            
            print(f"✅ Validation report: {report_path}")
            
        except Exception as e:
            print(f"⚠️  Validation error: {e}")
    
    print("\n" + "="*60)
    print("EXTRACTION COMPLETE")
    print("="*60)
    print(f"\nResults saved to: {output_dir}")
    print(f"  - extraction_data.json")
    print(f"  - waste_extraction_by_location.xlsx")
    if args.validate:
        print(f"  - validation_report.md")
    
    return 0


if __name__ == "__main__":
    exit(main())
