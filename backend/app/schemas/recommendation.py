from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


# =========================================================
# RECOMMENDATION CONFIG UPDATE
# =========================================================

class RecommendationConfigUpdate(BaseModel):
    enabled: bool | None = None

    upsell_enabled: bool | None = None

    strategy: Literal[
        "complementary",
        "popular",
        "ai",
        "mixed",
    ] | None = None

    max_recommendations: int | None = Field(
        default=None,
        ge=1,
        le=10,
    )

    min_cart_value: Decimal | None = Field(
        default=None,
        ge=0,
    )

    show_after_add: bool | None = None

    show_in_cart: bool | None = None

    show_before_checkout: bool | None = None


# =========================================================
# RECOMMENDATION CONFIG RESPONSE
# =========================================================

class RecommendationConfigResponse(BaseModel):
    id: int
    restaurant_id: int

    enabled: bool
    upsell_enabled: bool

    strategy: str

    max_recommendations: int
    min_cart_value: Decimal

    show_after_add: bool
    show_in_cart: bool
    show_before_checkout: bool

    model_config = {
        "from_attributes": True
    }