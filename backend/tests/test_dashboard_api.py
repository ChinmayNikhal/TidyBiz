"""Comprehensive Phase 4 & 5 tests: dashboard summary, workload, attention rules engine.

Tests use the shared fixtures from conftest.py (fresh schema per test, seeded
session, API client).
"""

from datetime import timedelta
import pytest
from fastapi import status

from app.models import Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.utils.time import business_today, utcnow


def _mk_biz(db):
    biz = Business(name="Test PrintWorks", category="Printing", timezone="Asia/Kolkata")
    db.add(biz)
    db.flush()
    return biz


def _mk_emp(db, biz, name="Asha", role="OWNER", is_active=True):
    emp = Employee(business_id=biz.id, name=name, role=role, is_active=is_active)
    db.add(emp)
    db.flush()
    return emp


def _mk_task(db, biz, assignee, title="Test task", priority="MEDIUM",
             task_status="TODO", due_offset=timedelta(days=1), category=None):
    now = utcnow()
    task = Task(
        business_id=biz.id,
        title=title,
        assignee_id=assignee.id,
        priority=priority,
        status=task_status,
        due_at=now + due_offset,
        category=category,
    )
    db.add(task)
    db.flush()
    return task


# ────────────────────────── Phase 4: Summary & Workload ──────────────────────────


class TestDashboardSummary:
    def test_summary_empty(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()

        resp = client.get("/api/dashboard/summary")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["total_tasks"] == 0
        assert data["open_tasks"] == 0
        assert data["completed_tasks"] == 0
        assert data["overdue_tasks"] == 0
        assert data["blocked_tasks"] == 0
        assert data["due_today"] == 0
        assert data["completion_rate"] == 0

    def test_summary_metrics(self, client, db_session):
        biz = _mk_biz(db_session)
        emp = _mk_emp(db_session, biz, name="Ravi")

        # 1 completed task
        _mk_task(db_session, biz, emp, title="Task 1", task_status="COMPLETED", due_offset=timedelta(days=-2))
        # 1 overdue open task
        _mk_task(db_session, biz, emp, title="Task 2", task_status="TODO", due_offset=timedelta(days=-1))
        # 1 blocked open task (upcoming)
        _mk_task(db_session, biz, emp, title="Task 3", task_status="BLOCKED", due_offset=timedelta(days=2))
        # 1 normal in-progress task (upcoming)
        _mk_task(db_session, biz, emp, title="Task 4", task_status="IN_PROGRESS", due_offset=timedelta(days=3))
        db_session.commit()

        resp = client.get("/api/dashboard/summary")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["total_tasks"] == 4
        assert data["open_tasks"] == 3
        assert data["completed_tasks"] == 1
        assert data["overdue_tasks"] == 1  # only open task is counted as overdue
        assert data["blocked_tasks"] == 1
        assert data["completion_rate"] == 25.0


class TestDashboardWorkload:
    def test_workload_counts(self, client, db_session):
        biz = _mk_biz(db_session)
        emp1 = _mk_emp(db_session, biz, name="Alice")
        emp2 = _mk_emp(db_session, biz, name="Bob")

        # Alice: 1 completed, 1 overdue
        _mk_task(db_session, biz, emp1, title="A1", task_status="COMPLETED", due_offset=timedelta(days=-2))
        _mk_task(db_session, biz, emp1, title="A2", task_status="TODO", due_offset=timedelta(days=-1))

        # Bob: 1 blocked
        _mk_task(db_session, biz, emp2, title="B1", task_status="BLOCKED", due_offset=timedelta(days=1))
        db_session.commit()

        resp = client.get("/api/dashboard/workload")
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert len(items) == 2
        assert items[0]["name"] == "Alice"
        assert items[0]["completed_tasks"] == 1
        assert items[0]["open_tasks"] == 1
        assert items[0]["overdue_tasks"] == 1
        assert items[0]["blocked_tasks"] == 0

        assert items[1]["name"] == "Bob"
        assert items[1]["open_tasks"] == 1
        assert items[1]["blocked_tasks"] == 1
        assert items[1]["completed_tasks"] == 0


# ────────────────────────── Phase 5: Attention Rules ──────────────────────────


class TestDashboardAttention:
    def test_attention_rules(self, client, db_session):
        biz = _mk_biz(db_session)
        emp = _mk_emp(db_session, biz, name="Asha")

        # R1: overdue task (TODO, past due)
        _mk_task(db_session, biz, emp, title="Overdue 1", priority="LOW", task_status="TODO", due_offset=timedelta(hours=-5))
        # Another overdue task for Asha to trigger R4 (>= 2 overdue open tasks)
        _mk_task(db_session, biz, emp, title="Overdue 2", priority="MEDIUM", task_status="TODO", due_offset=timedelta(hours=-10))

        # R2 & R5: HIGH priority BLOCKED task
        _mk_task(db_session, biz, emp, title="Blocked High", priority="HIGH", task_status="BLOCKED", due_offset=timedelta(days=2))

        # R3: CRITICAL task past due
        _mk_task(db_session, biz, emp, title="Critical Past Due", priority="CRITICAL", task_status="IN_PROGRESS", due_offset=timedelta(hours=-2))

        # Completed overdue task should NOT trigger any attention rule
        _mk_task(db_session, biz, emp, title="Done task", priority="CRITICAL", task_status="COMPLETED", due_offset=timedelta(days=-5))

        db_session.commit()

        resp = client.get("/api/dashboard/attention")
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        rule_codes = [item["rule_code"] for item in items]

        # Verify all rules present
        assert "OVERDUE_TASK" in rule_codes
        assert "BLOCKED_TASK" in rule_codes
        assert "CRITICAL_DEADLINE" in rule_codes
        assert "EMPLOYEE_OVERDUE_LOAD" in rule_codes
        assert "HIGH_PRIORITY_BLOCKED" in rule_codes

        # Check severity sorting (all HIGH before MEDIUM)
        severities = [item["severity"] for item in items]
        high_indices = [i for i, s in enumerate(severities) if s == "HIGH"]
        medium_indices = [i for i, s in enumerate(severities) if s == "MEDIUM"]
        if high_indices and medium_indices:
            assert max(high_indices) < min(medium_indices)
