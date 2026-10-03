"""Pre-scaffolded pytest fixtures for the FastAPI backend.

Tests hit the live uvicorn process managed by supervisor (not an in-process ASGI app), so
the app under test is the same one the frontend and Playwright see. Do NOT re-create this
file — add app-specific fixtures below the marker at the bottom.
"""

import os

import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


def api_url(path: str = "") -> str:
    """Absolute URL for an /api route: api_url("/status") -> http://localhost:8001/api/status."""
    return f"{API_URL}{path}"


@pytest.fixture(scope="session")
def backend_url() -> str:
    return BACKEND_URL


@pytest.fixture
def client():
    """Sync httpx client rooted at /api — the default for endpoint tests.

    Example:
        def test_status(client):
            assert client.get("/status").status_code == 200
    """
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def aclient():
    """Async variant, for tests that also await motor/backend helpers directly."""
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as c:
        yield c


# --- app-specific fixtures below this line ---


class CookieAwareClient:
    """Thin wrapper around httpx.Client that manually forwards the session cookie.

    The app sets `Secure` on the session cookie whenever APP_URL starts with https
    (true in this pod's .env, since the public ingress is https) — correct production
    behaviour, but it means a plain httpx cookie jar talking to http://localhost won't
    re-send the cookie automatically. We extract the Set-Cookie value ourselves and
    attach it as a header on every subsequent request so backend tests against
    localhost:8001 can still exercise authenticated routes.
    """

    def __init__(self, base_url: str, timeout: float = 30.0):
        self._client = httpx.Client(base_url=base_url, timeout=timeout)
        self._session_token: str | None = None

    def _headers(self, headers: dict | None) -> dict:
        merged = dict(headers or {})
        if self._session_token:
            merged["Cookie"] = f"voyage_session={self._session_token}"
        return merged

    def _capture(self, resp: httpx.Response) -> httpx.Response:
        token = resp.cookies.get("voyage_session")
        if token:
            self._session_token = token
        return resp

    def post(self, url, json=None, headers=None, **kw):
        return self._capture(self._client.post(url, json=json, headers=self._headers(headers), **kw))

    def get(self, url, headers=None, **kw):
        return self._capture(self._client.get(url, headers=self._headers(headers), **kw))

    def delete(self, url, headers=None, **kw):
        return self._capture(self._client.delete(url, headers=self._headers(headers), **kw))

    def close(self):
        self._client.close()
