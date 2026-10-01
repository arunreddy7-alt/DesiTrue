"""allow combo-only order items

Revision ID: a4c1e8f2b7d9
Revises: fd34a3f7a81e
Create Date: 2026-10-02

"""

from typing import Sequence, Union

from alembic import op


revision: str = "a4c1e8f2b7d9"
down_revision: Union[str, Sequence[str], None] = "fd34a3f7a81e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "order_items",
        "product_id",
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "order_items",
        "product_id",
        nullable=False,
    )
