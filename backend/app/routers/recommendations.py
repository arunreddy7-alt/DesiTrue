from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_restaurant_access
from app.schemas.recommendation import (
    RecommendationConfigResponse,
    RecommendationConfigUpdate,
)
from app.services.recommendation_service import get_recommendations
from app.models import RecommendationConfig


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"],
)


# =========================================================
# DEFAULT CONFIG
# =========================================================

def create_default_config(
    restaurant_id: int,
    db: Session,
) -> RecommendationConfig:
    config = RecommendationConfig(
        restaurant_id=restaurant_id,
        enabled=True,
        upsell_enabled=True,
        strategy="mixed",
        max_recommendations=4,
        min_cart_value=0,
        show_after_add=True,
        show_in_cart=True,
        show_before_checkout=True,
    )

    db.add(config)
    db.commit()
    db.refresh(config)

    return config


# =========================================================
# GET CONFIG
# =========================================================

@router.get(
    "/{restaurant_id}",
    response_model=RecommendationConfigResponse,
)
def get_recommendation_config(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_restaurant_access),
):
    config = (
        db.query(RecommendationConfig)
        .filter(
            RecommendationConfig.restaurant_id == restaurant_id
        )
        .first()
    )

    if not config:
        config = create_default_config(
            restaurant_id=restaurant_id,
            db=db,
        )

    return config


# =========================================================
# UPDATE CONFIG
# =========================================================

@router.patch(
    "/{restaurant_id}",
    response_model=RecommendationConfigResponse,
)
def update_recommendation_config(
    restaurant_id: int,
    data: RecommendationConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_restaurant_access),
):
    config = (
        db.query(RecommendationConfig)
        .filter(
            RecommendationConfig.restaurant_id == restaurant_id
        )
        .first()
    )

    if not config:
        config = create_default_config(
            restaurant_id=restaurant_id,
            db=db,
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return config


# =========================================================
# GET PRODUCT RECOMMENDATIONS
# =========================================================

@router.get(
    "/{restaurant_id}/items",
)
def get_recommended_items(
    restaurant_id: int,
    cart_product_ids: list[int] | None = Query(
        default=None,
        description="Product IDs currently in the cart.",
    ),
    cart_value: Decimal = Query(
        default=Decimal("0.00"),
        ge=0,
    ),
    db: Session = Depends(get_db),
):
    return get_recommendations(
        restaurant_id=restaurant_id,
        db=db,
        cart_product_ids=cart_product_ids,
        cart_value=cart_value,
    )