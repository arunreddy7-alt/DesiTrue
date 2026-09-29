from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category, OrderItem, Product, Restaurant

router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


# -----------------------------
# Schemas
# -----------------------------

class ProductCreate(BaseModel):
    restaurant_id: int
    category_id: int
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: float = Field(gt=0)
    image_url: str | None = None
    is_available: bool = True


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    image_url: str | None = None
    is_available: bool | None = None


class ProductResponse(BaseModel):
    id: int
    restaurant_id: int
    category_id: int
    name: str
    description: str | None
    price: float
    image_url: str | None
    is_available: bool

    model_config = {
        "from_attributes": True
    }


# -----------------------------
# GET PRODUCTS
# -----------------------------

@router.get("/", response_model=list[ProductResponse])
def get_products(
    restaurant_id: int | None = None,
    category_id: int | None = None,
    include_unavailable: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if restaurant_id is not None:
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

        if not restaurant.is_active:
            raise HTTPException(
                status_code=400,
                detail="Restaurant is currently inactive.",
            )

        query = query.filter(
            Product.restaurant_id == restaurant_id
        )

    if category_id is not None:
        query = query.filter(
            Product.category_id == category_id
        )

    if not include_unavailable:
        query = query.filter(
            Product.is_available == True
        )

    return query.order_by(Product.id.asc()).all()


# -----------------------------
# GET SINGLE PRODUCT
# -----------------------------

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return product


# -----------------------------
# CREATE PRODUCT
# -----------------------------

@router.post("/", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    # Check restaurant
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == product_data.restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found.",
        )

    if not restaurant.is_active:
        raise HTTPException(
            status_code=400,
            detail="Restaurant is currently inactive.",
        )

    # Check category
    category = (
        db.query(Category)
        .filter(Category.id == product_data.category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    # IMPORTANT:
    # Category must belong to the same restaurant
    if category.restaurant_id != product_data.restaurant_id:
        raise HTTPException(
            status_code=400,
            detail="Category does not belong to this restaurant.",
        )

    product = Product(
        restaurant_id=product_data.restaurant_id,
        category_id=product_data.category_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        image_url=product_data.image_url,
        is_available=product_data.is_available,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# -----------------------------
# UPDATE PRODUCT
# -----------------------------

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    # If category is being changed,
    # verify it belongs to the same restaurant.
    if "category_id" in update_data:
        category = (
            db.query(Category)
            .filter(Category.id == update_data["category_id"])
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found.",
            )

        if category.restaurant_id != product.restaurant_id:
            raise HTTPException(
                status_code=400,
                detail="Category does not belong to this restaurant.",
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


# -----------------------------
# DELETE PRODUCT
# -----------------------------

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    # Don't physically delete a product that
    # already exists in an order.
    existing_order_item = (
        db.query(OrderItem)
        .filter(OrderItem.product_id == product_id)
        .first()
    )

    if existing_order_item:
        raise HTTPException(
            status_code=400,
            detail=(
                "This product has already been used in an order. "
                "Mark it unavailable instead of deleting it."
            ),
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully."
    }