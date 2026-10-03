"""AI routes. The model parses intent and drafts structure; this module validates,
dates, prices and persists — and degrades to the deterministic planner on failure.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from lib.ai import AiUnavailable, assistant_reply, extract_intent, generate_itinerary, modify_itinerary
from lib.budget import compute_budget
from lib.planner import (
    build_fallback_itinerary,
    cities_from_itinerary,
    end_date_for,
    resolve_start_date,
    split_cities,
)
from lib.repo import get_trip, save_trip
from lib.security import check_ai_rate_limit, current_user
from models.trip import (
    AiMessageRequest,
    AiMessageResponse,
    PlanPromptRequest,
    Trip,
    TripIntent,
    User,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai"])

AI_DOWN = "Our AI planner is unavailable right now. Please try again in a moment."


class TripPlanResponse(BaseModel):
    trip: Trip
    message: str
    source: str          # "ai" when the model drafted it, "fallback" when code did


@router.post("/ai/parse", response_model=TripIntent)
async def parse_prompt(payload: PlanPromptRequest, user: User = Depends(current_user)) -> TripIntent:
    """Natural language -> validated structured preferences (no trip created)."""
    check_ai_rate_limit(user.id)
    try:
        return await extract_intent(payload.prompt)
    except AiUnavailable as exc:
        logger.error("ai_parse unavailable user=%s error=%s", user.id, exc)
        raise HTTPException(status_code=503, detail=AI_DOWN) from exc


@router.post("/ai/trips", response_model=TripPlanResponse, status_code=201)
async def plan_trip_from_prompt(
    payload: PlanPromptRequest, user: User = Depends(current_user)
) -> TripPlanResponse:
    """The headline journey: one sentence in, a saved structured trip + itinerary out."""
    check_ai_rate_limit(user.id)
    try:
        intent = await extract_intent(payload.prompt)
    except AiUnavailable as exc:
        logger.error("ai_trip_intent unavailable user=%s error=%s", user.id, exc)
        raise HTTPException(status_code=503, detail=AI_DOWN) from exc

    start = resolve_start_date(None)
    trip = Trip(
        user_id=user.id,
        title=intent.title or f"{intent.duration_days} Days in {intent.destination.title()}",
        destination=intent.destination,
        origin=intent.origin,
        start_date=start,
        end_date=end_date_for(start, intent.duration_days),
        duration_days=intent.duration_days,
        budget_amount=intent.budget_amount or 100000.0,
        currency=intent.currency or "INR",
        travelers=intent.travelers,
        travel_style=intent.travel_style,
        preferences=intent.interests,
        cities=split_cities(intent.destination, intent.duration_days),
        raw_prompt=payload.prompt,
    )

    trip, message, source = await _apply_generated_itinerary(trip)
    await save_trip(trip)
    logger.info("ai_trip_created trip=%s user=%s source=%s", trip.id, user.id, source)
    return TripPlanResponse(trip=trip, message=message, source=source)


@router.post("/trips/{trip_id}/ai/plan", response_model=TripPlanResponse)
async def plan_itinerary(trip_id: str, user: User = Depends(current_user)) -> TripPlanResponse:
    """Generate or regenerate the itinerary for an existing trip."""
    check_ai_rate_limit(user.id)
    trip = await get_trip(trip_id, user.id)
    trip, message, source = await _apply_generated_itinerary(trip)
    await save_trip(trip)
    return TripPlanResponse(trip=trip, message=message, source=source)


@router.post("/trips/{trip_id}/ai/modify", response_model=TripPlanResponse)
async def modify_trip(
    trip_id: str, payload: AiMessageRequest, user: User = Depends(current_user)
) -> TripPlanResponse:
    """Conversational structural edit — the model rewrites days/slots, code re-dates them."""
    check_ai_rate_limit(user.id)
    trip = await get_trip(trip_id, user.id)
    if not trip.itinerary:
        raise HTTPException(
            status_code=400, detail="Generate an itinerary first, then ask for changes."
        )
    try:
        days, message = await modify_itinerary(trip, payload.message)
    except AiUnavailable as exc:
        logger.error("ai_modify unavailable trip=%s error=%s", trip_id, exc)
        raise HTTPException(status_code=503, detail=AI_DOWN) from exc

    trip.itinerary = days
    trip.duration_days = len(days)
    trip.end_date = end_date_for(trip.start_date, trip.duration_days)
    trip.cities = cities_from_itinerary(days)
    trip.itinerary_source = "ai"
    await save_trip(trip)
    logger.info("ai_modified trip=%s days=%s", trip.id, len(days))
    return TripPlanResponse(trip=trip, message=message, source="ai")


@router.post("/trips/{trip_id}/ai/message", response_model=AiMessageResponse)
async def ai_message(
    trip_id: str, payload: AiMessageRequest, user: User = Depends(current_user)
) -> AiMessageResponse:
    """Trip assistant. Budget numbers come from deterministic code, not the model."""
    check_ai_rate_limit(user.id)
    trip = await get_trip(trip_id, user.id)
    budget = compute_budget(trip)
    try:
        reply = await assistant_reply(trip, budget, payload.message)
    except AiUnavailable as exc:
        logger.error("ai_message unavailable trip=%s error=%s", trip_id, exc)
        raise HTTPException(status_code=503, detail=AI_DOWN) from exc
    return AiMessageResponse(reply=reply, budget=budget)


async def _apply_generated_itinerary(trip: Trip) -> tuple[Trip, str, str]:
    """AI draft if possible, deterministic catalogue plan if not — never an empty trip."""
    try:
        days, message = await generate_itinerary(trip)
        source = "ai"
    except AiUnavailable as exc:
        logger.error("ai_plan fallback trip=%s error=%s", trip.id, exc)
        days = build_fallback_itinerary(trip)
        message = (
            "Our AI planner was unavailable, so we built your itinerary from our "
            "destination guide. Use \"Ask AI to adjust\" to refine it."
        )
        source = "fallback"

    trip.itinerary = days
    trip.duration_days = len(days)
    trip.end_date = end_date_for(trip.start_date, trip.duration_days)
    trip.cities = cities_from_itinerary(days)
    trip.itinerary_source = source  # type: ignore[assignment]
    return trip, message, source
