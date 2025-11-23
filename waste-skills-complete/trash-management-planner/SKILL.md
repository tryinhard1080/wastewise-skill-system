---
name: trash-management-planner
description: Generate comprehensive professional trash management plans for multifamily development projects (5+ units). Use when user mentions trash management plans, waste system design, compactor analysis, development projects, cost analysis for waste service, equipment recommendations, regulatory compliance, or needs professional reports for developers, contractors, or property managers. Creates 14-section reports matching American Trash Management industry standards with research, calculations, and actionable recommendations.
---

# Professional Trash Management Plan Generator

## When to Use This Skill

Trigger this skill when the user:

- Requests a trash management plan for a property
- Mentions development projects needing waste system design
- Asks about compacted vs loose waste service comparison
- Needs cost analysis for waste management systems
- Wants equipment recommendations (compactors, chutes, bins)
- Asks about regulatory compliance for waste
- Needs professional reports for stakeholders
- Keywords: "trash plan", "waste management", "compactor ROI", "development waste"

## What This Skill Does

Generates comprehensive 14-section professional trash management plans that include:

1. Executive summary with ROI and recommendations
2. Regulatory compliance research (franchise haulers, state/local laws)
3. Volume calculations for waste, recycling, and compost
4. Cost analysis comparing loose vs compacted service
5. Equipment specifications and recommendations
6. Service schedules and implementation plans
7. Professional formatting for stakeholder presentations

## Input Requirements

**REQUIRED:**

- Property address (full address enables hauler research)
- Unit count
- Number of stories

**OPTIONAL (improves output):**

- Ground floor unit count
- Loading area ceiling height
- Multiple buildings (if applicable)
- Project priorities (cost-effective/sustainability/balanced)

## Execution Steps

### Step 1: Extract Property Information

Parse the user's input to identify:

- Property name
- Full address (street, city, state, zip)
- Unit count per building
- Stories per building
- Ground floor units
- Ceiling/loading height
- Project goals

If critical information is missing (address, units, stories), ask the user before proceeding.

### Step 2: Research Regulatory Environment

**Use web_search to find:**

**Franchise Hauler:**

```
Query: "commercial waste hauler [city, state] franchise"
Extract: Hauler name, contact info, service area
```

**State Regulations:**

```
Query: "[state] waste recycling composting mandates multifamily"
Extract: AB341, AB1826, AB1383 equivalents, recycling requirements
```

**Local Ordinances:**

```
Query: "[city] waste ordinance requirements multifamily"
Extract: Local rules, permit requirements, special restrictions
```

### Step 3: Calculate Waste Volumes

Use these industry-standard formulas:

**Waste Generation:**

- Base rate: 0.16 cubic yards per unit per week
- Formula: Units × 0.16 CY/unit/week = Weekly CY

**Recycling:**

- 30% of total waste stream
- Formula: Weekly Waste CY × 0.30 = Weekly Recycling CY

**Compost (if mandated):**

- 25% of total waste stream
- Formula: Weekly Waste CY × 0.25 = Weekly Compost CY

**Container Requirements:**

```python
# Loose Service
waste_containers = ceil(weekly_waste_cy / (6 CY per pickup × pickups_per_week))
recycling_containers = ceil(weekly_recycling_cy / (6 CY per pickup × pickups_per_week))

# Compacted Service (4:1 ratio)
compacted_cy_per_haul = 30 CY  # Standard compactor capacity
compacted_hauls_per_week = ceil(weekly_waste_cy / compacted_cy_per_haul)
```

### Step 4: Design System Recommendations

**For Buildings WITH Upper Floors:**

**Chute System:**

- Size: 24" diameter minimum (26" preferred)
- Material: 14-gauge aluminized steel Type 2
- Height: From top floor to compactor/collection room
- Safety: NFPA 82 compliant, self-closing doors
- ADA: Compliant discharge chutes 48" max reach height

**Trash Compactor:**

- Model: Wastequip A-Series 500 (standard for multifamily)
- Capacity: 30 CY compacted (4:1 ratio)
- Power: 5 HP, 208-230V, 3-phase
- Dimensions: 8'W × 10'L × 12'H (varies by model)
- Features: Remote start, safety interlocks, auto-cycle
- ADA: Compliant operation if self-contained

**For Ground Floor Units:**

- Design issue: Cannot use vertical chutes
- Solution: Dedicated trash closets OR outdoor enclosures
- Containers: 2-3 CY toters or carts for each ground floor cluster
- Access: Separate service location from compactor

**Cardboard Management:**

- High volume: Dedicated 10-20 CY open-top container
- Pickups: 1-2× per week minimum
- Location: Near mail/package rooms
- Signage: Clear resident instructions

**Recycling System:**

- Single-stream preferred (easier compliance)
- Containers: 3-6 CY toters or 8-10 CY open-tops
- Location: Adjacent to waste compactor
- Signage: Accepted items list with photos

**Compost (if required):**

- Collection: 96-gallon toters with locking lids
- Location: Near waste/recycling, away from residential areas
- Pickup: 2-3× per week minimum (odor control)
- Liners: Compostable bags required

### Step 5: Equipment Specifications

**A-Series 500 Trash Compactor:**

```
Model: Wastequip A500 or equivalent
Capacity: 30 cubic yards compacted
Compaction Ratio: 4:1
Power Requirements: 5 HP, 208-230V, 3-phase
Dimensions: 8'W × 10'L × 12'H (approximate)
Hopper Opening: 60"W × 48"H
Container: 30 CY roll-off
Safety Features: Light curtain, emergency stop, auto-shutoff
Estimated Cost: $35,000-$45,000 installed
```

**Chute Doors (per floor):**

```
Type: Gravity self-closing, ADA-compliant
Size: 18"W × 18"H minimum
Material: 14-gauge galvanized steel
Cost: $800-$1,200 per door installed
Total Doors: (Floors - 1) × Buildings (exclude ground floor)
```

**Toters and Containers:**

```
Ground Floor Waste: 3 CY toters @ $300 each
Recycling: 6 CY toters @ $400 each
Compost: 96-gal toters @ $150 each
Cardboard: 20 CY open-top @ $200 each
```

### Step 6: Calculate Service Costs

**Loose Service (No Compactor):**

```python
# Weekly waste pickups (6 CY per container)
loose_containers_needed = ceil(weekly_waste_cy / 6)
loose_pickups_per_week = 3  # Typical for multifamily

# Monthly costs
hauler_rate_per_pickup = 45  # Typical range $35-$55
monthly_waste_pickups = loose_pickups_per_week × 4.33 weeks
monthly_hauler_cost = monthly_waste_pickups × hauler_rate_per_pickup

# Staff labor
minutes_per_service = 15  # Moving containers to curb
labor_cost_per_hour = 18
monthly_labor = (minutes_per_service × monthly_waste_pickups / 60) × labor_cost_per_hour

total_loose_monthly = monthly_hauler_cost + monthly_labor
cost_per_unit_loose = total_loose_monthly / total_units
```

**Compacted Service:**

```python
# Compactor hauls (30 CY per haul at 4:1 ratio)
weekly_compacted_hauls = ceil(weekly_waste_cy / 30)
monthly_compacted_hauls = weekly_compacted_hauls × 4.33

# Monthly costs
hauler_rate_per_haul = 450  # Range $400-$550 for 30 CY
monthly_hauler_cost_compacted = monthly_compacted_hauls × hauler_rate_per_haul

# Staff labor (minimal - just tossing bags down chute)
minutes_per_week = 60  # Compactor maintenance
monthly_labor_compacted = (minutes_per_week × 4.33 / 60) × labor_cost_per_hour

total_compacted_monthly = monthly_hauler_cost_compacted + monthly_labor_compacted
cost_per_unit_compacted = total_compacted_monthly / total_units
```

**ROI Analysis:**

```python
monthly_savings = total_loose_monthly - total_compacted_monthly
annual_savings = monthly_savings × 12
compactor_capital_cost = 40000  # Average installed
payback_months = compactor_capital_cost / monthly_savings

# Recommendation logic:
if payback_months <= 24:
    recommendation = "STRONGLY RECOMMEND compacted service"
elif payback_months <= 36:
    recommendation = "RECOMMEND compacted service"
else:
    recommendation = "Consider loose service initially"
```

### Step 7: Create Service Schedule

Generate weekly pickup schedule:

**Compacted Service Example:**

```
Monday: Waste compactor (1 haul)
Tuesday: Recycling (1 pickup)
Wednesday: Compost (1 pickup)
Thursday: Waste compactor (1 haul) [if needed]
Friday: Cardboard (1 pickup)
Saturday: Compost (1 pickup)

Weekly Total:
- Waste: 2-3 hauls
- Recycling: 1-2 pickups
- Compost: 2-3 pickups
- Cardboard: 1 pickup
```

**Loose Service Example:**

```
Monday/Wednesday/Friday: Waste containers (3× per week)
Tuesday/Saturday: Recycling (2× per week)
Wednesday/Saturday: Compost (2× per week)
Friday: Cardboard (1× per week)
```

### Step 8: Generate Professional Report

Create comprehensive report with these sections:

## SECTION 1: EXECUTIVE SUMMARY

**Property Overview:**

- Name, address, total units
- Building configuration

**Key Findings:**

- Current waste generation: [X] CY/week
- Recommended system: [Compacted/Loose]
- Estimated cost per unit: $[X]/month
- ROI if compactor: [X] months payback

**Primary Recommendations:**

1. [Main recommendation with rationale]
2. [Secondary recommendation]
3. [Regulatory compliance notes]

---

## SECTION 2: REGULATORY COMPLIANCE

**Franchise Hauler:**

- Name: [Hauler from web_search]
- Phone: [Contact info]
- Service Area: [Exclusive franchise area]
- Notes: [Any special requirements]

**State Requirements:**

- [State] mandates: [List specific laws like AB341]
- Recycling: [Required? Threshold?]
- Composting: [Required? Threshold?]
- Penalties: [Non-compliance consequences]

**Local Ordinances:**

- [City] requirements: [Specific local rules]
- Permits: [Required permits]
- Restrictions: [Any special restrictions]

---

## SECTION 3: DESIGN ISSUES & RECOMMENDATIONS

**Building A ([X] units, [Y] stories):**

_Issue 1: Ground Floor Units_

- Problem: [X] ground floor units cannot use vertical chutes
- Impact: Requires alternative collection method
- Solution: Dedicated trash closets with 3 CY toters OR outdoor enclosure
- Cost: $[X] for containers + $[Y] installation

_Issue 2: Loading Area_

- Ceiling Height: [X] feet
- Truck Clearance Needed: 14-16 feet minimum
- Assessment: [Adequate/Inadequate]
- Solution: [If inadequate, recommend outdoor compactor pad]

_Issue 3: [Other issues based on property specifics]_

---

## SECTION 4: VOLUME PROJECTIONS

**Weekly Waste Generation:**

| Stream    | Loose (CY/week) | Compacted (CY/week) | Ratio |
| --------- | --------------- | ------------------- | ----- |
| Waste     | [X]             | [X/4]               | 4:1   |
| Recycling | [X]             | [X]                 | 1:1   |
| Compost   | [X]             | [X]                 | 1:1   |
| **Total** | **[X]**         | **[X]**             | -     |

**Container Requirements:**

_Loose Service:_

- Waste: [X] × 6 CY containers
- Recycling: [X] × 6 CY containers
- Compost: [X] × 96-gal toters
- Cardboard: [X] × 20 CY open-top

_Compacted Service:_

- Waste: 1 × 30 CY compactor
- Recycling: [X] × 6 CY containers
- Compost: [X] × 96-gal toters
- Cardboard: 1 × 20 CY open-top

---

## SECTION 5: SYSTEM DESIGN

**Waste Chute System:**

- Chute Diameter: 24-26 inches
- Material: 14-gauge aluminized steel Type 2
- Height: [X] stories = [Y] linear feet
- Discharge: Into compactor hopper or staging area
- Chute Doors: (Floors - 1) = [X] doors per building
- Code Compliance: NFPA 82, ADA requirements

**Compactor Specifications:**

- Model: Wastequip A-Series 500 or equivalent
- Capacity: 30 CY compacted (120 CY uncompacted)
- Compaction Ratio: 4:1
- Power: 5 HP, 208-230V, 3-phase
- Installation: Indoor trash room OR outdoor pad
- Container: 30 CY roll-off provided by hauler

**Ground Floor Unit Solution:**

- Method: Dedicated trash closets (preferred) or outdoor enclosures
- Containers: [X] × 3 CY toters for waste
- Location: Distributed across ground floor for resident convenience
- Collection: Hauler picks up on same schedule
- Recycling: Shared with main system

**Cardboard Management:**

- Challenge: High volume from move-ins/deliveries
- Solution: Dedicated 20 CY open-top container
- Location: Near mail room and package lockers
- Frequency: 1-2× per week minimum
- Signage: "CARDBOARD ONLY - Break down boxes"

**Odor Control (4-Prong Approach):**

1. **Compactor Ventilation:** Direct exhaust to exterior
2. **Air Freshening:** Piian Mini Vaporizer or D&S system in trash rooms
3. **Door Seals:** Positive pressure trash rooms, sealed doors
4. **Frequent Service:** Haul compactor 2-3× per week minimum

---

## SECTION 6: EQUIPMENT SPECIFICATIONS

**A-Series 500 Trash Compactor:**

```
Manufacturer: Wastequip or approved equivalent
Model: A500
Capacity: 30 cubic yards compacted
Uncompacted Capacity: 120 cubic yards (4:1 ratio)
Compaction Force: 50,000+ lbs
Power: 5 HP motor, 208-230V, 3-phase, 60Hz
Dimensions: 8'W × 10'L × 12'H (approximate)
Hopper Opening: 60"W × 48"H
Container Type: 30 CY roll-off
Cycle Time: 45-60 seconds
Safety Features:
- Light curtain safety system
- Emergency stop button
- Automatic shutoff
- Interlock on container
Controls: Remote start station in trash room
Estimated Cost: $35,000 - $45,000 installed
Lifespan: 15-20 years with proper maintenance
```

**Chute Doors (ADA Compliant):**

```
Type: Gravity self-closing discharge door
Size: 18"W × 18"H minimum (24" preferred)
Material: 14-gauge galvanized or stainless steel
Mounting: Wall or chute-mounted
Operation: Spring-loaded, automatic closure
ADA Requirements:
- Handle height: 48" maximum from floor
- Operating force: 5 lbs maximum
- Clear floor space: 30" × 48" approach
Lock: Keyed lock for maintenance access
Cost: $800 - $1,200 per door installed
Quantity Needed: [X] doors ([Buildings] × [Floors-1])
Total Door Cost: $[X]
```

**Toters and Containers:**

```
Ground Floor Waste Toters:
- Size: 3 CY (cubic yard)
- Quantity: [X] units
- Cost: $300 each = $[X] total

Recycling Containers:
- Size: 6 CY single-stream
- Quantity: [X] units
- Cost: $400 each = $[X] total

Compost Toters (if required):
- Size: 96 gallons with locking lids
- Quantity: [X] units
- Cost: $150 each = $[X] total

Cardboard Container:
- Size: 20 CY open-top
- Quantity: 1-2 units
- Cost: $200 each = $[X] total
```

---

## SECTION 7: SERVICE SCHEDULES

**Recommended Weekly Schedule:**

**Monday:**

- Waste Compactor: 1 haul (30 CY)
- Ground Floor Toters: Collection

**Tuesday:**

- Recycling: 1 pickup (all containers)

**Wednesday:**

- Waste Compactor: 1 haul (if volume requires)
- Compost: 1 pickup

**Thursday:**

- (Flex day - additional haul if needed)

**Friday:**

- Cardboard: 1 pickup (20 CY container)
- Compost: 1 pickup

**Saturday:**

- Recycling: 1 pickup (if volume requires)

**Weekly Service Totals:**

- Waste compactor hauls: 2-3× per week
- Recycling pickups: 1-2× per week
- Compost pickups: 2× per week
- Cardboard pickups: 1× per week
- Ground floor collection: 3× per week

---

## SECTION 8: COST ANALYSIS

**Option 1: Loose Service (No Compactor)**

_Monthly Hauler Fees:_

- Waste containers: [X] pickups/month × $45 = $[X]
- Recycling: [X] pickups/month × $30 = $[X]
- Compost: [X] pickups/month × $25 = $[X]
- Cardboard: [X] pickups/month × $40 = $[X]
- **Subtotal Hauler:** $[X]/month

_Monthly Staff Labor:_

- Moving containers: [X] minutes/week × 4.33 weeks = [X] hrs/month
- Rate: $18/hour
- **Subtotal Labor:** $[X]/month

_Equipment Costs:_

- Container purchase: $[X] one-time
- Amortized over 5 years: $[X]/month

**Total Loose Service:** $[X]/month
**Cost Per Unit:** $[X]/unit/month

---

**Option 2: Compacted Service**

_Monthly Hauler Fees:_

- Waste compactor: [X] hauls/month × $450 = $[X]
- Recycling: [X] pickups/month × $30 = $[X]
- Compost: [X] pickups/month × $25 = $[X]
- Cardboard: [X] pickups/month × $40 = $[X]
- Ground floor: [X] pickups/month × $35 = $[X]
- **Subtotal Hauler:** $[X]/month

_Monthly Staff Labor:_

- Compactor maintenance: 4 hours/month
- Rate: $18/hour
- **Subtotal Labor:** $72/month

_Capital Equipment:_

- Compactor cost: $40,000
- Chute doors: $[X]
- Toters/containers: $[X]
- **Total Capital:** $[X]
- Amortized over 84 months (7 years): $[X]/month

**Total Compacted Service:** $[X]/month
**Cost Per Unit:** $[X]/unit/month

---

**Comparison Summary:**

| Category              | Loose Service | Compacted Service | Difference |
| --------------------- | ------------- | ----------------- | ---------- |
| Hauler Fees           | $[X]          | $[X]              | $[X]       |
| Staff Labor           | $[X]          | $72               | $[X]       |
| Equipment (amortized) | $[X]          | $[X]              | $[X]       |
| **Total Monthly**     | **$[X]**      | **$[X]**          | **$[X]**   |
| **Cost Per Unit**     | **$[X]**      | **$[X]**          | **$[X]**   |

**ROI Analysis:**

- Monthly savings with compactor: $[X]
- Annual savings: $[X] × 12 = $[X]
- Capital investment: $[X]
- **Payback period: [X] months**

**Recommendation:**
[Based on payback period:

- ≤24 months: STRONGLY RECOMMEND compacted
- 25-36 months: RECOMMEND compacted
- > 36 months: Consider loose initially, reassess at 2 years]

---

## SECTION 9: BIN STAGING & SERVICE LOCATIONS

**Compactor Service Location:**

- Location: [Indoor trash room / Outdoor pad]
- Access: [Alley / Rear loading / Side access]
- Clearance Required: 14-16 feet vertical, 50 feet straight approach
- Turning Radius: 45 feet minimum for roll-off truck
- Surface: Level concrete pad if outdoor

**Ground Floor Container Staging:**

- Locations: Distributed across [X] areas
- Distance to units: 150 feet maximum
- Collection: Containers rolled to curb/compactor for pickup
- Storage: Return to designated areas after service

**Recycling Container Location:**

- Position: Adjacent to compactor/waste area
- Distance from waste: 10-30 feet (visible, convenient)
- Access: Same truck access as waste

**Cardboard Container Location:**

- Position: Near mail room and package lockers
- Resident access: High visibility, easy to use
- Truck access: Same as main service area

**Access Requirements for ALL Locations:**

- Gate width: 12 feet minimum
- Overhead clearance: 16 feet minimum
- Turning radius: 45 feet minimum
- Surface: Paved, level, all-weather access

---

## SECTION 10: TRASH ROOM REQUIREMENTS

**Main Trash Room (Compactor Location):**

- Size: 12' × 15' minimum (180 sq ft)
- Ceiling Height: 10-12 feet minimum
- Ventilation: Direct exhaust to exterior, negative pressure
- Electrical: 208-230V, 3-phase, 60-amp service
- Lighting: 30 foot-candles minimum
- Drainage: Floor drain with trap, hose bib
- Walls/Ceiling: Washable surfaces (FRP or epoxy paint)
- Door: 6' wide × 8' high minimum (roll-off container access)
- Fire Protection: Sprinkler head required

**Floor Chute Discharge Doors (Each Floor):**

- Size: 18" × 18" minimum
- Height: 48" maximum to top (ADA)
- Material: 14-gauge steel, self-closing
- Lock: Keyed access for maintenance
- Signage: "TRASH CHUTE - WASTE ONLY"
- Floor Space: 30" × 48" clear approach

**Recycling Area:**

- Location: Adjacent to main trash room
- Size: 100-150 sq ft
- Access: Double doors or same access as trash room
- Signage: Large format "RECYCLING" with accepted items
- Containers: 3-6 CY toters or open-tops

**Odor Control Systems:**

1. Piian Mini Vaporizer or D&S neutralizing system
2. Placement: In compactor room and on each floor chute door
3. Cost: $200-$400 per unit
4. Maintenance: Replace cartridges monthly

---

## SECTION 11: RESIDENT EDUCATION & COMMUNICATION

**Move-In Materials:**

- Trash/Recycling Guide (1-page handout)
- Chute locations and hours
- What goes where (waste/recycling/compost)
- Prohibited items (hazmat, electronics, large items)
- Bulk trash pickup procedure

**Signage (Multiple Locations):**

- Chute doors: "Accepted items" with photos
- Trash rooms: "Flatten cardboard boxes"
- Recycling area: "Single-stream accepted items"
- Compost: "Compostable materials only"
- Design: Simple graphics, multiple languages

**Ongoing Communication:**

- Monthly newsletter reminders
- Contamination alerts (if issues arise)
- Schedule changes notification
- Bulk item pickup coordination

**Staff Training:**

- Compactor operation and safety
- Emergency procedures
- Odor control maintenance
- Resident assistance protocol

---

## SECTION 12: RATE TABLES

**Hauler Rate Schedule - [Hauler Name]:**

_Waste Service:_

- 6 CY container pickup: $35-$55 per pickup
- 30 CY compactor haul: $400-$550 per haul
- Extra pickup surcharge: $10-$20 per occurrence

_Recycling Service:_

- 6 CY container pickup: $25-$35 per pickup
- Extra contamination fee: $75-$150 per occurrence

_Compost Service (if available):_

- 96-gallon toter pickup: $20-$30 per pickup
- Extra contamination fee: $50-$100 per occurrence

_Other Services:_

- Cardboard container (20 CY): $35-$50 per pickup
- Bulk item pickup: $75-$150 per occurrence
- Special haul (furniture, etc.): $100-$200 per pickup

**Equipment Costs (One-Time Capital):**

- A-Series 500 Compactor: $35,000-$45,000 installed
- Chute doors (each): $800-$1,200 installed
- 3 CY toter: $300 each
- 6 CY container: $400 each
- 96-gallon toter: $150 each
- 20 CY open-top: $200 each

**Maintenance Costs (Annual):**

- Compactor service contract: $1,200-$2,000/year
- Odor control supplies: $600-$1,200/year
- Chute cleaning: $500-$1,000/year

---

## SECTION 13: IMPLEMENTATION PLAN

**Phase 1: Design & Approval (Weeks 1-4)**

- Finalize system design
- Obtain hauler quotes
- Get architectural drawings approved
- Order long-lead equipment (compactor)
- Secure permits

**Phase 2: Installation (Weeks 5-10)**

- Install compactor and electrical
- Install chute system and doors
- Set up containers and toters
- Test all equipment
- Install signage

**Phase 3: Service Initiation (Week 11)**

- Execute hauler service agreement
- Train property staff
- Distribute resident materials
- Begin regular service schedule
- Monitor and adjust

**Phase 4: Optimization (Weeks 12-16)**

- Track volumes and costs
- Adjust pickup frequency if needed
- Address any issues
- Survey resident satisfaction
- Document performance

**Critical Path Items:**

- Compactor: 8-12 weeks lead time (order early!)
- Electrical: 2-4 weeks (coordinate with electrician)
- Permits: 2-6 weeks (start immediately)

---

## SECTION 14: KEY CONTACTS & REPORT INFO

**Franchise Hauler:**

- Company: [From web_search]
- Phone: [Contact]
- Email: [If available]
- Account Rep: [If known]

**Equipment Supplier:**

- Compactor: Wastequip / [Local distributor]
- Phone: [Find via web_search if needed]

**Regulatory Contacts:**

- State Waste Agency: [From research]
- Local Permit Office: [City department]

**Report Information:**

- Prepared by: WasteWise by THE Trash Hub
- Date: [Current date]
- Property: [Property name]
- Address: [Full address]

---

## FORMATTING NOTES

- Use clear headers and section numbers
- Include tables for cost comparisons
- Bold key recommendations
- Use bullet points for lists
- Include page breaks between major sections
- Professional tone throughout

---

## Quality Checks Before Delivery

✅ All 14 sections complete
✅ Web research completed (hauler, regulations)
✅ All calculations shown with formulas
✅ Cost analysis includes both options
✅ ROI clearly stated
✅ Equipment specs detailed
✅ Service schedule provided
✅ Implementation plan included
✅ Professional formatting
✅ No grammar/spelling errors

---

# Example Usage

**User Input:**
"Generate a trash management plan for Riverside Towers, 789 River Road, Chicago, IL 60614. Building A has 180 units across 7 stories with 8 ground floor units. Building B has 150 units across 6 stories with 6 ground floor units. Loading height is 19 feet. We need a cost-effective solution with good ROI."

**Claude Will:**

1. Use web_search to find Chicago's franchise hauler
2. Research Illinois waste laws (no AB laws, but local requirements)
3. Calculate volumes for 330 total units
4. Design 2-building system with 2 compactors
5. Spec equipment for both buildings
6. Calculate costs comparing loose vs compacted
7. Show payback period for compactors
8. Provide complete 14-section report
9. Format professionally for stakeholder presentation

**Output:** Comprehensive 15-20 page professional trash management plan ready for developers, contractors, and property management review.
