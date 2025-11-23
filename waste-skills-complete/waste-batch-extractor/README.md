# Waste Batch Extractor

**Version**: 1.0.0  
**Author**: Advantage Waste (Greystar)  
**Purpose**: Batch process waste management documents with Claude Vision API and location-based organization

## Overview

The Waste Batch Extractor is a comprehensive Claude Skill designed for processing multiple waste invoices, contracts, and expense reports in batch. It uses Claude's Vision API to extract structured data from PDFs, images, and scanned documents, then organizes results by property location with built-in validation.

### Key Features

✅ **Claude Vision Integration** - Processes PDFs, images, and scanned documents  
✅ **Batch Processing** - Handle dozens of documents at once  
✅ **Location-Based Organization** - Automatic grouping by property name  
✅ **Multi-Tab Excel Output** - Separate sheets for each location  
✅ **Built-in Validation** - Confidence scoring and quality reports  
✅ **Cross-Validation** - Consistency checks across properties  
✅ **Flexible Input** - Supports PDFs, images, Excel files, CSVs

## What This Skill Does

This skill is the **first step** in a waste management document processing workflow. It:

1. **Scans** folders containing waste documents
2. **Categorizes** documents by type (invoice, contract, expense report)
3. **Extracts** structured data using Claude Vision API
4. **Validates** extraction quality with confidence scoring
5. **Organizes** data by property location
6. **Exports** to multi-tab Excel workbooks with location sheets
7. **Reports** on quality issues and documents needing review

## When to Use This Skill

- You have multiple waste documents to process at once
- Documents are from different properties/locations
- You need data organized by property for reporting
- You want automated validation of extraction accuracy
- You're working with mixed document types (PDFs, scans, Excel files)
- You need to identify documents requiring manual review

## Quick Start

### 1. Install the Skill

**Claude.ai (Browser)**:

- Download and zip the `waste-batch-extractor` folder
- Go to Project Settings → Skills → Upload Skill

**Claude Code**:

```bash
cp -r waste-batch-extractor ~/.claude/skills/
pip install anthropic pandas xlsxwriter PyPDF2 openpyxl --break-system-packages
```

**Claude Desktop**:

- Settings → Capabilities → Skills → Upload Skill folder

### 2. Prepare Your Documents

Organize your waste documents in a folder:

```
my_documents/
├── ColumbiaSquare_WM_Invoice_Sep2024.pdf
├── Jardine_Republic_Invoice_Sep2024.pdf
├── CityView_Contract_2024.pdf
└── monthly_expenses.xlsx
```

### 3. Extract the Data

**Using Claude.ai or Desktop**:

```
I have 15 waste invoices and 3 contracts from different properties.
Can you extract all the data, organize by location, and validate accuracy?
```

**Using Claude Code**:

```bash
python batch_extractor.py --input ./my_documents --output ./results --validate
```

### 4. Review the Output

Check the generated files:

- `waste_extraction_by_location.xlsx` - Multi-tab Excel with Summary and property tabs
- `validation_report.md` - Quality assessment with flagged issues
- `extraction_data.json` - Raw structured data

## File Structure

```
waste-batch-extractor/
├── SKILL.md                    # Main skill definition
├── demo-prompt.txt             # Quick reference
├── SETUP.md                    # Installation guide
├── README.md                   # This file
├── validation_script.py        # Standalone validation
├── batch_extractor.py          # Complete batch processor
└── sample_data/
    ├── sample_expenses.xlsx    # Sample Excel file
    ├── sample_documents_index.csv
    └── README.md
```

## Output Structure

### Excel Workbook

**Summary Sheet**:
| Location | Invoices | Contracts | Expenses | Needs Review | Avg Confidence |
|----------|----------|-----------|----------|--------------|----------------|
| Columbia Square | 3 | 1 | 2 | 0 | 0.95 |
| Jardine | 2 | 1 | 1 | 1 | 0.82 |

**Property Tabs**:
Each property gets its own sheet with all invoices, contracts, and expenses

**Validation Sheet**:
Quality report with color-coded flags:

- 🟢 Green: High confidence (≥0.85)
- 🟡 Yellow: Medium confidence (0.70-0.84)
- 🔴 Red: Needs review (<0.70)

### JSON Output

```json
{
  "document_records": [
    {
      "source_file": "ColumbiaSquare_WM_Invoice_Sep2024.pdf",
      "document_type": "invoice",
      "property_name": "Columbia Square Living",
      "vendor_name": "Waste Management",
      "invoice": {
        "invoice_number": "INV-2024-10-001",
        "invoice_date": "2024-10-01",
        "amount_due": "3152.37",
        "line_items": [...]
      },
      "normalization": {
        "confidence": 0.98,
        "needs_review": false
      }
    }
  ]
}
```

## Validation Features

### Confidence Scoring

The skill calculates confidence scores based on:

- Completeness of critical fields
- Data consistency (totals match, dates valid)
- Cross-document validation
- Format correctness

**Scoring Levels**:

- **0.85-1.00**: ✅ High confidence, ready to use
- **0.70-0.84**: ⚠️ Medium confidence, review recommended
- **<0.70**: ❌ Low confidence, manual review required

### Validation Checks

✅ Critical field completeness  
✅ Line item totals match invoice totals  
✅ Date consistency (due date > invoice date)  
✅ Cross-property vendor consistency  
✅ Address consistency per property  
✅ Negative amount detection  
✅ Invalid category detection

### Running Standalone Validation

```bash
# Validate extraction results
python validation_script.py --input extraction_data.json

# Generate detailed report
python validation_script.py --input extraction_data.json \
    --output validation_report.md \
    --verbose

# Custom confidence threshold
python validation_script.py --input extraction_data.json \
    --confidence-threshold 0.80
```

## Schema and Data Structure

The skill uses the **same schema** as the existing `waste-contract-extractor` skill for consistency across the Advantage Waste platform.

### Invoice Schema

```python
{
    "source_file": str,
    "document_type": "invoice",
    "property_name": str,
    "property_address": str,
    "vendor_name": str,
    "vendor_account_number": str,
    "billing_period": {
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD"
    },
    "invoice": {
        "invoice_number": str,
        "invoice_date": "YYYY-MM-DD",
        "due_date": "YYYY-MM-DD",
        "amount_due": str,  # "1234.56"
        "subtotal": str,
        "line_items": [
            {
                "date": "YYYY-MM-DD",
                "description": str,
                "category": str,  # base, extra_pickup, contamination, etc.
                "quantity": int,
                "container_size_yd": int,
                "unit_rate": str,
                "extended_amount": str
            }
        ]
    }
}
```

### Contract Schema

```python
{
    "source_file": str,
    "document_type": "contract",
    "property_name": str,
    "vendor_name": str,
    "contract": {
        "effective_date": "YYYY-MM-DD",
        "expiration_date": "YYYY-MM-DD",
        "initial_term_years": int,
        "monthly_total": str,
        "service_schedules": [...]
    }
}
```

## Usage Examples

### Example 1: Monthly Invoice Processing

```
"I have 25 waste invoices from September for all our properties.
Extract the data, organize by property, and flag any with
contamination or overage charges."
```

**Output**: Excel with 25 invoices organized by property, validation report highlighting contamination charges

### Example 2: Contract Renewal Analysis

```
"Extract all contract terms from these 10 agreements.
Show me which contracts expire in the next 6 months."
```

**Output**: Contract sheet with expiration dates, sorted by date

### Example 3: Expense Report Validation

```
"Validate this Excel file with expenses for 50 properties.
Identify any properties with missing vendor information."
```

**Output**: Validation report flagging incomplete records

### Example 4: Multi-Vendor Comparison

```
"Compare pricing from these WM, Republic, and Waste Connections
invoices for the same property."
```

**Output**: Property-specific sheet with all vendors side-by-side

## Requirements

### Python Libraries

```bash
pip install anthropic pandas xlsxwriter PyPDF2 openpyxl --break-system-packages
```

### API Configuration

**Claude Code**:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

**Claude Desktop & Claude.ai**: Handled automatically

### Supported File Types

- **PDFs**: `.pdf` (digital and scanned)
- **Images**: `.png`, `.jpg`, `.jpeg`, `.tif`, `.tiff`
- **Excel**: `.xlsx`, `.xls`
- **CSV**: `.csv`

## Troubleshooting

### Common Issues

**"No documents found"**

- Check file extensions are supported
- Verify folder path is correct

**Low confidence scores**

- Ensure scanned documents are 300 DPI or higher
- Check document text is clearly readable
- Verify critical fields are present

**"API key not found"**

- Set `ANTHROPIC_API_KEY` environment variable
- Or use Claude Desktop/claude.ai (handles auth automatically)

**Excel file won't open**

- Install `xlsxwriter`: `pip install xlsxwriter --break-system-packages`

### Getting Help

1. Check the SETUP.md for detailed installation
2. Review sample data for proper formatting
3. Run validation script for diagnostic info
4. Contact Richard Bates (Advantage Waste) for support

## Integration with Advantage Waste Platform

This skill is part of the Advantage Waste document processing pipeline:

1. **Waste Batch Extractor** (this skill) - Extract and validate data
2. **Waste Data Visualizer** - Create professional reports and insights
3. **Compactor Optimization** - Analyze service patterns and optimize costs
4. **Optimize Platform** - Upload to Greystar's waste management system

## Updates and Maintenance

This skill is actively maintained by the Advantage Waste team at Greystar.

**Version History**:

- v1.0.0 (2025-01-25): Initial release with Claude Vision API integration

**Planned Features**:

- Automated detection of contamination patterns
- Cost per unit analysis
- Automatic hauler identification
- Integration with Optimize platform API

## License and Usage

This skill is proprietary to Greystar's Advantage Waste division. For licensing information or to request access, contact Richard Bates.

---

**Need Help?** Contact: Richard Bates, Director of Waste and Diversion Strategies, Greystar

**Part of**: Advantage Waste Platform | Greystar Real Estate Partners
