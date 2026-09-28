from sqlalchemy.orm import Session

from app.models import Customer, Feedback, WhatsAppMessage


def run_feedback_automation(
    feedback: Feedback,
    db: Session,
) -> dict:
    """
    Runs deterministic automation after AI feedback analysis.

    AI understands the feedback.
    This service decides and executes the business action.
    """

    # =========================================================
    # BASIC VALIDATION
    # =========================================================

    if not feedback.sentiment:
        return {
            "status": "skipped",
            "reason": "Feedback has not been analyzed yet.",
        }

    if not feedback.customer_id:
        return {
            "status": "skipped",
            "reason": "Feedback has no customer associated with it.",
        }

    # ---------------------------------------------------------
    # FIND CUSTOMER
    # ---------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(Customer.id == feedback.customer_id)
        .first()
    )

    if not customer:
        return {
            "status": "skipped",
            "reason": "Customer not found.",
        }

    # ---------------------------------------------------------
    # CHECK PHONE
    # ---------------------------------------------------------

    if not customer.phone:
        return {
            "status": "skipped",
            "reason": "Customer has no phone number.",
        }

    # ---------------------------------------------------------
    # CHECK WHATSAPP OPT-IN
    # ---------------------------------------------------------

    if not customer.whatsapp_opt_in:
        return {
            "status": "skipped",
            "reason": "Customer has not opted in to WhatsApp.",
        }

    # =========================================================
    # DUPLICATE PROTECTION
    # =========================================================

    existing_message = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.customer_id == customer.id,
            WhatsAppMessage.message_type == "feedback_automation",
            WhatsAppMessage.message.contains(
                f"Feedback #{feedback.id}"
            ),
        )
        .first()
    )

    if existing_message:
        return {
            "status": "skipped",
            "reason": "Automation already executed for this feedback.",
            "message_id": existing_message.id,
        }

    # =========================================================
    # DECISION ENGINE
    # =========================================================

    sentiment = (
        feedback.sentiment
        .lower()
        .strip()
    )

    # ---------------------------------------------------------
    # POSITIVE FEEDBACK
    # ---------------------------------------------------------

    if sentiment == "positive":

        action = "positive_feedback_thank_you"

        message = (
            f"💛 DesiTrue\n\n"
            f"Thanks for the amazing feedback, "
            f"{customer.name or 'there'}!\n\n"
            f"We're really happy you enjoyed your order. "
            f"We hope to serve you again soon! 🍔🔥\n\n"
            f"Feedback #{feedback.id}"
        )

    # ---------------------------------------------------------
    # NEGATIVE FEEDBACK
    # ---------------------------------------------------------

    elif sentiment == "negative":

        action = "negative_feedback_recovery"

        issue_text = (
            feedback.issue
            or "your recent experience"
        )

        message = (
            f"💛 DesiTrue\n\n"
            f"We're sorry your experience wasn't what "
            f"you expected, {customer.name or 'there'}.\n\n"
            f"We've noted your feedback about: "
            f"{issue_text}.\n\n"
            f"Thank you for telling us. Your feedback "
            f"helps us improve our service. 🙏\n\n"
            f"Feedback #{feedback.id}"
        )

    # ---------------------------------------------------------
    # NEUTRAL / OTHER FEEDBACK
    # ---------------------------------------------------------

    else:

        action = "neutral_feedback_acknowledgement"

        message = (
            f"💛 DesiTrue\n\n"
            f"Thanks for sharing your feedback, "
            f"{customer.name or 'there'}!\n\n"
            f"We've recorded your experience and will "
            f"use it to keep improving. 🙌\n\n"
            f"Feedback #{feedback.id}"
        )

    # =========================================================
    # CREATE WHATSAPP MESSAGE
    # =========================================================

    whatsapp_message = WhatsAppMessage(
        customer_id=customer.id,
        order_id=feedback.order_id,
        phone=customer.phone,
        message_type="feedback_automation",
        message=message,
        status="sent",
    )

    db.add(whatsapp_message)
    db.commit()
    db.refresh(whatsapp_message)

    # =========================================================
    # RETURN AUTOMATION RESULT
    # =========================================================

    return {
        "status": "completed",
        "action": action,
        "feedback_id": feedback.id,
        "customer_id": customer.id,
        "message_id": whatsapp_message.id,
        "message": message,
    }