# Sample Data for Testing

This folder contains sample data for testing the Waste Batch Extractor skill.

## Files Included

### sample_expenses.xlsx

Multi-property expense report with waste management costs for September 2024.

**Properties included:**

- Columbia Square Living (Waste Management)
- Jardine Apartments (Republic Services)
- CityView Towers (Waste Connections)
- Riverside Commons (GFL Environmental)

**Columns:**

- Property Name
- Vendor
- Invoice Date
- Amount
- Description

### sample_documents_index.csv

Reference file listing expected document metadata.

## Using Sample Data

### With Claude.ai or Claude Desktop

1. Upload `sample_expenses.xlsx` to a conversation
2. Ask: "Extract all expense data and organize by property"

### With Claude Code

```bash
# Extract from sample Excel file
claude code "Extract data from sample_data/sample_expenses.xlsx and organize by location"

# Or use the batch extractor script
python batch_extractor.py --input sample_data --output results --validate
```

## Expected Output

The extraction should produce:

- **4 distinct locations** (properties)
- **8 expense records** total
- **High confidence scores** (>0.90) for all records
- **Excel workbook** with Summary tab and 4 property tabs

## Adding Your Own Sample Documents

To add your own documents for testing:

1. Place PDF invoices/contracts or Excel files in this folder
2. Name files descriptively (e.g., `PropertyName_Vendor_Invoice_Date.pdf`)
3. Run the batch extractor

The skill will automatically:

- Categorize documents by type
- Extract structured data
- Organize results by property name
- Generate validation reports
