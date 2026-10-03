# VoyageAI — living spec

AI travel planning & discovery platform. A user describes a trip in natural language and gets a
structured, editable Trip: itinerary, flight & stay discovery, explore feeds (food / nightlife /
activities / places) and a deterministic budget. The app never takes payment — every booking
control deep-links to the external provider.

## Stack
- Backend: FastAPI + motor/MongoDB, all routes on `api_router` (`/api`). `backend/`
- Frontend: Vite + React 19 + TS strict + Tailwind v4 + shadcn (base-ui). `frontend/`
- LLM: Anthropic `claude-sonnet-5-5` via `emergentintegrations` + `EMERGENT_LLM_KEY`.
- Providers: `PROVIDER_MODE=mock` (default). Mock adapters in `backend/providers/mock.py`,
  interfaces in `providers/base.py`, selection in `providers/registry.py`.

## Architecture rules
- LLM only: intent extraction, itinerary draft, itinerary modification, assistant prose.
- Deterministic Python: dates (`lib/planner.py`), budget (`lib/budget.py`), ranking
  (`lib/ranking.py`), filters/sorts (routers), auth (`lib/security.py`).
- Every structured LLM call → JSON extraction → Pydantic validation → business validation, with
  one structured retry. Itinerary generation falls back to `build_fallback_itinerary()` (catalogue
  driven) when the model fails, so a trip is never empty (`itinerary_source: ai | fallback`).

## Data model (collections)
- `users`: id, email (unique), name, password_hash, created_at
- `sessions`: token_hash (sha256 of cookie value), user_id, expires_at (TTL index)
- `trips`: the Trip aggregate — id, user_id, title, destination, origin, start_date, end_date,
  duration_days, budget_amount, currency, travelers, cabin_class, travel_style,
  preferences {interest: 0..1}, cities [{name, days}], itinerary [TripDay{day_number, date, city,
  summary, slots [TimeSlot]}], flights [FlightOption], stays [StayOption],
  explore_items [ExploreOption], raw_prompt, itinerary_source.

## Auth
Email + password signup/login. Session is an httpOnly cookie `voyage_session`; no token is ever
returned in JSON. `GET /api/auth/me` answers "who am I". Trips are owned — another user's trip 404s.
AI routes are rate limited to 12 calls/minute/user.

## API (all under /api)
- auth: POST /auth/signup, /auth/login, /auth/logout, GET /auth/me
- trips: POST /trips, GET /trips, GET|PUT|DELETE /trips/{id}, GET /trips/{id}/budget
- itinerary: GET /trips/{id}/itinerary, POST /trips/{id}/itinerary/items,
  PUT|DELETE /trips/{id}/itinerary/items/{itemId}
- saved options: POST|DELETE /trips/{id}/flights[/{optId}], …/stays, …/explore
- discovery: POST /trips/{id}/flights/search, …/stays/search, …/explore/search; GET equivalents
  return what's saved; GET /trips/{id}/providers/mode
- ai: POST /ai/parse, POST /ai/trips (prompt → trip + itinerary),
  POST /trips/{id}/ai/plan, /ai/modify, /ai/message

## Key flows
1. Landing → describe trip → (sign in if needed, prompt is replayed) → POST /ai/trips → trip page.
2. Trip page tabs: Overview, Itinerary, Flights, Stays, Explore, Budget, AI Copilot
   (`/trips/:tripId/:tab`).
3. Itinerary: regenerate, "Ask AI to adjust" (structural conversational edit), add/move/remove item.
4. Flights/Stays: search with filters + sorts; save to trip (feeds budget); "Book"/"View" opens the
   provider in a new tab.
5. Explore: category tabs + city + search; "Add to trip" writes an itinerary item; "Save" pins it.
6. Budget: category breakdown, total vs budget, remaining, per traveller — all backend computed.

## Seed data
`cd /app/backend && python seed.py` — demo user with a 7-day Thailand trip (Phuket 2 / Krabi 2 /
Bangkok 3), one saved flight, one saved stay, two saved nightlife items. Credentials in
`memory/test_credentials.md`.
