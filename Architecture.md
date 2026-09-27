# TidyBiz — Architecture

**Version:** 1.0  
**Status:** Development baseline  
**Purpose:** Technical architecture contract for the FreeBuff AI Agent. The PRD remains the source of truth for product scope and acceptance criteria.

---

## 1. Architecture Goals

TidyBiz is a small-business task and workflow management MVP built for a four-hour solo hackathon. Architecture must prioritize:

1. A working, publicly accessible deployment (static frontend host + Python backend host + Supabase PostgreSQL).
2. Reliable task creation, assignment, status changes, and persistence.
3. Explainable, deterministic Workflow Intelligence (“Needs Attention”).
4. A clear separation between UI, API/business logic, and persistence.
5. Minimal operational complexity and low risk during deployment.
6. A codebase that can be understood and extended by a developer or coding agent.

Do not introduce microservices, message queues, Kubernetes, event streaming, or complex authentication unless the current PRD explicitly requires them or the developer approves a change.

## 2. Recommended MVP Stack

Use the exact stack already established in the PRD where specified. If the PRD leaves a choice open, use this default:

| Layer | Default |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Material UI (MUI) |
| Backend | Python + FastAPI |
| Persistence | SQLite for local development only; Supabase PostgreSQL is the hosted database (owner decision, 2026-09-27 — see §14). |
| ORM / validation | SQLAlchemy 2.x + Pydantic |
| Database (hosted) | **Supabase PostgreSQL** (managed Postgres; project region corrected by the owner) |
| Database (local dev) | SQLite file by default, or Dockerized PostgreSQL for parity |
| Frontend hosting | Static hosting provider — to be selected after local verification and free-tier review |
| Backend hosting | Python-compatible hosting provider — to be selected after local verification and free-tier review |
| Container | Docker, optional per provider |
| API contract | REST JSON under `/api` |
| Testing | Pytest for backend; frontend build and focused UI/API smoke tests |

**Deployment caveat:** The hosted database is external to the backend process. Never rely on a local SQLite file in a deployed environment for durable demo data; deployed instances must point `DATABASE_URL` at Supabase PostgreSQL (or an explicitly approved alternative) and seed idempotently on startup. Do not silently claim ephemeral data is durable.

**Not part of the plan (owner decision, 2026-09-27):** Google Cloud Run, Cloud Build, Artifact Registry, Cloud SQL, and any Google Cloud deployment. Do not migrate the backend to Supabase Edge Functions or rewrite it in TypeScript — the Python FastAPI backend is retained as-is (see §14).

## 3. High-Level System Context

```text
                  Small Business User
                          |
                          v
                +-------------------+
                | Browser / React   |
                | Vite + MUI        |
                +-------------------+
                          |
                    HTTPS / JSON
                          |
                          v
                +-------------------+
                | FastAPI App       |
                |                   |
                | - REST routes     |
                | - Validation      |
                | - Business rules  |
                | - Attention rules |
                +-------------------+
                    |           |
                    v           v
             +------------+  +------------------+
             | SQLAlchemy |  | Seed / Demo Data|
             | Data Layer |  | Idempotent       |
             +------------+  +------------------+
                    |
                    v
             +-------------------+
             | Supabase          |
             | PostgreSQL        |
             | (managed, hosted) |
             +-------------------+

   Deployment: static frontend hosting + Python
   backend hosting (providers TBD); Supabase = database
```

## 4. Deployment Shape

### Preferred hackathon shape: one backend process, separately hosted frontend

The backend remains a single FastAPI process that can serve the built frontend from its own container when practical. With the Supabase migration the frontend will be deployed to a static hosting provider and the backend to a Python-compatible host, so the normal production shape is:

```text
Static hosting (frontend)            Python hosting (backend)
  React build (SPA)                    FastAPI process
       |                                    |
       |  browser calls /api/<host>/api     |
       +---------------->-------------------+
                                            |
                                       SQLAlchemy
                                            |
                                            v
                                  Supabase PostgreSQL
```

A single process serving both SPA and API (as implemented in `backend/app/main.py`) remains supported and may be used if the chosen backend host makes it simpler. Do not split the backend into multiple services.

### Runtime requirements

- Bind to `0.0.0.0`.
- Read the port from the `PORT` environment variable, with a local development fallback.
- Keep secrets out of source control.
- Use environment variables for database connection and deployment configuration (`DATABASE_URL`).
- Provide a health endpoint that does not expose secrets or database credentials.
- Configure CORS for the frontend's deployed origin once static hosting is chosen (local dev origin is already configured).
- Log useful errors to stdout/stderr without logging secrets or unnecessary personal data.
- Connect to Supabase PostgreSQL over TLS; see §14 for connection modes.

## 5. Backend Module Boundaries

Recommended structure:

```text
backend/
  app/
    main.py                 # FastAPI app, middleware, static hosting
    core/
      config.py             # Environment-based settings
      database.py           # Engine, session, transaction helpers
    models/
      business.py
      employee.py
      task.py
    schemas/
      business.py
      employee.py
      task.py
      dashboard.py
    api/
      routes/
        health.py
        employees.py
        tasks.py
        dashboard.py
    services/
      task_service.py       # Task business rules
      dashboard_service.py  # Aggregations and completion rate
      attention_service.py  # Deterministic attention rules
    seed/
      demo_data.py          # Idempotent demo seed
    tests/
      ...
frontend/
  src/
    app/
    components/
    features/
      dashboard/
      tasks/
      team/
    services/
      api.ts
    types/
    theme/
```

Keep route handlers thin. Routes parse/validate input, call a service, and return a response. Business logic must not be duplicated in React and FastAPI.

## 6. Domain Model

The detailed field names and constraints in the PRD take precedence. The conceptual entities are:

### Business
Represents the small business/workspace that owns tasks and employees.

- `id`
- `name`
- `created_at`

### Employee
A person who can be assigned tasks within a business.

- `id`
- `business_id`
- `name`
- Optional role/title if included in the PRD
- `is_active` if required by the PRD

### Task
The central work item.

- `id`
- `business_id`
- `title`
- `description` (optional)
- `assignee_id` (nullable if unassigned tasks are supported)
- `priority`
- `status`
- `due_at` (nullable only if allowed by PRD)
- `created_at`
- `updated_at`
- `completed_at` (set when completed; clear or preserve according to a consistent status-transition rule)

Use database constraints and foreign keys. Store timestamps consistently (UTC recommended) and render them in the user's intended business-local timezone. If the MVP uses date-only deadlines, use one consistent date-only representation end-to-end.

## 7. Core Business Rules

- A task must have a valid title and valid enum values.
- An assigned employee must exist and belong to the same business.
- Priority and status must use the canonical enums defined in the PRD; do not create alternate spellings in the UI.
- A status change must update `updated_at`.
- Completing a task must set `completed_at`; reopening it must follow one documented, consistent policy.
- Overdue means: task is not completed, has a due date/time, and its deadline is before the current application time.
- Completion rate = completed task count / total task count × 100. If there are no tasks, return 0 (or the exact empty-state contract chosen in the PRD), never divide by zero.
- Attention items are computed from persisted task data; do not hardcode dashboard results.
- Demo seeding must be idempotent and must not create duplicate employees/tasks on every restart.

## 8. Workflow Intelligence / Needs Attention

This is a deterministic rules engine, not an LLM feature. It must be fast, transparent, and reproducible.

```text
Persisted tasks + employee data
             |
             v
     Normalize task fields
             |
             v
    Evaluate each rule:
    - overdue and open
    - blocked
    - critical/high priority due soon
    - excessive overdue workload per assignee
             |
             v
    Emit attention item with:
    task/employee reference, severity, reason, suggested next step
             |
             v
      Sort by severity, then deadline
             |
             v
       Needs Attention UI
```

Every attention item must explain *why* it appears and what record triggered it. Avoid unsupported predictions, opaque “AI scores,” or claims that the engine understands employee intent.

Suggested response fields:

```json
{
  "id": "stable-rule-and-record-key",
  "rule_code": "OVERDUE_TASK",
  "severity": "critical",
  "title": "Task is overdue",
  "reason": "The due time has passed and the task is not complete.",
  "task_id": "task-id",
  "assignee_id": "employee-id",
  "suggested_action": "Review the deadline or update the task status."
}
```

Use the actual canonical response contract from the PRD if it differs.

## 9. API Contract

The PRD's endpoint table is authoritative. At minimum, keep the following responsibilities separate:

| Route | Responsibility |
|---|---|
| `GET /health` | Liveness/health response |
| `GET /api/employees` | List team members |
| `POST /api/employees` | Create employee, if in MVP scope |
| `GET /api/tasks` | List tasks with supported filters |
| `POST /api/tasks` | Create task |
| `GET /api/tasks/{id}` | Fetch one task if specified |
| `PATCH /api/tasks/{id}` | Update fields/status |
| `DELETE /api/tasks/{id}` | Delete only if required by PRD |
| `GET /api/dashboard/summary` | Dashboard counts and completion rate |
| `GET /api/dashboard/attention` | Explainable attention items |

Requirements:

- Use Pydantic request and response schemas.
- Return appropriate HTTP status codes and clear error messages.
- Validate filter and sort values against supported options.
- Avoid returning ORM internals or secrets.
- Keep API field names consistent with frontend TypeScript types.
- Use a single API client module in React; do not scatter raw `fetch` calls through components.

## 10. Frontend Data Flow

```text
Page loads
   |
   v
API client requests summary, tasks, employees, attention
   |
   v
Loading state -> success state / recoverable error state
   |
   v
Render cards, task table, team snapshot, attention panel
   |
User creates/edits/status-updates a task
   |
   v
Submit mutation -> API validates and persists
   |
   v
Refresh or update affected queries
   |
   v
Dashboard + attention reflect persisted result
```

Do not show a success toast until the API confirms success. Use loading, empty, and error states. A failed API request must not be represented as an empty successful dashboard.

## 11. Security and Data Handling

For hackathon MVP:

- Do not commit `.env`, service-account keys, database passwords, API tokens, or Supabase service-role keys.
- Use the hosting provider's environment/secret configuration; never paste credentials into source files.
- Validate all client input on the server.
- Avoid rendering user-provided text as raw HTML.
- Restrict employee/task access to the relevant business/workspace context.
- Do not add real customer data to demo seed records.
- If authentication is not in the agreed MVP, state that the demo is a single-workspace prototype and do not imply production-grade access control.

## 12. Observability and Failure Handling

- Log startup configuration without printing secrets.
- Log request failures with route and correlation context where practical.
- Return structured, non-sensitive API errors.
- Database connection failure should produce a clear startup/deployment error, not silently fall back to volatile storage.
- Seed failures must be visible.
- Include a manual smoke-test checklist for the deployed frontend/backend URLs.

## 13. Architecture Decision Rules

1. Prefer the smallest design that meets the PRD and deployment requirement.
2. Prefer a monolith over multiple services.
3. Prefer deterministic rules over generative AI for workflow alerts.
4. Prefer persisted data over frontend-only mock state.
5. Prefer one canonical schema and enum set.
6. Do not add a dependency unless it removes more risk or work than it introduces.
7. Any change to stack, data model, or deployment topology must be recorded in `Memory.md` and, if material, in the PRD decision log.

## 14. Hosting Decision — Supabase Migration (2026-09-27, canonical)

The owner has made the following decisions canonical. They supersede any earlier Google Cloud references in this document and in `System_Prompt.md` / `Phases.md` / `Rules.md`.

1. **Supabase PostgreSQL is the hosted database** for the deployed MVP.
2. **The backend stays Python FastAPI.** No migration to Supabase Edge Functions, no TypeScript rewrite, no Deno runtime. Supabase is used as a managed PostgreSQL provider only for the MVP.
3. **Google Cloud is removed from the deployment plan:** no Cloud Run, Cloud Build, Artifact Registry, Cloud SQL, or GCP deployment steps.
4. **Frontend:** static hosting provider (to be selected later, after local verification and a free-tier review). **Backend:** Python-compatible hosting provider (same selection process). Neither is chosen yet; do not provision anything in the meantime.
5. **Supabase Auth and Storage are optional future capabilities** — not required by, and not assumed present in, the MVP. The MVP remains a single-workspace public demo without authentication, as documented in the PRD.
6. **No GitHub remote yet.**

### Supabase PostgreSQL connection guidance (for Phase 8; do not connect before owner authorization)

- **Configuration:** everything flows through `DATABASE_URL` (SQLAlchemy URL), supplied via hosting-provider environment configuration. Format: `postgresql+psycopg://<user>:<password>@<host>:<port>/<database>` — with the project password supplied by the owner at connect time; never committed.
- **Connection modes:**
  - **Direct connection** — host `db.<project-ref>.supabase.co`, port `5432`. Simplest for migrations and admin work; requires IPv6 support or a resolved IPv4 add-on on the hosting provider. Use for Alembic migrations.
  - **Session pooler (Supavisor)** — port `5432` on the pooler hostname, one server-side session per client connection. Suitable for long-lived Python backends when IPv4 is required. Do **not** guess the pooler hostname; read it from the owner's Supabase project settings when connecting is authorized.
  - **Transaction pooler** — port `6543`; only compatible with connection setups that disable prepared statements and server-side sessions. Avoid unless a future constraint forces it.
- **Driver:** `psycopg` (SQLAlchemy `postgresql+psycopg://`). Already in backend dependencies.
- **TLS:** Supabase requires SSL. Configure the engine with `sslmode=require` (via URL query parameter or `connect_args`), verified against the project's documented settings at connect time.
- **Pooling in the app:** keep a modest engine pool; hosted platforms scale by instances. Set `pool_pre_ping=True` (already done) so idle TCP connections dropped by the pooler are detected and retried.
- **Do not hardcode** hostnames, passwords, or the service-role key anywhere; the service-role key must never be used by the backend for routine CRUD.
