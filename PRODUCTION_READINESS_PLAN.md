# Production Readiness Checklist

This checklist outlines the concrete steps required to ship the WasteWise Skill System safely to production. Items are grouped by area so owners can track work and mark completion.

## 1) Platform & Dependencies
- **Align framework versions**: Resolve the React 19 / Next 14 mismatch by either downgrading React/ReactDOM to 18.x (with matching `@types/react`/`@types/react-dom`) or upgrading Next.js to a version that officially supports React 19. Update tests and lint configs after the change.
- **Tailwind pipeline**: Decide on Tailwind 4 zero-config vs. Tailwind 3/PostCSS. If staying on Tailwind 4, remove legacy `postcss` usage and add the new config entry point; if reverting to Tailwind 3, pin compatible Tailwind/PostCSS versions and restore the conventional config files.
- **Package metadata**: Replace placeholder `name` and `version` fields with production-ready values; ensure `license` and repository metadata are correct for deployment artifacts.
- **Lockfile hygiene**: Regenerate `pnpm-lock.yaml` after dependency realignment to ensure reproducible installs.

## 2) Build, Test, and Quality Gates
- **Continuous Integration**: Verify GitHub Actions run lint, type-check, unit, integration, and E2E suites on every push/PR. Add matrix coverage for Node/Next versions being targeted.
- **Static checks**: Add `next lint`, `tsc --noEmit`, and `vitest run` to CI. Include `pnpm audit` or `npm audit` (with allowlist where needed) to flag vulnerable packages.
- **E2E reliability**: Stabilize `scripts/test-e2e.ts` and `scripts/test-e2e-ui.ts` by seeding deterministic data and running them against a fresh test database.
- **Performance budgets**: Add Lighthouse/Next.js bundle analyzer checks in CI to catch oversized bundles; set thresholds for JS/CSS payloads and route timings.

## 3) Configuration & Secrets
- **Environment management**: Document required environment variables (Supabase keys, Anthropic keys, analytics, etc.) with sample `.env.example`. Enforce runtime checks that fail fast when configuration is missing.
- **Secret handling**: Ensure secrets live in the deployment platform’s secret store (not `.env` files in images). Rotate keys before launch and enable short TTLs where possible.
- **Feature flags**: Gate risky functionality (new skills, AI providers, destructive actions) behind flags so rollbacks do not require redeploys.

## 4) Database & Migrations
- **Schema ownership**: Confirm all Supabase schema changes are codified in migrations and version-controlled. Add pre-deploy migration steps and backups.
- **Data quality**: Add constraints and validations for invoices, haul logs, and contracts (e.g., non-null dates, positive tonnage/fee amounts). Seed realistic fixtures for testing.
- **Backup/restore runbooks**: Document how to snapshot and restore the production database; test the restore path at least once.

## 5) Application Behavior
- **Error handling**: Implement consistent API error shapes and UI toasts; ensure background workers surface failures to logs/alerts and support retry/backoff.
- **Observability**: Add structured logging, trace IDs across API/worker boundaries, and metrics for job throughput, error rates, and external API latency. Configure log retention and searchable aggregation.
- **Analytics & PII**: Verify analytics SDKs avoid sending PII. Mask sensitive fields in logs and tracing payloads.
- **Rate limiting & abuse prevention**: Add per-project/user rate limits to API routes and worker-triggered actions; enforce auth/authorization checks for skill execution and data exports.
- **File handling**: Validate MIME types and file sizes for uploads; use server-side virus scanning or sandboxing for attachments.

## 6) Security
- **Dependency scanning**: Enable Dependabot/Snyk alerts for npm and GitHub Actions. Patch critical vulnerabilities before release windows.
- **Headers & TLS**: Enable security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) via `next.config.mjs` or middleware; require TLS everywhere.
- **Authentication**: Confirm Supabase auth configuration (password policies, MFA optionality, session lifetimes). Protect admin routes and operations via RBAC; audit JWT verification in middleware.
- **Secrets in clients**: Ensure no server credentials are exposed to the browser (especially Supabase service keys); use RLS and stored procedures for sensitive operations.

## 7) UX, Accessibility, and Content
- **Accessibility audit**: Run automated checks (axe) and manual keyboard/screen-reader passes for primary workflows. Fix color contrast, focus order, and ARIA labels.
- **Localization/readiness**: Centralize user-facing strings and ensure units/currency formatting are consistent across regions.
- **Error/empty states**: Provide informative empty states and recovery guidance for each dashboard pane and upload flow.

## 8) Release & Operations
- **Deployment strategy**: Choose blue/green or canary deployments with health checks. Automate rollbacks on failed health or elevated error rates.
- **Monitoring & alerts**: Wire alerts for API 5xx, worker failures, job queue backlogs, and key business KPIs (missed savings, import failure rate). Include on-call rotation and escalation paths.
- **Incident runbooks**: Document playbooks for auth outages, Supabase downtime, AI provider issues, and bad deploys. Include communication templates.
- **Capacity planning**: Size Supabase/Postgres, storage buckets, and AI provider quotas for expected load; add autoscaling policies where supported.
- **Compliance & retention**: Define data retention/deletion policies, especially for invoices and contracts. Ensure audit logging is retained per policy.

## 9) Documentation & Onboarding
- **Update README/status docs**: Replace Phase 7/placeholder messaging with current state, supported environments, and deployment steps.
- **Developer onboarding**: Add a “first hour” guide covering environment setup (`pnpm`, Node version), database migrations, and test commands.
- **User guides**: Provide operator docs for uploading data, running analyses, interpreting charts, and exporting results.

## 10) Housekeeping
- **Branch hygiene**: Keep `main` protected with required checks and linear history. Remove stale branches after merging.
- **Artifacts**: Ensure `/public` assets and generated files are optimized and licensed; prune unused assets and dead code paths.
- **Schedules**: Set a pre-launch checklist owner and target dates; track completion in issue tracker to avoid drift.
