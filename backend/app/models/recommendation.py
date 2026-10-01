from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecommendationConfig(Base):
    __tablename__ = "recommendation_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    upsell_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    strategy: Mapped[str] = mapped_column(
        String(50),
        default="mixed",
        nullable=False,
    )

    max_recommendations: Mapped[int] = mapped_column(
        Integer,
        default=4,
        nullable=False,
    )

    min_cart_value: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False,
    )

    show_after_add: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    show_in_cart: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    show_before_checkout: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="recommendation_config",
    )