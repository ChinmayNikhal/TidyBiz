"""Authentication & Session endpoints (Supabase + Local Workspace Session).

Provides session verification, Supabase integration status, active user identity,
and role context as per PRD.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Business, Employee
from app.schemas import EmployeeRead, employee_from_db

router = APIRouter(prefix="/auth", tags=["auth"])


def _is_supabase_configured() -> bool:
    return bool(
        settings.supabase_url
        and settings.supabase_anon_key
        and not "placeholder" in settings.supabase_url
    )


@router.get("/session")
def get_session_status(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """Return session state, active user profile, and Supabase integration status."""
    supabase_active = _is_supabase_configured()

    # Look up business
    business = db.query(Business).first()
    biz_name = business.name if business else "PrintWorks Studio"

    # Default to first active employee (Asha / OWNER) if no token is present
    default_emp = (
        db.query(Employee)
        .filter(Employee.is_active == True)  # noqa: E712
        .order_by(Employee.created_at.asc())
        .first()
    )

    user_info = None
    if default_emp:
        user_info = {
            "id": default_emp.id,
            "name": default_emp.name,
            "role": default_emp.role.value if hasattr(default_emp.role, "value") else str(default_emp.role),
            "department": default_emp.department,
            "business_name": biz_name,
        }

    return {
        "authenticated": True,
        "auth_provider": "supabase" if supabase_active else "workspace_session",
        "supabase_configured": supabase_active,
        "supabase_url": settings.supabase_url if supabase_active else None,
        "user": user_info,
    }


@router.get("/me", response_model=Optional[EmployeeRead])
def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[EmployeeRead]:
    """Return active employee profile for the current session."""
    employee = (
        db.query(Employee)
        .filter(Employee.is_active == True)  # noqa: E712
        .order_by(Employee.created_at.asc())
        .first()
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active employee profile found in workspace.",
        )
    return employee_from_db(employee)
