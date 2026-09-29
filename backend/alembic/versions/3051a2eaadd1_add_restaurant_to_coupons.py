"""add restaurant to coupons

Revision ID: 3051a2eaadd1
Revises: f0d4eec11192
Create Date: 2026-09-29 15:29:08.919501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3051a2eaadd1"
down_revision: Union[str, Sequence[str], None] = "f0d4eec11192"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add restaurant_id as nullable first so existing rows can be preserved.
    op.add_column(
        "coupons",
        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # All existing coupons currently belong to DesiTrue.
    op.execute(
        sa.text(
            "UPDATE coupons SET restaurant_id = 1 "
            "WHERE restaurant_id IS NULL"
        )
    )

    # restaurant_id is now required.
    op.alter_column(
        "coupons",
        "restaurant_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # Link coupons to restaurants.
    op.create_foreign_key(
        "fk_coupons_restaurant_id",
        "coupons",
        "restaurants",
        ["restaurant_id"],
        ["id"],
    )

    # Find and remove the existing unique constraint/index on code.
    bind = op.get_bind()

    result = bind.execute(
        sa.text(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'coupons'
              AND indexdef LIKE '%UNIQUE%'
              AND indexdef LIKE '%(code)%'
            """
        )
    )

    existing_unique_index = result.scalar()

    if existing_unique_index:
        op.execute(
            sa.text(
                f'DROP INDEX IF EXISTS "{existing_unique_index}"'
            )
        )

    # Coupon codes are unique within each restaurant.
    op.create_unique_constraint(
        "uq_coupons_restaurant_code",
        "coupons",
        ["restaurant_id", "code"],
    )

    # Index restaurant_id for faster restaurant-specific queries.
    op.create_index(
        "ix_coupons_restaurant_id",
        "coupons",
        ["restaurant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_coupons_restaurant_id",
        table_name="coupons",
    )

    op.drop_constraint(
        "uq_coupons_restaurant_code",
        "coupons",
        type_="unique",
    )

    op.drop_constraint(
        "fk_coupons_restaurant_id",
        "coupons",
        type_="foreignkey",
    )

    op.drop_column(
        "coupons",
        "restaurant_id",
    )