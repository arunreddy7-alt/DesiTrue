from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Combo, ComboItem, Product


def get_combo_with_products(
    combo_id: int,
    restaurant_id: int,
    db: Session,
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
        return None

    items = (
        db.query(ComboItem, Product)
        .join(
            Product,
            Product.id == ComboItem.product_id,
        )
        .filter(
            ComboItem.combo_id == combo.id,
            Product.restaurant_id == restaurant_id,
        )
        .all()
    )

    return combo, items


def calculate_combo_savings(
    combo: Combo,
    items: list[tuple[ComboItem, Product]],
) -> dict:
    regular_total = Decimal("0.00")

    serialized_items = []

    for combo_item, product in items:
        unit_price = Decimal(str(product.price))
        quantity = combo_item.quantity

        item_total = unit_price * quantity
        regular_total += item_total

        serialized_items.append(
            {
                "product_id": product.id,
                "name": product.name,
                "quantity": quantity,
                "unit_price": unit_price,
                "total": item_total,
            }
        )

    combo_price = Decimal(str(combo.price))

    savings = regular_total - combo_price

    if savings < 0:
        savings = Decimal("0.00")

    return {
        "regular_total": regular_total,
        "combo_price": combo_price,
        "savings": savings,
        "items": serialized_items,
    }


def get_combo_details(
    combo_id: int,
    restaurant_id: int,
    db: Session,
):
    result = get_combo_with_products(
        combo_id=combo_id,
        restaurant_id=restaurant_id,
        db=db,
    )

    if not result:
        return None

    combo, items = result

    pricing = calculate_combo_savings(
        combo=combo,
        items=items,
    )

    return {
        "id": combo.id,
        "restaurant_id": combo.restaurant_id,
        "name": combo.name,
        "description": combo.description,
        "image_url": combo.image_url,
        "price": pricing["combo_price"],
        "regular_total": pricing["regular_total"],
        "savings": pricing["savings"],
        "is_active": combo.is_active,
        "items": pricing["items"],
    }