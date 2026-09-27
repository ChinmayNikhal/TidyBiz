"""Tests for authentication and session endpoints."""

import pytest
from fastapi import status
from app.models import Business, Employee


def test_auth_session_endpoint(client, db_session):
    biz = Business(name="PrintWorks Studio", category="Printing and design", timezone="Asia/Kolkata")
    db_session.add(biz)
    db_session.flush()

    emp = Employee(business_id=biz.id, name="Asha Sharma", role="OWNER", department="Management")
    db_session.add(emp)
    db_session.commit()

    response = client.get("/api/auth/session")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["authenticated"] is True
    assert "auth_provider" in data
    assert data["user"]["name"] == "Asha Sharma"
    assert data["user"]["role"] == "OWNER"


def test_auth_me_endpoint(client, db_session):
    biz = Business(name="PrintWorks Studio", category="Printing and design", timezone="Asia/Kolkata")
    db_session.add(biz)
    db_session.flush()

    emp = Employee(business_id=biz.id, name="Riya Patel", role="MANAGER", department="Design")
    db_session.add(emp)
    db_session.commit()

    response = client.get("/api/auth/me")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Riya Patel"
    assert data["role"] == "MANAGER"
