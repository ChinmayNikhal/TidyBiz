"""Task CRUD endpoints (API.md §6).

Phase 3 — Core API and Task Workflow:
- GET /api/tasks — list with filters (status, priority, assignee_id, attention, search)
- POST /api/tasks — create (assignee validated: active + same business)
- GET /api/tasks/{task_id} — single task
- PATCH /api/tasks/{task_id} — partial update; completed_at server-managed
- DELETE /api/tasks/{task_id} — remove
"""

from datetime import timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Business, Employee, Task
from app.models.enums import AttentionCategory, TaskPriority, TaskStatus
from app.schemas import TaskCreate, TaskRead, TaskUpdate, task_from_db
from app.services.assignment_service import EmployeeAssignmentError, validate_task_assignee
from app.services.task_service import apply_status_transition
from app.utils.time import business_today, to_business_date, utcnow

router = APIRouter(tags=["tasks"])

# Valid enum value sets for filter validation.
_VALID_STATUSES = {s.value for s in TaskStatus}
_VALID_PRIORITIES = {p.value for p in TaskPriority}
_VALID_ATTENTION = {a.value for a in AttentionCategory}


def _business_id(db: Session) -> str:
    """Return demo workspace id. Single-workspace MVP."""
    business = db.query(Business).first()
    if business is None:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No workspace configured.",
        )
    return business.id


def _task_validation_error(detail: dict) -> HTTPException:
    """Build a standard 422 error envelope for task-specific validation failures."""
    return HTTPException(
        status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Task validation failed",
                "details": [detail],
            }
        },
    )


def _classify_task_attention(task: Task, now, today) -> Optional[str]:
    """Classify a task into an attention category.

    Returns None for completed tasks (they never appear in attention views).
    """
    if task.status == TaskStatus.COMPLETED or (
        isinstance(task.status, str) and task.status == "COMPLETED"
    ):
        return None

    due = task.due_at
    if due is None:
        return "upcoming"

    # Ensure aware comparison.
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)

    if due < now:
        return "overdue"

    due_date = to_business_date(due)
    if due_date == today:
        return "due_today"

    return "upcoming"


# ────────────────────────── LIST ──────────────────────────


@router.get("/tasks", response_model=dict)
def list_tasks(
    *,
    status: Optional[str] = Query(None, alias="status", examples=["IN_PROGRESS"]),
    priority: Optional[str] = Query(None, alias="priority", examples=["HIGH"]),
    assignee_id: Optional[str] = Query(None),
    attention: Optional[str] = Query(None, examples=["overdue", "due_today"]),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    """List tasks with optional filters (API.md §6).

    All filters are optional and combinable (ANDed). Invalid enum values
    produce a 422.
    """
    biz_id = _business_id(db)
    q = db.query(Task).filter(Task.business_id == biz_id)

    # ── Status filter ──
    if status is not None:
        if status not in _VALID_STATUSES:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status filter '{status}'. Valid: {sorted(_VALID_STATUSES)}",
            )
        q = q.filter(Task.status == status)

    # ── Priority filter ──
    if priority is not None:
        if priority not in _VALID_PRIORITIES:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid priority filter '{priority}'. Valid: {sorted(_VALID_PRIORITIES)}",
            )
        q = q.filter(Task.priority == priority)

    # ── Assignee filter ──
    if assignee_id is not None:
        q = q.filter(Task.assignee_id == assignee_id)

    # ── Attention filter (computed from due_at vs business time) ──
    if attention is not None:
        attention_val = attention.lower().strip()
        if attention_val not in _VALID_ATTENTION:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid attention filter '{attention}'. Valid: {sorted(_VALID_ATTENTION)}",
            )

        if attention_val == "blocked":
            q = q.filter(Task.status == TaskStatus.BLOCKED.value)
        else:
            # Must classify in Python because overdue/due_today/upcoming depend
            # on the current business time (not a static column value).
            now = utcnow()
            today = business_today()
            all_rows = q.all()
            matching_ids = [
                r.id for r in all_rows
                if _classify_task_attention(r, now, today) == attention_val
            ]
            if matching_ids:
                q = db.query(Task).filter(Task.id.in_(matching_ids))
            else:
                # No matches — return empty immediately.
                return {"items": []}

    # ── Search filter (case-insensitive substring on title) ──
    if search is not None:
        q = q.filter(func.lower(Task.title).contains(func.lower(search)))

    tasks = q.order_by(Task.due_at.asc()).all()
    return {"items": [task_from_db(t) for t in tasks]}


# ────────────────────────── CREATE ──────────────────────────


@router.post("/tasks", response_model=TaskRead, status_code=http_status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
) -> TaskRead:
    """Create a task (API.md §6).

    Assignee must be an active employee in the same workspace.
    ``completed_at`` is never client-settable.
    """
    biz_id = _business_id(db)

    # Validate assignee (active + same business).
    try:
        assignee = validate_task_assignee(
            db,
            Task(business_id=biz_id, assignee_id=payload.assignee_id),
            payload.assignee_id,
        )
    except EmployeeAssignmentError as exc:
        raise _task_validation_error({"field": "assignee_id", "issue": exc.reason})

    task = Task(
        business_id=biz_id,
        title=payload.title.strip(),
        description=payload.description,
        assignee_id=assignee.id,
        priority=payload.priority,
        status=payload.status,
        due_at=payload.due_at.astimezone(timezone.utc),
        category=payload.category,
    )

    # Handle initial status if set to COMPLETED directly.
    if payload.status == TaskStatus.COMPLETED:
        task.completed_at = utcnow()

    db.add(task)
    db.commit()
    db.refresh(task)
    return task_from_db(task)


# ────────────────────────── READ ──────────────────────────


@router.get("/tasks/{task_id}", response_model=TaskRead)
def read_task(task_id: str, db: Session = Depends(get_db)) -> TaskRead:
    """Get a single task (API.md §6)."""
    biz_id = _business_id(db)
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.business_id == biz_id)
        .one_or_none()
    )
    if task is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )
    return task_from_db(task)


# ────────────────────────── UPDATE ──────────────────────────


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
) -> TaskRead:
    """Partial update; ``completed_at`` managed by the server on status changes
    (API.md §6 + ``apply_status_transition``).

    Changing ``assignee_id`` re-validates activity and business membership.
    """
    biz_id = _business_id(db)
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.business_id == biz_id)
        .one_or_none()
    )
    if task is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )

    changed = False

    if payload.title is not None:
        trimmed = payload.title.strip()
        if len(trimmed) < 1:
            raise _task_validation_error(
                {"field": "title", "issue": "Title must be at least 1 character after trimming."}
            )
        task.title = trimmed
        changed = True

    if payload.description is not None:
        task.description = payload.description
        changed = True

    if payload.category is not None:
        task.category = payload.category
        changed = True

    if payload.priority is not None:
        task.priority = payload.priority
        changed = True

    if payload.status is not None:
        apply_status_transition(task, payload.status)
        changed = True

    if payload.due_at is not None:
        task.due_at = payload.due_at.astimezone(timezone.utc)
        changed = True

    if payload.assignee_id is not None:
        # Re-validate assignee (active + same business).
        try:
            validate_task_assignee(db, task, payload.assignee_id)
        except EmployeeAssignmentError as exc:
            db.rollback()
            raise _task_validation_error({"field": "assignee_id", "issue": exc.reason})
        task.assignee_id = payload.assignee_id
        changed = True

    if changed:
        db.commit()
        db.refresh(task)
    return task_from_db(task)


# ────────────────────────── DELETE ──────────────────────────


@router.delete("/tasks/{task_id}", status_code=http_status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a task (API.md §6)."""
    biz_id = _business_id(db)
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.business_id == biz_id)
        .one_or_none()
    )
    if task is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )
    db.delete(task)
    db.commit()
    return None
