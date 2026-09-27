"""SQLite timezone-awareness helpers.

SQLite's DateTime columns return naive datetimes. The app always stores UTC
values, so these listeners re-attach UTC tzinfo on load. PostgreSQL (Supabase)
returns timezone-aware datetimes natively and is unaffected.
"""

from datetime import datetime, timezone

from sqlalchemy import event, inspect

from app.models import Business, Employee, Task


def _attach_utc(target, context):
    state = inspect(target)
    for attr in state.mapper.column_attrs:
        value = getattr(target, attr.key)
        if isinstance(value, datetime) and value.tzinfo is None:
            setattr(target, attr.key, value.replace(tzinfo=timezone.utc))


def register_timezone_listeners() -> None:
    """Attach UTC tzinfo to naive datetimes loaded from SQLite."""
    for model in (Business, Employee, Task):
        event.listen(model, "load", _attach_utc)
