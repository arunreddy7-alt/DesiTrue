from datetime import datetime

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    title: str = Field(
        min_length=2,
        max_length=200,
    )

    message: str = Field(
        min_length=2,
    )

    target_segment: str | None = None

    coupon_id: int | None = None

    status: str = Field(
        default="draft",
    )

    scheduled_at: datetime | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    message: str | None = Field(
        default=None,
        min_length=2,
    )

    target_segment: str | None = None

    coupon_id: int | None = None

    status: str | None = None

    scheduled_at: datetime | None = None


class CampaignResponse(BaseModel):
    id: int
    name: str
    title: str
    message: str
    target_segment: str | None
    coupon_id: int | None
    status: str
    scheduled_at: datetime | None

    image_url: str | None

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }