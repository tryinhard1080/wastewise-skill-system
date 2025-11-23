# Local Development Setup

This guide will get you up and running with WasteWise local development in approximately **15 minutes**.

**Target Audience**: Developers joining the project or setting up a new machine

---

## Prerequisites

Ensure you have the following installed before proceeding:

### Required Software

| Tool               | Version               | Installation                                                                    |
| ------------------ | --------------------- | ------------------------------------------------------------------------------- |
| **Node.js**        | 18+ (20+ recommended) | [Download](https://nodejs.org/)                                                 |
| **pnpm**           | 8+                    | `npm install -g pnpm`                                                           |
| **Git**            | Latest                | [Download](https://git-scm.com/)                                                |
| **Supabase CLI**   | Latest                | `npm install -g supabase`                                                       |
| **Docker Desktop** | Latest                | [Download](https://www.docker.com/products/docker-desktop) (for Supabase local) |

### Optional But Recommended

| Tool          | Purpose      | Installation                               |
| ------------- | ------------ | ------------------------------------------ |
| **VS Code**   | Code editor  | [Download](https://code.visualstudio.com/) |
| **TablePlus** | Database GUI | [Download](https://tableplus.com/)         |
| **Postman**   | API testing  | [Download](https://www.postman.com/)       |

### Verify Installation

```bash
# Check versions
node --version   # Should be v18 or higher
pnpm --version   # Should be 8 or higher
git --version    # Any recent version
supabase --version  # Should show installed
docker --version # Should show installed

# If any command fails, install the missing tool
```

---

## Step 1: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/your-org/wastewise-saas.git
cd wastewise-saas

# Or clone via SSH (if you have SSH keys set up)
git clone git@github.com:your-org/wastewise-saas.git
cd wastewise-saas

# Verify you're on master branch
git branch
# Should show: * master
```

---

## Step 2: Install Dependencies

```bash
# Install all project dependencies
pnpm install

# This will install:
# - Next.js and React
# - TypeScript and type definitions
# - Supabase client libraries
# - UI components (shadcn/ui, Tailwind)
# - Testing frameworks (Vitest, Playwright)
# - Development tools (ESLint, Prettier)

# Wait for installation to complete (1-3 minutes)
```

**Expected Output**:

```
Progress: resolved XXX, reused XXX, downloaded XXX
Packages: +XXX
++++++++++++++++++++++++++++++++++++++++++
Done in XXs
```

---

## Step 3: Setup Environment Variables

### Copy Template

```bash
# Copy the environment template
cp .env.template .env.local

# Open .env.local in your editor
code .env.local  # VS Code
# or
nano .env.local  # Terminal editor
```

### Configure Environment Variables

Edit `.env.local` with the following values:

```bash
# ============================================
# Supabase Configuration
# ============================================

# Public Supabase URL (will be set after Step 4)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Public anon key (will be set after Step 4)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key for server-side operations (will be set after Step 4)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# AI Services
# ============================================

# Anthropic API key for Claude Vision and Sonnet
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ============================================
# Search Service (Optional)
# ============================================

# Exa API key for regulatory research
# Get from: https://exa.ai/
# Leave empty if not using regulatory compliance features
EXA_API_KEY=your-exa-key-here

# ============================================
# App Configuration
# ============================================

# Application URL (local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node environment
NODE_ENV=development

# Worker polling interval (milliseconds)
WORKER_POLL_INTERVAL_MS=5000

# Worker concurrency (number of jobs to process simultaneously)
WORKER_CONCURRENCY=1
```

**Important Notes**:

- **Supabase keys**: Will be automatically generated in Step 4
- **ANTHROPIC_API_KEY**: **Required** for invoice extraction and analysis
  - Sign up at https://console.anthropic.com/
  - Create an API key
  - Add credits to your account ($5 minimum)
- **EXA_API_KEY**: Optional (only needed for regulatory compliance skill)
- **Never commit `.env.local`**: Already in `.gitignore`

---

## Step 4: Start Supabase Local

Supabase provides a complete local development environment including PostgreSQL, authentication, storage, and realtime subscriptions.

### Initialize Supabase

```bash
# Start all Supabase services
npx supabase start

# This will:
# 1. Download Docker images (first time only, ~2-5 minutes)
# 2. Start PostgreSQL database
# 3. Start Auth service
# 4. Start Storage service
# 5. Start Realtime service
# 6. Start Studio (web UI)
# 7. Apply all migrations
# 8. Generate TypeScript types
```

**Expected Output** (after initialization):

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Environment Variables

Copy the **anon key** and **service_role key** from the output above into your `.env.local`:

```bash
# Update these in .env.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Access Supabase Studio

Open http://127.0.0.1:54323 in your browser to access the Supabase Studio UI:

- **Table Editor**: View and edit database records
- **SQL Editor**: Run custom queries
- **Auth**: Manage users
- **Storage**: View uploaded files
- **Logs**: Monitor activity

---

## Step 5: Run Database Migrations

The database schema is managed through migrations in `supabase/migrations/`.

### Apply Migrations

```bash
# Reset database to apply all migrations
npx supabase db reset

# This will:
# 1. Drop existing database
# 2. Recreate from scratch
# 3. Apply all migrations in order
# 4. Run seed data (if exists)
```

**Expected Output**:

```
Resetting local database...
Applying migration 20240101000000_initial_schema.sql...
Applying migration 20240102000000_add_analysis_jobs.sql...
...
Finished supabase db reset.
```

### Verify Schema

```bash
# Check that all tables exist
npx supabase db inspect

# Expected tables:
# - projects
# - project_files
# - analysis_jobs
# - invoice_data
# - haul_log
# - optimizations
# - contract_terms
# - regulatory_compliance
# - ordinance_database
# - skills_config
# - benchmark_standards
```

### Generate TypeScript Types

```bash
# Generate types from database schema
npx supabase gen types typescript --local > types/database.types.ts

# This creates strongly-typed interfaces for all database tables
```

**Verify**: Check that `types/database.types.ts` was created/updated.

---

## Step 6: Start the Development Server

```bash
# Start Next.js development server
pnpm dev

# Expected output:
#   ▲ Next.js 14.x.x
#   - Local:        http://localhost:3000
#   - Environments: .env.local
#
# ✓ Ready in X.Xs
```

### Verify Application

1. Open http://localhost:3000 in your browser
2. You should see the WasteWise landing page
3. Check for console errors (F12 → Console)
   - Should be no errors
   - May see info messages (normal)

### Common Issues

**Port 3000 already in use**:

```bash
# Kill existing process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

**TypeScript errors**:

```bash
# Run type check
npx tsc --noEmit

# Should show 0 errors
```

**Supabase connection error**:

```bash
# Verify Supabase is running
npx supabase status

# If not running, start it
npx supabase start
```

---

## Step 7: Start the Background Worker

The background worker processes analysis jobs asynchronously.

### Open a New Terminal

Keep the dev server running in the first terminal, and open a new terminal:

```bash
# Navigate to project directory
cd wastewise-saas

# Start the worker
pnpm worker

# Expected output:
# [YYYY-MM-DD HH:MM:SS] Starting WasteWise background worker...
# [YYYY-MM-DD HH:MM:SS] Environment check passed
# [YYYY-MM-DD HH:MM:SS] Database connection established
# [YYYY-MM-DD HH:MM:SS] Worker started - polling every 5000ms
# [YYYY-MM-DD HH:MM:SS] Waiting for jobs...
```

### What the Worker Does

The worker:

1. Polls the `analysis_jobs` table every 5 seconds
2. Picks up jobs with status = 'pending'
3. Executes the appropriate skill (compactor-optimization, complete-analysis, etc.)
4. Updates job progress in real-time
5. Saves results when complete
6. Handles errors and retries

### Worker Logs

You'll see logs like:

```
[YYYY-MM-DD HH:MM:SS] Polling for jobs... (0 pending)
[YYYY-MM-DD HH:MM:SS] Found job: abc-123-def (complete_analysis)
[YYYY-MM-DD HH:MM:SS] Starting skill execution...
[YYYY-MM-DD HH:MM:SS] Progress: 25% - Extracting invoice data
[YYYY-MM-DD HH:MM:SS] Progress: 50% - Analyzing compactor utilization
[YYYY-MM-DD HH:MM:SS] Progress: 75% - Generating reports
[YYYY-MM-DD HH:MM:SS] Progress: 100% - Complete
[YYYY-MM-DD HH:MM:SS] Job completed successfully
```

### Stop the Worker

Press `Ctrl+C` to gracefully shutdown the worker.

---

## Verify Your Setup

### Create Test Data

```bash
# Seed test data (test user + sample project)
npx tsx scripts/seed-test-data.ts

# This creates:
# - Test user (test@wastewise.local / TestPassword123!)
# - Sample project (Riverside Gardens, 250 units)
# - 6 sample invoices (Jan-Jun 2025)
# - 22 haul log entries
```

### Test the Full Workflow

1. **Open the app**: http://localhost:3000
2. **Sign in** with test credentials:
   - Email: `test@wastewise.local`
   - Password: `TestPassword123!`
3. **Navigate** to Dashboard
4. **Find** the "Riverside Gardens" project
5. **Click** "Start Analysis"
6. **Watch** the progress in real-time
7. **Download** reports when complete

### Expected Results

After ~2-3 minutes, you should see:

- **Status**: Complete ✅
- **Excel Report**: Ready for download
- **HTML Dashboard**: Ready for download
- **Results Summary**:
  - Yards Per Door: ~3.51
  - Cost Per Door: ~$18.50/month
  - Recommendations: DSQ monitors (if applicable)

### Verify Logs

Check both terminals:

- **Dev Server**: API requests logged
- **Worker**: Job processing logged

No errors should appear. Warnings are OK.

---

## Development Workflow

Now that everything is running, here's your typical workflow:

### Daily Development

```bash
# Terminal 1: Start Supabase (if not already running)
npx supabase start

# Terminal 2: Start dev server
pnpm dev

# Terminal 3: Start worker
pnpm worker

# Now you can:
# - Edit code (auto-reload)
# - Test in browser (http://localhost:3000)
# - View database (http://127.0.0.1:54323)
# - Check API logs (Terminal 2)
# - Check worker logs (Terminal 3)
```

### Making Database Changes

```bash
# Create a new migration
npx supabase migration new add_new_column

# Edit the generated file in supabase/migrations/

# Apply the migration
npx supabase db reset

# Regenerate types
npx supabase gen types typescript --local > types/database.types.ts
```

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests (watch mode)
pnpm test:watch

# TypeScript type check
npx tsc --noEmit

# Linting
pnpm lint

# All checks (pre-commit)
pnpm test && npx tsc --noEmit && pnpm lint
```

### Code Quality

Before committing:

```bash
# 1. Run all tests
pnpm test

# 2. Check TypeScript
npx tsc --noEmit

# 3. Lint code
pnpm lint

# 4. Format code (if Prettier configured)
pnpm format

# All must pass with 0 errors
```

---

## Troubleshooting

### Supabase Won't Start

**Error**: `Cannot start Supabase`

**Solution**:

```bash
# Check Docker is running
docker ps

# If Docker not running, start Docker Desktop

# Try starting Supabase again
npx supabase start
```

### Worker Not Processing Jobs

**Error**: Worker logs show "Waiting for jobs..." but nothing happens

**Solutions**:

1. **Check environment variables**:

   ```bash
   # Verify SUPABASE_SERVICE_ROLE_KEY is set
   echo $SUPABASE_SERVICE_ROLE_KEY  # Mac/Linux
   echo %SUPABASE_SERVICE_ROLE_KEY% # Windows
   ```

2. **Check API key**:

   ```bash
   # Verify ANTHROPIC_API_KEY is set
   echo $ANTHROPIC_API_KEY
   ```

3. **Check database connection**:
   - Open Supabase Studio: http://127.0.0.1:54323
   - Check `analysis_jobs` table
   - Verify job exists with status='pending'

4. **Restart worker**:
   ```bash
   # Press Ctrl+C to stop
   # Then restart
   pnpm worker
   ```

### TypeScript Errors

**Error**: `Type 'X' is not assignable to type 'Y'`

**Solutions**:

1. **Regenerate database types**:

   ```bash
   npx supabase gen types typescript --local > types/database.types.ts
   ```

2. **Check imports**:
   - Verify you're importing from `@/types/database.types`
   - Verify you're importing from `@/lib/skills/types` for skill types

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Database Migration Errors

**Error**: `Migration failed`

**Solution**:

```bash
# Check migration syntax
cat supabase/migrations/XXXXXX_migration_name.sql

# Reset and try again
npx supabase db reset

# If still fails, check Supabase Studio SQL Editor
# Run the migration manually to see detailed error
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solutions**:

1. **Kill the process**:

   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

2. **Use different port**:
   ```bash
   pnpm dev -- -p 3001
   ```

### Authentication Errors

**Error**: `Invalid JWT` or `User not found`

**Solutions**:

1. **Check Supabase keys**:
   - Verify `.env.local` has correct anon key and service role key
   - Compare with output from `npx supabase status`

2. **Reset test user**:

   ```bash
   npx tsx scripts/seed-test-data.ts
   ```

3. **Check RLS policies** in Supabase Studio:
   - Go to Table Editor → Click table → RLS tab
   - Ensure policies are enabled

---

## Next Steps

Congratulations! Your local development environment is fully set up.

### Explore the Codebase

- **[Architecture Documentation](./.claude/CLAUDE.md)** - Complete project structure
- **[API Documentation](../api/API_DOCUMENTATION_COMPLETE.md)** - API reference
- **[Formula Reference](../../WASTE_FORMULAS_REFERENCE.md)** - Calculation formulas
- **[Git Workflow](../git/GIT_QUICK_REFERENCE.md)** - Branching and merging

### Start Developing

1. **Pick a task** from the project board
2. **Create a branch** following naming conventions:
   - `frontend/feature-name`
   - `backend/feature-name`
   - `skills/feature-name`
3. **Make changes** and test locally
4. **Run quality checks** before committing
5. **Open a PR** when ready

### Agent-Based Development

**IMPORTANT**: This project uses agent-based development:

- **Frontend changes** → Use `frontend-dev` agent
- **Backend changes** → Use `backend-dev` agent
- **Skills changes** → Use `skills-dev` agent
- **Before commits** → Use `code-analyzer` agent

See [Agent Coordination](./.claude/agents/) for details.

### Join the Team

- **Slack**: #wastewise-dev
- **Standup**: Daily at 10am ET
- **Sprint Planning**: Mondays at 2pm ET
- **Code Reviews**: Submit PRs by Thursday for Friday review

---

## Useful Commands Reference

```bash
# Development
pnpm dev                           # Start dev server
pnpm worker                        # Start background worker
pnpm test                          # Run unit tests
pnpm test:watch                    # Run tests in watch mode
npx tsc --noEmit                   # Type check
pnpm lint                          # Lint code

# Database
npx supabase start                 # Start Supabase
npx supabase stop                  # Stop Supabase
npx supabase status                # Check status
npx supabase db reset              # Reset database
npx supabase migration new <name>  # Create migration
npx supabase gen types typescript --local > types/database.types.ts

# Testing
npx tsx scripts/seed-test-data.ts  # Create test data
npx tsx scripts/test-e2e.ts        # Run E2E test

# Debugging
npx supabase db inspect            # Database diagnostics
curl http://localhost:3000/api/health  # Health check
```

---

## Additional Resources

### Documentation

- **[User Guide](../user/getting-started.md)** - User perspective
- **[Deployment Guide](../deployment/staging-deployment.md)** - Staging deployment
- **[Quality Checklist](./.claude/quality-checklist.md)** - Pre-development validation

### External Links

- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)** - Language reference
- **[Anthropic API Docs](https://docs.anthropic.com/)** - Claude AI integration

### Support

- **Technical Issues**: #wastewise-dev on Slack
- **Questions**: Ask in daily standup
- **Bugs**: Create GitHub issue with `bug` label
- **Feature Requests**: Create GitHub issue with `enhancement` label

---

**Built with ❤️ by THE Trash Hub**

**Last Updated**: 2025-11-22
**Version**: 1.0.0
