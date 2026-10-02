from decimal import Decimal

from pydantic import BaseModel, Field


# =========================================================
# ORDER ITEM CREATE
# =========================================================

class OrderItemCreate(BaseModel):
    product_id: int | None = None
    combo_id: int | None = None
    quantity: int = Field(gt=0)


# =========================================================
# ORDER CREATE
# =========================================================
class OrderCreate(BaseModel):
    restaurant_id: int
    customer_id: int | None = None
    coupon_code: str | None = None
    items: list[OrderItemCreate]

# =========================================================
# ORDER ITEM RESPONSE
# =========================================================
class OrderItemResponse(BaseModel):
    product_id: int | None = None
    combo_id: int | None = None
    product_name: str | None = None
    combo_name: str | None = None
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {
        "from_attributes": True
    }


# =========================================================
# ORDER RESPONSE
# =========================================================

class OrderResponse(BaseModel):
    id: int
    restaurant_id: int
    customer_id: int | None
    coupon_id: int | None
    status: str
    subtotal: Decimal
    discount: Decimal
    total: Decimal
    payment_status: str
    items: list[OrderItemResponse]

    model_config = {
        "from_attributes": True
    }


# =========================================================
# CUSTOMER CREATE
# =========================================================

class CustomerCreate(BaseModel):
    name: str | None = None
    phone: str | None = None
    whatsapp_opt_in: bool = False


# =========================================================
# CUSTOMER RESPONSE
# =========================================================

class CustomerResponse(BaseModel):
    id: int
    name: str | None
    phone: str | None
    whatsapp_opt_in: bool
    segment: str

    model_config = {
        "from_attributes": True
    }