# Roamio ✈️

> **AI-powered travel planning, discovery, and trip management platform**

Roamio is an AI-assisted travel planning application that turns a natural-language travel request into a structured, editable trip.

A user can describe a trip such as:

> "Plan me a 7-day Thailand trip for two people with beaches, nightlife, good food, and a moderate budget."

Roamio transforms that intent into a structured trip containing an itinerary, destination discovery, flights, stays, activities, and a deterministic budget.

The application is designed around an important principle:

> **AI handles language and planning intelligence; deterministic application code handles dates, budgets, validation, persistence, ranking, authentication, and business rules.**

---

## 🚧 Project Status

**Status: Active development**

Roamio was originally bootstrapped using Emergent, but the project has evolved significantly beyond the original starter application.

The repository should be treated as an actively developed full-stack application rather than an Emergent/Farm starter template.

### Current high-level status

* ✅ FastAPI backend established
* ✅ React/Vite frontend established
* ✅ MongoDB persistence architecture established
* ✅ Authentication and session model established
* ✅ Trip CRUD architecture established
* ✅ AI planning architecture established
* ✅ Provider abstraction established
* ✅ Mock provider mode available
* ✅ Itinerary generation and fallback architecture established
* ✅ Flight/stay/explore discovery architecture established
* ✅ Budget calculation architecture established
* ✅ Trip-detail experience with multiple tabs established
* ⚠️ Some integrations/providers are still mock implementations
* ⚠️ Emergent-era dependencies/configuration may still exist
* ⚠️ End-to-end production readiness should be verified before considering the application complete

The detailed product specification lives in:

```text
memory/SPEC.md
```

That file is the **living functional specification** and should be consulted before making major architectural or product changes.

---

# 🎯 Product Vision

Roamio aims to provide a single workspace where a traveler can:

1. Describe a trip naturally.
2. Generate an initial trip plan using AI.
3. Edit and regenerate the itinerary.
4. Discover flights and stays.
5. Discover restaurants, nightlife, activities, and places.
6. Save interesting options.
7. Track a deterministic trip budget.
8. Ask an AI travel copilot questions about the trip.
9. Eventually deep-link to external booking providers.

Roamio **does not process payments or directly complete bookings**.

Booking controls should redirect users to the relevant external provider.

---

# 🧭 Core User Experience

## 1. Landing

User arrives at Roamio and sees a natural-language trip planning experience.

Example:

```text
Plan a 7-day Thailand trip for two people.
I want beaches, nightlife and good food.
Budget: moderate.
```

---

## 2. Trip Creation

The natural-language request is sent to the AI planning pipeline.

The system extracts structured intent such as:

```text
Destination
Dates / duration
Travelers
Budget
Interests
Preferences
Constraints
```

The resulting trip is persisted.

---

## 3. Trip Workspace

A trip contains the following major areas:

```text
Overview
Itinerary
Flights
Stays
Explore
Budget
AI Copilot
```

---

## 4. Itinerary

The user can:

* View day-by-day plans
* Regenerate the itinerary
* Adjust the itinerary
* Add activities
* Move itinerary items
* Remove itinerary items
* Modify individual items

The itinerary is represented as structured application data rather than just an AI-generated text response.

---

## 5. Flights

Users can:

* Search flights
* Filter results
* Sort results
* View flight details
* Save flight options
* Follow an external booking/deep-link flow

---

## 6. Stays

Users can:

* Search accommodations
* Filter results
* Sort results
* View stay details
* Save stays
* Follow external booking/deep-link flows

---

## 7. Explore

Users can discover:

* Food
* Restaurants
* Nightlife
* Activities
* Attractions
* Places

Explore results can be searched, filtered, saved, and added to a trip.

---

## 8. Budget

The budget view provides a deterministic breakdown of trip expenses.

Budget calculations should be performed by application code rather than delegated to an LLM.

---

## 9. AI Copilot

The AI assistant can answer questions about the current trip and help modify it.

Examples:

```text
Can you make Day 3 less hectic?

Add a sunset activity to Day 4.

Replace the expensive restaurant with something cheaper.

What are the best nightlife options near our hotel?
```

---

# 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│                  Frontend                    │
│                                              │
│ React 19 + TypeScript + Vite                 │
│ Tailwind CSS + shadcn/base-ui                │
│ React Router + TanStack Query                │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTP / JSON
                       ▼
┌──────────────────────────────────────────────┐
│                  FastAPI                     │
│                                              │
│ /api/auth                                    │
│ /api/trips                                   │
│ /api/ai                                      │
│ /api/discovery                               │
│ /api/mapview                                 │
└──────────────┬───────────────┬───────────────┘
               │               │
               ▼               ▼
       ┌──────────────┐   ┌──────────────────┐
       │   MongoDB    │   │ Provider Layer   │
       │              │   │                  │
       │ users        │   │ flights          │
       │ sessions     │   │ stays            │
       │ trips        │   │ explore          │
       └──────────────┘   └────────┬─────────┘
                                   │
                                   ▼
                          External providers
                          / mock providers
```

---

# 🧰 Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS v4
* shadcn/base-ui
* React Router
* TanStack Query
* Motion
* Recharts
* Lucide React
* Sonner
* date-fns
* Google Maps integration via `@vis.gl/react-google-maps`

Current frontend dependencies can be found in:

```text
frontend/package.json
```

---

## Backend

* Python
* FastAPI
* Pydantic
* Motor
* MongoDB
* Pytest

Backend dependencies:

```text
backend/requirements.txt
```

---

## AI

The intended LLM architecture uses Anthropic models through the existing integration layer.

The intended model is currently:

```text
claude-sonnet-5-5
```

The AI integration is designed to use:

```text
emergentintegrations
```

with:

```text
EMERGENT_LLM_KEY
```

However, AI functionality should remain behind an abstraction rather than being coupled directly to UI or business logic.

---

# 🧠 AI vs Deterministic Logic

This distinction is one of the most important architectural principles of Roamio.

## AI should handle

* Natural-language intent extraction
* Initial itinerary drafting
* Itinerary modification
* Travel assistant responses
* Human-friendly travel recommendations/prose

---

## Deterministic application code should handle

* Authentication
* Authorization
* Dates
* Duration calculations
* Budget calculations
* Ranking
* Filtering
* Sorting
* Validation
* Persistence
* Business rules
* Rate limiting
* Ownership checks
* Provider selection

Do **not** move deterministic business logic into prompts merely because an LLM can perform the task.

---

# 🤖 Structured AI Pipeline

AI requests should follow this general pipeline:

```text
User request
     │
     ▼
Structured LLM call
     │
     ▼
JSON extraction
     │
     ▼
Pydantic validation
     │
     ▼
Business validation
     │
     ├── valid ───────────────► application logic
     │
     └── invalid
             │
             ▼
       one structured retry
```

AI output should never be blindly trusted.

---

# 🔄 Itinerary Fallback

Itinerary generation is designed to remain functional even if the AI provider fails.

Conceptually:

```text
Generate itinerary
       │
       ▼
   AI provider
       │
   ┌───┴────┐
   │        │
 success   failure
   │        │
   ▼        ▼
 AI plan   fallback
   │        │
   └───┬────┘
       ▼
 Persist itinerary
```

The itinerary source is tracked as:

```text
ai
```

or:

```text
fallback
```

The backend contains:

```text
build_fallback_itinerary()
```

for this purpose.

---

# 🔌 Provider Architecture

External travel data should not be tightly coupled to route handlers.

Provider interfaces/adapters live under:

```text
backend/providers/
```

The application supports a provider mode concept.

Default development mode:

```text
PROVIDER_MODE=mock
```

This allows frontend/backend development without requiring every external travel provider to be configured.

Provider implementations should eventually be replaceable without rewriting the rest of the application.

---

# 🗄️ Data Model

The primary MongoDB collections are:

```text
users
sessions
trips
```

---

## Users

Stores user account information.

Authentication is based on email/password.

---

## Sessions

Sessions are represented using a secure HTTP-only cookie:

```text
voyage_session
```

The raw session token should not be returned in API JSON responses.

---

## Trips

Trips belong to users.

A trip contains information such as:

```text
destination
dates / duration
travelers
preferences
budget
itinerary
saved flights
saved stays
saved explore items
```

Trip ownership must always be enforced server-side.

A user attempting to access another user's trip should receive:

```text
404
```

rather than being given access to the resource.

---

# 🔐 Authentication & Security

Authentication endpoints:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Authentication uses an HTTP-only session cookie:

```text
voyage_session
```

Important principles:

* Never expose session tokens in API JSON.
* Validate ownership on the backend.
* Never rely on frontend route protection as the only authorization mechanism.
* Return 404 for inaccessible trip resources where appropriate.
* Keep secrets in environment variables.
* Never commit API keys or credentials.

---

# 🚦 AI Rate Limiting

AI routes are intended to be rate limited.

Current specification:

```text
12 AI calls / minute / user
```

This applies to AI-heavy operations to prevent accidental or abusive usage.

---

# 🌐 API Surface

All backend APIs are under:

```text
/api
```

## Authentication

```http
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## Trips

```http
POST   /api/trips
GET    /api/trips
GET    /api/trips/{id}
PUT    /api/trips/{id}
DELETE /api/trips/{id}

GET    /api/trips/{id}/budget
```

---

## Itinerary

```http
GET    /api/trips/{id}/itinerary

POST   /api/trips/{id}/itinerary/items

PUT    /api/trips/{id}/itinerary/items/{itemId}

DELETE /api/trips/{id}/itinerary/items/{itemId}
```

---

## Saved Options

Flights:

```http
POST   /api/trips/{id}/flights
DELETE /api/trips/{id}/flights/{optId}
```

Stays:

```http
POST   /api/trips/{id}/stays
DELETE /api/trips/{id}/stays/{optId}
```

Explore:

```http
POST   /api/trips/{id}/explore
DELETE /api/trips/{id}/explore/{optId}
```

---

## Discovery

Flights:

```http
POST /api/trips/{id}/flights/search
GET  /api/trips/{id}/flights
```

Stays:

```http
POST /api/trips/{id}/stays/search
GET  /api/trips/{id}/stays
```

Explore:

```http
POST /api/trips/{id}/explore/search
GET  /api/trips/{id}/explore
```

Provider mode:

```http
GET /api/trips/{id}/providers/mode
```

---

## AI

```http
POST /api/ai/parse
POST /api/ai/trips

POST /api/trips/{id}/ai/plan

POST /api/ai/modify
POST /api/ai/message
```

---

# 🖥️ Frontend Routing

Current primary routes:

```text
/
├── /login
├── /register
├── /trips
├── /create-trip
├── /trips/:tripId
└── /trips/:tripId/:tab
```

Authenticated routes are protected using:

```text
RequireAuth
```

Unauthenticated users are redirected to:

```text
/login
```

while preserving the intended destination where applicable.

---

# 📁 Repository Structure

```text
trip-planner-ai/
│
├── backend/
│   ├── lib/
│   ├── models/
│   ├── providers/
│   ├── routers/
│   │   ├── ai.py
│   │   ├── auth.py
│   │   ├── discovery.py
│   │   ├── mapview.py
│   │   └── trips.py
│   ├── tests/
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── seed.py
│   └── server.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── CreateTrip.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── TripDetail.tsx
│   │   │   └── Trips.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
│
├── memory/
│   ├── SPEC.md
│   └── test_credentials.md
│
├── .env
├── .gitignore
└── README.md
```

---

# 📚 Important Source-of-Truth Files

Before making significant changes, inspect these files.

### `memory/SPEC.md`

The detailed product and engineering specification.

This should be treated as the primary source of truth for:

* Product behavior
* API contracts
* Data model
* User flows
* AI behavior
* Provider behavior
* Authentication expectations
* Seed data
* Business rules

---

### `backend/server.py`

The backend application entry point.

It currently:

* Loads environment configuration
* Creates the MongoDB client
* Configures the FastAPI application
* Registers routers
* Configures CORS
* Configures middleware
* Handles application lifespan
* Exposes the API under `/api`

---

### `frontend/src/App.tsx`

Primary frontend routing and authentication boundary.

---

### `frontend/src/lib/api.ts`

Typed frontend API communication layer.

Prefer using this abstraction instead of scattering raw HTTP calls throughout components.

---

### `backend/providers/`

Provider interfaces and implementations.

Do not bypass this architecture simply to make one feature work.

---

# 🧪 Seed / Demo Data

The project contains seed functionality.

The demo scenario is a:

```text
7-day Thailand trip
```

covering:

```text
Phuket — 2 days
Krabi — 2 days
Bangkok — 3 days
```

The seeded trip includes:

* A saved flight
* A saved stay
* Two nightlife items

Demo credentials are documented separately in:

```text
memory/test_credentials.md
```

**Do not expose real credentials or secrets in this README.**

---

# 🛠️ Local Development

## Backend

The backend is a FastAPI application.

Typical development flow:

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

The exact environment configuration should be checked before running the application.

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Build:

```bash
npm run build
```

Type checking:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

---

# 🔑 Environment Configuration

Secrets and environment-specific configuration belong in `.env`.

Typical configuration includes:

```text
MONGO_URL
DB_NAME
EMERGENT_LLM_KEY
PROVIDER_MODE
```

Never commit actual secrets.

Use environment variables for:

* MongoDB credentials
* LLM API keys
* External provider credentials
* Authentication secrets
* Deployment-specific configuration

---

# 🧪 Testing

Backend tests live under:

```text
backend/tests/
```

Pytest configuration:

```text
backend/pytest.ini
```

Before considering a major feature complete, verify:

### Backend

* API validation
* Authentication
* Authorization
* Ownership checks
* AI validation
* Provider behavior
* Budget calculations
* Itinerary operations
* Error handling

### Frontend

* Authentication flow
* Trip creation
* Trip loading
* Itinerary editing
* Search/filter/sort flows
* Saving/removing options
* Budget rendering
* AI interactions
* Loading/error/empty states

---

# 📌 Development Principles

## 1. Preserve the architecture

Do not rebuild the application from scratch.

Before introducing a new pattern, inspect the existing implementation.

---

## 2. Keep AI boundaries explicit

Use AI where natural-language reasoning is valuable.

Do not use an LLM for:

```text
date arithmetic
budget arithmetic
authorization
sorting
filtering
validation
persistence
```

---

## 3. Preserve API contracts

Frontend and backend are already structured around the `/api` contract.

When changing an API:

1. Update backend models/routes.
2. Update frontend API types.
3. Update consumers.
4. Update tests.
5. Update `memory/SPEC.md` if the behavior is intentional.

---

## 4. Prefer provider abstraction

External providers should be accessed through:

```text
backend/providers/
```

rather than directly from route handlers.

This keeps mock and real implementations interchangeable.

---

## 5. Validate AI output

Never assume LLM output is valid.

Use:

```text
LLM
→ JSON
→ Pydantic
→ business validation
→ application logic
```

---

## 6. Keep fallback behavior

AI failures should not unnecessarily make the entire trip experience unusable.

Where possible, use deterministic fallback behavior.

---

## 7. Do not leak secrets

Never put:

* API keys
* passwords
* session tokens
* private credentials

into:

* source code
* README
* frontend bundles
* logs
* commits

---

# 🤖 Instructions for AI Coding Agents

If another AI coding agent is asked to continue development on Roamio, it should follow this process.

### Step 1 — Understand the project

Read:

```text
README.md
memory/SPEC.md
```

Then inspect the relevant implementation.

Do not assume the specification and implementation are identical.

---

### Step 2 — Inspect before modifying

Before changing a feature:

```text
Find the frontend component
Find the API helper
Find the backend route
Find the model/schema
Find provider logic
Find tests
```

Understand the existing flow first.

---

### Step 3 — Preserve existing behavior

Avoid unnecessary rewrites.

Make the smallest coherent change that solves the problem.

---

### Step 4 — Verify both sides

For a full-stack change, verify:

```text
Frontend
   ↓
API helper
   ↓
FastAPI route
   ↓
Business logic
   ↓
Provider / database
```

---

### Step 5 — Update documentation

If architecture, API behavior, product behavior, or important implementation decisions change, update:

```text
memory/SPEC.md
```

and, when appropriate:

```text
README.md
```

---

# 🚦 Recommended Development Order

When continuing development, prefer this sequence rather than immediately adding more UI features.

## 1. Stabilize the local development environment

Verify:

```text
Frontend starts
Backend starts
MongoDB connects
Authentication works
Environment variables load
```

---

## 2. Establish a clean baseline

Run:

```text
frontend typecheck
frontend lint
frontend build
backend tests
```

Fix baseline issues before adding major features.

---

## 3. Identify incomplete flows

Test the complete user journey:

```text
Landing
   ↓
Create trip
   ↓
Authentication
   ↓
AI planning
   ↓
Trip creation
   ↓
Trip detail
   ↓
Itinerary
   ↓
Flights
   ↓
Stays
   ↓
Explore
   ↓
Budget
   ↓
AI Copilot
```

---

## 4. Fix correctness before polish

Prioritize:

1. Broken API calls
2. Authentication/authorization
3. Data persistence
4. Incorrect business logic
5. AI validation/fallback
6. Provider abstractions
7. Loading/error states
8. UI polish

---

## 5. Replace mock providers incrementally

Do not replace every provider at once.

A good approach is:

```text
Mock provider
     ↓
Provider interface
     ↓
One real integration
     ↓
Verify end-to-end
     ↓
Next provider
```

---

## 6. Improve critical-path testing

The highest-value automated coverage should focus on:

```text
signup/login
trip creation
trip ownership
AI trip generation
fallback itinerary
itinerary modification
flight/stay search
saving options
budget calculation
AI copilot
```

---

# ⚠️ Known Caveats

This README describes the intended/current architecture based on the repository specification and source structure.

It should **not** be interpreted as proof that every feature is currently production-ready.

In particular:

### Mock providers

Development defaults to:

```text
PROVIDER_MODE=mock
```

Real travel-provider integrations may still be incomplete.

---

### Emergent-era dependencies

Some Emergent-related frontend dependencies/configuration may remain in the project.

Do not blindly remove them.

Before removing anything, verify whether it is still referenced by:

* source code
* build configuration
* runtime
* deployment
* tests

---

### Legacy frontend page

The repository contains:

```text
frontend/src/pages/Home.tsx
```

This is a legacy/starter-style page and is not part of the primary route flow defined in `App.tsx`.

Do not assume every page in the repository represents active product UX.

---

### Specification vs implementation

If `memory/SPEC.md` says something should exist but the source code does not implement it, treat that as an **implementation gap**, not as permission to assume it already works.

Likewise, if the implementation intentionally differs from the specification, determine whether the difference is deliberate before changing it.

---

# 🗺️ Product Direction

The long-term Roamio experience should feel like:

```text
Natural language
      ↓
AI understands intent
      ↓
Structured trip
      ↓
Editable itinerary
      ↓
Real travel discovery
      ↓
Personalized recommendations
      ↓
Deterministic budget
      ↓
AI travel copilot
      ↓
External booking
```

The goal is not simply to build an AI chatbot that talks about travel.

The goal is to build a **real trip-management application where AI is an intelligent layer on top of structured travel data and deterministic application logic.**

---

# 📎 Quick Reference

| Area             | Technology / Location                  |
| ---------------- | -------------------------------------- |
| Product          | Roamio                               |
| Frontend         | React 19 + TypeScript                  |
| Build            | Vite                                   |
| Styling          | Tailwind CSS v4                        |
| Components       | shadcn/base-ui                         |
| Routing          | React Router                           |
| Data fetching    | TanStack Query                         |
| Backend          | FastAPI                                |
| Database         | MongoDB                                |
| Mongo client     | Motor                                  |
| Validation       | Pydantic                               |
| AI               | Anthropic / existing integration layer |
| AI model         | `claude-sonnet-5-5`                    |
| Provider mode    | `PROVIDER_MODE=mock`                   |
| Auth             | HTTP-only session cookie               |
| Session cookie   | `voyage_session`                       |
| AI rate limit    | 12 calls/min/user                      |
| Backend entry    | `backend/server.py`                    |
| Frontend entry   | `frontend/src/App.tsx`                 |
| API helper       | `frontend/src/lib/api.ts`              |
| Product spec     | `memory/SPEC.md`                       |
| Demo credentials | `memory/test_credentials.md`           |
| Backend tests    | `backend/tests/`                       |

---

# ✨ Final Principle

**Roamio should remain a structured travel application first and an AI application second.**

AI makes the experience intelligent and conversational.

Deterministic software makes the experience reliable.

Both layers should remain clearly separated as the project grows.
