"""Persistence tests: data survives simulated restarts (Phases.md Phase 2 exit criterion)."""

from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models import Base, Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.seed.demo_data import DEMO_TASKS, run_seed
from app.utils.time import utcnow


def test_created_task_survives_new_session(db_session: Session):
    """Commit in one session; read in a brand-new session (restart simulation)."""
    b = Business(name="Restart Studio", category="Printing", timezone="Asia/Kolkata")
    db_session.add(b)
    db_session.flush()
    e = Employee(business_id=b.id, name="Riya", role="EMPLOYEE")
    db_session.add(e)
    db_session.flush()
    db_session.add(
        Task(
            business_id=b.id,
            title="Survives restart",
            assignee_id=e.id,
            priority=TaskPriority.HIGH,
            status=TaskStatus.IN_PROGRESS,
            due_at=utcnow() + timedelta(days=1),
        )
    )
    db_session.commit()
    db_session.close()

    fresh: Session = SessionLocal()
    try:
        found = fresh.query(Task).filter(Task.title == "Survives restart").one()
        assert found.status == TaskStatus.IN_PROGRESS
        assert found.priority == TaskPriority.HIGH
        assert found.assignee.name == "Riya"
        assert found.business.name == "Restart Studio"
    finally:
        fresh.close()


def test_seed_persists_across_restarts_and_does_not_duplicate(db_session: Session):
    """Seed in 'process 1', re-seed in 'process 2', then verify counts unchanged."""
    run_seed(SessionLocal())
    run_seed(SessionLocal())

    fresh: Session = SessionLocal()
    try:
        assert fresh.query(Business).count() == 1
        assert fresh.query(Employee).count() == 4
        assert fresh.query(Task).count() == len(DEMO_TASKS)
        # Seeded data is real, queryable data:
        assert fresh.query(Task).filter(Task.status == TaskStatus.BLOCKED).count() >= 1
    finally:
        fresh.close()


def test_health_reports_connected_db(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"
