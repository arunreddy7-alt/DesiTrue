import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.feedback_automation import run_feedback_automation

from app.core.database import get_db
from app.models import Customer, Order, WhatsAppMessage, Feedback
from app.services.feedback_ai import analyze_feedback


router = APIRouter(
    prefix="/api/whatsapp",
    tags=["WhatsApp"],
)


class WhatsAppMessageCreate(BaseModel):
    customer_id: int
    order_id: int
    message: str


# =========================================================
# HELPER: EXTRACT RATING FROM WHATSAPP MESSAGE
# =========================================================

def extract_rating(text: str) -> int | None:
    """
    Extract a customer rating from natural WhatsApp messages.

    Supported examples:

    4/5
    4 out of 5
    4 outta 5
    rate it 4
    rate 4
    rating 4
    i would rate it 4
    i would rate 4
    i would give it 4
    i give it 4
    """

    text_lower = text.lower().strip()

    # -----------------------------------------------------
    # Format 1:
    #
    # 4/5
    # 4 out of 5
    # 4 outta 5
    # -----------------------------------------------------

    rating_match = re.search(
        r"\b([1-5])\s*(?:/|out\s+of|outta)\s*5\b",
        text_lower,
    )

    if rating_match:
        return int(rating_match.group(1))

    # -----------------------------------------------------
    # Format 2:
    #
    # rate it 4
    # rate 4
    # rated it 4
    # rated 4
    # rating 4
    # -----------------------------------------------------

    rating_match = re.search(
        r"\b(?:rate|rated|rating)\s+"
        r"(?:it\s+)?"
        r"(?:is\s+|was\s+)?"
        r"([1-5])\b",
        text_lower,
    )

    if rating_match:
        return int(rating_match.group(1))

    # -----------------------------------------------------
    # Format 3:
    #
    # i would rate it 4
    # i would rate 4
    # i would give it 4
    # i give it 4
    # -----------------------------------------------------

    rating_match = re.search(
        r"\b(?:i\s+)?"
        r"(?:would\s+)?"
        r"(?:rate|give)\s+"
        r"(?:it\s+)?"
        r"(?:a\s+)?"
        r"([1-5])\b",
        text_lower,
    )

    if rating_match:
        return int(rating_match.group(1))

    return None


# =========================================================
# HELPER: REMOVE RATING PHRASE FROM FEEDBACK TEXT
# =========================================================

def clean_feedback_text(text: str) -> str:
    """
    Removes rating phrases from the customer's message
    while keeping the actual feedback text.
    """

    feedback_text = text.strip()

    # -----------------------------------------------------
    # Remove:
    #
    # 4/5
    # 4 out of 5
    # 4 outta 5
    # -----------------------------------------------------

    feedback_text = re.sub(
        r"\b[1-5]\s*(?:/|out\s+of|outta)\s*5\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    # -----------------------------------------------------
    # Remove:
    #
    # i would rate it 4
    # i would rate 4
    # rate it 4
    # rate 4
    # rated it 4
    # rating 4
    # -----------------------------------------------------

    feedback_text = re.sub(
        r"\b(?:i\s+)?(?:would\s+)?"
        r"(?:rate|rated|rating)\s+"
        r"(?:it\s+)?"
        r"(?:is\s+|was\s+)?"
        r"[1-5]\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    # -----------------------------------------------------
    # Remove:
    #
    # i would give it 4
    # i give it 4
    # give it 4
    # -----------------------------------------------------

    feedback_text = re.sub(
        r"\b(?:i\s+)?(?:would\s+)?"
        r"give\s+"
        r"(?:it\s+)?"
        r"(?:a\s+)?"
        r"[1-5]\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    # -----------------------------------------------------
    # Remove common leftover rating phrases
    # -----------------------------------------------------

    feedback_text = re.sub(
        r"\bi\s+would\s+rate\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    feedback_text = re.sub(
        r"\bi'd\s+rate\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    feedback_text = re.sub(
        r"\bi\s+would\s+give\b",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    )

    # -----------------------------------------------------
    # Clean leftover connectors
    # -----------------------------------------------------

    feedback_text = re.sub(
        r"^(and|but|because|so|that|then)\s+",
        "",
        feedback_text,
        flags=re.IGNORECASE,
    ).strip()

    feedback_text = re.sub(
        r"\s+",
        " ",
        feedback_text,
    ).strip()

    return feedback_text


# =========================================================
# HELPER: PROCESS WHATSAPP FEEDBACK
# =========================================================

def process_feedback_message(
    message: WhatsAppMessage,
    db: Session,
):
    """
    Converts a WhatsApp customer reply containing a rating
    into Feedback and runs AI analysis.

    Supports natural rating formats such as:

    4/5
    4 out of 5
    4 outta 5
    rate it 4
    rate 4
    rating 4
    i would rate it 4
    i would give it 4

    Returns None when the message does not contain
    a recognizable rating.
    """

    text = message.message.strip()

    # -----------------------------------------------------
    # Detect rating
    # -----------------------------------------------------

    rating = extract_rating(text)

    if rating is None:
        return None

    # -----------------------------------------------------
    # Check for existing feedback
    # -----------------------------------------------------

    existing_feedback = (
        db.query(Feedback)
        .filter(
            Feedback.order_id == message.order_id,
            Feedback.customer_id == message.customer_id,
        )
        .first()
    )

    if existing_feedback:
        feedback = existing_feedback

    else:
        # -------------------------------------------------
        # Extract feedback text
        # -------------------------------------------------

        feedback_text = clean_feedback_text(text)

        if not feedback_text:
            feedback_text = text

        feedback = Feedback(
            customer_id=message.customer_id,
            order_id=message.order_id,
            rating=rating,
            text=feedback_text,
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

    # -----------------------------------------------------
    # Gemini / local AI analysis
    # -----------------------------------------------------

    if not feedback.sentiment:

        try:
            analysis = analyze_feedback(
                feedback.text
            )

            feedback.sentiment = analysis["sentiment"]
            feedback.issue = analysis["issue"]

            db.commit()
            db.refresh(feedback)
            automation_result = run_feedback_automation(
            feedback=feedback,
            db=db,
                )

        except Exception as error:
            print(
                f"Feedback AI analysis failed: {error}"
            )

            # Feedback itself is already stored.
            # We don't fail the WhatsApp message because
            # AI analysis temporarily failed.

            return {
    "feedback_id": feedback.id,
    "rating": feedback.rating,
    "text": feedback.text,
    "sentiment": feedback.sentiment,
    "issue": feedback.issue,
    "ai_analysis_failed": False,
    "automation": automation_result,
}

    return {
        "feedback_id": feedback.id,
        "rating": feedback.rating,
        "text": feedback.text,
        "sentiment": feedback.sentiment,
        "issue": feedback.issue,
        "ai_analysis_failed": False,
    }


# =========================================================
# GET ALL WHATSAPP MESSAGES
# =========================================================

@router.get("/messages")
def get_whatsapp_messages(
    db: Session = Depends(get_db),
):
    messages = (
        db.query(WhatsAppMessage)
        .order_by(
            WhatsAppMessage.created_at.asc()
        )
        .all()
    )

    return [
        {
            "id": message.id,
            "customer_id": message.customer_id,
            "order_id": message.order_id,
            "phone": message.phone,
            "message_type": message.message_type,
            "message": message.message,
            "status": message.status,
            "created_at": message.created_at,
        }
        for message in messages
    ]


# =========================================================
# GET CUSTOMER MESSAGES
# =========================================================

@router.get("/customers/{customer_id}/messages")
def get_customer_whatsapp_messages(
    customer_id: int,
    db: Session = Depends(get_db),
):
    messages = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.customer_id
            == customer_id
        )
        .order_by(
            WhatsAppMessage.created_at.asc()
        )
        .all()
    )

    return [
        {
            "id": message.id,
            "customer_id": message.customer_id,
            "order_id": message.order_id,
            "phone": message.phone,
            "message_type": message.message_type,
            "message": message.message,
            "status": message.status,
            "created_at": message.created_at,
        }
        for message in messages
    ]


# =========================================================
# GET ORDER MESSAGES
# =========================================================

@router.get("/orders/{order_id}/messages")
def get_order_whatsapp_messages(
    order_id: int,
    db: Session = Depends(get_db),
):
    messages = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.order_id
            == order_id
        )
        .order_by(
            WhatsAppMessage.created_at.asc()
        )
        .all()
    )

    return [
        {
            "id": message.id,
            "customer_id": message.customer_id,
            "order_id": message.order_id,
            "phone": message.phone,
            "message_type": message.message_type,
            "message": message.message,
            "status": message.status,
            "created_at": message.created_at,
        }
        for message in messages
    ]


# =========================================================
# CUSTOMER SENDS WHATSAPP MESSAGE
# =========================================================

@router.post("/messages")
def create_incoming_whatsapp_message(
    message_data: WhatsAppMessageCreate,
    db: Session = Depends(get_db),
):
    """
    Simulates a customer sending a WhatsApp message.

    If the message contains a recognizable rating,
    the feedback pipeline automatically runs.
    """

    customer = (
        db.query(Customer)
        .filter(
            Customer.id
            == message_data.customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    order = (
        db.query(Order)
        .filter(
            Order.id
            == message_data.order_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    if order.customer_id != customer.id:
        raise HTTPException(
            status_code=400,
            detail="Order does not belong to this customer.",
        )

    if not message_data.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # -----------------------------------------------------
    # Store incoming WhatsApp message
    # -----------------------------------------------------

    whatsapp_message = WhatsAppMessage(
        customer_id=customer.id,
        order_id=order.id,
        phone=customer.phone or "",
        message_type="customer_reply",
        message=message_data.message.strip(),
        status="received",
    )

    db.add(whatsapp_message)
    db.commit()
    db.refresh(whatsapp_message)

    # -----------------------------------------------------
    # Automatically process feedback
    # -----------------------------------------------------

    feedback_result = process_feedback_message(
        message=whatsapp_message,
        db=db,
    )

    response = {
        "id": whatsapp_message.id,
        "customer_id": whatsapp_message.customer_id,
        "order_id": whatsapp_message.order_id,
        "phone": whatsapp_message.phone,
        "message_type": whatsapp_message.message_type,
        "message": whatsapp_message.message,
        "status": whatsapp_message.status,
        "created_at": whatsapp_message.created_at,
    }

    # Only include feedback when the message
    # actually looked like feedback.

    if feedback_result is not None:
        response["feedback"] = feedback_result

    return response


# =========================================================
# MANUAL PROCESS ENDPOINT
# =========================================================

@router.post("/messages/{message_id}/process")
def process_whatsapp_feedback(
    message_id: int,
    db: Session = Depends(get_db),
):
    """
    Manually processes a WhatsApp customer reply.

    Kept for testing/debugging.
    Normal simulator messages no longer need this.
    """

    message = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.id
            == message_id
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="WhatsApp message not found.",
        )

    if message.message_type != "customer_reply":
        raise HTTPException(
            status_code=400,
            detail="This message is not a customer reply.",
        )

    result = process_feedback_message(
        message=message,
        db=db,
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No rating detected in this message. "
                "Please include a rating such as "
                "4/5, 4 out of 5, or rate it 4."
            ),
        )

    return {
        "message": (
            "WhatsApp feedback analyzed successfully."
        ),
        "feedback": result,
    }