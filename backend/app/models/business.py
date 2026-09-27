"""Business (workspace) ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _uuid_pk() -> Mapped[str]:
    return mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


class Base(DeclarativeBase):
    """Shared declarative base. String(36) UUID PKs work on SQLite and PostgreSQL."""


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[str] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    employees: Mapped[list["Employee"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
