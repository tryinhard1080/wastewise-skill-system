# Branch Protection Setup Guide

**Purpose**: Prevent direct commits to master branch and enforce PR workflow

**Time Required**: 5 minutes

**Status**: ⚠️ Manual setup required (one-time configuration)

---

## Quick Setup (Recommended Settings)

### Step 1: Navigate to Branch Protection Settings

**URL**: https://github.com/tryinhard1080/wastewise-skill-system/settings/branches

Or navigate manually:

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar)
4. Look for "Branch protection rules" section

### Step 2: Add Protection Rule

1. Click **Add branch protection rule**
2. In "Branch name pattern" field, enter: `master`

### Step 3: Configure Required Settings

Check the following boxes:

#### Basic Protection

- ✅ **Require a pull request before merging**
  - This prevents direct commits to master
  - All changes must go through PR workflow

#### Recommended Additional Settings

- ✅ **Require approvals**: 1 (optional but recommended)
  - Enforces code review before merging
  - Can be yourself reviewing your own PRs initially

- ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - Ensures reviews reflect the latest code

- ✅ **Require status checks to pass before merging** (when CI/CD is set up)
  - Will be enabled in Phase 2 (GitHub Actions)
  - Leave unchecked for now

- ✅ **Require branches to be up to date before merging**
  - Prevents merge conflicts
  - Ensures latest main code is tested

### Step 4: Save Changes

1. Scroll to bottom
2. Click **Create** (or **Save changes** if editing existing rule)

---

## What This Enables

### Before Branch Protection

```bash
# Direct commits allowed (risky!)
git checkout master
echo "quick fix" >> file.txt
git commit -m "fix: quick change"
git push origin master  # ✅ Works (but bypasses review!)
```

### After Branch Protection

```bash
# Direct commits blocked
git checkout master
echo "quick fix" >> file.txt
git commit -m "fix: quick change"
git push origin master  # ❌ REJECTED by GitHub

# Must use PR workflow
git checkout -b fix/quick-change
git commit -m "fix: quick change"
git push origin fix/quick-change
# Create PR on GitHub → Review → Merge
```

---

## Verification

### Test Branch Protection is Working

1. Try to push directly to master:

   ```bash
   git checkout master
   echo "test" >> README.md
   git commit -m "test: verify protection"
   git push origin master
   ```

2. Expected result:

   ```
   remote: error: GH006: Protected branch update failed for refs/heads/master.
   remote: error: Changes must be made through a pull request.
   ```

3. If you see this error, branch protection is working correctly!

---

## Workflow After Branch Protection

### Creating Changes

```bash
# 1. Create feature branch
git checkout master
git pull origin master
git checkout -b feat/my-feature

# 2. Make changes
# ... edit files ...

# 3. Commit and push
git add .
git commit -m "feat: add feature"
git push origin feat/my-feature
```

### Creating Pull Request

1. Go to GitHub repository
2. GitHub will show banner: "feat/my-feature had recent pushes"
3. Click **Compare & pull request**
4. Fill out PR template (auto-fills from `.github/PULL_REQUEST_TEMPLATE.md`)
5. Review checklist items
6. Click **Create pull request**

### Merging Pull Request

1. Review the changes in the PR
2. Check that all checklist items are completed
3. (Optional) Request review from collaborator
4. Once approved, click **Merge pull request**
5. Choose merge strategy:
   - **Squash and merge** (recommended for clean history)
   - **Rebase and merge** (maintains individual commits)
   - **Create a merge commit** (preserves branch history)
6. Click **Confirm merge**
7. Delete branch (GitHub will prompt)

### Cleanup After Merge

```bash
# Switch back to master
git checkout master

# Pull the merged changes
git pull origin master

# Delete local feature branch
git branch -d feat/my-feature

# Clean up stale remote branches
git remote prune origin
```

---

## Troubleshooting

### "I can't push to master anymore"

This is expected! You need to use the PR workflow:

1. Create a feature branch
2. Push feature branch
3. Create PR
4. Merge PR through GitHub UI

### "I accidentally committed to master locally"

Move your commits to a feature branch:

```bash
# Save your commit (copy the commit hash)
git log -1  # Note the commit hash

# Reset master to remote
git reset --hard origin/master

# Create feature branch
git checkout -b feat/my-changes

# Cherry-pick your commit
git cherry-pick <commit-hash>

# Push feature branch
git push origin feat/my-changes

# Create PR
```

### "I need to disable protection temporarily"

**NOT RECOMMENDED** - but if absolutely necessary:

1. Go to branch protection settings
2. Find the rule for `master`
3. Click **Edit** or **Delete**
4. Make your changes
5. **Re-enable protection immediately after**

---

## Advanced Settings (Optional)

### Require Status Checks (Phase 2 - After CI/CD Setup)

When you set up GitHub Actions (Phase 2):

1. Edit branch protection rule
2. Enable "Require status checks to pass before merging"
3. Select required checks:
   - ✅ `test` (unit tests)
   - ✅ `type-check` (TypeScript compilation)
   - ✅ `lint` (ESLint)
   - ✅ `evals` (calculation validation)

### Require Code Owners Review (For Team Collaboration)

Create `.github/CODEOWNERS` file:

```
# Code owners for different areas
/lib/skills/          @tryinhard1080
/lib/calculations/    @tryinhard1080
*.md                  @tryinhard1080
```

Then enable in branch protection:

- ✅ **Require review from Code Owners**

### Restrict Who Can Push

For team repositories:

- ✅ **Restrict who can push to matching branches**
  - Select: Admins only
  - Or: Specific teams/users

---

## WasteWise-Specific Benefits

### Formula Protection

With branch protection + PR template, you get:

1. **Checklist Enforcement**: Every PR requires formula validation checkbox
2. **Review Opportunity**: Catch hardcoded conversion rates before merge
3. **Audit Trail**: All calculation changes documented in PRs
4. **Rollback Safety**: Easy to revert bad merges

### Example Protected Calculation Change

```markdown
## Formula Validation (REQUIRED FOR CALCULATIONS)

- [x] ⚠️ Formulas match `lib/constants/formulas.ts` (NO hardcoded values)
- [x] ⚠️ No hardcoded conversion rates (14.49, 4.33, 8.5, 6.0)
- [x] ⚠️ Calculations verified against `WASTE_FORMULAS_REFERENCE.md`
- [x] ⚠️ Evals pass with <0.01% deviation (if applicable)
```

This checklist is now **required** for every PR touching calculations.

---

## Next Steps

### After Completing Branch Protection Setup

1. ✅ Branch protection enabled
2. ✅ PR workflow enforced
3. ⏭️ **Next**: Set up GitHub Actions (Phase 2)
   - Automated testing on every PR
   - TypeScript compilation check
   - Lint enforcement
   - Evals validation

### Phase 2 Preview

Create `.github/workflows/pr-checks.yml`:

```yaml
name: PR Checks

on:
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm tsc --noEmit
      - run: pnpm lint
```

This will run automatically on every PR!

---

## Summary

**What You Just Enabled**:

- ✅ All changes require PR (no direct commits to master)
- ✅ PR template auto-fills with WasteWise-specific checks
- ✅ Formula validation checklist enforced
- ✅ Clear audit trail of all changes
- ✅ Easy rollback if needed

**Time Investment**: 5 minutes
**Protection Level**: High
**Ongoing Effort**: None (automated)

**Status**: ✅ Phase 1 GitHub Setup Complete!

---

**WasteWise Skill System** - Branch Protection Guide
_One-time setup for continuous protection_
