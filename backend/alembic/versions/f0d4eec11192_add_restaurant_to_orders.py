"""add restaurant to orders

Revision ID: f0d4eec11192
Revises: 1cfe57e129ed
Create Date: 2026-09-29 12:57:13.730109

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f0d4eec11192"
down_revision: Union[str, Sequence[str], None] = "1cfe57e129ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add restaurant_id temporarily as nullable.
    op.add_column(
        "orders",
        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # 2. Add the foreign key.
    op.create_foreign_key(
        "fk_orders_restaurant_id",
        "orders",
        "restaurants",
        ["restaurant_id"],
        ["id"],
    )

    # 3. Add an index for restaurant-based queries.
    op.create_index(
        "ix_orders_restaurant_id",
        "orders",
        ["restaurant_id"],
        unique=False,
    )

    # 4. Attach every existing order to the existing DesiTrue restaurant.
    op.execute(
        """
        UPDATE orders
        SET restaurant_id = (
            SELECT id
            FROM restaurants
            WHERE slug = 'desitrue'
        )
        WHERE restaurant_id IS NULL
        """
    )

    # 5. Now that every existing order has a restaurant,
    #    make the column required.
    op.alter_column(
        "orders",
        "restaurant_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_orders_restaurant_id",
        table_name="orders",
    )

    op.drop_constraint(
        "fk_orders_restaurant_id",
        "orders",
        type_="foreignkey",
    )

    op.drop_column(
        "orders",
        "restaurant_id",
    )