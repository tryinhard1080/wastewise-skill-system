# Professional Trash Management Plan Generator

A comprehensive Claude Skill that generates professional-grade trash management plans for multifamily development projects, matching American Trash Management industry standards.

---

## Overview

This skill automates the creation of detailed, stakeholder-ready trash management plans that include regulatory research, volume calculations, cost analysis, equipment specifications, and implementation plans.

### What It Generates

**Complete 14-section professional reports** including:
- Executive summary with ROI analysis
- Regulatory compliance (with automatic hauler research)
- Volume projections and calculations  
- Cost comparison: loose vs compacted service
- Equipment specifications with pricing
- Service schedules and implementation plans
- Professional formatting for presentations

### Time Savings

- **Manual process:** 2-3 days
- **With this skill:** 30 minutes
- **Savings:** 80-90% time reduction

---

## Key Features

### 🔍 Automatic Research
- Uses `web_search` to find franchise haulers automatically
- Researches state and local waste regulations
- Identifies compliance requirements
- No manual lookup needed

### 📊 Comprehensive Calculations
- Waste, recycling, and compost volume projections
- Loose vs compacted service cost comparison
- Staff labor cost analysis
- Equipment capital cost calculations
- ROI and payback period analysis
- Cost per unit per month metrics

### 🏗️ Professional System Design
- Chute system specifications (NFPA 82 compliant)
- Compactor sizing and selection
- Ground floor unit solutions
- Cardboard management strategies
- Odor control recommendations
- ADA compliance guidance

### 💰 Financial Analysis
- Detailed cost breakdowns
- Monthly and annual projections
- Capital equipment costs (amortized)
- Staff labor calculations
- Clear payback period analysis
- Recommendation logic based on ROI

### 📋 Stakeholder-Ready Output
- Professional formatting
- Clear section organization
- Tables and comparisons
- Implementation timeline
- Rate tables and contacts
- Ready for presentation

---

## Who Should Use This

### Property Developers
- New construction planning
- Development cost estimation
- Contractor bidding packages
- Regulatory approval documentation

### Waste Management Consultants
- Client project analysis
- Professional deliverables
- Technical expertise demonstration
- Scalable service delivery

### Multifamily Operators
- Portfolio property analysis
- Cost optimization studies
- Equipment upgrade decisions
- Regulatory compliance planning

### Advantage Waste Team (Greystar)
- Development/Construction Initiative support
- Regional property assessments
- Professional client reports
- Technical capability demonstration

---

## How It Works

### Input (Simple)
Just describe the property:
```
"Generate a trash management plan for Lincoln Towers at 
456 Oak St, Dallas, TX - 300 units, 7 stories, 
12 ground floor units, 18ft loading height"
```

### Processing (Automatic)
Claude will:
1. ✅ Use `web_search` to find Dallas franchise hauler
2. ✅ Research Texas waste regulations
3. ✅ Calculate volumes for 300 units
4. ✅ Design chute and compactor system
5. ✅ Compare loose vs compacted costs
6. ✅ Calculate payback period
7. ✅ Generate complete 14-section report

### Output (Professional)
15-20 page comprehensive report with:
- All calculations shown with formulas
- Equipment specifications with costs
- Service schedules by day
- Cost analysis with recommendations
- Implementation plan with timeline
- Ready for stakeholder presentation

---

## Technical Capabilities

### Calculations
- **Volume projections:** Industry-standard 0.16 CY/unit/week baseline
- **Recycling:** 30% of waste stream
- **Composting:** 25% of waste stream (where mandated)
- **Compaction ratio:** 4:1 for mechanical compaction
- **Container sizing:** Automatic based on pickup frequency

### Equipment Knowledge
- **Compactors:** Wastequip A-Series 500 specifications
- **Chutes:** NFPA 82 compliant, ADA requirements
- **Containers:** 3-6 CY toters, 8-30 CY open-tops
- **Costs:** Current market pricing ranges
- **Maintenance:** Annual service contract estimates

### Regulatory Compliance
- **State laws:** AB341, AB1826, AB1383 (California) and equivalents
- **Local ordinances:** City-specific requirements
- **Franchise areas:** Exclusive hauler territories
- **Permits:** Required documentation
- **ADA compliance:** Equipment accessibility standards

### Cost Analysis
- **Hauler fees:** Realistic rate ranges by service type
- **Staff labor:** Time estimates and hourly costs
- **Capital equipment:** One-time costs amortized over lifespan
- **Maintenance:** Annual service contracts
- **ROI calculations:** Payback period with recommendation thresholds

---

## Report Structure (14 Sections)

1. **Executive Summary**
   - Property overview
   - Key findings
   - Cost summary
   - Primary recommendations

2. **Regulatory Compliance**
   - Franchise hauler (researched)
   - State requirements
   - Local ordinances
   - Compliance notes

3. **Design Issues & Recommendations**
   - Building-specific challenges
   - Ground floor unit solutions
   - Loading area assessment
   - Access considerations

4. **Volume Projections**
   - Weekly generation calculations
   - Loose vs compacted comparison
   - Container requirements
   - Service frequency needs

5. **System Design**
   - Chute specifications
   - Compactor selection
   - Collection methods
   - Ground floor alternatives
   - Cardboard management
   - Odor control approach

6. **Equipment Specifications**
   - A-Series 500 compactor details
   - Chute door specifications
   - Container inventory
   - ADA compliance features
   - Cost breakdowns

7. **Service Schedules**
   - Day-by-day pickup plans
   - Weekly service totals
   - Container rotation
   - Flexible scheduling options

8. **Cost Analysis**
   - Loose service breakdown
   - Compacted service breakdown
   - Side-by-side comparison
   - ROI and payback analysis
   - Recommendation

9. **Bin Staging & Service Locations**
   - Compactor access requirements
   - Container staging areas
   - Truck turning radius
   - Surface requirements

10. **Trash Room Requirements**
    - Size and layout
    - Electrical and mechanical
    - Ventilation and drainage
    - Fire protection
    - Odor control systems

11. **Resident Education & Communication**
    - Move-in materials
    - Signage requirements
    - Ongoing communication
    - Staff training

12. **Rate Tables**
    - Hauler pricing schedule
    - Equipment capital costs
    - Maintenance costs
    - Surcharges and fees

13. **Implementation Plan**
    - Phase 1: Design & approval
    - Phase 2: Installation
    - Phase 3: Service initiation
    - Phase 4: Optimization
    - Critical path items

14. **Key Contacts & Report Info**
    - Franchise hauler contact
    - Equipment suppliers
    - Regulatory contacts
    - Report branding

---

## Best Practices

### For Best Results, Include:
- ✅ **Full property address** (street, city, state, zip)
  - Enables hauler and regulatory research
- ✅ **Total unit count** (all residential units)
- ✅ **Number of stories** (per building)
- ✅ **Ground floor units** (if any - critical!)
- ✅ **Loading/ceiling height** (determines equipment options)
- ✅ **Project goals** (cost/sustainability/balanced)

### Optional Enhancements:
- Multiple building details (list separately)
- Site constraints (access, turning, aesthetic)
- Special requirements (LEED, HOA rules)
- Budget considerations
- Timeline pressures

### After Generation:
- Review all 14 sections for completeness
- Verify web research results (hauler, regulations)
- Customize recommendations for local knowledge
- Add your branding and contact information
- Adjust costs for regional variations
- Format for your presentation needs

---

## Integration Examples

### Advantage Waste Development Initiative
```
Use Case: Development/Construction planning for new Greystar properties
Process: 
1. Receive new development details from regional team
2. Run through trash-management-planner skill
3. Generate professional report
4. Include in development package
5. Share with architects and contractors
6. Use for SLT presentations

Benefit: Professional technical capability, faster turnaround, consistent quality
```

### Waste Management Consulting
```
Use Case: Generate reports for multiple client properties
Process:
1. Gather property details from client
2. Generate comprehensive plan
3. Add your branding and customization
4. Include in consulting deliverable
5. Use for proposal differentiation

Benefit: Scalable service delivery, technical depth, professional quality
```

### Property Development
```
Use Case: Development project waste planning
Process:
1. Input property specs during design phase
2. Generate multiple scenarios (loose vs compacted)
3. Include in financial pro forma
4. Share with construction team
5. Use for regulatory approval

Benefit: Accurate cost estimation, regulatory compliance, stakeholder confidence
```

---

## Technical Requirements

### To Use This Skill:
- Access to Claude.ai (browser, desktop, or API)
- Ability to upload files to Claude Projects
- Internet connection (for web research features)

### Skill Requirements:
- Uses `web_search` tool (for hauler and regulatory research)
- Generates text output (no file creation needed)
- Processes natural language input
- No special software or platforms required

---

## Limitations & Considerations

### What This Skill Does:
✅ Generate comprehensive professional plans
✅ Research franchise haulers automatically
✅ Calculate volumes using industry standards
✅ Compare loose vs compacted costs
✅ Recommend equipment and systems
✅ Provide implementation guidance

### What This Skill Doesn't Do:
❌ Replace site visits or physical assessments
❌ Guarantee specific hauler pricing
❌ Make final design decisions
❌ Handle unique local regulations automatically
❌ Replace professional engineering review

### Best Used As:
- Starting point for professional analysis
- Template for stakeholder reports
- Tool for rapid cost estimation
- Resource for technical specifications
- Framework for implementation planning

**Always review and customize for your specific situation!**

---

## Success Metrics

Track your ROI from using this skill:

### Efficiency Gains:
- **Time per report:** 30 min vs 2-3 days (90% reduction)
- **Reports per day:** 10+ vs 1 (10× increase)
- **Team training:** 30 min vs 2 days
- **Consistency:** 100% complete every time

### Quality Improvements:
- All 14 sections included automatically
- No missed calculations
- Professional formatting every time
- Research-backed recommendations
- Stakeholder-ready output

### Business Impact:
- Faster proposal turnaround
- More comprehensive analysis
- Reduced labor costs
- Increased capacity
- Professional differentiation

---

## Support & Customization

### Questions?
- Review `SETUP.md` for installation help
- Check `demo-prompt.txt` for usage examples
- Try `sample-property-input.txt` for test cases

### Need Modifications?
The skill can be customized to:
- Add your company branding
- Include specific vendor partnerships
- Update regional cost assumptions
- Add custom calculation methods
- Modify report sections
- Include additional requirements

To modify: Edit `SKILL.md` and re-upload to your Claude Project

---

## Credits

**Created for:** Advantage Waste by THE Trash Hub  
**Purpose:** Supporting multifamily development waste management planning  
**Standard:** Matches American Trash Management professional format  
**Version:** 1.0

---

## Get Started

1. **Read:** `SETUP.md` for installation
2. **Try:** `sample-property-input.txt` for test
3. **Use:** `demo-prompt.txt` for quick reference
4. **Generate:** Your first professional trash management plan!

**Ready to transform waste management analysis? Upload the skill and start generating professional reports today!** 🚀
