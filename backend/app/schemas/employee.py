"""Employee request/response schemas (API.md §5)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EmployeeRole


class EmployeeRead(BaseModel):
    """Canonical employee representation (API.md §5 response shape)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    name: str
    role: EmployeeRole
    department: Optional[str]
    is_active: bool
    created_at: datetime


def employee_from_db(employee) -> EmployeeRead:
    """Build the canonical read model from a mapped Employee row."""
    return EmployeeRead(
        id=employee.id,
        business_id=employee.business_id,
        name=employee.name,
        role=employee.role.value if isinstance(employee.role, EmployeeRole) else str(employee.role),
        department=employee.department,
        is_active=employee.is_active,
        created_at=employee.created_at,
    )


class EmployeeCreate(BaseModel):
    """Incoming employee creation payload.

    `business_id` is set by the backend (single workspace MVP).
    """

    name: str = Field(min_length=1, max_length=120, examples=["Karan"])
    role: EmployeeRole = EmployeeRole.EMPLOYEE
    department: Optional[str] = Field(default=None, max_length=80, examples=["Dispatch"])
    is_active: bool = True


class EmployeeUpdate(BaseModel):
    """Partial employee update. Omitted fields unchanged.

    Same per-field validation as create for supplied fields.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    role: Optional[EmployeeRole] = None
    department: Optional[str] = Field(default=None, max_length=80)
    is_active: Optional[bool] = None
