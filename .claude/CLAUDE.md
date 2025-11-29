# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WasteWise is a skills-based SaaS platform for waste management optimization in multifamily properties. It uses AI to extract invoice data, analyze optimization opportunities, research regulatory compliance, and generate comprehensive reports.

**Branding**: "WasteWise by THE Trash Hub" (NEVER "Advantage Waste")

## Commands

```bash
# Development
pnpm dev                # Start Next.js dev server (http://localhost:3000)
pnpm worker             # Start background job worker (separate terminal)

# Testing
pnpm test               # Run all Vitest tests
pnpm test:unit          # Unit tests only (skills, calculations)
pnpm test:integration   # Integration tests only
pnpm test:watch         # Watch mode
pnpm test:e2e           # Run E2E tests with Puppeteer
pnpm test:ui            # Run E2E with visible browser

# Build & Lint
pnpm build              # Production build
pnpm lint               # ESLint
pnpm tsc --noEmit       # TypeScript validation (0 errors required)

# Database (Supabase CLI)
supabase start          # Start local Supabase
supabase db reset       # Reset database
supabase migration new [name]  # Create migration

# Data Seeding
pnpm seed               # Seed test project with sample data
```

## Architecture

### Skills-Based System
Request type determines which skill executes at runtime:
- **wastewise-analytics**: Full analysis orchestrator
- **compactor-optimization**: Compactor monitoring recommendations
- **contract-extractor**: Contract term extraction via Claude Vision
- **batch-extractor**: Invoice/haul log extraction via Claude Vision
- **regulatory-research**: Municipal ordinance research

Skills are located in `lib/skills/skills/` and implement the `Skill` interface from `lib/skills/types.ts`.

### Async Job Architecture
AI operations exceed API route timeouts (10s Vercel, 30s self-hosted), so we use:
1. **API creates job** → `POST /api/analyze` inserts into `analysis_jobs` table
2. **Client polls status** → `GET /api/jobs/[id]` every 2 seconds
3. **Worker processes** → `pnpm worker` picks up pending jobs and executes skills
4. **Progress updates** → Worker calls `onProgress` callback to update job status

### Key Directories
- `app/api/` - API routes (Next.js App Router)
- `lib/skills/` - Skill system (types, registry, executor, implementations)
- `lib/constants/formulas.ts` - **CANONICAL** calculation constants (never hardcode values)
- `lib/reports/` - Excel and HTML report generation
- `lib/workers/` - Background job processor
- `supabase/migrations/` - Database schema (CHECK constraints define valid enum values)

## Critical Business Rules

### Formula Constants (from `lib/constants/formulas.ts`)
**NEVER hardcode these values - always import from formulas.ts:**
- `TONS_TO_YARDS = 14.49` - cubic yards per ton
- `WEEKS_PER_MONTH = 4.33` - industry standard
- `COMPACTOR_OPTIMIZATION_THRESHOLD = 6.0` - recommend monitors if avg tons/haul < 6.0
- `COMPACTOR_TARGET_TONS = 8.5` - target capacity
- `CONTAMINATION_THRESHOLD_PCT = 0.03` - 3% of spend triggers recommendation
- `BULK_SUBSCRIPTION_THRESHOLD = 500` - $500/month triggers subscription recommendation

### Key Formulas
```typescript
// Yards per door (compactor): (total_tons × 14.49) / units
import { calculateCompactorYardsPerDoor } from '@/lib/constants/formulas'

// Yards per door (dumpster): (qty × size × freq × 4.33) / units
import { calculateDumpsterYardsPerDoor } from '@/lib/constants/formulas'

// Recommend compactor monitors if:
// avgTonsPerHaul < 6.0 AND maxDaysBetween <= 14 AND hasCompactor
import { shouldRecommendMonitoring } from '@/lib/constants/formulas'
```

### Database Schema Constraints
Read `supabase/migrations/*.sql` before writing code - forms must match CHECK constraints exactly:
```sql
-- property_type: 'Garden-Style' | 'Mid-Rise' | 'High-Rise' (exact case)
-- equipment_type: 'COMPACTOR' | 'DUMPSTER' | 'OPEN_TOP' (uppercase)
-- status: 'draft' | 'processing' | 'completed' | 'failed'
```

## Development Workflow

### Before Writing Code
1. Read database schema in `supabase/migrations/` for exact constraints
2. Read API contracts in `app/api/` for response shapes
3. Import types from `lib/skills/types.ts` (never redefine)
4. Import constants from `lib/constants/formulas.ts` (never hardcode)

### Pre-Commit Validation (MUST PASS)
```bash
pnpm tsc --noEmit      # 0 type errors
pnpm lint              # 0 lint errors
pnpm test:unit         # All tests pass
```

### Common Pitfalls
1. **Schema mismatch**: Form values don't match DB CHECK constraints → 100% INSERT failures
2. **Case sensitivity**: `'compactor'` vs `'COMPACTOR'` - check migrations
3. **API shape mismatch**: Component expects snake_case but API returns camelCase
4. **Duplicate types**: Redefining types instead of importing from `lib/skills/types.ts`

## Testing

### Test Structure
- `__tests__/skills/` - Skill unit tests
- `__tests__/calculations/` - Formula calculation tests
- `__tests__/integration/` - API route integration tests
- `scripts/test-e2e.ts` - End-to-end workflow tests

### Test Credentials (Local Development)
```
Email: test@wastewise.local
Password: TestPassword123!
Test Project ID: d82e2314-7ccf-404e-a133-0caebb154c7e
```

### Evals Framework
TypeScript calculations must match Python reference within 0.01% tolerance. See `lib/evals/` for validation tests.

## Git Workflow

**Main branch**: `master` (not `main`)

**Branch naming**: `{agent}/{feature}` (e.g., `frontend/auth-ui`, `backend/report-generation`)

**Commit message format**:
```
feat(scope): add feature
fix(scope): fix bug
docs(scope): update documentation
```

## Environment Variables

Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
```

## Key Types

All skill implementations must use types from `lib/skills/types.ts`:
- `Skill<TResult>` - Core skill interface
- `SkillContext` - Execution context with project data
- `SkillResult<TData>` - Standardized result shape
- `CompactorOptimizationResult` - Compactor analysis output
- `WasteWiseAnalyticsCompleteResult` - Full analysis output

## Report Generation

Reports are generated in `lib/reports/`:
- `excel-generator.ts` - 8-tab Excel workbook (ExcelJS)
- `html-generator.ts` - 6-tab interactive HTML dashboard
- Reports are stored in Supabase Storage under `reports/{projectId}/`

Excel tabs: SUMMARY, SUMMARY_FULL, EXPENSE_ANALYSIS, HAUL_LOG, OPTIMIZATION, CONTRACT_TERMS, REGULATORY_COMPLIANCE, INSTRUCTIONS

HTML tabs: Dashboard, Expense Analysis, Haul Log, Optimization, Contract Terms, Regulatory Compliance
