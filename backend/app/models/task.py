"""Task ORM model — the central work item."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.business import Base, _uuid_pk
from app.models.enums import TaskPriority, TaskStatus

if TYPE_CHECKING:  # pragma: no cover
    from app.models.business import Business
    from app.models.employee import Employee


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('TODO','IN_PROGRESS','BLOCKED','COMPLETED')",
            name="ck_tasks_status",
        ),
        CheckConstraint(
            "priority IN ('LOW','MEDIUM','HIGH','CRITICAL')",
            name="ck_tasks_priority",
        ),
        # Stable seed identifier (see app/seed/demo_data.py). Nullable: only
        # seeded rows carry a key; user-created tasks leave it NULL.
        UniqueConstraint("seed_key", name="uq_tasks_seed_key"),
    )

    id: Mapped[str] = _uuid_pk()
    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        String(16), nullable=False, default=TaskPriority.MEDIUM, index=True
    )
    status: Mapped[TaskStatus] = mapped_column(
        String(16), nullable=False, default=TaskStatus.TODO, index=True
    )
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    seed_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now().astimezone()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now().astimezone(),
        onupdate=lambda: datetime.now().astimezone(),
    )

    business: Mapped["Business"] = relationship(back_populates="tasks")
    assignee: Mapped["Employee"] = relationship(back_populates="tasks", foreign_keys=[assignee_id])
