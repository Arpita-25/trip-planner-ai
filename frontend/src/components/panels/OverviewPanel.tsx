import { ArrowRight, Hotel, MapPinned, Plane, Sparkles } from "lucide-react";

import BudgetCalculator from "@/components/BudgetCalculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayDate, formatMoney } from "@/lib/format";
import type { BudgetBreakdown, Trip } from "@/lib/types";

interface Props {
  trip: Trip;
  budget?: BudgetBreakdown;
  onNavigate: (tab: string) => void;
}

export default function OverviewPanel({ trip, budget, onNavigate }: Props) {
  const interests = Object.entries(trip.preferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-12" data-testid="overview-panel">
      <div className="space-y-6 lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Your route</CardTitle>
            <CardDescription>
              {trip.cities.length} {trip.cities.length === 1 ? "city" : "cities"} across{" "}
              {trip.duration_days} days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trip.cities.length === 0 && (
              <p className="text-sm text-stone-500">
                Generate an itinerary to see your city-by-city route.
              </p>
            )}
            {trip.cities.map((city, index) => (
              <div
                key={`${city.name}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-sand-line bg-sand/60 p-4 transition-colors duration-200 hover:bg-sand"
                data-testid={`overview-city-${index + 1}`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-white font-mono text-sm font-semibold text-terracotta">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">{city.name}</p>
                  <p className="text-sm text-stone-500">
                    {city.days} {city.days === 1 ? "day" : "days"}
                  </p>
                </div>
                <MapPinned className="size-4 text-stone-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">What you asked for</CardTitle>
            <CardDescription>
              Extracted by AI, stored as structured preferences and used for every ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trip.raw_prompt && (
              <blockquote className="rounded-2xl border-l-4 border-terracotta bg-sand p-4 text-sm text-stone-700 italic">
                "{trip.raw_prompt}"
              </blockquote>
            )}
            <div className="flex flex-wrap gap-2" data-testid="overview-interests">
              {interests.length === 0 && (
                <p className="text-sm text-stone-500">No interest weights captured yet.</p>
              )}
              {interests.map(([key, weight]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="gap-1.5 border-sand-line bg-white px-3 py-1.5"
                >
                  <span className="capitalize">{key}</span>
                  <span className="font-mono text-xs text-terracotta">
                    {Math.round(weight * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <SavedTile
            icon={<Plane className="size-4" />}
            label="Saved flights"
            value={String(trip.flights.length)}
            detail={
              trip.flights.length
                ? formatMoney(
                    trip.flights.reduce((sum, flight) => sum + flight.price, 0),
                    trip.currency,
                  )
                : "none yet"
            }
            onClick={() => onNavigate("flights")}
            testId="overview-saved-flights"
          />
          <SavedTile
            icon={<Hotel className="size-4" />}
            label="Saved stays"
            value={String(trip.stays.length)}
            detail={
              trip.stays.length
                ? formatMoney(
                    trip.stays.reduce((sum, stay) => sum + stay.total_price, 0),
                    trip.currency,
                  )
                : "none yet"
            }
            onClick={() => onNavigate("stays")}
            testId="overview-saved-stays"
          />
          <SavedTile
            icon={<Sparkles className="size-4" />}
            label="Saved places"
            value={String(trip.explore_items.length)}
            detail="food, nightlife & more"
            onClick={() => onNavigate("explore")}
            testId="overview-saved-explore"
          />
        </div>

        <button
          type="button"
          onClick={() => onNavigate("map")}
          className="flex w-full items-center gap-4 rounded-2xl border border-sand-line bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          data-testid="overview-open-map-button"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand text-teal">
            <MapPinned className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold">See it on the map</span>
            <span className="block text-sm text-stone-600">
              How far the beaches, bars and restaurants are from your hotel
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-stone-400" />
        </button>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <BudgetCalculator budget={budget} travelers={trip.travelers} />

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Next few days</CardTitle>
            <CardDescription>A peek at the start of your itinerary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trip.itinerary.length === 0 && (
              <p className="text-sm text-stone-500">Nothing planned yet.</p>
            )}
            {trip.itinerary.slice(0, 3).map((day) => (
              <div key={day.id} className="rounded-xl border border-sand-line p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    Day {day.day_number} · {day.city}
                  </p>
                  <span className="label-mono text-stone-400">{formatDayDate(day.date)}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {day.slots.slice(0, 3).map((slot) => slot.title).join(" · ") || "Unplanned"}
                </p>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate("itinerary")}
              data-testid="overview-open-itinerary-button"
            >
              Open full itinerary <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SavedTile({
  icon,
  label,
  value,
  detail,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-sand-line bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <span className="flex items-center gap-1.5 text-stone-500">
        {icon}
        <span className="label-mono">{label}</span>
      </span>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
      <p className="text-xs text-stone-500">{detail}</p>
    </button>
  );
}
