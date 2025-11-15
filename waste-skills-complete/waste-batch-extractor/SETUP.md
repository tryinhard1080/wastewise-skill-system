# Waste Batch Extractor - Setup Guide

## Installation

### For Claude Code (Recommended)

```bash
# Navigate to your skills directory
cd ~/.claude/skills/

# Create the skill directory
mkdir waste-batch-extractor
cd waste-batch-extractor

# Copy the skill files
cp /path/to/downloaded/SKILL.md .
cp /path/to/downloaded/*.py .

# Install dependencies
pip install anthropic pandas xlsxwriter PyPDF2 openpyxl --break-system-packages
```

### For Claude Desktop

1. Download the `waste-batch-extractor` folder
2. Go to Settings → Capabilities → Skills
3. Click "Upload Skill" and select the folder
4. Claude Desktop will automatically install dependencies

### For Claude.ai (Browser)

1. Compress the skill folder as a ZIP file
2. Go to Project Settings → Skills
3. Click "Upload Skill" and select the ZIP
4. The skill will be available in all conversations within that project

## What's Included

- `SKILL.md` - Main skill definition with complete Python implementation
- `demo-prompt.txt` - Quick reference for usage
- `SETUP.md` - This installation guide
- `validation_script.py` - Standalone validation script for double-checking extractions
- `batch_extractor.py` - Complete batch processing script for Claude Code
- `sample_invoices/` - Sample waste invoices for testing
- `sample_contracts/` - Sample waste contracts for testing
- `sample_expenses.xlsx` - Sample Excel expense report

## Quick Start

### Using Claude Code

```bash
# Process a folder of documents
claude code "Extract all waste documents from ./invoices_folder and organize by location"

# Or run the batch script directly
python batch_extractor.py --input ./invoices_folder --output ./results
```

### Using Claude.ai or Desktop

1. Upload your waste documents (PDFs, images, Excel files)
2. Use this prompt:
   ```
   I've uploaded waste invoices and contracts. 
   Please extract all data, organize by location, 
   and create a validation report.
   ```

3. Claude will:
   - Process all documents using Vision API
   - Organize data by property location
   - Create Excel workbook with location tabs
   - Generate validation report
   - Flag documents needing review

## Dependencies

All required libraries are automatically installed:

- **anthropic** (≥0.18.0) - Claude API for Vision extraction
- **pandas** (≥2.0.0) - Data manipulation
- **xlsxwriter** (≥3.1.0) - Excel creation
- **PyPDF2** (≥3.0.0) - PDF text extraction
- **openpyxl** (≥3.1.0) - Excel file reading

## Configuration

### Setting up Anthropic API Key (for Claude Code)

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-api-key-here"

# Or add to your shell profile (~/.bashrc or ~/.zshrc)
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
```

Note: Claude Desktop and Claude.ai handle API authentication automatically.

## Sample Data

The included sample files demonstrate proper document structure:

### Sample Invoices

- `ColumbiaSquare_WM_Invoice_Sep2024.pdf` - Waste Management invoice
- `Jardine_Republic_Invoice_Sep2024.pdf` - Republic Services invoice
- `CityView_WasteConnections_Invoice_Sep2024.pdf` - Waste Connections invoice

### Sample Contracts

- `ColumbiaSquare_WM_Contract_2024.pdf` - 5-year service agreement
- `Jardine_Republic_Contract_2022.pdf` - Municipal waste contract

### Sample Excel Report

- `sample_expenses.xlsx` - Multi-property expense report with columns:
  - Property Name
  - Vendor
  - Invoice Date
  - Amount
  - Description

## Required Document Format

### For Best Extraction Results

**Invoices should include:**
- Property name and address
- Vendor name and account number
- Invoice number and date
- Line items with descriptions and amounts
- Total amount due

**Contracts should include:**
- Property name
- Vendor name
- Effective and expiration dates
- Service schedules
- Key clauses (termination, renewal, price increases)

**Excel reports should have:**
- Clear column headers
- Property name column
- Vendor name column
- Date and amount columns
- Description or line item detail

## Usage Scenarios

### Scenario 1: Monthly Invoice Processing

```
"I have 25 waste invoices from September for all our properties. 
Extract the data, organize by property, and show me which ones 
have contamination or overage charges."
```

### Scenario 2: Contract Renewal Analysis

```
"Extract all contract terms from these 10 agreements. 
I need to know which contracts are expiring in the next 6 months 
and what the notice periods are."
```

### Scenario 3: Expense Report Validation

```
"I have an Excel file with waste expenses for 50 properties. 
Can you validate that all the data is complete and identify 
any properties with missing vendor information?"
```

### Scenario 4: Multi-Vendor Comparison

```
"Extract pricing from these WM, Republic, and Waste Connections 
invoices for Columbia Square. I want to compare their monthly 
costs and service levels."
```

## Troubleshooting

### "API key not found" error

**Solution**: Set your Anthropic API key (Claude Code only):
```bash
export ANTHROPIC_API_KEY="your-key"
```

### "No documents found" error

**Solution**: Check that your documents are in supported formats:
- PDFs (.pdf)
- Images (.png, .jpg, .jpeg, .tif, .tiff)
- Excel (.xlsx, .xls)
- CSV (.csv)

### Low confidence scores

**Solution**:
- Ensure scanned documents are 300 DPI or higher
- Check that text is clearly readable
- Verify document contains all critical fields
- Run the validation script for detailed diagnosis

### Excel file won't open

**Solution**: Make sure xlsxwriter is installed:
```bash
pip install xlsxwriter --break-system-packages
```

### Vision API rate limits

**Solution**: For large batches (50+ documents), consider:
- Processing in smaller batches
- Adding delays between API calls
- Using Claude Code's built-in rate limiting

## Validation Script Usage

A standalone validation script is included for double-checking extractions:

```bash
# Validate a single extraction
python validation_script.py --input extraction_data.json

# Validate and generate detailed report
python validation_script.py --input extraction_data.json --output validation_report.md --verbose

# Validate with custom thresholds
python validation_script.py --input extraction_data.json --confidence-threshold 0.80
```

## Support and Feedback

For issues or questions about this skill:
1. Check the SKILL.md for detailed implementation examples
2. Review the sample documents for proper formatting
3. Run the validation script for diagnostic information
4. Contact Richard Bates (Advantage Waste) for Greystar-specific guidance

## Updates and Maintenance

This skill is maintained as part of the Advantage Waste platform. Updates may include:
- Support for additional vendor formats
- Enhanced validation rules
- New extraction patterns
- Improved location matching
