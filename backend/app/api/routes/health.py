"""Health and readiness endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

router = APIRouter(tags=["health"])


def health_payload() -> dict:
    database_state = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        database_state = "unavailable"
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.version,
        "database": database_state,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def health() -> dict:
    """Liveness + database connectivity status. Never exposes credentials."""
    return health_payload()
