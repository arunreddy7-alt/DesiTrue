from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.feedback_ai import analyze_feedback
from app.services.feedback_automation import run_feedback_automation
from app.core.database import get_db
from app.models import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse


router = APIRouter(
    prefix="/api/feedback",
    tags=["Feedback"],
)


# =========================================================
# CREATE FEEDBACK
# =========================================================

@router.post("/", response_model=FeedbackResponse)
def create_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
):
    feedback = Feedback(
        customer_id=feedback_data.customer_id,
        order_id=feedback_data.order_id,
        rating=feedback_data.rating,
        text=feedback_data.text,
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback


# =========================================================
# GET ALL FEEDBACK
# =========================================================

@router.get("/", response_model=list[FeedbackResponse])
def get_all_feedback(
    db: Session = Depends(get_db),
):
    feedback = (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return feedback


# =========================================================
# GET SINGLE FEEDBACK
# =========================================================

@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
):
    feedback = (
        db.query(Feedback)
        .filter(Feedback.id == feedback_id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail="Feedback not found.",
        )

    return feedback


# =========================================================
# ANALYZE FEEDBACK + RUN AUTOMATION
# =========================================================

@router.post("/{feedback_id}/analyze")
def analyze_feedback_endpoint(
    feedback_id: int,
    db: Session = Depends(get_db),
):
    feedback = (
        db.query(Feedback)
        .filter(Feedback.id == feedback_id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail="Feedback not found.",
        )

    # ---------------------------------------------------------
    # AI ANALYSIS
    # ---------------------------------------------------------

    analysis = analyze_feedback(
        feedback.text
    )

    feedback.sentiment = analysis["sentiment"]
    feedback.issue = analysis["issue"]

    db.commit()
    db.refresh(feedback)

    # ---------------------------------------------------------
    # AUTOMATION ENGINE
    # ---------------------------------------------------------

    automation = run_feedback_automation(
        feedback=feedback,
        db=db,
    )

    return {
        "feedback": feedback,
        "automation": automation,
    }