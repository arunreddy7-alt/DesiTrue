from sqlalchemy.orm import Session

from app.models import Customer, Order


def update_customer_segment(
    customer: Customer,
    db: Session,
) -> str:
    orders = (
        db.query(Order)
        .filter(
            Order.customer_id == customer.id,
            Order.payment_status == "paid",
        )
        .all()
    )

    order_count = len(orders)

    total_spent = sum(
        (order.total for order in orders),
        start=0,
    )

    if order_count == 0:
        segment = "new_customer"

    elif order_count >= 5 or total_spent >= 2000:
        segment = "high_value_customer"

    elif order_count >= 2:
        segment = "returning_customer"

    else:
        segment = "new_customer"

    customer.segment = segment
    db.commit()
    db.refresh(customer)

    return segment