"""add restaurant configuration foundation

Revision ID: 1cfe57e129ed
Revises: 0ef8a1ca198a
Create Date: 2026-09-29 12:52:03.143516

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1cfe57e129ed"
down_revision: Union[str, Sequence[str], None] = "0ef8a1ca198a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # 1. Create restaurants table
    # ---------------------------------------------------------

    op.create_table(
        "restaurants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column(
            "currency",
            sa.String(length=10),
            nullable=False,
            server_default="INR",
        ),
        sa.Column(
            "tax_percentage",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_index(
        "ix_restaurants_id",
        "restaurants",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_restaurants_slug",
        "restaurants",
        ["slug"],
        unique=False,
    )

    # ---------------------------------------------------------
    # 2. Create the existing DesiTrue restaurant
    # ---------------------------------------------------------

    op.execute(
        """
        INSERT INTO restaurants
        (name, slug, description, currency, tax_percentage, is_active)
        VALUES
        ('DesiTrue', 'desitrue', 'DesiTrue food truck', 'INR', 0.00, TRUE)
        """
    )

    # ---------------------------------------------------------
    # 3. Add restaurant_id to categories as nullable first
    # ---------------------------------------------------------

    op.add_column(
        "categories",
        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_categories_restaurant_id",
        "categories",
        ["restaurant_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_categories_restaurant_id",
        "categories",
        "restaurants",
        ["restaurant_id"],
        ["id"],
    )

    # ---------------------------------------------------------
    # 4. Attach all existing categories to DesiTrue
    # ---------------------------------------------------------

    op.execute(
        """
        UPDATE categories
        SET restaurant_id = (
            SELECT id
            FROM restaurants
            WHERE slug = 'desitrue'
        )
        WHERE restaurant_id IS NULL
        """
    )

    # ---------------------------------------------------------
    # 5. Add restaurant_id to products as nullable first
    # ---------------------------------------------------------

    op.add_column(
        "products",
        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_products_restaurant_id",
        "products",
        ["restaurant_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_products_restaurant_id",
        "products",
        "restaurants",
        ["restaurant_id"],
        ["id"],
    )

    # ---------------------------------------------------------
    # 6. Attach all existing products to DesiTrue
    # ---------------------------------------------------------

    op.execute(
        """
        UPDATE products
        SET restaurant_id = (
            SELECT id
            FROM restaurants
            WHERE slug = 'desitrue'
        )
        WHERE restaurant_id IS NULL
        """
    )

    # ---------------------------------------------------------
    # 7. Make restaurant_id required
    # ---------------------------------------------------------

    op.alter_column(
        "categories",
        "restaurant_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.alter_column(
        "products",
        "restaurant_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # ---------------------------------------------------------
    # 8. Remove global uniqueness from category name/slug
    # ---------------------------------------------------------
    #
    # Different restaurants must be allowed to have:
    #
    # DesiTrue -> Burger
    # Burger Hub -> Burger
    #
    # ---------------------------------------------------------

    op.drop_constraint(
        "categories_name_key",
        "categories",
        type_="unique",
    )

    op.drop_constraint(
        "categories_slug_key",
        "categories",
        type_="unique",
    )


def downgrade() -> None:
    # Restore global category uniqueness.
    op.create_unique_constraint(
        "categories_name_key",
        "categories",
        ["name"],
    )

    op.create_unique_constraint(
        "categories_slug_key",
        "categories",
        ["slug"],
    )

    # Remove product restaurant relationship.
    op.drop_constraint(
        "fk_products_restaurant_id",
        "products",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_products_restaurant_id",
        table_name="products",
    )

    op.drop_column(
        "products",
        "restaurant_id",
    )

    # Remove category restaurant relationship.
    op.drop_constraint(
        "fk_categories_restaurant_id",
        "categories",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_categories_restaurant_id",
        table_name="categories",
    )

    op.drop_column(
        "categories",
        "restaurant_id",
    )

    # Remove restaurants table.
    op.drop_index(
        "ix_restaurants_slug",
        table_name="restaurants",
    )

    op.drop_index(
        "ix_restaurants_id",
        table_name="restaurants",
    )

    op.drop_table("restaurants")