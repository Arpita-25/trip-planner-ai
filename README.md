# VoyageAI ✈️

> **AI-powered travel planning, discovery, and trip management platform**

VoyageAI is an AI-assisted travel planning application that turns a natural-language travel request into a structured, editable trip.

A user can describe a trip such as:

> "Plan me a 7-day Thailand trip for two people with beaches, nightlife, good food, and a moderate budget."

VoyageAI transforms that intent into a structured trip containing an itinerary, destination discovery, flights, stays, activities, and a deterministic budget.

The application is designed around an important principle:

> **AI handles language and planning intelligence; deterministic application code handles dates, budgets, validation, persistence, ranking, authentication, and business rules.**

---

## 🚧 Project Status

**Status: Active development**

VoyageAI was originally bootstrapped using Emergent, but the project has evolved significantly beyond the original starter application.

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

VoyageAI aims to provide a single workspace where a traveler can:

1. Describe a trip naturally.
2. Generate an initial trip plan using AI.
3. Edit and regenerate the itinerary.
4. Discover flights and stays.
5. Discover restaurants, nightlife, activities, and places.
6. Save interesting options.
7. Track a deterministic trip budget.
8. Ask an AI
