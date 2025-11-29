# Repository Guidelines

## Project Structure & Module Organization
- Next.js app router lives in `app/`; shared UI in `components/`; client hooks in `hooks/`; domain logic and utilities in `lib/`; shared types in `types/`; styles in `styles/`; static assets in `public/`. Supabase config/resources are under `supabase/`. Playwright artifacts live in `.playwright/`, `playwright-report/`, `test-results/`.
- Agent specifications and supporting docs sit in `agent_spec.yaml` and `docs/` plus the WasteWise guides in the repository root; treat these as the source of truth for workflow logic.

## Build, Test, and Development Commands
- `npm run dev` - start the Next.js dev server.
- `npm run build` / `npm run start` - production build and serve.
- `npm run lint` - lint with Next + TypeScript rules; fix warnings before sending a PR.
- `npm run worker` - run the background worker (`scripts/start-worker.ts`).
- `npm run seed` - load seed data for test projects.
- `npm run test` - run all Vitest suites; `test:unit`, `test:integration`, and `test:watch` for scope-specific runs.
- `npm run test:e2e` - headless end-to-end harness; `npm run test:ui` for the Playwright UI runner.

## Coding Style & Naming Conventions
- TypeScript + React with functional components; prefer server-first patterns in the `app/` router.
- Follow ESLint defaults from `next/core-web-vitals` and `next/typescript`; keep the codebase warning-free.
- Use camelCase for variables/functions, PascalCase for components and types, and kebab-case for route/feature file names.
- Centralize calculations and validation helpers in `lib/` and reuse rather than duplicating rules. Keep agent logic aligned with `agent_spec.yaml` and the README to avoid drift.

## Testing Guidelines
- Unit tests live in `__tests__/skills` and `__tests__/calculations`; integration coverage sits in `__tests__/integration`.
- Add Playwright fixtures/screenshots alongside e2e specs when UI changes affect flows.
- When touching calculations or validation gates, add Vitest cases around `lib/` helpers and a minimal e2e check for the impacted upload/report path. Note the exact command you ran in the PR (e.g., `npm run test:unit`).

## Commit & Pull Request Guidelines
- Use conventional commits (`feat:`, `fix:`, `ci:`, `security:`) with short, imperative subjects; include scopes when helpful (`feat(validation): ...`).
- PRs should include: a concise summary of the change, linked issue or phase, commands/tests executed, screenshots for UI/dashboard updates, and any config or migration notes.

## Security & Configuration
- Never commit secrets; start from `.env.example` or `.env.template` to craft `.env.local`.
- Keep Supabase keys/URLs in env vars and ensure `next.config.mjs` and `supabase/` values stay in sync.
- Validate uploaded files and external research steps against WasteWise constraints (limited searches, prefer .gov sources) before merging.
