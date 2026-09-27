# TidyBiz — Development Phases

**Version:** 1.0  
**Purpose:** Execution plan for the FreeBuff AI Agent and developer. Follow phases in order. The four-hour hackathon target takes precedence over optional polish.

---

## Phase 0 — Repository and Environment Reconnaissance

**Goal:** Understand the environment before changing files.

Tasks:
- Inspect repository contents and current branch.
- Read `PRD.md`, `Architecture.md`, `Design.md`, `Rules.md`, and this file.
- Inspect installed runtimes, package managers, Docker, and Git. (Legacy note: `gcloud`/Google Cloud checks were removed from this phase by the 2026-09-27 architecture decision; deployment now targets static frontend hosting + Python backend hosting + Supabase PostgreSQL.)
- Identify existing code that should be preserved.

Exit criteria:
- A concise environment summary is appended to `Memory.md`.
- Stack and folder structure are confirmed or a minimal deviation is proposed.
- No destructive changes have been made.

## Phase 1 — Scaffold and Health Check

**Goal:** Establish a runnable full-stack skeleton.

Tasks:
- Create backend and frontend structure per Architecture.md.
- Add FastAPI application and `/health` endpoint.
- Add React + Vite + TypeScript + MUI app shell.
- Configure environment loading and safe defaults.
- Add `.gitignore` and `.env.example`; ensure real secrets are excluded.
- Confirm frontend and backend start locally.

Exit criteria:
- Backend health endpoint responds successfully.
- Frontend renders the TidyBiz shell.
- Setup commands are documented.
- Record actual commands/results in `Memory.md`.

## Phase 2 — Data Model, Database, and Seed Data

**Goal:** Persist businesses, employees, and tasks.

Tasks:
- Implement ORM models and database constraints from PRD.
- Implement session/transaction handling.
- Add schema initialization/migrations appropriate to the timebox (Alembic preferred over `create_all` as the migration mechanism).
- Add idempotent demo seed data for a small business scenario.
- Ensure seed data includes varied statuses, priorities, deadlines, and employee workloads.
- Confirm reseeding does not duplicate records.
- Keep the application PostgreSQL-compatible and Supabase-ready via environment-based `DATABASE_URL` configuration; local development runs on SQLite or Dockerized PostgreSQL without requiring Supabase credentials.

Exit criteria:
- Data persists across app/API restarts in the local environment.
- Foreign-key and enum validation work.
- Seed command/startup behavior is documented.
- No production persistence claims are made until the hosted Supabase PostgreSQL database is connected and verified.

## Phase 3 — Core API and Task Workflow

**Goal:** Implement the functional workflow required by the official problem statement.

Tasks:
- Implement employee list/create endpoints if in PRD scope.
- Implement task list with supported filters.
- Implement task create, read, update, and delete only to the extent specified in PRD.
- Implement assignment, priority, due date, and status updates.
- Validate requests server-side and return useful HTTP errors.
- Add focused API tests for happy paths and invalid input.

Exit criteria:
- Tasks can be created, assigned, updated, filtered, and persisted.
- Invalid assignees and invalid enum values are rejected.
- Tests pass or any failing tests are explicitly logged with causes.

## Phase 4 — Dashboard and Productivity Statistics

**Goal:** Make operational status visible and satisfy the “Basic Productivity Statistics” suggestion.

Tasks:
- Implement dashboard summary from persisted records.
- Include total, open, completed, overdue, blocked, and due-today counts as specified in PRD.
- Implement completion rate as completed / total × 100 with zero-task handling.
- Implement per-employee workload counts.
- Ensure dashboard labels include “Team Productivity Overview” or “Workload Snapshot.”

Exit criteria:
- Metrics match database records.
- Completion-rate calculation is verified.
- Dashboard API contract is documented and logged.

## Phase 5 — Workflow Intelligence / Needs Attention

**Goal:** Deliver TidyBiz's central differentiator: deterministic, explainable workflow alerts.

Tasks:
- Implement each P0 rule in the PRD.
- Each result must include rule identifier, severity, reason, linked task/employee where applicable, and suggested next step.
- Sort deterministically.
- Add tests for each rule, boundary conditions, completed-task exclusion, and no-deadline cases.
- Avoid LLM-generated or hardcoded alert content.

Exit criteria:
- A seeded overdue, blocked, and due-soon task produces the expected explanation.
- Completed tasks do not incorrectly appear as overdue.
- Attention results update after task mutations.

## Phase 6 — Frontend Core Screens

**Goal:** Deliver a usable UI connected to real API data.

Tasks:
- Build dashboard KPI cards.
- Build Needs Attention panel with explanations and task actions.
- Build Team Productivity Overview.
- Build task list/table and working search/filter controls.
- Build create/edit task form with assignment, priority, deadline, and status.
- Build team view if in MVP scope.
- Implement loading, empty, error, validation, and success states.
- Verify responsive layout and keyboard usability.

Exit criteria:
- No core screen relies on hardcoded mock data.
- Task mutations update the visible dashboard and attention panel.
- No placeholder controls remain in the MVP path.

## Phase 7 — Integration and Local Verification

**Goal:** Verify the complete product before deployment.

Tasks:
- Run backend tests.
- Run frontend production build.
- Run the app using documented setup instructions.
- Execute the end-to-end smoke test: create task → assign → update status → refresh dashboard → verify attention changes.
- Verify completion rate against known seed data.
- Fix P0 defects before proceeding.

Exit criteria:
- Backend tests pass or failures are transparently documented.
- Frontend production build succeeds.
- Critical user journey works locally.
- `Memory.md` lists actual verification results.

## Phase 8 — Deployment (static frontend + Python backend + Supabase PostgreSQL)

**Goal:** Publish the working application at a public URL.

Tasks:
- Select frontend static hosting and Python backend hosting with the owner after a free-tier review (not before local verification is complete).
- Ensure frontend production build is served correctly (by the static host, or by the backend process if the chosen backend host makes that simpler).
- Configure runtime port and environment variables via the hosting provider's secret/environment configuration.
- Configure the Supabase PostgreSQL `DATABASE_URL` (connection mode per Architecture.md §14) and run Alembic migrations against it — only with the owner's explicit authorization to connect.
- Verify the public URL is reachable by the jury.
- Do not expose database passwords or Supabase service-role keys.

Exit criteria:
- Frontend and backend hosts report successful deployments.
- Public URL loads the app.
- `/health` and core API endpoints work.
- Create/update/refresh persistence is verified in the deployed environment against Supabase PostgreSQL.
- Any persistence limitation is documented honestly.

## Phase 9 — Submission and Demo Packaging

**Goal:** Make the submission complete and easy to evaluate.

Tasks:
- Complete README with project overview, features, architecture, setup, environment variables, and deployment notes.
- Confirm GitHub repository is public and contains source code without secrets.
- Prepare poster content and publish required social post.
- Include required mentions and official hashtags from the PRD/problem statement.
- Rehearse a 2–3 minute demo using actual deployed behavior.
- Verify submission links and documentation.

Exit criteria:
- Public GitHub URL, deployed application URL, public social post URL, poster, and README are ready.
- Demo script matches actual application behavior.
- Known limitations are documented.

---

## Four-Hour Execution Target

Use this as a prioritization guide, not as permission to skip deployment verification.

```text
00:00  Environment, repo, cloud feasibility, skeleton, health endpoint
00:10  Models, database, idempotent demo seed
00:30  Task/employee APIs and focused tests
00:55  Dashboard summary + completion rate
01:10  Needs Attention rules and tests
01:25  React shell, KPI cards, task table
02:00  Task form, assignment, filters, productivity overview
02:20  Attention panel and end-to-end refresh behavior
02:40  Container/build and hosting deployment (static host + backend host + Supabase)
03:10  Public URL smoke test and persistence verification
03:30  README, GitHub, poster/social post, demo rehearsal
04:00  Submission-ready; document limitations
```

## Scope Control

### P0 — Must ship
- Persisted task CRUD/workflow core.
- Employee assignment.
- Priority, deadlines, and status.
- Dashboard metrics and completion rate.
- Team Productivity Overview / Workload Snapshot.
- Explainable Needs Attention rules.
- Public deployment (static frontend + Python backend + Supabase PostgreSQL).
- README and public repository.

### P1 — Ship only after P0 works
- Additional filters and quality-of-life improvements.
- Better empty/error/loading states.
- Responsive polish.
- Additional dashboard visualization that uses real data.

### P2 — Defer
- Authentication/roles beyond the explicitly agreed MVP.
- Notifications, email, WhatsApp integrations.
- AI-generated task planning or predictive scoring.
- Multi-tenant production hardening.
- Complex analytics, audit history, recurring tasks, file attachments.
- Any feature not required for a functional and deployed MVP.

## Phase Completion Reporting

At the end of every phase, the agent must:
1. State what was actually implemented.
2. List files changed.
3. Report commands/tests and actual outcomes.
4. Update `Memory.md`.
5. Identify blockers and the next phase.
6. Never silently skip a failed exit criterion.
