---
name: compactor-optimization
description: Analyze multifamily COMPACTOR performance (NOT open tops), calculate optimization opportunities, and quantify cost savings. Use when analyzing compacted waste service data, evaluating compactor utilization, calculating yards per door for COMPACTED service, identifying over-servicing, or determining optimal pickup frequencies. CRITICAL - This skill is for compactors only. Open top containers (non-compacted roll-offs/dumpsters) have different capacity characteristics and cannot be optimized using compactor methodology. Applies to property managers, waste analysts, or anyone reviewing compactor invoices, tonnage reports, or compactor service schedules.
---

# Compactor Optimization

## ⚠️ CRITICAL: Compactors Only - Not for Open Tops

**This skill analyzes COMPACTORS with hydraulic compression ONLY.**

**DO NOT use this skill for:**
- Open top containers (roll-offs, dumpsters)
- Non-compacted service
- 10-yard, 20-yard, 30-yard, or 40-yard containers described as "open top"

### Why the Distinction Matters

**Compactors (This Skill Applies):**
- Stationary units with hydraulic compression
- Waste density: 580 lbs/CY (compacted)
- Typical tonnage: 40-yard = 0-4 tons, 10-yard = ~1 ton
- Optimization target: 70-85% utilization
- Used for regular household waste streams

**Open Tops (This Skill Does NOT Apply):**
- Non-compacted containers (roll-offs, dumpsters)
- Much lower waste density (no compression)
- Typical tonnage: 30-yard = ~3 tons max, 20-yard = ~2 tons max
- Different optimization methodology required
- Used for bulky items, construction debris, move-outs
- **NEVER compare to compactors or use compactor formulas**

If the user's data includes open top containers, **stop and clarify** that this skill cannot optimize open tops. Provide analysis only for compacted service and note that open tops require separate evaluation.

---

Analyze waste compactor performance for multifamily properties to identify cost savings through frequency optimization, capacity utilization analysis, and yards per door benchmarking.

## When to Use This Skill

Use this skill when:
- Analyzing COMPACTED waste service data or invoices (stationary compactors only)
- Calculating COMPACTOR capacity utilization percentages
- Determining optimal pickup frequencies for COMPACTORS
- Evaluating yards per door metrics for COMPACTED service (optimal: 0.09 yd/door/week)
- Quantifying potential cost savings from COMPACTOR service optimization
- Assessing whether a property's COMPACTOR service is over-serviced or under-serviced
- Reviewing COMPACTOR performance for portfolios or individual sites
- Responding to queries about compactor-specific cost reduction opportunities

**DO NOT use this skill when:**
- Data includes open top containers (non-compacted roll-offs or dumpsters)
- Service is described as "open top", "roll-off", or non-compacted
- User mentions 10-yard, 20-yard, 30-yard containers without specifying they are compactors
- Analyzing construction debris, bulky item pickup, or move-out services
- Container tonnage seems unusually low for size (may indicate open top, not compactor)

## Quick Start

### Using the Calculator Script

For complete property analysis with automated calculations:

```bash
python scripts/compactor_calculator.py
```

Or import and use in Python:

```python
from scripts.compactor_calculator import analyze_property, format_report

# IMPORTANT: Only use for compactors, not open tops
results = analyze_property(
    units=200,
    container_size_cy=30,
    current_pickups=52,
    avg_tons_per_pull=4.5,
    base_haul_fee=150,
    disposal_rate=60,
    service_type='compacted'  # REQUIRED: Must be 'compacted' not 'open_top'
)

# Validate container type before proceeding
if results.get('container_type') == 'open_top':
    print("ERROR: This analysis is for compactors only. Open top containers")
    print("require different optimization methodology and cannot use these formulas.")
else:
    print(format_report(results))
```

### Manual Calculations

For ad-hoc analysis or when explaining methodology:

**1. Calculate maximum capacity:**
```
Max_Capacity_Tons = (Container_Size_CY × 580) / 2000
```

**2. Calculate utilization:**
```
Utilization_% = (Actual_Tons_Per_Pull / Max_Capacity_Tons) × 100
```

**3. Determine yards per door:**
```
Yards_Per_Door_Weekly = (Container_CY × Pickups_Per_Week) / Units
```

**4. Assess optimization opportunity:**
```
IF utilization < 60%:
    Optimal_Pickups = Current_Pickups × (Current_Utilization / 75)
    Haul_Savings = (Current_Pickups - Optimal_Pickups) × Haul_Fee × 1.39
```

## Core Concepts

### Key Metrics

**Capacity Utilization:**
- < 60%: Over-serviced (high priority optimization)
- 60-70%: Acceptable (room for optimization)
- 70-85%: Optimal range (target zone)
- > 90%: Under-serviced (overflow risk)

**Yards Per Door Benchmarks:**
- **COMPACTED service optimal: 0.09 yards/door/week** (range: 0.06-0.125)
  - This benchmark applies ONLY to compactors with hydraulic compression
  - Based on 580 lbs/CY compacted density
- **Non-compacted/open top service: 0.35 yards/door/week** (range: 0.25-0.50)
  - Much higher due to lack of compression
  - NOT comparable to compactor metrics
  - Different optimization methodology required

**Critical Insight:**
- Frequency-dependent costs = 60-70% of total waste expenses
- Cascading fees create 1.39x multiplier on haul charges
- Every $1 saved on haul frequency = $1.39 in total savings

## Standard Analysis Workflow

When analyzing a property:

**0. VALIDATE CONTAINER TYPE (CRITICAL FIRST STEP):**
   - Confirm service type is COMPACTED (stationary compactor with hydraulic compression)
   - If data shows "open top", "roll-off", or non-compacted service → STOP
   - If tonnage seems unusually low for container size → Ask user to clarify if open top
   - Example validation:
     - 30-yard with 2 tons average → Likely compactor ✓
     - 30-yard with 0.5 tons average → Likely open top ✗ (cannot analyze)

1. **Gather required data:**
   - Number of units
   - Container size (cubic yards) - must be COMPACTOR
   - Current annual pickups
   - Average tons per pull
   - Base haul fee per pickup
   - Disposal rate per ton

2. **Calculate core metrics:**
   - Maximum capacity
   - Current utilization %
   - Yards per door (available vs. actual)
   - Service efficiency rating

3. **Identify optimization opportunity:**
   - IF utilization < 60%: Calculate optimal frequency
   - Quantify annual savings using 1.39x multiplier
   - Verify sanitary compliance (max 7 days for food waste)

4. **Present findings:**
   - Current state analysis
   - Optimization recommendation
   - Projected savings (annual and monthly)
   - Implementation timeline

## Detailed Reference Guide

For comprehensive formulas, industry benchmarks, and implementation examples, read:

```
references/compactor_optimization_reference.md
```

This reference includes:
- Complete calculation framework
- Yards per door analysis methodology
- Cost structure and cascading fee models
- Frequency optimization frameworks
- Industry benchmarks by property size
- Automated detection logic
- Real-world implementation examples

## Sanitary Constraints (Always Enforce)

**CRITICAL - Never violate these constraints:**
- Food waste: Maximum 7 days between pickups
- Hot climates (>85°F): 5 days maximum recommended
- Multifamily properties: Never exceed 21 days
- Always prioritize sanitary requirements over cost savings

## Calculator Script Functions

Key functions available in `scripts/compactor_calculator.py`:

- `analyze_property()` - Complete property analysis with optimization recommendations
- `calculate_utilization()` - Capacity utilization percentage
- `calculate_yards_per_door()` - Available capacity per door
- `calculate_actual_usage()` - Actual consumption per door
- `calculate_optimal_frequency()` - Optimal pickup frequency for target utilization
- `calculate_savings()` - Annual savings with fee multiplier
- `assess_service_level()` - Benchmark comparison and recommendations
- `format_report()` - Formatted analysis report

## Output Format

When presenting analysis results:

1. **Lead with the recommendation:** "This property is over-serviced and can save $X/year by reducing from Y to Z pickups"

2. **Support with key metrics:**
   - Current utilization: X%
   - Yards per door: X.XX (vs. optimal 0.09)
   - Excess capacity: X%

3. **Quantify savings:**
   - Annual savings: $X,XXX
   - Monthly savings: $XXX
   - Pickup reduction: X fewer pickups/year

4. **Confirm compliance:**
   - Days between pickups: X days ✓ Sanitary compliant
   - Optimized utilization: X% ✓ Within optimal range

## Common Use Cases

**Case 1: Cost reduction analysis**
User provides waste invoice data → Calculate utilization → Identify optimization → Quantify savings

**Case 2: Portfolio review**
User provides data for multiple properties → Analyze each → Prioritize by savings potential → Create summary report

**Case 3: RFP evaluation**
User provides current service details → Calculate baseline metrics → Compare against proposed service → Recommend optimal configuration

**Case 4: Education/Training**
User asks how compactor optimization works → Explain methodology → Use reference guide examples → Demonstrate calculations

## What If I Have Open Top Data?

If your waste service data includes open top containers (non-compacted roll-offs or dumpsters), this skill **cannot** perform optimization analysis on those containers.

**Open tops require different analysis because:**
- No compression = much lower waste density
- Typical usage: bulky items, construction debris, move-outs
- Different cost structure (often charged per haul vs. scheduled service)
- Optimization focuses on haul frequency for episodic demand, not capacity utilization
- Tonnage benchmarks are much lower:
  - 30-yard open top: ~3 tons maximum
  - 20-yard open top: ~2 tons maximum  
  - 10-yard open top: ~1 ton maximum

**What to do:**
1. Separate compactor data from open top data
2. Use this skill ONLY for compactor analysis
3. For open tops, evaluate:
   - Frequency of full container hauls vs. partial hauls
   - Whether consolidating to fewer, fuller hauls is possible
   - If service could be switched to on-call vs. scheduled
4. Never compare open top costs to compactor costs
5. Consider if property could benefit from adding a compactor to reduce open top dependency

**Example clarification:**
- "I have data for a 30-yard compactor (3.5 tons/pull) and a 20-yard open top (1.8 tons/pull)"
- Response: "I can optimize the 30-yard compactor for you. The 20-yard open top needs separate evaluation since it's non-compacted service with different optimization methodology."

---

*For questions about Advantage Waste or implementation support, contact Richard Bates, Director of Waste and Diversion Strategies at Greystar.*
