"""Verify the business workspace endpoint contract (API.md §4)."""

from fastapi.testclient import TestClient

from app.seed.demo_data import run_seed


def test_business_returns_demo_workspace(client: TestClient, db_session):
    run_seed(db_session)

    response = client.get("/api/business")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "PrintWorks Studio"
    assert body["category"] == "Printing and design"
    assert body["timezone"] == "Asia/Kolkata"
    for field in ("id", "created_at"):
        assert field in body


def test_business_error_uses_standard_envelope(client: TestClient, db_session):
    from app.models import Business

    db_session.query(Business).delete()
    db_session.commit()

    response = client.get("/api/business")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
