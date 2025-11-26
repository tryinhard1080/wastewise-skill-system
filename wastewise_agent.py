"""
WasteWise Complete Suite agent scaffold.
- Reads skill rules once, validates inputs, and produces structured recommendations.
- Generates both Excel (8 tabs) and HTML (6 tabs) outputs; fill in IO hooks for your app.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple


@dataclass
class PropertyProfile:
    name: str
    units: int
    property_type: str  # garden, mid-rise, high-rise, mixed-use
    occupancy_pct: float
    status: str  # lease-up, stabilized, value-add/renovation
    has_compactor: bool
    has_valet: bool
    location: Optional[str] = None  # "City, State"


@dataclass
class EquipmentProfile:
    compactor_tons: Optional[float] = None
    compactor_max_days_between_pickups: Optional[int] = None
    dumpster_qty: Optional[int] = None
    dumpster_size: Optional[float] = None
    dumpster_freq_per_week: Optional[float] = None
    dual_compactors: bool = False


@dataclass
class Financials:
    monthly_cost: float
    pickup_cost_per_haul: float
    contamination_charges: float
    bulk_charges: float
    avg_monthly_overage: float
    avg_tons_per_haul: float
    overages_present: bool


@dataclass
class InvoiceEntry:
    month: str  # MM/YYYY
    invoice_number: str
    disposal: float
    pickup_fees: float
    rental: float
    contamination: float
    bulk: float
    other: float
    units: int


@dataclass
class ContractInfo:
    text: Optional[str] = None
    expiration_date: Optional[str] = None  # MM/DD/YYYY


@dataclass
class Recommendation:
    title: str
    detail: str
    monthly_savings: float = 0.0
    annual_savings: float = 0.0
    payback_months: Optional[float] = None
    priority: Optional[int] = None


class WasteWiseAgent:
    def __init__(self):
        self.brand = "WasteWise by THE Trash Hub"
        self.contacts = {
            "primary": "Richard Bates (The Trash Hub)",
            "compactor_monitors": "Keith Conrad (DSQ Technologies) <keith.conrad@dsqtech.com>",
            "bulk_trash": "Cole Myers (Ally Waste) <cole@allywaste.com>",
        }

    # --- Core calculations ---
    def yards_per_door_compactor(self, total_tons: float, units: int) -> float:
        return (total_tons * 14.49) / units

    def yards_per_door_compactor_alt(self, total_tons: float, units: int) -> float:
        return ((total_tons * 2000) / 138) / units

    def yards_per_door_dumpster(self, qty: int, size: float, freq: float, units: int) -> float:
        return (qty * size * freq * 4.33) / units

    def cost_per_door(self, monthly_cost: float, units: int) -> float:
        return monthly_cost / units

    def annual_savings(self, monthly_savings: float) -> float:
        return monthly_savings * 12

    # --- Decision logic ---
    def compactor_optimization(
        self,
        equipment: EquipmentProfile,
        financials: Financials,
        install_cost: float,
        monitoring_cost: float,
    ) -> Optional[Recommendation]:
        if not equipment.compactor_tons:
            return None
        if financials.avg_tons_per_haul >= 7 or (
            equipment.compactor_max_days_between_pickups is not None
            and equipment.compactor_max_days_between_pickups > 14
        ):
            return None

        # Savings from reduced hauls (pickup fees only)
        # Caller should provide haul_reduction and cost_per_haul contextually
        monthly_pickup_savings = financials.pickup_cost_per_haul  # placeholder; replace with actual reduction calc
        if monthly_pickup_savings < 300:
            return None

        net_monthly = monthly_pickup_savings - (install_cost + monitoring_cost)
        if net_monthly <= 0:
            return None

        return Recommendation(
            title="Add Compactor Monitors",
            detail="Avg tons/haul below 7 and interval ≤14 days; monitors target 8–9 tons/haul.",
            monthly_savings=net_monthly,
            annual_savings=self.annual_savings(net_monthly),
            payback_months=None,
        )

    def lease_up_budget_projection(
        self, profile: PropertyProfile, current_cost: float, current_occupancy: float, target_occupancy: float
    ) -> float:
        if profile.status != "lease-up":
            return current_cost
        return (current_cost / current_occupancy) * target_occupancy

    def overage_strategy(self, financials: Financials, overage_frequency: str, extra_service_cost: float) -> str:
        annual_overage = financials.avg_monthly_overage * 12
        annual_added_service = extra_service_cost * 12

        if overage_frequency == "consistent":
            if annual_added_service < annual_overage:
                return "Add permanent service day; cheaper than overages."
            return "Overages cheaper than added service; keep status quo."

        if overage_frequency == "seasonal":
            return "Add seasonal service only during peak months."

        return "Investigate operations (valet distribution, compliance); consider larger equipment if needed."

    def contamination_plan(self, financials: Financials, total_spend: float) -> Optional[Recommendation]:
        rate = (financials.contamination_charges / total_spend) * 100 if total_spend else 0
        if rate <= 3:
            return None

        if rate > 5 and financials.contamination_charges > 150:
            detail = (
                "Full contamination reduction: signage $500, education $300, monitoring $50/month; "
                "expected 50% charge reduction."
            )
        else:
            detail = "Light intervention: signage refresh and resident reminders."

        monthly_savings = financials.contamination_charges * 0.5 if rate > 5 else financials.contamination_charges * 0.25
        return Recommendation(
            title="Contamination Reduction",
            detail=detail,
            monthly_savings=monthly_savings,
            annual_savings=self.annual_savings(monthly_savings),
        )

    def bulk_strategy(self, avg_monthly_bulk: float) -> Recommendation:
        if avg_monthly_bulk > 500:
            savings = (avg_monthly_bulk - 400) * 12
            return Recommendation(
                title="Switch to Bulk Subscription",
                detail="Average bulk > $500/month; subscription at $400/month lowers cost.",
                monthly_savings=avg_monthly_bulk - 400,
                annual_savings=savings,
            )
        if 300 <= avg_monthly_bulk <= 500:
            return Recommendation(
                title="Monitor Bulk Spend",
                detail="Borderline spend; monitor 3 months and prepare for subscription if trend increases.",
            )
        return Recommendation(
            title="Keep On-Demand Bulk",
            detail="On-demand pricing remains cost-effective.",
        )

    def service_level(self, financials: Financials, contamination_or_overages: bool) -> str:
        if contamination_or_overages and financials.avg_tons_per_haul < 6:
            return "Address contamination/overages before any reduction."

        if financials.avg_tons_per_haul >= 8 and financials.overages_present:
            return "Add service day (compactor near capacity)."
        if financials.avg_tons_per_haul < 6 and not financials.overages_present:
            return "Reduce pickup frequency (underutilized)."
        if 6 <= financials.avg_tons_per_haul < 8:
            return "Maintain current service."
        return "Maintain current service."

    def prioritize(self, recs: List[Recommendation]) -> List[Recommendation]:
        # Prioritize by annual savings (desc), then payback (asc, None last), then complexity (caller to set priority hints)
        ranked = sorted(
            recs,
            key=lambda r: (
                -(r.annual_savings or 0),
                float("inf") if r.payback_months is None else r.payback_months,
            ),
        )
        for idx, rec in enumerate(ranked, start=1):
            rec.priority = idx
        return ranked

    # --- Output stubs ---
    def build_excel_workbook(self, data: Dict) -> str:
        """
        Build Excel with 8 required tabs:
        SUMMARY, SUMMARY_FULL (first line: 'Potential to Reduce 2026 Trash Expense by $XX,XXX'),
        EXPENSE_ANALYSIS, HAUL_LOG, OPTIMIZATION, CONTRACT_TERMS (if contract provided),
        REGULATORY_COMPLIANCE, INSTRUCTIONS.
        Return path/URL to generated workbook.
        """
        # TODO: integrate with your Excel writer (e.g., openpyxl/xlsxwriter) and ensure all invoice numbers are included.
        raise NotImplementedError("Implement Excel generation in your application layer.")

    def build_html_dashboard(self, data: Dict) -> str:
        """
        Build HTML dashboard with 6 tabs:
        Dashboard, Expense Analysis, Haul Log, Optimization, Contract Terms, Regulatory Compliance.
        Return path/URL to generated dashboard.
        """
        # TODO: integrate with your HTML renderer/front-end.
        raise NotImplementedError("Implement HTML generation in your application layer.")

    # --- Validation ---
    def validate(self, profile: PropertyProfile, equipment: EquipmentProfile, invoices: List[InvoiceEntry]) -> List[str]:
        errors: List[str] = []
        if not profile.name:
            errors.append("Property name is required.")
        if profile.units <= 0:
            errors.append("Units must be positive.")
        if profile.status == "lease-up" and profile.occupancy_pct >= 90:
            errors.append("Lease-up status inconsistent with occupancy >= 90%.")
        if equipment.compactor_max_days_between_pickups and equipment.compactor_max_days_between_pickups > 14:
            errors.append("Compactor pickup interval exceeds 14-day threshold for optimization.")
        if not invoices:
            errors.append("At least one invoice is required.")
        return errors


def example_usage():
    # Illustrative wiring; replace with your web app input pipeline.
    profile = PropertyProfile(
        name="Sample Property",
        units=250,
        property_type="garden",
        occupancy_pct=92.0,
        status="stabilized",
        has_compactor=True,
        has_valet=True,
        location="Austin, TX",
    )
    equipment = EquipmentProfile(
        compactor_tons=45.0,
        compactor_max_days_between_pickups=10,
        dumpster_qty=0,
        dumpster_size=0.0,
        dumpster_freq_per_week=0.0,
        dual_compactors=False,
    )
    financials = Financials(
        monthly_cost=12000.0,
        pickup_cost_per_haul=550.0,
        contamination_charges=600.0,
        bulk_charges=800.0,
        avg_monthly_overage=300.0,
        avg_tons_per_haul=5.5,
        overages_present=True,
    )

    agent = WasteWiseAgent()
    errors = agent.validate(profile, equipment, invoices=[InvoiceEntry(month="01/2025", invoice_number="INV-001", disposal=4000, pickup_fees=3000, rental=500, contamination=600, bulk=800, other=200, units=profile.units)])
    if errors:
        return {"errors": errors}

    recs = []
    compactor_rec = agent.compactor_optimization(equipment, financials, install_cost=200.0, monitoring_cost=50.0)
    if compactor_rec:
        recs.append(compactor_rec)
    contamination_rec = agent.contamination_plan(financials, total_spend=financials.monthly_cost)
    if contamination_rec:
        recs.append(contamination_rec)
    recs.append(agent.bulk_strategy(financials.bulk_charges))

    prioritized = agent.prioritize(recs)
    service_guidance = agent.service_level(financials, contamination_or_overages=financials.overages_present or financials.contamination_charges > 0)

    return {
        "brand": agent.brand,
        "contacts": agent.contacts,
        "recommendations": [rec.__dict__ for rec in prioritized],
        "service_guidance": service_guidance,
    }


if __name__ == "__main__":
    # Basic smoke run; replace with integration.
    result = example_usage()
    print(result)
