"""Deterministic trip planning mechanics: dates, city splits, fallback itinerary, normalisation.

Everything here is plain Python. The LLM proposes; this module validates, dates and renumbers.
"""

from datetime import date, datetime, timedelta, timezone

from lib.catalog import cities_for_destination, city_data
from models.trip import CityStay, Coordinates, TimeSlot, Trip, TripDay

DEFAULT_LEAD_DAYS = 21


def today() -> date:
    return datetime.now(timezone.utc).date()


def resolve_start_date(raw: str | None) -> str:
    """Server-anchored start date — never trust client-side date math."""
    if raw:
        try:
            parsed = datetime.fromisoformat(raw[:10]).date()
            return parsed.isoformat()
        except ValueError:
            pass
    return (today() + timedelta(days=DEFAULT_LEAD_DAYS)).isoformat()


def end_date_for(start: str, duration_days: int) -> str:
    start_date = datetime.fromisoformat(start[:10]).date()
    return (start_date + timedelta(days=max(1, duration_days) - 1)).isoformat()


def date_for_day(start: str, day_number: int) -> str:
    start_date = datetime.fromisoformat(start[:10]).date()
    return (start_date + timedelta(days=max(1, day_number) - 1)).isoformat()


def split_cities(destination: str, duration_days: int) -> list[CityStay]:
    """Spread the trip length across the destination's cities, remainder to the first."""
    names = cities_for_destination(destination)
    count = min(len(names), max(1, duration_days))
    names = names[:count]
    base, extra = divmod(max(1, duration_days), count)
    return [CityStay(name=name, days=base + (1 if i < extra else 0)) for i, name in enumerate(names)]


def cities_from_itinerary(itinerary: list[TripDay]) -> list[CityStay]:
    """Collapse the day list into consecutive city stays — the source of truth for the overview."""
    stays: list[CityStay] = []
    for day in itinerary:
        if stays and stays[-1].name == day.city:
            stays[-1].days += 1
        else:
            stays.append(CityStay(name=day.city, days=1))
    return stays


def normalise_itinerary(itinerary: list[TripDay], start_date: str) -> list[TripDay]:
    """Renumber days 1..N and re-stamp dates from the trip start; sort slots by start time."""
    for index, day in enumerate(itinerary, start=1):
        day.day_number = index
        day.date = date_for_day(start_date, index)
        day.slots.sort(key=lambda slot: slot.start_time)
        for slot in day.slots:
            if slot.duration_minutes <= 0:
                slot.duration_minutes = _minutes_between(slot.start_time, slot.end_time)
    return itinerary


def _minutes_between(start: str, end: str) -> int:
    try:
        sh, sm = (int(part) for part in start.split(":")[:2])
        eh, em = (int(part) for part in end.split(":")[:2])
        delta = (eh * 60 + em) - (sh * 60 + sm)
        return delta if delta > 0 else 90
    except Exception:
        return 90


# --------------------------------------------------------- deterministic fallback planner

_TEMPLATE = [
    ("09:30", "11:00", "places", 0),
    ("12:30", "14:00", "food", 0),
    ("15:00", "18:00", "activities", 0),
    ("19:30", "21:00", "food", 1),
    ("21:30", "23:30", "nightlife", 0),
]


def build_fallback_itinerary(trip: Trip) -> list[TripDay]:
    """Catalogue-driven itinerary used when the AI layer is unavailable — no dead ends."""
    cities = trip.cities or split_cities(trip.destination, trip.duration_days)
    prefs = trip.preferences or {}
    days: list[TripDay] = []
    day_number = 0
    counters: dict[str, int] = {}

    for city_index, stay in enumerate(cities):
        data = city_data(stay.name)
        for local_day in range(stay.days):
            day_number += 1
            if day_number > trip.duration_days:
                break
            slots: list[TimeSlot] = []
            for start, end, category, offset in _TEMPLATE:
                if prefs.get(category, 0.5) < 0.25 and category in ("nightlife", "activities"):
                    continue
                pool: list[str] = data[category]  # type: ignore[literal-required]
                key = f"{stay.name}:{category}"
                index = (counters.get(key, 0) + offset) % len(pool)
                counters[key] = counters.get(key, 0) + 1
                cost = {"places": 400, "food": 1200, "activities": 3200, "nightlife": 1800}[category]
                slots.append(
                    TimeSlot(
                        start_time=start, end_time=end, title=pool[index],
                        location=stay.name, category=category,  # type: ignore[arg-type]
                        notes="", estimated_cost=float(cost),
                        duration_minutes=_minutes_between(start, end),
                        coordinates=Coordinates(lat=data["lat"], lng=data["lng"]),
                        source="ai",
                    )
                )
            if local_day == 0 and city_index > 0:
                slots.insert(
                    0,
                    TimeSlot(
                        start_time="07:30", end_time="09:00",
                        title=f"Travel to {stay.name}", location=stay.name,
                        category="transport", estimated_cost=0.0, duration_minutes=90, source="ai",
                    ),
                )
            summary = (
                f"Arrive in {stay.name} and settle in" if local_day == 0
                else f"Full day exploring {stay.name}"
            )
            days.append(
                TripDay(
                    day_number=day_number,
                    date=date_for_day(trip.start_date, day_number),
                    city=stay.name,
                    summary=summary,
                    slots=slots,
                )
            )
    return normalise_itinerary(days, trip.start_date)
