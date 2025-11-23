# WasteWise Development Workflow

## Overview

This document describes the automated development workflow for WasteWise, including feature development, PR automation, and branch management.

## Branching Strategy

### Branch Types

WasteWise uses **feature branches with automated PR merging**:

1. **`master`** - Protected main branch
   - All code must go through PR review
   - Direct pushes blocked
   - Requires passing checks: TypeScript, ESLint, Unit Tests, Formula Validation

2. **Feature Branches** - Short-lived development branches
   - **Naming Convention**:
     - `frontend/*` - UI components, pages, client-side code
     - `backend/*` - API routes, database changes, server-side logic
     - `skills/*` - Skills implementation and modifications
     - `testing/*` - Test infrastructure and test suites

### Branch Protection Rules

**Master Branch Protection:**
- ✅ Require PR before merging
- ✅ Require status checks to pass:
  - TypeScript Compilation
  - ESLint
  - Unit Tests
  - Formula & Calculation Validation
- ✅ Require linear history (no merge commits)
- ✅ Block force pushes
- ✅ Block deletions
- ❌ No admin bypass (enforced for everyone)

## Automated PR Workflow

### Step 1: Create Feature Branch

```bash
# Example: Add new dashboard component
git checkout master
git pull origin master
git checkout -b frontend/dashboard-enhancements

# Make your changes...
git add .
git commit -m "feat(frontend): add savings chart to dashboard"
git push origin frontend/dashboard-enhancements
```

### Step 2: Open Pull Request

```bash
# Using GitHub CLI
gh pr create --title "Add savings chart to dashboard" --body "Implements visual chart for monthly savings tracking"

# Or use GitHub web UI
```

### Step 3: Automated Checks Run

Once PR is opened, GitHub Actions automatically runs:

1. **Setup & Cache Dependencies** (30s)
2. **TypeScript Compilation** (15s)
3. **ESLint** (10s)
4. **Unit Tests** (60s)
5. **Formula & Calculation Validation** (if applicable, 30s)
6. **Security Scan** (20s)
7. **Build Test** (45s)

**Total time:** ~3-4 minutes

### Step 4: Automatic Approval & Merge

If **all checks pass** and the branch follows the naming convention:

1. **Auto-Approval**: PR is automatically approved by GitHub Actions
2. **Auto-Merge**: PR is squash-merged to master
3. **Branch Deletion**: Feature branch is automatically deleted
4. **Notification**: Comment posted on PR confirming auto-merge

**No manual intervention required!** ✨

### Step 5: Pull Latest Master

```bash
# After your PR is auto-merged
git checkout master
git pull origin master
git fetch --prune  # Remove deleted branch references
```

## Manual Overrides

### When Auto-Merge Doesn't Trigger

**Auto-merge will NOT trigger if:**
- ❌ Any required check fails
- ❌ PR is from a fork (security)
- ❌ PR is marked as draft
- ❌ Branch name doesn't match convention (frontend/*, backend/*, skills/*, testing/*)
- ❌ PR has merge conflicts

**In these cases:**
1. Fix the issues (push new commits)
2. Checks will re-run automatically
3. Auto-merge will trigger once all pass

### Force Manual Merge

If you need to manually merge (e.g., for emergency hotfix):

```bash
# Via GitHub CLI
gh pr merge <PR_NUMBER> --squash --delete-branch

# Or use GitHub web UI
```

**Note:** Manual merges still require all status checks to pass due to branch protection.

## Branch Cleanup

### Automatic Weekly Cleanup

Every **Monday at 2am UTC**, the Branch Cleanup workflow runs:

1. Finds all branches merged to master
2. Deletes branches older than **7 days**
3. Creates GitHub issue with cleanup summary
4. Skips:
   - Master branch
   - Protected branches
   - Recently merged branches (<7 days)
   - Unmerged branches

### Manual Cleanup

Trigger cleanup anytime:

```bash
# Using GitHub CLI
gh workflow run cleanup-branches.yml

# Or use GitHub web UI Actions tab
```

### Local Cleanup

Remove stale local branch references:

```bash
# Prune deleted remote branches
git fetch --prune

# Delete local branches that are merged
git branch --merged master | grep -v "master" | xargs git branch -d
```

## Development Tips

### Creating Good PRs

1. **Clear Title**: Use conventional commit format
   - `feat(frontend):` - New feature
   - `fix(backend):` - Bug fix
   - `refactor(skills):` - Code refactoring
   - `test(testing):` - Test additions
   - `chore:` - Maintenance tasks
   - `docs:` - Documentation

2. **Descriptive Body**: Explain what and why
   ```markdown
   ## Changes
   - Added savings chart component
   - Integrated Chart.js library
   - Added unit tests for chart calculations

   ## Testing
   - Verified chart renders correctly
   - Tested with various data ranges
   - Confirmed responsive behavior
   ```

3. **Keep PRs Small**: Aim for <500 lines changed
   - Easier to review
   - Faster to merge
   - Lower risk of conflicts

### Handling Merge Conflicts

If your branch has conflicts with master:

```bash
# Update your feature branch with latest master
git checkout your-feature-branch
git pull origin master

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "fix: resolve merge conflicts with master"
git push origin your-feature-branch

# Checks will re-run, auto-merge will trigger if all pass
```

### Emergency Procedures

#### Bypass Auto-Merge (Urgent Hotfix)

1. Create branch with non-standard name:
   ```bash
   git checkout -b hotfix/critical-bug
   ```
2. This will NOT auto-merge (name doesn't match pattern)
3. Get manual review
4. Merge manually via GitHub UI

#### Disable Auto-Merge Temporarily

Contact repository admin to:
1. Temporarily disable auto-merge workflow
2. Apply hotfix
3. Re-enable workflow

## Workflow Monitoring

### Check Workflow Status

```bash
# List recent workflow runs
gh run list

# View specific workflow run
gh run view <RUN_ID>

# Watch workflow in real-time
gh run watch
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| PR not auto-merging | Checks failing | Review failed check logs, fix issues |
| PR not auto-merging | Wrong branch name | Rename branch to match convention |
| Branch not deleted | Manual merge | Delete manually: `git push origin --delete <branch>` |
| Stale local branches | Remote deleted | Run `git fetch --prune` |

## Best Practices

✅ **DO:**
- Follow branch naming conventions
- Write clear commit messages
- Keep PRs focused and small
- Wait for all checks to pass
- Pull latest master before starting new work
- Rebase/merge master into your branch if needed

❌ **DON'T:**
- Push directly to master (blocked)
- Force push to feature branches (can break auto-merge)
- Create long-lived feature branches (>1 week)
- Ignore failing checks
- Merge manually unless necessary

## FAQ

**Q: How long does auto-merge take?**
A: Typically 3-4 minutes after PR is opened (time for checks to run).

**Q: Can I disable auto-merge for my PR?**
A: Yes, use a branch name that doesn't match the convention (e.g., `experimental/my-feature`).

**Q: What if I need to make changes after opening the PR?**
A: Just push new commits. Checks will re-run automatically, and auto-merge will trigger when all pass.

**Q: Can I manually merge even with auto-merge enabled?**
A: Yes, you can manually merge via GitHub UI. Auto-merge just provides the automation option.

**Q: What happens to my branch after auto-merge?**
A: It's automatically deleted from the remote repository. Update your local repo with `git fetch --prune`.

## Reference

- **Auto-Merge Workflow**: `.github/workflows/auto-merge.yml`
- **Branch Cleanup Workflow**: `.github/workflows/cleanup-branches.yml`
- **PR Checks Workflow**: `.github/workflows/pr-checks.yml`
- **Branch Protection**: Configured via GitHub API
- **Git Workflow Guide**: `docs/git/GIT_QUICK_REFERENCE.md`

---

**Last Updated:** 2025-11-23
**Maintained By:** WasteWise Development Team
