"""add coupon to orders

Revision ID: 2b0f471f0e03
Revises: 09a47e5cc70e
Create Date: 2026-09-27 21:13:03.311357

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2b0f471f0e03"
down_revision: Union[str, Sequence[str], None] = "09a47e5cc70e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "orders",
        sa.Column(
            "coupon_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_orders_coupon_id",
        "orders",
        "coupons",
        ["coupon_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "fk_orders_coupon_id",
        "orders",
        type_="foreignkey",
    )

    op.drop_column(
        "orders",
        "coupon_id",
    )