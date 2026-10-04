"""Criterion: Natural-language trip planning creates a structured trip with extracted
preferences and a day-by-day itinerary.

NOTE: POST /api/ai/trips legitimately takes 25-60s (real LLM call) — client timeout is
generous on purpose.
"""

import uuid
from datetime import date, timedelta

from .conftest import CookieAwareClient, api_url


def _signup() -> tuple[CookieAwareClient, str]:
    suffix = uuid.uuid4().hex[:8]
    client = CookieAwareClient(api_url(), timeout=120.0)
    email = f"tscheck-aiplan-{suffix}@example.com"
    resp = client.post(
        "/auth/signup",
        json={"name": "TSCheck AI Planner", "email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201, f"signup failed: {resp.status_code} {resp.text}"
    return client, suffix


def test_ai_trip_creates_structured_itinerary():
    client, suffix = _signup()
    try:
        prompt = (
            "Plan me a 5-day Thailand trip, beaches and nightlife, "
            "budget 1.2 lakh for 2 people"
        )
        resp = client.post("/ai/trips", json={"prompt": prompt})
        assert resp.status_code == 201, f"ai/trips failed: {resp.status_code} {resp.text}"
        body = resp.json()
        assert body["source"] in ("ai", "fallback"), body["source"]

        trip = body["trip"]
        assert trip["duration_days"] == 5, f"expected 5 days, got {trip['duration_days']}"
        assert trip["travelers"] == 2, f"expected 2 travelers, got {trip['travelers']}"

        prefs = trip["preferences"]
        assert prefs, "preferences should not be empty"
        for key, weight in prefs.items():
            assert 0 <= weight <= 1, f"preference {key} weight {weight} out of 0..1 range"
        # beaches/nightlife should be among the extracted interests with meaningful weight
        relevant = {k: v for k, v in prefs.items() if k in ("beaches", "nightlife")}
        assert relevant, f"expected beaches/nightlife interest keys, got {list(prefs.keys())}"
        assert any(v > 0.3 for v in relevant.values()), relevant

        cities = trip["cities"]
        assert cities, "cities should not be empty"
        assert sum(c["days"] for c in cities) == trip["duration_days"], (
            f"city days {cities} do not sum to duration_days {trip['duration_days']}"
        )

        itinerary = trip["itinerary"]
        assert len(itinerary) == trip["duration_days"], (
            f"expected {trip['duration_days']} itinerary days, got {len(itinerary)}"
        )

        start = date.fromisoformat(trip["start_date"])
        for idx, day in enumerate(itinerary, start=1):
            assert day["day_number"] == idx, f"day_number out of order: {day}"
            expected_date = (start + timedelta(days=idx - 1)).isoformat()
            assert day["date"] == expected_date, f"day {idx} date mismatch: {day['date']} != {expected_date}"
            assert day["slots"], f"day {idx} has no slots"
            for slot in day["slots"]:
                assert slot.get("start_time"), slot
                assert slot.get("end_time"), slot
                assert slot.get("title"), slot
                assert slot.get("category"), slot
                assert slot.get("estimated_cost") is not None, slot
    finally:
        client.close()
