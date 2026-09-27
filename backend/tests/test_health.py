"""Verify the health endpoint contract defined in API.md §3."""

from fastapi.testclient import TestClient


def test_health_returns_contract_fields(client: TestClient):
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "tidybiz-backend"
    assert body["database"] == "connected"
    assert "time" in body


def test_root_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
