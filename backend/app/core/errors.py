"""Centralized error helpers so routes raise errors consistently.\n\nUsed by task/employee routes; Phase 3 services import and call.\n"""

from typing import Dict
from fastapi import HTTPException
from fastapi import status
from fastapi.responses import JSONResponse

INVALID_INPUT = "Invalid input."

UNAUTHORIZED = "Unauthorized."

FORBIDDEN_ACCESS = "Forbidden."

def handle_assignee_error(task_id: str, field: str, reason: str):
    """Raise 422 error envelope."""
    from fastapi import HTTPException
    from fastapi import status

    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Assignment error: {reason}.")


def task_validation_error(detail: Dict[str, str]):
    """Raise 422 for task-level validation failures."""
    from fastapi import HTTPException
    from fastapi import status

    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Task validation error on field ({detail.get('field')}).")
