# Compactor Optimization Reference Guide
## Complete Calculation Framework for Multifamily Waste Management

*Version 1.0 | Advantage Waste | October 2025*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Optimization Formulas](#core-optimization-formulas)
3. [Yards Per Door Analysis](#yards-per-door-analysis)
4. [Cost Structure & Savings Calculations](#cost-structure--savings-calculations)
5. [Frequency Optimization Framework](#frequency-optimization-framework)
6. [Industry Benchmarks](#industry-benchmarks)
7. [Automated Detection Logic](#automated-detection-logic)
8. [Implementation Examples](#implementation-examples)
9. [Quick Reference Formulas](#quick-reference-formulas)

---

## Executive Summary

This reference guide provides the complete calculation framework for identifying and quantifying compactor optimization opportunities in multifamily properties. The methodology separates frequency-based savings from tonnage impacts, accounts for cascading percentage fees, and includes yards per door analysis for comprehensive service evaluation.

**Key Insights:**
- Frequency-dependent costs represent 60-70% of total waste expenses
- Cascading fees create a 1.39x multiplier effect on haul charges
- Optimizing pickup frequency yields far greater savings than reducing tonnage
- Yards per door metrics reveal over-servicing opportunities
- Target utilization: 70-85% capacity at pickup

---

## Core Optimization Formulas

### Maximum Capacity Calculation

Every compactor has a theoretical maximum capacity based on container size and compacted waste density:

```
Max_Capacity_Tons = (Container_Size_CY × 580 lbs/CY) / 2000

Examples:
• 20-yard: (20 × 580) / 2000 = 5.8 tons maximum
• 30-yard: (30 × 580) / 2000 = 8.7 tons maximum
• 40-yard: (40 × 580) / 2000 = 11.6 tons maximum
```

**Industry standard**: 580 lbs per cubic yard for compacted mixed MSW

### Capacity Utilization Formula

Utilization rate determines operational efficiency:

```
Utilization_% = (Actual_Tons_Per_Pull / Max_Capacity_Tons) × 100

Benchmark targets:
• Below 60%: Over-servicing (wasting money)
• 60-70%: Acceptable (room for optimization)
• 70-85%: Optimal range (target zone)
• Above 90%: Under-servicing (overflow risk)
```

**Optimization trigger**: Utilization below 60% indicates frequency reduction opportunity

### Tonnage to Volume Conversion

Convert invoice tonnage data to cubic yards:

```
Actual_Yards_Per_Pull = (Tons_Per_Pull × 2000) / 580

Simplified formula:
Actual_Yards_Per_Pull = Tons_Per_Pull × 3.448

Example:
6 tons × 3.448 = 20.7 cubic yards actual consumption
```

---

## Yards Per Door Analysis

Yards per door metrics separate **service capacity** (what property pays for) from **actual usage** (what residents consume).

### Available Capacity (Service Level)

Calculate total waste volume space made available to residents:

```
Weekly_Available_Capacity_CY = Container_Size_CY × Pickups_Per_Week

Annual_Available_Capacity_CY = Container_Size_CY × Annual_Pickups

Yards_Per_Door_Weekly = Weekly_Available_Capacity_CY / Number_of_Units

Yards_Per_Door_Annual = Annual_Available_Capacity_CY / Number_of_Units
```

**Example:**
```
Property: 200 units
Container: 30-yard compactor
Service: Weekly (52 pickups/year)

Available capacity:
• Weekly: 30 yards × 1 = 30 yards/week
• Annual: 30 yards × 52 = 1,560 yards/year
• Per door (weekly): 30 / 200 = 0.15 yards/door/week
• Per door (annual): 1,560 / 200 = 7.8 yards/door/year
```

**Answers**: "How much waste space is the property paying to provide?"

### Actual Usage (Consumption)

Convert tonnage to yards to calculate true consumption:

```
Actual_Yards_Per_Pull = Tons_Per_Pull × 3.448

Weekly_Actual_Yards = Actual_Yards_Per_Pull × Pickups_Per_Week

Yards_Per_Door_Actual_Weekly = Weekly_Actual_Yards / Number_of_Units

Annual_Actual_Yards = Total_Annual_Tonnage × 3.448

Yards_Per_Door_Actual_Annual = Annual_Actual_Yards / Number_of_Units
```

**Example:**
```
Average tonnage: 4.5 tons per pull
Frequency: Weekly (52 annually)
Total annual: 234 tons

Actual usage:
• Per pull: 4.5 × 3.448 = 15.5 yards
• Weekly: 15.5 yards × 1 = 15.5 yards/week
• Annual: 234 × 3.448 = 807 yards/year
• Per door (weekly): 15.5 / 200 = 0.078 yards/door/week
• Per door (annual): 807 / 200 = 4.04 yards/door/year
```

**Answers**: "How much waste space are residents actually consuming?"

### Capacity vs Usage Comparison

```
Service_Utilization_% = (Actual_Yards / Available_Yards) × 100

Excess_Capacity_Yards = Available_Yards - Actual_Yards

Excess_Capacity_% = (Excess_Capacity / Available_Yards) × 100

Service_Efficiency_Rating:
• Below 60%: "Over-serviced" (wasting capacity)
• 60-70%: "Acceptable" (room for optimization)
• 70-85%: "Optimal" (target zone)
• Above 85%: "Near capacity" (monitor for overflow)
```

**Example:**
```
Available: 30 yards/week (0.15 yards/door/week)
Actual: 15.5 yards/week (0.078 yards/door/week)

Analysis:
• Utilization: (15.5 / 30) × 100 = 51.7%
• Excess capacity: 0.15 - 0.078 = 0.072 yards/door/week unused
• Excess %: 48.3%
• Rating: "Over-serviced"
```

---

## Cost Structure & Savings Calculations

### Cascading Fee Structure

Waste invoices apply percentage-based fees sequentially:

```
STEP 1: Base charges
Base_Cost = Haul_Fee + (Tonnage × Disposal_Rate)

STEP 2: Add fuel surcharge (on base)
Fuel_Charge = Base_Cost × Fuel_%
Subtotal_1 = Base_Cost + Fuel_Charge

STEP 3: Add environmental fee (on base + fuel)
Environmental_Charge = Subtotal_1 × Environmental_%
Subtotal_2 = Subtotal_1 + Environmental_Charge

STEP 4: Add regulatory cost recovery (on all previous)
RCR_Charge = Subtotal_2 × RCR_%
Total_Per_Pull = Subtotal_2 + RCR_Charge
```

### Industry Standard Fee Percentages

```
Fuel surcharge: 5-18% (planning baseline: 12%)
Environmental fee: 13-20% (planning baseline: 18%)  
RCR (Regulatory Cost Recovery): 0-4% (planning baseline: 3.6%)
Disposal/tipping: $30-150/ton (planning baseline: $60/ton)
```

### Fee Multiplier Effect

The cascading structure creates a combined multiplier:

```
Combined_Multiplier = (1 + Fuel%) × (1 + Env%) × (1 + RCR%)

With typical rates (12% fuel, 18% env, 3.6% RCR):
Multiplier = 1.12 × 1.18 × 1.036 = 1.37

Simplified formula for haul cost savings:
Total_Haul_Savings = Haul_Fee_Reduction × 1.39
```

**Critical insight**: Every dollar saved on haul frequency yields $1.39 in total savings

### Complete Savings Calculation

```
STEP 1: Current haul costs
Current_Annual_Haul = Base_Haul_Fee × Current_Pickups × 1.39

STEP 2: Optimized haul costs  
Optimized_Annual_Haul = Base_Haul_Fee × Optimized_Pickups × 1.39

STEP 3: Haul savings
Haul_Savings = Current_Annual_Haul - Optimized_Annual_Haul

STEP 4: Tonnage impact (usually minimal/slightly negative)
Current_Tonnage_Cost = Current_Annual_Tonnage × Tipping_Fee
Optimized_Tonnage_Cost = Optimized_Annual_Tonnage × Tipping_Fee
Tonnage_Impact = Optimized_Tonnage_Cost - Current_Tonnage_Cost

STEP 5: Net savings
Net_Annual_Savings = Haul_Savings - Tonnage_Impact
```

**Note**: Total waste generated remains constant, so optimized average tons per pull increases while total tonnage stays the same.

---

## Frequency Optimization Framework

### Sanitary Constraints

**Regulatory minimum** (EPA 40 CFR Part 243):
- Food waste: Maximum 7 days between pickups
- Hot climates (>85°F): 5 days maximum recommended
- Dry waste only: 30 days maximum

**Operational best practice**:
- Never exceed 21 days between pickups for multifamily
- Hot climates: Cap at 14 days maximum
- Always prioritize sanitary requirements over cost savings

### Optimal Frequency Calculation

```
Optimal_Pickup_Days = (Container_CY × Compaction_Ratio × Fill_Target) / Daily_Generation_CY

Where:
• Container_CY: Container size in cubic yards
• Compaction_Ratio: Typically 4:1 for mixed MSW
• Fill_Target: 0.70-0.80 (70-80% target at pickup)
• Daily_Generation_CY: Uncompacted cubic yards per day

Optimal_Annual_Pickups = 365 / Optimal_Pickup_Days
```

**Example:**
```
Container: 30 yards
Compaction: 4:1
Fill target: 75%
Daily generation: 15 CY uncompacted

Optimal days = (30 × 4 × 0.75) / 15 = 6 days
Annual pickups = 365 / 6 = 60.8 ≈ 61 pickups/year
Recommendation: Every 6 days (61 pickups annually)
```

### Frequency Adjustment Formula

When current utilization is low, calculate optimal frequency:

```
Optimal_Annual_Pickups = Current_Pickups × (Current_Utilization / Target_Utilization)

Where Target_Utilization = 75%

Example:
Current: 52 pickups/year at 52% utilization
Optimal: 52 × (52 / 75) = 36 pickups/year
New schedule: Every 10 days
```

---

## Industry Benchmarks

### Waste Generation Rates

```
Standard: 4 lbs per dwelling unit per day
Conservative: 3.6 lbs/unit/day
High-occupancy: 5.3 lbs/unit/day

Volume conversion:
Weekly uncompacted: 0.5 CY per unit per week
With 4:1 compaction: 0.125 CY per unit per week compacted
```

### Yards Per Door Benchmarks

**Compacted service (properties with compactors):**
```
Conservative: 0.06 yards/door/week
Standard/Optimal: 0.09 yards/door/week
Liberal: 0.125 yards/door/week

Range: 0.06-0.125 yards/door/week
```

**Uncompacted service (traditional dumpsters):**
```
Conservative: 0.25 yards/door/week
Standard/Optimal: 0.35 yards/door/week
Liberal: 0.50 yards/door/week

Range: 0.25-0.50 yards/door/week
```

### Tonnage Per Pull Benchmarks

| Container Size | Typical Range | Optimal Target | Maximum Capacity |
|---------------|---------------|----------------|------------------|
| 2-3 yard | 0.65-0.87 tons | 0.75 tons | 0.87-1.16 tons |
| 6-8 yard | 2.0-3.5 tons | 3.0 tons | 3.5-4.6 tons |
| 20-yard | 4.0-5.8 tons | 5.0 tons | 5.8 tons |
| 30-yard | 4.0-8.0 tons | 7.0 tons | 8.7 tons |
| 40-yard | 5.0-10.0 tons | 8.5 tons | 11.6 tons |

### Compactor Sizing by Property Size

**Small properties (50-100 units):**
- Equipment: 2-3 yard apartment compactor
- Expected: 0.65-0.87 tons per pull
- Typical service: 2-3 pickups/week

**Medium properties (100-180 units):**
- Equipment: 6-yard stationary compactor
- Expected: 2.5-3.5 tons per pull
- Typical service: 1-2 pickups/week

**Large properties (180-400+ units):**
- Equipment: 30-yard self-contained compactor
- Expected: 6.5-7.5 tons per pull
- Typical service: 1 pickup/week

---

## Automated Detection Logic

### Optimization Opportunity Detection

```python
IF utilization < 60%:
    TRIGGER: "High priority frequency reduction opportunity"
    CALCULATE: Optimal frequency to achieve 75% utilization
    QUANTIFY: Annual haul savings using 1.39x multiplier
    
IF yards_per_door_available > benchmark_max:
    TRIGGER: "Over-servicing detected"
    CALCULATE: Excess capacity per door
    RECOMMEND: Frequency reduction or container downsize
    
IF yards_per_door_available < benchmark_min:
    TRIGGER: "Under-servicing detected"
    RECOMMEND: Frequency increase or container upsize
    
IF service_utilization < 60%:
    TRIGGER: "Poor efficiency - wasting capacity"
    PRIORITY: "High"
    
IF service_utilization > 90%:
    TRIGGER: "Overflow risk - near capacity"
    RECOMMEND: Increase frequency
```

### Decision Hierarchy

```
TIER 1: Sanitary constraints (override all cost considerations)
IF days_since_pickup >= max_sanitary_days:
    REQUIRE: Immediate pickup
    
TIER 2: Container capacity
IF fill_level >= 90%:
    REQUIRE: Urgent pickup within 24 hours
    
TIER 3: Cost optimization
IF utilization < 60% AND days_since_pickup < (max_days × 0.5):
    FLAG: Over-servicing opportunity
    CALCULATE: Savings from frequency reduction
    
TIER 4: Quality of life
IF odor_complaints > threshold:
    OVERRIDE: Increase frequency regardless of cost
```

---

## Implementation Examples

### Example 1: Weekly to Bi-Weekly Optimization

**Current State:**
```
Property: 200 units
Container: 30-yard compactor
Service: Weekly (52 pickups/year)
Average: 4.5 tons per pull
Base haul: $150/pickup
Disposal: $60/ton
Fees: 12% fuel, 18% env, 3.6% RCR
```

**Analysis:**
```
Max capacity: (30 × 580) / 2000 = 8.7 tons
Utilization: (4.5 / 8.7) × 100 = 51.7%
Assessment: Under-utilized - optimization opportunity

Yards per door:
Available: (30 × 52) / 200 = 7.8 yards/door/year = 0.15 yards/door/week
Actual: (4.5 × 3.448 × 52) / 200 = 4.04 yards/door/year = 0.078 yards/door/week
Excess: 48.3% unused capacity
```

**Optimization:**
```
Target: 75% utilization
Optimal pickups: 52 × (51.7 / 75) = 35.8 ≈ 36 pickups/year
New schedule: Every 10 days
Pickup reduction: 52 - 36 = 16 fewer pickups

Savings calculation:
Current haul costs: $150 × 52 × 1.39 = $10,842
Optimized haul costs: $150 × 36 × 1.39 = $7,506
Haul savings: $10,842 - $7,506 = $3,336

Tonnage impact:
Current: 234 tons × $60 = $14,040
Optimized: 234 tons × $60 = $14,040 (same total waste)
Impact: $0

Net annual savings: $3,336
Monthly savings: $278
```

**New metrics at optimized frequency:**
```
Utilization: (6.5 / 8.7) × 100 = 74.7% ✓ Optimal
Yards per door: (30 × 36) / 200 = 5.4 yards/door/year = 0.104 yards/door/week ✓ Within range
Days between: 365 / 36 = 10.1 days ✓ Sanitary compliant
```

### Example 2: Over-Servicing Detection

**Current State:**
```
Property: 150 units
Container: 30-yard compactor
Service: Twice weekly (104 pickups/year)
Average: 3.2 tons per pull
Annual cost: $48,000
```

**Analysis:**
```
Max capacity: 8.7 tons
Utilization: (3.2 / 8.7) × 100 = 36.8%
Assessment: Severely under-utilized

Yards per door:
Available: (30 × 104) / 150 = 20.8 yards/door/year = 0.40 yards/door/week
Optimal benchmark: 0.09 yards/door/week (compacted)
Excess: 344% over optimal (providing 4.4x more capacity than needed)
```

**Recommendation:**
```
CRITICAL OVER-SERVICING DETECTED

Option 1: Reduce frequency dramatically
Optimal: 104 × (36.8 / 75) = 51 pickups/year (weekly)
Savings: ~$23,000 annually

Option 2: Downsize container + reduce frequency  
Move to 20-yard with 52 pickups/year
Savings: ~$25,000 annually

Priority: HIGH - Property wasting nearly 50% of waste budget
```

---

## Quick Reference Formulas

### Core Calculations
```
Max_Capacity_Tons = (Container_CY × 580) / 2000
Utilization_% = (Actual_Tons / Max_Capacity_Tons) × 100
Tons_To_Yards = Tonnage × 3.448
```

### Yards Per Door
```
# Available capacity
Yards_Per_Door_Available = (Container_CY × Annual_Pickups) / Units

# Actual usage
Yards_Per_Door_Actual = (Annual_Tonnage × 3.448) / Units

# Utilization
Service_Utilization_% = (Actual_Yards / Available_Yards) × 100
```

### Optimization
```
Optimal_Pickups = Current_Pickups × (Current_Utilization / 75)
Haul_Savings = (Current_Pickups - Optimal_Pickups) × Haul_Fee × 1.39
```

### Benchmarks
```
Compacted optimal: 0.09 yards/door/week (range: 0.06-0.125)
Uncompacted optimal: 0.35 yards/door/week (range: 0.25-0.50)
Target utilization: 75% (range: 70-85%)
Waste generation: 4 lbs/unit/day
```

### Thresholds
```
Underutilized: < 60% → Reduce frequency
Optimal: 70-85% → Maintain schedule
Overutilized: > 90% → Increase frequency
Max days (food waste): 7 days (5 in hot climates)
```

---

## Conclusion

This framework enables systematic identification and quantification of compactor optimization opportunities through:

1. **Capacity utilization analysis** - Determining operational efficiency
2. **Yards per door metrics** - Separating service capacity from actual usage
3. **Cost structure modeling** - Accounting for cascading fees (1.39x multiplier)
4. **Savings quantification** - Complete ROI calculations with before/after comparisons
5. **Benchmark comparison** - Validating performance against industry standards

**Critical Success Factors:**
- Focus on frequency optimization (60-70% of total costs)
- Always respect sanitary constraints
- Target 70-85% utilization at pickup
- Compare yards per door against benchmarks
- Quantify savings using the 1.39x haul fee multiplier

For questions or implementation support, contact the Advantage Waste team.

---

*Advantage Waste | Greystar | Simplifying Waste Management*
