from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Order,
    OrderItem,
    Product,
    RecommendationConfig,
)
from app.models import (
    Combo,
    ComboItem,
    Order,
    OrderItem,
    Product,
    RecommendationConfig,
)


# =========================================================
# HELPERS
# =========================================================

def get_config(
    restaurant_id: int,
    db: Session,
) -> RecommendationConfig:
    config = (
        db.query(RecommendationConfig)
        .filter(
            RecommendationConfig.restaurant_id == restaurant_id
        )
        .first()
    )

    if not config:
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


def serialize_product(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "image_url": product.image_url,
        "category_id": product.category_id,
        "is_available": product.is_available,
    }

def serialize_combo(
    combo: Combo,
    db: Session,
) -> dict:
    items = (
        db.query(ComboItem, Product)
        .join(
            Product,
            Product.id == ComboItem.product_id,
        )
        .filter(
            ComboItem.combo_id == combo.id,
            Product.restaurant_id == combo.restaurant_id,
        )
        .all()
    )

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
                "unit_price": float(unit_price),
                "total": float(item_total),
            }
        )

    combo_price = Decimal(str(combo.price))

    savings = regular_total - combo_price

    if savings < 0:
        savings = Decimal("0.00")

    return {
        "id": combo.id,
        "name": combo.name,
        "description": combo.description,
        "price": float(combo_price),
        "image_url": combo.image_url,
        "is_active": combo.is_active,
        "regular_total": float(regular_total),
        "savings": float(savings),
        "items": serialized_items,
        "type": "combo",
    }

# =========================================================
# POPULAR PRODUCTS
# =========================================================

def get_popular_products(
    restaurant_id: int,
    db: Session,
    excluded_product_ids: set[int] | None = None,
    limit: int = 4,
) -> list[Product]:

    excluded_product_ids = excluded_product_ids or set()

    query = (
        db.query(
            Product,
            func.sum(OrderItem.quantity).label("total_quantity"),
        )
        .join(
            OrderItem,
            OrderItem.product_id == Product.id,
        )
        .join(
            Order,
            Order.id == OrderItem.order_id,
        )
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status == "delivered",
            Product.restaurant_id == restaurant_id,
            Product.is_available.is_(True),
        )
        .group_by(Product.id)
        .order_by(
            func.sum(OrderItem.quantity).desc()
        )
    )

    products = []

    for product, _ in query.all():

        if product.id in excluded_product_ids:
            continue

        products.append(product)

        if len(products) >= limit:
            break

    return products


# =========================================================
# FREQUENTLY BOUGHT TOGETHER
# =========================================================

def get_frequently_bought_together(
    restaurant_id: int,
    cart_product_ids: set[int],
    db: Session,
    limit: int = 4,
) -> list[Product]:

    if not cart_product_ids:
        return []

    matching_order_ids = (
        db.query(OrderItem.order_id)
        .join(
            Order,
            Order.id == OrderItem.order_id,
        )
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status == "delivered",
            OrderItem.product_id.in_(cart_product_ids),
        )
        .distinct()
        .subquery()
    )

    paired_products = (
        db.query(
            Product,
            func.sum(OrderItem.quantity).label(
                "pair_quantity"
            ),
        )
        .join(
            OrderItem,
            OrderItem.product_id == Product.id,
        )
        .filter(
            OrderItem.order_id.in_(
                db.query(matching_order_ids.c.order_id)
            ),
            Product.restaurant_id == restaurant_id,
            Product.is_available.is_(True),
            ~Product.id.in_(cart_product_ids),
        )
        .group_by(Product.id)
        .order_by(
            func.sum(OrderItem.quantity).desc()
        )
        .limit(limit)
        .all()
    )

    return [
        product
        for product, _ in paired_products
    ]


# =========================================================
# COMPLEMENTARY PRODUCTS
# =========================================================

def get_complementary_products(
    restaurant_id: int,
    cart_product_ids: set[int],
    db: Session,
    limit: int = 4,
) -> list[Product]:

    if not cart_product_ids:
        return []

    cart_products = (
        db.query(Product)
        .filter(
            Product.restaurant_id == restaurant_id,
            Product.id.in_(cart_product_ids),
            Product.is_available.is_(True),
        )
        .all()
    )

    if not cart_products:
        return []

    cart_category_ids = {
        product.category_id
        for product in cart_products
        if product.category_id is not None
    }

    query = (
        db.query(Product)
        .filter(
            Product.restaurant_id == restaurant_id,
            Product.is_available.is_(True),
            ~Product.id.in_(cart_product_ids),
        )
    )

    if cart_category_ids:
        query = query.filter(
            ~Product.category_id.in_(cart_category_ids)
        )

    return query.limit(limit).all()


# =========================================================
# AVAILABLE PRODUCT FALLBACK
# =========================================================

def get_available_fallback_products(
    restaurant_id: int,
    cart_product_ids: set[int],
    db: Session,
    limit: int = 4,
) -> list[Product]:

    query = (
        db.query(Product)
        .filter(
            Product.restaurant_id == restaurant_id,
            Product.is_available.is_(True),
            ~Product.id.in_(cart_product_ids),
        )
        .order_by(Product.id.asc())
        .limit(limit)
    )

    return query.all()

def get_available_combos(
    restaurant_id: int,
    cart_product_ids: set[int],
    db: Session,
    limit: int = 2,
) -> list[Combo]:
    combos = (
        db.query(Combo)
        .filter(
            Combo.restaurant_id == restaurant_id,
            Combo.is_active.is_(True),
        )
        .order_by(Combo.id.desc())
        .all()
    )

    recommendations = []

    for combo in combos:
        combo_product_ids = {
            item.product_id
            for item in combo.items
        }

        if not combo_product_ids:
            continue

        # Skip a combo if every product inside it
        # is already in the customer's cart.
        if combo_product_ids.issubset(cart_product_ids):
            continue

        recommendations.append(combo)

        if len(recommendations) >= limit:
            break

    return recommendations

def get_combo_recommendations(
    restaurant_id: int,
    cart_product_ids: list[int] | None,
    db: Session,
    limit: int = 2,
) -> list[dict]:
    cart_ids = set(cart_product_ids or [])

    combos = get_available_combos(
        restaurant_id=restaurant_id,
        cart_product_ids=cart_ids,
        db=db,
        limit=limit,
    )

    return [
        serialize_combo(
            combo=combo,
            db=db,
        )
        for combo in combos
    ]
# =========================================================
# MIXED STRATEGY
# =========================================================

def get_mixed_products(
    restaurant_id: int,
    cart_product_ids: set[int],
    db: Session,
    limit: int = 4,
) -> list[dict]:

    recommendations = []
    seen_product_ids = set(cart_product_ids)
    seen_combo_ids = set()

    # ---------------------------------------------------------
    # 1. Combos
    # ---------------------------------------------------------
    combos = get_available_combos(
        restaurant_id=restaurant_id,
        cart_product_ids=cart_product_ids,
        db=db,
        limit=1,
    )

    # Products already included inside recommended combos.
    combo_product_ids = set()

    for combo in combos:
        recommendations.append(
            serialize_combo(
                combo=combo,
                db=db,
            )
        )

        seen_combo_ids.add(combo.id)

        for item in combo.items:
            combo_product_ids.add(item.product_id)

        if len(recommendations) >= limit:
            return recommendations

    # ---------------------------------------------------------
    # 2. Frequently bought together products
    # ---------------------------------------------------------
    remaining = limit - len(recommendations)

    if remaining > 0:
        paired = get_frequently_bought_together(
            restaurant_id=restaurant_id,
            cart_product_ids=cart_product_ids,
            db=db,
            limit=remaining,
        )

        for product in paired:

            if product.id in seen_product_ids:
                continue

            # Don't recommend a product separately if it is
            # already included in a recommended combo.
            if product.id in combo_product_ids:
                continue

            recommendations.append(
                serialize_product(product)
            )

            seen_product_ids.add(product.id)

            if len(recommendations) >= limit:
                return recommendations

    # ---------------------------------------------------------
    # 3. Complementary products
    # ---------------------------------------------------------
    remaining = limit - len(recommendations)

    if remaining > 0:
        complementary = get_complementary_products(
            restaurant_id=restaurant_id,
            cart_product_ids=cart_product_ids,
            db=db,
            limit=remaining + len(combo_product_ids),
        )

        for product in complementary:

            if product.id in seen_product_ids:
                continue

            if product.id in combo_product_ids:
                continue

            recommendations.append(
                serialize_product(product)
            )

            seen_product_ids.add(product.id)

            if len(recommendations) >= limit:
                return recommendations

    # ---------------------------------------------------------
    # 4. Popular products
    # ---------------------------------------------------------
    remaining = limit - len(recommendations)

    if remaining > 0:
        popular = get_popular_products(
            restaurant_id=restaurant_id,
            db=db,
            excluded_product_ids=(
                seen_product_ids | combo_product_ids
            ),
            limit=remaining,
        )

        for product in popular:

            if product.id in seen_product_ids:
                continue

            if product.id in combo_product_ids:
                continue

            recommendations.append(
                serialize_product(product)
            )

            seen_product_ids.add(product.id)

            if len(recommendations) >= limit:
                return recommendations

    # ---------------------------------------------------------
    # 5. Fallback products
    # ---------------------------------------------------------
    remaining = limit - len(recommendations)

    if remaining > 0:
        fallback = get_available_fallback_products(
            restaurant_id=restaurant_id,
            cart_product_ids=(
                seen_product_ids | combo_product_ids
            ),
            db=db,
            limit=remaining,
        )

        for product in fallback:

            if product.id in seen_product_ids:
                continue

            if product.id in combo_product_ids:
                continue

            recommendations.append(
                serialize_product(product)
            )

            seen_product_ids.add(product.id)

            if len(recommendations) >= limit:
                break

    return recommendations
# =========================================================
# MAIN RECOMMENDATION ENGINE
# =========================================================

def get_recommendations(
    restaurant_id: int,
    db: Session,
    cart_product_ids: list[int] | None = None,
    cart_value: Decimal | float = Decimal("0.00"),
) -> dict:

    cart_product_ids = cart_product_ids or []
    cart_ids = set(cart_product_ids)

    config = get_config(
        restaurant_id=restaurant_id,
        db=db,
    )

    # -----------------------------------------------------
    # RECOMMENDATIONS DISABLED
    # -----------------------------------------------------

    if not config.enabled:
        return {
            "enabled": False,
            "strategy": config.strategy,
            "recommendations": [],
        }

    # -----------------------------------------------------
    # MINIMUM CART VALUE
    # -----------------------------------------------------

    current_cart_value = Decimal(
        str(cart_value)
    )

    minimum_cart_value = Decimal(
        str(config.min_cart_value)
    )

    if current_cart_value < minimum_cart_value:
        return {
            "enabled": True,
            "strategy": config.strategy,
            "recommendations": [],
        }

    limit = config.max_recommendations

    # -----------------------------------------------------
    # POPULAR
    # -----------------------------------------------------

    if config.strategy == "popular":

        products = get_popular_products(
            restaurant_id=restaurant_id,
            db=db,
            excluded_product_ids=cart_ids,
            limit=limit,
        )

        # New restaurant fallback
        if not products:
            products = get_available_fallback_products(
                restaurant_id=restaurant_id,
                cart_product_ids=cart_ids,
                db=db,
                limit=limit,
            )

    # -----------------------------------------------------
    # COMPLEMENTARY
    # -----------------------------------------------------

    elif config.strategy == "complementary":

        products = get_complementary_products(
            restaurant_id=restaurant_id,
            cart_product_ids=cart_ids,
            db=db,
            limit=limit,
        )

        # If no cart or no different category exists,
        # fall back to available products.
        if not products:
            products = get_available_fallback_products(
                restaurant_id=restaurant_id,
                cart_product_ids=cart_ids,
                db=db,
                limit=limit,
            )

    # -----------------------------------------------------
    # AI
    # -----------------------------------------------------

    elif config.strategy == "ai":

        products = get_frequently_bought_together(
            restaurant_id=restaurant_id,
            cart_product_ids=cart_ids,
            db=db,
            limit=limit,
        )

        if not products:

            products = get_popular_products(
                restaurant_id=restaurant_id,
                db=db,
                excluded_product_ids=cart_ids,
                limit=limit,
            )

        if not products:

            products = get_available_fallback_products(
                restaurant_id=restaurant_id,
                cart_product_ids=cart_ids,
                db=db,
                limit=limit,
            )

    # -----------------------------------------------------
    # MIXED
    # -----------------------------------------------------

    else:

        products = get_mixed_products(
            restaurant_id=restaurant_id,
            cart_product_ids=cart_ids,
            db=db,
            limit=limit,
        )

    return {
    "enabled": True,
    "strategy": config.strategy,
    "recommendations": (
        products
        if config.strategy == "mixed"
        else [
            serialize_product(product)
            for product in products
        ]
    ),
}