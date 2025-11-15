#!/usr/bin/env python3
"""
Compactor Optimization Calculator
Analyzes COMPACTOR waste service data to identify optimization opportunities and calculate savings.

CRITICAL: This script is for COMPACTORS ONLY, not open top containers.
Open tops have different waste density and optimization methodology.
"""

def validate_container_type(container_size_cy, avg_tons_per_pull, service_type):
    """
    Validate that data represents a compactor, not an open top.
    
    Open tops have much lower tonnage for their size:
    - 30-yard open top: ~3 tons max
    - 20-yard open top: ~2 tons max
    - 10-yard open top: ~1 ton max
    
    Compactors have higher tonnage due to compression:
    - 40-yard compactor: 0-4 tons typical
    - 30-yard compactor: 0-3 tons typical
    - 10-yard compactor: ~1 ton typical
    
    Returns:
        dict with validation results
    """
    warnings = []
    is_valid = True
    
    # Check if service_type explicitly says open top
    if service_type and 'open' in service_type.lower():
        is_valid = False
        warnings.append("Service type explicitly marked as 'open_top' or non-compacted.")
        warnings.append("This calculator is for compactors only.")
        return {
            'is_valid': False,
            'warnings': warnings,
            'recommendation': "Separate open top data from compactor data. Use different analysis methodology for open tops."
        }
    
    # Check for suspiciously low tonnage that might indicate open top
    expected_ranges = {
        10: (0.3, 1.5),
        20: (0.5, 2.5),
        30: (1.0, 3.5),
        40: (1.5, 4.5)
    }
    
    # Find closest container size
    closest_size = min(expected_ranges.keys(), key=lambda x: abs(x - container_size_cy))
    min_expected, max_expected = expected_ranges[closest_size]
    
    if avg_tons_per_pull < min_expected * 0.6:
        warnings.append(f"WARNING: Average tonnage ({avg_tons_per_pull} tons) is unusually low for a {container_size_cy}-yard container.")
        warnings.append(f"Expected range for compactor: {min_expected}-{max_expected} tons")
        warnings.append("This data may represent an open top (non-compacted) container, not a compactor.")
        warnings.append("Open tops cannot be optimized using compactor methodology.")
        is_valid = False
    
    return {
        'is_valid': is_valid,
        'warnings': warnings,
        'recommendation': "Verify this is a stationary compactor with hydraulic compression, not an open top/roll-off container." if warnings else "Container type validated as compactor."
    }


def calculate_max_capacity(container_size_cy):
    """Calculate maximum capacity in tons for a given container size."""
    return (container_size_cy * 580) / 2000


def calculate_utilization(actual_tons, max_capacity_tons):
    """Calculate capacity utilization percentage."""
    return (actual_tons / max_capacity_tons) * 100


def tons_to_yards(tonnage):
    """Convert tonnage to cubic yards."""
    return tonnage * 3.448


def calculate_yards_per_door(container_size_cy, annual_pickups, units):
    """Calculate yards per door metrics."""
    annual_available = container_size_cy * annual_pickups
    yards_per_door_annual = annual_available / units
    yards_per_door_weekly = yards_per_door_annual / 52
    return {
        'annual_available': annual_available,
        'yards_per_door_annual': yards_per_door_annual,
        'yards_per_door_weekly': yards_per_door_weekly
    }


def calculate_actual_usage(annual_tonnage, units):
    """Calculate actual usage in yards per door."""
    annual_yards = tons_to_yards(annual_tonnage)
    yards_per_door_annual = annual_yards / units
    yards_per_door_weekly = yards_per_door_annual / 52
    return {
        'annual_yards': annual_yards,
        'yards_per_door_annual': yards_per_door_annual,
        'yards_per_door_weekly': yards_per_door_weekly
    }


def calculate_optimal_frequency(current_pickups, current_utilization, target_utilization=75):
    """Calculate optimal pickup frequency to achieve target utilization."""
    return current_pickups * (current_utilization / target_utilization)


def calculate_savings(current_pickups, optimized_pickups, base_haul_fee, multiplier=1.39):
    """Calculate annual haul savings with fee multiplier."""
    current_haul_cost = base_haul_fee * current_pickups * multiplier
    optimized_haul_cost = base_haul_fee * optimized_pickups * multiplier
    return current_haul_cost - optimized_haul_cost


def assess_service_level(yards_per_door_weekly, service_type='compacted'):
    """
    Assess service level against benchmarks.
    
    Args:
        yards_per_door_weekly: Yards per door per week
        service_type: 'compacted' or 'uncompacted'
    
    Returns:
        dict with assessment results
    """
    if service_type == 'compacted':
        optimal = 0.09
        min_benchmark = 0.06
        max_benchmark = 0.125
    else:  # uncompacted
        optimal = 0.35
        min_benchmark = 0.25
        max_benchmark = 0.50
    
    if yards_per_door_weekly < min_benchmark:
        status = "Under-serviced"
        recommendation = "Increase frequency or container size"
    elif yards_per_door_weekly <= max_benchmark:
        status = "Within acceptable range"
        if yards_per_door_weekly <= optimal:
            recommendation = "Optimal - maintain current service"
        else:
            recommendation = "Slight over-service - consider minor frequency reduction"
    else:
        status = "Over-serviced"
        recommendation = "Reduce frequency or downsize container"
    
    return {
        'status': status,
        'recommendation': recommendation,
        'optimal_benchmark': optimal,
        'min_benchmark': min_benchmark,
        'max_benchmark': max_benchmark
    }


def analyze_property(units, container_size_cy, current_pickups, avg_tons_per_pull, 
                    base_haul_fee, disposal_rate, service_type='compacted'):
    """
    Complete property analysis with optimization recommendations.
    
    CRITICAL: This function is for COMPACTORS ONLY, not open top containers.
    
    Args:
        units: Number of dwelling units
        container_size_cy: Container size in cubic yards
        current_pickups: Current annual pickups
        avg_tons_per_pull: Average tons per pickup
        base_haul_fee: Base haul fee per pickup
        disposal_rate: Disposal rate per ton
        service_type: 'compacted' (default) or 'uncompacted' (for validation purposes)
    
    Returns:
        dict with complete analysis or error if open top detected
    """
    # STEP 0: VALIDATE CONTAINER TYPE (CRITICAL)
    validation = validate_container_type(container_size_cy, avg_tons_per_pull, service_type)
    
    if not validation['is_valid']:
        return {
            'error': 'INVALID_CONTAINER_TYPE',
            'message': 'This analysis is for compactors only. Data appears to be for open top container.',
            'validation': validation,
            'property_info': {
                'units': units,
                'container_size_cy': container_size_cy,
                'current_pickups': current_pickups,
                'avg_tons_per_pull': avg_tons_per_pull
            }
        }
    
    # Core calculations
    max_capacity = calculate_max_capacity(container_size_cy)
    utilization = calculate_utilization(avg_tons_per_pull, max_capacity)
    annual_tonnage = avg_tons_per_pull * current_pickups
    
    # Yards per door
    available = calculate_yards_per_door(container_size_cy, current_pickups, units)
    actual = calculate_actual_usage(annual_tonnage, units)
    
    service_utilization = (actual['annual_yards'] / available['annual_available']) * 100
    excess_capacity_pct = 100 - service_utilization
    
    # Service assessment
    service_assessment = assess_service_level(available['yards_per_door_weekly'], service_type)
    
    # Optimization
    optimal_pickups = None
    annual_savings = None
    monthly_savings = None
    optimized_utilization = None
    
    if utilization < 60:
        optimal_pickups = round(calculate_optimal_frequency(current_pickups, utilization))
        annual_savings = calculate_savings(current_pickups, optimal_pickups, base_haul_fee)
        monthly_savings = annual_savings / 12
        optimized_avg_tons = annual_tonnage / optimal_pickups
        optimized_utilization = calculate_utilization(optimized_avg_tons, max_capacity)
        days_between_pickups = 365 / optimal_pickups
    
    # Compile results
    results = {
        'property_info': {
            'units': units,
            'container_size_cy': container_size_cy,
            'current_pickups': current_pickups,
            'avg_tons_per_pull': avg_tons_per_pull
        },
        'capacity_analysis': {
            'max_capacity_tons': round(max_capacity, 2),
            'utilization_pct': round(utilization, 1),
            'utilization_status': 'Under-utilized' if utilization < 60 else 
                                 'Optimal' if 70 <= utilization <= 85 else
                                 'Acceptable' if 60 <= utilization < 70 else
                                 'Over-utilized'
        },
        'yards_per_door': {
            'available_weekly': round(available['yards_per_door_weekly'], 3),
            'actual_weekly': round(actual['yards_per_door_weekly'], 3),
            'available_annual': round(available['yards_per_door_annual'], 2),
            'actual_annual': round(actual['yards_per_door_annual'], 2),
            'service_utilization_pct': round(service_utilization, 1),
            'excess_capacity_pct': round(excess_capacity_pct, 1)
        },
        'service_assessment': service_assessment,
        'current_costs': {
            'annual_haul_cost': round(base_haul_fee * current_pickups * 1.39, 2),
            'annual_disposal_cost': round(annual_tonnage * disposal_rate, 2),
            'total_annual_cost': round((base_haul_fee * current_pickups * 1.39) + 
                                      (annual_tonnage * disposal_rate), 2)
        }
    }
    
    # Add optimization if applicable
    if optimal_pickups:
        results['optimization'] = {
            'recommended_pickups': optimal_pickups,
            'pickup_reduction': current_pickups - optimal_pickups,
            'days_between_pickups': round(days_between_pickups, 1),
            'optimized_utilization_pct': round(optimized_utilization, 1),
            'annual_savings': round(annual_savings, 2),
            'monthly_savings': round(monthly_savings, 2),
            'priority': 'HIGH' if utilization < 50 else 'MEDIUM'
        }
    
    return results


def format_report(results):
    """Format analysis results as a readable report."""
    report = []
    
    # Check if this is an error result (open top detected)
    if 'error' in results:
        report.append("=" * 60)
        report.append("⚠️  CONTAINER TYPE VALIDATION ERROR")
        report.append("=" * 60)
        report.append("")
        report.append(f"ERROR: {results['message']}")
        report.append("")
        report.append("PROPERTY INFORMATION:")
        info = results['property_info']
        report.append(f"  Units: {info['units']}")
        report.append(f"  Container Size: {info['container_size_cy']} yards")
        report.append(f"  Current Pickups: {info['current_pickups']}/year")
        report.append(f"  Average Tonnage: {info['avg_tons_per_pull']} tons/pull")
        report.append("")
        report.append("VALIDATION WARNINGS:")
        for warning in results['validation']['warnings']:
            report.append(f"  • {warning}")
        report.append("")
        report.append("RECOMMENDATION:")
        report.append(f"  {results['validation']['recommendation']}")
        report.append("")
        report.append("=" * 60)
        report.append("This calculator is for COMPACTORS ONLY.")
        report.append("Open top containers require different analysis methodology.")
        report.append("=" * 60)
        return "\n".join(report)
    
    # Normal report for valid compactor data
    report.append("=" * 60)
    report.append("COMPACTOR OPTIMIZATION ANALYSIS REPORT")
    report.append("=" * 60)
    report.append("")
    
    # Property info
    report.append("PROPERTY INFORMATION")
    report.append("-" * 60)
    info = results['property_info']
    report.append(f"Units: {info['units']}")
    report.append(f"Container Size: {info['container_size_cy']} yards")
    report.append(f"Current Pickups: {info['current_pickups']}/year")
    report.append(f"Average Tonnage: {info['avg_tons_per_pull']} tons/pull")
    report.append("")
    
    # Capacity analysis
    report.append("CAPACITY ANALYSIS")
    report.append("-" * 60)
    capacity = results['capacity_analysis']
    report.append(f"Maximum Capacity: {capacity['max_capacity_tons']} tons")
    report.append(f"Current Utilization: {capacity['utilization_pct']}%")
    report.append(f"Status: {capacity['utilization_status']}")
    report.append("")
    
    # Yards per door
    report.append("YARDS PER DOOR ANALYSIS")
    report.append("-" * 60)
    ypd = results['yards_per_door']
    report.append(f"Available Capacity: {ypd['available_weekly']} yards/door/week")
    report.append(f"Actual Usage: {ypd['actual_weekly']} yards/door/week")
    report.append(f"Service Utilization: {ypd['service_utilization_pct']}%")
    report.append(f"Excess Capacity: {ypd['excess_capacity_pct']}%")
    report.append("")
    
    # Service assessment
    report.append("SERVICE LEVEL ASSESSMENT")
    report.append("-" * 60)
    assessment = results['service_assessment']
    report.append(f"Status: {assessment['status']}")
    report.append(f"Recommendation: {assessment['recommendation']}")
    report.append(f"Optimal Benchmark: {assessment['optimal_benchmark']} yards/door/week")
    report.append("")
    
    # Current costs
    report.append("CURRENT COSTS")
    report.append("-" * 60)
    costs = results['current_costs']
    report.append(f"Annual Haul Cost: ${costs['annual_haul_cost']:,.2f}")
    report.append(f"Annual Disposal Cost: ${costs['annual_disposal_cost']:,.2f}")
    report.append(f"Total Annual Cost: ${costs['total_annual_cost']:,.2f}")
    report.append("")
    
    # Optimization
    if 'optimization' in results:
        report.append("OPTIMIZATION OPPORTUNITY")
        report.append("-" * 60)
        opt = results['optimization']
        report.append(f"Priority Level: {opt['priority']}")
        report.append(f"Recommended Pickups: {opt['recommended_pickups']}/year")
        report.append(f"Pickup Reduction: {opt['pickup_reduction']} fewer pickups")
        report.append(f"Days Between Pickups: {opt['days_between_pickups']}")
        report.append(f"Optimized Utilization: {opt['optimized_utilization_pct']}%")
        report.append(f"")
        report.append(f"PROJECTED SAVINGS:")
        report.append(f"Annual Savings: ${opt['annual_savings']:,.2f}")
        report.append(f"Monthly Savings: ${opt['monthly_savings']:,.2f}")
        report.append("")
    else:
        report.append("OPTIMIZATION STATUS")
        report.append("-" * 60)
        report.append("No optimization opportunity detected.")
        report.append("Current utilization is within acceptable range.")
        report.append("")
    
    report.append("=" * 60)
    
    return "\n".join(report)


# Example usage
if __name__ == "__main__":
    # Example property data
    results = analyze_property(
        units=200,
        container_size_cy=30,
        current_pickups=52,
        avg_tons_per_pull=4.5,
        base_haul_fee=150,
        disposal_rate=60,
        service_type='compacted'
    )
    
    print(format_report(results))
