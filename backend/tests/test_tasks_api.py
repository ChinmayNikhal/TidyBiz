"""Comprehensive Phase 3 tests: task CRUD, filters, validation, status transitions.

Tests use the shared fixtures from conftest.py (fresh schema per test, seeded
session, API client).
"""

from datetime import timedelta, timezone

import pytest
from fastapi import status

from app.models import Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.utils.time import business_today, utcnow


# ────────────────────────── Helpers ──────────────────────────


def _mk_biz(db):
    """Create and flush a demo business."""
    biz = Business(name="Test Biz", category="Printing", timezone="Asia/Kolkata")
    db.add(biz)
    db.flush()
    return biz


def _mk_emp(db, biz, name="Asha", role="OWNER", is_active=True):
    """Create and flush an employee."""
    emp = Employee(business_id=biz.id, name=name, role=role, is_active=is_active)
    db.add(emp)
    db.flush()
    return emp


def _mk_task(db, biz, assignee, title="Test task", priority="MEDIUM",
             task_status="TODO", due_offset=timedelta(days=1), category=None):
    """Create and flush a task with a due date relative to now."""
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


# ────────────────────────── LIST ──────────────────────────


class TestListTasks:
    def test_list_empty(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.get("/api/tasks")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["items"] == []

    def test_list_returns_seeded_tasks(self, client, db_session):
        from app.seed.demo_data import run_seed
        run_seed(db_session)
        db_session.commit()
        resp = client.get("/api/tasks")
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert len(items) == 13
        statuses = {t["status"] for t in items}
        assert {"TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"} <= statuses

    def test_list_ordered_by_due_at_asc(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="later", due_offset=timedelta(days=3))
        _mk_task(db_session, biz, a, title="sooner", due_offset=timedelta(days=1))
        db_session.commit()
        resp = client.get("/api/tasks")
        items = resp.json()["items"]
        assert items[0]["title"] == "sooner"
        assert items[1]["title"] == "later"


# ────────────────────────── CREATE ──────────────────────────


class TestCreateTask:
    def test_create_minimal(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "New task",
            "assignee_id": a.id,
            "due_at": "2026-09-30T10:00:00+05:30",
        })
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["title"] == "New task"
        assert data["assignee_id"] == a.id
        assert data["status"] == "TODO"
        assert data["priority"] == "MEDIUM"
        assert data["completed_at"] is None

    def test_create_full(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "Full task",
            "description": "A detailed description",
            "assignee_id": a.id,
            "priority": "CRITICAL",
            "status": "IN_PROGRESS",
            "due_at": "2026-09-30T10:00:00+05:30",
            "category": "Design",
        })
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["priority"] == "CRITICAL"
        assert data["status"] == "IN_PROGRESS"
        assert data["category"] == "Design"
        assert data["description"] == "A detailed description"

    def test_create_trims_title(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "  Trimmed  ",
            "assignee_id": a.id,
            "due_at": "2026-09-30T10:00:00+05:30",
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["title"] == "Trimmed"

    def test_create_missing_title_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "assignee_id": a.id,
            "due_at": "2026-09-30T10:00:00+05:30",
        })
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_missing_due_at_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "No due date",
            "assignee_id": a.id,
        })
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_invalid_assignee_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "Bad assignee",
            "assignee_id": "99999999-9999-9999-9999-999999999999",
            "due_at": "2026-09-30T10:00:00+05:30",
        })
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_inactive_assignee_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        inactive = _mk_emp(db_session, biz, name="Ghost", is_active=False)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "Should not assign",
            "assignee_id": inactive.id,
            "due_at": "2026-09-30T10:00:00+05:30",
        })
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_invalid_enum_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        db_session.commit()
        resp = client.post("/api/tasks", json={
            "title": "Bad status",
            "assignee_id": a.id,
            "due_at": "2026-09-30T10:00:00+05:30",
            "status": "DONE",
        })
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ────────────────────────── READ ──────────────────────────


class TestReadTask:
    def test_read_existing(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, title="Read me")
        db_session.commit()
        resp = client.get(f"/api/tasks/{task.id}")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["id"] == task.id
        assert resp.json()["title"] == "Read me"

    def test_read_not_found(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.get("/api/tasks/ffffffff-ffff-ffff-ffff-ffffffffffff")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ────────────────────────── UPDATE ──────────────────────────


class TestUpdateTask:
    def test_patch_title(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, title="Old title")
        db_session.commit()
        resp = client.patch(f"/api/tasks/{task.id}", json={"title": "New title"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["title"] == "New title"

    def test_patch_priority(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, priority="LOW")
        db_session.commit()
        resp = client.patch(f"/api/tasks/{task.id}", json={"priority": "CRITICAL"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["priority"] == "CRITICAL"

    def test_patch_assignee_valid(self, client, db_session):
        biz = _mk_biz(db_session)
        old = _mk_emp(db_session, biz, name="Asha")
        new = _mk_emp(db_session, biz, name="Neha")
        task = _mk_task(db_session, biz, old, title="Reassign")
        db_session.commit()
        resp = client.patch(f"/api/tasks/{task.id}", json={"assignee_id": new.id})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["assignee_id"] == new.id

    def test_patch_assignee_invalid_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a)
        db_session.commit()
        resp = client.patch(
            f"/api/tasks/{task.id}",
            json={"assignee_id": "ffffffff-ffff-ffff-ffff-ffffffffffff"},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_patch_status_to_completed_sets_completed_at(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, task_status="IN_PROGRESS")
        db_session.commit()
        resp = client.patch(f"/api/tasks/{task.id}", json={"status": "COMPLETED"})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["status"] == "COMPLETED"
        assert data["completed_at"] is not None

    def test_patch_reopen_clears_completed_at(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, task_status="IN_PROGRESS")
        db_session.commit()

        # First complete it.
        client.patch(f"/api/tasks/{task.id}", json={"status": "COMPLETED"})
        # Then reopen.
        resp = client.patch(f"/api/tasks/{task.id}", json={"status": "IN_PROGRESS"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["status"] == "IN_PROGRESS"
        assert resp.json()["completed_at"] is None

    def test_patch_invalid_status_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a)
        db_session.commit()
        resp = client.patch(f"/api/tasks/{task.id}", json={"status": "DONE"})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_patch_not_found(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.patch(
            "/api/tasks/ffffffff-ffff-ffff-ffff-ffffffffffff",
            json={"title": "Ghost"},
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ────────────────────────── DELETE ──────────────────────────


class TestDeleteTask:
    def test_delete_existing(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, title="To delete")
        db_session.commit()
        resp = client.delete(f"/api/tasks/{task.id}")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        # Verify it's gone.
        get_resp = client.get(f"/api/tasks/{task.id}")
        assert get_resp.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_not_found(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.delete("/api/tasks/ffffffff-ffff-ffff-ffff-ffffffffffff")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ────────────────────────── FILTERS ──────────────────────────


class TestTaskFilters:
    def test_filter_by_status(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="todo", task_status="TODO")
        _mk_task(db_session, biz, a, title="in prog", task_status="IN_PROGRESS")
        db_session.commit()
        resp = client.get("/api/tasks", params={"status": "IN_PROGRESS"})
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert all(t["status"] == "IN_PROGRESS" for t in items)
        assert len(items) == 1

    def test_filter_by_priority(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="high", priority="HIGH")
        _mk_task(db_session, biz, a, title="low", priority="LOW")
        db_session.commit()
        resp = client.get("/api/tasks", params={"priority": "LOW"})
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert all(t["priority"] == "LOW" for t in items)
        assert len(items) == 1

    def test_filter_by_assignee(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz, name="Asha")
        b = _mk_emp(db_session, biz, name="Neha")
        _mk_task(db_session, biz, a, title="asha task")
        _mk_task(db_session, biz, b, title="neha task")
        db_session.commit()
        resp = client.get("/api/tasks", params={"assignee_id": a.id})
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert all(t["assignee_id"] == a.id for t in items)
        assert len(items) == 1

    def test_filter_invalid_status_rejected(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.get("/api/tasks", params={"status": "INVALID"})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_filter_invalid_priority_rejected(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.get("/api/tasks", params={"priority": "P0"})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_filter_invalid_attention_rejected(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.get("/api/tasks", params={"attention": "unknown"})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_filter_attention_overdue(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        t_overdue = _mk_task(db_session, biz, a, title="overdue", due_offset=timedelta(days=-2))
        _mk_task(db_session, biz, a, title="future", due_offset=timedelta(days=2))
        db_session.commit()
        resp = client.get("/api/tasks", params={"attention": "overdue"})
        assert resp.status_code == status.HTTP_200_OK
        ids = {t["id"] for t in resp.json()["items"]}
        assert t_overdue.id in ids

    def test_filter_attention_blocked(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="blocked", task_status="BLOCKED")
        _mk_task(db_session, biz, a, title="todo", task_status="TODO")
        db_session.commit()
        resp = client.get("/api/tasks", params={"attention": "blocked"})
        assert resp.status_code == status.HTTP_200_OK
        assert all(t["status"] == "BLOCKED" for t in resp.json()["items"])

    def test_filter_attention_completed_excluded(self, client, db_session):
        """Completed tasks must never appear in attention-based filters."""
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="done overdue",
                 task_status="COMPLETED", due_offset=timedelta(days=-2))
        db_session.commit()
        resp = client.get("/api/tasks", params={"attention": "overdue"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["items"] == []

    def test_filter_search(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="Print brochure 100")
        _mk_task(db_session, biz, a, title="Send invoice")
        db_session.commit()
        resp = client.get("/api/tasks", params={"search": "brochure"})
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert len(items) == 1
        assert "brochure" in items[0]["title"].lower()

    def test_filters_composable(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz, name="Asha")
        b = _mk_emp(db_session, biz, name="Neha")
        _mk_task(db_session, biz, a, title="high todo", priority="HIGH", task_status="TODO")
        _mk_task(db_session, biz, b, title="high ip", priority="HIGH", task_status="IN_PROGRESS")
        _mk_task(db_session, biz, a, title="low todo", priority="LOW", task_status="TODO")
        db_session.commit()
        resp = client.get("/api/tasks", params={"priority": "HIGH", "status": "TODO"})
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["title"] == "high todo"

    def test_filter_unknown_assignee_empty(self, client, db_session):
        """Unknown assignee_id is not an error — returns empty list."""
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        _mk_task(db_session, biz, a, title="task")
        db_session.commit()
        resp = client.get("/api/tasks", params={"assignee_id": "ffffffff-ffff-ffff-ffff-ffffffffffff"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["items"] == []


# ────────────────────────── PERSISTENCE ──────────────────────────


class TestTaskPersistence:
    def test_persist_across_sessions(self, client, db_session):
        biz = _mk_biz(db_session)
        a = _mk_emp(db_session, biz)
        task = _mk_task(db_session, biz, a, title="persist me")
        db_session.commit()
        task_id = task.id

        # Close and reopen.
        db_session.close()
        from app.core.database import SessionLocal
        fresh = SessionLocal()
        found = fresh.query(Task).filter(Task.id == task_id).one_or_none()
        assert found is not None
        assert found.title == "persist me"
        fresh.close()
