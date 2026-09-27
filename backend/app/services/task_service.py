"""Task domain policy (no HTTP concerns).

`apply_status_transition` encodes the API.md §6 completed_at contract:
- transition to COMPLETED sets completed_at (once; keep the original value
  when re-completing so the first completion time is not erased),
- transition from COMPLETED to any other status clears it,
- updated_at is refreshed by the ORM on any mutation.
Phase 3 API routes call this; tests verify the policy directly.
"""

from app.models import Task
from app.models.enums import TaskStatus


def apply_status_transition(task: Task, new_status: TaskStatus) -> Task:
    """Apply a status change with consistent completed_at semantics."""
    from app.utils.time import utcnow

    previous = task.status
    task.status = new_status

    if new_status == TaskStatus.COMPLETED and previous != TaskStatus.COMPLETED:
        task.completed_at = utcnow()
    elif new_status != TaskStatus.COMPLETED and previous == TaskStatus.COMPLETED:
        task.completed_at = None  # reopening clears completion time

    return task
