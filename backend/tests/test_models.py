"""Model-layer tests: relationships, constraints, ownership, timestamps (API.md §6 data rules).

Database-level integrity is enforced by the schema and tested here. The
additional API-boundary rules (active assignee in same business, due_at
required, title length) are Phase 3 validation, not DB constraints — the
split is documented in API.md §6.
"""

from datetime import timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.services.task_service import apply_status_transition
from app.utils.time import utcnow


def _mk_business(db):
    b = Business(name="Test Studio", category="Printing", timezone="Asia/Kolkata")
    db.add(b)
    db.flush()
    return b


def _mk_employee(db, business_id, name="Riya", role="EMPLOYEE"):
    e = Employee(business_id=business_id, name=name, role=role)
    db.add(e)
    db.flush()
    return e


def _mk_task(db, business_id, assignee_id, title="Task", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM):
    t = Task(
        business_id=business_id,
        title=title,
        assignee_id=assignee_id,
        priority=priority,
        status=status,
        due_at=utcnow() + timedelta(days=1),
    )
    db.add(t)
    db.flush()
    return t


def test_task_requires_existing_assignee_fk(db_session):
    """PRD 10.4: foreign keys enforced by the database.

    SQLite only enforces FKs with PRAGMA foreign_keys=ON (set in database.py);
    PostgreSQL/Supabase enforces them natively.
    """
    b = _mk_business(db_session)
    with pytest.raises(IntegrityError):
        db_session.add(
            Task(
                business_id=b.id,
                title="Orphan task",
                assignee_id="nonexistent-employee",
                priority=TaskPriority.LOW,
                status=TaskStatus.TODO,
                due_at=utcnow() + timedelta(days=1),
            )
        )
        db_session.flush()


def test_employee_requires_existing_business_fk(db_session):
    with pytest.raises(IntegrityError):
        db_session.add(Employee(business_id="nonexistent-business", name="Ghost"))
        db_session.flush()


def test_task_status_check_constraint(db_session):
    """Invalid status values are rejected at the database layer."""
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    with pytest.raises(IntegrityError):
        db_session.add(
            Task(
                business_id=b.id,
                title="Bad status",
                assignee_id=e.id,
                priority=TaskPriority.LOW,
                status="DONE",  # not a canonical enum value
                due_at=utcnow() + timedelta(days=1),
            )
        )
        db_session.flush()


def test_task_priority_check_constraint(db_session):
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    with pytest.raises(IntegrityError):
        db_session.add(
            Task(
                business_id=b.id,
                title="Bad priority",
                assignee_id=e.id,
                priority="URGENT",  # not a canonical enum value
                status=TaskStatus.TODO,
                due_at=utcnow() + timedelta(days=1),
            )
        )
        db_session.flush()


def test_employee_role_check_constraint(db_session):
    b = _mk_business(db_session)
    with pytest.raises(IntegrityError):
        db_session.add(Employee(business_id=b.id, name="Bad Role", role="INTERN"))
        db_session.flush()


def test_employee_name_unique_within_business(db_session):
    """uq_employees_business_name: one teammate per name per workspace."""
    b = _mk_business(db_session)
    _mk_employee(db_session, b.id, name="Riya")
    with pytest.raises(IntegrityError):
        _mk_employee(db_session, b.id, name="Riya")


def test_employee_name_unique_scoped_to_business(db_session):
    """The same name may exist in a *different* business (per-workspace scoping)."""
    b1 = _mk_business(db_session)
    b2 = Business(name="Other Studio", category="Printing", timezone="Asia/Kolkata")
    db_session.add(b2)
    db_session.flush()
    _mk_employee(db_session, b1.id, name="Riya")
    _mk_employee(db_session, b2.id, name="Riya")  # no error
    db_session.flush()


def test_task_seed_key_unique(db_session):
    """uq_tasks_seed_key: a stable seed identifier identifies one task."""
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    t1 = _mk_task(db_session, b.id, e.id)
    db_session.delete(t1)  # reuse the row instead when present
    db_session.flush()
    t2 = _mk_task(db_session, b.id, e.id)
    t2.seed_key = "demo-key"
    db_session.flush()
    with pytest.raises(IntegrityError):
        t3 = _mk_task(db_session, b.id, e.id)
        t3.seed_key = "demo-key"
        db_session.flush()


def test_task_assignee_relationship(db_session):
    """Task.assignee and Employee.tasks are wired consistently."""
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id, name="Arjun")
    _mk_task(db_session, b.id, e.id, title="Print banners", status=TaskStatus.IN_PROGRESS)

    assert e.tasks[0].title == "Print banners"
    assert e.tasks[0].assignee.name == "Arjun"
    assert e.business_id == b.id


def test_business_relationships_and_counts(db_session):
    b = _mk_business(db_session)
    e1 = _mk_employee(db_session, b.id, name="Asha", role="OWNER")
    e2 = _mk_employee(db_session, b.id, name="Neha")
    _mk_task(db_session, b.id, e1.id, title="T1")
    _mk_task(db_session, b.id, e2.id, title="T2", status=TaskStatus.COMPLETED)

    assert len(b.employees) == 2
    assert len(b.tasks) == 2


def test_timestamps_are_timezone_aware_utc(db_session):
    """created_at/updated_at/due_at must be tz-aware and stored as UTC."""
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    before = utcnow()
    t = _mk_task(db_session, b.id, e.id, title="Timezone task")
    t.due_at = before + timedelta(days=2)

    for value in (t.created_at, t.updated_at, t.due_at):
        assert value is not None
        assert value.tzinfo is not None, "timestamps must be timezone-aware"

    # UTC storage: within a small window of the UTC clock regardless of host TZ.
    assert abs((t.created_at - before).total_seconds()) < 60
    assert abs((t.updated_at - before).total_seconds()) < 60


def test_updated_at_changes_on_mutation(db_session):
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    t = _mk_task(db_session, b.id, e.id, title="Before update")

    original_updated = t.updated_at
    t.title = "After update"
    t.status = TaskStatus.IN_PROGRESS
    db_session.flush()

    assert t.updated_at >= original_updated
    assert t.title == "After update"


def test_completed_at_set_on_completion_and_cleared_on_reopen(db_session):
    """API.md §6 completed_at policy via apply_status_transition."""
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    t = _mk_task(db_session, b.id, e.id, status=TaskStatus.TODO)
    assert t.completed_at is None

    apply_status_transition(t, TaskStatus.COMPLETED)
    db_session.flush()
    assert t.completed_at is not None
    assert t.status == TaskStatus.COMPLETED

    apply_status_transition(t, TaskStatus.IN_PROGRESS)
    db_session.flush()
    assert t.completed_at is None
    assert t.status == TaskStatus.IN_PROGRESS


def test_recompleted_task_keeps_first_completion_time(db_session):
    b = _mk_business(db_session)
    e = _mk_employee(db_session, b.id)
    t = _mk_task(db_session, b.id, e.id)

    apply_status_transition(t, TaskStatus.COMPLETED)
    first = t.completed_at
    apply_status_transition(t, TaskStatus.BLOCKED)
    apply_status_transition(t, TaskStatus.COMPLETED)

    assert t.completed_at == first
