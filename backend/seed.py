"""Idempotent seed: a demo account with a complete 7-day Thailand trip.

Run: cd /app/backend && python seed.py
"""

import asyncio

from lib.db import db, ensure_indexes
from lib.planner import build_fallback_itinerary, cities_from_itinerary, end_date_for, resolve_start_date
from lib.security import hash_password
from models.search import ExploreSearchRequest, FlightSearchRequest, StaySearchRequest
from models.trip import CityStay, Trip, User
from providers.mock import MockExploreProvider, MockFlightProvider, MockStayProvider

DEMO_EMAIL = "demo@voyageai.app"
DEMO_PASSWORD = "voyage123"


async def main() -> None:
    await ensure_indexes()

    doc = await db.users.find_one({"email": DEMO_EMAIL})
    if doc:
        user = User(**{k: v for k, v in doc.items() if k not in ("_id", "password_hash")})
    else:
        user = User(email=DEMO_EMAIL, name="Demo Traveller")
        payload = user.model_dump()
        payload["password_hash"] = hash_password(DEMO_PASSWORD)
        await db.users.insert_one(payload)
    print(f"demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

    await db.trips.delete_many({"user_id": user.id, "title": "7 Days in Thailand"})

    start = resolve_start_date(None)
    trip = Trip(
        user_id=user.id,
        title="7 Days in Thailand",
        destination="Thailand",
        origin="Bangalore",
        start_date=start,
        end_date=end_date_for(start, 7),
        duration_days=7,
        budget_amount=120000,
        currency="INR",
        travelers=2,
        travel_style="beaches, beach hopping and nightlife",
        preferences={
            "beaches": 0.95, "nightlife": 0.9, "food": 0.75,
            "activities": 0.4, "culture": 0.3, "shopping": 0.3, "nature": 0.5,
        },
        cities=[CityStay(name="Phuket", days=2), CityStay(name="Krabi", days=2),
                CityStay(name="Bangkok", days=3)],
        raw_prompt=(
            "Plan me a 7-day Thailand trip from Bangalore. I have 1.2 lakh. I want beaches, "
            "beach hopping, good food and nightlife. I don't care much about temples or museums."
        ),
        itinerary_source="fallback",
    )
    trip.itinerary = build_fallback_itinerary(trip)
    trip.cities = cities_from_itinerary(trip.itinerary)

    flights = await MockFlightProvider().search(
        FlightSearchRequest(origin="Bangalore", destination="Phuket",
                            departure_date=trip.start_date, travelers=trip.travelers)
    )
    trip.flights = sorted(flights, key=lambda f: f.price)[:1]

    stays = await MockStayProvider().search(
        StaySearchRequest(city="Phuket", check_in=trip.start_date,
                          check_out=trip.itinerary[1].date, guests=2)
    )
    trip.stays = [s for s in stays if s.property_type in ("Resort", "Villa")][:1]

    explore = await MockExploreProvider().search(
        ExploreSearchRequest(city="Phuket", category="nightlife")
    )
    trip.explore_items = explore[:2]

    await db.trips.replace_one({"id": trip.id}, trip.model_dump(), upsert=True)
    print(f"seeded trip {trip.id}: {trip.title} ({len(trip.itinerary)} days)")


if __name__ == "__main__":
    asyncio.run(main())
