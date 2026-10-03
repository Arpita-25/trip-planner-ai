import { Clock, MapPin, Plus, Star } from "lucide-react";

import AddToItineraryDialog from "@/components/AddToItineraryDialog";
import { ProviderButton, ProviderTag } from "@/components/ProviderButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatMoney } from "@/lib/format";
import type { ExploreOption, SlotCategory, Trip } from "@/lib/types";

interface Props {
  item: ExploreOption;
  trip: Trip;
  saved: boolean;
  onToggleSave: () => void;
  pending?: boolean;
}

export default function ExploreCard({ item, trip, saved, onToggleSave, pending }: Props) {
  const category: SlotCategory = item.category === "places" ? "places" : item.category;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      data-testid={`explore-card-${item.id}`}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={item.images[0]}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge
          variant="outline"
          className="absolute top-3 left-3 border-white/30 bg-black/45 text-white backdrop-blur"
        >
          {item.type}
        </Badge>
        {item.match_score > 0 && (
          <Badge
            variant="outline"
            className="absolute top-3 right-3 label-mono border-emerald-200 bg-emerald-100 font-semibold text-emerald-900"
            data-testid={`explore-match-score-${item.id}`}
          >
            {item.match_score}% match
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="font-display text-lg font-semibold leading-tight">{item.name}</h3>
        <p className="flex items-center gap-1 text-sm text-stone-500">
          <MapPin className="size-3.5" /> {item.location}
        </p>
        <p className="line-clamp-2 text-sm text-stone-600">{item.description}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <Star className="size-4 fill-amber-400 text-amber-400" /> {item.rating}
            <span className="text-stone-400">({item.reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-stone-500">
            <Clock className="size-3.5" /> {formatDuration(item.duration_minutes)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-sand px-2.5 py-1 text-xs text-stone-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex items-end justify-between gap-2">
            <p className="font-mono text-lg font-semibold tabular-nums" data-testid={`explore-cost-${item.id}`}>
              {item.estimated_cost > 0 ? `${formatMoney(item.estimated_cost, item.currency)} pp` : "Free"}
            </p>
            <ProviderTag provider={item.provider} mode={item.provider_mode} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AddToItineraryDialog
              trip={trip}
              testId={`add-to-itinerary-btn-${item.id}`}
              prefill={{
                title: item.name,
                location: item.location,
                category,
                estimated_cost: item.estimated_cost,
                notes: item.type,
                booking_url: item.provider_url,
                provider: item.provider,
                source: "explore",
              }}
              trigger={
                <Button variant="default" size="sm">
                  <Plus className="size-4" /> Add to trip
                </Button>
              }
            />
            <Button
              variant={saved ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleSave}
              disabled={pending}
              data-testid={`explore-save-button-${item.id}`}
            >
              {saved ? "Saved" : "Save"}
            </Button>
            <ProviderButton
              url={item.provider_url}
              label="Open"
              variant="outline"
              testId={`explore-provider-link-${item.id}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
