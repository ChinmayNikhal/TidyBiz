# TidyBiz — Less chasing. More doing.

A lightweight workflow and task management platform for small businesses, built for the FIT FEST Hackathon 2026 (Problem Statement 2).

TidyBiz centralizes tasks, assignments, priorities, and deadlines in one shared workspace, with a deterministic, explainable **Workflow Intelligence** engine that surfaces overdue, blocked, and critical work — no black-box AI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript, Material UI |
| Backend | Python 3.11 + FastAPI, Pydantic |
| ORM / DB | SQLAlchemy 2.x — SQLite or Dockerized PostgreSQL (local dev), Supabase PostgreSQL (hosted) |
| Container | Docker (single service: FastAPI serves SPA + API) |
| Tests | Pytest (backend), TypeScript + Vite production build (frontend) |

## Repository Layout

```text
tidybiz/
├── backend/          # FastAPI app (app/, tests/, requirements.txt)
├── frontend/         # React + Vite + MUI (src/, package.json)
├── docs/             # (reserved)
├── API.md            # Canonical frontend/backend API contract
├── Dockerfile        # Multi-stage single-service image
├── docker-compose.yml# Local dev stack (Postgres + api + frontend)
├── PRD.md            # Product requirements (source of truth)
├── Architecture.md   # Technical architecture contract
├── Design.md         # UI/interaction contract
├── Phases.md         # Development phases
├── Rules.md          # Agent/developer rules
└── Memory.md         # Dated agent working log
```

## Quick Start (Local Development)

Prerequisites: Python 3.11+, Node 22+, npm 10+. Docker optional.

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows Git Bash
# Linux/macOS: .venv/bin/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verify: `curl http://127.0.0.1:8000/api/health` → `{"status":"ok",...,"database":"connected"}`

Interactive API docs: http://127.0.0.1:8000/api/docs

On first startup the app creates tables and seeds the idempotent demo workspace (**PrintWorks Studio** — fictional employees Asha, Riya, Arjun, Neha, with 13 demo tasks covering overdue, due-today, upcoming, blocked, and completed states). Restarts never duplicate seed records (stable seed keys; see `API.md` §13).

**Option B — Dockerized PostgreSQL (parity with hosted Supabase):**

```bash
docker compose up -d db
cd backend
export TIDYBIZ_DATABASE_URL=postgresql+psycopg://tidybiz:tidybiz-dev-only@localhost:5432/tidybiz
.venv/Scripts/python -m alembic upgrade head     # schema via Alembic migrations
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Schema changes go through Alembic (`backend/alembic/versions/`). `create_all` remains only a local SQLite convenience.

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend, so no CORS setup is needed.

### 3. Run backend tests

```bash
cd backend
.venv/Scripts/python -m pytest -v

# Same suite against PostgreSQL (parity check; requires `docker compose up -d db`):
docker compose exec -T db psql -U tidybiz -d tidybiz -c "CREATE DATABASE tidybiz_test;"
export TIDYBIZ_DATABASE_URL=postgresql+psycopg://tidybiz:tidybiz-dev-only@localhost:5432/tidybiz_test
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m pytest -v
```

### 4. Frontend production build

```bash
cd frontend
npm run build
```

## Environment Variables

Copy `.env.example` to `backend/.env` and adjust. Placeholders only — never commit real values.

| Variable | Default | Purpose |
|---|---|---|
| `TIDYBIZ_DATABASE_URL` | `sqlite:///./tidybiz.db` | SQLAlchemy URL. Use Supabase PostgreSQL for hosted deployment (see below). |
| `TIDYBIZ_CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins (local dev only). |
| `TIDYBIZ_PORT` | `8000` | Local port fallback (Cloud Run supplies `PORT`). |
| `TIDYBIZ_SEED_ON_STARTUP` | `true` | Create tables + ensure idempotent demo seed on startup. |

## Docker

The `Dockerfile` builds the React frontend and serves it from the FastAPI process (`0.0.0.0:PORT`).

```bash
docker compose up db      # local PostgreSQL 16 (optional, for Phase 2+ parity)
docker compose up --build # full local stack: db + api + frontend
```

## Database: Local Postgres and Supabase (hosted)

**Local development** needs no credentials: SQLite by default, or Dockerized PostgreSQL for parity:

```bash
docker compose up db
docker compose up api   # uses compose Postgres via TIDYBIZ_DATABASE_URL
```

**Supabase (hosted) connection** — configured entirely through `DATABASE_URL`; no credentials belong in source files:

```bash
# Direct connection (migrations / admin):
TIDYBIZ_DATABASE_URL=postgresql+psycopg://<user>:<password>@db.<project-ref>.supabase.co:5432/<database>?sslmode=require
# Session pooler (long-lived app connections when IPv4 is required):
TIDYBIZ_DATABASE_URL=postgresql+psycopg://<user>:<password>/<db-host>:5432/<database>?sslmode=require
```

Read the exact host/credentials from your Supabase project settings when connecting is authorized — do not guess hostnames. Schema changes run through Alembic (`backend/alembic/`); `create_all` is only a local convenience. Details: `Architecture.md` §14.

## API Contract

See **[API.md](./API.md)** — the canonical interface contract (endpoints, JSON schemas, enums, error envelope, timezone policy, seed behavior). Implemented so far: `GET /api/health`, `GET /api/business`. Tasks, employees, dashboard, and Needs Attention endpoints land with Phases 2–5.

## Roadmap

Development follows `Phases.md`. Current status is always recorded in `Memory.md` (dated, factual entries).

- ✅ Phase 0 — reconnaissance, API contract
- ✅ Phase 1 — scaffold, health endpoint, verified frontend↔backend communication
- ✅ Phase 2 — data model, Alembic migrations, Supabase-ready persistence, idempotent demo seed
- ✅ Phase 3 — task & employee CRUD APIs with validation and status transitions
- ✅ Phase 4 — dashboard summary KPIs + Team Productivity Overview (Workload Snapshot)
- ✅ Phase 5 — Workflow Intelligence (deterministic Needs Attention rules engine R1–R5)
- ✅ Phase 6 — complete frontend operations desk (Dashboard, Tasks table with 5 filters, Team view, modaled task/member create & edit)
- ✅ Phase 7 — full-stack integration and local verification (88 backend tests passed, frontend build clean, live servers active)
- ⬜ Phase 8 — deployment (static frontend host + Python backend host + Supabase PostgreSQL)
- ⬜ Phase 9 — submission packaging

## Demo Access Note

The MVP exposes a single pre-seeded public demo workspace with fictional data and **no authentication**. This is intentional for judging and is not production-grade security.
