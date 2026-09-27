"""Canonical enum values. Single source of truth shared by models, schemas, and frontend types."""

import enum


class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EmployeeRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


# Attention engine constants (API.md §8). Threshold is a named constant, not duplicated in UI.
EMPLOYEE_OVERDUE_LOAD_THRESHOLD = 2


class AttentionType(str, enum.Enum):
    OVERDUE_TASK = "OVERDUE_TASK"
    BLOCKED_TASK = "BLOCKED_TASK"
    CRITICAL_DEADLINE = "CRITICAL_DEADLINE"
    EMPLOYEE_OVERDUE_LOAD = "EMPLOYEE_OVERDUE_LOAD"
    HIGH_PRIORITY_BLOCKED = "HIGH_PRIORITY_BLOCKED"


class AttentionSeverity(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AttentionCategory(str, enum.Enum):
    OVERDUE = "overdue"
    DUE_TODAY = "due_today"
    BLOCKED = "blocked"
    UPCOMING = "upcoming"
