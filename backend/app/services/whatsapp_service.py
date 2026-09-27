from sqlalchemy.orm import Session

from app.models import Customer, Order, WhatsAppMessage


def create_whatsapp_message(
    db: Session,
    order: Order,
    message_type: str,
    message: str,
):
    """
    Creates a WhatsApp message in the simulator.

    This does NOT connect to the real WhatsApp API yet.
    It stores the message so our WhatsApp simulator
    can display it later.
    """

    if order.customer_id is None:
        return None

    customer = (
        db.query(Customer)
        .filter(Customer.id == order.customer_id)
        .first()
    )

    if not customer:
        return None

    if not customer.phone:
        return None

    if not customer.whatsapp_opt_in:
        return None

    whatsapp_message = WhatsAppMessage(
        customer_id=customer.id,
        order_id=order.id,
        phone=customer.phone,
        message_type=message_type,
        message=message,
        status="sent",
    )

    db.add(whatsapp_message)
    db.flush()

    return whatsapp_message


def send_order_status_whatsapp(
    db: Session,
    order: Order,
):
    """
    Generates the appropriate WhatsApp message
    based on the current order status.
    """

    if order.status == "confirmed":
        message_type = "order_confirmed"

        message = (
            f"🍔 DesiTrue — Order #{order.id}\n\n"
            f"Your order has been confirmed!\n\n"
            f"We'll let you know when it's ready."
        )

    elif order.status == "preparing":
        message_type = "order_preparing"

        message = (
            f"👨‍🍳 DesiTrue — Order #{order.id}\n\n"
            f"Your order is now being prepared!\n\n"
            f"We'll notify you when it's ready."
        )

    elif order.status == "ready":
        message_type = "order_ready"

        message = (
            f"🔔 DesiTrue — Order #{order.id}\n\n"
            f"Your order is ready!\n\n"
            f"Please collect your order."
        )

    elif order.status == "delivered":
        message_type = "order_delivered"

        message = (
            f"✅ DesiTrue — Order #{order.id}\n\n"
            f"Your order has been delivered.\n\n"
            f"Enjoy your meal! ❤️"
        )

    else:
        return None

    return create_whatsapp_message(
        db=db,
        order=order,
        message_type=message_type,
        message=message,
    )


def send_feedback_request_whatsapp(
    db: Session,
    order: Order,
):
    """
    Sends the WhatsApp feedback request after
    an order is marked as delivered.
    """

    if order.status != "delivered":
        return None

    message = (
        f"⭐ DesiTrue — Order #{order.id}\n\n"
        f"How was your order?\n\n"
        f"We'd love to hear about your experience.\n\n"
        f"Reply with your rating from 1 to 5 ⭐ "
        f"and tell us what you thought."
    )

    return create_whatsapp_message(
        db=db,
        order=order,
        message_type="feedback_request",
        message=message,
    )