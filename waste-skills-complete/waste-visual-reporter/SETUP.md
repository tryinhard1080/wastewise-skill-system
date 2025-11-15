# Waste Visual Reporter - Setup Guide

## Installation

**For Claude.ai (Browser)**
1. Download the skill folder as a zip file
2. Go to Settings → Capabilities  
3. Click "Upload Skill" and select the zip file

**For Claude Code**
```bash
# Copy to personal skills directory
cp -r waste-visual-reporter ~/.claude/skills/

# Or add to project
cp -r waste-visual-reporter .claude/skills/
```

**For Claude API**
- Use the `/v1/skills` endpoint to upload the skill package

## What's Included

- `SKILL.md` - Main skill definition with complete Python implementation
- `sample_waste_data.json` - Example property data for testing
- `demo-prompt.txt` - Quick reference for how to use

## Quick Start

1. Install the skill using one of the methods above
2. Test with the sample data: `sample_waste_data.json`
3. Use this prompt: "Create a visual report using the sample waste data"

## Sample Data

The included `sample_waste_data.json` contains realistic multifamily property waste data including:
- Property information (name, address, units, type)
- Current metrics (costs, service frequency, volumes)
- Industry benchmarks for comparison
- Cost breakdown by category
- Optimization recommendations

Use this to test the skill, or structure your own data in the same format.

## Data Format Requirements

Your data should be structured as JSON with these key sections:

### Property Info
```json
{
  "property_info": {
    "name": "Property Name",
    "address": "Street Address",
    "city": "City, ST ZIP",
    "units": 300,
    "property_type": "Garden-Style | Mid-Rise | High-Rise"
  }
}
```

### Metrics (Current Performance)
```json
{
  "metrics": {
    "monthly_cost": 8500,
    "cost_per_door": 28.33,
    "yards_per_door": 2.2,
    "service_frequency": "5x Weekly",
    "containers": "5 x 3 cu yd"
  }
}
```

### Benchmarks (Target Ranges)
```json
{
  "benchmarks": {
    "cost_per_door": {"target": 8.00, "max": 12.00},
    "yards_per_door": {"target": 1.5, "max": 2.0},
    "fuel_fees_pct": {"target": 5, "max": 10}
  }
}
```

### Cost Breakdown
```json
{
  "cost_breakdown": {
    "base_service": 4500,
    "fuel_environmental": 2000,
    "overage_charges": 500,
    "recycling": 300,
    "contamination": 200
  }
}
```

### Recommendations (Optional but Recommended)
```json
{
  "recommendations": [
    {
      "title": "Optimization Title",
      "description": "Detailed description of the recommendation",
      "savings_monthly": "1200-1500"
    }
  ]
}
```

## Integration with WasteWise Analysis

This skill is designed to work seamlessly with WasteWise Complete Analysis outputs:

1. Run WasteWise Analysis on property invoices/contracts
2. Extract key metrics from the Excel workbook (Summary tab)
3. Structure the data in the format above
4. Generate visual report using this skill

## Customization

### Branding
To customize colors and branding, modify the CSS in SKILL.md:
- Header gradient: Lines 30-31 (currently Greystar blue)
- Section colors: Lines 46-50 (light blue info section)
- KPI cards: Lines 68-95 (white cards with status borders)

### Benchmarks
Adjust benchmark ranges in your data based on:
- **Property Type**: Garden-Style vs Mid-Rise vs High-Rise
- **Region**: Texas, California, Northeast (different cost structures)
- **Market Conditions**: Urban vs suburban pricing

### Report Sections
The skill automatically includes:
- Property information header
- Key performance indicator cards
- Cost breakdown visualization  
- Optimization recommendations
- Critical analysis (if provided)
- Advantage Waste footer

## Troubleshooting

**Issue**: Colors don't match brand guidelines
- Solution: Update CSS hex codes in the header section (lines 30-31)

**Issue**: Benchmarks seem wrong
- Solution: Verify property type and regional cost standards

**Issue**: Missing cost categories
- Solution: Ensure all cost_breakdown keys are present (set to 0 if not applicable)

## Output Format

Reports are generated as single-page HTML files that are:
- ✓ Print-friendly (optimized for 8.5x11" paper)
- ✓ Mobile-responsive (readable on phones/tablets)
- ✓ Email-ready (can be sent as attachment or embedded)
- ✓ Presentation-ready (can be screenshot or embedded in PowerPoint)

## Advanced Usage

### Batch Processing
Generate multiple reports from a list of properties:

```python
properties = [property1_data, property2_data, property3_data]

for prop_data in properties:
    create_visual_report(prop_data)
```

### Custom Filenames
Specify output filename:

```python
create_visual_report(data, output_filename="columbia_square_report.html")
```

### PDF Export
To create PDF versions:
1. Open HTML file in browser
2. Print to PDF (Ctrl+P or Cmd+P)
3. Select "Save as PDF"

Or use automation:
```bash
# Using wkhtmltopdf (if installed)
wkhtmltopdf report.html report.pdf

# Using headless Chrome
chrome --headless --print-to-pdf=report.pdf report.html
```

## Support

For questions or customization requests:
- Contact: Richard Bates, Director of Waste and Diversion Strategies
- Organization: Advantage Waste / Greystar Real Estate Partners
