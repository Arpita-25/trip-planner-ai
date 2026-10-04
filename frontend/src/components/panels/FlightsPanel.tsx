import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";

import Field from "@/components/Field";
import FlightCard from "@/components/FlightCard";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorDetail, useSavedOption } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { FlightOption, FlightSearchRequest, Trip } from "@/lib/types";

const CABIN_LABELS: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};
const STOP_LABELS: Record<string, string> = {
  any: "Any number of stops",
  "0": "Direct only",
  "1": "Up to 1 stop",
  "2": "Up to 2 stops",
};
const SORT_LABELS: Record<string, string> = {
  price: "Cheapest first",
  duration: "Fastest first",
  departure: "Earliest departure",
  stops: "Fewest stops",
};

export default function FlightsPanel({ trip }: { trip: Trip }) {
  const [origin, setOrigin] = useState(trip.origin || "Bangalore");
  const [destination, setDestination] = useState(trip.cities[0]?.name ?? trip.destination);
  const [departureDate, setDepartureDate] = useState(trip.start_date);
  const [returnDate, setReturnDate] = useState(trip.end_date);
  const [travelers, setTravelers] = useState(String(trip.travelers));
  const [cabinClass, setCabinClass] = useState<FlightSearchRequest["cabin_class"]>("economy");
  const [tripType, setTripType] = useState<FlightSearchRequest["trip_type"]>("round_trip");
  const [maxStops, setMaxStops] = useState("any");
  const [airline, setAirline] = useState("");
  const [sortBy, setSortBy] = useState<FlightSearchRequest["sort_by"]>("price");
  const [results, setResults] = useState<FlightOption[] | null>(null);

  const { save, remove, pending } = useSavedOption(trip.id, "flights");

  const search = useMutation({
    mutationFn: (payload: FlightSearchRequest) =>
      apiPost<FlightOption[]>(`/trips/${trip.id}/flights/search`, payload),
    onSuccess: (data) => setResults(data),
    onError: (error) =>
      toast.error(errorDetail(error, "We couldn't retrieve flight options right now. Try again in a moment.")),
  });

  const runSearch = () => {
    search.mutate({
      origin: origin.trim() || "Bangalore",
      destination: destination.trim() || trip.destination,
      departure_date: departureDate,
      return_date: tripType === "round_trip" ? returnDate : null,
      travelers: Math.max(1, Number(travelers) || 1),
      cabin_class: cabinClass,
      trip_type: tripType,
      max_stops: maxStops === "any" ? null : Number(maxStops),
      airlines: airline.trim() ? [airline.trim()] : [],
      max_price: null,
      sort_by: sortBy,
    });
  };

  const savedIds = new Set(trip.flights.map((flight) => flight.id));

  return (
    <div className="space-y-6" data-testid="flights-panel">
      <div>
        <h2 className="font-display text-3xl font-semibold">Flights</h2>
        <p className="text-sm text-stone-600">
          Options are normalised from every provider into one model. Booking and payment happen on
          the provider's own site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Search flights</CardTitle>
          <CardDescription>Dates default to your trip window</CardDescription>
          <CardAction>
            <Button onClick={runSearch} disabled={search.isPending} data-testid="flight-search-button">
              <Search className="size-4" />
              {search.isPending ? "Searching…" : "Search flights"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="From">
              <Input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="Bangalore"
                data-testid="flight-origin-input"
              />
            </Field>
            <Field label="To">
              <Input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Phuket"
                data-testid="flight-destination-input"
              />
            </Field>
            <Field label="Departure">
              <Input
                type="date"
                value={departureDate}
                onChange={(event) => setDepartureDate(event.target.value)}
                data-testid="flight-departure-date-input"
              />
            </Field>
            <Field label="Return">
              <Input
                type="date"
                value={returnDate}
                disabled={tripType === "one_way"}
                onChange={(event) => setReturnDate(event.target.value)}
                data-testid="flight-return-date-input"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Travellers">
              <Input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(event) => setTravelers(event.target.value)}
                data-testid="flight-travelers-input"
              />
            </Field>
            <Field label="Trip type">
              <Select
                value={tripType}
                onValueChange={(value: string) => setTripType(value as FlightSearchRequest["trip_type"])}
              >
                <SelectTrigger data-testid="flight-trip-type-select">
                  <SelectValue>
                    {(value) => (String(value) === "one_way" ? "One way" : "Round trip")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_trip">Round trip</SelectItem>
                  <SelectItem value="one_way">One way</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cabin">
              <Select
                value={cabinClass}
                onValueChange={(value: string) =>
                  setCabinClass(value as FlightSearchRequest["cabin_class"])
                }
              >
                <SelectTrigger data-testid="flight-cabin-select">
                  <SelectValue>{(value) => CABIN_LABELS[String(value)]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CABIN_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stops">
              <Select value={maxStops} onValueChange={(value: string) => setMaxStops(value)}>
                <SelectTrigger data-testid="flight-stops-select">
                  <SelectValue>{(value) => STOP_LABELS[String(value)]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STOP_LABELS).map(([value, label]) => (
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
                onValueChange={(value: string) => setSortBy(value as FlightSearchRequest["sort_by"])}
              >
                <SelectTrigger data-testid="flight-sort-select">
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

          <div className="flex flex-wrap items-end gap-4">
            <Field label="Preferred airline (optional)" className="min-w-[14rem] flex-1">
              <Input
                value={airline}
                onChange={(event) => setAirline(event.target.value)}
                placeholder="e.g. IndiGo"
                data-testid="flight-airline-input"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {trip.flights.length > 0 && (
        <section className="space-y-3" data-testid="saved-flights-section">
          <h3 className="font-display text-2xl font-semibold">Saved to this trip</h3>
          {trip.flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              travelers={trip.travelers}
              saved
              pending={pending}
              onToggleSave={() => remove.mutate(flight.id)}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        {search.isPending && (
          <div className="space-y-3" data-testid="flights-loading">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-sand" />
            ))}
          </div>
        )}

        {!search.isPending && results !== null && (
          <>
            <h3 className="font-display text-2xl font-semibold" data-testid="flight-results-heading">
              {results.length} option{results.length === 1 ? "" : "s"} found
            </h3>
            {results.length === 0 && (
              <p className="text-sm text-stone-600" data-testid="flights-no-results">
                No flights matched those filters. Try allowing more stops or clearing the airline
                filter.
              </p>
            )}
            {results.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                travelers={Math.max(1, Number(travelers) || 1)}
                saved={savedIds.has(flight.id)}
                pending={pending}
                onToggleSave={() =>
                  savedIds.has(flight.id) ? remove.mutate(flight.id) : save.mutate(flight)
                }
              />
            ))}
          </>
        )}

        {!search.isPending && results === null && trip.flights.length === 0 && (
          <p className="text-sm text-stone-600" data-testid="flights-idle-state">
            Search above to compare airlines, durations, stops and prices for this trip.
          </p>
        )}
      </section>
    </div>
  );
}
