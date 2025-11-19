# WasteWise Git Workflow - Visual Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WASTEWISE GIT WORKFLOW OVERVIEW                     │
└─────────────────────────────────────────────────────────────────────────┘


                           MAIN BRANCH (Protected)
                    ═══════════════════════════════════════
                              Production-Ready Code
                    ═══════════════════════════════════════
                                      │
                                      │ Pull Request Required
                                      │ Tests Must Pass
                                      │ Review Required
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        FEATURE BRANCHES             │
                    │   (feat/, fix/, docs/, etc.)        │
                    └─────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            STANDARD WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    ┌──────────────┐
    │ 1. START     │
    │              │ → git checkout main
    │ Update Main  │ → git pull origin main
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ 2. CREATE    │
    │              │ → git checkout -b feat/new-feature
    │ New Branch   │   
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ 3. DEVELOP   │
    │              │ → Make code changes
    │ Write Code   │ → pnpm test (run tests)
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ 4. STAGE     │
    │              │ → git status (check changes)
    │ Changes      │ → git add . (or specific files)
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ 5. COMMIT    │
    │              │ → git commit -m "feat(scope): description"
    │ With Message │   Examples:
    └──────────────┘   - feat(skills): add invoice extraction
           │           - fix(worker): resolve timeout
           ▼           - docs(api): update endpoints
    ┌──────────────┐
    │ 6. PUSH      │
    │              │ → git push -u origin feat/new-feature
    │ to GitHub    │   (First time: -u flag)
    └──────────────┘   (Later: just git push)
           │
           ▼
    ┌──────────────┐
    │ 7. CREATE PR │
    │              │ → Go to GitHub
    │ Pull Request │ → Click "New Pull Request"
    └──────────────┘ → Fill out template
           │
           ▼
    ┌──────────────┐
    │ 8. REVIEW    │
    │              │ → Tests run automatically
    │ & Approve    │ → Reviewer checks code
    └──────────────┘ → Address feedback
           │
           ▼
    ┌──────────────┐
    │ 9. MERGE     │
    │              │ → Squash and merge (recommended)
    │ to Main      │ → Delete branch after merge
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ 10. CLEANUP  │
    │              │ → git checkout main
    │ Local Branch │ → git pull origin main
    └──────────────┘ → git branch -d feat/new-feature


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            BRANCH NAMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    TYPE          PREFIX      EXAMPLE                        WHEN TO USE
    ──────────────────────────────────────────────────────────────────────
    Feature       feat/       feat/invoice-extraction        New functionality
    Bug Fix       fix/        fix/worker-timeout             Fixing a bug
    Documentation docs/       docs/api-reference-update      Docs only
    Testing       test/       test/compactor-edge-cases      Adding tests
    Refactoring   refactor/   refactor/optimize-queries      Code cleanup
    Maintenance   chore/      chore/update-dependencies      Chores/tasks


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         COMMIT MESSAGE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    Format: <type>(<scope>): <subject>
    
    ┌────────┬──────────┬─────────────────────────────────────┐
    │  TYPE  │  SCOPE   │           DESCRIPTION               │
    ├────────┼──────────┼─────────────────────────────────────┤
    │ feat   │ skills   │ New feature                         │
    │ fix    │ worker   │ Bug fix                             │
    │ docs   │ api      │ Documentation change                │
    │ style  │ --       │ Formatting (no code change)         │
    │ refactor│ db      │ Code restructuring                  │
    │ test   │ unit     │ Adding tests                        │
    │ chore  │ deps     │ Build/dependency updates            │
    └────────┴──────────┴─────────────────────────────────────┘

    ✅ GOOD Examples:
    feat(skills): add regulatory compliance research
    fix(worker): resolve race condition in job polling
    docs(readme): update deployment instructions
    test(compactor): add edge case validation
    
    ❌ BAD Examples:
    updated stuff
    fixed bug
    changes
    WIP


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         DAILY COMMANDS QUICK REF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    ┌─────────────────────────────────┬───────────────────────────────────┐
    │          ACTION                 │          COMMAND                  │
    ├─────────────────────────────────┼───────────────────────────────────┤
    │ Check status                    │ git status                        │
    │ See changes                     │ git diff                          │
    │ Create branch                   │ git checkout -b feat/name         │
    │ Switch branch                   │ git checkout branch-name          │
    │ Stage all files                 │ git add .                         │
    │ Stage specific file             │ git add path/to/file              │
    │ Commit                          │ git commit -m "type: message"     │
    │ Push new branch                 │ git push -u origin branch-name    │
    │ Push existing branch            │ git push                          │
    │ Pull latest                     │ git pull origin main              │
    │ Update current branch           │ git rebase origin/main            │
    │ Delete local branch             │ git branch -d branch-name         │
    │ Delete remote branch            │ git push origin --delete name     │
    │ View branches                   │ git branch -a                     │
    │ View commit history             │ git log --oneline -10             │
    │ Stash changes                   │ git stash save "description"      │
    │ Apply stash                     │ git stash pop                     │
    │ Undo last commit (keep changes) │ git reset --soft HEAD~1           │
    └─────────────────────────────────┴───────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PRE-COMMIT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    ☐  git status                    (Check what's changed)
    ☐  git diff --staged              (Review staged changes)
    ☐  pnpm test                      (Run tests)
    ☐  npx tsc --noEmit               (Type check)
    ☐  No console.log statements
    ☐  No API keys or secrets
    ☐  Commit message follows format
    ☐  Changes are logical and focused


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PRE-PUSH CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    ☐  All tests pass locally
    ☐  TypeScript compiles
    ☐  Branch is up to date with main
    ☐  Meaningful commit messages
    ☐  No merge conflicts
    ☐  .env files not committed
    ☐  Branch follows naming convention


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      PULL REQUEST WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    1. PUSH BRANCH
       └─→ git push -u origin feat/branch-name
    
    2. OPEN GITHUB
       └─→ Navigate to repository
    
    3. CREATE PR
       ├─→ Click "Pull requests"
       ├─→ Click "New pull request"
       ├─→ Select base: main, compare: your-branch
       └─→ Click "Create pull request"
    
    4. FILL TEMPLATE
       ├─→ Add descriptive title
       ├─→ Complete PR template sections
       ├─→ Link related issues
       └─→ Add labels (if applicable)
    
    5. REQUEST REVIEW
       └─→ Select reviewers (if team)
    
    6. AUTOMATED CHECKS
       ├─→ Tests run automatically
       ├─→ TypeScript compilation
       └─→ Linting (if configured)
    
    7. ADDRESS FEEDBACK
       ├─→ Make requested changes
       ├─→ Push to same branch
       └─→ Re-request review
    
    8. MERGE
       ├─→ All checks pass ✅
       ├─→ Approved by reviewer ✅
       ├─→ Click "Squash and merge"
       └─→ Delete branch ✅
    
    9. SYNC LOCAL
       ├─→ git checkout main
       ├─→ git pull origin main
       └─→ git branch -d feat/branch-name


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         MERGE CONFLICT RESOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    When conflicts occur during rebase or merge:

    1. Git pauses and shows:
       CONFLICT (content): Merge conflict in file.ts
    
    2. Open conflicted file, look for:
       <<<<<<< HEAD
       Your changes
       =======
       Their changes (from main)
       >>>>>>> branch-name
    
    3. Edit file to resolve conflict:
       - Keep your version, OR
       - Keep their version, OR
       - Combine both
    
    4. Remove conflict markers (<<<, ===, >>>)
    
    5. Stage resolved file:
       git add file.ts
    
    6. Continue rebase:
       git rebase --continue
    
    7. Force push (if rebasing):
       git push --force-with-lease
    
    ABORT if stuck:
       git rebase --abort


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         EMERGENCY PROCEDURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    UNDO LAST COMMIT (not pushed)
    └─→ git reset --soft HEAD~1      (keeps changes)
    └─→ git reset --hard HEAD~1      (discards changes)

    DISCARD ALL LOCAL CHANGES
    └─→ git stash save "emergency backup"
    └─→ git reset --hard HEAD

    ACCIDENTALLY COMMITTED SECRET
    └─→ git reset --soft HEAD~1
    └─→ Remove secret from code
    └─→ Add to .gitignore
    └─→ Re-commit

    WRONG BRANCH
    └─→ git stash save "moving to correct branch"
    └─→ git checkout correct-branch
    └─→ git stash pop

    LOST WORK
    └─→ git reflog
    └─→ Find commit hash
    └─→ git cherry-pick <hash>

    PUSHED TO WRONG BRANCH
    └─→ git push origin --delete wrong-branch
    └─→ Inform team if necessary


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    ✅  Commit early, commit often
    ✅  One feature per branch
    ✅  Small, focused commits
    ✅  Descriptive commit messages
    ✅  Pull before push
    ✅  Keep branches up to date
    ✅  Test before committing
    ✅  Delete merged branches
    ✅  Never force push to main
    ✅  Review your own PR first

    ❌  Don't commit directly to main
    ❌  Don't commit secrets/API keys
    ❌  Don't commit node_modules
    ❌  Don't commit .env files
    ❌  Don't force push shared branches
    ❌  Don't use vague commit messages
    ❌  Don't leave commented code
    ❌  Don't merge without review


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         TYPICAL DEVELOPMENT DAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    MORNING:
    ├─ git checkout main
    ├─ git pull origin main
    ├─ git checkout feat/your-feature
    └─ git rebase origin/main

    DURING WORK:
    ├─ Make changes
    ├─ git add .
    ├─ git commit -m "type: message"
    └─ Repeat as needed

    BEFORE LUNCH:
    └─ git push

    END OF DAY:
    ├─ git push
    ├─ Create/Update PR if ready
    └─ git stash (if unfinished work)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         STATUS INDICATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    When you run `git status`, you'll see:

    Untracked files:      ❓  New files Git doesn't know about
    
    Changes not staged:   🔴  Modified files not added yet
    
    Changes staged:       🟢  Files ready to commit
    
    Committed:            ✅  Changes saved to history
    
    Pushed:               ☁️  Changes on GitHub
    
    Merged:               🎉  Changes in main branch


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PHASE TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    Link commits and PRs to phases:

    Phase 7 (Integration Testing):
    └─→ feat(test): add E2E workflow validation
    
    Phase 8 (Additional Skills):
    ├─→ feat(skills): implement invoice extraction
    ├─→ feat(skills): add regulatory research
    └─→ feat(api): integrate Claude Vision
    
    Use labels on GitHub:
    - phase-7
    - phase-8
    - phase-9


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         REMEMBER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    📌  When in doubt, create a backup branch first
    📌  Use git status liberally - it's your friend
    📌  git --help <command> shows detailed help
    📌  Can't hurt to pull before you push
    📌  Commit messages matter - be descriptive
    📌  Small, focused changes are easier to review
    📌  Tests should pass before you push


┌─────────────────────────────────────────────────────────────────────────┐
│                    WasteWise Skill System - Git Flow                    │
│                     Greystar Advantage Waste Team                       │
│                  Keep this visible during development!                  │
└─────────────────────────────────────────────────────────────────────────┘
```
