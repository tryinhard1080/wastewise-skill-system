# WasteWise Project Instructions

## 🎯 Project Overview

WasteWise is a **skills-based SaaS platform** for waste management optimization in multifamily properties. This is NOT a standard template - it contains specific business logic and critical calculation formulas that MUST be preserved.

**Branding**: "WasteWise by THE Trash Hub" (NEVER "Advantage Waste")

## 🏗️ Architecture

### Skills-Based System
- **Dynamic module loading**: Request type determines which skill executes at runtime
- **5 Core Skills**: wastewise-analytics, compactor-optimization, contract-extractor, regulatory-research, batch-extractor
- **Request Flow**: User Request → Request Analyzer → Skill Selector → Skill Executor → Results
- **Admin-only modifications**: Skills are fixed for all users; only admins/developers can update

### Technology Stack
- **Frontend**: Next.js 14 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI Services**: All via Anthropic (Claude Vision for invoices, Claude Sonnet for regulatory)
- **Reports**: ExcelJS (workbooks) + custom HTML (dashboards)
- **Testing**: Vitest (unit) + Playwright (E2E) + custom evals framework

### Database Schema
8 core tables: `projects`, `project_files`, `invoice_data`, `haul_log`, `optimizations`, `contract_terms`, `regulatory_compliance`, `ordinance_database`

**CRITICAL TABLE**: `skills_config`
```sql
create table skills_config (
  id uuid primary key default uuid_generate_v4(),
  skill_name text unique not null,
  skill_version text not null,
  conversion_rates jsonb not null,
  thresholds jsonb not null,
  enabled boolean default true,
  last_validated timestamp with time zone
);
```

## 🚨 Critical Business Rules (NEVER VIOLATE)

### Non-Negotiable Thresholds

1. **Compactor Optimization**: Average tons/haul < **7.0** (NOT 5 or 6)
   - If avg tons < 7.0 AND max interval ≤ 14 days → Recommend monitors
   - Target optimization: 8.5 tons/haul

2. **Contamination**: > **3%** of total spend
   - Recommend reduction program if exceeded

3. **Bulk Subscription**: > **$500/month** average
   - Recommend subscription if average > $500

4. **Lease-up Detection**: > **40%** below benchmark
   - NO optimization recommendations if property is in lease-up

### Critical Formulas (MUST MATCH PYTHON)

```typescript
// Yards Per Door - Compactor
yardsPerDoor = (totalTons * 14.49) / units

// Yards Per Door - Dumpster
yardsPerDoor = (qty * size * frequency * 4.33) / units

// Cost Per Door
costPerDoor = monthlyTotal / units

// Capacity Utilization (Compactor)
utilization = (avgTonsPerHaul / 8.0) * 100
```

### Conversion Rates (MUST BE CONSISTENT)

**CRITICAL**: These MUST be identical across all skills:
- **Compactor YPD**: 14.49 (from Python reference)
- **Dumpster YPD**: 4.33 (from Python reference)
- **Target compactor capacity**: 8.0 tons
- **Optimization threshold**: <7.0 tons

### Benchmarks by Property Type

| Property Type | Yards/Door/Week | Cost/Door/Month |
|---------------|-----------------|-----------------|
| Garden-Style  | 2.0-2.5         | $15-25          |
| Mid-Rise      | 1.8-2.3         | $12-22          |
| High-Rise     | 1.5-2.0         | $10-20          |

## 🤖 Agent-Orchestrated Development

### Development Workflow

This project uses **specialized agents** coordinated by an orchestrator:

1. **Orchestrator Agent**: Coordinates all development, manages branches, validates merges
2. **Frontend Agent**: UI components, pages, responsiveness (`frontend/*` branches)
3. **Backend Agent**: API routes, database, AI integrations (`backend/*` branches)
4. **Skills Agent**: Port Python logic, ensure conversion rate consistency (`skills/*` branches)
5. **Testing Agent**: Unit tests, E2E tests, evals (`testing/*` branches)

### GitHub Branch Strategy

```
main (protected - requires PR + tests + evals)
├── frontend/landing-rebrand
├── frontend/auth-ui
├── frontend/dashboard-shell
├── frontend/project-wizard
├── frontend/processing-page
├── frontend/results-page
├── backend/initial-schema
├── backend/auth-setup
├── backend/claude-vision-extraction
├── backend/regulatory-research
├── backend/report-generation
├── skills/core-system
├── skills/router-executor
├── skills/[skill-name]
├── testing/framework-setup
└── testing/comprehensive-suite
```

### Merge Protocol

1. Agent creates feature branch
2. Agent commits work
3. Agent opens PR to main
4. **Automated checks** run:
   - Unit tests pass
   - Integration tests pass
   - **Evals pass** (calculations match Python within 0.01%)
   - **Conversion rates validated** (must match reference)
   - No lint errors
5. Orchestrator reviews and approves
6. Merge to main

## 🔧 MCP Integration

### Chrome DevTools MCP
- **Purpose**: Front-end debugging and performance validation
- **Usage**: Validate responsiveness, check console errors, profile performance
- **Install**: `npm install -g chrome-devtools-mcp`
- **Config**: Added to `.claude/mcp-servers.json`

### When to Use Chrome MCP
- Debugging UI layout issues
- Validating mobile responsiveness
- Performance profiling (Lighthouse audits)
- Checking for console errors
- Automated browser testing

## 📝 Code Quality Standards

### Modularity
- **Max 500 lines per file**
- **Single responsibility** per function/component
- **Clear, descriptive names** (no abbreviations unless industry-standard)

### Testing
- **TDD approach**: Write tests before implementation
- **Evals for calculations**: Every calculation must match Python reference
- **E2E for workflows**: Complete user flows tested end-to-end
- **Performance tests**: Lighthouse score >90

### Documentation
- **Comment complex logic** with "why" not "what"
- **Use file:line references** when discussing code
- **Keep README updated** with setup instructions

### Error Handling
- **Meaningful error messages** for users
- **Graceful failures** - never crash silently
- **Retry logic** for API calls (max 3 attempts)
- **Log errors** for debugging

## 🧪 Testing & Validation

### Test Coverage Requirements
- **Unit tests**: 100% coverage for calculations
- **Integration tests**: All API routes
- **E2E tests**: Complete workflows (signup → analysis → download)

### Evals Framework

**Purpose**: Validate TypeScript calculations match Python reference

```typescript
// lib/evals/calculation-evals.ts

// Compare TypeScript output vs Python reference
export async function evaluateCompactorOptimization(
  input: CompactorData,
  expectedOutput: OptimizationResult
): Promise<EvalResult> {
  const tsResult = await calculateCompactorOptimization(input);
  const tolerance = 0.0001; // 0.01% tolerance

  return {
    pass: Math.abs(tsResult.savings - expectedOutput.savings) < tolerance,
    tsValue: tsResult.savings,
    pythonValue: expectedOutput.savings,
    difference: tsResult.savings - expectedOutput.savings
  };
}
```

**Run Before Every Merge**:
- All evals must pass
- Conversion rates must match
- No deviation >0.01%

### Continuous Validation

**Pre-merge checks** (automated in CI/CD):
```yaml
# .github/workflows/validate-merge.yml
- Run unit tests
- Run integration tests
- Run calculation evals
- Validate conversion rates
- Check Lighthouse score >90
- Block merge if any fail
```

## 📦 File Structure

```
wastewise-saas/
├── .claude/
│   ├── CLAUDE.md (this file)
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── frontend-agent.md
│   │   ├── backend-agent.md
│   │   ├── skills-agent.md
│   │   └── testing-agent.md
│   └── mcp-servers.json
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── dashboard/
│   ├── projects/
│   │   ├── new/
│   │   ├── [id]/
│   │   │   ├── processing/
│   │   │   └── results/
│   ├── settings/
│   ├── pricing/
│   ├── api/
│   │   ├── projects/
│   │   ├── extract-invoices/
│   │   ├── analyze-optimizations/
│   │   ├── regulatory-research/
│   │   └── generate-reports/
│   ├── layout.tsx
│   └── page.tsx (landing)
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/
│   ├── dashboard/
│   ├── wizard/
│   ├── processing/
│   ├── results/
│   └── charts/
├── lib/
│   ├── skills/
│   │   ├── registry.ts
│   │   ├── executor.ts
│   │   ├── analyzer.ts
│   │   ├── validator.ts
│   │   └── skills/
│   │       ├── wastewise-analytics.ts
│   │       ├── compactor-optimization.ts
│   │       ├── contract-extractor.ts
│   │       ├── regulatory-research.ts
│   │       └── batch-extractor.ts
│   ├── calculations/
│   │   ├── compactor-optimization.ts
│   │   ├── yards-per-door.ts
│   │   └── benchmarks.ts
│   ├── ai/
│   │   ├── anthropic-client.ts
│   │   ├── invoice-extractor.ts
│   │   └── ordinance-extractor.ts
│   ├── reports/
│   │   ├── excel-generator.ts
│   │   └── html-generator.ts
│   ├── evals/
│   │   ├── calculation-evals.ts
│   │   └── test-data/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── validations/
│   │   └── schemas.ts
│   └── utils/
│       └── formatting.ts
├── supabase/
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── seed.sql
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── waste-skills-complete/ (Python reference implementations)
├── .env.local (git-ignored)
├── .env.template
└── package.json
```

## 🔐 Environment Variables

```bash
# .env.local (never commit)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI Services (all Anthropic)
ANTHROPIC_API_KEY=

# Search (TBD: Exa, Tavily, or cache-first)
SEARCH_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🚀 Quick Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm test                   # Run all tests
pnpm test:unit              # Unit tests only
pnpm test:e2e               # E2E tests only
pnpm eval                   # Run calculation evals

# Database (Supabase CLI)
supabase start              # Start local Supabase
supabase db reset           # Reset database
supabase migration new [name]  # Create migration

# Git Workflow (Agent-based)
git checkout -b frontend/feature-name
# ... make changes ...
git add .
git commit -m "feat(frontend): add feature"
git push origin frontend/feature-name
# Create PR, wait for checks, merge
```

## 📊 Success Metrics

**Calculation Accuracy**:
- All formulas match Python reference within 0.01%
- Conversion rates consistent across all skills
- Evals pass on every commit

**Performance**:
- Lighthouse score >90
- Page load time <2s
- Mobile responsive (375px-1440px)

**Code Quality**:
- 100% test coverage for calculations
- No console errors
- All linters passing
- TypeScript strict mode

**User Experience**:
- Complete workflow: signup → create → process → results → download
- Processing time: <5 minutes
- Download both reports (Excel + HTML) successfully
- Reports match exact specifications from template

## 🎯 Current Phase

**Phase**: 0 - Project Initialization
**Status**: In Progress
**Next Steps**:
1. ✅ Initialize Git repository
2. ✅ Create `.claude/CLAUDE.md`
3. ⏳ Create `.env.template`
4. ⏳ Set up agent definitions
5. ⏳ Configure Anthropic API
6. ⏳ Install Chrome DevTools MCP

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Maintained By**: Orchestrator Agent
