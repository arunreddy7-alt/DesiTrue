from datetime import datetime

from pydantic import BaseModel, Field


class CouponCreate(BaseModel):
    code: str = Field(
        min_length=2,
        max_length=50,
    )

    discount_type: str = Field(
        description="percentage or fixed"
    )

    discount_value: float = Field(
        gt=0
    )

    minimum_order: float = Field(
        default=0,
        ge=0,
    )

    maximum_discount: float | None = Field(
        default=None,
        gt=0,
    )

    usage_limit: int | None = Field(
        default=None,
        gt=0,
    )

    expires_at: datetime | None = None

    target_segment: str | None = None


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    minimum_order: float
    maximum_discount: float | None
    usage_limit: int | None
    used_count: int
    expires_at: datetime | None
    is_active: bool
    target_segment: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    order_total: float
    customer_id: int | None = None


class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    coupon_code: str | None = None
    discount: float = 0
    final_total: float | None = None