# Agent Usage Guide - WasteWise

## 🚨 CRITICAL RULE: NEVER MAKE CHANGES DIRECTLY

**ALL development work MUST use specialized agents.** Direct code changes skip critical validation and cause runtime failures.

---

## When to Use Agents (ALWAYS)

### ✅ For ANY Code Changes

- UI components → Frontend Agent
- API routes → Backend Agent
- Database schema → Backend Agent
- Skills logic → Skills Agent
- Tests → Testing Agent

### ✅ Before EVERY Commit

- Code Analyzer Agent (validates schema, types, API contracts)

### ❌ NEVER

- Make direct file edits without agent validation
- Skip Code Analyzer before commit
- Assume schema/types without reading migrations/contracts

---

## Agent Selection Matrix

| Task Type             | Agent to Use    | Why                                                                                       |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| **UI Component**      | `frontend-dev`  | Validates against DB schema, ensures type safety, checks responsive design                |
| **API Route**         | `backend-dev`   | Validates request/response shapes, ensures DB query correctness, checks error handling    |
| **Database Schema**   | `backend-dev`   | Validates migrations, ensures constraints are enforceable, checks backwards compatibility |
| **Skill Logic**       | `skills-agent`  | Ports Python logic, ensures conversion rate consistency, validates formulas               |
| **Tests**             | `tester`        | Adds unit/integration/E2E tests, runs evals against Python reference                      |
| **Pre-Commit Review** | `code-analyzer` | **MANDATORY** - Validates everything before commit                                        |
| **Multi-step Tasks**  | `planner`       | Creates implementation plan with proper agent delegation                                  |

---

## Agent Workflow Examples

### Example 1: Create UI Component (Frontend Agent)

**Task**: Create a JobsList component that shows analysis jobs

**CORRECT Approach**:

```
Use frontend-dev agent to create the JobsList component that:
- Fetches jobs from /api/jobs endpoint
- Polls every 2 seconds for active jobs (status: pending/processing)
- Displays job status with colored badges
- Matches API response shape (camelCase format)
- Uses TypeScript strict mode
- Validates against database schema in supabase/migrations/
- Handles error states gracefully
- Shows real-time progress updates

Agent should:
1. Read /api/jobs route to understand response format
2. Read analysis_jobs table schema for field names
3. Create interface matching API response (NOT database schema)
4. Implement SWR polling logic
5. Add proper TypeScript types (no `any`)
6. Validate component compiles with tsc --noEmit
```

**What the Agent Will Do**:

- ✅ Read `app/api/jobs/route.ts` for API response shape
- ✅ Read `supabase/migrations/*.sql` for database schema
- ✅ Create `AnalysisJob` interface matching API (camelCase)
- ✅ Implement component with proper type guards
- ✅ Run `tsc --noEmit` to validate types
- ✅ Check for responsive design issues

**What You Get**:

- Component that actually works at runtime
- No undefined errors from field mismatches
- Proper TypeScript validation
- No SWR polling issues

---

### Example 2: Create API Route (Backend Agent)

**Task**: Add /api/jobs endpoint that returns formatted job data

**CORRECT Approach**:

```
Use backend-dev agent to create /api/jobs route that:
- Fetches analysis_jobs from Supabase for a given projectId
- Transforms snake_case DB fields to camelCase API response
- Returns proper error responses (4xx/5xx)
- Validates against database schema
- Includes proper TypeScript types

Agent should:
1. Read supabase/migrations/ to understand analysis_jobs schema
2. Create route handler with proper error handling
3. Transform DB response from snake_case to camelCase
4. Return consistent API format:
   {
     jobs: [
       {
         id, projectId, jobType, status,
         progress: { percent, currentStep },
         timing: { createdAt, startedAt, completedAt, durationSeconds }
       }
     ]
   }
5. Add TypeScript types for request/response
6. Test with actual database queries
```

**What the Agent Will Do**:

- ✅ Read database schema for exact field names
- ✅ Create transformation function (DB → API format)
- ✅ Add proper error handling
- ✅ Validate response shape matches what frontend expects
- ✅ Test TypeScript compilation

**What You Get**:

- API that returns consistent camelCase format
- No field name mismatches
- Proper error responses
- Type-safe route handler

---

### Example 3: Pre-Commit Review (Code Analyzer - MANDATORY)

**Task**: Review all changes before committing

**CORRECT Approach**:

```
Use code-analyzer agent to review all changes and validate:
- Database schema alignment (forms match CHECK constraints)
- API contract consistency (components match API response shapes)
- Type safety (tsc --noEmit passes)
- No hardcoded values (use constants from formulas.ts)
- Proper type imports (from lib/skills/types.ts)
- Environment variable naming consistency

Agent should:
1. Run tsc --noEmit and report any errors
2. Check all database INSERT/UPDATE operations match schema
3. Verify API response shapes match component interfaces
4. Ensure no duplicate type definitions
5. Validate formula constants are imported (not hardcoded)
6. Check for auth guards on protected pages
```

**What the Agent Will Do**:

- ✅ Run `tsc --noEmit` - MUST pass with 0 errors
- ✅ Check form values vs database CHECK constraints
- ✅ Compare API routes vs component interfaces
- ✅ Find hardcoded values that should be constants
- ✅ Detect duplicate type definitions
- ✅ Validate auth guards exist

**What You Get**:

- Confidence code won't crash at runtime
- No schema mismatches
- No type errors
- No formula drift

**CRITICAL**: Never skip this step. Code Analyzer prevents 95% of runtime issues.

---

## Quality Checklist Per Agent

### Frontend Agent Must Validate:

- [ ] Component types match API responses (not database schema)
- [ ] Form values match database CHECK constraints
- [ ] Imports canonical types (not redefined)
- [ ] Uses constants from `formulas.ts` (not hardcoded)
- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] Responsive design works (375px-1440px)
- [ ] Error states handled gracefully

### Backend Agent Must Validate:

- [ ] API response shape is documented
- [ ] Database queries use correct field names (from migrations)
- [ ] Migrations are read before schema changes
- [ ] Error handling is comprehensive (4xx/5xx responses)
- [ ] Types exported for frontend use
- [ ] Auth checks before user-specific queries

### Code Analyzer Agent Must Check:

- [ ] `tsc --noEmit` passes with 0 errors
- [ ] All database operations match schema
- [ ] API contracts match component expectations
- [ ] No duplicate type definitions
- [ ] Formula constants imported (not hardcoded)
- [ ] Auth guards on protected pages
- [ ] NO `ignoreBuildErrors` in next.config.mjs

---

## Real-World Examples from WasteWise

### ❌ Without Agents (Phase 3 Mistakes)

**Problem 1**: Project creation failed 100% of the time

```typescript
// Direct edit - didn't check schema
property_type: "multifamily"; // ❌ DB expects 'Garden-Style'
status: "active"; // ❌ DB expects 'draft'
```

**Problem 2**: JobsList component broke on SWR polling

```typescript
// Direct edit - didn't match API
interface Job {
  job_type: string; // ❌ API returns jobType (camelCase)
}
```

**Problem 3**: Results dashboard showed "undefined"

```typescript
// Direct edit - assumed field exists
{
  results.dsqMonitorCost?.install;
} // ❌ Skill doesn't return this
```

**All fixed in 30 minutes when using agents properly.**

---

### ✅ With Agents (Correct Approach)

**Frontend Agent**:

```
Task: Create project creation form

Agent actions:
1. Read supabase/migrations/20251114000001_initial_schema.sql
2. Found CHECK constraints:
   - property_type in ('Garden-Style', 'Mid-Rise', 'High-Rise')
   - equipment_type in ('COMPACTOR', 'DUMPSTER', 'MIXED')
   - status in ('draft', 'processing', 'completed', 'failed', 'cancelled')
3. Created form with exact values
4. Ran tsc --noEmit - passed
5. Result: 100% project creation success rate
```

**Backend Agent**:

```
Task: Create /api/jobs endpoint

Agent actions:
1. Read analysis_jobs table schema (snake_case fields)
2. Defined API response format (camelCase)
3. Created transformation function
4. Tested response shape matches frontend interface
5. Result: SWR polling works perfectly
```

**Code Analyzer Agent**:

```
Task: Review before commit

Agent actions:
1. Ran tsc --noEmit - found type mismatches
2. Checked schema alignment - found 3 constraint violations
3. Validated API contracts - found camelCase inconsistencies
4. Scanned for hardcoded constants - found dsqMonitorCost issue
5. Fixed all issues
6. Result: 0 runtime errors
```

---

## Agent Invocation Template

### For Claude

When asking me to use an agent, provide:

```
Please use [AGENT_NAME] to [TASK] that:

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Validation:
- [What to check]
- [What to verify]

The agent should:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### Example Request

```
Please use backend-dev agent to create the /api/analyze endpoint that:

Requirements:
- Accepts projectId and jobType
- Creates analysis_jobs record in database
- Returns jobId to client
- Handles errors with proper 4xx/5xx responses

Validation:
- Check supabase/migrations/ for analysis_jobs schema
- Verify all required fields are included
- Test INSERT operation matches schema

The agent should:
1. Read database schema for analysis_jobs table
2. Create POST route handler
3. Add proper error handling
4. Return consistent response format
5. Validate with tsc --noEmit
```

---

## Benefits of Agent-Based Development

### Without Agents (Direct Edits):

- ❌ Schema mismatches cause 100% failure
- ❌ Type errors hidden until runtime
- ❌ API/component mismatches break features
- ❌ Hardcoded values cause calculation drift
- ❌ Missing validation = production bugs

### With Agents:

- ✅ Schema validated before code written
- ✅ TypeScript errors caught at dev time
- ✅ API contracts enforced
- ✅ Constants imported (no drift)
- ✅ Runtime errors prevented

---

## Summary: The Golden Rule

**Before ANY code change**:

1. ✅ Choose the right agent (Frontend/Backend/Skills)
2. ✅ Agent reads schema/contracts FIRST
3. ✅ Agent validates as it builds
4. ✅ Code Analyzer reviews before commit
5. ✅ `tsc --noEmit` passes with 0 errors

**Never**:

- ❌ Edit files directly
- ❌ Skip agent validation
- ❌ Commit without Code Analyzer review
- ❌ Ignore TypeScript errors

---

**Last Updated**: 2025-11-14
**Version**: 1.0
**Purpose**: Enforce agent-based development to prevent runtime failures
