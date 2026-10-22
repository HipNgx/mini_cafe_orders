"""API request and response shapes."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["pending", "preparing", "done"]


class Drink(BaseModel):
    id: int
    name: str
    price: int
    category: Literal["coffee", "tea", "smoothie"]


class OrderItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    drink_id: Annotated[int, Field(strict=True)]
    quantity: Annotated[int, Field(strict=True, ge=1, le=20)]


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_name: Annotated[str, Field(min_length=1, max_length=50)]
    items: Annotated[list[OrderItemCreate], Field(min_length=1)]


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Status


class OrderItem(BaseModel):
    drink_id: int
    name: str
    quantity: int
    unit_price: int


class Order(BaseModel):
    id: int
    customer_name: str
    items: list[OrderItem]
    total: int
    status: Status
    created_at: str
