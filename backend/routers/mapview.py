"""Trip map: saved stays + discoverable places for one city, with distances from an anchor.

All distances are computed in Python (lib/geo.py) from stored coordinates — nothing is
geocoded at request time and the LLM is not involved.
"""

import logging
import os

from fastapi import APIRouter, Depends, Query

from lib.catalog import city_data
from lib.geo import haversine_km, walking_minutes
from lib.repo import get_trip
from lib.security import current_user
from models.search import ExploreSearchRequest
from models.trip import (
    Coordinates,
    ExploreOption,
    MapAnchor,
    MapPoint,
    MapsConfig,
    MapViewResponse,
    StayOption,
    Trip,
    User,
)
from providers.registry import explore_provider

logger = logging.getLogger(__name__)
router = APIRouter(tags=["map"])

# Explore categories map onto marker kinds; beaches get their own pin.
_BEACH_HINTS = ("beach", "bay", "sandbar", "cape")


@router.get("/config/maps", response_model=MapsConfig)
async def maps_config(user: User = Depends(current_user)) -> MapsConfig:
    """Served at runtime so the browser key is never baked into the committed bundle."""
    key = os.environ.get("GOOGLE_MAPS_API_KEY", "").strip()
    return MapsConfig(
        configured=bool(key),
        maps_api_key=key,
        map_id=os.environ.get("GOOGLE_MAPS_MAP_ID", "DEMO_MAP_ID").strip() or "DEMO_MAP_ID",
    )


def _kind_for(item: ExploreOption) -> str:
    if item.category == "places":
        name = f"{item.name} {item.type}".lower()
        return "beach" if any(hint in name for hint in _BEACH_HINTS) else "place"
    if item.category == "food":
        return "food"
    if item.category == "nightlife":
        return "nightlife"
    return "activity"


def _stay_anchor(stay: StayOption) -> MapAnchor | None:
    if not stay.coordinates:
        return None
    return MapAnchor(id=stay.id, name=stay.name, kind="stay", coordinates=stay.coordinates)


@router.get("/trips/{trip_id}/map", response_model=MapViewResponse)
async def trip_map(
    trip_id: str,
    city: str | None = Query(default=None),
    anchor_stay_id: str | None = Query(default=None),
    user: User = Depends(current_user),
) -> MapViewResponse:
    trip: Trip = await get_trip(trip_id, user.id)

    cities = [stay.name for stay in trip.cities] or [trip.destination]
    selected_city = city if city in cities else cities[0]
    data = city_data(selected_city)
    center = Coordinates(lat=data["lat"], lng=data["lng"])

    # Anchor candidates: the stays saved for this city, newest first.
    city_stays = [stay for stay in trip.stays if stay.city == selected_city and stay.coordinates]
    anchor_options = [a for a in (_stay_anchor(stay) for stay in city_stays) if a]
    city_anchor = MapAnchor(
        id="city-centre", name=f"{selected_city} centre", kind="city", coordinates=center
    )
    anchor_options.append(city_anchor)

    anchor = next((a for a in anchor_options if a.id == anchor_stay_id), anchor_options[0])

    def point_distance(coords: Coordinates) -> tuple[float, int]:
        km = haversine_km(anchor.coordinates.lat, anchor.coordinates.lng, coords.lat, coords.lng)
        return km, walking_minutes(km)

    itinerary_titles = {
        slot.title.lower()
        for day in trip.itinerary
        if day.city == selected_city
        for slot in day.slots
    }
    saved_explore_ids = {item.id for item in trip.explore_items}

    points: list[MapPoint] = []

    # Saved stays for this city are always on the map.
    for stay in city_stays:
        assert stay.coordinates is not None
        km, walk = point_distance(stay.coordinates)
        points.append(
            MapPoint(
                id=stay.id, name=stay.name, kind="stay", type_label=stay.property_type,
                coordinates=stay.coordinates, location=stay.location, rating=stay.rating,
                estimated_cost=stay.price_per_night, currency=stay.currency,
                distance_km=km, walk_minutes=walk, saved=True,
                provider_url=stay.booking_url,
            )
        )

    # Everything discoverable in the city, plus anything already saved to the trip.
    discovered = await explore_provider().search(
        ExploreSearchRequest(city=selected_city, category="all")
    )
    seen: set[str] = set()
    for item in discovered + [i for i in trip.explore_items if i.city == selected_city]:
        if item.id in seen or not item.coordinates:
            continue
        seen.add(item.id)
        km, walk = point_distance(item.coordinates)
        points.append(
            MapPoint(
                id=item.id, name=item.name, kind=_kind_for(item),  # type: ignore[arg-type]
                type_label=item.type, coordinates=item.coordinates, location=item.location,
                rating=item.rating, estimated_cost=item.estimated_cost, currency=item.currency,
                distance_km=km, walk_minutes=walk,
                saved=item.id in saved_explore_ids,
                in_itinerary=item.name.lower() in itinerary_titles,
                provider_url=item.provider_url,
            )
        )

    points.sort(key=lambda p: (p.kind != "stay", p.distance_km))
    logger.info("trip_map trip=%s city=%s points=%s", trip_id, selected_city, len(points))

    return MapViewResponse(
        city=selected_city,
        center=center,
        anchor=anchor,
        anchor_options=anchor_options,
        points=points,
    )
