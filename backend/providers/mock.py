"""Mock provider adapters — labelled development data, switchable via PROVIDER_MODE.

No API is invented here: results carry provider_mode="mock" so the UI can badge them,
and every booking/provider URL is a real public search deep link (the external site owns
checkout, payment and confirmation).
"""

import random
from datetime import date, datetime, timedelta
from urllib.parse import quote_plus

from lib.catalog import CATEGORY_IMAGE, STAY_IMAGES, airport_for, city_data
from models.search import ExploreSearchRequest, FlightSearchRequest, StaySearchRequest
from models.trip import Coordinates, ExploreOption, FlightOption, StayOption
from providers.base import ExploreProvider, FlightProvider, StayProvider

AIRLINES = [
    ("IndiGo", "6E"), ("Air India", "AI"), ("Thai Airways", "TG"), ("Vistara", "UK"),
    ("Singapore Airlines", "SQ"), ("Emirates", "EK"), ("AirAsia", "FD"), ("Malaysia Airlines", "MH"),
]

CABIN_MULTIPLIER = {"economy": 1.0, "premium_economy": 1.45, "business": 2.8, "first": 4.2}

PROPERTY_TYPES = ["Resort", "Hotel", "Villa", "Boutique Hotel", "Hostel", "Apartment"]
ROOM_TYPES = {
    "Resort": "Deluxe Ocean View Room", "Hotel": "Superior Double Room",
    "Villa": "Private Pool Villa", "Boutique Hotel": "Designer King Room",
    "Hostel": "Private Twin Pod", "Apartment": "One Bedroom Apartment",
}
AMENITY_POOL = [
    "Swimming pool", "Free WiFi", "Breakfast included", "Airport transfer", "Spa",
    "Beach access", "Rooftop bar", "Gym", "Air conditioning", "Kitchenette",
]


def _seed(*parts: object) -> random.Random:
    return random.Random("|".join(str(p) for p in parts))


def _parse_date(value: str) -> date:
    return datetime.fromisoformat(value[:10]).date()


class MockFlightProvider(FlightProvider):
    name = "MockFlights Aggregator"
    mode = "mock"

    async def search(self, request: FlightSearchRequest) -> list[FlightOption]:
        rng = _seed("flights", request.origin, request.destination, request.departure_date,
                    request.cabin_class)
        dep_code = airport_for(request.origin)
        arr_code = airport_for(request.destination)
        dep_day = _parse_date(request.departure_date)
        multiplier = CABIN_MULTIPLIER.get(request.cabin_class, 1.0)

        options: list[FlightOption] = []
        for index in range(10):
            airline, code = AIRLINES[rng.randrange(len(AIRLINES))]
            stops = rng.choice([0, 0, 0, 1, 1, 2])
            base_minutes = rng.randint(200, 420) + stops * rng.randint(90, 220)
            dep_hour = rng.randint(0, 23)
            dep_minute = rng.choice([0, 10, 20, 30, 40, 50])
            dep_dt = datetime.combine(dep_day, datetime.min.time()) + timedelta(
                hours=dep_hour, minutes=dep_minute
            )
            arr_dt = dep_dt + timedelta(minutes=base_minutes)
            per_person = rng.randint(9500, 32000) * multiplier
            per_person *= 1.0 - 0.07 * stops            # more stops, cheaper fare
            total = round(per_person * request.travelers, 0)

            query = quote_plus(
                f"flights from {dep_code} to {arr_code} on {request.departure_date}"
            )
            options.append(
                FlightOption(
                    airline=airline,
                    airline_code=code,
                    flight_number=f"{code}-{rng.randint(100, 989)}",
                    departure_airport=dep_code,
                    departure_city=request.origin.title(),
                    arrival_airport=arr_code,
                    arrival_city=request.destination.title(),
                    departure_time=dep_dt.isoformat(),
                    arrival_time=arr_dt.isoformat(),
                    duration_minutes=base_minutes,
                    stops=stops,
                    cabin_class=request.cabin_class,
                    price=total,
                    currency="INR",
                    baggage="15kg check-in + 7kg cabin" if request.cabin_class == "economy"
                    else "30kg check-in + 10kg cabin",
                    provider=self.name,
                    provider_mode="mock",
                    booking_url=f"https://www.google.com/travel/flights?q={query}",
                )
            )
        return options


class MockStayProvider(StayProvider):
    name = "MockStays Network"
    mode = "mock"

    async def search(self, request: StaySearchRequest) -> list[StayOption]:
        data = city_data(request.city)
        check_in = _parse_date(request.check_in)
        check_out = _parse_date(request.check_out)
        nights = max(1, (check_out - check_in).days)

        results: list[StayOption] = []
        for index, name in enumerate(data["stays"]):
            rng = _seed("stay", request.city, name)
            prop_type = PROPERTY_TYPES[index % len(PROPERTY_TYPES)]
            nightly = {
                "Resort": rng.randint(7000, 16000), "Hotel": rng.randint(4500, 9000),
                "Villa": rng.randint(9000, 22000), "Boutique Hotel": rng.randint(5000, 11000),
                "Hostel": rng.randint(900, 2200), "Apartment": rng.randint(3500, 8000),
            }[prop_type]
            amenity_count = rng.randint(4, 8)
            amenities = rng.sample(AMENITY_POOL, amenity_count)
            if prop_type in ("Resort", "Villa") and "Swimming pool" not in amenities:
                amenities[0] = "Swimming pool"
            images = [STAY_IMAGES[(index + offset) % len(STAY_IMAGES)] for offset in range(2)]
            results.append(
                StayOption(
                    name=name,
                    city=request.city,
                    location=f"{rng.choice(['Beachfront', 'Old Town', 'City Centre', 'Riverside', 'Hill Road'])}, {request.city}",
                    property_type=prop_type,
                    price_per_night=float(nightly),
                    total_price=float(nightly * nights * request.rooms),
                    nights=nights,
                    currency="INR",
                    rating=round(rng.uniform(3.4, 4.9), 1),
                    reviews=rng.randint(80, 2400),
                    amenities=amenities,
                    room_type=ROOM_TYPES[prop_type],
                    images=images,
                    cancellation_policy=rng.choice(
                        ["Free cancellation until 48h before check-in",
                         "Free cancellation until 24h before check-in",
                         "Non-refundable rate"]
                    ),
                    distance_to_beach_km=round(rng.uniform(0.1, 6.0), 1),
                    distance_to_center_km=round(rng.uniform(0.3, 8.0), 1),
                    distance_to_nightlife_km=round(rng.uniform(0.2, 7.0), 1),
                    coordinates=Coordinates(
                        lat=data["lat"] + rng.uniform(-0.05, 0.05),
                        lng=data["lng"] + rng.uniform(-0.05, 0.05),
                    ),
                    provider=self.name,
                    provider_mode="mock",
                    booking_url=(
                        "https://www.google.com/travel/search?q="
                        + quote_plus(f"{name} {request.city} hotel")
                    ),
                )
            )
        return results


class MockExploreProvider(ExploreProvider):
    """Restaurants, nightlife, activities and places from one labelled mock source."""

    name = "MockExplore Guide"
    mode = "mock"

    TYPE_LABELS = {
        "food": ["Restaurant", "Cafe", "Street Food", "Seafood", "Fine Dining"],
        "nightlife": ["Club", "Bar", "Beach Club", "Night Market", "Live Music"],
        "activities": ["Water Sports", "Island Hopping", "Adventure", "Tour", "Experience"],
        "places": ["Beach", "Viewpoint", "Attraction", "Neighbourhood", "Shopping"],
    }
    COST_RANGE = {
        "food": (600, 4500), "nightlife": (900, 6000),
        "activities": (1500, 9000), "places": (0, 1500),
    }
    DURATION = {"food": 90, "nightlife": 180, "activities": 300, "places": 120}

    async def search(self, request: ExploreSearchRequest) -> list[ExploreOption]:
        data = city_data(request.city)
        categories = (
            ["food", "nightlife", "activities", "places"]
            if request.category == "all"
            else [request.category]
        )
        results: list[ExploreOption] = []
        for category in categories:
            names: list[str] = data[category]  # type: ignore[literal-required]
            labels = self.TYPE_LABELS[category]
            low, high = self.COST_RANGE[category]
            for index, name in enumerate(names):
                rng = _seed("explore", request.city, category, name)
                results.append(
                    ExploreOption(
                        name=name,
                        category=category,  # type: ignore[arg-type]
                        type=labels[index % len(labels)],
                        description=f"{labels[index % len(labels)]} in {request.city}. {data['blurb']}",
                        city=request.city,
                        location=f"{rng.choice(['North', 'Central', 'Beach Road', 'Old Quarter', 'Riverside'])}, {request.city}",
                        coordinates=Coordinates(
                            lat=data["lat"] + rng.uniform(-0.06, 0.06),
                            lng=data["lng"] + rng.uniform(-0.06, 0.06),
                        ),
                        rating=round(rng.uniform(3.6, 4.9), 1),
                        reviews=rng.randint(60, 5200),
                        estimated_cost=float(rng.randint(low, high) if high > low else low),
                        currency="INR",
                        duration_minutes=self.DURATION[category],
                        images=[CATEGORY_IMAGE[category]],
                        tags=rng.sample(
                            ["beaches", "nightlife", "food", "activities", "culture", "shopping",
                             "sunset", "family", "adventure"],
                            3,
                        ),
                        provider=self.name,
                        provider_mode="mock",
                        provider_url=(
                            "https://www.google.com/maps/search/?api=1&query="
                            + quote_plus(f"{name} {request.city}")
                        ),
                    )
                )
        return results
