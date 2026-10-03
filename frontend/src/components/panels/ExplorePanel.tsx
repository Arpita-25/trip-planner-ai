import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import ExploreCard from "@/components/ExploreCard";
import Field from "@/components/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedOption } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { ExploreOption, ExploreSearchRequest, Trip } from "@/lib/types";

const TABS: { value: ExploreSearchRequest["category"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "food", label: "Food" },
  { value: "nightlife", label: "Nightlife" },
  { value: "activities", label: "Activities" },
  { value: "places", label: "Places & beaches" },
];

const SORT_LABELS: Record<string, string> = {
  match: "Best match",
  rating: "Highest rated",
  cost_low: "Cheapest first",
  cost_high: "Most premium",
};

export default function ExplorePanel({ trip }: { trip: Trip }) {
  const cities = trip.cities.length ? trip.cities.map((city) => city.name) : [trip.destination];
  const [city, setCity] = useState(cities[0]);
  const [category, setCategory] = useState<ExploreSearchRequest["category"]>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<ExploreSearchRequest["sort_by"]>("match");

  const { save, remove, pending } = useSavedOption(trip.id, "explore");

  const results = useQuery<ExploreOption[]>({
    queryKey: ["explore", trip.id, city, category, query, sortBy],
    queryFn: () =>
      apiPost<ExploreOption[]>(`/trips/${trip.id}/explore/search`, {
        city,
        category,
        query,
        max_cost: null,
        min_rating: 0,
        sort_by: sortBy,
      } satisfies ExploreSearchRequest),
  });

  const savedIds = new Set(trip.explore_items.map((item) => item.id));
  const items = results.data ?? [];

  return (
    <div className="space-y-6" data-testid="explore-panel">
      <div>
        <h2 className="font-display text-3xl font-semibold">Explore</h2>
        <p className="text-sm text-stone-600">
          Food, nightlife, activities and places for every city on your route — add any of them
          straight to a day.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-sand-line bg-white p-5 shadow-sm">
        <Tabs
          value={category}
          onValueChange={(value: string) => setCategory(value as ExploreSearchRequest["category"])}
        >
          <TabsList variant="line" className="flex-wrap">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-testid={`explore-tab-${tab.value}`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <Select value={city} onValueChange={(value: string) => setCity(value)}>
              <SelectTrigger data-testid="explore-city-select">
                <SelectValue>{(value) => String(value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {cities.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Search">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="beach club, street food…"
                className="pl-9"
                data-testid="explore-search-input"
              />
            </div>
          </Field>
          <Field label="Sort by">
            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value as ExploreSearchRequest["sort_by"])}
            >
              <SelectTrigger data-testid="explore-sort-select">
                <SelectValue>{(value) => SORT_LABELS[String(value)]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {trip.explore_items.length > 0 && (
        <section className="space-y-3" data-testid="saved-explore-section">
          <h3 className="font-display text-2xl font-semibold">Saved to this trip</h3>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trip.explore_items.map((item) => (
              <ExploreCard
                key={item.id}
                item={item}
                trip={trip}
                saved
                pending={pending}
                onToggleSave={() => remove.mutate(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {results.isPending && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-testid="explore-loading">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-sand" />
            ))}
          </div>
        )}

        {results.isError && (
          <p className="text-sm text-stone-600" data-testid="explore-error-state">
            We couldn't load places right now. Try again in a moment.
          </p>
        )}

        {!results.isPending && !results.isError && (
          <>
            <h3 className="font-display text-2xl font-semibold" data-testid="explore-results-heading">
              {items.length} place{items.length === 1 ? "" : "s"} in {city}
            </h3>
            {items.length === 0 && (
              <p className="text-sm text-stone-600" data-testid="explore-no-results">
                Nothing matched that search. Try a different keyword or category.
              </p>
            )}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ExploreCard
                  key={item.id}
                  item={item}
                  trip={trip}
                  saved={savedIds.has(item.id)}
                  pending={pending}
                  onToggleSave={() =>
                    savedIds.has(item.id) ? remove.mutate(item.id) : save.mutate(item)
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
