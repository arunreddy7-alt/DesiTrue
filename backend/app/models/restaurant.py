from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.recommendation import RecommendationConfig
    from app.models.combo import Combo

class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    banner_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    tagline: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    primary_color: Mapped[str] = mapped_column(
        String(20),
        default="#18181B",
        nullable=False,
    )

    secondary_color: Mapped[str] = mapped_column(
        String(20),
        default="#FAF9F6",
        nullable=False,
    )

    accent_color: Mapped[str] = mapped_column(
        String(20),
        default="#F97316",
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )

    tax_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    coupons: Mapped[list["Coupon"]] = relationship(
    "Coupon",
    back_populates="restaurant",
)
    recommendation_config: Mapped["RecommendationConfig | None"] = relationship(
            "RecommendationConfig",
            back_populates="restaurant",
            uselist=False,
            cascade="all, delete-orphan",
    )
    combos: Mapped[list["Combo"]] = relationship(
        "Combo",
        back_populates="restaurant",
        cascade="all, delete-orphan",
)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    categories: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="restaurant",
    )

    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="restaurant",
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="restaurant",
    )