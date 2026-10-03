"""Search request contracts shared by routers and provider adapters."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class FlightSearchRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=80)
    destination: str = Field(min_length=2, max_length=80)
    departure_date: str = Field(min_length=8, max_length=10)
    return_date: Optional[str] = None
    travelers: int = Field(default=1, ge=1, le=20)
    cabin_class: Literal["economy", "premium_economy", "business", "first"] = "economy"
    trip_type: Literal["one_way", "round_trip"] = "round_trip"
    max_stops: Optional[int] = Field(default=None, ge=0, le=3)
    airlines: list[str] = Field(default_factory=list)
    max_price: Optional[float] = Field(default=None, ge=0)
    sort_by: Literal["price", "duration", "departure", "stops"] = "price"


class StaySearchRequest(BaseModel):
    city: str = Field(min_length=2, max_length=80)
    check_in: str = Field(min_length=8, max_length=10)
    check_out: str = Field(min_length=8, max_length=10)
    guests: int = Field(default=1, ge=1, le=20)
    rooms: int = Field(default=1, ge=1, le=10)
    nightly_budget: Optional[float] = Field(default=None, ge=0)
    property_types: list[str] = Field(default_factory=list)
    needs_pool: bool = False
    near_beach: bool = False
    near_center: bool = False
    min_rating: float = Field(default=0, ge=0, le=5)
    amenities: list[str] = Field(default_factory=list)
    sort_by: Literal["match", "price_low", "price_high", "rating"] = "match"


class ExploreSearchRequest(BaseModel):
    city: str = Field(min_length=2, max_length=80)
    category: Literal["all", "food", "nightlife", "activities", "places"] = "all"
    query: str = ""
    max_cost: Optional[float] = Field(default=None, ge=0)
    min_rating: float = Field(default=0, ge=0, le=5)
    sort_by: Literal["match", "rating", "cost_low", "cost_high"] = "match"
