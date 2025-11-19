# PR Cleanup Automation Script

## Overview

The `pr-cleanup.sh` script automates GitHub pull request management for the WasteWise repository using the GitHub CLI (`gh`). It provides an interactive way to manage multiple PRs efficiently.

## Prerequisites

### 1. Install GitHub CLI

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install gh
```

**Other platforms:** Visit https://cli.github.com/

### 2. Authenticate with GitHub

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

## Usage

### Run the script from the repository root:

```bash
./scripts/pr-cleanup.sh
```

Or from anywhere:

```bash
cd /path/to/wastewise-skill-system
./scripts/pr-cleanup.sh
```

## Features

The script provides 6 interactive options:

### 1. Auto-close all test PRs
- Automatically closes all PRs from branches matching `test/*`
- Deletes both remote and local branches
- Useful for cleaning up experimental or temporary test PRs

### 2. Auto-merge all passing PRs
- Lists all PRs with passing CI/CD checks
- Prompts for confirmation before merging each one
- Uses squash-and-merge strategy
- Automatically deletes branches after merge

### 3. Interactive mode
- Review each PR individually
- See detailed status for each PR
- Choose action per PR:
  - **m** - Merge the PR
  - **c** - Close the PR
  - **s** - Skip to next PR
  - **q** - Quit the script

### 4. Close specific PR by number
- Enter a PR number to close
- Deletes the associated branch

### 5. Merge specific PR by number
- Enter a PR number to merge
- Uses squash-and-merge strategy

### 6. Exit
- Exit the script without making changes

## Output

The script provides color-coded output:

- 🔵 **Blue** - Information and headers
- 🟢 **Green** - Success messages
- 🟡 **Yellow** - Warnings and in-progress actions
- 🔴 **Red** - Errors

### PR Status Indicators

- ✅ **PASSING** - All CI/CD checks passed
- ❌ **FAILING** - Some checks failed
- ⏳ **PENDING** - Checks still running or no checks configured

## Safety Features

1. **Confirmation prompts** - Always asks before destructive actions
2. **Error handling** - Continues operation even if individual steps fail
3. **Status checks** - Verifies PR status before merging
4. **Branch cleanup** - Removes both local and remote branches
5. **Repository sync** - Pulls latest changes after cleanup

## Post-Cleanup Actions

After completing PR operations, the script automatically:

1. Switches to the `master` branch (or `main` if master doesn't exist)
2. Pulls latest changes from remote
3. Prunes deleted remote branches
4. Displays completion message

## Example Workflow

```bash
$ ./scripts/pr-cleanup.sh

═══════════════════════════════════════════════════════════
    WasteWise PR Cleanup Automation Script
═══════════════════════════════════════════════════════════

✅ GitHub CLI is installed and authenticated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: List All Open PRs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PR #     TITLE                                              BRANCH                                   STATUS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────
42       Add compactor optimization feature                 feature/compactor-opt                    ✅ PASSING
43       Fix calculation bug in yards per door              bugfix/ypd-calculation                   ❌ FAILING
44       Update regulatory research skill                   test/regulatory-update                   ⏳ PENDING

Choose an option:
  1) Auto-close all test PRs (test/* branches)
  2) Auto-merge all passing PRs
  3) Interactive mode (choose action for each PR)
  4) Close specific PR by number
  5) Merge specific PR by number
  6) Exit

Enter your choice (1-6): 3
```

## Troubleshooting

### "GitHub CLI (gh) is not installed"

Install the GitHub CLI following the prerequisites section above.

### "Not authenticated with GitHub CLI"

Run `gh auth login` and follow the authentication flow.

### "Failed to merge PR"

Possible causes:
- PR has merge conflicts
- Branch protection rules not satisfied
- CI/CD checks failing
- Insufficient permissions

Resolve the issue in GitHub and try again.

### "Branch already deleted"

This is normal - the script handles this gracefully and continues.

## Advanced Usage

### Dry Run (View Only)

To see what PRs exist without making changes:

```bash
gh pr list --state open
```

### Close PR without script

```bash
gh pr close <PR_NUMBER> --comment "Closing this PR"
git push origin --delete <BRANCH_NAME>
```

### Merge PR without script

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

## Integration with Git Workflow

This script complements the WasteWise git workflow documented in:
- `.claude/agents/orchestrator.md`
- `docs/git/GIT_QUICK_REFERENCE.md`
- `docs/git/GIT_VISUAL_WORKFLOW.md`

Use it to clean up completed features or abandoned experimental branches.

## Security Note

The script requires `--admin` flag for merging, which may bypass branch protection rules. Only use this if you have admin permissions and understand the implications.

For production repositories, consider removing the `--admin` flag to enforce branch protection rules:

```bash
# In the merge_pr function, change:
gh pr merge $pr_number --squash --delete-branch --admin

# To:
gh pr merge $pr_number --squash --delete-branch
```

## Contributing

If you encounter issues or have suggestions for improvements, please:

1. Open an issue in the repository
2. Follow the contribution guidelines in `README.md`
3. Test changes thoroughly before creating a PR

---

**Last Updated:** 2025-11-19
**Maintained By:** WasteWise Development Team
