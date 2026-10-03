"""Discovery: provider search → canonical model → deterministic filter → ranking → UI."""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException

from lib.ranking import rank_explore, rank_stays
from lib.repo import get_trip
from lib.security import current_user
from models.search import ExploreSearchRequest, FlightSearchRequest, StaySearchRequest
from models.trip import ExploreOption, FlightOption, StayOption, User
from providers.base import ProviderError
from providers.registry import explore_provider, flight_provider, provider_mode, stay_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trips", tags=["discovery"])

PROVIDER_DOWN = "We couldn't retrieve options right now. Please try again in a moment."


def _log_provider(kind: str, name: str, started: float, count: int, trip_id: str) -> None:
    logger.info(
        "provider_call kind=%s provider=%s mode=%s trip=%s latency_ms=%s results=%s",
        kind, name, provider_mode(), trip_id, int((time.perf_counter() - started) * 1000), count,
    )


@router.get("/{trip_id}/providers/mode")
async def read_provider_mode(trip_id: str, user: User = Depends(current_user)) -> dict:
    await get_trip(trip_id, user.id)
    return {"mode": provider_mode()}


# ------------------------------------------------------------------- flights

@router.post("/{trip_id}/flights/search", response_model=list[FlightOption])
async def search_flights(
    trip_id: str, payload: FlightSearchRequest, user: User = Depends(current_user)
) -> list[FlightOption]:
    await get_trip(trip_id, user.id)
    provider = flight_provider()
    started = time.perf_counter()
    try:
        options = await provider.search(payload)
    except ProviderError as exc:
        logger.error("provider_error kind=flights trip=%s error=%s", trip_id, exc)
        raise HTTPException(status_code=503, detail=PROVIDER_DOWN) from exc
    _log_provider("flights", provider.name, started, len(options), trip_id)

    if payload.max_stops is not None:
        options = [o for o in options if o.stops <= payload.max_stops]
    if payload.airlines:
        wanted = {a.lower() for a in payload.airlines}
        options = [o for o in options if o.airline.lower() in wanted]
    if payload.max_price is not None:
        options = [o for o in options if o.price <= payload.max_price]

    key = {
        "price": lambda o: o.price,
        "duration": lambda o: o.duration_minutes,
        "departure": lambda o: o.departure_time,
        "stops": lambda o: (o.stops, o.price),
    }[payload.sort_by]
    options.sort(key=key)
    return options


@router.get("/{trip_id}/flights", response_model=list[FlightOption])
async def saved_flights(trip_id: str, user: User = Depends(current_user)) -> list[FlightOption]:
    return (await get_trip(trip_id, user.id)).flights


# ------------------------------------------------------------------- stays

@router.post("/{trip_id}/stays/search", response_model=list[StayOption])
async def search_stays(
    trip_id: str, payload: StaySearchRequest, user: User = Depends(current_user)
) -> list[StayOption]:
    trip = await get_trip(trip_id, user.id)
    provider = stay_provider()
    started = time.perf_counter()
    try:
        options = await provider.search(payload)
    except ProviderError as exc:
        logger.error("provider_error kind=stays trip=%s error=%s", trip_id, exc)
        raise HTTPException(status_code=503, detail=PROVIDER_DOWN) from exc
    _log_provider("stays", provider.name, started, len(options), trip_id)

    if payload.property_types:
        wanted = {p.lower() for p in payload.property_types}
        options = [o for o in options if o.property_type.lower() in wanted]
    if payload.min_rating:
        options = [o for o in options if o.rating >= payload.min_rating]
    if payload.needs_pool:
        options = [o for o in options if any("pool" in a.lower() for a in o.amenities)]
    if payload.near_beach:
        options = [o for o in options if o.distance_to_beach_km <= 2.0]
    if payload.near_center:
        options = [o for o in options if o.distance_to_center_km <= 2.5]
    if payload.amenities:
        wanted = {a.lower() for a in payload.amenities}
        options = [
            o for o in options if wanted.issubset({a.lower() for a in o.amenities})
        ]

    options = rank_stays(
        options,
        nightly_budget=payload.nightly_budget,
        preferences=trip.preferences,
        wants_pool=payload.needs_pool,
        wants_beach=payload.near_beach,
        min_rating=payload.min_rating,
    )
    if payload.sort_by == "price_low":
        options.sort(key=lambda o: o.price_per_night)
    elif payload.sort_by == "price_high":
        options.sort(key=lambda o: -o.price_per_night)
    elif payload.sort_by == "rating":
        options.sort(key=lambda o: -o.rating)
    return options


@router.get("/{trip_id}/stays", response_model=list[StayOption])
async def saved_stays(trip_id: str, user: User = Depends(current_user)) -> list[StayOption]:
    return (await get_trip(trip_id, user.id)).stays


# ------------------------------------------------------------------- explore

@router.post("/{trip_id}/explore/search", response_model=list[ExploreOption])
async def search_explore(
    trip_id: str, payload: ExploreSearchRequest, user: User = Depends(current_user)
) -> list[ExploreOption]:
    trip = await get_trip(trip_id, user.id)
    provider = explore_provider()
    started = time.perf_counter()
    try:
        options = await provider.search(payload)
    except ProviderError as exc:
        logger.error("provider_error kind=explore trip=%s error=%s", trip_id, exc)
        raise HTTPException(status_code=503, detail=PROVIDER_DOWN) from exc
    _log_provider("explore", provider.name, started, len(options), trip_id)

    if payload.query:
        needle = payload.query.strip().lower()
        options = [
            o for o in options
            if needle in o.name.lower()
            or needle in o.type.lower()
            or any(needle in tag.lower() for tag in o.tags)
        ]
    if payload.max_cost is not None:
        options = [o for o in options if o.estimated_cost <= payload.max_cost]
    if payload.min_rating:
        options = [o for o in options if o.rating >= payload.min_rating]

    options = rank_explore(options, trip.preferences)
    if payload.sort_by == "rating":
        options.sort(key=lambda o: -o.rating)
    elif payload.sort_by == "cost_low":
        options.sort(key=lambda o: o.estimated_cost)
    elif payload.sort_by == "cost_high":
        options.sort(key=lambda o: -o.estimated_cost)
    return options


@router.get("/{trip_id}/explore", response_model=list[ExploreOption])
async def saved_explore(trip_id: str, user: User = Depends(current_user)) -> list[ExploreOption]:
    return (await get_trip(trip_id, user.id)).explore_items
