"""Idempotent demo seed: PrintWorks Studio workspace, team, and tasks.

Determinism: the same code always produces the same relative deadlines
(offsets from seed time), so overdue/due-soon states stay valid whenever the
demo is judged.

Idempotency and recovery (API.md §13):
- Seed rows carry stable identifiers (`Task.seed_key`, unique employee names
  per business). Seeding upserts by key instead of blindly inserting, so
  restarts and re-runs never duplicate records.
- Partial-seed recovery: if a previous run was interrupted mid-seed (e.g.,
  tasks committed but a crash before business creation completed), a later
  run repairs the missing pieces rather than failing or duplicating.
- Workload is deliberately uneven across employees to exercise Team
  Productivity Overview.
"""

import logging
from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import Business, Employee, Task
from app.models.enums import TaskPriority, TaskStatus
from app.utils.time import utcnow

logger = logging.getLogger("tidybiz.seed")

DEMO_BUSINESS = {
    "name": "PrintWorks Studio",
    "category": "Printing and design",
    "timezone": "Asia/Kolkata",
}

# (name, role, department) — names are unique per business and act as seed keys.
DEMO_EMPLOYEES = [
    ("Asha", "OWNER", "Management"),
    ("Riya", "EMPLOYEE", "Design"),
    ("Arjun", "EMPLOYEE", "Printing and dispatch"),
    ("Neha", "EMPLOYEE", "Inventory and operations"),
]

# (seed_key, title, assignee_name, priority, status, due offset from seed time, category, description)
# Deliberately exercises: overdue open, due today (not overdue), upcoming,
# blocked, critical/high priority, completed, and uneven per-employee workload.
DEMO_TASKS = [
    ("collect-paper-stock", "Collect paper stock from supplier", "Neha", "MEDIUM", "TODO", timedelta(days=-2), "Inventory",
     "Pick up the ordered A4 gloss stock; supplier confirmed readiness."),
    ("dispatch-brochure-1042", "Dispatch brochure order #1042", "Arjun", "HIGH", "TODO", timedelta(days=-1), "Dispatch",
     "Customer awaiting the 200-brochure batch; courier slot booked."),
    ("fix-color-calibration", "Fix color calibration on press 2", "Arjun", "CRITICAL", "BLOCKED", timedelta(hours=-6), "Printing",
     "Blocked: waiting for replacement calibration kit from vendor."),
    ("send-invoice-1039", "Send invoice for banner order #1039", "Asha", "MEDIUM", "TODO", timedelta(hours=-3), "Billing",
     "Invoice pending since the banner was delivered."),
    ("prepare-brochure-draft", "Prepare customer brochure draft", "Riya", "HIGH", "IN_PROGRESS", timedelta(hours=4), "Design",
     "Finalize the brochure design for customer approval."),
    ("design-festival-flyer", "Design festival discount flyer", "Riya", "MEDIUM", "TODO", timedelta(hours=8), "Design",
     "First pass due today; content approved by Asha."),
    ("update-website-pricing", "Update website service pricing", "Asha", "LOW", "TODO", timedelta(days=3), "Website",
     "Reflect new lamination and binding prices."),
    ("restock-lamination-rolls", "Restock lamination rolls", "Neha", "LOW", "IN_PROGRESS", timedelta(days=2), "Inventory",
     "Two rolls left; reorder from usual vendor."),
    ("approve-brochure-proof", "Approve brochure proof", "Asha", "HIGH", "TODO", timedelta(hours=2), "Design",
     "Customer waiting on owner sign-off before printing."),
    ("schedule-social-posts", "Schedule social media posts", "Neha", "LOW", "COMPLETED", timedelta(days=-1), "Marketing",
     "Week-long post queue published."),
    ("deliver-business-cards", "Deliver business cards to Ritika", "Arjun", "MEDIUM", "COMPLETED", timedelta(days=-2), "Dispatch",
     "Handed over and signed for."),
    ("archive-job-files", "Archive last month's job files", "Riya", "LOW", "COMPLETED", timedelta(days=-3), "Admin",
     "Old job folders moved to archive drive."),
    ("visiting-card-artwork", "Prepare visiting card artwork", "Riya", "MEDIUM", "TODO", timedelta(days=2), "Design",
     "Layout awaiting the customer's final logo file."),
]


def _ensure_business(db: Session) -> Business:
    """Get or create the demo business (stable identity: demo name + category)."""
    business = (
        db.query(Business)
        .filter(Business.name == DEMO_BUSINESS["name"], Business.category == DEMO_BUSINESS["category"])
        .one_or_none()
    )
    if business is None:
        business = Business(
            name=DEMO_BUSINESS["name"],
            category=DEMO_BUSINESS["category"],
            timezone=DEMO_BUSINESS["timezone"],
        )
        db.add(business)
        db.flush()
    return business


def _ensure_employee(db: Session, business_id: str, name: str, role: str, department: str) -> Employee:
    """Get or create a demo employee (stable identity: unique name per business)."""
    employee = (
        db.query(Employee)
        .filter(Employee.business_id == business_id, Employee.name == name)
        .one_or_none()
    )
    if employee is None:
        employee = Employee(business_id=business_id, name=name, role=role, department=department)
        db.add(employee)
        db.flush()
    return employee


def _upsert_task(
    db: Session,
    business_id: str,
    seed_key: str,
    title: str,
    assignee_id: str,
    priority: str,
    status: str,
    due_at,
    category: str,
    description: str,
) -> None:
    """Insert the task if its seed_key is absent; refresh demo fields otherwise."""
    task = db.query(Task).filter(Task.seed_key == seed_key).one_or_none()
    if task is None:
        db.add(
            Task(
                business_id=business_id,
                seed_key=seed_key,
                title=title,
                description=description,
                assignee_id=assignee_id,
                priority=TaskPriority(priority),
                status=TaskStatus(status),
                due_at=due_at,
                category=category,
                completed_at=due_at if status == TaskStatus.COMPLETED else None,
            )
        )
    else:
        # Refresh demo-owned fields so the demo state stays intentional.
        # If the owner played with the record, re-seeding restores the demo.
        task.title = title
        task.description = description
        task.assignee_id = assignee_id
        task.priority = TaskPriority(priority)
        task.status = TaskStatus(status)
        task.due_at = due_at
        task.category = category
        task.completed_at = due_at if status == TaskStatus.COMPLETED else None


def run_seed(db: Session | None = None) -> None:
    """Ensure the demo business, team, and tasks exist. Safe on every startup.

    Uses per-row upserts keyed by stable seed identifiers, so interrupted
    seeds are completed on the next run without duplication.
    """
    from app.core.database import SessionLocal

    owns_session = db is None
    if owns_session:
        db = SessionLocal()
    try:
        business = _ensure_business(db)
        db.flush()

        employees: dict[str, Employee] = {}
        for name, role, department in DEMO_EMPLOYEES:
            employees[name] = _ensure_employee(db, business.id, name, role, department)
        db.flush()

        now = utcnow()
        for seed_key, title, assignee_name, priority, status, due_offset, category, description in DEMO_TASKS:
            _upsert_task(
                db,
                business_id=business.id,
                seed_key=seed_key,
                title=title,
                assignee_id=employees[assignee_name].id,
                priority=priority,
                status=status,
                due_at=now + due_offset,
                category=category,
                description=description,
            )
        db.commit()
        logger.info(
            "Seed ensured for '%s': %d employees, %d demo tasks (idempotent)",
            business.name,
            len(DEMO_EMPLOYEES),
            len(DEMO_TASKS),
        )
    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()
