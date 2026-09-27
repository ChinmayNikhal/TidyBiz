"""Dashboard endpoints: summary metrics + attention rules (API.md §7–8).

Phase 4: GET /api/dashboard/summary — live-computed KPIs.
Phase 5: GET /api/dashboard/attention — deterministic rules engine.
P1:      GET /api/dashboard/workload — per-employee task counts.
"""

from fastapi import APIRouter, Depends
from fastapi import status as http_status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Business, Employee, Task
from app.models.enums import (
    EMPLOYEE_OVERDUE_LOAD_THRESHOLD,
    AttentionSeverity,
    AttentionType,
    TaskPriority,
    TaskStatus,
)
from app.utils.time import business_today, to_business_date, utcnow

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _business_id(db: Session) -> str:
    business = db.query(Business).first()
    if business is None:
        return None
    return business.id


# ────────────────────────── Phase 4: Summary ──────────────────────────


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)) -> dict:
    """Dashboard KPIs computed live from persisted tasks (API.md §7)."""
    biz_id = _business_id(db)
    if biz_id is None:
        return _empty_summary()

    tasks = db.query(Task).filter(Task.business_id == biz_id).all()
    now = utcnow()
    today = business_today()

    total = len(tasks)
    completed = sum(1 for t in tasks if _status_val(t) == "COMPLETED")
    open_tasks = total - completed
    blocked = sum(1 for t in tasks if _status_val(t) == "BLOCKED")
    overdue = 0
    due_today_count = 0

    for t in tasks:
        if _status_val(t) == "COMPLETED":
            continue
        if t.due_at and t.due_at < now:
            overdue += 1
        elif t.due_at and to_business_date(t.due_at) == today:
            due_today_count += 1

    completion_rate = round(completed / total * 100, 2) if total > 0 else 0

    return {
        "total_tasks": total,
        "open_tasks": open_tasks,
        "completed_tasks": completed,
        "overdue_tasks": overdue,
        "blocked_tasks": blocked,
        "due_today": due_today_count,
        "completion_rate": completion_rate,
    }


def _empty_summary() -> dict:
    return {
        "total_tasks": 0,
        "open_tasks": 0,
        "completed_tasks": 0,
        "overdue_tasks": 0,
        "blocked_tasks": 0,
        "due_today": 0,
        "completion_rate": 0,
    }


# ────────────────────────── Phase 5: Attention ──────────────────────────


@router.get("/attention")
def dashboard_attention(db: Session = Depends(get_db)) -> dict:
    """Deterministic rules engine output (API.md §8).

    Computed from persisted tasks + employees at request time.  Never mutates.
    Rules:
      R1 OVERDUE_TASK       — open + overdue
      R2 BLOCKED_TASK       — status=BLOCKED
      R3 CRITICAL_DEADLINE  — CRITICAL priority, due today or overdue, not completed
      R4 EMPLOYEE_OVERDUE_LOAD — employee has ≥ threshold overdue open tasks
      R5 HIGH_PRIORITY_BLOCKED — HIGH or CRITICAL + BLOCKED
    """
    biz_id = _business_id(db)
    if biz_id is None:
        return {"items": []}

    tasks = db.query(Task).filter(Task.business_id == biz_id).all()
    employees = db.query(Employee).filter(Employee.business_id == biz_id).all()
    now = utcnow()
    today = business_today()

    items = []

    # Per-employee overdue counts for R4.
    employee_overdue: dict[str, int] = {}

    for t in tasks:
        sv = _status_val(t)
        pv = _priority_val(t)

        if sv == "COMPLETED":
            continue

        is_overdue = t.due_at is not None and t.due_at < now
        is_due_today = t.due_at is not None and (not is_overdue) and to_business_date(t.due_at) == today

        # R1: open and overdue
        if is_overdue:
            items.append(_attention_item(
                rule_code=AttentionType.OVERDUE_TASK.value,
                severity=AttentionSeverity.HIGH.value,
                title="Task is overdue",
                reason=f"'{t.title}' was due and is not completed.",
                task_id=t.id,
                assignee_id=t.assignee_id,
                due_at=_iso(t.due_at),
                suggested_action="Review the deadline or update the task status.",
            ))
            # Track for R4.
            employee_overdue[t.assignee_id] = employee_overdue.get(t.assignee_id, 0) + 1

        # R2: status = BLOCKED
        if sv == "BLOCKED":
            items.append(_attention_item(
                rule_code=AttentionType.BLOCKED_TASK.value,
                severity=AttentionSeverity.HIGH.value,
                title="Task is blocked",
                reason=f"'{t.title}' is blocked and cannot proceed.",
                task_id=t.id,
                assignee_id=t.assignee_id,
                due_at=_iso(t.due_at),
                suggested_action="Identify and resolve the blocker.",
            ))

        # R3: CRITICAL priority, due today or overdue, not completed
        if pv == "CRITICAL" and (is_overdue or is_due_today):
            items.append(_attention_item(
                rule_code=AttentionType.CRITICAL_DEADLINE.value,
                severity=AttentionSeverity.HIGH.value,
                title="Critical task at deadline",
                reason=f"'{t.title}' has CRITICAL priority and is {'overdue' if is_overdue else 'due today'}.",
                task_id=t.id,
                assignee_id=t.assignee_id,
                due_at=_iso(t.due_at),
                suggested_action="Prioritize this task immediately.",
            ))

        # R5: HIGH or CRITICAL + BLOCKED
        if sv == "BLOCKED" and pv in ("HIGH", "CRITICAL"):
            items.append(_attention_item(
                rule_code=AttentionType.HIGH_PRIORITY_BLOCKED.value,
                severity=AttentionSeverity.MEDIUM.value,
                title="High-priority task is blocked",
                reason=f"'{t.title}' ({pv} priority) is blocked.",
                task_id=t.id,
                assignee_id=t.assignee_id,
                due_at=_iso(t.due_at),
                suggested_action="Escalate or reassign to unblock.",
            ))

    # R4: employee overdue load
    emp_map = {e.id: e for e in employees}
    for emp_id, count in employee_overdue.items():
        if count >= EMPLOYEE_OVERDUE_LOAD_THRESHOLD:
            emp = emp_map.get(emp_id)
            emp_name = emp.name if emp else "Unknown"
            items.append(_attention_item(
                rule_code=AttentionType.EMPLOYEE_OVERDUE_LOAD.value,
                severity=AttentionSeverity.MEDIUM.value,
                title="Employee has multiple overdue tasks",
                reason=f"{emp_name} has {count} overdue tasks (threshold: {EMPLOYEE_OVERDUE_LOAD_THRESHOLD}).",
                task_id=None,
                assignee_id=emp_id,
                due_at=None,
                suggested_action=f"Review {emp_name}'s workload and reassign if needed.",
            ))

    # Sort: HIGH before MEDIUM, then due_at ascending (nulls last), then id.
    _severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    items.sort(key=lambda x: (
        _severity_order.get(x["severity"], 9),
        x["due_at"] or "9999",
        x["id"],
    ))

    return {"items": items}


def _attention_item(*, rule_code, severity, title, reason, task_id, assignee_id, due_at, suggested_action) -> dict:
    ref_id = task_id or assignee_id or "unknown"
    return {
        "id": f"{rule_code}:{ref_id}",
        "rule_code": rule_code,
        "severity": severity,
        "title": title,
        "reason": reason,
        "task_id": task_id,
        "assignee_id": assignee_id,
        "due_at": due_at,
        "suggested_action": suggested_action,
    }


# ────────────────────────── P1: Workload ──────────────────────────


@router.get("/workload")
def dashboard_workload(db: Session = Depends(get_db)) -> dict:
    """Per-employee task counts (API.md §9 — P1)."""
    biz_id = _business_id(db)
    if biz_id is None:
        return {"items": []}

    employees = db.query(Employee).filter(Employee.business_id == biz_id).all()
    tasks = db.query(Task).filter(Task.business_id == biz_id).all()
    now = utcnow()

    # Build per-employee counts.
    counts: dict[str, dict] = {}
    for e in employees:
        counts[e.id] = {
            "employee_id": e.id,
            "name": e.name,
            "role": e.role.value if hasattr(e.role, "value") else str(e.role),
            "is_active": e.is_active,
            "open_tasks": 0,
            "overdue_tasks": 0,
            "blocked_tasks": 0,
            "completed_tasks": 0,
        }

    for t in tasks:
        aid = t.assignee_id
        if aid not in counts:
            continue
        sv = _status_val(t)
        if sv == "COMPLETED":
            counts[aid]["completed_tasks"] += 1
        else:
            counts[aid]["open_tasks"] += 1
            if sv == "BLOCKED":
                counts[aid]["blocked_tasks"] += 1
            if t.due_at and t.due_at < now:
                counts[aid]["overdue_tasks"] += 1

    result = sorted(counts.values(), key=lambda x: x["name"])
    return {"items": result}


# ────────────────────────── Helpers ──────────────────────────


def _status_val(t: Task) -> str:
    return t.status.value if isinstance(t.status, TaskStatus) else str(t.status)


def _priority_val(t: Task) -> str:
    return t.priority.value if isinstance(t.priority, TaskPriority) else str(t.priority)


def _iso(dt) -> str | None:
    if dt is None:
        return None
    return dt.isoformat().replace("+00:00", "Z") if hasattr(dt, "isoformat") else str(dt)
