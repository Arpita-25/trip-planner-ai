import { Check, MapPin, Star, Waves } from "lucide-react";

import { ProviderButton, ProviderTag } from "@/components/ProviderButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { StayOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  stay: StayOption;
  saved: boolean;
  onToggleSave: () => void;
  pending?: boolean;
}

export default function StayCard({ stay, saved, onToggleSave, pending }: Props) {
  const matchTone =
    stay.match_score >= 85
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : stay.match_score >= 70
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : "bg-stone-100 text-stone-700 border-stone-200";

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      data-testid={`stay-card-${stay.id}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={stay.images[0]}
          alt={stay.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Badge variant="outline" className="border-white/30 bg-black/45 text-white backdrop-blur">
            {stay.property_type}
          </Badge>
          <Badge
            variant="outline"
            className={cn("label-mono font-semibold", matchTone)}
            data-testid={`stay-match-score-${stay.id}`}
          >
            {stay.match_score}% match
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight">{stay.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
            <MapPin className="size-3.5" /> {stay.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            {stay.rating}
            <span className="text-stone-400">({stay.reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-stone-500">
            <Waves className="size-3.5" /> {stay.distance_to_beach_km} km to beach
          </span>
        </div>

        <ul className="space-y-1" data-testid={`stay-match-reasons-${stay.id}`}>
          {stay.match_reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-1.5 text-sm text-stone-600">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {reason}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-1.5">
          {stay.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-sand px-2.5 py-1 text-xs text-stone-600"
            >
              {amenity}
            </span>
          ))}
        </div>

        <p className="text-xs text-stone-500">
          {stay.room_type} · {stay.cancellation_policy}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums" data-testid={`stay-price-${stay.id}`}>
              {formatMoney(stay.price_per_night, stay.currency)}
            </p>
            <p className="label-mono text-stone-400">
              per night · {formatMoney(stay.total_price, stay.currency)} for {stay.nights} night
              {stay.nights > 1 ? "s" : ""}
            </p>
          </div>
          <ProviderTag provider={stay.provider} mode={stay.provider_mode} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={saved ? "secondary" : "outline"}
            size="sm"
            className="flex-1"
            onClick={onToggleSave}
            disabled={pending}
            data-testid={`stay-save-button-${stay.id}`}
          >
            {saved ? "Saved to trip" : "Save to trip"}
          </Button>
          <ProviderButton url={stay.booking_url} label="View" testId={`stay-book-link-${stay.id}`} />
        </div>
      </div>
    </div>
  );
}
