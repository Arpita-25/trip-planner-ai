import { ExternalLink, MapPin, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_META, formatDayDate, formatMoney, formatSlotTime } from "@/lib/format";
import type { TripDay, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  day: TripDay;
  trip: Trip;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, dayNumber: number) => void;
  pendingItemId?: string | null;
}

export default function ItineraryDayView({ day, trip, onRemoveItem, onMoveItem, pendingItemId }: Props) {
  const dayCost = day.slots.reduce((sum, slot) => sum + slot.estimated_cost, 0);

  return (
    <article className="animate-rise" data-testid={`itinerary-day-${day.day_number}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-2xl font-semibold">Day {day.day_number}</h3>
        <span className="text-base font-medium text-terracotta" data-testid={`itinerary-day-${day.day_number}-city`}>
          {day.city}
        </span>
        <span className="label-mono text-stone-400">{formatDayDate(day.date)}</span>
        <span className="ml-auto font-mono text-sm text-stone-500" data-testid={`itinerary-day-${day.day_number}-cost`}>
          {formatMoney(dayCost, trip.currency)} / person
        </span>
      </div>
      {day.summary && <p className="mt-1 text-sm text-stone-600">{day.summary}</p>}

      <div className="relative mt-5 ml-2 space-y-4 border-l-2 border-sand-line pl-6">
        {day.slots.length === 0 && (
          <p className="text-sm text-stone-500" data-testid={`itinerary-day-${day.day_number}-empty`}>
            No plans for this day yet — add an activity or ask the AI to fill it in.
          </p>
        )}
        {day.slots.map((slot) => {
          const meta = CATEGORY_META[slot.category] ?? CATEGORY_META.activities;
          return (
            <div
              key={slot.id}
              className={cn(
                "group relative rounded-2xl border border-sand-line bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
                pendingItemId === slot.id && "opacity-50",
              )}
              data-testid={`itinerary-slot-${slot.id}`}
            >
              <span className="absolute top-6 -left-[1.9rem] size-3 rounded-full border-2 border-white bg-terracotta shadow" />
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <span className="font-mono text-sm font-semibold text-teal tabular-nums">
                  {formatSlotTime(slot.start_time)}–{formatSlotTime(slot.end_time)}
                </span>
                <Badge variant="outline" className={cn("label-mono", meta.tint)}>
                  {meta.label}
                </Badge>
                {slot.source === "explore" && (
                  <Badge variant="secondary" className="label-mono">
                    From Explore
                  </Badge>
                )}
                <div className="ml-auto flex items-center gap-1 opacity-100 sm:opacity-60 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="xs"
                          data-testid={`itinerary-slot-move-${slot.id}`}
                        >
                          Move
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Move to day</DropdownMenuLabel>
                        {trip.itinerary.map((target) => (
                          <DropdownMenuItem
                            key={target.day_number}
                            disabled={target.day_number === day.day_number}
                            onClick={() => onMoveItem(slot.id, target.day_number)}
                            data-testid={`itinerary-slot-move-${slot.id}-to-${target.day_number}`}
                          >
                            Day {target.day_number} — {target.city}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveItem(slot.id)}
                    data-testid={`itinerary-slot-remove-${slot.id}`}
                    aria-label={`Remove ${slot.title}`}
                  >
                    <Trash2 className="size-3.5 text-stone-400 transition-colors duration-150 hover:text-red-600" />
                  </Button>
                </div>
              </div>

              <h4 className="mt-2 text-base font-semibold text-stone-900">{slot.title}</h4>
              {slot.location && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
                  <MapPin className="size-3.5" /> {slot.location}
                </p>
              )}
              {slot.notes && <p className="mt-1.5 text-sm text-stone-600">{slot.notes}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {slot.estimated_cost > 0 ? `${formatMoney(slot.estimated_cost, trip.currency)} pp` : "Free"}
                </span>
                {slot.booking_url && (
                  <a
                    href={slot.booking_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-sm font-medium text-terracotta hover:underline"
                    data-testid={`itinerary-slot-link-${slot.id}`}
                  >
                    Open provider <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
