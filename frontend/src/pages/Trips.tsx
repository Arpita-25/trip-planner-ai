import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiDelete } from "@/lib/api";
import { errorDetail, useTrips } from "@/hooks/useTrip";
import { formatCompactMoney, formatDateRange, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All trips" },
  { value: "planned", label: "With itinerary" },
  { value: "draft", label: "Drafts" },
];

export default function Trips() {
  const { data, isLoading, isError } = useTrips();
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const removeTrip = useMutation({
    mutationFn: (tripId: string) => apiDelete<void>(`/trips/${tripId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip deleted");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't delete that trip.")),
  });

  const trips = (data ?? []).filter((trip) => {
    if (filter === "planned") return trip.itinerary_source !== "none";
    if (filter === "draft") return trip.itinerary_source === "none";
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10" data-testid="trips-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">My trips</h1>
          <p className="mt-1 text-stone-600">
            {data ? `${data.length} trip${data.length === 1 ? "" : "s"} saved` : "Loading your trips…"}
          </p>
        </div>
        <Button onClick={() => navigate("/create-trip")} data-testid="trips-create-button">
          <Plus className="size-4" /> Create new trip
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-all duration-150 active:scale-95",
              filter === option.value
                ? "border-terracotta bg-terracotta text-white"
                : "border-sand-line bg-white text-stone-600 hover:border-terracotta",
            )}
            data-testid={`trips-filter-${option.value}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="trips-loading">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-72 animate-pulse rounded-3xl bg-sand" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-8 text-sm text-stone-600" data-testid="trips-error-state">
          We couldn't load your trips right now. Please refresh in a moment.
        </p>
      )}

      {!isLoading && !isError && trips.length === 0 && (
        <div
          className="mt-8 rounded-3xl border border-sand-line bg-white p-10 text-center shadow-sm"
          data-testid="trips-empty-state"
        >
          <h2 className="font-display text-2xl font-semibold">No trips here yet</h2>
          <p className="mx-auto mt-2 max-w-md text-stone-600">
            Describe a trip in one sentence and we'll build the itinerary, or set it up manually.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className={buttonVariants()} data-testid="trips-empty-plan-link">
              Plan with AI
            </Link>
            <Link to="/create-trip" className={buttonVariants({ variant: "outline" })}>
              Create manually
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <article
            key={trip.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-sand-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            data-testid={`trip-card-${trip.id}`}
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={trip.cover_image}
                alt={trip.destination}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(28,25,23,0.78)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <Badge variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur">
                  {trip.destination}
                </Badge>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">{trip.title}</h2>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> {formatDateRange(trip.start_date, trip.end_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" /> {trip.travelers}
                </span>
              </div>

              <p className="text-sm text-stone-500">
                {trip.cities.map((city) => `${city.name} ${city.days}d`).join(" · ") || "No route yet"}
              </p>

              <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatCompactMoney(trip.budget_amount, trip.currency)}
                  </p>
                  <p className="label-mono text-stone-400">
                    {formatMoney(trip.estimated_cost, trip.currency)} planned
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeTrip.mutate(trip.id)}
                    disabled={removeTrip.isPending}
                    aria-label={`Delete ${trip.title}`}
                    data-testid={`trip-delete-button-${trip.id}`}
                  >
                    <Trash2 className="size-4 text-stone-400 transition-colors duration-150 hover:text-red-600" />
                  </Button>
                  <Link
                    to={`/trips/${trip.id}`}
                    className={buttonVariants({ size: "sm" })}
                    data-testid={`trip-open-link-${trip.id}`}
                  >
                    Open <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
