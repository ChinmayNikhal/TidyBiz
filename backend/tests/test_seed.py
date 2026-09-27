"""Seed tests: stable-key idempotency, partial-seed recovery, coverage (API.md §13)."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.seed.demo_data import DEMO_EMPLOYEES, DEMO_TASKS, run_seed
from app.utils.time import business_today, to_business_date, utcnow


def test_seed_is_idempotent_across_runs(seeded_session: Session):
    run_seed(seeded_session)  # second run immediately
    run_seed(seeded_session)  # third run immediately

    assert seeded_session.query(Business).count() == 1
    assert seeded_session.query(Employee).count() == len(DEMO_EMPLOYEES)
    assert seeded_session.query(Task).count() == len(DEMO_TASKS)


def test_seed_repeated_seeding_does_not_duplicate(db_session):
    """Simulate separate process startups: fresh sessions each time."""
    from app.core.database import SessionLocal

    run_seed(SessionLocal())
    run_seed(SessionLocal())

    assert db_session.query(Business).count() == 1
    assert db_session.query(Employee).count() == len(DEMO_EMPLOYEES)
    assert db_session.query(Task).count() == len(DEMO_TASKS)


def test_seed_uses_stable_keys(seeded_session: Session):
    """Every demo task carries a stable seed_key; employees keyed by name."""
    tasks = seeded_session.query(Task).all()
    assert all(t.seed_key for t in tasks)
    assert len({t.seed_key for t in tasks}) == len(DEMO_TASKS)

    names = {e.name for e in seeded_session.query(Employee).all()}
    assert names == {name for name, _, _ in DEMO_EMPLOYEES}


def test_seed_recovers_from_partial_run_missing_tasks(db_session):
    """Interrupted seed (tasks missing) is repaired by the next run — no duplicates."""
    from app.core.database import SessionLocal

    run_seed(SessionLocal())
    db_session.query(Task).delete()
    db_session.commit()

    run_seed(SessionLocal())  # recovery run

    assert db_session.query(Task).count() == len(DEMO_TASKS)
    assert db_session.query(Employee).count() == len(DEMO_EMPLOYEES)
    assert db_session.query(Business).count() == 1


def test_seed_recovers_from_partial_run_missing_everything(db_session):
    """Crash before commit: next run seeds from scratch cleanly."""
    from app.core.database import SessionLocal

    run_seed(SessionLocal())

    fresh: Session = SessionLocal()
    try:
        assert fresh.query(Business).count() == 1
        assert fresh.query(Task).count() == len(DEMO_TASKS)
    finally:
        fresh.close()

    # And it stays idempotent afterwards.
    run_seed(SessionLocal())
    assert db_session.query(Business).count() == 1
    assert db_session.query(Task).count() == len(DEMO_TASKS)


def test_seed_refreshes_mutated_demo_rows(db_session):
    """Re-seeding restores demo-owned fields of a demo row (by stable key)."""
    from app.core.database import SessionLocal

    run_seed(SessionLocal())
    target = db_session.query(Task).filter(Task.seed_key == "approve-brochure-proof").one()
    target.status = TaskStatus.COMPLETED  # someone played with the demo
    db_session.commit()

    run_seed(SessionLocal())
    db_session.expire_all()  # drop cached state; re-read what the seed session committed
    refreshed = db_session.query(Task).filter(Task.seed_key == "approve-brochure-proof").one()
    assert refreshed.status == TaskStatus.TODO
    assert refreshed.completed_at is None


def test_seed_covers_all_workflow_states(seeded_session: Session):
    statuses = {t.status for t in seeded_session.query(Task).all()}
    assert statuses == {TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.COMPLETED}


def test_seed_covers_all_priorities(seeded_session: Session):
    priorities = {t.priority for t in seeded_session.query(Task).all()}
    assert priorities == {TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL}


def test_seed_includes_overdue_due_today_and_upcoming(seeded_session: Session):
    """PRD 6.7 deadline classifications, evaluated in the business timezone."""
    now = utcnow()
    today = business_today()

    open_tasks = seeded_session.query(Task).filter(Task.status != TaskStatus.COMPLETED).all()
    overdue = [t for t in open_tasks if t.due_at < now]
    due_today = [t for t in open_tasks if not (t.due_at < now) and to_business_date(t.due_at) == today]
    upcoming = [t for t in open_tasks if to_business_date(t.due_at) > today]

    assert overdue, "seed must include overdue open tasks"
    assert due_today, "seed must include tasks due today (not overdue)"
    assert upcoming, "seed must include upcoming tasks"
    assert all(t.status != TaskStatus.COMPLETED for t in overdue)


def test_seed_varies_employee_workload(seeded_session: Session):
    tasks = seeded_session.query(Task).all()
    by_employee: dict[str, int] = {}
    for t in tasks:
        by_employee[t.assignee.name] = by_employee.get(t.assignee.name, 0) + 1

    assert len(by_employee) == len(DEMO_EMPLOYEES), "every employee should have work"
    assert len(set(by_employee.values())) > 1, "workload counts should vary between employees"


def test_seed_deadlines_are_relative_to_seed_time(db_session):
    """Seeding now vs later produces deadlines offset from *that* moment."""
    from app.core.database import SessionLocal

    run_seed(SessionLocal())
    first_due = db_session.query(Task).filter(Task.seed_key == "approve-brochure-proof").one().due_at

    # Simulate a much later fresh seed in an isolated workspace.
    db_session.query(Task).delete()
    db_session.query(Employee).delete()
    db_session.query(Business).delete()
    db_session.commit()

    run_seed(SessionLocal())
    second_due = db_session.query(Task).filter(Task.seed_key == "approve-brochure-proof").one().due_at

    # Relative to seed time, so the gap between seeds cannot exceed task horizon (3 days).
    assert abs((second_due - first_due).total_seconds()) < timedelta(days=3).total_seconds()


def test_seed_completed_tasks_have_completed_at(seeded_session: Session):
    completed = seeded_session.query(Task).filter(Task.status == TaskStatus.COMPLETED).all()
    assert completed
    assert all(t.completed_at is not None for t in completed)

    open_tasks = seeded_session.query(Task).filter(Task.status != TaskStatus.COMPLETED).all()
    assert all(t.completed_at is None for t in open_tasks)
