# TidyBiz — AI Agent Development Rules

**Version:** 1.0  
**Applies to:** FreeBuff AI Agent and any developer contributing to this repository.

These rules are mandatory. Product requirements come from `PRD.md`; technical structure from `Architecture.md`; UI behavior from `Design.md`; execution order from `Phases.md`.

---

## 1. Source-of-Truth Hierarchy

When documents conflict, follow this order:

1. Explicit, latest instruction from the human project owner.
2. `PRD.md` for product requirements, MVP scope, API/data contracts, and acceptance criteria.
3. `Architecture.md` for technical architecture and implementation boundaries.
4. `Design.md` for visual and interaction behavior.
5. `Phases.md` for build order and prioritization.
6. `Rules.md` for agent conduct and safety.
7. `Memory.md` for recorded project state and decisions—not as permission to contradict the documents.

If a conflict materially affects implementation, stop and ask the human or record a proposed resolution before proceeding. Do not silently invent requirements.

## 2. Work Autonomously, but Safely

- Inspect before editing.
- Make small, coherent changes.
- Prefer completing and verifying one vertical slice over creating many unfinished files.
- Do not ask for approval for routine, reversible implementation details that are already covered by the documents.
- Ask before destructive, costly, externally visible, or security-sensitive actions.
- Never claim to have run a command, test, build, deployment, or browser check unless it actually happened.
- Do not claim a deployment is public or persistent until verified.

## 3. Memory.md Is the Persistent Agent Log

After each meaningful action or phase:

- Append a dated entry to `Memory.md`.
- Include files changed, commands run, results, decisions, blockers, and next step.
- Preserve previous entries; do not replace the history with a new summary.
- Separate facts from assumptions.
- Mark each item as implemented, tested, deployed, or externally verified as appropriate.
- If the agent session is interrupted, read `Memory.md` and inspect the repository before resuming.

Never fabricate memory entries or write planned work as completed work.

## 4. Scope and Timebox Discipline

- Optimize for a working MVP within the official hackathon timebox.
- P0 functionality takes precedence over visual polish and P1/P2 features.
- Do not add features merely because they are technically interesting.
- Do not remove the Needs Attention engine to save time; it is the primary differentiator.
- Do not omit completion rate or the visible Team Productivity Overview / Workload Snapshot.
- Deploy early enough to leave time for public URL verification.
- If time is running short, report the tradeoff and ship the smallest coherent working path.

## 5. Code Quality

- Use the stack and folder structure in `Architecture.md` unless a documented blocker requires a change.
- Keep route handlers thin and business logic in service modules.
- Keep database access behind the data/ORM layer.
- Use Pydantic schemas for API input/output and TypeScript types for frontend contracts.
- Avoid duplicated business rules between frontend and backend.
- Use clear, descriptive names and small functions.
- Avoid unnecessary abstractions, generic frameworks, and premature optimization.
- Do not leave dead code, debug prints, fake buttons, or unused dependencies in the submission path.
- Do not rewrite working modules wholesale when a focused patch is sufficient.

## 6. Data Integrity and Business Logic

- Persist real task, employee, and dashboard data through the agreed database layer.
- Never use frontend hardcoded values to impersonate API results.
- Validate all inputs server-side.
- Enforce valid employee-to-business assignment.
- Use canonical status and priority enums from the PRD.
- Keep timestamps and deadline comparisons consistent.
- Completion rate must be computed as completed tasks divided by total tasks times 100, with defined zero-task behavior.
- Dashboard statistics and attention items must be derived from the same persisted source of truth as the task list.
- Seed data must be clearly identified as demo data and idempotent.
- Do not seed real personal or business-confidential information.

## 7. Workflow Intelligence Rules

- Implement the PRD's deterministic rules exactly before adding optional intelligence.
- Every attention item must be explainable with a rule code/reason and relevant task or employee.
- Do not invent alerts or hardcode “insights” that are not computed from current records.
- Do not label rule-based logic as machine learning or generative AI.
- Do not create employee rankings, shame labels, or unsupported performance judgments.
- Ensure completed tasks are excluded from overdue/open-work alerts unless the PRD explicitly defines otherwise.
- Use stable sorting and predictable results.

## 8. Frontend and UX Rules

- Use Material UI and the visual direction in `Design.md`.
- All visible controls must work or be clearly disabled with a reason.
- Every data-driven view must distinguish loading, empty, error, and success states.
- Do not show success before the API confirms it.
- Preserve form input after recoverable server validation errors.
- Use accessible labels, keyboard focus, and text labels alongside semantic colors.
- Do not add charts or cards without a real data source and clear purpose.
- Keep “Needs Attention” prominent and the productivity-statistics heading visible.
- Verify desktop layout and a narrow viewport before submission when possible.

## 9. Security and Secrets

- Never print, commit, or expose credentials, access tokens, private keys, `.env` contents, or service-account JSON.
- Do not place secrets in frontend environment variables or bundled assets.
- Use `.env.example` with placeholders only.
- Use the hosting provider's environment/secret configuration; never commit database passwords, Supabase service-role keys, or connection strings with credentials.
- Do not weaken security controls merely to make deployment pass without informing the human.
- Do not collect unnecessary personal data.
- Do not claim authentication, authorization, or multi-tenant isolation unless implemented and tested.

## 10. Shell, Cloud, and External Actions

- Inspect commands before running them.
- Do not run destructive commands such as recursive deletion, database drops, force pushes, or overwriting user work without explicit approval.
- Do not create billable cloud resources, enable paid APIs, or change billing configuration without human approval.
- Before deploying, confirm the intended hosting targets (static frontend host, Python backend host, Supabase project and region) from available configuration; if ambiguous, ask.
- Do not connect to, modify, or delete hosted Supabase tables or data until the owner explicitly authorizes connecting to the project.
- Never expose database passwords, Supabase keys, or other credentials in logs or output.
- Do not publish social posts, create public repositories, or submit hackathon forms without explicit human authorization.
- A successful command exit is not enough to claim the deployed app works; perform an HTTP/browser smoke test.

## 11. Dependencies and Documentation

- Add dependencies only when needed.
- Prefer stable, maintained packages compatible with the selected runtime.
- Pin or constrain versions where practical.
- Update README/setup instructions when commands, environment variables, or architecture change.
- Keep `.gitignore` current.
- Do not copy secrets, credentials, or copyrighted assets into the repository.

## 12. Testing and Verification

For each meaningful feature:

1. Run the narrowest relevant test.
2. Run backend tests and frontend build at integration milestones.
3. Test expected behavior and at least one failure/edge case.
4. Report exact commands and outcomes.
5. Fix regressions before moving on, or document why blocked.

Minimum end-to-end path:

```text
Open app
  -> load seeded tasks and team
  -> create a task
  -> assign an employee
  -> set priority and deadline
  -> update status
  -> verify persisted task after refresh
  -> verify dashboard metrics/completion rate
  -> verify Needs Attention recalculates correctly
```

## 13. Communication Format

At the end of each phase, respond with:

```text
PHASE:
STATUS: Complete / Partial / Blocked

IMPLEMENTED:
- ...

FILES CHANGED:
- ...

VERIFICATION:
- Command/test:
- Actual result:

DECISIONS / DEVIATIONS:
- ...

BLOCKERS:
- None / ...

NEXT ACTION:
- ...
```

Keep reports concise but specific. Do not dump entire files unless requested. Ask one focused question at a time when human input is required.

## 14. Definition of Done

A feature is not “done” until:

- Its implementation exists.
- Its primary behavior is verified.
- Relevant tests/build checks have been run or their absence is disclosed.
- Documentation and `Memory.md` are updated.
- No known critical regression is left unreported.

The project is submission-ready only when the deployed app, public repository, README, poster, and social post requirements in the PRD have been checked.
