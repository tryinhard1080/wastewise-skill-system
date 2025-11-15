# WasteWise Skill System

> Intelligent skill execution platform for multifamily waste optimization

**Current Status:** Phase 2.1 Complete - Compactor Optimization Vertical Slice ✅

## Overview

WasteWise Skill System is an extensible platform for analyzing multifamily property waste management and providing data-driven optimization recommendations. Built for Greystar and similar property management companies, it uses AI-powered skills to analyze invoices, haul logs, and contracts to identify cost savings opportunities.

### Key Features

- **Skill-Based Architecture**: Modular, extensible design for different analysis types
- **Async Job Processing**: Background workers handle long-running AI operations
- **Formula Compliance**: All calculations aligned with canonical waste management formulas
- **Database-Driven Configuration**: Threshold management via Supabase
- **Type-Safe**: Full TypeScript with generated database types

---

## Architecture

### System Components

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js App   │         │  Background      │         │   Supabase      │
│                 │         │  Worker          │         │   PostgreSQL    │
│  - API Routes   │────────▶│  (scripts/       │────────▶│                 │
│  - UI (Phase 3) │         │   worker.ts)     │         │  - Projects     │
│                 │         │                  │         │  - Analysis Jobs│
└─────────────────┘         └──────────────────┘         │  - Haul Logs    │
        │                            │                    │  - Skill Config │
        │                            │                    └─────────────────┘
        ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│              Skill Execution Layer                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Skill       │  │  Executor    │  │  BaseSkill   │ │
│  │  Registry    │  │              │  │  (Abstract)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  Skills:                                                │
│  ├─ compactor-optimization (Phase 2.1) ✅              │
│  ├─ invoice-extraction (Phase 2.2+) 🚧                 │
│  ├─ regulatory-research (Phase 2.2+) 🚧                │
│  └─ complete-analysis (Phase 3) ⏳                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Job Creation**: API endpoint creates `analysis_job` record (status: pending)
2. **Worker Polling**: Background worker queries pending jobs every 5 seconds
3. **Skill Execution**: Worker loads skill, validates data, executes analysis
4. **Progress Updates**: Real-time progress written to `analysis_jobs` table
5. **Results**: Completed jobs store results in `result_data` JSONB field
6. **Client Polling**: Frontend polls `/api/jobs/[id]` for status updates

---

## Tech Stack

### Core Framework
- **Next.js 14** - App Router, Server Components, API Routes
- **React 19** - UI layer (Phase 3)
- **TypeScript 5** - Strict mode, full type safety

### Database & Auth
- **Supabase** - PostgreSQL, Authentication, Row-Level Security
- **Supabase CLI** - Local development, migrations, type generation

### AI & Analytics (Phase 2.2+)
- **Anthropic Claude API** - Invoice extraction, regulatory research
- **Custom Formulas** - Waste management calculations (YPD, capacity, ROI)

### UI & Styling (Phase 3)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization

### Testing & Quality
- **Vitest** - Unit and integration testing
- **TypeScript Compiler** - Type checking, strict mode

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **pnpm**: v8+ (install via `npm install -g pnpm`)
- **Supabase CLI**: Install via `npm install -g supabase`
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wastewise-skill-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for workers)

4. **Start Supabase locally**
   ```bash
   npx supabase start
   ```

   This will:
   - Start PostgreSQL database
   - Apply all migrations
   - Generate TypeScript types
   - Display connection details

5. **Verify database setup**
   ```bash
   # Check migrations are applied
   npx supabase db diff --schema public

   # Generate/update TypeScript types
   npx supabase gen types typescript --local > types/database.types.ts
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   App will be available at `http://localhost:3000`

7. **Start the background worker** (in a separate terminal)
   ```bash
   pnpm worker
   ```

   Worker will poll for pending analysis jobs every 5 seconds

---

## Development Workflow

### Running Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Database Management

```bash
# Create a new migration
npx supabase migration new <migration-name>

# Apply migrations
npx supabase db reset  # Drops and recreates

# Generate TypeScript types
npx supabase gen types typescript --local > types/database.types.ts

# Open database GUI
npx supabase db inspect
```

### Type Checking

```bash
# Check all TypeScript files
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Worker Development

```bash
# Start worker with auto-reload (via tsx)
pnpm worker

# Test worker with sample job
npx tsx scripts/test-e2e.ts
```

---

## Formula Compliance

All waste calculations follow canonical formulas defined in `lib/constants/formulas.ts`:

### Compactor Optimization Thresholds

| Metric | Value | Description |
|--------|-------|-------------|
| `COMPACTOR_OPTIMIZATION_THRESHOLD` | **6.0 tons** | Average tons/haul below which monitoring is recommended |
| `COMPACTOR_TARGET_TONS` | **8.5 tons** | Target capacity utilization with monitoring |
| `COMPACTOR_MAX_DAYS_BETWEEN` | **14 days** | Maximum pickup interval for optimization eligibility |
| `TONS_TO_YARDS` | **14.49** | Conversion ratio (1 ton = 14.49 cubic yards) |
| `DUMPSTER_YPD` | **4.33** | Yards per door per week (open top containers) |
| `DSQ_MONITOR_INSTALL` | **$800** | One-time installation cost |
| `DSQ_MONITOR_MONTHLY` | **$149** | Monthly monitoring fee |

**Critical Criteria** (ALL must be true for recommendation):
1. Average tons per haul < 6.0
2. Max days between pickups ≤ 14
3. Property has compactor equipment

---

## Project Roadmap

### ✅ Phase 0: Foundation (Complete)
- Next.js 14 project setup
- Supabase integration
- Authentication system
- Database migrations

### ✅ Phase 1: Core Infrastructure (Complete)
- Error handling framework
- Logging and metrics
- Database schema (projects, skill_config, benchmark_standards)
- Formula constants

### ✅ Phase 2.1: Compactor Optimization Vertical Slice (Complete)
**Goal**: End-to-end skill execution with background processing

- ✅ Skill infrastructure (BaseSkill, registry, executor)
- ✅ CompactorOptimizationSkill with ROI calculations
- ✅ Background worker script
- ✅ `analysis_jobs` table with progress tracking
- ✅ Test coverage (unit + E2E script)
- ✅ TypeScript compilation passing

**Current Branch**: `skills/compactor-vertical-slice`

### 🚧 Phase 2.2: API Endpoints (In Progress)
**Goal**: REST API for job management and skill execution

- `/api/analyze` - Create analysis jobs
- `/api/jobs/[id]` - Poll job status
- `/api/jobs/[id]/cancel` - Cancel running jobs
- Error handling and validation
- Rate limiting

### ⏳ Phase 3: UI Components (Planned)
**Goal**: React interface for property managers

- Project creation wizard
- File upload (invoices, contracts, haul logs)
- Real-time job progress indicators
- Results dashboard with visualizations
- Recommendation cards
- Export functionality

### ⏳ Phase 4: Additional Skills (Planned)
**Goal**: Expand skill library

- Invoice extraction (Claude Vision API)
- Regulatory research (Claude + web search)
- Contract analysis
- Complete WasteWise analysis workflow

---

## Configuration

### Skill Configuration

Skills are configured via the `skill_config` table in Supabase:

```sql
-- Example: Compactor optimization thresholds
{
  "skill_name": "compactor-optimization",
  "conversion_rates": {
    "compactorYpd": 14.49,
    "dumpsterYpd": 4.33,
    "targetCapacity": 8.5
  },
  "thresholds": {
    "compactorTons": 6.0,
    "maxDaysBetween": 14
  },
  "costs": {
    "dsqMonitorInstall": 800,
    "dsqMonitorMonthly": 149
  }
}
```

### Worker Configuration

Set via environment variables:

- `WORKER_POLL_INTERVAL_MS` - Polling frequency (default: 5000)
- `WORKER_CONCURRENCY` - Max concurrent jobs (default: 1)

---

## Testing

### Unit Tests

Located in `__tests__/` directory, following the source structure:

```bash
__tests__/
├── skills/
│   ├── compactor-optimization.test.ts
│   ├── executor.test.ts
│   └── registry.test.ts
└── unit/
    └── constants/
        └── formulas.test.ts
```

Run with `pnpm test`

### E2E Test Script

`scripts/test-e2e.ts` provides a full workflow test:

1. Creates test project
2. Adds haul log data
3. Creates analysis job
4. Waits for worker to process
5. Verifies results

**Note**: Requires worker to be running in separate terminal

---

## License

**Private Repository** - All rights reserved

This codebase contains proprietary business logic for Greystar waste management optimization. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Contributing

This is a private repository. For development guidelines:

1. **Branch Naming**: `<type>/<description>` (e.g., `feat/regulatory-research`)
2. **Commit Messages**: Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`)
3. **Testing**: All new skills must include unit tests
4. **Type Safety**: All code must pass `npx tsc --noEmit`
5. **Formulas**: Ensure calculations match `lib/constants/formulas.ts`

---

## Support

For questions or issues:
- **Technical Issues**: Check `lib/observability/logger.ts` for error logs
- **Database Issues**: Run `npx supabase db inspect` for diagnostics
- **Formula Questions**: Refer to WASTE_FORMULAS_REFERENCE.md (if available)

---

**Generated with [Claude Code](https://claude.com/claude-code)**
