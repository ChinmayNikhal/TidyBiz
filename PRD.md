# TidyBiz --- Product Requirements Document (PRD)

**Project:** TidyBiz\
**Product:** Small Business Workflow & Task Management Platform\
**Hackathon:** FIT FEST Hackathon 2026 --- Problem Statement 2\
**Document status:** Development baseline / MVP specification\
**Version:** 1.0\
**Date:** 27 September 2026\
**Delivery constraint:** Solo development; approximately four hours of
official development time\
**Deployment requirement:** Publicly accessible application on Google
Cloud Run\
**Repository requirement:** Public GitHub repository with source code
and setup documentation

------------------------------------------------------------------------

## 1. Purpose of This Document

This PRD is the authoritative development reference for TidyBiz during
the hackathon. It defines the problem, intended users, product scope,
functional and non-functional requirements, system architecture, data
model, API contract, workflow rules, acceptance criteria, development
phases, deployment requirements, testing strategy, and demo plan.

Implementation should follow this document unless a deliberate scope or
architecture decision is recorded in the project README or a later
version of this PRD.

### 1.1 Requirement priority

  -----------------------------------------------------------------------
  Priority                            Meaning
  ----------------------------------- -----------------------------------
  **P0 --- Must have**                Required for a credible, working
                                      MVP and final submission.

  **P1 --- Should have**              Implement after all P0 requirements
                                      work end-to-end and deployment is
                                      stable.

  **P2 --- Future**                   Explicitly excluded from the
                                      four-hour MVP.
  -----------------------------------------------------------------------

### 1.2 Product principles

1.  **Operational clarity over feature count.** Make it easy to
    understand what needs doing, who owns it, and what is at risk.
2.  **Reliable core before intelligence.** Task creation, assignment,
    status changes, and persistence must work without AI or external
    generative services.
3.  **Explainable workflow signals.** Every alert must be traceable to a
    clear rule and the underlying task data.
4.  **One source of truth.** The backend and persistent database are
    authoritative; frontend state is a representation of saved data.
5.  **Demo honestly.** Clearly distinguish implemented, tested
    capabilities from future architecture and roadmap items.

------------------------------------------------------------------------

## 2. Executive Summary

TidyBiz is a lightweight workflow and task management platform for small
businesses that coordinate daily work through disconnected tools such as
messaging apps, spreadsheets, phone calls, notebooks, and verbal
instructions.

TidyBiz provides a shared workspace to create and assign tasks, set
priorities and deadlines, update status, monitor outstanding work, and
identify operational issues such as overdue tasks, blocked work,
critical deadlines, and uneven task distribution.

The product is not intended to be another generic to-do list. Its
differentiator is a deterministic **Workflow Intelligence** layer that
turns task data into explainable, actionable attention items. The system
identifies conditions that may require intervention and links each
insight to the relevant task or employee.

The hackathon MVP will use a fictional small printing and design
business as its demonstration workspace. The product model should remain
industry-neutral.

### 2.1 Product vision

Make structured, transparent, and reliable daily operations accessible
to small teams without enterprise-level complexity.

### 2.2 Product mission

Help small businesses replace scattered task coordination with a shared,
actionable view of responsibilities, deadlines, and workflow health.

### 2.3 Product tagline

**Less chasing. More doing.**

### 2.4 Value proposition

For a small-business owner who needs to coordinate a team, TidyBiz
provides one place to organize work and quickly see what is pending,
overdue, blocked, or in need of attention---without requiring complex
project-management setup.

------------------------------------------------------------------------

## 3. Problem Statement and Context

### 3.1 Problem statement

Small businesses often manage daily operations through fragmented
communication and informal tracking. This makes it difficult to maintain
a shared understanding of:

-   What work needs to be completed.
-   Who is responsible for each task.
-   Which deadlines are approaching or have passed.
-   What is completed, in progress, blocked, or waiting.
-   Which operational issues require the owner's attention.

The problem is not merely the absence of a task list. It is the absence
of a reliable, shared operational view that connects work, ownership,
deadlines, and current status.

### 3.2 Example scenario

A small printing and design shop receives an order for 200 brochures.
The owner sends design requirements through a messaging app, discusses
paper availability over a phone call, and separately asks another
employee to arrange delivery. The customer then changes the delivery
deadline.

Without a shared workflow, different employees may act on different
versions of the instructions. The owner may not know that the design
approval is blocked or that dispatch is at risk until the deadline has
already passed.

TidyBiz centralizes the work record and exposes relevant workflow
conditions so the owner can take action.

### 3.3 Target business segments

The initial product is intended for small teams in businesses such as:

-   Printing and design shops.
-   Retail and local commerce.
-   Marketing and creative agencies.
-   Repair and service shops.
-   Small manufacturing and production units.

These are target use cases, not claims of validated market demand. The
MVP will use a printing and design shop for a clear, relatable
demonstration.

------------------------------------------------------------------------

## 4. Goals, Non-Goals, and Success Criteria

### 4.1 Product goals

1.  Centralize task records and ownership in a business workspace.
2.  Allow users to create, assign, prioritize, and update tasks.
3.  Make deadlines, overdue work, and blocked work visible.
4.  Provide a dashboard whose figures are derived from stored task
    records.
5.  Connect workflow alerts to actions that can resolve or manage the
    underlying issue.
6.  Deploy a functional application publicly on Google Cloud Run.
7.  Provide a maintainable foundation that can be extended beyond the
    hackathon.

### 4.2 Non-goals for the hackathon MVP

The following are explicitly out of scope unless all P0 requirements are
complete:

-   Full user registration, email verification, password reset, and
    production authentication.
-   Production-grade role-based access control or multi-tenant
    authorization.
-   Real-time collaboration or websocket updates.
-   Email, SMS, WhatsApp, or push notifications.
-   Recurring tasks, calendar synchronization, file attachments, and
    task comments.
-   Drag-and-drop Kanban interactions.
-   Advanced project plans, Gantt charts, or dependency graphs.
-   Payroll, attendance, time tracking, or employee performance scoring.
-   Predictive analytics or claims of AI-based forecasting.
-   LLM-dependent core functionality.
-   Billing, subscriptions, or payment integration.

### 4.3 MVP success criteria

  -----------------------------------------------------------------------
  Area                                Success criterion
  ----------------------------------- -----------------------------------
  Task lifecycle                      A user can create, view, edit,
                                      assign, update, and delete a task.

  Workflow                            Supported statuses and priorities
                                      are validated consistently.

  Dashboard                           Counts and lists update based on
                                      persisted task data.

  Attention engine                    Overdue, blocked, and critical work
                                      is surfaced with an understandable
                                      reason.

  Team                                Tasks can be assigned to demo
                                      employees and viewed by assignee.

  Persistence                         Data survives a browser refresh and
                                      normal application-container
                                      restart, subject to the selected
                                      external database.

  Deployment                          Cloud Run URL is publicly
                                      accessible to the jury and serves
                                      the working app.

  Submission                          Public GitHub repository, README,
                                      poster, and public social post are
                                      ready.
  -----------------------------------------------------------------------

These are project acceptance targets, not official hackathon scoring
criteria or production service-level guarantees.

------------------------------------------------------------------------

## 5. Users and Roles

### 5.1 Business owner / administrator

**Needs:** Understand overall work status, create and assign tasks, set
priorities, monitor risk, and intervene when required.

**MVP capabilities:** View all tasks and dashboard metrics; create,
edit, assign, reassign, and delete tasks; view team workload; update
task status.

### 5.2 Team lead / manager

**Needs:** Coordinate a subset of work, monitor progress, and address
blocked or overdue tasks.

**MVP treatment:** Represented as a role in demo data. Fine-grained
permissions are not required for the hackathon MVP.

### 5.3 Employee

**Needs:** Understand assigned work, priority, deadline, and current
status; update progress or mark work blocked.

**MVP treatment:** Employee records and assignee-filtered views are
supported. Independent employee login and authenticated personal
workspaces are future scope.

### 5.4 Demo access model

The MVP will use a preconfigured fictional business workspace with
seeded employees and tasks. The public demo may be accessible without
authentication to simplify judging. No real business or personal
information may be stored in this public demo.

The application must not represent the demo access model as
production-grade security.

------------------------------------------------------------------------

## 6. Product Scope and Feature Requirements

### 6.1 Workspace and business profile

**Priority: P0**

The application shall load a configured demo business and display its
name and category.

Minimum business fields:

  Field        Type                    Notes
  ------------ ----------------------- ------------------------------
  `id`         UUID or stable string   Unique business identifier
  `name`       String                  Display name
  `category`   String                  Business category
  `timezone`   IANA timezone string    Demo default: `Asia/Kolkata`

The MVP may seed the business at startup or through a controlled seed
command. It must not create duplicate seed records on every application
restart.

### 6.2 Team management

**Priority: P0 for listing and assignment; P1 for adding employees**

The application shall display the demo workspace's employees and allow
task assignment to a valid employee.

Minimum employee fields:

  -----------------------------------------------------------------------
  Field                   Type                    Notes
  ----------------------- ----------------------- -----------------------
  `id`                    UUID or stable string   Unique employee
                                                  identifier

  `business_id`           Foreign key             Owning workspace

  `name`                  String                  Display name

  `role`                  Enum                    `OWNER`, `MANAGER`,
                                                  `EMPLOYEE`

  `department`            Nullable string         Optional
                                                  team/department

  `is_active`             Boolean                 Inactive employees
                                                  cannot receive new
                                                  assignments
  -----------------------------------------------------------------------

P0: list employees and use them in task assignment and workload views.\
P1: create or deactivate an employee through the UI, provided core
workflow and deployment are complete.

### 6.3 Task creation

**Priority: P0**

A user shall be able to create a task through a form.

  -----------------------------------------------------------------------
  Field                   Required                Validation / behavior
  ----------------------- ----------------------- -----------------------
  Title                   Yes                     Trim whitespace; reject
                                                  empty values; set a
                                                  reasonable maximum
                                                  length, e.g. 160
                                                  characters

  Description             No                      Plain text; optional

  Assignee                Yes for normal tasks    Must reference an
                                                  active employee in the
                                                  same business

  Priority                Yes                     `LOW`, `MEDIUM`,
                                                  `HIGH`, or `CRITICAL`

  Due date/time           Yes for MVP             Valid timestamp;
                                                  interpret/display in
                                                  business timezone

  Status                  Defaults                New task defaults to
                                                  `TODO`

  Category                No                      Optional short label

  Created timestamp       Automatic               Set by backend

  Updated timestamp       Automatic               Set by backend
  -----------------------------------------------------------------------

The form shall provide clear validation messages. A failed request must
not clear the user's form or imply that the task was saved.

### 6.4 Task listing, search, and filtering

**Priority: P0**

The user shall be able to view tasks in a table or compact list.

Each row should show:

-   Task title.
-   Assignee.
-   Priority.
-   Due date.
-   Status.
-   Overdue / due-today indicator where applicable.
-   Available actions.

Required filters:

-   Status.
-   Priority.
-   Assignee.
-   Attention category (overdue, due today, blocked, upcoming).

A simple title search is P1 if time permits. Filtering must operate on
actual API data, not a separate hard-coded frontend dataset.

### 6.5 Task editing and reassignment

**Priority: P0**

The user shall be able to update title, description, assignee, priority,
due date, and status.

The backend shall validate every supplied field. A partial update must
leave omitted fields unchanged. The updated record must be persisted
before the frontend displays the mutation as successful.

Reassignment must update workload and task views consistently. The
assignee must belong to the same business workspace.

### 6.6 Task status lifecycle

**Priority: P0**

Supported statuses:

  Status          Meaning
  --------------- -------------------------------------------------
  `TODO`          Work has not started.
  `IN_PROGRESS`   Work is underway.
  `BLOCKED`       Work cannot proceed until an issue is resolved.
  `COMPLETED`     Work is finished.

All status changes must be validated against this enum.

A completed task is not considered open, overdue, or blocked, regardless
of its due date. If a completed task is reopened, its overdue state is
recalculated from its due date.

For the MVP, status transitions may be allowed between any supported
states. More restrictive transition rules can be introduced later if the
product requires them.

### 6.7 Deadline and attention classification

**Priority: P0**

The backend shall calculate task deadline classifications using the
current time and the business timezone.

Definitions:

-   **Overdue:** Task is not completed and its due timestamp is earlier
    than the current time.
-   **Due today:** Task is not completed and its due date falls on the
    current business date, but it is not overdue.
-   **Upcoming:** Task is not completed and its due date is after the
    current business date.
-   **Completed:** Task status is `COMPLETED`; no active deadline
    warning is generated.

All timestamps should be stored in UTC where supported and converted to
the business timezone for display and business-date calculations.
Comparisons must use timezone-aware values.

The demo should use seeded deadlines relative to the current date/time
or a controlled demo clock so that overdue and due-today examples remain
predictable during judging.

### 6.8 Operational dashboard

**Priority: P0**

The dashboard shall display metrics derived from persisted task records.

Required summary metrics:

  -----------------------------------------------------------------------
  Metric                              Definition
  ----------------------------------- -----------------------------------
  Total tasks                         Number of tasks in the workspace

  Open tasks                          Tasks whose status is not
                                      `COMPLETED`

  Completed tasks                     Tasks whose status is `COMPLETED`

  Overdue tasks                       Open tasks whose due timestamp has
                                      passed

  Blocked tasks                       Tasks whose status is `BLOCKED`

  Due today                           Open tasks due on the current
                                      business date and not already
                                      overdue
  Completion rate                     Completed tasks / total tasks ×
                                      100, displayed as a percentage;
                                      show 0% or an empty state when
                                      there are no tasks.
  -----------------------------------------------------------------------

The dashboard should include:

1.  Business name and current date.
2.  Summary metric cards.
3.  "Needs Attention" list.
4.  Recent or active task list with filters.
5.  **Team Productivity Overview** (also called “Workload Snapshot”):
    open, overdue, blocked, and completed task counts per employee.
6.  Completion-rate card, calculated as completed tasks / total tasks ×
    100.

Use the visible heading **“Team Productivity Overview”** or
**“Workload Snapshot”** so evaluators can readily identify the official
problem statement's “Basic Productivity Statistics” feature. These are
workload and completion indicators, not employee performance scores.

Every dashboard number must be calculated from the same source of truth
as the task list. Do not hard-code example values into the deployed
dashboard.

### 6.9 Workflow Intelligence / Needs Attention engine

**Priority: P0**

The workflow engine shall evaluate stored tasks and produce structured,
explainable attention items. It shall be deterministic for identical
task data and evaluation time.

Initial rules:

  -------------------------------------------------------------------------
  Rule                    Condition               Attention item
  ----------------------- ----------------------- -------------------------
  R1                      Task is open and        `OVERDUE_TASK`
                          overdue                 

  R2                      Task status is          `BLOCKED_TASK`
                          `BLOCKED`               

  R3                      Critical task is due    `CRITICAL_DEADLINE`
                          today or overdue        

  R4                      Employee has at least 2 `EMPLOYEE_OVERDUE_LOAD`
                          overdue open tasks      

  R5                      High or critical task   `HIGH_PRIORITY_BLOCKED`
                          is blocked              
  -------------------------------------------------------------------------

The threshold in R4 should be a named configuration constant and not
duplicated across UI components.

Each attention item should include:

-   Rule/type identifier.
-   Human-readable title.
-   Explanation/reason.
-   Related task ID or employee ID.
-   Severity or display category.
-   Relevant due date when applicable.

The engine identifies observable conditions; it does not claim to infer
intent, employee effort, or causality.

The engine must not automatically reassign, delete, or modify tasks. A
user must take the corrective action.

### 6.10 Workload visibility

**Priority: P1, with minimal P0 summary if feasible**

For each employee, calculate:

-   Open task count.
-   Overdue task count.
-   Blocked task count.
-   Completed task count.

The UI may show compact counts or bars. Do not label these values as
productivity scores or employee performance rankings. Task counts do not
represent task complexity, hours worked, or quality.

### 6.11 User feedback and error handling

**Priority: P0**

The UI shall provide:

-   Loading state during API requests.
-   Empty state when no tasks exist.
-   Success feedback after confirmed mutations.
-   Validation messages for invalid input.
-   Error feedback when API or database operations fail.
-   Retry or refresh path for recoverable loading failures.

The frontend must not optimistically show a persisted success unless it
can safely reconcile a failed request. For the MVP, prefer updating the
UI after a successful API response.

------------------------------------------------------------------------

## 7. User Journeys and ASCII Flowcharts

### 7.1 Primary journey: create and manage a task

``` text
+---------------------+
| Open TidyBiz        |
+----------+----------+
           |
           v
+---------------------+
| Load workspace,     |
| employees and tasks |
+----------+----------+
           |
           v
+---------------------+
| Click "Create Task" |
+----------+----------+
           |
           v
+---------------------+
| Enter title, owner, |
| priority and due    |
| date                |
+----------+----------+
           |
           v
+---------------------+
| Frontend validation |
+----------+----------+
           |
           v
+---------------------+
| POST /api/tasks     |
+----------+----------+
           |
           v
+---------------------+
| Backend validates   |
| business, assignee, |
| fields and enums    |
+-----+-----------+---+
      |           |
   Invalid      Valid
      |           |
      v           v
+-----------+  +------------------+
| Return 4xx|  | Persist task in  |
| with error|  | database         |
+-----+-----+  +--------+---------+
      |                 |
      v                 v
+-----------+  +------------------+
| Show error|  | Return saved task|
| keep form |  | representation   |
+-----------+  +--------+---------+
                        |
                        v
              +-------------------+
              | Refresh task list |
              | and dashboard     |
              +-------------------+
```

### 7.2 Workflow intelligence evaluation

``` text
+--------------------------+
| Read current task records|
+------------+-------------+
             |
             v
+--------------------------+
| Exclude completed tasks  |
| from active risk rules   |
+------------+-------------+
             |
             v
+--------------------------+
| Evaluate each rule       |
+------------+-------------+
             |
      +------+------+----------------+
      |             |                |
      v             v                v
+-----------+ +-----------+ +----------------+
| Overdue?  | | Blocked?  | | Critical and   |
|           | |           | | due/overdue?   |
+-----+-----+ +-----+-----+ +-------+--------+
      |             |               |
      +------+------+---------------+
             |
             v
+--------------------------+
| Build attention items    |
| with rule and reason     |
+------------+-------------+
             |
             v
+--------------------------+
| Return to dashboard      |
| with related record IDs  |
+------------+-------------+
             |
             v
+--------------------------+
| User opens task and      |
| chooses corrective action|
+--------------------------+
```

### 7.3 Deployment and runtime architecture

``` text
               Public user / Jury
                       |
                       v
             +-------------------+
             | Google Cloud Run  |
             | HTTPS endpoint    |
             +---------+---------+
                       |
                       v
             +-------------------+
             | React frontend    |
             | served by app     |
             +---------+---------+
                       |
                 /api requests
                       |
                       v
             +-------------------+
             | FastAPI backend   |
             | validation       |
             | task services    |
             | workflow engine  |
             +---------+---------+
                       |
                       v
             +-------------------+
             | External durable  |
             | database          |
             +-------------------+
```

For the hackathon, frontend and backend may be packaged and served from
one Cloud Run service to simplify deployment. The logical separation
between frontend, API, business rules, and database should remain clear
in the code.

### 7.4 Error path and persistence principle

``` text
User action
    |
    v
API request
    |
    v
Validate + persist
    |
    +---- failure ----> Return error
    |                   Keep saved state unchanged
    |                   Show actionable message
    |
    +---- success ----> Return saved record
                        Refresh/reconcile UI
                        Recalculate dashboard
```

The API response---not a button click---is the confirmation that a
mutation succeeded.

------------------------------------------------------------------------

## 8. UX and Navigation Requirements

### 8.1 Main navigation

The MVP shall provide three primary views:

1.  **Dashboard** --- summary metrics, attention items, active tasks,
    and team workload.
2.  **All Tasks** --- filterable task table and task creation/editing.
3.  **Team** --- employee list and workload summaries.

An Insights page is P1 and may be omitted if its content is already
represented on the dashboard. Settings and advanced administration are
P2.

### 8.2 Dashboard hierarchy

Recommended order:

1.  Header with business name, date, and prominent Create Task action.
2.  Summary metric cards.
3.  Needs Attention section.
4.  Task list or active work section.
5.  Team workload section.

Actionable risks should be visible before secondary statistics.

### 8.3 Task list

A filterable table is preferred over a drag-and-drop Kanban board for
the MVP because it is faster to implement and clearly presents assignee,
priority, deadline, and status.

Each task row should support opening details and performing the most
common status or edit action without excessive navigation.

### 8.4 Visual and interaction standards

-   Use React, Vite, and Material UI.
-   Maintain consistent spacing, typography, and status colors.
-   Use warning colors only for meaningful workflow conditions.
-   Make buttons and form labels explicit.
-   Distinguish destructive actions and request confirmation for
    deletion.
-   Ensure the main workflow is usable on common desktop and mobile
    browser sizes.
-   Avoid decorative charts that do not support a decision.

No external image assets are required for core functionality.

------------------------------------------------------------------------

## 9. Technical Architecture and Technology Stack

### 9.1 Proposed stack

  Layer             Technology                     Responsibility
  ----------------- ------------------------------ ---------------------------------------------
  Frontend          React + Vite                   Client-side application and navigation
  UI                Material UI                    Components, layout, forms, tables, feedback
  Backend           Python + FastAPI               REST API, validation, business logic
  Data validation   Pydantic                       Request and response schemas
  ORM               SQLAlchemy                     Database models and access
  Database          PostgreSQL; Cloud SQL target   Durable relational storage
  Container         Docker                         Reproducible application package
  Hosting           Google Cloud Run               Managed container execution
  Source control    GitHub                         Public repository and project history

The final database provider is subject to available credentials,
provisioning time, and connectivity. The deployed MVP must use storage
that is actually persistent and supported by the selected deployment
configuration.

### 9.2 Logical backend modules

``` text
backend/
  app/
    main.py                 # FastAPI app, middleware, router registration
    config.py               # Environment configuration
    database.py             # Engine, session and DB dependency
    models.py               # SQLAlchemy models
    schemas.py              # Pydantic request/response schemas
    seed.py                 # Idempotent demo data initialization
    routers/
      health.py
      business.py
      employees.py
      tasks.py
      dashboard.py
    services/
      task_service.py       # Task CRUD and validation orchestration
      workflow_engine.py    # Deterministic attention rules
      dashboard_service.py  # Metrics and workload calculations
```

Keep route handlers thin. Database operations and workflow calculations
should live in service modules so they can be tested independently.

### 9.3 Proposed repository layout

``` text
tidybiz/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── theme/
│   ├── public/
│   └── package.json
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── docs/
│   └── PRD.md
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

The structure may be simplified during the sprint, but frontend, API,
persistence, and workflow logic should not be mixed into one
unmaintainable file.

### 9.4 Deployment topology

For the MVP, a single Cloud Run service serving the built frontend and
FastAPI API is preferred if it can be implemented reliably. This avoids
separate frontend hosting and cross-origin configuration.

The application must listen on the port supplied by the Cloud Run
environment and bind to `0.0.0.0`. It must not assume a fixed local
development port in production.

The database is external to the container. The Cloud Run container
filesystem and process memory are not the authoritative persistent
store.

------------------------------------------------------------------------

## 10. Data Model

### 10.1 Business entity

  Field          Type            Constraints
  -------------- --------------- ---------------------
  `id`           UUID / string   Primary key
  `name`         String          Required
  `category`     String          Required for demo
  `timezone`     String          Valid IANA timezone
  `created_at`   Timestamp       Backend-generated

### 10.2 Employee entity

  Field           Type              Constraints
  --------------- ----------------- --------------------------
  `id`            UUID / string     Primary key
  `business_id`   UUID / string     Foreign key to Business
  `name`          String            Required
  `role`          Enum              Owner, Manager, Employee
  `department`    Nullable string   Optional
  `is_active`     Boolean           Defaults true
  `created_at`    Timestamp         Backend-generated

### 10.3 Task entity

  Field           Type                      Constraints
  --------------- ------------------------- ---------------------------------------
  `id`            UUID / string             Primary key
  `business_id`   UUID / string             Foreign key to Business
  `title`         String                    Required, non-empty
  `description`   Text                      Optional
  `assignee_id`   UUID / string             Foreign key to Employee
  `priority`      Enum                      LOW, MEDIUM, HIGH, CRITICAL
  `status`        Enum                      TODO, IN_PROGRESS, BLOCKED, COMPLETED
  `due_at`        Timestamp with timezone   Required for MVP
  `category`      Nullable string           Optional
  `created_at`    Timestamp                 Backend-generated
  `updated_at`    Timestamp                 Updated on mutation

### 10.4 Data integrity rules

-   Every task belongs to one business.
-   Every assigned employee belongs to the same business as the task.
-   Inactive employees cannot receive new assignments.
-   Enum values are validated at the API boundary and database/model
    layer where practical.
-   Foreign keys should be enforced by the database.
-   Dashboard counts are derived from task records and not maintained as
    manually incremented counters.
-   Seed logic must be idempotent and must not duplicate demo records on
    each restart.

### 10.5 Indexing considerations

For the MVP, add indexes where useful for common queries:

-   Tasks by `business_id`.
-   Tasks by `assignee_id`.
-   Tasks by `status`.
-   Tasks by `due_at`.

Composite indexes can be introduced after query patterns are measured.
Avoid spending hackathon time on speculative optimization.

------------------------------------------------------------------------

## 11. API Specification

All API endpoints should use a consistent JSON response format and
meaningful HTTP status codes. Exact response envelopes may be
standardized during implementation, but must remain consistent.

### 11.1 Endpoint list

  ----------------------------------------------------------------------------------------
  Method            Endpoint                         Priority          Purpose
  ----------------- -------------------------------- ----------------- -------------------
  GET               `/api/health`                    P0                Health/readiness
                                                                       check

  GET               `/api/business`                  P0                Get configured demo
                                                                       business

  GET               `/api/employees`                 P0                List workspace
                                                                       employees

  POST              `/api/employees`                 P1                Add employee

  PATCH             `/api/employees/{employee_id}`   P1                Update/deactivate
                                                                       employee

  GET               `/api/tasks`                     P0                List tasks with
                                                                       filters

  POST              `/api/tasks`                     P0                Create task

  GET               `/api/tasks/{task_id}`           P0                Get task details

  PATCH             `/api/tasks/{task_id}`           P0                Update task fields

  DELETE            `/api/tasks/{task_id}`           P0                Delete task

  GET               `/api/dashboard/summary`         P0                Get dashboard
                                                                       metrics

  GET               `/api/dashboard/attention`       P0                Get attention items

  GET               `/api/dashboard/workload`        P1                Get employee
                                                                       workload summaries
  ----------------------------------------------------------------------------------------

### 11.2 Task filtering

Example:

``` http
GET /api/tasks?status=IN_PROGRESS&priority=HIGH&assignee_id=<employee_id>
```

Supported query parameters:

-   `status`
-   `priority`
-   `assignee_id`
-   `attention` (overdue, due_today, blocked, upcoming)
-   `search` (P1)

Invalid enum values should return HTTP 422 or another consistently
documented client-error response.

### 11.3 Create-task request example

``` json
{
  "title": "Prepare customer brochure",
  "description": "Finalize the brochure design for customer approval.",
  "assignee_id": "employee-002",
  "priority": "HIGH",
  "status": "TODO",
  "due_at": "2026-09-28T16:00:00+05:30",
  "category": "Design"
}
```

This is an illustrative payload. IDs must be real identifiers returned
by the application, not hard-coded assumptions in production code.

### 11.4 Dashboard summary response example

``` json
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

The numbers above are examples of the response shape only. Actual values
must be computed from the database at request time or from a cache with
a documented invalidation strategy. No cache is required for the MVP.

### 11.5 Attention item response example

``` json
{
  "items": [
    {
      "type": "OVERDUE_TASK",
      "severity": "HIGH",
      "title": "Dispatch customer order",
      "reason": "The task deadline has passed and the task is not completed.",
      "task_id": "task-001",
      "employee_id": "employee-002",
      "due_at": "2026-09-26T12:00:00Z"
    }
  ]
}
```

The example is illustrative. The API should return the actual related
IDs and timestamps from stored records.

### 11.6 HTTP behavior

-   `200 OK`: Successful retrieval or update.
-   `201 Created`: Successful creation.
-   `204 No Content`: Successful deletion, if used consistently.
-   `400 Bad Request`: Malformed request where appropriate.
-   `404 Not Found`: Requested record does not exist within the demo
    workspace.
-   `409 Conflict`: Conflict with current state, where applicable.
-   `422 Unprocessable Entity`: Schema or validation failure.
-   `500 Internal Server Error`: Unexpected server error; do not expose
    secrets or stack traces to public clients.

------------------------------------------------------------------------

## 12. Non-Functional Requirements

### 12.1 Reliability and graceful degradation

Core task functionality must not depend on optional external AI,
notification, or analytics services.

If an optional service is unavailable, users must still be able to
create, retrieve, update, assign, and complete tasks.

Database failures must produce a clear API error and must not be
represented as successful persistence.

### 12.2 Data consistency

The backend database is the source of truth.

For every mutation:

1.  Validate the request.
2.  Verify referenced records and business ownership.
3.  Persist the change.
4.  Commit the transaction.
5.  Return the saved representation.
6.  Update or refresh the frontend from the successful response.

Dashboard and workload calculations must be based on the saved state.
Avoid maintaining independent frontend counters that can drift from the
database.

### 12.3 Scalability

The API service should be stateless between requests. Any Cloud Run
instance should be able to handle a request using the database and
request context.

Do not rely on process-local Python lists, in-memory session state, or
container-local files as durable business storage.

Use a relational schema with business ownership fields and clear
foreign-key relationships. This supports a future multi-tenant model,
but does not itself provide tenant security; authenticated authorization
and tenant-scoped queries will be required before production use.

### 12.4 Performance targets

Initial light-demo targets:

  -----------------------------------------------------------------------
  Operation                           Target
  ----------------------------------- -----------------------------------
  Warm dashboard load                 Under 2 seconds

  Task create/update API              Under 1 second

  Filtering a small loaded demo       Immediate user-perceived response
  dataset                             
  -----------------------------------------------------------------------

These are targets under light demo conditions, not measured results or
guarantees. Cold starts, database location, network conditions, and
Cloud Run configuration can affect latency.

### 12.5 Security and privacy

-   Use fictional demo data only.
-   Never put database credentials, service-account keys, or API keys in
    frontend source code or the public repository.
-   Configure secrets using environment variables or Google Cloud Secret
    Manager as appropriate.
-   Validate and constrain all client input.
-   Use parameterized database access through the ORM.
-   Restrict CORS to the required origins if frontend and API are hosted
    separately.
-   Do not expose internal exception traces to clients.
-   Clearly document that public demo access is not production
    authentication.

Before real business use, implement authentication, authorization,
tenant isolation, audit logging, backup/restore procedures, and security
testing.

### 12.6 Observability

Use structured or clearly categorized logs for:

-   Application startup and configuration errors.
-   Database connectivity errors.
-   API request failures.
-   Validation failures where useful.
-   Unexpected exceptions.

Do not log secrets or unnecessary personal data. Use Cloud Run logs to
investigate deployed failures.

### 12.7 Accessibility and responsive behavior

-   Use semantic labels and accessible form controls.
-   Do not communicate status by color alone; include text labels.
-   Ensure keyboard-accessible primary interactions.
-   Provide sufficient contrast for status and priority labels.
-   Support common desktop and mobile browser widths.

------------------------------------------------------------------------

## 13. Seed Data and Demonstration Workspace

### 13.1 Demo business

**Business name:** PrintWorks Studio\
**Category:** Printing and design\
**Timezone:** Asia/Kolkata

All people and customer details in the demo must be fictional.

### 13.2 Suggested employees

  Name    Role       Example responsibility
  ------- ---------- ----------------------------------
  Asha    Owner      Business oversight and approvals
  Riya    Employee   Design
  Arjun   Employee   Printing and dispatch
  Neha    Employee   Inventory and operations

The exact names can be changed during implementation, but the dataset
should remain consistent across tasks and screenshots.

### 13.3 Suggested seeded tasks

Seed data should deliberately exercise each core workflow state.

  ---------------------------------------------------------------------------
  Task            Assignee       Priority       Status         Deadline
                                                               scenario
  --------------- -------------- -------------- -------------- --------------
  Finalize        Riya           High           In Progress    Due today
  customer                                                     
  brochure                                                     

  Approve         Asha           Critical       Blocked        Due today
  brochure proof                                               

  Dispatch        Arjun          Critical       To Do          Overdue
  customer order                                               

  Replenish       Neha           Medium         To Do          Upcoming
  printing paper                                               

  Inspect         Arjun          High           In Progress    Upcoming
  printing                                                     
  machine                                                      

  Complete        Riya           Medium         Completed      Past deadline
  visiting-card                                                
  batch                                                        
  ---------------------------------------------------------------------------

The seed routine must calculate or assign deadlines so that the demo
shows overdue, due-today, blocked, upcoming, and completed states
whenever possible. Use a deterministic demo clock or relative seed dates
if necessary.

The application must not seed duplicates on every startup. Provide a
controlled reset or reseed method for development and judging.

------------------------------------------------------------------------

## 14. Testing and Acceptance Plan

### 14.1 Backend tests --- P0

At minimum, test:

1.  Health endpoint returns success.
2.  Task creation accepts valid input.
3.  Empty title is rejected.
4.  Invalid priority and status values are rejected.
5.  Assignment to a nonexistent employee is rejected.
6.  Task listing returns persisted records.
7.  Task update persists changes.
8.  Completed tasks are excluded from open and overdue counts.
9.  Overdue classification uses the business timezone and current time
    correctly.
10. Blocked tasks generate an attention item.
11. Critical tasks due today or overdue generate the correct attention
    item.
12. Dashboard metrics match the task records.
13. Completion rate equals completed_tasks / total_tasks × 100, with
    defined zero-task behavior.

Use a controllable time source or fixed timestamps in tests to avoid
flaky deadline assertions.

### 14.2 Frontend integration checks --- P0

Manually verify:

-   Dashboard loads from the API.
-   Create-task form validates required fields.
-   New task appears after successful creation.
-   Failed creation displays an error and does not claim success.
-   Status update is reflected in the list and dashboard.
-   Assignee and priority filters work.
-   Attention item opens the corresponding task.
-   Empty and loading states render correctly.

### 14.3 Deployment smoke tests --- P0

After deployment:

1.  Open the public Cloud Run URL in a fresh browser session.
2.  Confirm the frontend loads without local development dependencies.
3.  Confirm API health endpoint is reachable.
4.  Confirm dashboard data loads from the deployed backend.
5.  Create a test task and verify it appears.
6.  Refresh the browser and verify the task remains.
7.  Update the task and verify the dashboard changes.
8.  Inspect Cloud Run logs for startup, database, or API errors.

Do not declare deployment complete until these checks pass.

### 14.4 Acceptance definition

The MVP is considered ready for submission only when the primary user
journey works on the deployed URL:

**Open dashboard → create task → assign employee → update status →
observe dashboard/attention changes → refresh and confirm persistence.**

------------------------------------------------------------------------

## 15. Development Phases

This section is the execution plan for implementation. Phases are
ordered by dependencies. If time becomes constrained, protect P0
functionality and deployment before optional polish.

### Phase 0 --- Environment, repository, and deployment feasibility

**Timebox:** 0--10 minutes\
**Priority:** Critical

**Objectives:**

-   Confirm Python and Node.js are available.
-   Confirm Git is configured and a public repository can be created.
-   Confirm Google Cloud CLI authentication, project access, and Cloud
    Run permissions.
-   Check whether a managed database is already available or can be
    provisioned in time.
-   Create the project skeleton and initial README.

**Deliverables:**

-   Public GitHub repository initialized.
-   Local frontend and backend skeletons.
-   `.gitignore` and `.dockerignore`.
-   Cloud project and deployment path identified.
-   Database decision recorded.

**Exit criteria:**

-   A minimal FastAPI health endpoint runs locally.
-   Frontend development server starts.
-   Deployment prerequisites and database path are understood.

**Fallback:** If managed database provisioning is delayed, continue
local development against a compatible database configuration while
resolving the deployed database path. Do not assume container-local
SQLite files will provide durable Cloud Run storage.

### Phase 1 --- Backend foundation and persistent data

**Timebox:** 10--55 minutes\
**Priority:** P0

**Objectives:**

-   Implement configuration and database connection.
-   Create Business, Employee, and Task models.
-   Add Pydantic schemas and validation.
-   Implement idempotent demo seeding.
-   Implement task CRUD and employee listing.
-   Implement health and business endpoints.

**Deliverables:**

-   Working database schema.
-   Seeded demo workspace.
-   Task and employee API endpoints.
-   Basic backend validation.

**Exit criteria:**

-   Create a task through the API.
-   Retrieve the task from the API.
-   Update its status and verify persistence.
-   Restart the backend and verify records remain in the selected
    persistent database.

**Scope guard:** Do not build authentication, AI integrations, or
advanced reporting in this phase.

### Phase 2 --- Frontend and core task workflow

**Timebox:** 55--120 minutes\
**Priority:** P0

**Objectives:**

-   Build the application shell and navigation.
-   Build Dashboard, All Tasks, and Team views.
-   Implement task creation/edit form.
-   Connect frontend services to the FastAPI endpoints.
-   Add status and priority badges, filters, loading, error, and empty
    states.

**Deliverables:**

-   Usable task management UI.
-   Dashboard connected to live API data.
-   Team and assignee views.

**Exit criteria:**

A user can create a task in the browser, assign it to a demo employee,
update its status, and see the saved result reflected in the task list.

### Phase 3 --- Workflow intelligence and operational insights

**Timebox:** 120--165 minutes\
**Priority:** P0 for core rules; P1 for extended workload polish

**Objectives:**

-   Implement deadline classification.
-   Implement the deterministic workflow engine.
-   Add dashboard summary endpoint and attention endpoint.
-   Display overdue, due-today, blocked, and critical task indicators.
-   Add employee workload counts if time permits.
-   Link attention items to relevant tasks and actions.

**Deliverables:**

-   Needs Attention section.
-   Correct dashboard metrics.
-   Explainable rule-based workflow signals.

**Exit criteria:**

A seeded overdue or blocked task appears in Needs Attention with a clear
reason. The user can open the task, change its status or assignment, and
see the dashboard reflect the change.

**Scope guard:** Do not add predictive AI or generative recommendations
before deterministic rules and task actions work.

### Phase 4 --- Deployment, integration testing, and hardening

**Timebox:** 165--210 minutes\
**Priority:** P0

**Objectives:**

-   Build the production frontend.
-   Package the app in Docker.
-   Configure the service to use the Cloud Run-provided port.
-   Configure database connectivity and secrets.
-   Deploy to Cloud Run.
-   Run the deployment smoke-test checklist.
-   Fix critical errors only; avoid risky feature expansion.

**Deliverables:**

-   Public Cloud Run URL.
-   Working API and UI on the deployed service.
-   Verified persistent data path.
-   Basic deployment and runtime notes.

**Exit criteria:**

The public URL works in a fresh browser session; task creation, update,
dashboard calculation, and persistence work on the deployed version.

### Phase 5 --- Submission, documentation, and demo readiness

**Timebox:** 210--240 minutes\
**Priority:** P0

**Objectives:**

-   Complete the README with project overview, stack, setup, environment
    variables, run instructions, and deployment details.
-   Ensure the repository contains source code and no secrets.
-   Prepare the project poster.
-   Publish a public LinkedIn and/or Instagram post with required event
    mentions and hashtags.
-   Verify submission links.
-   Rehearse the demo and prepare a fallback recording or screenshots if
    permitted.

**Deliverables:**

-   Public GitHub repository.
-   Cloud Run deployment URL.
-   Public social post URL.
-   Project poster.
-   README and project documentation.
-   Repeatable demo scenario.

**Exit criteria:**

All required submission artifacts are accessible and the primary demo
journey can be completed without developer tools or manual database
intervention.

### Phase priority if behind schedule

Cut in this order:

1.  Separate Insights page and advanced charts.
2.  Employee creation UI.
3.  Search beyond basic filters.
4.  Advanced workload visualization.
5.  Any optional AI integration.

Do not cut:

-   Persistent task storage.
-   Task create/read/update workflow.
-   Dashboard consistency.
-   Basic overdue and blocked detection.
-   Public Cloud Run deployment.
-   README and required submission artifacts.

------------------------------------------------------------------------

## 16. Deployment and Submission Requirements

### 16.1 Cloud Run

The final application must be deployed to Google Cloud Run and
accessible to the hackathon jury.

Deployment requirements:

-   Container image builds successfully.
-   Service binds to the port supplied by the runtime environment.
-   Application listens on `0.0.0.0`.
-   Environment configuration is externalized.
-   Database is reachable from Cloud Run.
-   No secrets are committed to GitHub.
-   Public access is configured as appropriate for the judging demo.
-   The deployed URL is tested after the final code change.

### 16.2 GitHub

The repository must be public and contain:

-   Complete source code.
-   README with project description.
-   Technologies used.
-   Setup and run instructions.
-   Environment variable documentation.
-   Deployment instructions or summary.
-   No credentials, tokens, or private business data.

### 16.3 Poster and social post

Prepare a project poster that communicates:

-   The small-business workflow problem.
-   TidyBiz's solution.
-   Main features and differentiator.
-   Actual application screenshots.
-   Deployed application link or QR code if useful.

The public social post must include the event-required mentions:

-   Flora Institute of Technology.
-   `@gdg.fit.pune`
-   `@the_flora_institutes`

Use the official hashtags supplied in the problem statement:

`#FITFEST2026 #FITFESTHACKATHON #GDGFITPUNE #GDGPUNE #FLORAINSTITUTES #FLORAINSTITUTEOFTECHNOLOGY #HACKATHON2026 #PUNEHACKATHON #STUDENTHACKATHON #SOLOHACKATHON #TECHHACKATHON`

Submit the public post URL with the project.

------------------------------------------------------------------------

## 17. Demo Script and Evaluation Narrative

### 17.1 Demo objective

Demonstrate a complete operational workflow and show that TidyBiz does
more than store tasks: it identifies observable issues and gives the
owner a direct path to act.

### 17.2 Suggested opening pitch and 2–3 minute sequence

**Opening line (adapt names to the seeded demo):**

“Right now, Ravi might receive tasks over WhatsApp and still not know
which one is most urgent. In TidyBiz, when a critical task is due soon
and is still marked To Do, the owner can see it flagged automatically—
alongside who owns it and what needs attention.”

This line directly connects the demo to the problem statement's
scattered WhatsApp, spreadsheet, phone-call, and verbal coordination
problem. Only claim that a task is “due in two hours” if the seeded task
and displayed deadline actually support that statement.

  -----------------------------------------------------------------------
  Time                                Demonstration
  ----------------------------------- -----------------------------------
  0:00--0:25                          Explain how small businesses lose
                                      visibility when tasks and deadlines
                                      are scattered across communication
                                      channels.

  0:25--0:50                          Open the PrintWorks Studio
                                      dashboard and explain that metrics
                                      are derived from task records.

  0:50--1:20                          Create a task, assign an employee,
                                      set priority and deadline, and save
                                      it.

  1:20--1:50                          Show a blocked or overdue task in
                                      Needs Attention and explain the
                                      deterministic rule that flagged it.

  1:50--2:15                          Update or reassign the task and
                                      show the dashboard and attention
                                      list change.

  2:15--2:45                          Explain the stateless API,
                                      persistent database, rule-based
                                      workflow engine, and Cloud Run
                                      deployment.
  -----------------------------------------------------------------------

### 17.3 Claims and limitations to communicate accurately

TidyBiz can demonstrate centralized task tracking, deterministic
deadline classification, rule-based workflow alerts, and persistent
storage if these are implemented and verified.

Do not claim that the MVP is fail-proof, production-secure, load-tested
at scale, predictive, or AI-powered unless the relevant capability has
actually been implemented and tested.

The architecture is designed to support future expansion, but future
capabilities must be described as roadmap items rather than existing
functionality.

------------------------------------------------------------------------

## 18. One-Page Build Order Cheat Sheet

Keep this short execution checklist beside the developer during the
four-hour sprint. Use the detailed PRD sections for implementation
contracts; use this section to maintain build order and avoid scope drift.

> Timeboxes are targets. Start deployment feasibility checks immediately
> and adjust to the actual Google Cloud project and database state.

```text
00:00  Verify gcloud, project, Cloud Run permissions, database path.
       Create repo + frontend/backend skeleton + health endpoint.

00:10  Backend models: Business, Employee, Task.
       Configure database and idempotent PrintWorks Studio seed data.

00:30  Implement /api/tasks CRUD + /api/employees.
       Test create, list, update, delete, validation, persistence.

00:55  Implement /api/dashboard/summary.
       Include counts, completion_rate, deadline classifications.

01:10  Implement /api/dashboard/attention.
       Add overdue, blocked, critical deadline, and overdue-load rules.

01:25  React app shell + Material UI navigation.
       Build metric cards and All Tasks table using real API data.

02:00  Task create/edit form, assignment, filters, status updates.
       Add Team Productivity Overview / Workload Snapshot.

02:20  Needs Attention panel with rule explanations and task links.
       Verify dashboard changes after a task mutation.

02:40  Build container and deploy to Google Cloud Run.
       Configure runtime port, environment, secrets, and database.

03:10  Smoke test public URL: load, create, update, refresh, persistence.
       Fix deployment blockers before adding features.

03:30  README, public repo check, poster, social post, submission links.
       Rehearse the 2–3 minute demo using seeded tasks.

04:00  Submission-ready: deployed app, GitHub, poster, social URL,
       and documented limitations.
```

### Cheat-sheet hard rules

1. **Do not cut the attention engine.** It is the central differentiator;
   implement the P0 deterministic rules before optional polish.
2. **Make the official feature visible.** Label team metrics
   “Team Productivity Overview” or “Workload Snapshot.”
3. **Include completion rate.** Show completed / total tasks as a
   percentage, with a zero-task guard.
4. **Deploy early enough to test.** A working local app is not the
   submission deliverable.
5. **Never fake success.** Dashboard counts and attention items must
   come from actual API/database data.
6. **Avoid PRD anxiety.** Follow this build order during the timed sprint
   and consult detailed sections only for concrete implementation
   questions.

---

## 19. Risks and Mitigation

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  Database provisioning   Deployment may be       Verify early; choose an
  or connectivity delay   blocked                 accessible managed
                                                  database and keep
                                                  database configuration
                                                  isolated

  Cloud Run configuration Public app unavailable  Deploy a minimal health
  error                                           service early where
                                                  feasible; verify port
                                                  and startup behavior

  Frontend scope expands  Core workflow           Limit navigation to
                          incomplete              Dashboard, Tasks, and
                                                  Team

  Dashboard metrics drift Incorrect demo and loss Derive metrics from
                          of trust                backend data; avoid
                                                  independent frontend
                                                  counters

  Demo lacks visible      Differentiator is not   Seed overdue, blocked,
  workflow issues         demonstrated            critical, and completed
                                                  tasks with controlled
                                                  dates

  External AI/API failure Feature unavailable     Keep core functionality
                                                  deterministic and
                                                  independent of AI

  Public demo data        Privacy/security issue  Use fictional data
  exposure                                        only; do not collect
                                                  real customer or
                                                  employee records

  Time runs out           Submission incomplete   Protect P0 features,
                                                  deployment, README, and
                                                  submission artifacts
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 20. Future Roadmap

The following are post-hackathon possibilities and are not part of the
four-hour MVP commitment.

### Version 1 --- Secure team workspaces

-   Business registration and authentication.
-   Owner, manager, and employee permissions.
-   Tenant isolation and workspace administration.
-   Employee-specific task views.

### Version 2 --- Collaboration and follow-up

-   Task comments and activity history.
-   Notifications and reminders.
-   Recurring tasks.
-   Attachments and customer/job references.

### Version 3 --- Advanced workflow management

-   Task dependencies and workflow templates.
-   Capacity planning based on estimated effort and availability.
-   More advanced reporting and configurable operational rules.
-   Background jobs and notification queues.

### Version 4 --- Optional AI assistance

-   Convert a natural-language work request into a draft task list.
-   Summarize a team's current operational risks.
-   Suggest a draft daily action plan based on explicit task data.
-   Explain workflow rules and help users navigate the product.

Any AI-generated task or recommendation should require user review
before being saved or acted upon. AI must not silently change
assignments, deadlines, or task status.

------------------------------------------------------------------------

## 21. Definition of Done

TidyBiz is ready for hackathon submission when all of the following are
true:

-   [ ] The deployed application opens at its public Cloud Run URL.
-   [ ] The demo workspace and fictional employees load correctly.
-   [ ] A user can create, view, edit, assign, update, and delete tasks.
-   [ ] Priority, status, assignee, and due date are validated.
-   [ ] Dashboard metrics are derived from persisted records.
-   [ ] Overdue and blocked tasks generate explainable attention items.
-   [ ] An attention item links to the relevant task and available
    corrective action.
-   [ ] A task mutation is reflected consistently in the UI and
    dashboard.
-   [ ] Task data survives browser refresh and normal container restart
    using the selected durable database.
-   [ ] No secrets or real personal/business data are present in the
    public repository or demo.
-   [ ] README contains setup, technology, and run instructions.
-   [ ] Required poster and public social post are ready.
-   [ ] GitHub, Cloud Run, and social post links are verified.
-   [ ] The primary demo journey has been rehearsed.

------------------------------------------------------------------------

## 22. Decision Log

  -----------------------------------------------------------------------
  Decision                Current baseline        Rationale
  ----------------------- ----------------------- -----------------------
  Problem statement       PS2 --- Small Business  Selected for
                          Workflow & Task         operational workflow
                          Management              and engineering
                                                  demonstration

  Product name            TidyBiz                 Working project name

  Demo industry           Printing and design     Makes assignments,
                          shop                    deadlines, blockers,
                                                  and dispatch easy to
                                                  demonstrate

  Frontend                React + Vite + Material Fast component-based
                          UI                      development

  Backend                 FastAPI                 Python experience,
                                                  validation, and clear
                                                  API separation

  Workflow intelligence   Deterministic rules     Explainable, testable,
                                                  and independent of
                                                  external AI

  Deployment              Google Cloud Run        Required by hackathon

  Data persistence        External durable        Avoids relying on
                          database for deployed   ephemeral container
                          app                     storage

  MVP access              Seeded public demo      Reduces setup friction
                          workspace               during judging; not
                                                  production
                                                  authentication
  -----------------------------------------------------------------------

Any change to a P0 requirement, database choice, or deployment topology
should be made deliberately and reflected in the README or a subsequent
PRD revision.

------------------------------------------------------------------------

**End of PRD --- TidyBiz v1.0**
