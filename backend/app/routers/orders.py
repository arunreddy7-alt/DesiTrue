from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models import Customer, Coupon, Order, OrderItem, Product
from app.schemas.order import OrderCreate, OrderResponse
from app.services.whatsapp_service import (
    send_feedback_request_whatsapp,
    send_order_status_whatsapp,
)


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


# ---------------------------------------------------------
# CREATE ORDER
# ---------------------------------------------------------

@router.post("/", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
):
    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item.",
        )

    if order_data.customer_id is not None:
        customer = (
            db.query(Customer)
            .filter(Customer.id == order_data.customer_id)
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found.",
            )

    subtotal = Decimal("0.00")
    order_items = []

    for item in order_data.items:
        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.is_available == True,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product {item.product_id} "
                    f"not found or unavailable."
                ),
            )

        unit_price = Decimal(str(product.price))
        line_total = unit_price * item.quantity

        subtotal += line_total

        order_items.append(
            {
                "product": product,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    discount = Decimal("0.00")
    coupon_id = None

    if order_data.coupon_code:
        code = order_data.coupon_code.strip().upper()

        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == code)
            .first()
        )

        if not coupon:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon code.",
            )

        if not coupon.is_active:
            raise HTTPException(
                status_code=400,
                detail="This coupon is no longer active.",
            )

        if (
            coupon.expires_at is not None
            and coupon.expires_at < datetime.utcnow()
        ):
            raise HTTPException(
                status_code=400,
                detail="This coupon has expired.",
            )

        if (
            coupon.usage_limit is not None
            and coupon.used_count >= coupon.usage_limit
        ):
            raise HTTPException(
                status_code=400,
                detail="This coupon has reached its usage limit.",
            )

        if subtotal < Decimal(str(coupon.minimum_order)):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Minimum order value is "
                    f"₹{float(coupon.minimum_order):.2f}."
                ),
            )

        if coupon.target_segment:
            if order_data.customer_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="This coupon is available to selected customers only.",
                )
            

            customer = (
                db.query(Customer)
                .filter(Customer.id == order_data.customer_id)
                .first()
            )

            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found.",
                )

            if customer.segment != coupon.target_segment:
                raise HTTPException(
                    status_code=400,
                    detail="You are not eligible for this coupon.",
                )

        if coupon.discount_type == "percentage":
            discount = (
                subtotal
                * Decimal(str(coupon.discount_value))
                / Decimal("100")
            )
        else:
            discount = Decimal(str(coupon.discount_value))

        if coupon.maximum_discount is not None:
            discount = min(
                discount,
                Decimal(str(coupon.maximum_discount)),
            )
        

        discount = min(discount, subtotal)

        coupon_id = coupon.id

    total = subtotal - discount

    order = Order(
        customer_id=order_data.customer_id,
        coupon_id=coupon_id,
        status="pending",
        subtotal=subtotal,
        discount=discount,
        total=total,
        payment_status="pending",
)

    db.add(order)
    db.flush()

    for item in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item["product"].id,
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            line_total=item["line_total"],
        )

        db.add(order_item)

    db.commit()
    db.refresh(order)

    return order


# ---------------------------------------------------------
# GET SINGLE ORDER
# ---------------------------------------------------------

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    return order


# ---------------------------------------------------------
# GET ALL ORDERS
# ---------------------------------------------------------

@router.get("/", response_model=list[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders


# ---------------------------------------------------------
# UPDATE ORDER STATUS
# ---------------------------------------------------------

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    allowed_statuses = {
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid order status. "
                "Allowed statuses: pending, confirmed, "
                "preparing, ready, delivered."
            ),
        )

    order.status = status

    # -----------------------------------------------------
    # WHATSAPP AUTOMATION
    # -----------------------------------------------------

    send_order_status_whatsapp(
        db=db,
        order=order,
    )

    # Delivered triggers the feedback request too
    if status == "delivered":
        send_feedback_request_whatsapp(
            db=db,
            order=order,
        )

    db.commit()
    db.refresh(order)

    return order