"""Trip persistence + authorization. Routers never touch the collection directly."""

import logging
from datetime import datetime, timezone

from fastapi import HTTPException

from lib.catalog import city_data
from lib.db import db
from models.trip import Trip

logger = logging.getLogger(__name__)


async def get_trip(trip_id: str, user_id: str) -> Trip:
    """Load a trip the caller owns. A trip belonging to someone else is a 404, not a 403."""
    doc = await db.trips.find_one({"id": trip_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**{k: v for k, v in doc.items() if k != "_id"})


async def save_trip(trip: Trip) -> Trip:
    trip.updated_at = datetime.now(timezone.utc)
    await db.trips.replace_one({"id": trip.id}, trip.model_dump(), upsert=True)
    return trip


def cover_image_for(trip: Trip) -> str:
    first_city = trip.cities[0].name if trip.cities else trip.destination
    return city_data(first_city)["image"]
