"""Employee endpoints (API.md §5).

P0: GET /api/employees — list all employees, ordered by name ascending.
P1: POST /api/employees — create employee; PATCH /api/employees/{id} — update.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Business, Employee
from app.schemas import EmployeeCreate, EmployeeRead, EmployeeUpdate, employee_from_db

router = APIRouter(tags=["employees"])


def _business_id(db: Session) -> str:
    """Return the demo workspace's id.

    Single-workspace MVP: returns the configured demo business, which exists
    after startup seeding. For future multi-tenant work this becomes a tenant
    resolver.
    """
    business = db.query(Business).first()
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No workspace configured.",
        )
    return business.id


@router.get("/employees", response_model=dict)
def list_employees(
    *,
    search: Optional[str] = Query(None),
    active_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    """List all employees of the demo workspace, ordered by name ascending (API.md §5).

    Inactive employees are included by default. Pass ``?active_only=true`` to
    keep only active teammates.
    """
    biz_id = _business_id(db)
    q = db.query(Employee).filter(Employee.business_id == biz_id)

    if active_only:
        q = q.filter(Employee.is_active == True)  # noqa: E712

    if search:
        q = q.filter(func.lower(Employee.name).contains(func.lower(search)))

    employees = q.order_by(Employee.name.asc()).all()
    return {"items": [employee_from_db(e) for e in employees]}


@router.post("/employees", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
) -> EmployeeRead:
    """Create an employee (API.md §5 — P1).

    ``business_id`` is always set to the demo workspace. Duplicate names within
    the same workspace are rejected with a 409 CONFLICT.
    """
    biz_id = _business_id(db)
    employee = Employee(
        business_id=biz_id,
        name=payload.name.strip(),
        role=payload.role,
        department=payload.department,
        is_active=payload.is_active,
    )
    db.add(employee)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An employee named '{payload.name.strip()}' already exists in this workspace.",
        )
    db.refresh(employee)
    return employee_from_db(employee)


@router.patch("/employees/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
) -> EmployeeRead:
    """Partial update an employee (API.md §5 — P1).

    Omitted fields stay unchanged. Same per-field validation as create for
    supplied fields.
    """
    biz_id = _business_id(db)
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.business_id == biz_id)
        .one_or_none()
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee '{employee_id}' not found.",
        )

    changed = False
    if payload.name is not None:
        trimmed = payload.name.strip()
        if len(trimmed) < 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Employee name must be at least 1 character after trimming.",
            )
        employee.name = trimmed
        changed = True

    if payload.role is not None:
        employee.role = payload.role
        changed = True

    if payload.department is not None:
        employee.department = payload.department
        changed = True

    if payload.is_active is not None:
        employee.is_active = payload.is_active
        changed = True

    if changed:
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An employee named '{employee.name}' already exists in this workspace.",
            )
        db.refresh(employee)
    return employee_from_db(employee)
