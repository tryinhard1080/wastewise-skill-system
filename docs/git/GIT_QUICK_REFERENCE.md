# Git Quick Reference Checklist

## 🚀 Starting a New Feature

```bash
☐ git checkout main
☐ git pull origin main
☐ git checkout -b feat/my-new-feature
☐ # Make your changes
☐ git add .
☐ git commit -m "feat(scope): description"
☐ git push -u origin feat/my-new-feature
☐ Create PR on GitHub
```

---

## 📋 Daily Workflow

### Morning Routine

```bash
☐ git checkout main
☐ git pull origin main
☐ git checkout feat/your-branch
☐ git rebase origin/main  # Keep branch updated
```

### Making Changes

```bash
☐ # Edit files
☐ git status              # Check what changed
☐ git diff                # Review changes
☐ git add <files>         # Stage specific files
☐ # OR
☐ git add .               # Stage all changes
```

### Committing

```bash
☐ git commit -m "type(scope): message"
☐ # Examples:
☐ # feat(skills): add regulatory research
☐ # fix(worker): resolve polling timeout
☐ # docs(api): update endpoint documentation
☐ # test(compactor): add edge cases
```

### Pushing

```bash
☐ git push                # If branch already exists remotely
☐ # OR
☐ git push -u origin feat/branch-name  # First time pushing
```

---

## 🔍 Before Committing Checklist

```bash
☐ Run tests: pnpm test
☐ Type check: npx tsc --noEmit
☐ Check what's staged: git diff --staged
☐ Verify commit message follows convention
☐ No console.logs in code
☐ No sensitive data (API keys, passwords)
☐ Files properly formatted
```

---

## 🎯 Before Creating PR Checklist

```bash
☐ Branch is up to date with main
☐ All tests passing (pnpm test)
☐ TypeScript compiles (npx tsc --noEmit)
☐ E2E test works (npx tsx scripts/test-e2e.ts)
☐ Documentation updated
☐ Formulas verified (if applicable)
☐ No TypeScript errors
☐ Meaningful commit messages
☐ Branch follows naming convention (feat/fix/docs/etc.)
```

---

## 🚨 Troubleshooting Quick Fixes

### Undo Last Commit (Not Pushed)

```bash
git reset --soft HEAD~1   # Keep changes
git reset --hard HEAD~1   # Discard changes
```

### Discard Local Changes

```bash
git checkout -- <file>    # Single file
git reset --hard HEAD     # All files (CAREFUL!)
```

### Stash Work in Progress

```bash
git stash save "WIP: description"
git stash list
git stash pop
```

### Merge Conflict Resolution

```bash
☐ Open conflicted files
☐ Look for <<<<<<< markers
☐ Edit to resolve conflicts
☐ git add <resolved-files>
☐ git rebase --continue
☐ git push --force-with-lease
```

### Update Branch with Latest Main

```bash
git fetch origin
git rebase origin/main
# If conflicts, resolve them
git push --force-with-lease
```

---

## 📊 Status Checks

### Check Current Status

```bash
git status                    # What's changed
git branch                    # Current branch
git log --oneline -5          # Recent commits
git diff                      # Unstaged changes
git diff --staged             # Staged changes
```

### Check Branch Status

```bash
git branch -a                 # All branches
git log main..HEAD            # Commits not in main
git diff main..HEAD           # File differences from main
```

---

## 🌿 Branch Management

### Create Branch

```bash
git checkout -b feat/new-feature
```

### Switch Branch

```bash
git checkout main
git checkout feat/existing-feature
```

### Delete Branch

```bash
git branch -d feat/merged-feature       # Local (after merge)
git push origin --delete feat/old       # Remote
```

### List Branches

```bash
git branch                    # Local only
git branch -r                 # Remote only
git branch -a                 # All branches
```

---

## 🔄 Sync & Update

### Update Main

```bash
git checkout main
git pull origin main
```

### Update Feature Branch

```bash
git checkout feat/my-feature
git fetch origin
git rebase origin/main
```

### Pull Latest Changes

```bash
git pull origin main          # Fetch + merge
git fetch origin              # Fetch only (safer)
```

---

## 🎨 Commit Message Types

```
feat:      New feature
fix:       Bug fix
docs:      Documentation only
style:     Formatting, missing semi-colons
refactor:  Code restructuring
test:      Adding tests
chore:     Build tasks, package updates
perf:      Performance improvements
ci:        CI/CD changes
revert:    Revert previous commit
```

### Examples

```bash
git commit -m "feat(skills): add invoice extraction skill"
git commit -m "fix(worker): prevent null pointer exception"
git commit -m "docs(readme): update deployment instructions"
git commit -m "test(api): add rate limiting tests"
git commit -m "refactor(db): optimize query performance"
git commit -m "chore(deps): update TypeScript to 5.3"
```

---

## 📝 PR Creation Checklist

```bash
☐ Branch pushed to remote
☐ Navigate to GitHub repo
☐ Click "Pull requests" → "New pull request"
☐ Select base: main, compare: your-branch
☐ Fill out PR template
☐ Add descriptive title
☐ Add labels (if applicable)
☐ Request reviewers
☐ Link related issues
☐ Click "Create pull request"
```

---

## ✅ PR Review Checklist

### As Author

```bash
☐ Self-review your code
☐ Check PR description is clear
☐ All tests passing
☐ No merge conflicts
☐ Request specific reviewers
☐ Respond to review comments
☐ Make requested changes
☐ Re-request review after updates
```

### As Reviewer

```bash
☐ Pull branch locally: git fetch && git checkout feat/branch
☐ Run tests: pnpm test
☐ Check TypeScript: npx tsc --noEmit
☐ Test functionality manually
☐ Review code quality
☐ Check test coverage
☐ Verify documentation
☐ Leave constructive feedback
☐ Approve or request changes
```

---

## 🚀 Merge PR Checklist

```bash
☐ All tests passing
☐ All review comments addressed
☐ PR approved by reviewer(s)
☐ No merge conflicts
☐ Choose merge strategy:
   ☐ Squash and merge (recommended)
   ☐ Rebase and merge
   ☐ Merge commit
☐ Click merge button
☐ Delete branch after merge
☐ Pull latest main locally
```

---

## 📦 Post-Merge Cleanup

```bash
git checkout main
git pull origin main
git branch -d feat/merged-feature
git remote prune origin          # Clean up stale branches
```

---

## 🔐 Pre-Push Security Check

```bash
☐ No .env files committed
☐ No API keys in code
☐ No passwords or tokens
☐ No personal information
☐ .gitignore is complete
☐ No node_modules
☐ No build artifacts
```

---

## 💡 Pro Tips

1. **Commit Often**: Small, logical commits are easier to review
2. **Pull Before Push**: Always sync with main before pushing
3. **Descriptive Messages**: Future you will thank you
4. **Review Before Commit**: Always check `git diff --staged`
5. **Test Before Push**: Run tests locally first
6. **Branch Per Feature**: One feature = one branch
7. **Delete Merged Branches**: Keep repo clean
8. **Use Stash**: Save work without committing

---

## 🆘 Emergency Commands

### Accidentally Committed Secrets

```bash
# Remove from last commit (not pushed)
git reset --soft HEAD~1
# Edit .gitignore to exclude the file
git add .gitignore
git commit -m "chore: update gitignore"
```

### Pushed Wrong Branch

```bash
git push origin --delete wrong-branch
```

### Broke Everything

```bash
git stash save "emergency stash"
git reset --hard origin/main
```

### Lost Commits

```bash
git reflog
git cherry-pick <commit-hash>
```

---

## 📞 Getting Help

**Stuck on a merge conflict?**

- Don't force push to main
- Ask for help if unsure
- Use `git status` to see current state

**Not sure about a command?**

- Use `git <command> --help`
- Check the full Git Workflow Guide
- Google the specific error message

**Safety First:**

- Never `git push --force` to main
- Use `--force-with-lease` if you must force push
- Always create a backup branch: `git branch backup-branch`

---

## 🎯 Quick Command Reference

```bash
# Status & Info
git status
git log --oneline -10
git branch -a

# Branch Operations
git checkout -b feat/new
git checkout main
git branch -d feat/old

# Stage & Commit
git add .
git commit -m "type: message"

# Sync
git pull origin main
git push origin feat/branch
git fetch origin

# Cleanup
git stash
git reset --hard HEAD
git clean -fd

# Emergency
git reflog
git reset --hard HEAD~1
git revert <commit>
```

---

**WasteWise Skill System** - Git Quick Reference  
_Keep this handy for daily development!_
