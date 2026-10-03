import { Luggage, Plane } from "lucide-react";

import { ProviderButton, ProviderTag } from "@/components/ProviderButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatClock, formatDuration, formatMoney } from "@/lib/format";
import type { FlightOption } from "@/lib/types";

interface Props {
  flight: FlightOption;
  travelers: number;
  saved: boolean;
  onToggleSave: () => void;
  pending?: boolean;
}

export default function FlightCard({ flight, travelers, saved, onToggleSave, pending }: Props) {
  return (
    <div
      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-sand-line bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-400 hover:shadow-md md:flex-row md:items-center"
      data-testid={`flight-card-${flight.id}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand font-mono text-sm font-semibold text-teal">
          {flight.airline_code}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-stone-900">{flight.airline}</p>
            <span className="label-mono text-stone-400">{flight.flight_number}</span>
            <Badge variant="secondary" className="label-mono">
              {flight.cabin_class.replace("_", " ")}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatClock(flight.departure_time)}
              </p>
              <p className="label-mono text-stone-400">{flight.departure_airport}</p>
            </div>
            <div className="flex min-w-[5.5rem] flex-1 flex-col items-center">
              <span className="label-mono text-stone-400">{formatDuration(flight.duration_minutes)}</span>
              <span className="relative my-1 h-px w-full bg-sand-line">
                <Plane className="absolute -top-[7px] right-0 size-3.5 text-terracotta" />
              </span>
              <span className="label-mono text-stone-500">
                {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
              </span>
            </div>
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatClock(flight.arrival_time)}
              </p>
              <p className="label-mono text-stone-400">{flight.arrival_airport}</p>
            </div>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <Luggage className="size-3.5" /> {flight.baggage}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-start gap-2 md:w-auto md:items-end">
        <p className="font-mono text-2xl font-semibold tabular-nums" data-testid={`flight-price-${flight.id}`}>
          {formatMoney(flight.price, flight.currency)}
        </p>
        <p className="label-mono text-stone-400">
          total for {travelers} traveller{travelers > 1 ? "s" : ""}
        </p>
        <ProviderTag provider={flight.provider} mode={flight.provider_mode} />
        <div className="flex items-center gap-2">
          <Button
            variant={saved ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleSave}
            disabled={pending}
            data-testid={`flight-save-button-${flight.id}`}
          >
            {saved ? "Saved to trip" : "Save to trip"}
          </Button>
          <ProviderButton url={flight.booking_url} label="Book" testId={`flight-book-link-${flight.id}`} />
        </div>
      </div>
    </div>
  );
}
