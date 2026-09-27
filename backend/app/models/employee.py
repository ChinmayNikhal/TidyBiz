"""Employee ORM model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.business import Base, _uuid_pk
from app.models.enums import EmployeeRole

if TYPE_CHECKING:  # pragma: no cover
    from app.models.business import Business
    from app.models.task import Task


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint(
            "role IN ('OWNER','MANAGER','EMPLOYEE')",
            name="ck_employees_role",
        ),
        # Workspace-unique teammate names double as stable seed identifiers.
        UniqueConstraint("business_id", "name", name="uq_employees_business_name"),
    )

    id: Mapped[str] = _uuid_pk()
    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[EmployeeRole] = mapped_column(
        String(16), nullable=False, default=EmployeeRole.EMPLOYEE
    )
    department: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now().astimezone()
    )

    business: Mapped["Business"] = relationship(back_populates="employees")
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="assignee", foreign_keys="Task.assignee_id"
    )
