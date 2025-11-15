# Waste Management Formulas - Universal Reference
**Version 2.0 - Canonical Source of Truth**
**Last Updated: November 14, 2025**

---

## 🎯 Purpose

This document defines ALL calculations used across the waste management skills ecosystem. Every skill MUST use these exact formulas to ensure consistency.

---

## 📊 Core Metrics Calculations

### 1. Cost Per Door
```python
# CANONICAL FORMULA - Use everywhere
cost_per_door = total_monthly_cost / unit_count

# Where:
# - total_monthly_cost = Sum of all waste services for the month
# - unit_count = Total residential units in property

# Industry Benchmarks:
# Garden-Style: $18-35/month
# High-Rise: $25-45/month
# Target: <$30/month optimal
```

### 2. Yards Per Door (NON-COMPACTED Service)
```python
# CANONICAL FORMULA - Open tops / loose service ONLY
yards_per_door = (container_qty × container_size × frequency × 4.33) / unit_count

# Where:
# - container_qty = Number of containers
# - container_size = Size in cubic yards (3, 6, 8, 10, 20, 30, 40)
# - frequency = Pickups per week
# - 4.33 = Weeks per month constant
# - unit_count = Total residential units

# Industry Benchmarks:
# Target Range: 2.0-2.5 yards/unit/month
# Below 2.0: Possible underutilization
# Above 2.5: Review for optimization
```

### 3. Yards Per Door (COMPACTED Service)
```python
# CANONICAL FORMULA - Compactors ONLY
yards_per_door = (total_tons × 14.49) / unit_count

# Where:
# - total_tons = Total tons hauled in the month
# - 14.49 = Conversion factor (EPA density: 138 lbs/yd³)
#          Calculation: (2000 lbs/ton) / (138 lbs/yd³) = 14.49 yd³/ton
# - unit_count = Total residential units

# CRITICAL: Never use this formula for open tops/loose service
# CRITICAL: Never use loose formula for compactors

# Industry Benchmarks:
# Target Range: 2.0-2.5 yards/unit/month (same as loose)
# This accounts for 4:1 compaction ratio in the tons data
```

### 4. Tons Per Haul (Compactors Only)
```python
# CANONICAL FORMULA
tons_per_haul = total_tons / total_hauls

# Where:
# - total_tons = Sum of tonnage for the period
# - total_hauls = Count of compactor pickups

# Industry Benchmarks:
# Target: 8-9 tons per haul
# Below 6 tons: Consider monitoring systems
# Above 10 tons: Excellent utilization
```

### 5. Days Between Pickups
```python
# CANONICAL FORMULA
days_between = 30 / hauls_per_month

# Alternative (from haul log):
days_between = (pickup_date_n - pickup_date_n-1).days

# Industry Benchmarks:
# Ideal: 7-10 days for compactors
# Maximum: 14 days (optimization eligibility threshold)
# Below 7 days: May be over-serviced
```

### 6. Capacity Utilization
```python
# CANONICAL FORMULA - Compactors
utilization = (tons_per_haul / target_tons) × 100

# Where:
# - tons_per_haul = Actual tons hauled
# - target_tons = 8.5 tons (industry standard midpoint of 8-9)

# Industry Benchmarks:
# 90-100%: Excellent
# 70-89%: Good
# 50-69%: Fair (optimization opportunity)
# <50%: Poor (monitoring recommended)
```

---

## 🔄 Waste Generation Standards

### EPA/Industry Standard Rates

```python
# Residential Generation Rates (per unit per week)
WASTE_PER_UNIT = 0.16  # cubic yards
RECYCLING_PER_UNIT = 0.16  # cubic yards (assumes 1:1 ratio)
COMPOST_PER_UNIT = 0.012  # cubic yards (for mandatory programs)

# Commercial Generation Rates (per SF per week)
RESTAURANT_WASTE = 1.25  # lbs/SF/week
RETAIL_WASTE = 0.07  # lbs/SF/week
OFFICE_WASTE = 0.10  # lbs/SF/week

# Diversion Rates
RESTAURANT_RECYCLING = 0.40  # 40% diversion to recycling
RESTAURANT_COMPOST = 0.25  # 25% diversion to compost
RETAIL_RECYCLING = 0.30  # 30% diversion
```

### Conversion Constants

```python
# Weight to Volume Conversions
EPA_DENSITY = 138  # lbs per cubic yard (standard for mixed MSW)
TONS_TO_YARDS = 14.49  # cubic yards per ton (2000 / 138)
LBS_TO_TONS = 2000  # pounds per ton
LBS_TO_CY = 138  # pounds per cubic yard

# Compaction Ratios
COMPACTION_RATIO_STANDARD = 4.0  # 4:1 for stationary compactors
COMPACTION_RATIO_SELFCONTAINED = 3.5  # 3.5:1 for self-contained
COMPACTION_RATIO_COMMERCIAL = 5.0  # 5:1 for commercial-grade

# Time Constants
WEEKS_PER_MONTH = 4.33  # Industry standard
DAYS_PER_WEEK = 7
MONTHS_PER_YEAR = 12
```

---

## 💰 Cost Calculations

### Service Cost Calculations

```python
# Loose/Open Top Service
monthly_cost = (container_qty × pickups_per_week × 4.33 × rate_per_pickup)

# Compactor Service
monthly_cost = (hauls_per_month × rate_per_haul)

# Recycling (typically discounted)
recycling_cost = base_cost × (1 - discount_rate)
# Typical discount: 35% (0.35)

# Compost/Organics
compost_cost = toter_qty × pickups_per_week × 4.33 × rate_per_toter
# Typical rate: $97/toter/pickup
```

### Labor Cost Calculations

```python
# Labor rate
LABOR_RATE = 21.00  # $/hour (industry average for property staff)

# Time estimates (loose service)
TIME_TO_MOVE_BINS = 0.5  # hours (one-time per collection day)
TIME_PER_BIN = 0.15  # hours to rake/rotate each bin
TIME_CARDBOARD_BREAKDOWN = 0.25  # hours per pickup

# Monthly labor cost
monthly_labor = ((TIME_TO_MOVE_BINS + (bins × TIME_PER_BIN)) × 
                 pickups_per_week × 4.33 × LABOR_RATE)

# Compactor labor (minimal)
monthly_labor_compactor = (1 hour/week × 4.33 × LABOR_RATE)
# Compactors drastically reduce labor
```

---

## 🎯 Optimization Thresholds

### When to Recommend Compactor Monitoring

```python
# CANONICAL CRITERIA - All 3 must be true
recommendation_criteria = (
    average_tons_per_haul < 6.0 AND
    max_days_between_pickups <= 14 AND
    property_has_compactor == True
)

# ROI Calculation
MONITOR_INSTALL_COST = 300  # one-time
MONITOR_MONTHLY_COST = 200  # recurring

# Savings calculation
current_hauls_month = total_tons_month / avg_tons_per_haul
optimized_hauls_month = total_tons_month / 8.5  # target efficiency
monthly_savings = (current_hauls_month - optimized_hauls_month) × rate_per_haul - MONITOR_MONTHLY_COST

payback_months = MONITOR_INSTALL_COST / monthly_savings
annual_roi = ((monthly_savings × 12) / (MONITOR_INSTALL_COST + (MONITOR_MONTHLY_COST × 12))) × 100

# Recommendation strength
if payback_months <= 6:
    recommendation = "STRONGLY RECOMMEND"
elif payback_months <= 12:
    recommendation = "RECOMMEND"
elif payback_months <= 24:
    recommendation = "CONSIDER"
else:
    recommendation = "NOT RECOMMENDED"
```

### When to Recommend Contamination Reduction

```python
# CANONICAL CRITERIA
recommendation_criteria = (
    contamination_charges / total_monthly_cost > 0.03  # More than 3%
)

# Cost-benefit analysis
contamination_percentage = contamination_charges / total_monthly_cost
ALLY_WASTE_SERVICE_COST = 150  # monthly (approximate)

if contamination_percentage > 0.05:  # 5%+
    expected_reduction = 0.70  # Can reduce by 70%
    monthly_savings = contamination_charges × expected_reduction - ALLY_WASTE_SERVICE_COST
    recommendation = "STRONGLY RECOMMEND"
elif contamination_percentage > 0.03:  # 3-5%
    expected_reduction = 0.50  # Can reduce by 50%
    monthly_savings = contamination_charges × expected_reduction - ALLY_WASTE_SERVICE_COST
    if monthly_savings > 0:
        recommendation = "RECOMMEND"
```

### When to Recommend Bulk Subscription

```python
# CANONICAL CRITERIA
recommendation_criteria = (
    average_monthly_bulk_charges > 500
)

# Typical subscription cost
BULK_SUBSCRIPTION_COST = 200  # monthly (varies by provider)

monthly_savings = average_monthly_bulk_charges - BULK_SUBSCRIPTION_COST
annual_savings = monthly_savings × 12

if monthly_savings > 300:
    recommendation = "STRONGLY RECOMMEND"
elif monthly_savings > 100:
    recommendation = "RECOMMEND"
else:
    recommendation = "NOT RECOMMENDED"
```

---

## 📏 Container Specifications

### Standard Container Sizes

```python
# Open Top Containers (cubic yards)
CONTAINER_SIZES = {
    'toter_96gal': 0.5,  # 96-gallon toter = 0.5 CY
    'toter_3cy': 3,
    'toter_6cy': 6,
    'open_8cy': 8,
    'open_10cy': 10,
    'open_20cy': 20,
    'open_30cy': 30,
    'open_40cy': 40
}

# Compactor Containers
COMPACTOR_CONTAINER = 30  # Standard 30 CY roll-off
COMPACTOR_CAPACITY_COMPACTED = 30  # After 4:1 compaction
COMPACTOR_CAPACITY_LOOSE = 7.5  # Before compaction (30 / 4)

# Container rental costs (typical)
CONTAINER_RENTAL = {
    'toter_3cy': 300,
    'toter_6cy': 400,
    'open_10cy': 150,
    'open_20cy': 200,
    'compactor_30cy': 500  # monthly rental
}
```

---

## 🔢 Equipment Costs

### Capital Equipment

```python
# Compactor Equipment
COMPACTOR_STANDARD = 43796.90  # Wastequip A-Series 500
COMPACTOR_SELFCONTAINED = 52000  # Self-contained unit
WASTE_CADDY = 10093.00  # Handling equipment
PALLET_JACK = 7907.00  # For container movement

# Chute System (per floor)
CHUTE_DOOR = 1000  # Per door, installed
CHUTE_SECTION = 500  # Per 10-foot section

# Monitoring Systems
DSQ_MONITOR_INSTALL = 300  # One-time
DSQ_MONITOR_MONTHLY = 200  # Recurring

# Maintenance (annual)
COMPACTOR_MAINTENANCE = 2500  # Annual service contract
```

---

## 🎨 Validation Rules

### Data Quality Checks

```python
# Cost per door validation
if cost_per_door < 10 or cost_per_door > 100:
    flag = "REVIEW_REQUIRED - Cost per door out of reasonable range"

# Yards per door validation
if yards_per_door < 1.0 or yards_per_door > 5.0:
    flag = "REVIEW_REQUIRED - Yards per door unusual"

# Tons per haul validation (compactors)
if tons_per_haul < 2.0 or tons_per_haul > 15.0:
    flag = "REVIEW_REQUIRED - Tonnage per haul unusual"

# Frequency validation
if pickups_per_week < 1 or pickups_per_week > 7:
    flag = "REVIEW_REQUIRED - Pickup frequency unusual"

# Container size validation
if container_size not in CONTAINER_SIZES.values():
    flag = "REVIEW_REQUIRED - Non-standard container size"
```

---

## 🚨 Critical Rules

### NEVER Do These:

```python
# ❌ WRONG - Mixing compactor and loose formulas
yards_per_door = (containers × size × freq × 4.33) / units  # For COMPACTOR data

# ✅ CORRECT - Use appropriate formula
if service_type == "compactor":
    yards_per_door = (total_tons × 14.49) / units
else:
    yards_per_door = (containers × size × freq × 4.33) / units

# ❌ WRONG - Comparing compactors to open tops
if compactor_yards_per_door > open_top_yards_per_door:
    recommendation = "Switch to open tops"

# ✅ CORRECT - Never compare across service types
# Each should be evaluated on cost per door, not yards

# ❌ WRONG - Recommending monitoring without constraints
if avg_tons < 8:
    recommend_monitoring()

# ✅ CORRECT - Check all criteria
if avg_tons < 6 AND max_days_between <= 14 AND has_compactor:
    recommend_monitoring()
```

---

## 📖 Usage in Skills

### How to Reference This in Skills

Every skill should include in its SKILL.md:

```markdown
## Formula Reference

All calculations use the formulas defined in WASTE_FORMULAS_REFERENCE.md v2.0.

Critical formulas:
- Cost per door: total_cost / units
- Yards per door (loose): (qty × size × freq × 4.33) / units
- Yards per door (compacted): (tons × 14.49) / units
- Tons per haul: total_tons / hauls
- Days between: 30 / hauls_per_month

See WASTE_FORMULAS_REFERENCE.md for complete specifications.
```

### Validation Check

Every skill should verify:

```python
# Import shared constants
EPA_DENSITY = 138
TONS_TO_YARDS = 14.49
WEEKS_PER_MONTH = 4.33

# Validate formula consistency
assert TONS_TO_YARDS == 2000 / EPA_DENSITY  # Should be True
```

---

## 🔄 Version Control

**Current Version:** 2.0  
**Last Updated:** November 14, 2025  
**Next Review:** Q1 2026

**Change History:**
- v2.0 (Nov 2025): Comprehensive formula standardization
- v1.5 (Oct 2025): Added contamination criteria
- v1.0 (Sep 2025): Initial unified formulas

**When formulas change:**
1. Update this document FIRST
2. Update ALL skills to reference new version
3. Document changes in CHANGELOG
4. Test all skills for consistency

---

## 📞 Questions About Formulas?

If any formula is unclear or needs adjustment:
- Contact: Richard Bates, Advantage Waste
- All changes must be documented here
- Skills must be updated consistently

**This is the source of truth. When in doubt, refer here.**
