from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category, Restaurant


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"],
)


# =========================================================
# SCHEMAS
# =========================================================

class CategoryCreate(BaseModel):
    restaurant_id: int
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    description: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    slug: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    description: str | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    slug: str
    description: str | None
    is_active: bool

    model_config = {
        "from_attributes": True
    }


# =========================================================
# GET CATEGORIES
# =========================================================

@router.get(
    "/",
    response_model=list[CategoryResponse],
)
def get_categories(
    restaurant_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Category)

    if restaurant_id is not None:
        query = query.filter(
            Category.restaurant_id == restaurant_id
        )

    return (
        query
        .order_by(Category.id.asc())
        .all()
    )


# =========================================================
# CREATE CATEGORY
# =========================================================

@router.post(
    "/",
    response_model=CategoryResponse,
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == category_data.restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found.",
        )

    existing_category = (
        db.query(Category)
        .filter(
            Category.restaurant_id == category_data.restaurant_id,
            Category.slug == category_data.slug,
        )
        .first()
    )

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="A category with this slug already exists for this restaurant.",
        )

    category = Category(
        restaurant_id=category_data.restaurant_id,
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
        is_active=category_data.is_active,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


# =========================================================
# GET SINGLE CATEGORY
# =========================================================

@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    return category


# =========================================================
# UPDATE CATEGORY
# =========================================================

@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    update_data = category_data.model_dump(
        exclude_unset=True
    )

    if "slug" in update_data:
        existing_category = (
            db.query(Category)
            .filter(
                Category.restaurant_id == category.restaurant_id,
                Category.slug == update_data["slug"],
                Category.id != category_id,
            )
            .first()
        )

        if existing_category:
            raise HTTPException(
                status_code=400,
                detail="A category with this slug already exists for this restaurant.",
            )

    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


# =========================================================
# DELETE CATEGORY
# =========================================================

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    if category.products:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete a category that contains products. "
                "Move or delete its products first."
            ),
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully."
    }