"""Task request/response schemas (API.md §6)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    """Incoming task creation payload.

    Fields permitted from the client; server-managed fields (id,
    created_at, updated_at, completed_at) are absent here.
    """

    title: str = Field(min_length=1, max_length=160, examples=["Print banner #402"])
    description: Optional[str] = Field(default=None, max_length=2000)
    assignee_id: str = Field(min_length=1, max_length=36, examples=["e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"])
    priority: TaskPriority = TaskPriority.MEDIUM
    due_at: datetime = Field(examples=["2026-09-28T16:00:00+05:30"])
    status: TaskStatus = TaskStatus.TODO
    category: Optional[str] = Field(default=None, max_length=80)


class TaskUpdate(BaseModel):
    """Partial task update. Omitted fields stay unchanged.

    `status` may trigger `completed_at` management (handled in the route).
    `completed_at` is intentionally not settable from the client.
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = Field(default=None, max_length=2000)
    assignee_id: Optional[str] = Field(default=None, min_length=1, max_length=36)
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_at: Optional[datetime] = None
    category: Optional[str] = Field(default=None, max_length=80)


class TaskRead(BaseModel):
    """Canonical task representation (API.md §6 response shape)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    title: str
    description: Optional[str]
    assignee_id: str
    priority: TaskPriority
    status: TaskStatus
    due_at: datetime
    category: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


def task_from_db(task) -> TaskRead:
    """Build the canonical read model from a mapped Task row.

    Preserves enum/string conventions end-to-end (snake_case, uppercase enums).
    """
    return TaskRead(
        id=task.id,
        business_id=task.business_id,
        title=task.title,
        description=task.description,
        assignee_id=task.assignee_id,
        priority=task.priority.value if isinstance(task.priority, TaskPriority) else str(task.priority),
        status=task.status.value if isinstance(task.status, TaskStatus) else str(task.status),
        due_at=task.due_at,
        category=task.category,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )
