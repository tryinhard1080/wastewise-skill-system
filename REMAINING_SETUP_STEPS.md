# Remaining Setup Steps

**Current Status**: GitHub Actions workflow is live, but needs manual configuration to complete

**Time Required**: 15-20 minutes total

---

## Step 1: Update API Keys in .env.local (5 minutes) 🔴 **REQUIRED**

### Current Issue
`.env.local` still has placeholder values:
- Line 18: `ANTHROPIC_API_KEY=sk-ant-your-actual-key-here` (27 chars ❌)
- Line 29: `EXA_API_KEY=your-exa-key-here` (17 chars ❌)

### Action Required
Open `.env.local` in your editor and replace:

```bash
# Line 18 - Replace this entire line:
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# With your real key (100+ chars, starts with sk-ant-api03-):
ANTHROPIC_API_KEY=sk-ant-api03-[paste-your-full-key-here]
```

```bash
# Line 29 - Replace this entire line:
EXA_API_KEY=your-exa-key-here

# With your real key (40-50 chars):
EXA_API_KEY=[paste-your-full-key-here]
```

### How to Get Keys

**Anthropic** (for invoice extraction, regulatory research):
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key (starts with `sk-ant-api03-`)
4. Paste into `.env.local` line 18

**Exa** (for semantic search of ordinances):
1. Go to: https://dashboard.exa.ai/api-keys
2. Sign up if needed (free tier available)
3. Create new API key
4. Copy the key (40-50 characters)
5. Paste into `.env.local` line 29

### Verify It Works

After updating `.env.local`:

```bash
# Test that keys are loaded
node -e "require('dotenv').config({ path: '.env.local' }); console.log('Anthropic:', process.env.ANTHROPIC_API_KEY.length, 'chars'); console.log('Exa:', process.env.EXA_API_KEY.length, 'chars');"

# Should show:
# Anthropic: 100+ chars ✅
# Exa: 40-50 chars ✅

# Run integration tests
pnpm test:integration

# Should NOT show "x-api-key header is invalid" errors
```

---

## Step 2: Enable Branch Protection on GitHub (5 minutes) 🟡 **RECOMMENDED**

### Why This Matters
Without branch protection:
- ❌ Anyone can push directly to master (bypassing tests)
- ❌ PRs can be merged without passing checks
- ❌ Quality gates are optional, not enforced

With branch protection:
- ✅ All changes MUST go through PR workflow
- ✅ Tests MUST pass before merge
- ✅ Formula validation is enforced
- ✅ Code review is required

### Action Required

1. **Go to**: https://github.com/tryinhard1080/wastewise-skill-system/settings/branches

2. **Click**: "Add branch protection rule"

3. **Configure**:
   - Branch name pattern: `master`

   **Check these boxes**:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals**: 1 (can approve your own for now)
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**

   **Select required status checks** (once workflow runs):
   - ✅ `TypeScript Compilation`
   - ✅ `ESLint`
   - ✅ `Unit Tests`
   - ✅ `Formula & Calculation Validation`
   - ✅ `Build Test`
   - ⏸️ `Integration Tests` (optional - only mark required after secrets added)

4. **Click**: "Create" at bottom

5. **Verify**: Try to push directly to master (should be blocked)

**Detailed guide**: See `docs/git/BRANCH_PROTECTION_SETUP.md`

---

## Step 3: Add GitHub Secrets for CI/CD (5 minutes) 🟡 **RECOMMENDED**

### Why This Matters
Integration tests need API access in GitHub Actions:
- ❌ Without secrets: Integration tests are skipped
- ✅ With secrets: Full test suite runs on every PR

### Action Required

1. **Go to**: https://github.com/tryinhard1080/wastewise-skill-system/settings/secrets/actions

2. **Click**: "New repository secret"

3. **Add these secrets** (use values from your `.env.local`):

   **API Keys**:
   - Name: `ANTHROPIC_API_KEY`
     - Value: (paste your Anthropic key from .env.local line 18)

   - Name: `EXA_API_KEY`
     - Value: (paste your Exa key from .env.local line 29)

   **Supabase** (for database tests):
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `http://127.0.0.1:54321` (or your Supabase project URL)

   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Value: (from .env.local line 10)

   - Name: `SUPABASE_SERVICE_KEY`
     - Value: (from .env.local line 11)

**Security Note**: These secrets are encrypted by GitHub. They're only accessible to GitHub Actions, not visible in logs or to external contributors.

---

## Step 4: Create Test PR to Verify Workflow (5 minutes) 🟢 **OPTIONAL**

### Why This Matters
Validates that GitHub Actions workflow runs correctly:
- ✅ All 9 jobs execute
- ✅ Auto-commenting works
- ✅ Status checks appear on PR
- ✅ Merge blocking works when checks fail

### Action Required

```bash
# 1. Create test branch
git checkout master
git pull origin master
git checkout -b test/verify-github-actions

# 2. Make trivial change
echo "# Testing GitHub Actions Workflow" >> test-ci-verification.md
git add test-ci-verification.md
git commit -m "test: verify GitHub Actions workflow runs on PR"
git push origin test/verify-github-actions

# 3. Create PR on GitHub
# Go to: https://github.com/tryinhard1080/wastewise-skill-system/pulls
# Click "New pull request"
# Base: master, Compare: test/verify-github-actions
# Click "Create pull request"

# 4. Observe workflow
# - Check "Actions" tab: https://github.com/tryinhard1080/wastewise-skill-system/actions
# - Watch 9 jobs run in parallel
# - Check for auto-comments on PR
# - Verify status checks at bottom of PR

# 5. Clean up (after verification)
# Close PR (don't merge - it's just a test)
# Delete branch:
git checkout master
git branch -D test/verify-github-actions
git push origin --delete test/verify-github-actions
```

**Expected Results**:
- ✅ All jobs show green checkmarks
- ✅ Auto-comment appears: "All quality checks passed!"
- ✅ Status checks appear at bottom of PR
- ✅ "Merge pull request" button is enabled (if branch protection not yet enabled)

---

## Step 5: Verify Unit Tests Still Pass (2 minutes) 🟢 **GOOD PRACTICE**

Even without API keys, unit tests should pass:

```bash
pnpm test:unit
```

**Expected**: ✅ 20/20 tests passing

**Current Status**: ✅ Already verified as passing

---

## Quick Status Check

Run this to see what's configured:

```bash
# Check API key lengths
node -e "require('dotenv').config({ path: '.env.local' }); console.log('API Keys Status:'); console.log('Anthropic:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length + ' chars' : 'NOT SET'); console.log('Exa:', process.env.EXA_API_KEY ? process.env.EXA_API_KEY.length + ' chars' : 'NOT SET'); console.log(''); console.log('Expected:'); console.log('Anthropic: 100+ chars'); console.log('Exa: 40-50 chars');"
```

**Current Output**:
```
API Keys Status:
Anthropic: 27 chars ❌ (placeholder)
Exa: 17 chars ❌ (placeholder)

Expected:
Anthropic: 100+ chars
Exa: 40-50 chars
```

---

## Summary

| Step | Priority | Time | Status |
|------|----------|------|--------|
| 1. Update .env.local with real API keys | 🔴 Required | 5 min | ⏸️ **Pending** |
| 2. Enable branch protection | 🟡 Recommended | 5 min | ⏸️ **Pending** |
| 3. Add GitHub Secrets | 🟡 Recommended | 5 min | ⏸️ **Pending** |
| 4. Test PR workflow | 🟢 Optional | 5 min | ⏸️ **Pending** |
| 5. Verify unit tests | 🟢 Good Practice | 2 min | ✅ **Complete** |

**Total Time**: 15-20 minutes

**Blockers**:
1. Real API keys needed in `.env.local` (Step 1)
2. Branch protection and GitHub Secrets are manual GitHub settings (Steps 2-3)

---

## What Happens After Setup

Once all steps are complete:

### For Every PR Created:
1. GitHub Actions automatically runs 9 jobs (2-5 minutes)
2. TypeScript, lint, tests, formula validation, security scan, build
3. Auto-comments on failures with fix instructions
4. Green checkmarks appear when all pass
5. Merge button enabled only if checks pass (with branch protection)

### For Every Commit to Master:
1. Same checks run to verify master stays healthy
2. Deployment pipeline can be added later (Phase 3)

### For Local Development:
1. Run `pnpm test:unit` before committing (fast, 2-5 seconds)
2. Run `pnpm test:integration` before PR (slow, 60-120 seconds, needs API keys)
3. Use `pnpm test:watch` during development (auto-reruns on file changes)

---

## Need Help?

**API Key Issues**: See `API_KEY_SETUP.md`
**Branch Protection**: See `docs/git/BRANCH_PROTECTION_SETUP.md`
**GitHub Actions**: See `GITHUB_PHASE2_COMPLETE.md`
**General Workflow**: See `docs/git/GIT_QUICK_REFERENCE.md`

---

**Next Action**: Update `.env.local` with your real API keys (see Step 1 above)
