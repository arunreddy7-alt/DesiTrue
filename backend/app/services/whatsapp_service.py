from datetime import datetime

from sqlalchemy.orm import Session

from app.models import (
    Campaign,
    Customer,
    Order,
    WhatsAppMessage,
)


# =========================================================
# CREATE WHATSAPP MESSAGE
# =========================================================

def create_whatsapp_message(
    db: Session,
    customer: Customer,
    message_type: str,
    message: str,
    order: Order | None = None,
    media_url: str | None = None,
):
    """
    Creates a simulated WhatsApp message.

    Messages are only created when:
    - customer has a phone number
    - customer has opted into WhatsApp
    """

    if not customer.phone:
        return None

    if not customer.whatsapp_opt_in:
        return None

    whatsapp_message = WhatsAppMessage(
        customer_id=customer.id,
        order_id=order.id if order else None,
        phone=customer.phone,
        message_type=message_type,
        message=message,
        status="sent",
        media_url=media_url,
    )

    db.add(whatsapp_message)
    db.flush()

    return whatsapp_message


# =========================================================
# SEND ORDER STATUS WHATSAPP
# =========================================================

def send_order_status_whatsapp(
    db: Session,
    order: Order,
):
    """
    Sends a WhatsApp notification based on the current
    order status.

    Supported statuses:

        confirmed
        preparing
        ready
        delivered
    """

    customer = order.customer

    if not customer:
        return None

    if not customer.phone:
        return None

    if not customer.whatsapp_opt_in:
        return None

    # -----------------------------------------------------
    # Dynamic restaurant name
    # -----------------------------------------------------

    restaurant_name = (
        order.restaurant.name
        if order.restaurant
        else "Food Truck"
    )

    # -----------------------------------------------------
    # Confirmed
    # -----------------------------------------------------

    if order.status == "confirmed":

        message = (
            f"✅ {restaurant_name} — Order #{order.id}\n\n"
            "Your order has been confirmed!\n\n"
            "We'll notify you when it's being prepared."
        )

        return create_whatsapp_message(
            db=db,
            customer=customer,
            order=order,
            message_type="order_confirmed",
            message=message,
        )

    # -----------------------------------------------------
    # Preparing
    # -----------------------------------------------------

    if order.status == "preparing":

        message = (
            f"👨‍🍳 {restaurant_name} — Order #{order.id}\n\n"
            "Your order is now being prepared!\n\n"
            "We'll notify you when it's ready."
        )

        return create_whatsapp_message(
            db=db,
            customer=customer,
            order=order,
            message_type="order_preparing",
            message=message,
        )

    # -----------------------------------------------------
    # Ready
    # -----------------------------------------------------

    if order.status == "ready":

        message = (
            f"🔔 {restaurant_name} — Order #{order.id}\n\n"
            "Your order is ready!\n\n"
            "Please collect your order."
        )

        return create_whatsapp_message(
            db=db,
            customer=customer,
            order=order,
            message_type="order_ready",
            message=message,
        )

    # -----------------------------------------------------
    # Delivered
    # -----------------------------------------------------

    if order.status == "delivered":

        message = (
            f"✅ {restaurant_name} — Order #{order.id}\n\n"
            "Your order has been delivered.\n\n"
            "Enjoy your meal! ❤️"
        )

        return create_whatsapp_message(
            db=db,
            customer=customer,
            order=order,
            message_type="order_delivered",
            message=message,
        )

    return None


# =========================================================
# SEND FEEDBACK REQUEST WHATSAPP
# =========================================================

def send_feedback_request_whatsapp(
    db: Session,
    order: Order,
):
    """
    Sends a WhatsApp feedback request after an order
    has been delivered.
    """

    customer = order.customer

    if not customer:
        return None

    if not customer.phone:
        return None

    if not customer.whatsapp_opt_in:
        return None

    # -----------------------------------------------------
    # Dynamic restaurant name
    # -----------------------------------------------------

    restaurant_name = (
        order.restaurant.name
        if order.restaurant
        else "Food Truck"
    )

    message = (
        f"⭐ {restaurant_name} — Order #{order.id}\n\n"
        "How was your order?\n\n"
        "We'd love to hear about your experience.\n\n"
        "Reply with your rating from 1 to 5 ⭐ "
        "and tell us what you thought."
    )

    return create_whatsapp_message(
        db=db,
        customer=customer,
        order=order,
        message_type="feedback_request",
        message=message,
    )


# =========================================================
# SEND CAMPAIGN WHATSAPP
# =========================================================

def send_campaign_whatsapp(
    db: Session,
    customer: Customer,
    campaign: Campaign,
):
    """
    Sends a campaign message to a customer.

    Campaign messages are not associated with a specific
    order, therefore order_id remains NULL.
    """

    if not customer.phone:
        return None

    if not customer.whatsapp_opt_in:
        return None

    # -----------------------------------------------------
    # Campaign message
    # -----------------------------------------------------

    message = campaign.message

    # -----------------------------------------------------
    # Optional campaign image
    #
    # The Campaign model may contain image_url.
    # getattr keeps this compatible if the field isn't
    # present in an older database/model version.
    # -----------------------------------------------------

    media_url = getattr(
        campaign,
        "image_url",
        None,
    )

    whatsapp_message = create_whatsapp_message(
        db=db,
        customer=customer,
        message_type="campaign",
        message=message,
        order=None,
        media_url=media_url,
    )

    return whatsapp_message