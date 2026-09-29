from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Restaurant


router = APIRouter(
    prefix="/api/restaurants",
    tags=["Restaurants"],
)


# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class RestaurantCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    logo_url: str | None = None
    phone: str | None = None
    address: str | None = None
    currency: str = "INR"
    tax_percentage: float = 0.0
    is_active: bool = True


class RestaurantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    logo_url: str | None = None
    phone: str | None = None
    address: str | None = None
    currency: str | None = None
    tax_percentage: float | None = None
    is_active: bool | None = None


class RestaurantResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str | None
    address: str | None
    currency: str
    tax_percentage: float
    is_active: bool

    model_config = {
        "from_attributes": True,
    }


# ---------------------------------------------------------
# Create restaurant
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=RestaurantResponse,
)
def create_restaurant(
    restaurant_data: RestaurantCreate,
    db: Session = Depends(get_db),
):
    existing_restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.slug == restaurant_data.slug)
        .first()
    )

    if existing_restaurant:
        raise HTTPException(
            status_code=400,
            detail="A restaurant with this slug already exists.",
        )

    restaurant = Restaurant(
        name=restaurant_data.name,
        slug=restaurant_data.slug,
        description=restaurant_data.description,
        logo_url=restaurant_data.logo_url,
        phone=restaurant_data.phone,
        address=restaurant_data.address,
        currency=restaurant_data.currency,
        tax_percentage=restaurant_data.tax_percentage,
        is_active=restaurant_data.is_active,
    )

    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    return restaurant


# ---------------------------------------------------------
# Get all restaurants
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[RestaurantResponse],
)
def get_restaurants(
    db: Session = Depends(get_db),
):
    restaurants = (
        db.query(Restaurant)
        .order_by(Restaurant.created_at.desc())
        .all()
    )

    return restaurants


# ---------------------------------------------------------
# Get restaurant by ID
# ---------------------------------------------------------

@router.get(
    "/{restaurant_id}",
    response_model=RestaurantResponse,
)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found.",
        )

    return restaurant


# ---------------------------------------------------------
# Update restaurant
# ---------------------------------------------------------

@router.patch(
    "/{restaurant_id}",
    response_model=RestaurantResponse,
)
def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found.",
        )

    if restaurant_data.slug is not None:
        existing_restaurant = (
            db.query(Restaurant)
            .filter(
                Restaurant.slug == restaurant_data.slug,
                Restaurant.id != restaurant_id,
            )
            .first()
        )

        if existing_restaurant:
            raise HTTPException(
                status_code=400,
                detail="A restaurant with this slug already exists.",
            )

    update_data = restaurant_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(restaurant, field, value)

    db.commit()
    db.refresh(restaurant)

    return restaurant