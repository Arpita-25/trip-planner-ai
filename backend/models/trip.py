"""Canonical domain models. Every TS interface in frontend/src/lib/types.ts mirrors one of these."""

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------- users / auth

class User(BaseModel):
    id: str = Field(default_factory=_uuid)
    email: str
    name: str
    created_at: datetime = Field(default_factory=_now)


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# ---------------------------------------------------------------- itinerary

InterestKey = Literal["beaches", "nightlife", "food", "activities", "culture", "shopping", "nature"]
SlotCategory = Literal["food", "nightlife", "activities", "places", "transport", "stay", "shopping"]


class Coordinates(BaseModel):
    lat: float
    lng: float


class TimeSlot(BaseModel):
    id: str = Field(default_factory=_uuid)
    start_time: str                      # "09:30"
    end_time: str                        # "12:00"
    title: str
    location: str = ""
    category: SlotCategory = "activities"
    notes: str = ""
    estimated_cost: float = 0.0
    duration_minutes: int = 0
    coordinates: Optional[Coordinates] = None
    booking_url: Optional[str] = None
    provider: Optional[str] = None
    source: Literal["ai", "user", "explore"] = "ai"


class TripDay(BaseModel):
    id: str = Field(default_factory=_uuid)
    day_number: int
    date: str                            # ISO date, computed server-side
    city: str
    summary: str = ""
    slots: list[TimeSlot] = Field(default_factory=list)


# ---------------------------------------------------------------- providers

class FlightOption(BaseModel):
    id: str = Field(default_factory=_uuid)
    airline: str
    airline_code: str
    flight_number: str
    departure_airport: str
    departure_city: str
    arrival_airport: str
    arrival_city: str
    departure_time: str                  # ISO datetime string
    arrival_time: str
    duration_minutes: int
    stops: int
    cabin_class: str
    price: float
    currency: str
    baggage: str
    provider: str
    provider_mode: Literal["mock", "real"]
    booking_url: str


class StayOption(BaseModel):
    id: str = Field(default_factory=_uuid)
    name: str
    city: str
    location: str
    property_type: str
    price_per_night: float
    total_price: float
    nights: int
    currency: str
    rating: float
    reviews: int
    amenities: list[str] = Field(default_factory=list)
    room_type: str
    images: list[str] = Field(default_factory=list)
    cancellation_policy: str
    distance_to_beach_km: float
    distance_to_center_km: float
    distance_to_nightlife_km: float
    coordinates: Optional[Coordinates] = None
    provider: str
    provider_mode: Literal["mock", "real"]
    booking_url: str
    # deterministic ranking output, filled by lib/ranking.py
    match_score: int = 0
    match_reasons: list[str] = Field(default_factory=list)


class ExploreOption(BaseModel):
    id: str = Field(default_factory=_uuid)
    name: str
    category: Literal["food", "nightlife", "activities", "places"]
    type: str
    description: str
    city: str
    location: str
    coordinates: Optional[Coordinates] = None
    rating: float
    reviews: int
    estimated_cost: float
    currency: str
    duration_minutes: int
    images: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    provider: str
    provider_mode: Literal["mock", "real"]
    provider_url: str
    match_score: int = 0
    match_reasons: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------- trip aggregate

class CityStay(BaseModel):
    name: str
    days: int


class Trip(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    title: str
    destination: str
    origin: str = ""
    start_date: str
    end_date: str
    duration_days: int
    budget_amount: float
    currency: str = "INR"
    travelers: int = 1
    cabin_class: str = "economy"
    travel_style: str = ""
    preferences: dict[str, float] = Field(default_factory=dict)
    cities: list[CityStay] = Field(default_factory=list)
    itinerary: list[TripDay] = Field(default_factory=list)
    flights: list[FlightOption] = Field(default_factory=list)
    stays: list[StayOption] = Field(default_factory=list)
    explore_items: list[ExploreOption] = Field(default_factory=list)
    raw_prompt: str = ""
    itinerary_source: Literal["none", "ai", "fallback"] = "none"
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class TripCreate(BaseModel):
    title: Optional[str] = None
    destination: str = Field(min_length=1, max_length=120)
    origin: str = ""
    start_date: Optional[str] = None
    duration_days: int = Field(default=5, ge=1, le=30)
    budget_amount: float = Field(default=100000, ge=0, le=100_000_000)
    currency: str = "INR"
    travelers: int = Field(default=1, ge=1, le=20)
    cabin_class: str = "economy"
    travel_style: str = ""
    preferences: dict[str, float] = Field(default_factory=dict)
    raw_prompt: str = ""


class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    origin: Optional[str] = None
    start_date: Optional[str] = None
    duration_days: Optional[int] = Field(default=None, ge=1, le=30)
    budget_amount: Optional[float] = Field(default=None, ge=0, le=100_000_000)
    travelers: Optional[int] = Field(default=None, ge=1, le=20)
    cabin_class: Optional[str] = None
    travel_style: Optional[str] = None
    preferences: Optional[dict[str, float]] = None


class TripSummary(BaseModel):
    """Light projection for the /trips list — no itinerary payload."""
    id: str
    title: str
    destination: str
    start_date: str
    end_date: str
    duration_days: int
    budget_amount: float
    currency: str
    travelers: int
    cities: list[CityStay]
    itinerary_source: str
    estimated_cost: float
    cover_image: str
    created_at: datetime


# ---------------------------------------------------------------- budget

class BudgetLine(BaseModel):
    category: str
    label: str
    amount: float


class BudgetBreakdown(BaseModel):
    currency: str
    lines: list[BudgetLine]
    total: float
    budget: float
    remaining: float
    per_traveler: float
    over_budget: bool
    utilisation_percent: int


# ---------------------------------------------------------------- AI contracts

class TripIntent(BaseModel):
    """Validated structured output of the LLM's preference-extraction step."""
    destination: str = Field(min_length=1, max_length=120)
    origin: str = ""
    duration_days: int = Field(ge=1, le=30)
    budget_amount: float = Field(ge=0, le=100_000_000)
    currency: str = "INR"
    travelers: int = Field(default=1, ge=1, le=20)
    travel_style: str = ""
    title: str = ""
    interests: dict[str, float] = Field(default_factory=dict)


class PlanPromptRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class AiMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class AiMessageResponse(BaseModel):
    reply: str
    budget: BudgetBreakdown


class ItineraryItemCreate(BaseModel):
    day_number: int = Field(ge=1, le=30)
    start_time: str = "10:00"
    end_time: str = "12:00"
    title: str = Field(min_length=1, max_length=160)
    location: str = ""
    category: SlotCategory = "activities"
    notes: str = ""
    estimated_cost: float = Field(default=0, ge=0)
    booking_url: Optional[str] = None
    provider: Optional[str] = None
    source: Literal["ai", "user", "explore"] = "user"


class ItineraryItemUpdate(BaseModel):
    day_number: Optional[int] = Field(default=None, ge=1, le=30)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    category: Optional[SlotCategory] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = Field(default=None, ge=0)


# ---------------------------------------------------------------- map view

MapPointKind = Literal["stay", "beach", "nightlife", "food", "activity", "place"]


class MapPoint(BaseModel):
    id: str
    name: str
    kind: MapPointKind
    type_label: str
    coordinates: Coordinates
    location: str = ""
    rating: float = 0.0
    estimated_cost: float = 0.0
    currency: str = "INR"
    distance_km: float = 0.0
    walk_minutes: int = 0
    saved: bool = False
    in_itinerary: bool = False
    provider_url: str = ""


class MapAnchor(BaseModel):
    """What distances are measured from — a saved stay, or the city centre as a fallback."""
    id: str
    name: str
    kind: Literal["stay", "city"]
    coordinates: Coordinates


class MapViewResponse(BaseModel):
    city: str
    center: Coordinates
    anchor: MapAnchor
    anchor_options: list[MapAnchor]
    points: list[MapPoint]


class MapsConfig(BaseModel):
    configured: bool
    maps_api_key: str
    map_id: str
