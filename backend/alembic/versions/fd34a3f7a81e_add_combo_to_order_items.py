"""add combo to order items

Revision ID: fd34a3f7a81e
Revises: 3963c79abfe1
Create Date: 2026-10-02 00:35:04.895091

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fd34a3f7a81e"
down_revision: Union[str, Sequence[str], None] = "3963c79abfe1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add combo_id to order_items."""

    op.add_column(
        "order_items",
        sa.Column(
            "combo_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_order_items_combo_id",
        "order_items",
        "combos",
        ["combo_id"],
        ["id"],
    )

    op.create_index(
        "ix_order_items_combo_id",
        "order_items",
        ["combo_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove combo_id from order_items."""

    op.drop_index(
        "ix_order_items_combo_id",
        table_name="order_items",
    )

    op.drop_constraint(
        "fk_order_items_combo_id",
        "order_items",
        type_="foreignkey",
    )

    op.drop_column(
        "order_items",
        "combo_id",
    )