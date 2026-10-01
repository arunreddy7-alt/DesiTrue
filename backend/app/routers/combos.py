
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import require_restaurant_access
from app.models import Combo, ComboItem, Product
from app.schemas.combo import (
    ComboCreate,
    ComboResponse,
    ComboUpdate,
)

router = APIRouter(
    prefix="/api/combos",
    tags=["Combos"],
)


def validate_combo_items(
    restaurant_id: int,
    items,
    db: Session,
):
    if not items:
        raise HTTPException(
            status_code=400,
            detail="A combo must contain at least one product.",
        )

    product_ids = [item.product_id for item in items]

    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=400,
            detail="A product cannot be added to a combo more than once.",
        )

    products = (
        db.query(Product)
        .filter(
            Product.id.in_(product_ids),
            Product.restaurant_id == restaurant_id,
        )
        .all()
    )

    products_by_id = {
        product.id: product
        for product in products
    }

    missing_ids = [
        product_id
        for product_id in product_ids
        if product_id not in products_by_id
    ]

    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=(
                "The following products do not belong to this restaurant "
                f"or do not exist: {missing_ids}"
            ),
        )

    unavailable_products = [
        product.name
        for product in products
        if not product.is_available
    ]

    if unavailable_products:
        raise HTTPException(
            status_code=400,
            detail=(
                "The following products are currently unavailable: "
                + ", ".join(unavailable_products)
            ),
        )

    return products_by_id


def serialize_combo(combo: Combo) -> dict:
    return {
        "id": combo.id,
        "restaurant_id": combo.restaurant_id,
        "name": combo.name,
        "description": combo.description,
        "image_url": combo.image_url,
        "price": combo.price,
        "is_active": combo.is_active,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
            }
            for item in combo.items
        ],
    }


@router.post(
    "/{restaurant_id}",
    response_model=ComboResponse,
)
def create_combo(
    restaurant_id: int,
    data: ComboCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_restaurant_access),
):
    validate_combo_items(
        restaurant_id=restaurant_id,
        items=data.items,
        db=db,
    )

    combo = Combo(
        restaurant_id=restaurant_id,
        name=data.name,
        description=data.description,
        image_url=data.image_url,
        price=data.price,
        is_active=True,
    )

    db.add(combo)
    db.flush()

    for item in data.items:
        combo_item = ComboItem(
            combo_id=combo.id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
        db.add(combo_item)

    db.commit()
    db.refresh(combo)

    combo = (
        db.query(Combo)
        .options(joinedload(Combo.items))
        .filter(Combo.id == combo.id)
        .first()
    )

    return serialize_combo(combo)


@router.get(
    "/{restaurant_id}",
    response_model=list[ComboResponse],
)
def get_restaurant_combos(
    restaurant_id: int,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Combo)
        .options(joinedload(Combo.items))
        .filter(
            Combo.restaurant_id == restaurant_id,
        )
    )

    if not include_inactive:
        query = query.filter(
            Combo.is_active.is_(True)
        )

    combos = query.order_by(
        Combo.id.desc()
    ).all()

    return [
        serialize_combo(combo)
        for combo in combos
    ]


@router.get(
    "/{restaurant_id}/{combo_id}",
    response_model=ComboResponse,
)
def get_combo(
    restaurant_id: int,
    combo_id: int,
    db: Session = Depends(get_db),
):
    combo = (
        db.query(Combo)
        .options(joinedload(Combo.items))
        .filter(
            Combo.id == combo_id,
            Combo.restaurant_id == restaurant_id,
        )
        .first()
    )

    if not combo:
        raise HTTPException(
            status_code=404,
            detail="Combo not found.",
        )

    return serialize_combo(combo)


@router.patch(
    "/{restaurant_id}/{combo_id}",
    response_model=ComboResponse,
)
def update_combo(
    restaurant_id: int,
    combo_id: int,
    data: ComboUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_restaurant_access),
):
    combo = (
        db.query(Combo)
        .filter(
            Combo.id == combo_id,
            Combo.restaurant_id == restaurant_id,
        )
        .first()
    )

    if not combo:
        raise HTTPException(
            status_code=404,
            detail="Combo not found.",
        )

    updates = data.model_dump(
        exclude_unset=True,
        exclude={"items"},
    )

    for field, value in updates.items():
        setattr(combo, field, value)

    if data.items is not None:
        validate_combo_items(
            restaurant_id=restaurant_id,
            items=data.items,
            db=db,
        )

        combo.items.clear()

        for item in data.items:
            combo.items.append(
                ComboItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                )
            )

    db.commit()
    db.refresh(combo)

    combo = (
        db.query(Combo)
        .options(joinedload(Combo.items))
        .filter(Combo.id == combo.id)
        .first()
    )

    return serialize_combo(combo)


@router.delete(
    "/{restaurant_id}/{combo_id}",
)
def delete_combo(
    restaurant_id: int,
    combo_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_restaurant_access),
):
    combo = (
        db.query(Combo)
        .filter(
            Combo.id == combo_id,
            Combo.restaurant_id == restaurant_id,
        )
        .first()
    )

    if not combo:
        raise HTTPException(
            status_code=404,
            detail="Combo not found.",
        )

    db.delete(combo)
    db.commit()

    return {
        "message": "Combo deleted successfully.",
        "combo_id": combo_id,
    }