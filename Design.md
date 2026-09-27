# TidyBiz — Product & UI Design

**Version:** 1.0  
**Purpose:** Visual and interaction contract for implementation. The PRD defines what the product does; this document defines how the interface should feel and behave.

---

## 1. Product Experience

TidyBiz is a lightweight operations desk for a small business. It should feel like a practical tool used during a busy workday—not a generic admin template or a complicated enterprise suite.

The interface should answer these questions quickly:

1. What work exists?
2. What needs attention right now?
3. Who is responsible?
4. What is due, overdue, blocked, or complete?
5. How is the team's workload distributed?

The product should emphasize clarity, trust, and fast task operations.

## 2. Design Principles

- **Action over decoration:** Every major panel should help the user make or complete a work decision.
- **At-a-glance hierarchy:** Critical issues, deadlines, and task status should be scannable.
- **Explainable intelligence:** Each attention flag must state its trigger and suggested action.
- **Consistent interaction:** Use the same status, priority, date, and employee labels throughout.
- **Honest state:** Loading, empty, error, and success states must be distinct.
- **Responsive MVP:** Desktop-first for the jury demo, but usable on tablet and mobile widths.
- **No visual clutter:** Avoid excessive gradients, animated counters, charts without purpose, and decorative widgets.

## 3. Information Architecture

```text
TidyBiz
|
+-- Dashboard
|    +-- KPI summary
|    +-- Needs Attention
|    +-- Team Productivity Overview
|    +-- Recent / upcoming work (if included in PRD)
|
+-- Tasks
|    +-- All Tasks
|    +-- Search and filters
|    +-- Create task
|    +-- Edit task / change status
|
+-- Team
     +-- Employee list
     +-- Add/manage employee (if in MVP)
```

Use a simple left navigation rail/sidebar on desktop and a compact drawer/menu on smaller screens. Do not add navigation destinations that have no working page.

## 4. Dashboard Layout

Recommended desktop layout:

```text
+-------------------------------------------------------------------+
| TidyBiz                                      Business / User menu  |
+----------------------+--------------------------------------------+
| Dashboard            | Dashboard                                  |
| Tasks                | A clear one-line operational summary       |
| Team                 |                                            |
|                      | +----------+ +----------+ +---------------+ |
|                      | | Total    | | Open     | | Overdue       | |
|                      | +----------+ +----------+ +---------------+ |
|                      | +----------+ +----------+                   |
|                      | | Blocked  | | Completion Rate             | |
|                      | +----------+ +-----------------------------+ |
|                      |                                            |
|                      | +----------------------+ +----------------+ |
|                      | | Needs Attention      | | Team Product.  | |
|                      | | • Explainable alerts | | Overview       | |
|                      | | • Suggested action   | | Workload rows  | |
|                      | +----------------------+ +----------------+ |
|                      |                                            |
|                      | Recent / due soon tasks (if in scope)      |
+----------------------+--------------------------------------------+
```

The exact grid may change to fit the viewport, but keep the attention panel visually prominent and the productivity heading explicit.

### KPI cards

- Display the metric name, value, and concise helper label if needed.
- Use consistent card dimensions and typography.
- Do not use color as the only signal; pair it with text and/or an icon.
- Completion rate must be labeled clearly as a percentage.
- Clicking a KPI may filter the task list only if that behavior is implemented end-to-end.

### Needs Attention panel

Each item should include:

- Severity indicator and text label.
- Short issue title.
- Plain-language reason.
- Task title and assignee, when applicable.
- Suggested action.
- A working “View task” or equivalent action if task navigation/editing exists.

Order by severity, then nearest deadline, then stable task identifier. Do not show an alert with no explanation.

### Team Productivity Overview

Use this exact visible heading or “Workload Snapshot.” This explicitly surfaces the official problem statement's Basic Productivity Statistics feature.

Each employee row can show counts for open, overdue, blocked, and completed tasks. Make it clear these are workload indicators, not a performance rating. Avoid ranking employees or using shame-oriented colors/labels.

## 5. Tasks Page

Recommended structure:

```text
Tasks                                              [+ New Task]
Manage work, owners, priorities, and deadlines.

[Search tasks...] [Status v] [Priority v] [Assignee v] [Due v]

+-------------------------------------------------------------------+
| Task          | Assignee | Priority | Due          | Status | ... |
|---------------|----------|----------|--------------|--------|-----|
| Print flyers  | Ravi     | High     | Today, 3 PM  | To Do  | Edit|
| Order paper   | Asha     | Medium   | Tomorrow     | Doing  | Edit|
+-------------------------------------------------------------------+
```

Requirements:

- Search/filter controls must affect actual API data or locally filtered API results; no decorative controls.
- Clearly distinguish overdue dates from future deadlines.
- Use text labels for status and priority.
- Provide a useful empty state with a “Create task” action.
- Show a loading skeleton/progress state while fetching.
- Show a recoverable error with retry when loading fails.
- Avoid horizontal overflow on mobile; switch to stacked task cards or allow controlled table scrolling.

## 6. Create / Edit Task Form

Use a modal, drawer, or dedicated form—choose one approach and keep it consistent.

Suggested fields, subject to PRD schema:

- Task title (required)
- Description (optional)
- Assignee
- Priority
- Due date/time
- Status (edit mode; initial status default in create mode)

Interaction requirements:

- Mark required fields visibly.
- Validate on client for immediate feedback and again on server.
- Keep entered values if the API returns a recoverable validation error.
- Disable submit while saving to prevent accidental duplicate requests.
- Close only after confirmed success, unless the user explicitly cancels.
- Display field-level or form-level error messages.
- After success, refresh task list, dashboard summary, team snapshot, and attention data.

## 7. Team Page

Show a simple list of team members and, where available, their workload counts.

- Provide an obvious add-employee action if employee creation is in MVP scope.
- Do not invent employee data in the UI; use API results.
- Handle no employees and failed requests explicitly.
- Prevent assigning tasks to inactive or invalid employees if such a state exists in the schema.

## 8. Visual System

Use Material UI components and theme tokens. Keep the visual system cohesive and implementable within the sprint.

### Color semantics

Use a restrained neutral base and semantic accents:

| Meaning | Treatment |
|---|---|
| Primary action / navigation | One consistent brand primary |
| Normal / informational | Neutral or blue-toned treatment |
| High priority / due soon | Amber/orange semantic treatment |
| Overdue / critical | Red semantic treatment, always paired with a text label |
| Completed / success | Green semantic treatment, always paired with a text label |
| Blocked | Distinct warning treatment with “Blocked” text |

Do not encode the whole interface in red/green. Maintain accessible contrast and visible focus states.

### Typography and spacing

- Use a clear type scale: page title, section title, body, helper text.
- Prefer concise labels and short explanatory copy.
- Use a consistent spacing scale based on MUI theme spacing.
- Keep body text comfortably readable; do not shrink text to fit cards.
- Align cards and table columns consistently.

### Components

Prefer MUI primitives: AppBar, Drawer, Box, Stack, Grid, Card, Chip, Button, Dialog/Drawer, TextField, Select, MenuItem, Table, Alert, Snackbar, Skeleton, Tooltip, and LinearProgress.

Use icons to reinforce labels, not replace them. Every icon-only button needs an accessible label/tooltip.

## 9. Interaction States

Every data-driven view must support:

| State | Required behavior |
|---|---|
| Loading | Skeleton or progress indicator; prevent duplicate submissions |
| Empty | Explain what is empty and offer the next useful action |
| Error | Plain-language message and retry where appropriate |
| Success | Confirmation only after API success |
| Validation | Inline/form errors with actionable wording |
| Disabled | Explain why an action is unavailable where useful |

Never use an empty array as a catch-all for loading or error.

## 10. Accessibility and Responsive Behavior

- Use semantic headings in order.
- All form controls have visible labels.
- Keyboard users can reach and operate all actions.
- Visible focus indicators are retained.
- Do not rely on color alone for status, priority, or severity.
- Provide accessible names for icon buttons.
- At narrow widths, stack KPI cards and panels; collapse sidebar; make task rows readable without clipping.

## 11. Demo-Readiness

The seeded demo should visibly demonstrate:

- A mix of To Do, In Progress, Blocked, and Completed tasks (only statuses supported by PRD).
- Different priorities and deadlines.
- At least one overdue open task.
- At least one blocked task.
- At least one critical/high-priority task due soon.
- Multiple employees with different workload counts.
- A completion rate that matches the seeded records.

Do not add fake attention messages that are not generated by the actual rules engine. Ensure the seeded dates are relative or refreshed so the demo does not become stale.

## 12. Design Acceptance Checklist

- [ ] Dashboard makes overdue/blocked/urgent work obvious.
- [ ] “Needs Attention” items explain why they appear.
- [ ] “Team Productivity Overview” or “Workload Snapshot” is visible.
- [ ] Completion rate is displayed and mathematically consistent.
- [ ] Tasks can be searched/filtered using working controls.
- [ ] Task creation, editing, assignment, and status updates are usable.
- [ ] Loading, empty, error, and success states are distinct.
- [ ] Layout works at desktop and mobile widths.
- [ ] No placeholder buttons or fake charts remain in submitted build.
