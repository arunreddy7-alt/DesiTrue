from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.dependencies import require_owner, require_restaurant_access

from app.core.database import get_db
from app.models import Restaurant
from app.core.security import hash_password
from app.models import User


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
    
class RestaurantAdminCreate(BaseModel):
    email: str
    password: str


class RestaurantWithAdminCreate(RestaurantCreate):
    admin_email: str
    admin_password: str


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
    restaurant_data: RestaurantWithAdminCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_owner),
):
    # -----------------------------
    # Validate admin credentials
    # -----------------------------

    if len(restaurant_data.admin_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Admin password must be at least 8 characters.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == restaurant_data.admin_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this admin email already exists.",
        )

    # -----------------------------
    # Validate restaurant slug
    # -----------------------------

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

    # -----------------------------
    # Create restaurant
    # -----------------------------

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
    db.flush()

    # -----------------------------
    # Create restaurant admin
    # -----------------------------

    admin_user = User(
        email=restaurant_data.admin_email,
        password_hash=hash_password(
            restaurant_data.admin_password
        ),
        role="RESTAURANT_ADMIN",
        restaurant_id=restaurant.id,
        is_active=True,
    )

    db.add(admin_user)

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
    current_user=Depends(require_restaurant_access),
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