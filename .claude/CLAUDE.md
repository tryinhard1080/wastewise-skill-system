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

**Note**: This repository uses `master` as the main branch (not `main`).

```
master (protected - requires PR + tests + evals)
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
3. Agent opens PR to main (template auto-fills from `.github/PULL_REQUEST_TEMPLATE.md`)
4. **Complete ALL PR checklist items**:
   - Type of change specified
   - Related phase checked
   - Testing completed (unit, TypeScript, lint)
   - **Formula validation** (if calculations changed - CRITICAL!)
   - Database changes documented (if schema changed)
   - Code quality checks passed
   - WasteWise-specific validations (container types, conversion rates)
   - Agent context specified
5. **Automated checks** run (once GitHub Actions configured):
   - Unit tests pass (`pnpm test`)
   - TypeScript compiles (`pnpm tsc --noEmit`)
   - Linting passes (`pnpm lint`)
   - **Evals pass** (calculations match Python within 0.01%)
   - **Conversion rates validated** (must match reference)
6. Self-review or orchestrator reviews
7. Merge to master

**Git Workflow Documentation**: See `docs/git/` for complete workflow guides:
- `GIT_QUICK_REFERENCE.md` - Daily workflow cheatsheet
- `GIT_VISUAL_WORKFLOW.md` - Visual diagrams and examples

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

## 🔒 Sandboxing Configuration

### Why Sandbox for WasteWise?

**Security Benefits**:
- ✅ Protection against prompt injection attacks targeting AI agents
- ✅ Automatic blocking of .env, credentials.json, and secrets
- ✅ Network isolation to prevent unauthorized API calls
- ✅ 84% reduction in permission prompts = faster development

**Productivity Benefits**:
- ✅ Agents work autonomously within defined boundaries
- ✅ No interruptions for file operations within project directories
- ✅ Pre-approved network access to Anthropic, Supabase, Upstash

### Quick Start

```
# Enable sandbox with WasteWise defaults
/sandbox
```

This automatically:
- Grants write access to project directories (app, components, lib, tests, docs)
- Denies access to sensitive files (.env, credentials, config.toml)
- Allows network requests to approved domains only
- Excludes git/supabase/docker from sandbox (use standard permissions)

### Sandbox Profiles

WasteWise includes 4 predefined profiles in `.claude/profiles/`:

1. **wastewise-dev.json** (Default)
   - Full project write access
   - All approved APIs
   - For frontend-dev, backend-dev, coder agents

2. **wastewise-testing.json**
   - Test directories only
   - No production databases
   - For tester, reviewer agents

3. **wastewise-docs.json**
   - Documentation directories only
   - No network access needed
   - For documentation work

4. **wastewise-readonly.json**
   - Read-only access
   - Full network for research
   - For Explore, researcher, code-analyzer agents

### Configuration Files

**Main Config**: `.claude/sandbox.json`
- Defines allowed/denied filesystem paths
- Lists approved network domains
- Specifies excluded commands

**Profiles**: `.claude/profiles/*.json`
- Task-specific boundary definitions
- Agent type recommendations
- Security notes and restrictions

### Protected Resources

**Always Denied** (all profiles):
- `.env` and `.env.*` (environment variables)
- `.credentials.json` (OAuth tokens)
- `supabase/config.toml` (database credentials)
- `node_modules/` (dependency modifications)
- `.git/` (version control internals)
- Build artifacts (`.next/`, `dist/`)

**Approved Domains** (dev profile):
- `api.anthropic.com` (Claude AI services)
- `*.supabase.co` (Database and storage)
- `*.upstash.io` (Redis rate limiting)
- `cdn.jsdelivr.net` (Chart.js for reports)
- `api.exa.ai`, `api.tavily.com`, `api.brave.com` (Search APIs)
- `registry.npmjs.org` (Package management)
- `*.github.com` (Version control)

### Violation Monitoring

**Audit Logging**: `lib/observability/sandbox-logger.ts`
- Tracks all boundary violation attempts
- Records approved vs denied access
- Detects suspicious patterns
- Integrates with existing logger

**Access Logs**:
```typescript
import { logFilesystemViolation, getSandboxStats } from '@/lib/observability/sandbox-logger'

// Violations are automatically logged
// View stats via getSandboxStats()
```

### Integration with Security Layers

Sandboxing is **Layer 1** in WasteWise defense-in-depth:

```
Layer 1: Sandbox (filesystem + network isolation)
Layer 2: IAM permissions (tool-level approval)
Layer 3: RLS policies (database-level)
Layer 4: Input sanitization (application-level)
Layer 5: CSP headers (browser-level)
```

All layers work together - sandbox blocks unauthorized access before it reaches other layers.

### Testing Sandbox Compliance

**Test Suite**: `__tests__/security/sandbox-compliance.test.ts`

```bash
# Run sandbox compliance tests
pnpm test __tests__/security/sandbox-compliance.test.ts
```

**Validates**:
- Denied file access actually fails
- Allowed paths work without permission
- Unapproved domains trigger permission requests
- Excluded commands use standard flow

*See docs/SANDBOXING.md for complete configuration guide*

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

## 🔍 Quality Gates & Validation (MANDATORY)

**Added**: 2025-11-14 after Phase 3 critical fixes

**Purpose**: Prevent runtime failures by catching schema/type mismatches at development time

**See**: `.claude/quality-checklist.md` for complete validation steps

### Pre-Development Validation (REQUIRED)

**BEFORE writing code, ALWAYS**:
1. ✅ Read database schema in `supabase/migrations/` for exact constraints
2. ✅ Read API contracts in `app/api/` for response shapes
3. ✅ Import types from `lib/skills/types.ts` (never redefine)
4. ✅ Import constants from `lib/constants/formulas.ts` (never hardcode)

### Agent-Based Development (MANDATORY)

**ALL development MUST use specialized agents** - Never make changes directly.

**Agent Selection**:
- **Frontend changes** → Use `frontend-dev` agent
- **Backend changes** → Use `backend-dev` agent
- **Before ANY commit** → Use `code-analyzer` agent (validates schema, types, API contracts)
- **Complex tasks** → Use `planner` agent first

### Common Pitfalls & Solutions

#### 1. Schema Mismatch ⚠️ CRITICAL
**Problem**: Form values don't match database CHECK constraints → 100% INSERT failures

❌ **WRONG**:
```typescript
property_type: 'multifamily'  // Database expects 'Garden-Style'
equipment_type: 'compactor'   // Database expects 'COMPACTOR' (uppercase)
status: 'active'              // Database expects 'draft'
```

✅ **CORRECT**:
```typescript
// Read supabase/migrations/*.sql FIRST
property_type: 'Garden-Style'  // Exact match to CHECK constraint
equipment_type: 'COMPACTOR'    // Exact case match
status: 'draft'                // Valid enum value
```

#### 2. API Shape Mismatch ⚠️ CRITICAL
**Problem**: Component expects snake_case, API returns camelCase → SWR breaks

❌ **WRONG**:
```typescript
interface Job {
  job_type: string           // API returns jobType
  progress_percent: number   // API returns progress.percent
}
```

✅ **CORRECT**:
```typescript
interface Job {
  jobType: string            // Matches API response
  progress: {
    percent: number          // Nested as API provides
  }
}
```

#### 3. Duplicate Type Definitions ⚠️ HIGH
**Problem**: Redefining types causes field mismatches

❌ **WRONG**:
```typescript
interface CompactorResult {
  dsqMonitorCost?: { install: number }  // Skill doesn't return this
}
```

✅ **CORRECT**:
```typescript
import type { CompactorOptimizationResult } from '@/lib/skills/types'
import { DSQ_MONITOR_INSTALL } from '@/lib/constants/formulas'

// Use imported types and constants
const cost = DSQ_MONITOR_INSTALL
```

### Mandatory Build Checks

#### Pre-Commit (MUST PASS)
```bash
# All must pass with 0 errors
pnpm tsc --noEmit      # TypeScript validation
pnpm lint              # ESLint
pnpm test:unit         # Unit tests
```

#### Never Use
```typescript
// ❌ CRITICAL - These hide errors
typescript: { ignoreBuildErrors: true }
eslint: { ignoreDuringBuilds: true }
```

### Validation Workflow

```
┌─────────────────┐
│ Start Feature   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Read Schema &   │  ← MANDATORY FIRST STEP
│ API Contracts   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Use Agent       │  ← Frontend/Backend/Skills
│ (Not Direct)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Analyzer   │  ← BEFORE COMMIT
│ Agent Review    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ tsc --noEmit    │  ← MUST PASS
│ (0 errors)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commit          │
└─────────────────┘
```

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

### The /validate Command

**Philosophy**: "If `/validate` passes, WasteWise is production-ready"

**Purpose**: Provides 100% confidence that WasteWise works correctly through comprehensive automated testing across five critical phases.

**Quick Start**:
```bash
# Full validation (all 5 phases) - Use before PRs
pnpm validate

# Fast validation (skip E2E tests) - Use before commits
pnpm validate:skip-e2e

# Run specific phase only
pnpm validate:phase=1  # Linting
pnpm validate:phase=2  # Type checking
pnpm validate:phase=3  # Style checking
pnpm validate:phase=4  # Unit tests
pnpm validate:phase=5  # E2E tests
```

**Complete Documentation**: See `docs/VALIDATION.md` for full guide.

### The Five Validation Phases

#### Phase 1: Linting
- **Command**: `pnpm lint`
- **Purpose**: Enforce code quality, catch common errors
- **Expected**: 0 errors, 0 warnings

#### Phase 2: Type Checking
- **Command**: `pnpm tsc --noEmit`
- **Purpose**: Ensure type safety across codebase
- **Expected**: 0 type errors
- **Note**: TypeScript strict mode enabled

#### Phase 3: Style Checking
- **Command**: `pnpm prettier --check .`
- **Purpose**: Maintain consistent code formatting
- **Expected**: All files properly formatted
- **Fix**: Run `pnpm prettier --write .`

#### Phase 4: Unit Testing
- **Command**: `pnpm test:unit`
- **Purpose**: Test calculations, utilities, business logic
- **Expected**: All tests pass, <0.01% deviation from Python reference
- **Critical Tests**:
  - `lib/evals/` - Calculation accuracy
  - `__tests__/skills/` - Skills logic
  - `__tests__/security/` - Security hardening (XSS, file upload, RLS)

#### Phase 5: End-to-End Testing
- **Command**: `pnpm test:e2e`
- **Purpose**: Test complete user workflows
- **Expected**: All 66 E2E tests pass across 8 test suites
- **Workflows Tested**:
  1. User Registration & Login
  2. Create Project
  3. Upload Files
  4. Run Analysis (with job processing)
  5. View Results & Download Reports
  6. Error Handling

### Test Coverage

**Unit Tests** (Phase 4):
- **Skills**: 100% coverage for all 5 skills
- **Calculations**: <0.01% deviation from Python reference
- **Security**: XSS, file upload, RLS, rate limiting

**E2E Tests** (Phase 5):
- **66 total tests** across 8 test suites
- **Complete workflows**: Auth, projects, uploads, analysis, results
- **Performance**: Lighthouse audits, load testing
- **Responsiveness**: 6 viewport sizes

**Integration Tests**:
- **API endpoints**: All routes tested with real data
- **Database**: RLS policies, cascade deletes, constraints
- **External services**: Anthropic AI, Supabase Storage

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

**Run Evals**:
```bash
pnpm eval  # Standalone evals
pnpm validate:phase=4  # Evals + all unit tests
```

### Success Criteria

**If all 5 phases pass**:
- ✅ WasteWise is production-ready
- ✅ All critical user workflows tested
- ✅ All calculations verified accurate
- ✅ All security measures validated
- ✅ Safe to deploy

**If any phase fails**:
- ❌ Do NOT deploy to production
- ❌ Fix failing tests first
- ❌ Re-run `/validate` until all pass

### When to Run Validation

- ✅ **Before every commit**: `pnpm validate:skip-e2e` (30 seconds)
- ✅ **Before every PR**: `pnpm validate` (3-5 minutes)
- ✅ **After major changes**: `pnpm validate`
- ✅ **Before deploying**: `pnpm validate`
- ✅ **In CI/CD**: Automated on PR and merge to master

### Continuous Validation

**Pre-merge checks** (automated in CI/CD):
```yaml
# .github/workflows/validate-merge.yml
- Phase 1: Linting (pnpm lint)
- Phase 2: Type checking (pnpm tsc --noEmit)
- Phase 3: Style checking (pnpm prettier --check .)
- Phase 4: Unit tests + evals (pnpm test:unit)
- Phase 5: E2E tests (pnpm test:e2e)
- Block merge if any fail
```

**Git Pre-commit Hook** (optional):
```bash
# .husky/pre-commit
pnpm validate:skip-e2e || exit 1
```

### Troubleshooting

**Common Issues**:
- Supabase not running → `supabase start`
- Database migrations → `supabase db reset`
- E2E timeouts → Increase timeout in `playwright.config.ts`
- Calculation evals failing → Verify Python reference matches
- Rate limiting tests → Check Upstash Redis configured

**Phase-Specific**:
- Phase 1 failures → `pnpm lint --fix`
- Phase 2 failures → Review TypeScript errors, fix type mismatches
- Phase 3 failures → `pnpm prettier --write .`
- Phase 4 failures → Check test output, verify evals pass
- Phase 5 failures → Run `pnpm test:e2e:debug` to see browser

**Full Troubleshooting Guide**: See `docs/VALIDATION.md`

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
# Validation (Most Important)
pnpm validate               # Full validation (all 5 phases) - Before PRs
pnpm validate:skip-e2e      # Fast validation (skip E2E) - Before commits
pnpm validate:phase=1       # Run specific phase only

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

**Phase**: 7 - Integration Testing & Production Deployment
**Status**: In Progress (85% Complete)
**Started**: 2025-11-17

### Completed Phases (0-6)
- ✅ **Phase 0**: Foundation (Next.js, Supabase, Auth)
- ✅ **Phase 1**: Core Infrastructure (Error handling, logging, database schema)
- ✅ **Phase 2.1**: Compactor Optimization Vertical Slice
- ✅ **Phase 2.2**: API Endpoints with rate limiting
- ✅ **Phase 3-5**: Report generation, async jobs, workers
- ✅ **Phase 6**: Complete Analytics Integration (Excel/HTML reports, frontend results page)

### Phase 7 Progress
**Goal**: Validate entire system through integration testing and prepare for production deployment

**Completed**:
- ✅ Worker startup validation (environment checks)
- ✅ Test data seed script (test user, 250-unit property, 6 invoices, 22 haul logs)
- ✅ All systems running (Supabase, dev server, worker)
- ✅ Automated test framework setup

**In Progress**:
- 🔄 Manual E2E workflow testing (login → analyze → results → download)
- ⏳ API endpoint integration tests
- ⏳ Frontend responsiveness validation
- ⏳ Performance & load testing

**Remaining**:
- Security validation (auth, RLS, input validation)
- Production deployment configuration
- Monitoring & health checks setup
- Documentation (API docs, deployment guide)

### Test Credentials (Local Development)
```bash
# Test User
Email: test@wastewise.local
Password: TestPassword123!

# Test Project
ID: d82e2314-7ccf-404e-a133-0caebb154c7e
Name: Riverside Gardens Apartments
Units: 250 units
Equipment: COMPACTOR
Location: Austin, TX
Data: 6 invoices (Jan-Jun 2025), 22 haul log entries
```

### Production Readiness: 85%
- ✅ Complete end-to-end workflow implemented
- ✅ Real Excel and HTML report generation
- ✅ Async job processing with background workers
- ✅ Frontend results page with downloads
- ✅ Database migrations and RPC functions
- ⏳ Comprehensive integration testing needed
- ⏳ Production deployment configuration needed
- ⏳ Monitoring and health checks needed

**Next Phase**: Phase 8 - Production Launch & User Feedback

---

**Last Updated**: 2025-11-22 (Added comprehensive validation system)
**Version**: 7.1.0
**Maintained By**: Orchestrator Agent
