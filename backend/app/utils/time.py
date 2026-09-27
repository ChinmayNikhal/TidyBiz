"""Timezone-aware time helpers.

All timestamps are stored timezone-aware in UTC. Business-date logic
(overdue, due-today, upcoming) uses the workspace timezone (Asia/Kolkata).
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

BUSINESS_TIMEZONE_NAME = "Asia/Kolkata"


def utcnow() -> datetime:
    """Current UTC time, timezone-aware."""
    return datetime.now(timezone.utc)


def business_now() -> datetime:
    """Current time in the business timezone, timezone-aware."""
    return datetime.now(ZoneInfo(BUSINESS_TIMEZONE_NAME))


def business_today() -> date:
    """Current business date (Asia/Kolkata)."""
    return business_now().date()


def to_business_date(dt: datetime) -> date:
    """Convert an aware datetime to the business-timezone calendar date."""
    if dt.tzinfo is None:
        raise ValueError("Expected timezone-aware datetime")
    return dt.astimezone(ZoneInfo(BUSINESS_TIMEZONE_NAME)).date()
