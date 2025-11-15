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

### Async Job Architecture

**Problem**: AI operations take 30s-5 minutes, exceeding API route timeouts (10s Vercel, 30s self-hosted)

**Solution**: Background job queue with polling-based status checks

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Client    │──1──▶ │ POST /api/   │──2──▶ │ analysis_   │
│  (Browser)  │       │ analyze      │       │ jobs table  │
│             │       └──────────────┘       └─────────────┘
│             │              │                      │
│             │              │ 3. Return job_id     │
│             │◀─────────────┘                      │
│             │                                     │
│             │       ┌──────────────┐              │
│             │──4──▶ │ GET /api/    │──5──────────▶│
│             │       │ jobs/[id]    │              │
│             │       └──────────────┘              │
│             │              │                      │
│   Repeat    │◀─────────6───┘                      │
│  every 2s   │       (status + progress)           │
│             │                                     │
│             │       ┌──────────────┐              │
│             │       │ Background   │──7──────────▶│
│             │       │ Worker       │              │
│             │       │ (picks up    │              │
│             │       │  pending)    │              │
│             │       └──────────────┘              │
│             │              │                      │
│             │              │ 8. Update progress   │
│             │              └─────────────────────▶│
│             │                                     │
│             │              │ 9. Save results      │
│             │              └─────────────────────▶│
└─────────────┘                                     └─────────────┘
```

**Client-Side Pattern**:
```typescript
// 1. Start analysis
const { jobId } = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ projectId })
}).then(r => r.json())

// 2. Poll for status (every 2 seconds)
const pollStatus = async () => {
  const job = await fetch(`/api/jobs/${jobId}`).then(r => r.json())

  if (job.status === 'completed') {
    return job.result_data
  } else if (job.status === 'failed') {
    throw new Error(job.error_message)
  } else {
    // Still processing - show progress
    updateProgressBar(job.progress_percent)
    showCurrentStep(job.current_step)
    setTimeout(pollStatus, 2000)
  }
}
```

**Backend Pattern**:
```typescript
// API Route: Start job
export async function POST(req: Request) {
  const { projectId } = await req.json()

  // Create job record
  const { data: job } = await supabase
    .from('analysis_jobs')
    .insert({
      user_id: userId,
      project_id: projectId,
      job_type: 'complete_analysis',
      status: 'pending',
      input_data: { projectId }
    })
    .select()
    .single()

  // Background worker will pick this up
  return Response.json({ jobId: job.id })
}

// API Route: Check status
export async function GET(req: Request, { params }) {
  const { data: job } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  return Response.json(job)
}
```

**Background Worker** (runs in separate process/container):
```typescript
// Continuously poll for pending jobs
while (true) {
  const { data: jobs } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  if (jobs.length > 0) {
    await processJob(jobs[0])
  }

  await sleep(1000) // Check every second
}

async function processJob(job: AnalysisJob) {
  try {
    // Mark as processing
    await supabase.rpc('start_analysis_job', { job_id: job.id })

    // Execute skill with progress updates
    const result = await executeSkill(job.job_type, job.input_data, {
      onProgress: async (percent, step) => {
        await supabase.rpc('update_job_progress', {
          job_id: job.id,
          new_progress: percent,
          step_name: step
        })
      }
    })

    // Mark as completed
    await supabase.rpc('complete_analysis_job', {
      job_id: job.id,
      result,
      ai_usage: { /* token counts, costs */ }
    })
  } catch (error) {
    // Mark as failed (with retry logic)
    await supabase.rpc('fail_analysis_job', {
      job_id: job.id,
      error_msg: error.message,
      error_cd: error.code
    })
  }
}
```

**Key Benefits**:
- ✅ No timeout issues (jobs can run for hours if needed)
- ✅ Progress tracking (user sees real-time updates)
- ✅ Error handling (retry logic, failure tracking)
- ✅ Cost tracking (AI token usage per job)
- ✅ Scalability (multiple workers can process jobs in parallel)

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

**Formula Reference**: All calculations MUST use formulas from `WASTE_FORMULAS_REFERENCE.md` (v2.0) - the canonical source of truth.

### Non-Negotiable Thresholds

1. **Compactor Optimization**: Average tons/haul < **6.0** (per WASTE_FORMULAS_REFERENCE.md v2.0)
   - If avg tons < 6.0 AND max interval ≤ 14 days → Recommend monitors
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
utilization = (avgTonsPerHaul / 8.5) * 100  // 8.5 = target tons (industry standard)
```

### Conversion Rates (MUST BE CONSISTENT)

**CRITICAL**: These MUST be identical across all skills (per WASTE_FORMULAS_REFERENCE.md):
- **Compactor YPD**: 14.49 (cubic yards per ton: 2000 lbs/ton ÷ 138 lbs/yd³)
- **Dumpster YPD**: 4.33 (weeks per month constant)
- **Target compactor capacity**: 8.5 tons (industry standard midpoint of 8-9)
- **Optimization threshold**: <6.0 tons (canonical per v2.0)

### Formula Reference Protocol

**Single Source of Truth**:
- **Documentation**: `WASTE_FORMULAS_REFERENCE.md` (version controlled, explains derivations)
- **Code**: `lib/constants/formulas.ts` (exported constants used by all calculations)
- **Database**: `skills_config` table (validated on startup, synced with formulas.ts)

**NEVER Hardcode Formula Values**:
```typescript
// ❌ WRONG - Hardcoded threshold
if (avgTons < 6.0) { ... }

// ✅ CORRECT - Import from canonical source
import { COMPACTOR_OPTIMIZATION_THRESHOLD } from '@/lib/constants/formulas'
if (avgTons < COMPACTOR_OPTIMIZATION_THRESHOLD) { ... }
```

**When Formulas Must Change**:
1. Update `WASTE_FORMULAS_REFERENCE.md` with new value and justification
2. Update `lib/constants/formulas.ts` with new constant value
3. Run `FORMULA_CHANGE_CHECKLIST.md` to validate all affected areas
4. Update database seed data and migrations
5. Update all agent documentation (orchestrator, backend, skills, testing)
6. Run full eval suite to ensure calculations still match expected results
7. Update test fixtures and expected values
8. Document the change in git commit with clear rationale

**Validation Requirements**:
- Runtime validation: `validateFormulaConstants()` runs on app startup
- Test validation: Evals compare TypeScript vs Python reference (<0.01% tolerance)
- Database validation: Skills config must match formulas.ts values
- Documentation validation: All agent docs reference formulas.ts, not hardcoded values

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

### Phased Quality Enforcement (NEW - Phase 1.5)

**Philosophy**: Start light, add rigor progressively as codebase matures.

**Phase 1.5 (Foundation - Current)**:
- ✅ Core types defined (Skill interface, SkillContext, SkillResult)
- ✅ Base skill class with common functionality
- ✅ Structured logging (logger)
- ✅ Standardized error types (AppError hierarchy)
- ✅ Basic metrics tracking (in-memory)
- ✅ Async job infrastructure (analysis_jobs table)
- ⏸️ **Not enforced yet**: Strict type coverage, 100% test coverage, mandatory evals

**Phase 2 (Implementation)**:
- Implement concrete skills using BaseSkill class
- Use logger and error types consistently
- Track metrics for skill executions
- Begin writing unit tests (no coverage requirements yet)

**Phase 3 (Validation)**:
- Run evals on completed skills
- Fix calculation discrepancies
- Add integration tests for API routes
- Enforce <0.01% deviation tolerance

**Phase 4 (Production Readiness)**:
- ✅ 100% test coverage for calculations
- ✅ All evals passing
- ✅ Lighthouse score >90
- ✅ Security audit complete
- ✅ Error handling comprehensive
- ✅ Monitoring integrated (replace console with service)

**Current Expectations (Phase 1.5)**:
- **DO**: Use provided types and base classes when creating new skills
- **DO**: Use logger for important events (errors, job progress)
- **DO**: Use standardized error types in API routes
- **DO**: Track metrics for AI usage and execution time
- **DON'T**: Worry about perfect test coverage yet
- **DON'T**: Block on missing evals (write placeholder tests)
- **DON'T**: Over-engineer observability (console logging is fine for now)

**Example of Gradual Adoption**:

```typescript
// Phase 1.5: Basic implementation with new infrastructure
import { BaseSkill } from '@/lib/skills/base-skill'
import { logger } from '@/lib/observability/logger'
import { metrics } from '@/lib/observability/metrics'
import type { SkillContext, SkillResult } from '@/lib/skills/types'

export class MySkill extends BaseSkill<MyResult> {
  readonly name = 'my-skill'
  readonly version = '1.0.0'
  readonly description = 'Example skill'

  protected async executeInternal(context: SkillContext): Promise<MyResult> {
    // Use logger for key events
    logger.info('Starting skill execution', { skillName: this.name, projectId: context.projectId })

    // Track metrics
    const timerId = metrics.startTimer('skill.my-skill.execution')

    try {
      // ... business logic here ...

      const result = { /* ... */ }

      metrics.stopTimer(timerId)
      metrics.increment('skill.my-skill.success')

      return result
    } catch (error) {
      metrics.stopTimer(timerId)
      metrics.increment('skill.my-skill.failed')

      logger.error('Skill execution failed', error as Error, { skillName: this.name })
      throw error
    }
  }
}

// Phase 2: Add proper validation
async validate(context: SkillContext): Promise<ValidationResult> {
  // ... add skill-specific validation ...
}

// Phase 3: Add comprehensive tests and evals
// __tests__/skills/my-skill.test.ts
// lib/evals/my-skill-eval.ts

// Phase 4: Production hardening
// - Add performance monitoring
// - Integrate with error tracking service (Sentry)
// - Add rate limiting
// - Security audit
```

**Benefits of This Approach**:
- ✅ Move fast without being blocked by testing requirements
- ✅ Build good patterns from the start (types, errors, logging)
- ✅ Avoid technical debt (structured foundation in place)
- ✅ Can tighten enforcement later (types already exist)
- ✅ Focus on business logic first (UX and calculations)

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
