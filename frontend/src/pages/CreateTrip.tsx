import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Field from "@/components/Field";
import NaturalLanguageInput from "@/components/NaturalLanguageInput";
import PlanningOverlay from "@/components/PlanningOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorDetail } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { Trip, TripPlanResponse } from "@/lib/types";

const INTEREST_KEYS = ["beaches", "nightlife", "food", "activities", "culture", "shopping", "nature"];

const CURRENCIES: Record<string, string> = {
  INR: "\u20B9 INR",
  USD: "$ USD",
  EUR: "\u20AC EUR",
  GBP: "\u00A3 GBP",
};

const STYLES: Record<string, string> = {
  "": "No preference",
  "relaxed and slow": "Relaxed & slow",
  "beaches and nightlife": "Beaches & nightlife",
  "food focused": "Food focused",
  "adventure heavy": "Adventure heavy",
  "culture and history": "Culture & history",
};

export default function CreateTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("7");
  const [budget, setBudget] = useState("120000");
  const [currency, setCurrency] = useState("INR");
  const [travelers, setTravelers] = useState("2");
  const [style, setStyle] = useState("");
  const [interests, setInterests] = useState<Record<string, number>>(
    Object.fromEntries(INTEREST_KEYS.map((key) => [key, 0.5])),
  );

  const planWithAi = useMutation({
    mutationFn: (prompt: string) => apiPost<TripPlanResponse>("/ai/trips", { prompt }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(data.message);
      navigate(`/trips/${data.trip.id}`);
    },
    onError: (error) =>
      toast.error(errorDetail(error, "Our AI planner is unavailable. Use the manual form below.")),
  });

  const createManually = useMutation({
    mutationFn: () =>
      apiPost<Trip>("/trips", {
        destination: destination.trim(),
        origin: origin.trim(),
        start_date: startDate || null,
        duration_days: Math.min(30, Math.max(1, Number(duration) || 5)),
        budget_amount: Math.max(0, Number(budget) || 0),
        currency,
        travelers: Math.max(1, Number(travelers) || 1),
        cabin_class: "economy",
        travel_style: style,
        preferences: interests,
        raw_prompt: "",
      }),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip created — generate your itinerary next");
      navigate(`/trips/${trip.id}`);
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't create that trip.")),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" data-testid="create-trip-page">
      {planWithAi.isPending && <PlanningOverlay prompt={planWithAi.variables} />}
      <h1 className="font-display text-4xl font-semibold">Create a trip</h1>
      <p className="mt-2 text-stone-600">
        Describe it in a sentence, or fill in the details yourself — both end up as the same
        structured trip.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Describe it in your own words</CardTitle>
          <CardDescription>
            The AI extracts destination, duration, budget and weighted interests, then drafts the
            itinerary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NaturalLanguageInput
            compact
            onSubmit={(prompt) => planWithAi.mutate(prompt)}
            pending={planWithAi.isPending}
          />
        </CardContent>
      </Card>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-sand-line" />
        <span className="label-mono text-stone-400">or set it up manually</span>
        <div className="h-px flex-1 bg-sand-line" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Trip preferences</CardTitle>
          <CardDescription>You can change any of this later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination">
              <Input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Thailand"
                data-testid="create-destination-input"
              />
            </Field>
            <Field label="Flying from">
              <Input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="Bangalore"
                data-testid="create-origin-input"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Start date">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                data-testid="create-start-date-input"
              />
            </Field>
            <Field label="Days">
              <Input
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                data-testid="create-duration-input"
              />
            </Field>
            <Field label="Travellers">
              <Input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(event) => setTravelers(event.target.value)}
                data-testid="create-travelers-input"
              />
            </Field>
            <Field label="Travel style">
              <Select value={style} onValueChange={(value: string) => setStyle(value)}>
                <SelectTrigger data-testid="create-style-select">
                  <SelectValue>{(value) => STYLES[String(value)] ?? "No preference"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STYLES).map(([value, label]) => (
                    <SelectItem key={value || "none"} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total budget">
              <Input
                type="number"
                min={0}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                data-testid="create-budget-input"
              />
            </Field>
            <Field label="Currency">
              <Select value={currency} onValueChange={(value: string) => setCurrency(value)}>
                <SelectTrigger data-testid="create-currency-select">
                  <SelectValue>{(value) => CURRENCIES[String(value)]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-3">
            <span className="label-mono text-stone-500">What matters on this trip?</span>
            {INTEREST_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-4">
                <span className="w-24 text-sm capitalize text-stone-700">{key}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(interests[key] * 100)}
                  onChange={(event) =>
                    setInterests((prev) => ({ ...prev, [key]: Number(event.target.value) / 100 }))
                  }
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-sand accent-terracotta"
                  data-testid={`create-interest-${key}-slider`}
                />
                <span className="w-10 text-right font-mono text-sm text-stone-500">
                  {Math.round(interests[key] * 100)}
                </span>
              </div>
            ))}
          </div>

          <Button
            className="w-full sm:w-auto"
            disabled={createManually.isPending || destination.trim().length < 2}
            onClick={() => createManually.mutate()}
            data-testid="create-trip-submit-button"
          >
            {createManually.isPending ? "Creating…" : "Create trip"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
