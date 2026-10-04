"""Criterion: Conversational itinerary modification rewrites the structure, not prose.

Creates its own trip via AI planning (slow, ~25-60s) then modifies it.
"""

import uuid
from datetime import date, timedelta

from .conftest import CookieAwareClient, api_url


def _signup() -> CookieAwareClient:
    suffix = uuid.uuid4().hex[:8]
    client = CookieAwareClient(api_url(), timeout=120.0)
    email = f"tscheck-aimodify-{suffix}@example.com"
    resp = client.post(
        "/auth/signup",
        json={"name": "TSCheck AI Modify", "email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201, f"signup failed: {resp.status_code} {resp.text}"
    return client


def test_ai_modify_rewrites_itinerary_structure():
    client = _signup()
    try:
        create = client.post(
            "/ai/trips",
            json={"prompt": "Plan me a 6-day Thailand trip covering Bangkok and Phuket"},
        )
        assert create.status_code == 201, f"ai/trips failed: {create.status_code} {create.text}"
        trip = create.json()["trip"]
        trip_id = trip["id"]
        original_days = trip["duration_days"]
        assert original_days >= 2, "need a multi-day trip to meaningfully reduce it"

        modify = client.post(
            f"/trips/{trip_id}/ai/modify",
            json={"message": "Reduce Bangkok by one day"},
        )
        assert modify.status_code == 200, f"ai/modify failed: {modify.status_code} {modify.text}"
        body = modify.json()
        assert "message" in body and body["message"], "expected a message field"
        new_trip = body["trip"]

        itinerary = new_trip["itinerary"]
        assert len(itinerary) == new_trip["duration_days"], (
            f"itinerary length {len(itinerary)} != duration_days {new_trip['duration_days']}"
        )

        start = date.fromisoformat(new_trip["start_date"])
        for idx, day in enumerate(itinerary, start=1):
            assert day["day_number"] == idx, f"day not renumbered 1..N: {[d['day_number'] for d in itinerary]}"
            expected_date = (start + timedelta(days=idx - 1)).isoformat()
            assert day["date"] == expected_date, f"day {idx} date not consecutive: {day['date']}"

        assert new_trip["cities"], "cities should be recomputed, not empty"
        assert sum(c["days"] for c in new_trip["cities"]) == new_trip["duration_days"]
    finally:
        client.close()
