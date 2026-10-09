"""Criterion: Email signup/login with httpOnly cookie sessions, and trips are private per user."""

import uuid

import httpx

from .conftest import CookieAwareClient, api_url


def _signup(suffix: str) -> CookieAwareClient:
    client = CookieAwareClient(api_url(), timeout=30.0)
    email = f"tscheck-auth-{suffix}@example.com"
    resp = client.post(
        "/auth/signup",
        json={"name": "TSCheck User", "email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201, f"signup failed: {resp.status_code} {resp.text}"
    assert "Roamio_session" in resp.cookies, "session cookie not set on signup"
    return client


def test_signup_sets_session_and_me_returns_user():
    suffix = uuid.uuid4().hex[:8]
    client = _signup(suffix)
    me = client.get("/auth/me")
    assert me.status_code == 200, f"/auth/me failed: {me.status_code} {me.text}"
    body = me.json()
    assert body["email"] == f"tscheck-auth-{suffix}@example.com"
    client.close()


def test_trips_without_cookie_returns_401():
    anon = CookieAwareClient(api_url(), timeout=30.0)
    resp = anon.get("/trips")
    assert resp.status_code == 401, f"expected 401, got {resp.status_code} {resp.text}"
    anon.close()


def test_second_account_cannot_access_first_accounts_trip():
    suffix_a = uuid.uuid4().hex[:8]
    suffix_b = uuid.uuid4().hex[:8]
    client_a = _signup(suffix_a)
    client_b = _signup(suffix_b)

    create = client_a.post(
        "/trips",
        json={
            "title": f"tscheck-isolation-{suffix_a}",
            "destination": "Thailand",
            "origin": "Bangalore",
            "start_date": "2026-11-01",
            "duration_days": 3,
            "budget_amount": 50000,
            "travelers": 1,
        },
    )
    assert create.status_code == 201, f"trip create failed: {create.status_code} {create.text}"
    trip_id = create.json()["id"]

    own_get = client_a.get(f"/trips/{trip_id}")
    assert own_get.status_code == 200, "owner should be able to read own trip"

    other_get = client_b.get(f"/trips/{trip_id}")
    assert other_get.status_code == 404, (
        f"second account should NOT access first account's trip, got "
        f"{other_get.status_code} {other_get.text}"
    )
    client_a.close()
    client_b.close()
