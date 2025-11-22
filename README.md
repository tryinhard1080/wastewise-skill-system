# WasteWise by THE Trash Hub

[![PR Checks](https://github.com/tryinhard1080/wastewise-skill-system/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/tryinhard1080/wastewise-skill-system/actions/workflows/pr-checks.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Phase](https://img.shields.io/badge/Phase-7%20(85%25)-yellow.svg)](#current-phase)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> AI-powered waste management optimization platform for multifamily properties

**Current Status:** Phase 7 In Progress - Integration Testing & Production Deployment (85% Complete) 🚀

## 🎯 Overview

WasteWise is a skills-based SaaS platform that analyzes waste service invoices, hauler logs, and contracts to identify cost savings opportunities and ensure regulatory compliance for multifamily property portfolios. Built for property managers who want to reduce waste costs by 15-30% through data-driven optimization.

**Key Value Propositions**:
- 📊 Identify over-servicing and reduce waste costs by 15-30%
- 🔍 Validate compliance with local waste ordinances
- 📈 Benchmark performance against industry standards
- 🤖 AI-powered invoice and contract extraction
- 📄 Professional Excel and HTML reports in minutes

## ✨ Features

### 1. Complete Waste Analytics
Full analysis combining compactor optimization, cost benchmarking, contamination tracking, bulk item analysis, and regulatory compliance research.

### 2. Compactor Optimization
Specialized analysis for compacted waste services:
- Calculate capacity utilization (target: 8.5 tons/haul)
- Identify over-servicing (threshold: <6.0 tons/haul)
- Recommend DSQ monitors when appropriate
- Validate sanitary minimums (1-2x weekly)

### 3. Contract Intelligence
Extract critical data from waste service agreements:
- Service specifications and pricing structures
- Contract terms and renewal dates
- Vendor commitments and SLA details
- Rate escalation clauses

### 4. Regulatory Compliance
Automated research of local waste ordinances:
- Recycling and composting requirements
- Container placement regulations
- Reporting obligations
- Compliance checklists with citations

### 5. Batch Processing
Process multiple properties simultaneously:
- Bulk invoice extraction with Claude Vision
- Location-specific Excel tabs
- Validation reports and accuracy metrics
- Consolidated portfolio view

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/wastewise-saas.git
cd wastewise-saas

# Install dependencies
pnpm install

# Setup environment
cp .env.template .env.local
# Edit .env.local with your API keys

# Start Supabase local development
npx supabase start

# Run database migrations
npx supabase db reset

# Start development server
pnpm dev

# Start background worker (in separate terminal)
pnpm worker
```

Visit http://localhost:3000 to see the application.

**Test Credentials** (local development):
- Email: `test@wastewise.local`
- Password: `TestPassword123!`

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 14.x |
| | React | 19.x |
| | TypeScript | 5.x |
| | Tailwind CSS | 3.x |
| | shadcn/ui | Latest |
| **Backend** | Supabase | Latest |
| | PostgreSQL | 15.x |
| | Edge Functions | Deno |
| **AI Services** | Anthropic Claude | Latest |
| | Claude Vision | Invoice extraction |
| | Claude Sonnet | Regulatory research |
| **Reports** | ExcelJS | 4.x |
| | Custom HTML | Chart.js |
| **Testing** | Vitest | 1.x |
| | Playwright | 1.x |
| | Custom Evals | TypeScript |
| **Deployment** | Vercel | Latest |
| | Supabase Cloud | Production |

## 🏗️ Architecture

### Skills-Based System

```
┌─────────────────┐
│   User Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Analyzer│  ← Determines intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Skill Selector  │  ← Routes to appropriate skill
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│            Skill Executor                   │
├─────────────────────────────────────────────┤
│  • wastewise-analytics (complete analysis)  │
│  • compactor-optimization (specialized)     │
│  • contract-extractor (AI-powered)          │
│  • regulatory-research (ordinance lookup)   │
│  • batch-extractor (multi-property)         │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Results       │  ← Excel + HTML reports
└─────────────────┘
```

**Key Design Principles**:
- **Dynamic module loading**: Skills load on-demand at runtime
- **Single responsibility**: Each skill handles one domain
- **Admin-only modifications**: Skills are fixed for all users
- **Versioned configurations**: Formula constants validated on startup

### Async Job Architecture

**Problem Solved**: AI operations take 30s-5 minutes, exceeding API route timeouts.

**Solution**: Background job queue with polling-based status checks:

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

**Benefits**:
- ✅ No timeout issues (jobs can run for hours)
- ✅ Real-time progress tracking
- ✅ Automatic retry on failure
- ✅ Cost tracking per job
- ✅ Horizontal scaling (multiple workers)

### Database Schema

**8 Core Tables**:
- `projects` - Property and analysis metadata
- `project_files` - Uploaded invoices, contracts, haul logs
- `invoice_data` - Extracted line items
- `haul_log` - Service event records
- `optimizations` - Cost-saving recommendations
- `contract_terms` - Extracted contract data
- `regulatory_compliance` - Ordinance research results
- `ordinance_database` - Cached compliance requirements

**Critical Table**: `skills_config`
- Stores validated formula constants (conversion rates, thresholds)
- Synced with `lib/constants/formulas.ts` on startup
- Ensures calculation consistency across system

## 📚 Documentation

### For Users
- **[Getting Started Guide](./docs/user/getting-started.md)** - Signup to first analysis in 7 steps
- **[User Manual](./docs/user/user-manual.md)** - Complete feature reference *(coming soon)*
- **[FAQ](./docs/user/faq.md)** - Common questions and troubleshooting *(coming soon)*

### For Developers
- **[Local Setup](./docs/dev/local-setup.md)** - 15-minute development environment setup
- **[API Documentation](./docs/api/API_DOCUMENTATION_COMPLETE.md)** - Complete API reference
- **[Skills Development](./docs/dev/skills-guide.md)** - Creating new analysis skills *(coming soon)*
- **[Testing Guide](./docs/dev/testing-guide.md)** - Unit tests, E2E, and evals *(coming soon)*
- **[Formula Reference](./WASTE_FORMULAS_REFERENCE.md)** - Canonical calculation formulas

### For DevOps
- **[Staging Deployment](./docs/deployment/staging-deployment.md)** - Deployment runbook with checklists
- **[Production Deployment](./docs/deployment/production-deployment.md)** - Production release process *(coming soon)*
- **[Monitoring Guide](./docs/deployment/monitoring.md)** - Health checks and observability *(coming soon)*

### Architecture Guides
- **[Quality Checklist](./.claude/quality-checklist.md)** - Pre-development validation steps
- **[Git Workflow](./docs/git/GIT_QUICK_REFERENCE.md)** - Branch strategy and merge protocol
- **[Agent Coordination](./.claude/agents/)** - Specialized agent documentation

## 🧪 Testing & Validation

### Test Coverage Requirements
- **Unit tests**: 100% coverage for calculations
- **Integration tests**: All API routes
- **E2E tests**: Complete user workflows
- **Evals**: TypeScript calculations match Python reference (<0.01% deviation)

### Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests (requires running app)
pnpm test:e2e

# Calculation evals
pnpm eval

# All checks (pre-commit)
pnpm test && pnpm tsc --noEmit && pnpm lint
```

### Quality Gates

**Pre-merge requirements** (enforced by CI/CD):
- ✅ All tests passing
- ✅ TypeScript compiles with 0 errors
- ✅ Linting passes
- ✅ Calculation evals pass (<0.01% deviation)
- ✅ Conversion rates validated against reference
- ✅ No console errors in E2E tests

## 🤝 Contributing

### Agent-Based Development

**CRITICAL**: All development uses specialized agents coordinated by an orchestrator. Never make changes directly.

**Agent Selection**:
- **Frontend changes** → Use `frontend-dev` agent
- **Backend changes** → Use `backend-dev` agent
- **Skills changes** → Use `skills-dev` agent
- **Before ANY commit** → Use `code-analyzer` agent
- **Complex tasks** → Use `planner` agent first

### Branch Strategy

**Note**: This repository uses `master` as the main branch (not `main`).

```
master (protected - requires PR + passing checks)
├── frontend/feature-name
├── backend/feature-name
├── skills/feature-name
└── testing/feature-name
```

### Pull Request Process

1. Create feature branch from master
2. Implement changes using appropriate agent
3. Run code-analyzer agent before commit
4. Ensure all quality gates pass
5. Open PR (template auto-fills)
6. Complete ALL checklist items:
   - Type of change specified
   - Tests completed (unit, TypeScript, lint)
   - **Formula validation** (if calculations changed)
   - Database changes documented
   - Agent context specified
7. Wait for automated checks (tests, linting, evals)
8. Merge to master after approval

See [Git Quick Reference](./docs/git/GIT_QUICK_REFERENCE.md) for detailed workflow.

### Code Quality Standards

**Modularity**:
- Max 500 lines per file
- Single responsibility per function
- Clear, descriptive names (no abbreviations)

**Testing**:
- TDD approach (write tests first)
- Evals for all calculations
- E2E for complete workflows

**Documentation**:
- Comment complex logic (explain "why" not "what")
- Use `file:line` references in discussions
- Keep README updated

**Error Handling**:
- Meaningful error messages for users
- Graceful failures (never crash silently)
- Retry logic for API calls (max 3 attempts)

See [Quality Checklist](./.claude/quality-checklist.md) for complete validation steps.

## 🚨 Critical Business Rules

### Non-Negotiable Thresholds

1. **Compactor Optimization**: Average tons/haul < **6.0** tons
   - If avg < 6.0 AND max interval ≤ 14 days → Recommend monitors
   - Target optimization: 8.5 tons/haul

2. **Contamination**: > **3%** of total spend
   - Recommend reduction program if exceeded

3. **Bulk Subscription**: > **$500/month** average
   - Recommend subscription if exceeded

4. **Lease-up Detection**: > **40%** below benchmark
   - NO optimization recommendations if property is in lease-up

### Formula Reference Protocol

**Single Source of Truth**:
- **Documentation**: `WASTE_FORMULAS_REFERENCE.md` (version controlled)
- **Code**: `lib/constants/formulas.ts` (exported constants)
- **Database**: `skills_config` table (validated on startup)

**NEVER Hardcode Formula Values**:

```typescript
// ❌ WRONG - Hardcoded threshold
if (avgTons < 6.0) { ... }

// ✅ CORRECT - Import from canonical source
import { COMPACTOR_OPTIMIZATION_THRESHOLD } from '@/lib/constants/formulas'
if (avgTons < COMPACTOR_OPTIMIZATION_THRESHOLD) { ... }
```

See [Formula Reference](./WASTE_FORMULAS_REFERENCE.md) for complete documentation.

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

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 💬 Support

### For Users
- **Email**: support@thetrashub.com
- **Documentation**: [User Manual](./docs/user/user-manual.md)
- **FAQ**: [Common Questions](./docs/user/faq.md)

### For Developers
- **Issues**: [GitHub Issues](https://github.com/your-org/wastewise-saas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/wastewise-saas/discussions)
- **API Docs**: [Complete API Reference](./docs/api/API_DOCUMENTATION_COMPLETE.md)

### For Enterprise
- **Sales**: sales@thetrashub.com
- **Custom Solutions**: Contact us for portfolio-level integrations

---

**Built with ❤️ by THE Trash Hub**

**Version**: 7.0.0
**Last Updated**: 2025-11-22
**Status**: Phase 7 - Integration Testing & Production Deployment (85% Complete)
