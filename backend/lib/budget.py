"""Deterministic budget math. No LLM ever computes these numbers."""

from models.trip import BudgetBreakdown, BudgetLine, Trip

# Per-traveller local transport allowance per day, and per intercity hop, in trip currency units.
LOCAL_TRANSPORT_PER_DAY = 600.0
INTERCITY_HOP = 3500.0

CATEGORY_LABELS = {
    "food": "Food & Dining",
    "nightlife": "Nightlife",
    "activities": "Activities",
    "places": "Places & Attractions",
    "shopping": "Shopping",
}


def compute_budget(trip: Trip) -> BudgetBreakdown:
    """Sum saved flights/stays plus itinerary slot costs into a category breakdown.

    Conventions: flight.price and stay.total_price are already totals for the whole
    party; itinerary slot estimated_cost is per traveller and is multiplied here.
    """
    travelers = max(1, trip.travelers)

    flights_total = round(sum(f.price for f in trip.flights), 2)
    stays_total = round(sum(s.total_price for s in trip.stays), 2)

    slot_totals: dict[str, float] = {key: 0.0 for key in CATEGORY_LABELS}
    for day in trip.itinerary:
        for slot in day.slots:
            if slot.category in slot_totals:
                slot_totals[slot.category] += slot.estimated_cost * travelers

    hops = max(0, len(trip.cities) - 1)
    transport_total = round(
        (LOCAL_TRANSPORT_PER_DAY * trip.duration_days + INTERCITY_HOP * hops) * travelers, 2
    )

    lines = [
        BudgetLine(category="flights", label="Flights", amount=flights_total),
        BudgetLine(category="stays", label="Stays", amount=stays_total),
    ]
    for key, label in CATEGORY_LABELS.items():
        lines.append(BudgetLine(category=key, label=label, amount=round(slot_totals[key], 2)))
    lines.append(BudgetLine(category="transport", label="Transport", amount=transport_total))

    total = round(sum(line.amount for line in lines), 2)
    remaining = round(trip.budget_amount - total, 2)
    utilisation = int(round((total / trip.budget_amount) * 100)) if trip.budget_amount > 0 else 0

    return BudgetBreakdown(
        currency=trip.currency,
        lines=lines,
        total=total,
        budget=round(trip.budget_amount, 2),
        remaining=remaining,
        per_traveler=round(total / travelers, 2),
        over_budget=remaining < 0,
        utilisation_percent=utilisation,
    )
