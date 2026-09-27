from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    customer_id: int | None = None
    order_id: int | None = None
    rating: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )
    text: str = Field(
        min_length=1,
        max_length=2000,
    )


class FeedbackResponse(BaseModel):
    id: int
    customer_id: int | None
    order_id: int | None
    rating: int | None
    text: str
    sentiment: str | None
    issue: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }