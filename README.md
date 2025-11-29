# WasteWise - AI-Powered Waste Management Optimization Platform

**Version**: 2.0  
**Status**: Production Ready (94%)  
**Last Updated**: 2025-11-29

> Transform waste management from cost center to competitive advantage with AI-powered analysis, regulatory compliance, and actionable insights.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/wastewise.git
cd wastewise

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
pnpm dev

# Run background worker (separate terminal)
pnpm worker
```

Visit **http://localhost:3000** to start analyzing waste!

---

## ✨ Features

### Core Analysis Engine
- **AI-Powered Invoice Extraction** - Upload CSV, PDF, or Excel invoices for automatic data extraction
- **Smart Optimization Recommendations** - Compactor monitoring, service level adjustments, contamination reduction
- **Regulatory Compliance Checking** - Automatic municipal ordinance research and compliance assessment
- **Contract Analysis** - Extract terms, risks, and renewal dates from waste contracts
- **Comprehensive Reporting** - Generate Excel workbooks (8 tabs) and interactive HTML dashboards (6 tabs)

### User Features
- **Multi-Project Management** - Organize analyses by property
- **Real-Time Progress Tracking** - Monitor analysis jobs with live updates
- **User Account Management** - Profile, security settings, notifications
- **API Key Management** - Programmatic access with secure key generation
- **Report Downloads** - Excel and HTML reports with detailed insights

### Technical Capabilities
- **5 Specialized AI Skills** - Modular architecture for extensibility
- **Async Job Processing** - Background workers for long-running tasks
- **Database-Backed** - PostgreSQL via Supabase with RLS
- **Type-Safe** - Full TypeScript with Zod validation
- **Tested** - 66 unit tests, comprehensive E2E coverage

---

## 📚 Documentation

- **[Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete production deployment instructions
- **[Phase 9.2 Summary](PHASE_9.2_SETTINGS_COMPLETE.md)** - Latest features and updates
- **[API Integration](API_INTEGRATION_STATUS.md)** - API documentation
- **[Testing Guide](docs/TESTING.md)** - Test suite and procedures

This agent codifies the WasteWise Complete Suite protocol to deliver consistent, expert-grade waste consulting outputs.

Workflow
--------
1) Read the WasteWise Complete Suite skill and load all rules.  
2) Ingest property inputs: profile, units/doors, equipment, occupancy status, hauler invoices, contract text (if provided), haul logs, contamination/bulk charges, overage history, and location (for ordinance research).  
3) Run 40+ validations before any recommendations.  
4) Conduct targeted regulatory research (max 2-3 searches; prioritize .gov).  
5) Compute benchmarks and KPIs (yards/door, cost/door, tons/haul, overage and contamination rates).  
6) Generate outputs in a single session: Excel (8 tabs) and HTML dashboard (6 tabs).  
7) Deliver files with an executive summary: key findings, annual savings, regulatory status, and download links.

Branding & Contacts
-------------------
- Brand: “WasteWise by THE Trash Hub” (never mention Advantage Waste).  
- Main contact: Richard Bates (The Trash Hub).  
- Compactor monitors: Keith Conrad (DSQ Technologies) — keith.conrad@dsqtech.com.  
- Bulk trash: Cole Myers (Ally Waste) — cole@allywaste.com.

Critical thresholds & rules
---------------------------
- Compactor monitors: recommend when avg tons/haul < 7 **and** max interval ≤ 14 days; target 8–9 tons/haul.  
- Contamination reduction: only recommend if contamination > 3% of total spend.  
- Bulk subscription: only recommend when average bulk > $500/month.  
- Yards per door:  
  - Compactor: (total tons × 14.49) ÷ units (or (tons × 2,000 ÷ 138) ÷ units).  
  - Dumpster: (qty × size × freq × 4.33) ÷ units.  
- Cost per door: total monthly cost ÷ units.  
- Annual savings: monthly savings × 12 (never × 24).  
- Dual compactors: calculate each separately; do not double savings.  
- Benchmarks (yards/door targets): garden 2.0–2.5, mid-rise 1.8–2.3, high-rise 1.5–2.0. Dumpster benchmarks are for comparison only (no service change recommendations).  
- Compactor optimization is actionable; Energy Star references must be removed.  
- Lease-up properties with very low yards/door (e.g., 0.87 vs 2.0–2.5) ⇒ no cost savings projected.

Required Excel tabs (8)
-----------------------
1) SUMMARY — executive overview.  
2) SUMMARY_FULL — first line: “Potential to Reduce 2026 Trash Expense by $XX,XXX”.  
3) EXPENSE_ANALYSIS — month-by-month columns; include all invoice numbers; cost/door by month.  
4) HAUL_LOG — pickups with dates, tons, yards/door (only if compactor).  
5) OPTIMIZATION — three opportunities with full calculation breakdowns.  
6) CONTRACT_TERMS — only if contract provided; 7 clause categories, verbatim text, reminders (90/60/30 days), risk severity.  
7) REGULATORY_COMPLIANCE — ordinance research (8 sections) with confidence score.  
8) INSTRUCTIONS — how to use the workbook.

Required HTML tabs (6)
----------------------
1) Dashboard — executive gauges and KPIs.  
2) Expense Analysis — charts and month-over-month trends.  
3) Haul Log — filterable data tables.  
4) Optimization — savings opportunities with visuals.  
5) Contract Terms — risk analysis and action items.  
6) Regulatory Compliance — ordinance requirements and checklist.

Front-end upload & IO flow
--------------------------
- UI: upload invoices (CSV/PDF via your parser), haul logs, and optional contract; capture property profile (units, type, occupancy, status), equipment, charges, and location.  
- API shape: send structured JSON matching `agent_spec.yaml` to the agent.  
- Outputs: agent returns (a) workbook payload (tab name → rows/fields), (b) HTML dashboard sections, (c) executive summary + savings + compliance status + download links.  
- Connect file generation: pipe workbook payload into your Excel writer (openpyxl/xlsxwriter) and HTML sections into your front-end renderer; surface download links after generation.

Regulatory research (8 sections)
--------------------------------
1) Ordinance Summary; 2) Waste Collection Requirements; 3) Recycling Requirements; 4) Composting/Organics; 5) Penalties & Enforcement; 6) Licensed Haulers (3–5 with contacts); 7) Regulatory Contacts; 8) Research Confidence (HIGH/MEDIUM/LOW).  
Search protocol: “[City] [State] waste recycling ordinance”; “[City] universal recycling multifamily”; “[City] composting mandate commercial”. Prioritize official sources; extract numerical requirements and penalties. Confidence: HIGH (official + penalties), MEDIUM (core info but gaps), LOW (insufficient — flag HUMAN REVIEW REQUIRED).

Decision logic highlights
-------------------------
- Compactor optimization gate: avg tons/haul < 7 and max interval ≤ 14 days; savings based only on pickup fees; require ≥ $300/month pickup savings; net monthly savings must be positive after install/monitoring.  
- Lease-up vs stabilized vs value-add: project to target occupancy for lease-up; use actuals for stabilized; flag disruption for renovation.  
- Overages: classify consistent/seasonal/sporadic; compare added service cost vs overage spend; recommend lowest annual cost.  
- Contamination: act if > 3% spend; full program if > 5% and > $150/month.  
- Bulk: subscription if average bulk > $500/month; monitor 300–500; on-demand below 300.  
- Service level: add service if ≥ 8 tons/haul and overages; reduce only if < 6 tons/haul and no overages; maintain at 6–8; never reduce when contamination/overages present.  
- Valet: enforce even distribution; adjust weekend coverage if 5-day schedule; note “success tax” if volume rises post-valet.  
- Multi-opportunity prioritization: rank by savings, then complexity, then payback; present top 3 with totals.

Validation before output
------------------------
- All tabs present and correctly named (Excel 8, HTML 6).  
- SUMMARY_FULL first line exact.  
- Contract tab only if contract provided.  
- Regulatory tab includes confidence score.  
- Compactor thresholds updated (<7 tons/haul, interval ≤ 14 days).  
- Annual savings = monthly × 12.  
- Dual compactors separately calculated.  
- Invoice numbers and dates included.  
- Contacts and branding correct.  
- Expense analysis includes maximum detail and cost/door per month.  
- Minimum 3 licensed haulers when research is done.

Output format to user
---------------------
1) Brief executive summary (3–5 findings).  
2) Total annual savings opportunity.  
3) Regulatory compliance status (if researched).  
4) Download links to Excel and HTML (computer://...).

Implementation notes
--------------------
- Read skill once at start; minimize tool calls.  
- Perform comprehensive validation once.  
- Generate both outputs in one session.  
- Currency: $ with 2 decimals; percentages: 1 decimal; dates: MM/DD/YYYY.  
- Use the term “compactor monitors” (never “ultrasonic sensors”).  
- Professional, data-driven tone; do not project savings for lease-up with very low yards/door or already optimized sites.
