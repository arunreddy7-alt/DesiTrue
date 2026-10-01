from decimal import Decimal

from app.services.recommendation_service import (
    get_recommendations,
)


def build_candidate_summary(
    recommendations: dict,
) -> list[dict]:
    candidates = []

    for item in recommendations.get("recommendations", []):
        item_type = item.get("type", "product")

        if item_type == "combo":
            candidates.append(
                {
                    "type": "combo",
                    "id": item["id"],
                    "name": item["name"],
                    "price": item["price"],
                    "regular_total": item.get(
                        "regular_total",
                        item["price"],
                    ),
                    "savings": item.get(
                        "savings",
                        0,
                    ),
                    "items": [
                        {
                            "product_id": combo_item["product_id"],
                            "name": combo_item["name"],
                            "quantity": combo_item["quantity"],
                        }
                        for combo_item in item.get("items", [])
                    ],
                }
            )

        else:
            candidates.append(
                {
                    "type": "product",
                    "id": item["id"],
                    "name": item["name"],
                    "price": item["price"],
                }
            )

    return candidates


def choose_upsell_candidate(
    recommendations: dict,
) -> dict | None:
    candidates = build_candidate_summary(
        recommendations
    )

    if not candidates:
        return None

    # Prefer combos when they provide an actual saving.
    combo_candidates = [
        candidate
        for candidate in candidates
        if candidate["type"] == "combo"
        and candidate.get("savings", 0) > 0
    ]

    if combo_candidates:
        combo_candidates.sort(
            key=lambda candidate: (
                candidate.get("savings", 0),
                -candidate["price"],
            ),
            reverse=True,
        )

        return combo_candidates[0]

    # Otherwise use the first valid recommendation.
    return candidates[0]


def build_upsell_message(
    candidate: dict,
) -> str:
    if candidate["type"] == "combo":
        name = candidate["name"]
        price = candidate["price"]
        savings = candidate.get("savings", 0)

        if savings > 0:
            return (
                f"Want to make that a {name} for "
                f"₹{price}? You save ₹{savings}."
            )

        return (
            f"Would you like to add the {name} "
            f"for ₹{price}?"
        )

    return (
        f"Would you like to add "
        f"{candidate['name']} for "
        f"₹{candidate['price']}?"
    )


def get_ai_upsell(
    restaurant_id: int,
    db,
    cart_product_ids: list[int] | None = None,
    cart_value: Decimal | float = Decimal("0.00"),
) -> dict:

    recommendations = get_recommendations(
        restaurant_id=restaurant_id,
        db=db,
        cart_product_ids=cart_product_ids,
        cart_value=cart_value,
    )

    if not recommendations.get("enabled"):
        return {
            "enabled": False,
            "upsell": None,
        }

    candidate = choose_upsell_candidate(
        recommendations
    )

    if not candidate:
        return {
            "enabled": True,
            "upsell": None,
        }

    return {
        "enabled": True,
        "upsell": {
            "type": candidate["type"],
            "id": candidate["id"],
            "name": candidate["name"],
            "price": candidate["price"],
            "message": build_upsell_message(
                candidate
            ),
            "candidate": candidate,
        },
    }