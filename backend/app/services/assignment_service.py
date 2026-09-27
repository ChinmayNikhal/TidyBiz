"""Business rules for task assignment (API.md §6 + PRD §10.4).\n\nThe backend enforces, for any task/assignee change:\n- the assignee exists,\n- the assignee is active,\n- the assignee belongs to the same business as the task.\n\nThese are Phase 3 API-boundary rules and are separate from the DB-level\nFK and unique constraints already modeled.\n"""

from app.models import Business, Employee, Task
from sqlalchemy.orm import Session


def validate_task_assignee(session: Session, task: Task, assignee_id: str) -> Employee:
    """Raise ValueError-like 422 detail if assignee is invalid for this task.\n\n    Returns the Employee on success so the route can apply the change.\n    """
    # Fast: employee + business in one query.
    employee = session.query(Employee).filter(Employee.id == assignee_id).one_or_none()
    if employee is None:
        raise EmployeeAssignmentError(
            task_id=task.id,
            field="assignee_id",
            reason="No employee exists for the supplied assignee_id.",
        )

    if not employee.is_active:
        raise EmployeeAssignmentError(
            task_id=task.id,
            field="assignee_id",
            reason=f"Employee '{employee.name}' is inactive and cannot receive new assignments.",
        )

    # Single-workspace ownership rule + explicit same-business check for reassignment.
    business = session.query(Business).filter(Business.id == task.business_id).one()
    if employee.business_id != business.id:
        raise EmployeeAssignmentError(
            task_id=task.id,
            field="assignee_id",
            reason=f"Employee '{employee.name}' does not belong to this workspace.",
        )

    return employee


class EmployeeAssignmentError(ValueError):
    """Structured ValueError convertible to the API.md §10 error envelope."""

    def __init__(self, task_id: str, field: str, reason: str) -> None:
        super().__init__(reason)
        self.task_id = task_id
        self.field = field
        self.reason = reason
