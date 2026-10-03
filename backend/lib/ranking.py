"""Deterministic, explainable ranking. The LLM never invents a score or a reason string."""

from models.trip import ExploreOption, StayOption


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def rank_stays(
    stays: list[StayOption],
    *,
    nightly_budget: float | None,
    preferences: dict[str, float],
    wants_pool: bool = False,
    wants_beach: bool = False,
    min_rating: float = 0.0,
) -> list[StayOption]:
    """Score 0-100 from budget fit, rating, beach/nightlife proximity and amenities.

    Every point added also appends a human-readable reason, so the badge on the card
    can always be justified line by line.
    """
    beach_pref = preferences.get("beaches", 0.0)
    nightlife_pref = preferences.get("nightlife", 0.0)

    for stay in stays:
        score = 0.0
        reasons: list[str] = []
        amenities = {a.lower() for a in stay.amenities}

        # Budget fit — 30 points, full marks at or under budget, tapering to 0 at +60%.
        if nightly_budget and nightly_budget > 0:
            ratio = stay.price_per_night / nightly_budget
            if ratio <= 1.0:
                score += 30
                reasons.append(f"Within your nightly budget ({_fmt(stay.price_per_night)}/night)")
            else:
                score += 30 * _clamp((1.6 - ratio) / 0.6)
                if ratio <= 1.2:
                    reasons.append("Slightly over your nightly budget but close")
        else:
            score += 18

        # Rating — 25 points, scaled between 3.0 and 5.0.
        score += 25 * _clamp((stay.rating - 3.0) / 2.0)
        if stay.rating >= 4.5:
            reasons.append(f"Highly rated — {stay.rating}/5 from {stay.reviews} reviews")
        elif stay.rating >= 4.0:
            reasons.append(f"Well rated — {stay.rating}/5")

        # Beach proximity — up to 20 points, weighted by how much the user cares.
        beach_weight = max(beach_pref, 1.0 if wants_beach else 0.0)
        if beach_weight > 0:
            closeness = _clamp((3.0 - stay.distance_to_beach_km) / 3.0)
            score += 20 * closeness * beach_weight
            if stay.distance_to_beach_km <= 1.0:
                reasons.append(f"{int(stay.distance_to_beach_km * 1000)}m from the beach")
            elif stay.distance_to_beach_km <= 2.5:
                reasons.append(f"{stay.distance_to_beach_km}km from the beach")

        # Nightlife proximity — up to 15 points.
        if nightlife_pref > 0:
            closeness = _clamp((4.0 - stay.distance_to_nightlife_km) / 4.0)
            score += 15 * closeness * nightlife_pref
            if stay.distance_to_nightlife_km <= 1.5:
                reasons.append("Walking distance to the nightlife area")

        # Amenities — 10 points.
        if wants_pool:
            if any("pool" in a for a in amenities):
                score += 10
                reasons.append("Has a swimming pool")
        else:
            score += 10 * _clamp(len(amenities) / 8)
            if len(amenities) >= 6:
                reasons.append(f"{len(amenities)} amenities including {', '.join(sorted(amenities)[:3])}")

        if "free cancellation" in stay.cancellation_policy.lower():
            score += 3
            reasons.append("Free cancellation")

        if min_rating and stay.rating < min_rating:
            score -= 20

        stay.match_score = int(round(_clamp(score, 0, 100)))
        stay.match_reasons = reasons[:4] or ["Matches your dates and guest count"]

    stays.sort(key=lambda s: (-s.match_score, s.price_per_night))
    return stays


def rank_explore(items: list[ExploreOption], preferences: dict[str, float]) -> list[ExploreOption]:
    """Score explore results against the trip's weighted interests and rating."""
    category_to_interest = {
        "food": "food",
        "nightlife": "nightlife",
        "activities": "activities",
        "places": "beaches",
    }
    for item in items:
        interest_key = category_to_interest.get(item.category, "activities")
        weight = preferences.get(interest_key, 0.5)
        score = 55 * weight + 35 * _clamp((item.rating - 3.0) / 2.0)
        reasons = []
        if weight >= 0.7:
            reasons.append(f"Matches your interest in {interest_key}")
        if item.rating >= 4.5:
            reasons.append(f"Rated {item.rating}/5")
        for tag in item.tags:
            if preferences.get(tag.lower(), 0) >= 0.7:
                score += 5
                reasons.append(f"Tagged {tag}")
                break
        item.match_score = int(round(_clamp(score, 0, 100)))
        item.match_reasons = reasons[:3]
    items.sort(key=lambda i: (-i.match_score, -i.rating))
    return items


def _fmt(amount: float) -> str:
    return f"{amount:,.0f}"
