"""task seed_key + unique employee name per business

Revision ID: 0002_seed_keys
Revises: 0001_initial_schema
Create Date: 2026-09-27

"""

from alembic import op
import sqlalchemy as sa

revision = "0002_seed_keys"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("seed_key", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_tasks_seed_key", "tasks", ["seed_key"])
    op.create_unique_constraint("uq_employees_business_name", "employees", ["business_id", "name"])


def downgrade() -> None:
    op.drop_constraint("uq_employees_business_name", "employees", type_="unique")
    op.drop_constraint("uq_tasks_seed_key", "tasks", type_="unique")
    op.drop_column("tasks", "seed_key")
