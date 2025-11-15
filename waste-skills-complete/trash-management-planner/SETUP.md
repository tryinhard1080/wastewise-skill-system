# Professional Trash Management Plan Generator - Setup Guide

## Installation

### For Claude.ai (Browser) ⭐ RECOMMENDED
1. Download the `trash-management-planner.zip` file
2. Go to Claude.ai → Projects
3. Create a new Project or open existing one
4. Click "Add content" → "Upload files"
5. Select the `trash-management-planner.zip` OR just the `SKILL.md` file
6. Done! The skill is now active in that project

### For Claude Desktop App
1. Download the skill folder
2. Go to Settings → Skills
3. Click "Add Skill" 
4. Select the `trash-management-planner` folder
5. The skill will appear in your skills list

### For Claude API
Use the `/v1/skills` endpoint to upload the skill package as a zip file.

---

## What's Included

```
trash-management-planner/
├── SKILL.md                    # Main skill definition (upload this!)
├── demo-prompt.txt             # Quick usage examples
├── SETUP.md                    # This file - installation guide
├── sample-property-input.txt   # Example property to test with
└── README.md                   # Overview and capabilities
```

---

## Quick Start (3 Steps)

### Step 1: Upload the Skill (2 minutes)
- Upload `SKILL.md` to your Claude Project
- Or upload the entire `.zip` file

### Step 2: Test It (2 minutes)
Copy and paste this test prompt:
```
Generate a trash management plan for:
Property: Test Towers
Address: 123 Test Street, Austin, TX 78701
Building A: 200 units, 8 stories, 16 ground floor units
Loading height: 18 feet
Goals: Cost-effective with good ROI
```

### Step 3: Review Output (5 minutes)
Claude will generate a complete 14-section report including:
- ✅ Executive summary
- ✅ Regulatory compliance (hauler research)
- ✅ Volume calculations
- ✅ Cost analysis (loose vs compacted)
- ✅ Equipment specifications
- ✅ Service schedules
- ✅ Implementation plan
- ✅ And 7 more sections!

---

## Sample Data

A sample property input is included: `sample-property-input.txt`

This contains a realistic example you can use to:
- Test the skill immediately
- See what information format works best
- Train your team on how to use it

---

## Required Information Format

To get the best results, provide:

### REQUIRED:
- **Property address** (full street address, city, state, zip)
  - This enables automatic franchise hauler research!
- **Unit count** (total residential units)
- **Number of stories** (for chute system design)

### RECOMMENDED:
- **Ground floor units** (critical for system design)
- **Loading height** (ceiling height in trash room area)
- **Project goals** (cost-effective / sustainability / balanced)

### OPTIONAL (Enhances Output):
- Multiple buildings (list each separately)
- Special requirements or constraints
- Budget considerations
- Timeline pressures

---

## Usage Examples

### Simple Input:
```
"Generate trash plan for Lincoln Towers, 
123 Main St, Dallas, TX - 300 units, 7 stories"
```

### Detailed Input:
```
"Generate a trash management plan for:
Property: Riverside Commons
Address: 456 River Road, Chicago, IL 60614
Building A: 180 units, 7 stories, 8 ground floor units
Building B: 150 units, 6 stories, 6 ground floor units
Loading height: 19 feet
Goals: Long-term ROI, sustainability focus
```

### Multiple Properties:
```
"Generate trash plans for three properties:

1. Sunset Place, 789 Elm Ave, Austin, TX 78701
   - Building A: 250 units, 8 stories
   - Building B: 180 units, 6 stories

2. Harbor View, 321 Bay St, San Diego, CA 92101
   - 200 units, 10 stories, no ground floor units
   
3. Metro Square, 654 Downtown Blvd, Denver, CO 80202
   - 150 units, 5 stories, 20 ground floor units"
```

---

## What the Skill Produces

### 14 Complete Sections:
1. **Executive Summary** - Key findings, costs, ROI
2. **Regulatory Compliance** - Franchise hauler (auto-researched!), state/local laws
3. **Design Issues & Recommendations** - Building-specific solutions
4. **Volume Projections** - Waste/recycling/compost calculations with tables
5. **System Design** - Chutes, compactors, collection methods
6. **Equipment Specifications** - Technical details, costs, ADA compliance
7. **Service Schedules** - Weekly pickup plans by day
8. **Cost Analysis** - Detailed comparison: loose vs compacted service
9. **Bin Staging & Service Locations** - Access requirements
10. **Trash Room Requirements** - Infrastructure needs
11. **Resident Education** - Communication plans
12. **Rate Tables** - Complete hauler pricing, equipment costs
13. **Implementation Plan** - 4-phase rollout with timeline
14. **Key Contacts** - Haulers, suppliers, report branding

### Professional Features:
- ✅ Web research for franchise haulers
- ✅ State/local regulation research  
- ✅ Industry-standard calculations
- ✅ ROI and payback analysis
- ✅ ADA compliance guidance
- ✅ Equipment specifications with costs
- ✅ Formatted for stakeholder presentations

---

## Tips for Best Results

### 1. Always Include Full Address
- Enables Claude to research the local franchise hauler
- Identifies state and local regulations
- Provides context for regional requirements

### 2. Specify Ground Floor Units
- Critical for system design
- Affects equipment selection
- Impacts cost significantly

### 3. Note Ceiling/Loading Height
- Determines if indoor compactor is possible
- Affects equipment selection
- Important for ADA compliance

### 4. State Your Priorities Clearly
- "Cost-effective" → Emphasizes ROI and payback
- "Sustainability" → Focuses on recycling/composting
- "Balanced" → Mix of both considerations

### 5. Review and Customize
- The generated report is comprehensive but generic
- Add your branding and specific details
- Adjust recommendations based on local knowledge

---

## Integration with Your Workflow

### For Development Projects:
1. Gather property details during design phase
2. Run through trash-management-planner skill
3. Include report in development package
4. Share with architects, contractors, and operators

### For Advantage Waste:
1. Use for Development/Construction Initiative
2. Generate reports for Greystar properties
3. Support regional director requests
4. Create professional deliverables quickly

### For Consulting Services:
1. Generate reports for multiple clients
2. Customize with your branding
3. Include in service packages
4. Demonstrate technical expertise

---

## Training Your Team

### Who Can Use This:
- Anyone who can describe a property
- No technical waste management background needed
- No special software required
- Just access to Claude.ai

### Training Time:
- 15 minutes to understand
- 30 minutes hands-on practice  
- Ready to use independently

### What They Need to Know:
1. How to describe a property (address, units, stories)
2. How to paste prompt to Claude
3. How to review generated output
4. Where to customize for specific needs

---

## Troubleshooting

### "Claude didn't use the skill"
- Make sure `SKILL.md` is uploaded to the Project
- Use trigger keywords: "trash management plan", "waste plan", "generate trash plan"
- Reference the skill by name: "Use the trash-management-planner skill"

### "Output is incomplete"
- Check that you provided full address (required for research)
- Ensure unit count and stories are included
- Try asking Claude to "complete all 14 sections"

### "Hauler research failed"
- May happen for very small towns
- Manually provide hauler name if known
- Claude will still complete the rest of the report

### "Need to modify calculations"
- The skill uses industry-standard formulas
- You can adjust in the final report
- Or tell Claude: "Regenerate using [X] formula"

---

## Customization Options

You can modify the skill to:
- Add your company branding
- Include specific vendor partnerships
- Update equipment costs for your region
- Add regional regulatory requirements
- Customize report sections
- Change calculation assumptions

To modify: Edit the `SKILL.md` file and re-upload

---

## Support

### Questions?
Just ask Claude:
- "How do I use the trash-management-planner skill?"
- "Show me an example output"
- "Can you explain section [X] of the report?"

### Need Changes?
Tell Claude:
- "Modify the skill to include [X]"
- "Regenerate with [different assumption]"
- "Add a section about [Y]"

---

## Success Metrics

Track your ROI:
- **Time savings:** 2-3 days → 30 minutes (80-90% reduction)
- **Consistency:** 100% complete reports every time
- **Scalability:** Unlimited properties
- **Quality:** Professional stakeholder-ready output

---

## Next Steps

### Today:
- [x] Install the skill
- [ ] Test with sample property
- [ ] Review output quality

### This Week:
- [ ] Generate 2-3 real project reports
- [ ] Compare to manual process
- [ ] Train team member
- [ ] Integrate into workflow

### This Month:
- [ ] Use for all new developments
- [ ] Present to leadership
- [ ] Build case study library
- [ ] Measure time/cost savings

---

## Ready to Go!

You're all set to start generating professional trash management plans!

**Upload `SKILL.md` to Claude → Describe a property → Get comprehensive report in minutes!**

Welcome to automated waste management analysis! 🎉
