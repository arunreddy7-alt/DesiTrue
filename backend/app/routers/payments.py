from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_optional_current_user
from app.models import Coupon, Customer, Order, User
from app.services.customer_segmentation import update_customer_segment


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


@router.post("/{order_id}/simulate")
def simulate_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
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

    # -----------------------------------------------------
    # RESTAURANT ACCESS CHECK FOR AUTHENTICATED USERS
    # -----------------------------------------------------

    if current_user is not None:

        if current_user.role == "OWNER":
            pass

        elif current_user.role == "RESTAURANT_ADMIN":

            if current_user.restaurant_id is None:
                raise HTTPException(
                    status_code=403,
                    detail="Restaurant admin is not assigned to a restaurant.",
                )

            if current_user.restaurant_id != order.restaurant_id:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have access to this restaurant.",
                )

        else:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to process this payment.",
            )

    # -----------------------------------------------------
    # ALREADY PAID
    # -----------------------------------------------------

    if order.payment_status == "paid":
        return {
            "message": "Order is already paid.",
            "order_id": order.id,
            "payment_status": order.payment_status,
        }

    # -----------------------------------------------------
    # PAYMENT
    # -----------------------------------------------------

    order.payment_status = "paid"
    order.status = "confirmed"

    # -----------------------------------------------------
    # COUPON USAGE
    # -----------------------------------------------------

    coupon = None

    if order.coupon_id is not None:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == order.coupon_id)
            .first()
        )

        if coupon:
            coupon.used_count += 1

    # -----------------------------------------------------
    # CUSTOMER SEGMENTATION
    # -----------------------------------------------------

    segment = None

    if order.customer_id is not None:
        customer = (
            db.query(Customer)
            .filter(Customer.id == order.customer_id)
            .first()
        )

        if customer:
            db.flush()

            segment = update_customer_segment(
                customer,
                db,
            )

    db.commit()
    db.refresh(order)

    return {
        "message": "Payment successful.",
        "order_id": order.id,
        "payment_status": order.payment_status,
        "order_status": order.status,
        "customer_segment": segment,
        "coupon_code": coupon.code if coupon else None,
        "coupon_used_count": coupon.used_count if coupon else None,
    }