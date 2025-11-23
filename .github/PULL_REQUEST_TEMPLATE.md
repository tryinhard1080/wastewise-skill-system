## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] 🎉 New feature (feat)
- [ ] 🐛 Bug fix (fix)
- [ ] 📝 Documentation update (docs)
- [ ] ♻️ Code refactoring (refactor)
- [ ] ✅ Testing (test)
- [ ] 🔧 Maintenance/chores (chore)

## Related Phase

<!-- Check the phase this PR relates to -->

- [ ] Phase 7: Integration Testing & Production Deployment (85% complete)
- [ ] Phase 9.1: Regulatory Research Skill (COMPLETE ✅)
- [ ] Phase 9.2: User Account Management (NEXT)
- [ ] Phase 9.3: Stripe Integration & Billing
- [ ] Phase 10+: Future enhancements

## Changes Made

## <!-- List the key changes in this PR -->

-
-

## Testing Completed

- [ ] Unit tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm tsc --noEmit`)
- [ ] Linting passes (`pnpm lint`)
- [ ] E2E test passes (if applicable)
- [ ] Manually tested functionality
- [ ] Worker processes jobs correctly (if backend change)
- [ ] API endpoints respond as expected (if API change)

## Formula Validation (REQUIRED FOR CALCULATIONS)

<!-- If this PR involves waste management calculations -->

- [ ] ⚠️ Formulas match `lib/constants/formulas.ts` (NO hardcoded values)
- [ ] ⚠️ No hardcoded conversion rates (14.49, 4.33, 8.5, 6.0)
- [ ] ⚠️ Calculations verified against `WASTE_FORMULAS_REFERENCE.md`
- [ ] ⚠️ Evals pass with <0.01% deviation (if applicable)
- [ ] ⚠️ Python reference matches TypeScript implementation (if applicable)

## Database Changes

<!-- If this PR involves database schema or migrations -->

- [ ] Migration created (if schema changed)
- [ ] TypeScript types regenerated (`npx supabase gen types typescript --local`)
- [ ] RLS policies updated (if needed)
- [ ] Seed data updated (if needed)
- [ ] Database seed script tested (`pnpm seed`)

## Code Quality Checklist

- [ ] Code follows project conventions (branch naming, commit messages)
- [ ] No `console.log` statements in production code (use logger)
- [ ] Proper error handling implemented
- [ ] Type safety maintained (no `any` types unless necessary)
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, API docs, phase docs)
- [ ] No sensitive data (API keys, credentials) in code

## WasteWise-Specific Checks

<!-- Critical for waste management accuracy -->

- [ ] Container types validated (COMPACTOR vs DUMPSTER vs OPEN_TOP)
- [ ] Equipment type validation in place
- [ ] Conversion rates consistent across all skills
- [ ] Compactor optimization threshold correct (<6.0 tons)
- [ ] Target capacity correct (8.5 tons for compactors)

## Agent Context

<!-- Who/what created this PR? Helps with review and debugging -->

- [ ] Human developer (Richard)
- [ ] Claude Code (agent-assisted development)
- [ ] Codex (automated improvements)
- [ ] Other: ****\_\_\_****

<!-- Which agent domain does this relate to? -->

- [ ] Frontend (`frontend/*` branch)
- [ ] Backend (`backend/*` branch)
- [ ] Skills (`skills/*` branch)
- [ ] Testing (`testing/*` branch)
- [ ] Documentation (`docs/*` branch)

## Screenshots/Examples

<!-- If applicable, add screenshots or example output -->

## Breaking Changes

<!-- Does this PR introduce breaking changes? -->

- [ ] Yes (describe below)
- [ ] No

<!-- If yes, describe the breaking changes and migration path -->

## Additional Notes

<!-- Any additional context, decisions, or considerations -->

## Reviewer Checklist

<!-- For reviewers (or self-review) -->

- [ ] Code is clear and maintainable
- [ ] Tests adequately cover changes
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Documentation is sufficient
- [ ] Formula validation complete (if calculations)
- [ ] Database migrations tested (if schema changes)

---

**Related Issues:** Closes #<!-- issue number if applicable -->

**Co-Authored-By:** Claude <noreply@anthropic.com> <!-- if AI-assisted -->
