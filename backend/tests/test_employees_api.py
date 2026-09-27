"""Employee list/create/update tests (Phase 3).

P0: GET /api/employees (list, search, active_only filter).
P1: POST /api/employees (create), PATCH /api/employees/{id} (update).
"""

import pytest
from fastapi import status

from app.models import Business, Employee


# ────────────────────────── Helpers ──────────────────────────


def _mk_biz(db):
    biz = Business(name="TestBiz", category="Printing", timezone="Asia/Kolkata")
    db.add(biz)
    db.flush()
    return biz


def _mk_emp(db, biz, name="Asha", role="OWNER", is_active=True):
    e = Employee(business_id=biz.id, name=name, role=role, is_active=is_active)
    db.add(e)
    db.flush()
    return e


# ────────────────────────── LIST ──────────────────────────


class TestListEmployees:
    def test_list_default(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz, "Riya", role="EMPLOYEE")
        _mk_emp(db_session, biz, "Asha")
        db_session.commit()
        resp = client.get("/api/employees")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert "items" in data
        names = [e["name"] for e in data["items"]]
        assert "Asha" in names
        assert "Riya" in names

    def test_list_ordered_by_name(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz, "Zara", role="EMPLOYEE")
        _mk_emp(db_session, biz, "Anita", role="EMPLOYEE")
        db_session.commit()
        resp = client.get("/api/employees")
        names = [e["name"] for e in resp.json()["items"]]
        assert names == sorted(names)

    def test_list_active_only(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz, "Asha")
        _mk_emp(db_session, biz, "Neha", role="EMPLOYEE", is_active=False)
        db_session.commit()
        resp = client.get("/api/employees", params={"active_only": True})
        assert resp.status_code == status.HTTP_200_OK
        names = {e["name"] for e in resp.json()["items"]}
        assert "Asha" in names
        assert "Neha" not in names

    def test_list_search(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz, "Ravi", role="EMPLOYEE")
        _mk_emp(db_session, biz, "Anita", role="EMPLOYEE")
        db_session.commit()
        resp = client.get("/api/employees", params={"search": "ravi"})
        assert resp.status_code == status.HTTP_200_OK
        assert any(e["name"] == "Ravi" for e in resp.json()["items"])
        assert not any(e["name"] == "Anita" for e in resp.json()["items"])


# ────────────────────────── CREATE ──────────────────────────


class TestCreateEmployee:
    def test_create_defaults(self, client, db_session):
        biz = _mk_biz(db_session)
        db_session.commit()
        resp = client.post("/api/employees", json={"name": "Karan", "role": "EMPLOYEE"})
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["name"] == "Karan"
        assert data["business_id"] == biz.id
        assert data["department"] is None
        assert data["is_active"] is True

    def test_create_trims_name(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.post("/api/employees", json={"name": "  Karan  ", "role": "EMPLOYEE"})
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["name"] == "Karan"

    def test_create_missing_name_rejected(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.post("/api/employees", json={})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_duplicate_name_conflict(self, client, db_session):
        biz = _mk_biz(db_session)
        _mk_emp(db_session, biz, "Asha")
        db_session.commit()
        resp = client.post("/api/employees", json={"name": "Asha", "role": "EMPLOYEE"})
        assert resp.status_code == status.HTTP_409_CONFLICT

    def test_create_with_department(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.post("/api/employees", json={
            "name": "Ravi",
            "role": "EMPLOYEE",
            "department": "Dispatch",
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["department"] == "Dispatch"


# ────────────────────────── UPDATE ──────────────────────────


class TestUpdateEmployee:
    def test_update_name(self, client, db_session):
        biz = _mk_biz(db_session)
        e = _mk_emp(db_session, biz, "Old")
        db_session.commit()
        resp = client.patch(f"/api/employees/{e.id}", json={"name": "New"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["name"] == "New"

    def test_update_partial(self, client, db_session):
        biz = _mk_biz(db_session)
        e = _mk_emp(db_session, biz, "Asha")
        db_session.commit()
        resp = client.patch(f"/api/employees/{e.id}", json={"department": "Ops"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["department"] == "Ops"
        assert resp.json()["name"] == "Asha"

    def test_update_blank_name_rejected(self, client, db_session):
        biz = _mk_biz(db_session)
        e = _mk_emp(db_session, biz, "Asha")
        db_session.commit()
        resp = client.patch(f"/api/employees/{e.id}", json={"name": "  "})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_update_not_found(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        resp = client.patch(
            "/api/employees/ffffffff-ffff-ffff-ffff-ffffffffffff",
            json={"name": "Ghost"},
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_update_deactivate(self, client, db_session):
        biz = _mk_biz(db_session)
        e = _mk_emp(db_session, biz, "Asha")
        db_session.commit()
        resp = client.patch(f"/api/employees/{e.id}", json={"is_active": False})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["is_active"] is False


# ────────────────────────── ROUND-TRIP ──────────────────────────


class TestEmployeeRoundTrip:
    def test_list_after_create(self, client, db_session):
        _mk_biz(db_session)
        db_session.commit()
        client.post("/api/employees", json={"name": "Asha", "role": "OWNER"})
        client.post("/api/employees", json={"name": "Riya", "role": "EMPLOYEE"})
        resp = client.get("/api/employees")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["items"]) == 2
