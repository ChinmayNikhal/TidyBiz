# TidyBiz — API Contract

**Version:** 1.0
**Status:** Canonical frontend/backend interface contract (Phase 0)
**Source:** Derived from `PRD.md` §11 and §10, cross-checked against `Architecture.md` §8–9.
**Audience:** Sufficient for a frontend developer/agent to implement the entire UI without reading backend code.

When the API changes, update this file **in the same change**, update backend schemas/tests, and report any required frontend changes.

---

## 1. Base Path and Versioning

- **Base path:** `/api` — all endpoints below are relative to it.
- **Versioning convention:** Unversioned paths for the hackathon MVP (`/api/...`, not `/api/v1/...`). Breaking changes during the sprint must be recorded in this file and in `Memory.md`.
- **Content type:** All request and response bodies are `application/json; charset=utf-8`, except `DELETE` responses which return no body.
- **Local base URL:** `http://localhost:8000/api`
- **Production shape (Supabase-era architecture):** the FastAPI backend and the static frontend are hosted **independently**; the browser calls the backend's API base URL. Supabase provides the managed PostgreSQL database only — no Supabase Edge Functions, no backend rewrite. Hosting providers are **not yet selected or provisioned**. In local development the frontend runs on a different origin (Vite dev server, port 5173), so CORS is configured for it — see §14. The legacy single-process shape (backend serving the built SPA) remains supported by the code but is no longer the target architecture.

## 2. Conventions

- **Field naming:** `snake_case` everywhere — database columns, Pydantic schemas, JSON payloads, and TypeScript types. One canonical convention; do not rename fields after frontend work begins.
- **IDs:** Server-generated UUID strings (e.g., `"7f3c..."`). The client never supplies IDs on create.
- **Timestamps:** ISO 8601 with explicit UTC offset or `Z` suffix (e.g., `2026-09-28T16:00:00Z`). Stored in UTC (timezone-aware). Business-date calculations use the business timezone (`Asia/Kolkata`).
- **Enums:** Canonical uppercase string values, defined once and shared across backend and frontend:
  - `TaskStatus`: `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`
  - `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `EmployeeRole`: `OWNER`, `MANAGER`, `EMPLOYEE`
  - `AttentionType`: `OVERDUE_TASK`, `BLOCKED_TASK`, `CRITICAL_DEADLINE`, `EMPLOYEE_OVERDUE_LOAD`, `HIGH_PRIORITY_BLOCKED`
  - `AttentionSeverity`: `HIGH`, `MEDIUM`, `LOW`
  - `AttentionCategory` (task filter): `overdue`, `due_today`, `blocked`, `upcoming`
- **Nullable fields:** Explicitly marked below. Omitted-optional vs. explicit `null` are both accepted on input for nullable fields.
- **Unknown fields** in requests are ignored, not rejected.
- **Server-generated fields** (never trusted from client): `id`, `created_at`, `updated_at`.

## 3. Health

### `GET /api/health`

Liveness/readiness check. No auth. No DB dependency for liveness; reports DB connectivity status without exposing credentials.

**Response `200`:**
```json
{
  "status": "ok",
  "service": "tidybiz-backend",
  "version": "0.1.0",
  "database": "connected",
  "time": "2026-09-27T10:00:00.000Z"
}
```
- `database`: `connected` | `unavailable` (a `503` is not used for MVP; the app can serve the UI while the DB is down — the DB state is reported honestly).
- `time`: server current time, UTC ISO 8601.

## 4. Business

### `GET /api/business`

Returns the configured demo business (PrintWorks Studio). Single-workspace MVP.

**Response `200`:**
```json
{
  "id": "b0a1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
  "name": "PrintWorks Studio",
  "category": "Printing and design",
  "timezone": "Asia/Kolkata",
  "created_at": "2026-09-27T06:00:00Z"
}
```

**Errors:** `404` if the business record does not exist (seed has not run — seed runs automatically on startup).

## 5. Employees

### `GET /api/employees`

List all employees of the demo workspace, ordered by `name` ascending.

**Response `200`:**
```json
{
  "items": [
    {
      "id": "e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "business_id": "b0a1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
      "name": "Asha",
      "role": "OWNER",
      "department": "Management",
      "is_active": true,
      "created_at": "2026-09-27T06:00:00Z"
    }
  ]
}
```

### `POST /api/employees` (P1 — implement only after P0 works)

Create an employee.

**Request body:**
```json
{
  "name": "Karan",
  "role": "EMPLOYEE",
  "department": "Dispatch",
  "is_active": true
}
```
- `name`: required, 1–120 chars after trim.
- `role`: required, `EmployeeRole`. Default if omitted: `EMPLOYEE`.
- `department`: optional, nullable, ≤ 80 chars.
- `is_active`: optional, default `true`.

**Response `201`:** the created employee object (same shape as list items). `business_id` is set server-side to the demo workspace.

**Errors:** `422` validation failure.

### `PATCH /api/employees/{employee_id}` (P1)

Partial update. Omitted fields unchanged. Same validation as create for supplied fields.

**Response `200`:** updated employee object.
**Errors:** `404` unknown ID; `422` validation failure.

## 6. Tasks

### `GET /api/tasks`

List tasks. All filters optional and combinable; multiple filters are ANDed.

**Query parameters:**

| Param | Type | Notes |
|---|---|---|
| `status` | `TaskStatus` | Exact match. Invalid enum → `422`. |
| `priority` | `TaskPriority` | Exact match. Invalid enum → `422`. |
| `assignee_id` | UUID string | Exact match. Unknown ID is not an error — returns empty list. |
| `attention` | `AttentionCategory` | `overdue`, `due_today`, `blocked`, `upcoming` — computed from `due_at` vs. current business time, excluding `COMPLETED` tasks. |
| `search` | string | Case-insensitive substring match on `title` (P1). |

Default order: `due_at` ascending. No pagination in MVP (demo dataset is small); the envelope is future-proofed with an `items` array.

**Response `200`:**
```json
{
  "items": [
    {
      "id": "t9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
      "business_id": "b0a1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
      "title": "Prepare customer brochure",
      "description": "Finalize the brochure design for customer approval.",
      "assignee_id": "e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "due_at": "2026-09-28T10:30:00Z",
      "category": "Design",
      "completed_at": null,
      "created_at": "2026-09-27T06:00:00Z",
      "updated_at": "2026-09-27T06:05:00Z"
    }
  ]
}
```
- `description` and `category` are nullable and may be `null`.
- `completed_at` is **server-managed and nullable**: `null` for open tasks; set to the completion timestamp when status transitions to `COMPLETED`; **cleared (null)** when a completed task is reopened. It is never accepted from the client.
- `assignee_id` is non-null for MVP tasks (PRD: assignee required for normal tasks).

### `POST /api/tasks`

Create a task.

**Request body:**
```json
{
  "title": "Prepare customer brochure",
  "description": "Finalize the brochure design for customer approval.",
  "assignee_id": "e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "priority": "HIGH",
  "due_at": "2026-09-28T16:00:00+05:30",
  "status": "TODO",
  "category": "Design"
}
```

| Field | Required | Rules |
|---|---|---|
| `title` | Yes | Trimmed non-empty; 1–160 chars |
| `description` | No | Nullable, plain text, ≤ 2000 chars |
| `assignee_id` | Yes | Must reference an **active** employee in the same business. Violation → `422`. |
| `priority` | Yes | `TaskPriority`. Default if omitted: `MEDIUM` |
| `due_at` | Yes | ISO 8601 timestamp with offset; converted to UTC |
| `status` | No | `TaskStatus`. Default: `TODO` |
| `category` | No | Nullable, ≤ 80 chars |

**Response `201`:** the created task (same shape as list items).

**Errors:**
- `422`: validation failure (empty title, bad enum, missing required field, unknown/inactive/mismatched-business assignee, unparseable `due_at`).
- Error body follows the standard schema in §13.

### `GET /api/tasks/{task_id}`

**Response `200`:** single task object.
**Errors:** `404` if not found.

### `PATCH /api/tasks/{task_id}`

Partial update; omitted fields unchanged. Same per-field validation as create. Changing `assignee_id` re-validates activity and business membership.

**`completed_at` policy (server-managed):** transitioning `status` to `COMPLETED` sets `completed_at` to the server's current UTC time; transitioning from `COMPLETED` to any other status clears it to `null`. Reopening recalculates overdue state from `due_at`. `completed_at` is not client-settable.

**Database-level integrity (enforced by the schema, independent of Phase 3 API validation):**

| Constraint | Level |
|---|---|
| `tasks.assignee_id` → `employees.id` FK; `tasks.business_id` → `businesses.id` FK; `employees.business_id` → `businesses.id` FK | DB (both engines) |
| `CHECK` on `status` (TODO/IN_PROGRESS/BLOCKED/COMPLETED), `priority` (LOW/MEDIUM/HIGH/CRITICAL), `employees.role` (OWNER/MANAGER/EMPLOYEE) | DB (both engines) |
| Unique `(business_id, name)` on employees — a name identifies one teammate per workspace; doubles as the stable seed key for employees | DB (both engines) |
| Unique `seed_key` on tasks — stable seed identifier for demo tasks (nullable; user-created tasks leave it NULL) | DB (both engines) |
| Foreign keys enforced on SQLite via `PRAGMA foreign_keys=ON` (off by default there); native on PostgreSQL | DB driver setting |
| Assignee is active + belongs to the same business as the task; `due_at` required; title 1–160 after trim | **API validation (Phase 3)** — not a DB constraint |

Indexes: `tasks(business_id, assignee_id, status, due_at, priority)`, `employees(business_id)` — see migration `0001_initial_schema.py`.

**Response `200`:** updated task object.
**Errors:** `404` unknown ID; `422` validation failure.

### `DELETE /api/tasks/{task_id}`

**Response `204`:** no body.
**Errors:** `404` if not found.

## 7. Dashboard Summary

### `GET /api/dashboard/summary`

All values computed live from persisted task records. No cache in MVP.

**Response `200`:**
```json
{
  "total_tasks": 24,
  "open_tasks": 14,
  "completed_tasks": 10,
  "overdue_tasks": 3,
  "blocked_tasks": 2,
  "due_today": 4,
  "completion_rate": 41.67
}
```

Definitions (PRD §6.8, authoritative):
- `total_tasks`: all tasks in the workspace.
- `open_tasks`: status ≠ `COMPLETED`.
- `completed_tasks`: status = `COMPLETED`.
- `overdue_tasks`: open tasks with `due_at` < now (business timezone aware).
- `blocked_tasks`: status = `BLOCKED` (subset of open).
- `due_today`: open, not overdue, due on the current business date.
- `completion_rate`: `completed_tasks / total_tasks × 100`, rounded to 2 decimals. **`0` when `total_tasks == 0`** (never divide by zero).

## 8. Needs Attention

### `GET /api/dashboard/attention`

Deterministic rules engine output. Computed from persisted tasks + employees at request time. Never mutates tasks.

**Response `200`:**
```json
{
  "items": [
    {
      "id": "OVERDUE_TASK:t9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
      "rule_code": "OVERDUE_TASK",
      "severity": "HIGH",
      "title": "Task is overdue",
      "reason": "The due time has passed and the task is not completed.",
      "task_id": "t9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
      "assignee_id": "e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "due_at": "2026-09-26T12:00:00Z",
      "suggested_action": "Review the deadline or update the task status."
    }
  ]
}
```

Rules (PRD §6.9):

| Rule | Condition | `rule_code` | Severity | Notes |
|---|---|---|---|---|
| R1 | Open and overdue | `OVERDUE_TASK` | `HIGH` | One item per overdue task. |
| R2 | Status = `BLOCKED` | `BLOCKED_TASK` | `HIGH` | One per blocked task. |
| R3 | `CRITICAL` priority, due today or overdue, not completed | `CRITICAL_DEADLINE` | `HIGH` | `due_at` included. |
| R4 | Employee has ≥ 2 overdue open tasks | `EMPLOYEE_OVERDUE_LOAD` | `MEDIUM` | Threshold is a named backend constant (`EMPLOYEE_OVERDUE_LOAD_THRESHOLD = 2`), not duplicated in UI. One item per qualifying employee; `task_id` is null. |
| R5 | `HIGH` or `CRITICAL` task blocked | `HIGH_PRIORITY_BLOCKED` | `MEDIUM` | In addition to R2 for the same task. |

- Completed tasks never appear in any rule.
- `id` = `"{rule_code}:{task_id or employee_id}"` — stable and deduplicating.
- Sort order: severity (`HIGH` before `MEDIUM`), then `due_at` ascending (nulls last), then stable `id`. Deterministic for identical data + evaluation time.
- Fields: `task_id` null for employee-level rules (R4); `assignee_id` null for task-level rules without a clear single employee (none in the current rule set); `due_at` null where not applicable.

## 9. Workload

### `GET /api/dashboard/workload` (P1)

Per-employee task counts derived from persisted records. These are workload indicators, **not** performance scores.

**Response `200`:**
```json
{
  "items": [
    {
      "employee_id": "e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "name": "Asha",
      "role": "OWNER",
      "is_active": true,
      "open_tasks": 3,
      "overdue_tasks": 1,
      "blocked_tasks": 0,
      "completed_tasks": 5
    }
  ]
}
```
Ordered by `name` ascending. Inactive employees are included (with their historical counts).

## 10. Error Schema

All error responses use one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "1 validation error for request body",
    "details": [
      { "field": "title", "issue": "String should have at least 1 character" }
    ]
  }
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request |
| 404 | `NOT_FOUND` | Unknown task/employee/business ID |
| 409 | `CONFLICT` | Reserved for future use (not used in MVP) |
| 422 | `VALIDATION_ERROR` | Schema/enum/field validation failure, invalid assignee |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected failure; no stack traces or secrets exposed |

FastAPI's default validation error shape is translated into the standard envelope by a shared exception handler so the frontend only ever parses one error format.

## 11. HTTP Status Codes

- `200` retrieval/update success
- `201` creation success
- `204` deletion success (no body)
- `400`/`404`/`409`/`422`/`500` per §10
- CORS preflight (`OPTIONS`) handled by middleware; see §14.

## 12. Date/Time and Timezone Policy

- All API timestamps: ISO 8601, UTC (offset `Z` or `+00:00`).
- Clients may submit `due_at` with any explicit offset (e.g., `+05:30`); the server normalizes to UTC.
- Business-date calculations (overdue, due-today, workload windows) use the business timezone (`Asia/Kolkata`), evaluated server-side at request time.
- Completed tasks are excluded from deadline classifications regardless of due date.

## 13. Demo Seed Behavior

- Seed runs **automatically on backend startup** (idempotent; also exposed as an idempotent CLI/library call).
- Demo business: **PrintWorks Studio** (Printing and design, `Asia/Kolkata`).
- Seed employees (fictional): Asha (Owner), Riya, Arjun, Neha.
- Seed tasks deliberately cover: overdue open, due today, upcoming, blocked, critical/high priority, completed, and deliberately uneven per-employee workload — with deadlines **relative to seed time** so attention states stay valid during judging.
- **Stable seed identifiers:** demo tasks carry a unique, nullable `seed_key` (e.g., `"approve-brochure-proof"`); employees are keyed by their unique-per-business name. Seeding **upserts by key** rather than blindly inserting.
- **Partial-seed recovery:** an interrupted seed run is repaired by the next run — missing business/employees/tasks are created, existing ones refreshed to demo values; no duplicates.
- Re-seeding refreshes demo-owned fields of demo rows (restoring the intended demo state) and never duplicates records.
- No authentication in MVP: the demo is a single public workspace. This is **not** production-grade security and must not be represented as such.
- Frontend assumes the workspace exists after first backend start; no client-side seeding logic.

## 14. CORS Behavior

- **Deployed (single backend process serving the SPA):** no CORS needed — same origin.
- **Deployed (separate static frontend host, the planned Supabase-era shape):** the backend allows the frontend's deployed origin via the `CORS_ORIGINS` environment variable (comma-separated). No wildcard in production.
- **Local dev:** Vite dev server (`http://localhost:5173`) is allowed by backend CORS middleware (default). The Vite dev server also proxies `/api` to the backend (see `frontend/vite.config.ts`), so the frontend code always calls relative `/api/...` paths and does not hardcode an origin.

## 15. Endpoint Summary

| Method | Path | Priority | Purpose |
|---|---|---|---|
| GET | `/api/health` | P0 | Health/readiness |
| GET | `/api/business` | P0 | Demo business profile |
| GET | `/api/employees` | P0 | List employees |
| POST | `/api/employees` | P1 | Add employee |
| PATCH | `/api/employees/{employee_id}` | P1 | Update/deactivate employee |
| GET | `/api/tasks` | P0 | List tasks with filters |
| POST | `/api/tasks` | P0 | Create task |
| GET | `/api/tasks/{task_id}` | P0 | Task details |
| PATCH | `/api/tasks/{task_id}` | P0 | Update task |
| DELETE | `/api/tasks/{task_id}` | P0 | Delete task |
| GET | `/api/dashboard/summary` | P0 | Dashboard metrics |
| GET | `/api/dashboard/attention` | P0 | Explainable attention items |
| GET | `/api/dashboard/workload` | P1 | Employee workload counts |

Scope note: P1 endpoints are implemented only after all P0 endpoints work end-to-end, per `Phases.md`.
