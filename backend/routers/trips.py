"""Trip CRUD, itinerary items, saved provider options and the deterministic budget."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from lib.budget import compute_budget
from lib.db import db
from lib.planner import (
    cities_from_itinerary,
    end_date_for,
    normalise_itinerary,
    resolve_start_date,
    split_cities,
)
from lib.repo import cover_image_for, get_trip, save_trip
from lib.security import current_user
from models.trip import (
    BudgetBreakdown,
    ExploreOption,
    FlightOption,
    ItineraryItemCreate,
    ItineraryItemUpdate,
    StayOption,
    TimeSlot,
    Trip,
    TripCreate,
    TripDay,
    TripSummary,
    TripUpdate,
    User,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trips", tags=["trips"])


def _summary(trip: Trip) -> TripSummary:
    return TripSummary(
        id=trip.id,
        title=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        duration_days=trip.duration_days,
        budget_amount=trip.budget_amount,
        currency=trip.currency,
        travelers=trip.travelers,
        cities=trip.cities,
        itinerary_source=trip.itinerary_source,
        estimated_cost=compute_budget(trip).total,
        cover_image=cover_image_for(trip),
        created_at=trip.created_at,
    )


@router.post("", response_model=Trip, status_code=201)
async def create_trip(payload: TripCreate, user: User = Depends(current_user)) -> Trip:
    start = resolve_start_date(payload.start_date)
    trip = Trip(
        user_id=user.id,
        title=payload.title or f"{payload.duration_days} Days in {payload.destination.title()}",
        destination=payload.destination.strip(),
        origin=payload.origin.strip(),
        start_date=start,
        end_date=end_date_for(start, payload.duration_days),
        duration_days=payload.duration_days,
        budget_amount=payload.budget_amount,
        currency=payload.currency or "INR",
        travelers=payload.travelers,
        cabin_class=payload.cabin_class,
        travel_style=payload.travel_style,
        preferences={k: max(0.0, min(1.0, v)) for k, v in payload.preferences.items()},
        cities=split_cities(payload.destination, payload.duration_days),
        raw_prompt=payload.raw_prompt,
    )
    await save_trip(trip)
    logger.info("trip_created trip=%s user=%s", trip.id, user.id)
    return trip


@router.get("", response_model=list[TripSummary])
async def list_trips(user: User = Depends(current_user)) -> list[TripSummary]:
    docs = await db.trips.find({"user_id": user.id}).sort("created_at", -1).to_list(200)
    return [_summary(Trip(**{k: v for k, v in doc.items() if k != "_id"})) for doc in docs]


@router.get("/{trip_id}", response_model=Trip)
async def read_trip(trip_id: str, user: User = Depends(current_user)) -> Trip:
    return await get_trip(trip_id, user.id)


@router.put("/{trip_id}", response_model=Trip)
async def update_trip(
    trip_id: str, payload: TripUpdate, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    data = payload.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(trip, field, value)
    if "start_date" in data:
        trip.start_date = resolve_start_date(data["start_date"])
    if "duration_days" in data or "start_date" in data:
        trip.end_date = end_date_for(trip.start_date, trip.duration_days)
        trip.itinerary = normalise_itinerary(trip.itinerary[: trip.duration_days], trip.start_date)
        if trip.itinerary:
            trip.cities = cities_from_itinerary(trip.itinerary)
        else:
            trip.cities = split_cities(trip.destination, trip.duration_days)
    if "destination" in data and not trip.itinerary:
        trip.cities = split_cities(trip.destination, trip.duration_days)
    return await save_trip(trip)


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: str, user: User = Depends(current_user)) -> None:
    await get_trip(trip_id, user.id)
    await db.trips.delete_one({"id": trip_id, "user_id": user.id})


@router.get("/{trip_id}/budget", response_model=BudgetBreakdown)
async def trip_budget(trip_id: str, user: User = Depends(current_user)) -> BudgetBreakdown:
    return compute_budget(await get_trip(trip_id, user.id))


# ------------------------------------------------------------------ itinerary

@router.get("/{trip_id}/itinerary", response_model=list[TripDay])
async def read_itinerary(trip_id: str, user: User = Depends(current_user)) -> list[TripDay]:
    return (await get_trip(trip_id, user.id)).itinerary


@router.post("/{trip_id}/itinerary/items", response_model=Trip, status_code=201)
async def add_itinerary_item(
    trip_id: str, payload: ItineraryItemCreate, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    day = next((d for d in trip.itinerary if d.day_number == payload.day_number), None)
    if day is None:
        raise HTTPException(status_code=404, detail=f"Day {payload.day_number} is not in this trip")
    day.slots.append(
        TimeSlot(
            start_time=payload.start_time,
            end_time=payload.end_time,
            title=payload.title.strip(),
            location=payload.location.strip() or day.city,
            category=payload.category,
            notes=payload.notes,
            estimated_cost=payload.estimated_cost,
            booking_url=payload.booking_url,
            provider=payload.provider,
            source=payload.source,
        )
    )
    trip.itinerary = normalise_itinerary(trip.itinerary, trip.start_date)
    return await save_trip(trip)


@router.put("/{trip_id}/itinerary/items/{item_id}", response_model=Trip)
async def update_itinerary_item(
    trip_id: str, item_id: str, payload: ItineraryItemUpdate, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    data = payload.model_dump(exclude_none=True)
    target_day = data.pop("day_number", None)

    found: TimeSlot | None = None
    for day in trip.itinerary:
        for slot in day.slots:
            if slot.id == item_id:
                found = slot
                for field, value in data.items():
                    setattr(slot, field, value)
                if target_day is not None and target_day != day.day_number:
                    new_day = next(
                        (d for d in trip.itinerary if d.day_number == target_day), None
                    )
                    if new_day is None:
                        raise HTTPException(status_code=404, detail="Target day is not in this trip")
                    day.slots.remove(slot)
                    new_day.slots.append(slot)
                break
        if found:
            break
    if not found:
        raise HTTPException(status_code=404, detail="Itinerary item not found")

    trip.itinerary = normalise_itinerary(trip.itinerary, trip.start_date)
    return await save_trip(trip)


@router.delete("/{trip_id}/itinerary/items/{item_id}", response_model=Trip)
async def delete_itinerary_item(
    trip_id: str, item_id: str, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    removed = False
    for day in trip.itinerary:
        before = len(day.slots)
        day.slots = [slot for slot in day.slots if slot.id != item_id]
        removed = removed or len(day.slots) != before
    if not removed:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    return await save_trip(trip)


# ------------------------------------------------------------------ saved provider options

@router.post("/{trip_id}/flights", response_model=Trip, status_code=201)
async def save_flight(
    trip_id: str, option: FlightOption, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    if any(f.id == option.id for f in trip.flights):
        return trip
    trip.flights.append(option)
    return await save_trip(trip)


@router.delete("/{trip_id}/flights/{option_id}", response_model=Trip)
async def remove_flight(
    trip_id: str, option_id: str, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    trip.flights = [f for f in trip.flights if f.id != option_id]
    return await save_trip(trip)


@router.post("/{trip_id}/stays", response_model=Trip, status_code=201)
async def save_stay(trip_id: str, option: StayOption, user: User = Depends(current_user)) -> Trip:
    trip = await get_trip(trip_id, user.id)
    if any(s.id == option.id for s in trip.stays):
        return trip
    trip.stays.append(option)
    return await save_trip(trip)


@router.delete("/{trip_id}/stays/{option_id}", response_model=Trip)
async def remove_stay(trip_id: str, option_id: str, user: User = Depends(current_user)) -> Trip:
    trip = await get_trip(trip_id, user.id)
    trip.stays = [s for s in trip.stays if s.id != option_id]
    return await save_trip(trip)


@router.post("/{trip_id}/explore", response_model=Trip, status_code=201)
async def save_explore_item(
    trip_id: str, option: ExploreOption, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    if any(e.id == option.id for e in trip.explore_items):
        return trip
    trip.explore_items.append(option)
    return await save_trip(trip)


@router.delete("/{trip_id}/explore/{option_id}", response_model=Trip)
async def remove_explore_item(
    trip_id: str, option_id: str, user: User = Depends(current_user)
) -> Trip:
    trip = await get_trip(trip_id, user.id)
    trip.explore_items = [e for e in trip.explore_items if e.id != option_id]
    return await save_trip(trip)
