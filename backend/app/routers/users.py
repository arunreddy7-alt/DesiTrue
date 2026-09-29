from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_owner
from app.core.security import hash_password
from app.models import Restaurant, User


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# ==========================================
# Schemas
# ==========================================

class RestaurantAdminCreate(BaseModel):
    email: EmailStr
    password: str
    restaurant_id: int


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    restaurant_id: int | None
    is_active: bool

    model_config = {
        "from_attributes": True,
    }


# ==========================================
# Create restaurant admin
# OWNER ONLY
# ==========================================

@router.post(
    "/restaurant-admin",
    response_model=UserResponse,
)
def create_restaurant_admin(
    user_data: RestaurantAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == user_data.restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long.",
        )

    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="RESTAURANT_ADMIN",
        restaurant_id=user_data.restaurant_id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user