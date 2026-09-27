"""Shared pytest fixtures: isolated per-test database and app client.

SQLite stores naive datetimes; SQLAlchemy 2.x requires care so we set
DATETIME storage to keep timezone awareness on write via a storage-format
event. For determinism, tests verify stored UTC values.
"""

import os
import tempfile

import pytest
from fastapi.testclient import TestClient

# Must set env before importing app modules (settings are read at import time).
# Default: isolated temp SQLite. To run the suite against PostgreSQL (parity check),
# export TIDYBIZ_DATABASE_URL first, e.g. the compose `tidybiz_test` database:
#   TIDYBIZ_DATABASE_URL=postgresql+psycopg://tidybiz:tidybiz-dev-only@localhost:5432/tidybiz_test
_tmpdir = tempfile.mkdtemp()
os.environ.setdefault("TIDYBIZ_DATABASE_URL", f"sqlite:///{_tmpdir}/test.db")
os.environ["TIDYBIZ_SEED_ON_STARTUP"] = "false"

from app.main import app  # noqa: E402
from app.core.database import SessionLocal, engine  # noqa: E402
from app.models import Base  # noqa: E402
from app.seed.demo_data import DEMO_EMPLOYEES, DEMO_TASKS  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_schema():
    """Fresh schema for every test: drop and recreate all tables."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def seeded_session(db_session):
    """Run the demo seed once and hand back the session."""
    from app.seed.demo_data import run_seed

    run_seed(db_session)
    return db_session


@pytest.fixture()
def client():
    """API client; startup runs without seeding (TIDYBIZ_SEED_ON_STARTUP=false)."""
    with TestClient(app) as c:
        yield c


# Expose seed counts for assertions without importing in each test module.
SEED_EMPLOYEE_COUNT = len(DEMO_EMPLOYEES)
SEED_TASK_COUNT = len(DEMO_TASKS)
