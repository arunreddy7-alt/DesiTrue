from decimal import Decimal

from pydantic import BaseModel, Field


class ComboItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class ComboItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    model_config = {"from_attributes": True}


class ComboCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    image_url: str | None = None
    price: Decimal = Field(ge=0)
    items: list[ComboItemCreate] = Field(min_length=1)


class ComboUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    image_url: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None
    items: list[ComboItemCreate] | None = None


class ComboResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: str | None
    image_url: str | None
    price: Decimal
    is_active: bool
    items: list[ComboItemResponse]

    model_config = {"from_attributes": True}