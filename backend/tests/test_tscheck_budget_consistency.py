"""Criterion: Budget is deterministic, complete and never produced by the AI.

Uses the seeded demo account's trip read-only (GET only, no mutation) to verify the
budget invariants hold against real persisted data.
"""

from .conftest import CookieAwareClient, api_url

DEMO_EMAIL = "demo@voyageai.app"
DEMO_PASSWORD = "voyage123"

REQUIRED_CATEGORIES = {
    "flights", "stays", "food", "nightlife", "activities", "places", "shopping", "transport",
}


def _demo_client() -> CookieAwareClient:
    client = CookieAwareClient(api_url(), timeout=30.0)
    resp = client.post("/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert resp.status_code == 200, f"demo login failed: {resp.status_code} {resp.text}"
    return client


def test_budget_lines_are_complete_and_consistent():
    client = _demo_client()
    try:
        trips = client.get("/trips")
        assert trips.status_code == 200, f"trips failed: {trips.status_code} {trips.text}"
        trip_list = trips.json()
        assert trip_list, "expected at least one seeded trip for demo account"
        trip = trip_list[0]
        trip_id = trip["id"]

        resp = client.get(f"/trips/{trip_id}/budget")
        assert resp.status_code == 200, f"budget failed: {resp.status_code} {resp.text}"
        budget = resp.json()

        categories = {line["category"] for line in budget["lines"]}
        assert REQUIRED_CATEGORIES.issubset(categories), (
            f"missing categories: {REQUIRED_CATEGORIES - categories}"
        )

        line_sum = sum(line["amount"] for line in budget["lines"])
        assert abs(line_sum - budget["total"]) < 0.01, (
            f"sum of lines {line_sum} != total {budget['total']}"
        )
        assert abs(budget["remaining"] - (budget["budget"] - budget["total"])) < 0.01, (
            f"remaining {budget['remaining']} != budget - total "
            f"({budget['budget']} - {budget['total']})"
        )

        expected_over = budget["total"] > budget["budget"]
        assert budget["over_budget"] == expected_over

        assert "per_traveler" in budget and budget["per_traveler"] is not None
        assert "utilisation_percent" in budget and budget["utilisation_percent"] is not None

        # flights/stays lines equal sums of the trip's saved flights/stays
        trip_detail = client.get(f"/trips/{trip_id}")
        assert trip_detail.status_code == 200
        full_trip = trip_detail.json()

        flights_line = next(l["amount"] for l in budget["lines"] if l["category"] == "flights")
        expected_flights = sum(f["price"] for f in full_trip.get("flights", []))
        assert abs(flights_line - expected_flights) < 0.01, (
            f"flights line {flights_line} != sum of saved flights {expected_flights}"
        )

        stays_line = next(l["amount"] for l in budget["lines"] if l["category"] == "stays")
        expected_stays = sum(s["total_price"] for s in full_trip.get("stays", []))
        assert abs(stays_line - expected_stays) < 0.01, (
            f"stays line {stays_line} != sum of saved stays {expected_stays}"
        )
    finally:
        client.close()
