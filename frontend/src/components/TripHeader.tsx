import { CalendarDays, MapPin, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCompactMoney, formatDateRange, formatMoney } from "@/lib/format";
import type { BudgetBreakdown, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  trip: Trip;
  budget?: BudgetBreakdown;
  coverImage: string;
}

export default function TripHeader({ trip, budget, coverImage }: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-sand-line shadow-sm"
      data-testid="trip-header"
    >
      <img
        src={coverImage}
        alt={trip.destination}
        className="absolute inset-0 size-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,25,23,0.72)_0%,rgba(28,25,23,0.45)_55%,rgba(28,25,23,0.88)_100%)]" />
      <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/25 bg-white/15 text-white backdrop-blur" variant="outline">
            <MapPin className="size-3.5" /> {trip.destination}
          </Badge>
          {trip.itinerary_source !== "none" && (
            <Badge
              className="border-white/25 bg-white/15 text-white backdrop-blur"
              variant="outline"
              data-testid="trip-itinerary-source-badge"
            >
              {trip.itinerary_source === "ai" ? "AI generated" : "Guide generated"}
            </Badge>
          )}
          {trip.travel_style && (
            <Badge className="border-white/25 bg-white/15 text-white backdrop-blur" variant="outline">
              {trip.travel_style}
            </Badge>
          )}
        </div>

        <div>
          <h1
            className="font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl"
            data-testid="trip-title"
          >
            {trip.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-200 sm:text-base">
            {trip.cities.map((city) => `${city.name} · ${city.days}d`).join("   •   ") ||
              "Cities appear once your itinerary is generated"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Stat
            icon={<CalendarDays className="size-4" />}
            label="Dates"
            value={`${trip.duration_days} days`}
            sub={formatDateRange(trip.start_date, trip.end_date)}
            testId="trip-stat-dates"
          />
          <Stat
            icon={<Users className="size-4" />}
            label="Travellers"
            value={String(trip.travelers)}
            sub={trip.origin ? `from ${trip.origin}` : "origin not set"}
            testId="trip-stat-travellers"
          />
          <Stat
            icon={<Wallet className="size-4" />}
            label="Budget"
            value={formatCompactMoney(trip.budget_amount, trip.currency)}
            sub={
              budget
                ? `${formatMoney(budget.total, trip.currency)} planned · ${
                    budget.over_budget ? "over by " : "left "
                  }${formatMoney(Math.abs(budget.remaining), trip.currency)}`
                : "calculating…"
            }
            testId="trip-stat-budget"
            highlight={budget?.over_budget}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  testId,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  testId: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-[9.5rem] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md transition-colors duration-200 hover:bg-white/15",
        highlight && "border-red-300/50 bg-red-500/20",
      )}
      data-testid={testId}
    >
      <div className="flex items-center gap-1.5 text-stone-200">
        {icon}
        <span className="label-mono">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-stone-300">{sub}</p>
    </div>
  );
}
