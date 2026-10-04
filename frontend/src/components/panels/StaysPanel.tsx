import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";

import Field from "@/components/Field";
import StayCard from "@/components/StayCard";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorDetail, useSavedOption } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import { addDays } from "@/lib/format";
import type { StayOption, StaySearchRequest, Trip } from "@/lib/types";

const PROPERTY_LABELS: Record<string, string> = {
  any: "Any property type",
  Hotel: "Hotel",
  Resort: "Resort",
  Villa: "Villa",
  "Boutique Hotel": "Boutique hotel",
  Hostel: "Hostel",
  Apartment: "Apartment",
};
const RATING_LABELS: Record<string, string> = {
  "0": "Any rating",
  "4": "4.0+",
  "4.5": "4.5+",
};
const SORT_LABELS: Record<string, string> = {
  match: "Best preference match",
  price_low: "Price: low to high",
  price_high: "Price: high to low",
  rating: "Highest rated",
};

/** Check-in/out defaults derive from where the city sits in the itinerary. */
function cityWindow(trip: Trip, city: string): { checkIn: string; checkOut: string } {
  let offset = 0;
  for (const stay of trip.cities) {
    if (stay.name === city) {
      return {
        checkIn: addDays(trip.start_date, offset),
        checkOut: addDays(trip.start_date, offset + stay.days),
      };
    }
    offset += stay.days;
  }
  return { checkIn: trip.start_date, checkOut: addDays(trip.start_date, 2) };
}

export default function StaysPanel({ trip }: { trip: Trip }) {
  const cities = trip.cities.length ? trip.cities.map((city) => city.name) : [trip.destination];
  const [city, setCity] = useState(cities[0]);
  const initialWindow = cityWindow(trip, cities[0]);
  const [checkIn, setCheckIn] = useState(initialWindow.checkIn);
  const [checkOut, setCheckOut] = useState(initialWindow.checkOut);
  const [guests, setGuests] = useState(String(trip.travelers));
  const [rooms, setRooms] = useState("1");
  const [nightlyBudget, setNightlyBudget] = useState("6000");
  const [propertyType, setPropertyType] = useState("any");
  const [needsPool, setNeedsPool] = useState(false);
  const [nearBeach, setNearBeach] = useState(false);
  const [nearCenter, setNearCenter] = useState(false);
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState<StaySearchRequest["sort_by"]>("match");
  const [results, setResults] = useState<StayOption[] | null>(null);

  const { save, remove, pending } = useSavedOption(trip.id, "stays");

  const search = useMutation({
    mutationFn: (payload: StaySearchRequest) =>
      apiPost<StayOption[]>(`/trips/${trip.id}/stays/search`, payload),
    onSuccess: (data) => setResults(data),
    onError: (error) =>
      toast.error(errorDetail(error, "We couldn't retrieve stays right now. Try again in a moment.")),
  });

  const onCityChange = (value: string) => {
    setCity(value);
    const window = cityWindow(trip, value);
    setCheckIn(window.checkIn);
    setCheckOut(window.checkOut);
  };

  const runSearch = () => {
    search.mutate({
      city,
      check_in: checkIn,
      check_out: checkOut,
      guests: Math.max(1, Number(guests) || 1),
      rooms: Math.max(1, Number(rooms) || 1),
      nightly_budget: nightlyBudget ? Math.max(0, Number(nightlyBudget)) : null,
      property_types: propertyType === "any" ? [] : [propertyType],
      needs_pool: needsPool,
      near_beach: nearBeach,
      near_center: nearCenter,
      min_rating: Number(minRating) || 0,
      amenities: [],
      sort_by: sortBy,
    });
  };

  const savedIds = new Set(trip.stays.map((stay) => stay.id));

  return (
    <div className="space-y-6" data-testid="stays-panel">
      <div>
        <h2 className="font-display text-3xl font-semibold">Stays</h2>
        <p className="text-sm text-stone-600">
          Ranked against your preferences by deterministic code — every match score comes with its
          reasons.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Search accommodation</CardTitle>
          <CardDescription>One search per city in your itinerary</CardDescription>
          <CardAction>
            <Button onClick={runSearch} disabled={search.isPending} data-testid="stay-search-button">
              <Search className="size-4" />
              {search.isPending ? "Searching…" : "Search stays"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="City">
              <Select value={city} onValueChange={onCityChange}>
                <SelectTrigger data-testid="stay-city-select">
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
            <Field label="Check-in">
              <Input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                data-testid="stay-checkin-input"
              />
            </Field>
            <Field label="Check-out">
              <Input
                type="date"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                data-testid="stay-checkout-input"
              />
            </Field>
            <Field label="Budget per night">
              <Input
                type="number"
                min={0}
                value={nightlyBudget}
                onChange={(event) => setNightlyBudget(event.target.value)}
                data-testid="stay-nightly-budget-input"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Guests">
              <Input
                type="number"
                min={1}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                data-testid="stay-guests-input"
              />
            </Field>
            <Field label="Rooms">
              <Input
                type="number"
                min={1}
                value={rooms}
                onChange={(event) => setRooms(event.target.value)}
                data-testid="stay-rooms-input"
              />
            </Field>
            <Field label="Property type">
              <Select value={propertyType} onValueChange={(value: string) => setPropertyType(value)}>
                <SelectTrigger data-testid="stay-property-type-select">
                  <SelectValue>{(value) => PROPERTY_LABELS[String(value)]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Minimum rating">
              <Select value={minRating} onValueChange={(value: string) => setMinRating(value)}>
                <SelectTrigger data-testid="stay-rating-select">
                  <SelectValue>{(value) => RATING_LABELS[String(value)]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RATING_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sort by">
              <Select
                value={sortBy}
                onValueChange={(value: string) => setSortBy(value as StaySearchRequest["sort_by"])}
              >
                <SelectTrigger data-testid="stay-sort-select">
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

          <div className="flex flex-wrap items-center gap-5">
            <ToggleField
              id="stay-pool"
              label="Swimming pool"
              checked={needsPool}
              onChange={setNeedsPool}
              testId="stay-pool-checkbox"
            />
            <ToggleField
              id="stay-beach"
              label="Near the beach"
              checked={nearBeach}
              onChange={setNearBeach}
              testId="stay-beach-checkbox"
            />
            <ToggleField
              id="stay-center"
              label="Near the city centre"
              checked={nearCenter}
              onChange={setNearCenter}
              testId="stay-center-checkbox"
            />
          </div>
        </CardContent>
      </Card>

      {trip.stays.length > 0 && (
        <section className="space-y-3" data-testid="saved-stays-section">
          <h3 className="font-display text-2xl font-semibold">Saved to this trip</h3>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trip.stays.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                saved
                pending={pending}
                onToggleSave={() => remove.mutate(stay.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {search.isPending && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-testid="stays-loading">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-80 animate-pulse rounded-2xl bg-sand" />
            ))}
          </div>
        )}

        {!search.isPending && results !== null && (
          <>
            <h3 className="font-display text-2xl font-semibold" data-testid="stay-results-heading">
              {results.length} stay{results.length === 1 ? "" : "s"} in {city}
            </h3>
            {results.length === 0 && (
              <p className="text-sm text-stone-600" data-testid="stays-no-results">
                Nothing matched those filters. Try raising your nightly budget or clearing a filter.
              </p>
            )}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((stay) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  saved={savedIds.has(stay.id)}
                  pending={pending}
                  onToggleSave={() =>
                    savedIds.has(stay.id) ? remove.mutate(stay.id) : save.mutate(stay)
                  }
                />
              ))}
            </div>
          </>
        )}

        {!search.isPending && results === null && trip.stays.length === 0 && (
          <p className="text-sm text-stone-600" data-testid="stays-idle-state">
            Search above to see ranked stays with an explainable preference match for each city.
          </p>
        )}
      </section>
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
  testId,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} data-testid={testId} />
      <Label htmlFor={id} className="text-sm font-normal text-stone-700">
        {label}
      </Label>
    </div>
  );
}
