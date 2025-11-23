---
name: waste-visual-reporter
description: Generate professional, interactive HTML dashboards for waste management analysis with 5 tabs (Dashboard, Expense Analysis, Haul Log, Optimization, Contract Terms). Creates Chart.js visualizations, filterable data tables, and actionable recommendations. Use when user mentions creating visual reports, dashboards, interactive analysis, or wants to visualize WasteWise Analysis results for property managers, regional directors, or stakeholders who need both executive summaries and operational detail.
---

# Waste Visual Reporter

## What This Skill Does

Transforms detailed waste management data into professional, interactive HTML dashboards designed for Advantage Waste / Greystar properties. Takes structured data from invoice analysis, contract reviews, or WasteWise Analysis outputs and generates comprehensive multi-tab dashboards with:

- **5-Tab Structure**: Dashboard (executive), Expense Analysis (budgeting), Haul Log (operations), Optimization (recommendations), Contract Terms (risk management)
- **Chart.js Visualizations**: Gauge charts, line charts, bar charts for data storytelling
- **Interactive Elements**: Tab navigation, filterable tables, sticky headers
- **Color-Coded Status**: Red (poor), yellow (warning), green (good) indicators
- **Professional Advantage Waste / Greystar Branding**: Slate color palette with blue/red/green accents

## When to Use

Invoke this skill when the user:

- Wants to create an interactive dashboard from waste data
- Needs a multi-tab analysis tool for property managers
- Mentions "dashboard", "visual report", "interactive analysis"
- Asks to visualize WasteWise Analysis results with drill-down capability
- Needs both executive summary AND operational detail in one tool
- Wants Chart.js visualizations (gauges, line charts, bar charts)
- Requests haul-by-haul log analysis
- Needs contract risk analysis with specific termination windows
- Wants to share comprehensive waste analysis with multiple audiences

## How It Works

### Step 1: Load and Structure Data

## How It Works

### Step 1: Structure the Data

```python
import json
from datetime import datetime

# Enhanced data structure for interactive dashboard
def load_waste_data_enhanced(source):
    """
    Load waste analysis data with enhanced structure for multi-tab dashboard

    Expected data structure:
    {
        "property_info": {
            "name": "Property Name",
            "units": 300,
            "property_type": "Garden-Style | Mid-Rise | High-Rise"
        },
        "analysis_period": "April - September 2025 (6 months)",
        "current_vendor": "Waste Connections",
        "total_spend_6mo": 70061.16,
        "avg_monthly_cost": 11676.86,
        "cost_per_door": 20.85,
        "annual_savings_opportunity": 19348,

        # Monthly expense breakdown for Expense Analysis tab
        "monthly_expenses": [
            {
                "month": "Apr 2025",
                "disposal": 4570.68,
                "haul_fees": 4066.40,
                "container_rental": 1705.80,
                "bulk_service": 1069.04,
                "total": 11411.92,
                "cost_per_door": 20.38
            },
            # ... more months
        ],

        # Haul-by-haul log for Haul Log tab
        "haul_log": [
            {"date": "2025-04-01", "tonnage": 5.49},
            {"date": "2025-04-04", "tonnage": 4.88},
            # ... more hauls
        ],

        # Compactor performance metrics
        "compactor_metrics": {
            "avg_tons_per_haul": 4.70,
            "target_tons_per_haul": 8.00,
            "capacity_utilization": 58.8,  # percentage
            "current_annual_hauls": 128,
            "optimized_annual_hauls": 75,
            "hauls_saved": 53,
            "cost_per_haul": 406.64
        },

        # Optimization recommendations
        "optimizations": [
            {
                "priority": 1,
                "title": "Install Compactor Monitors",
                "description": "...",
                "gross_annual_savings": 21551.92,
                "installation_cost": 300,
                "annual_service_fee": 2400,
                "net_year1_savings": 18851.92,
                "roi_percent": 698,
                "payback_months": 1.7,
                "contact": "DSQ Technologies - Keith Conrad"
            }
        ],

        # Contract risk analysis
        "contract_risks": [
            {
                "risk_type": "Auto-Renewal",
                "severity": "high",
                "contract_clause": "Verbatim text from contract...",
                "impact": "You are locked into 5-year auto-renewals",
                "action_required": "Set calendar reminder for termination window"
            }
        ]
    }
    """
    if isinstance(source, dict):
        return source
    elif isinstance(source, str) and source.endswith('.json'):
        with open(source, 'r') as f:
            return json.load(f)
    else:
        raise ValueError("Data must be dict or JSON file path")
```

### Step 2: Generate Interactive Multi-Tab HTML Dashboard

```python
def generate_dashboard_html(data):
    """Generate complete interactive dashboard with 5 tabs and Chart.js visualizations"""

    property_name = data['property_info']['name']
    units = data['property_info']['units']

    # Calculate key metrics
    compactor = data.get('compactor_metrics', {})
    capacity_util = compactor.get('capacity_utilization', 58.8)
    avg_tons = compactor.get('avg_tons_per_haul', 4.70)
    target_tons = compactor.get('target_tons_per_haul', 8.00)

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waste Analysis Dashboard - {property_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .gauge-text {{
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2.5rem;
            font-weight: bold;
        }}
        .gauge-label {{
            position: absolute;
            top: 85%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1rem;
            color: #6b7280;
        }}
        .tab-button.active {{
            border-bottom-color: #2563eb;
            color: #2563eb;
        }}
        .tab-button {{
            border-bottom-width: 3px;
            border-bottom-color: transparent;
        }}
        .haul-poor {{
            background-color: #fef2f2;
            color: #b91c1c;
        }}
        .haul-good {{
            background-color: #f0fdf4;
        }}
        .table-sticky-header th {{
            position: sticky;
            top: 0;
            background-color: #f1f5f9;
            z-index: 10;
        }}
    </style>
</head>
<body class="bg-slate-50 font-sans">

    <div class="max-w-7xl mx-auto p-4 md:p-8">

        <!-- Header -->
        <header class="mb-6 border-b border-slate-300 pb-4">
            <h1 class="text-3xl font-bold text-slate-800">Waste Analysis Dashboard</h1>
            <p class="text-lg text-slate-600">{property_name} ({units} Units)</p>
            <div class="mt-2 p-4 bg-white rounded-lg shadow-md border-l-4 border-green-600">
                <h2 class="text-lg font-semibold text-slate-800">Potential to Reduce 2026 Trash Expense by <span class="text-green-600">${data.get('annual_savings_opportunity', 0):,.0f}</span></h2>
                <p class="text-sm text-slate-600 mt-1">This validated savings opportunity comes from:</p>
                <ul class="list-disc list-inside text-sm text-slate-600 mt-2">
                    <li><span class="font-medium">${data.get('annual_savings_opportunity', 0):,.0f}</span> - Compactor Optimization (DSQ Monitors)</li>
                    <li><span class="font-medium">$0</span> - Contamination Reduction (No significant charges found)</li>
                </ul>
            </div>
        </header>

        <!-- Tab Navigation -->
        <div class="mb-6 border-b border-slate-300">
            <nav class="flex -mb-px space-x-6" aria-label="Tabs">
                <button onclick="showTab('dashboard')" id="tab-btn-dashboard" class="tab-button active whitespace-nowrap py-4 px-1 text-base font-medium">Dashboard</button>
                <button onclick="showTab('expense')" id="tab-btn-expense" class="tab-button whitespace-nowrap py-4 px-1 text-base font-medium">Expense Analysis</button>
                <button onclick="showTab('haul_log')" id="tab-btn-haul_log" class="tab-button whitespace-nowrap py-4 px-1 text-base font-medium">Haul Log</button>
                <button onclick="showTab('optimization')" id="tab-btn-optimization" class="tab-button whitespace-nowrap py-4 px-1 text-base font-medium">Optimization</button>
                <button onclick="showTab('contract')" id="tab-btn-contract" class="tab-button whitespace-nowrap py-4 px-1 text-base font-medium">Contract Terms</button>
            </nav>
        </div>

        <main>
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content">
                <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-sm font-medium text-slate-500 uppercase">Avg. Cost Per Door</h3>
                        <p class="text-3xl font-bold text-blue-600">${data.get('cost_per_door', 0):.2f}</p>
                        <p class="text-sm text-slate-500">Benchmark: $18-$35 (Good)</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-sm font-medium text-slate-500 uppercase">Total 6-Mo Spend</h3>
                        <p class="text-3xl font-bold text-slate-800">${data.get('total_spend_6mo', 0):,.2f}</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-sm font-medium text-slate-500 uppercase">Avg. Monthly Cost</h3>
                        <p class="text-3xl font-bold text-slate-800">${data.get('avg_monthly_cost', 0):,.2f}</p>
                    </div>
                </section>

                <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-xl font-bold text-red-700 mb-4">Finding #1: Compactor Inefficiency</h2>
                        <p class="text-slate-600 mb-4">Your compactors are critically underutilized, averaging only **{avg_tons:.2f} tons** per haul instead of the {target_tons:.1f}-ton industry target. This means you are paying for hauls that are only **{capacity_util:.1f}% full**.</p>
                        <div class="relative w-full max-w-sm mx-auto h-64">
                            <canvas id="efficiencyGauge"></canvas>
                            <div class="gauge-text text-red-600">{capacity_util:.1f}%</div>
                            <div class="gauge-label">Capacity Utilization</div>
                        </div>
                        <p class="text-slate-600 mt-4">This inefficiency results in an estimated **{compactor.get('hauls_saved', 53)} unnecessary, fully-paid pickups** per year. See the **Optimization** tab for the solution.</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-xl font-bold text-yellow-700 mb-4">Finding #2: High Bulk Trash Costs</h2>
                        <p class="text-slate-600 mb-4">The property is spending high amounts on bulk service. This recurring cost presents an opportunity to improve service and potentially stabilize your budget.</p>
                        <div class="p-6 bg-slate-50 rounded-lg mt-12">
                            <h3 class="text-lg font-semibold text-slate-800">Recommendation</h3>
                            <p class="text-slate-600 mt-2">Consider a subscription-based bulk trash service. This provides consistent, scheduled pickups, improves resident experience by keeping the property clean, and makes your bulk trash expense a predictable line item.</p>
                            <p class="text-slate-600 mt-4">See the **Optimization** tab for recommended partners.</p>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Expense Analysis Tab -->
            <div id="expense" class="tab-content hidden">
                <section class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-800 mb-4">Expense Analysis by Month</h2>
                    <p class="text-slate-600 mb-4">This grid breaks down your monthly spending by category. The "Cost Per Door (Monthly)" row is key for spotting outlier months and for future budgeting.</p>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-200 text-sm">
                            <thead class="bg-slate-100">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider">Expense Category</th>"""

    # Add monthly columns
    if 'monthly_expenses' in data and len(data['monthly_expenses']) > 0:
        for month_data in data['monthly_expenses']:
            html_template += f"""
                                    <th class="px-4 py-3 text-right font-medium text-slate-600 uppercase tracking-wider">{month_data['month']}</th>"""

        html_template += """
                                    <th class="px-4 py-3 text-right font-medium text-slate-600 uppercase tracking-wider">Total</th>
                                    <th class="px-4 py-3 text-right font-medium text-slate-600 uppercase tracking-wider">Average</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-slate-200">"""

        # Calculate totals
        disposal_total = sum(m['disposal'] for m in data['monthly_expenses'])
        haul_total = sum(m['haul_fees'] for m in data['monthly_expenses'])
        container_total = sum(m['container_rental'] for m in data['monthly_expenses'])
        bulk_total = sum(m['bulk_service'] for m in data['monthly_expenses'])
        grand_total = sum(m['total'] for m in data['monthly_expenses'])

        num_months = len(data['monthly_expenses'])

        # Disposal row
        html_template += """
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap font-medium text-slate-800">Disposal Charges (Tonnage)</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right">${m['disposal']:,.2f}</td>"""
        html_template += f"""
                                    <td class="px-4 py-3 text-right font-bold">${disposal_total:,.2f}</td>
                                    <td class="px-4 py-3 text-right font-bold">${disposal_total/num_months:,.2f}</td>
                                </tr>"""

        # Haul fees row
        html_template += """
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap font-medium text-slate-800">Pickup/Haul Fees</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right">${m['haul_fees']:,.2f}</td>"""
        html_template += f"""
                                    <td class="px-4 py-3 text-right font-bold">${haul_total:,.2f}</td>
                                    <td class="px-4 py-3 text-right font-bold">${haul_total/num_months:,.2f}</td>
                                </tr>"""

        # Container rental row
        html_template += """
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap font-medium text-slate-800">Container Rental</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right">${m['container_rental']:,.2f}</td>"""
        html_template += f"""
                                    <td class="px-4 py-3 text-right font-bold">${container_total:,.2f}</td>
                                    <td class="px-4 py-3 text-right font-bold">${container_total/num_months:,.2f}</td>
                                </tr>"""

        # Bulk service row
        html_template += """
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap font-medium text-slate-800">Bulk Service</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right">${m['bulk_service']:,.2f}</td>"""
        html_template += f"""
                                    <td class="px-4 py-3 text-right font-bold">${bulk_total:,.2f}</td>
                                    <td class="px-4 py-3 text-right font-bold">${bulk_total/num_months:,.2f}</td>
                                </tr>"""

        # Total row
        html_template += """
                                <tr class="bg-slate-100 font-bold">
                                    <td class="px-4 py-3 whitespace-nowrap text-slate-800">COMBINED MONTHLY TOTAL</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right text-slate-800">${m['total']:,.2f}</td>"""
        html_template += f"""
                                    <td class="px-4 py-3 text-right text-blue-700">${grand_total:,.2f}</td>
                                    <td class="px-4 py-3 text-right text-blue-700">${grand_total/num_months:,.2f}</td>
                                </tr>"""

        # Cost per door row
        html_template += """
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap font-medium text-blue-700 bg-blue-50">Cost Per Door (Monthly)</td>"""
        for m in data['monthly_expenses']:
            html_template += f"""
                                    <td class="px-4 py-3 text-right font-medium text-blue-700 bg-blue-50">${m['cost_per_door']:.2f}</td>"""
        cpd_total = sum(m['cost_per_door'] for m in data['monthly_expenses'])
        html_template += f"""
                                    <td class="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50">${cpd_total:.2f}</td>
                                    <td class="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50">${cpd_total/num_months:.2f}</td>
                                </tr>"""

    html_template += """
                            </tbody>
                        </table>
                    </div>
                    <div class="w-full h-96 mt-6">
                        <canvas id="costPerDoorChart"></canvas>
                    </div>
                </section>
            </div>

            <!-- Haul Log Tab -->
            <div id="haul_log" class="tab-content hidden">
                <section class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-800 mb-4">Compactor Haul Log</h2>
                    <p class="text-slate-600 mb-4">This log details every pickup over the analysis period. Hauls flagged as <span class="text-red-600 font-medium">"Poor"</span> are below the 6.0-ton efficiency threshold and represent the primary savings opportunity.</p>
                    <div class="max-h-[600px] overflow-y-auto border border-slate-200 rounded-lg">
                        <table class="min-w-full divide-y divide-slate-200 text-sm">
                            <thead class="table-sticky-header">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider">Date</th>
                                    <th class="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider">Tonnage</th>
                                    <th class="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider">Status (< 6.0T)</th>
                                </tr>
                            </thead>
                            <tbody id="haul-log-body" class="bg-white divide-y divide-slate-200">
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <!-- Optimization Tab -->
            <div id="optimization" class="tab-content hidden">
                <section class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-bold text-green-700 mb-4">Opportunity 1: Compactor Optimization</h2>
                    <p class="text-slate-600 mb-4">By installing compactor monitors, you can switch from a schedule-based to a fullness-based pickup model. This eliminates paying for hauls that are half-empty.</p>

                    <div class="w-full h-80 mb-4">
                        <canvas id="haulsChart"></canvas>
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider">Metric</th>
                                    <th class="px-4 py-3 text-right font-medium text-slate-600 uppercase tracking-wider">Current (Annual)</th>
                                    <th class="px-4 py-3 text-right font-medium text-slate-600 uppercase tracking-wider">Optimized (Annual)</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-slate-200">
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Avg. Tons per Haul</td>
                                    <td class="px-4 py-3 text-right text-sm text-red-600 font-bold">{avg_tons:.2f} tons</td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">{target_tons:.1f} tons (Target)</td>
                                </tr>
                                <tr class="bg-slate-50">
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Total Annual Hauls</td>
                                    <td class="px-4 py-3 text-right text-sm text-red-600 font-bold">{compactor.get('current_annual_hauls', 128)} Hauls</td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">{compactor.get('optimized_annual_hauls', 75)} Hauls</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Hauls Saved</td>
                                    <td class="px-4 py-3 text-right text-sm text-slate-800"></td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">{compactor.get('hauls_saved', 53)} Hauls</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 class="text-lg font-semibold text-slate-800 mb-2">Year 1 ROI Calculation</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-200">
                            <tbody class="bg-white divide-y divide-slate-200">"""

    if 'optimizations' in data and len(data['optimizations']) > 0:
        opt = data['optimizations'][0]
        html_template += f"""
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Gross Annual Savings ({compactor.get('hauls_saved', 53)} hauls × ${compactor.get('cost_per_haul', 406.64):.2f}/haul)</td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">${opt.get('gross_annual_savings', 0):,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Monitor Install Cost (One-time)</td>
                                    <td class="px-4 py-3 text-right text-sm text-red-600 font-bold">(${'{'}{opt.get('installation_cost', 0):,.2f}{'}'})</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Monitor Service Fee ($200/mo × 12)</td>
                                    <td class="px-4 py-3 text-right text-sm text-red-600 font-bold">(${'{'}{opt.get('annual_service_fee', 0):,.2f}{'}'})</td>
                                </tr>
                                <tr class="bg-green-50">
                                    <td class="px-4 py-3 text-base font-bold text-green-700">Net Year 1 Savings</td>
                                    <td class="px-4 py-3 text-right text-base text-green-700 font-extrabold">${opt.get('net_year1_savings', 0):,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Year 1 ROI (Savings / Cost)</td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">{opt.get('roi_percent', 0)}%</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-slate-600">Payback Period</td>
                                    <td class="px-4 py-3 text-right text-sm text-green-600 font-bold">{opt.get('payback_months', 0):.1f} Months</td>
                                </tr>"""

    html_template += """
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-yellow-700 mb-4">Opportunity 2: High Bulk Trash Costs (Budget Control)</h2>
                    <p class="text-slate-600 mb-4">High recurring bulk service costs. Switching to a subscription-based valet service can improve resident experience and budget predictability.</p>
                    <div class="bg-slate-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-slate-800">Recommendation: Contact Ally Waste</h3>
                        <p class="text-slate-600 mt-2">We recommend contacting a service partner like **Ally Waste**.</p>
                        <ul class="list-disc list-inside text-slate-600 mt-2">
                            <li>They can provide a quote for a 5-night/week subscription service.</li>
                            <li>This service removes bulk items from designated areas or directly from resident doors.</li>
                            <li>**Benefits:** Improves property cleanliness, enhances resident experience, and provides a predictable, easy-to-budget monthly cost.</li>
                        </ul>
                    </div>
                </section>
            </div>

            <!-- Contract Terms Tab -->
            <div id="contract" class="tab-content hidden">
                <section class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-800 mb-4">Contract & Risk Analysis</h2>

                    <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-500 mb-6">
                        <h3 class="text-lg font-bold text-red-800">⚠️ ACTION REQUIRED: Set Calendar Reminder</h3>
                        <p class="text-red-700 mt-1">Your 5-year contract auto-renews. To terminate, you must send certified notice during a very specific 90-day window.</p>
                        <p class="text-red-700 font-bold mt-2">Review contract for specific termination windows</p>
                    </div>

                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-slate-800 mb-2">Common Contract Risks</h3>

                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-700">RISK: Term & Auto-Renewal</h4>
                            <p class="text-sm text-slate-600 mt-2"><span class="font-bold">Impact:</span> Locked into 5-year auto-renewals. Missing termination window locks you in for another 5 years.</p>
                        </div>

                        <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h4 class="font-bold text-red-700">CRITICAL RISK: Uncapped Rate Increases</h4>
                            <p class="text-sm text-red-600 mt-2"><span class="font-bold">Impact:</span> Vendors may reserve the right to adjust rates at any time, leading to significant cost increases over time.</p>
                        </div>

                        <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h4 class="font-bold text-red-700">CRITICAL RISK: Exit Penalty</h4>
                            <p class="text-sm text-red-600 mt-2"><span class="font-bold">Impact:</span> Early termination may require payment of 6 months of service fees as liquidated damages.</p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>

    <script>
        const chartInstances = {{}};

        function destroyChart(chartId) {{
            if (chartInstances[chartId]) {{
                chartInstances[chartId].destroy();
                delete chartInstances[chartId];
            }}
        }}

        const haulLogData = """ + json.dumps(data.get('haul_log', [])) + """;

        function populateHaulLog() {{
            const tableBody = document.getElementById('haul-log-body');
            if (!tableBody) return;
            tableBody.innerHTML = '';
            haulLogData.forEach(haul => {{
                const isPoor = haul.tonnage < 6.0;
                const rowClass = isPoor ? 'haul-poor' : 'haul-good';
                const status = isPoor ? 'Poor' : 'Good';
                const row = `
                    <tr class="${{rowClass}}">
                        <td class="px-4 py-3 whitespace-nowrap">${{haul.date}}</td>
                        <td class="px-4 py-3 whitespace-nowrap font-medium">${{haul.tonnage.toFixed(2)}} tons</td>
                        <td class="px-4 py-3 whitespace-nowrap font-bold">${{status}}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            }});
        }}

        function createDashboardCharts() {{
            destroyChart('efficiencyGauge');
            const gaugeCanvas = document.getElementById('efficiencyGauge');
            if (gaugeCanvas) {{
                chartInstances.efficiencyGauge = new Chart(gaugeCanvas, {{
                    type: 'doughnut',
                    data: {{ datasets: [{{ data: [{capacity_util:.1f}, {100-capacity_util:.1f}], backgroundColor: ['#dc2626', '#e5e7eb'], borderWidth: 0 }}] }},
                    options: {{ responsive: true, maintainAspectRatio: false, circumference: 180, rotation: -90, cutout: '80%', plugins: {{ tooltip: {{ enabled: false }} }} }}
                }});
            }}
        }}

        function createExpenseCharts() {{
            destroyChart('costPerDoorChart');
            const cpdCanvas = document.getElementById('costPerDoorChart');
            if (cpdCanvas) {{"""

    if 'monthly_expenses' in data:
        months = [m['month'] for m in data['monthly_expenses']]
        cpd_values = [m['cost_per_door'] for m in data['monthly_expenses']]
        html_template += f"""
                chartInstances.costPerDoorChart = new Chart(cpdCanvas, {{
                    type: 'line',
                    data: {{
                        labels: {json.dumps(months)},
                        datasets: [{{
                            label: 'Cost Per Door (Monthly)',
                            data: {json.dumps(cpd_values)},
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            fill: true,
                            tension: 0.1
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {{ y: {{ beginAtZero: false, title: {{ display: true, text: 'Cost per Door ($)' }} }} }},
                        plugins: {{ title: {{ display: true, text: 'Monthly Cost Per Door Fluctuation' }} }}
                    }}
                }});"""

    html_template += """
            }}
        }}

        function createOptimizationCharts() {{
            destroyChart('haulsChart');
            const haulsCanvas = document.getElementById('haulsChart');
            if (haulsCanvas) {{
                chartInstances.haulsChart = new Chart(haulsCanvas, {{
                    type: 'bar',
                    data: {{
                        labels: ['Annual Hauls'],
                        datasets: [
                            {{ label: 'Current', data: [{compactor.get('current_annual_hauls', 128)}], backgroundColor: '#ef4444' }},
                            {{ label: 'Optimized', data: [{compactor.get('optimized_annual_hauls', 75)}], backgroundColor: '#22c55e' }}
                        ]
                    }},
                    options: {{
                        responsive: true, maintainAspectRatio: false,
                        scales: {{ y: {{ beginAtZero: true, title: {{ display: true, text: 'Total Hauls' }} }} }},
                        plugins: {{ title: {{ display: true, text: 'Annual Hauls: Current vs. Optimized' }} }}
                    }}
                }});
            }}
        }}

        const chartsDrawn = {{
            dashboard: false, optimization: false, contract: true, haul_log: true, expense: false
        }};

        function showTab(tabId) {{
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active', 'text-blue-600'));

            const activeTabContent = document.getElementById(tabId);
            if(activeTabContent) activeTabContent.classList.remove('hidden');

            const activeButton = document.getElementById('tab-btn-' + tabId);
            if (activeButton) activeButton.classList.add('active', 'text-blue-600');

            switch (tabId) {{
                case 'dashboard':
                    if (!chartsDrawn.dashboard) {{
                        createDashboardCharts();
                        chartsDrawn.dashboard = true;
                    }}
                    break;
                case 'expense':
                    if (!chartsDrawn.expense) {{
                        createExpenseCharts();
                        chartsDrawn.expense = true;
                    }}
                    break;
                case 'haul_log':
                    if (!chartsDrawn.haul_log) {{
                        populateHaulLog();
                        chartsDrawn.haul_log = true;
                    }}
                    break;
                case 'optimization':
                    if (!chartsDrawn.optimization) {{
                        createOptimizationCharts();
                        chartsDrawn.optimization = true;
                    }}
                    break;
                case 'contract':
                    break;
            }}
        }}

        document.addEventListener('DOMContentLoaded', () => {{
            showTab('dashboard');
            populateHaulLog();
            chartsDrawn.haul_log = true;
        }});
    </script>
</body>
</html>"""

    return html_template
```

### Step 3: Create and Save Dashboard

```python
def create_interactive_dashboard(data, output_filename=None):
    """
    Main function to create interactive dashboard

    Args:
        data: Dictionary with comprehensive waste analysis data
        output_filename: Output HTML filename (auto-generated if None)

    Returns:
        Path to created HTML file
    """
    html_content = generate_dashboard_html(data)

    if output_filename is None:
        property_name = data['property_info']['name'].lower().replace(' ', '_')
        output_filename = f"{property_name}_dashboard.html"

    output_path = f"/mnt/user-data/outputs/{output_filename}"

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✓ Interactive dashboard created: {output_filename}")
    print(f"✓ Total spend (6mo): ${data.get('total_spend_6mo', 0):,.2f}")
    print(f"✓ Cost per door: ${data.get('cost_per_door', 0):.2f}")
    print(f"✓ Annual savings opportunity: ${data.get('annual_savings_opportunity', 0):,.0f}")
    print(f"✓ Compactor efficiency: {data.get('compactor_metrics', {}).get('capacity_utilization', 0):.1f}%")

    return output_path
```

## Required Libraries

- **None** - Pure Python standard library (json, datetime)
- HTML generation uses string templates (no external dependencies)

## Example Usage

**User prompt**: "Create a visual report from my WasteWise analysis for Columbia Square Living"

**Claude will**:

1. Extract key metrics and findings from the analysis data
2. Generate professional HTML report with Advantage Waste branding
3. Include KPI cards with color-coded status indicators
4. Create cost breakdown visualization
5. Add optimization recommendations with estimated savings
6. Save as single-page HTML file

**Output files**:

- `columbia_square_living_visual_report.html` - Professional one-page summary

## Integration with WasteWise Analysis

This skill is designed to complement the WasteWise Complete Analysis skill:

```python
# After running WasteWise Analysis, extract key data
wastewise_excel = "columbia_square_analysis.xlsx"

# Extract summary data (you can parse from Excel or use direct data)
visual_data = {
    "property_info": {...},  # From WasteWise Summary tab
    "metrics": {...},        # From KPIs tab
    "cost_breakdown": {...}, # From Expense Details tab
    "recommendations": [...] # From Recommendations tab
}

# Generate visual report
create_visual_report(visual_data)
```

## Tips for Best Results

- Ensure cost per door and yards per door metrics are calculated accurately
- Include specific savings estimates in recommendations (not just percentages)
- Use the critical_analysis field to highlight the top 2-3 findings
- Property type (Garden-Style, Mid-Rise, High-Rise) affects benchmark expectations
- Color coding automatically adjusts based on performance vs benchmarks
- Reports are mobile-responsive and print-friendly
- HTML files can be easily shared via email or embedded in presentations
