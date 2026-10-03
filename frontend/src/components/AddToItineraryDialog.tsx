import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiPost } from "@/lib/api";
import { CATEGORY_META } from "@/lib/format";
import type { ItineraryItemCreate, SlotCategory, Trip } from "@/lib/types";

const CATEGORIES: SlotCategory[] = [
  "activities",
  "food",
  "nightlife",
  "places",
  "shopping",
  "transport",
  "stay",
];

interface Props {
  trip: Trip;
  prefill?: Partial<ItineraryItemCreate>;
  trigger: React.ReactNode;
  testId: string;
}

export default function AddToItineraryDialog({ trip, prefill, trigger, testId }: Props) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(String(prefill?.day_number ?? 1));
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [startTime, setStartTime] = useState(prefill?.start_time ?? "10:00");
  const [endTime, setEndTime] = useState(prefill?.end_time ?? "12:00");
  const [category, setCategory] = useState<SlotCategory>(prefill?.category ?? "activities");
  const [cost, setCost] = useState(String(prefill?.estimated_cost ?? 0));
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ItineraryItemCreate) =>
      apiPost<Trip>(`/trips/${trip.id}/itinerary/items`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Added to your itinerary");
      setOpen(false);
    },
    onError: (error) => {
      const detail = error instanceof ApiError ? String((error.body as { detail?: string })?.detail ?? "") : "";
      toast.error(detail || "We couldn't add that right now. Please try again.");
    },
  });

  const submit = () => {
    if (!title.trim()) {
      toast.error("Give this item a name first");
      return;
    }
    mutation.mutate({
      day_number: Number(day) || 1,
      start_time: startTime,
      end_time: endTime,
      title: title.trim(),
      location: prefill?.location ?? "",
      category,
      notes,
      estimated_cost: Math.max(0, Number(cost) || 0),
      booking_url: prefill?.booking_url ?? null,
      provider: prefill?.provider ?? null,
      source: prefill?.source ?? "user",
    });
  };

  const days = trip.itinerary.length
    ? trip.itinerary
    : [{ day_number: 1, city: trip.destination, date: trip.start_date }];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span data-testid={testId}>{trigger}</span>} />
      <DialogContent className="sm:max-w-lg" data-testid="add-to-itinerary-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add to itinerary</DialogTitle>
          <DialogDescription>
            Pick the day and time — your budget updates automatically once it's saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-title">What is it?</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sunset at Promthep Cape"
              data-testid="itinerary-item-title-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={day} onValueChange={(value: string) => setDay(value)}>
                <SelectTrigger data-testid="itinerary-item-day-select">
                  <SelectValue>
                    {(value) => {
                      const match = days.find((d) => String(d.day_number) === String(value));
                      return match ? `Day ${match.day_number} — ${match.city}` : "Pick a day";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {days.map((tripDay) => (
                    <SelectItem key={tripDay.day_number} value={String(tripDay.day_number)}>
                      Day {tripDay.day_number} — {tripDay.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value: string) => setCategory(value as SlotCategory)}>
                <SelectTrigger data-testid="itinerary-item-category-select">
                  <SelectValue>
                    {(value) => CATEGORY_META[String(value)]?.label ?? String(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CATEGORY_META[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-start">Start</Label>
              <Input
                id="item-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                data-testid="itinerary-item-start-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-end">End</Label>
              <Input
                id="item-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                data-testid="itinerary-item-end-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-cost">Cost / person</Label>
              <Input
                id="item-cost"
                type="number"
                min={0}
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                data-testid="itinerary-item-cost-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-notes">Notes</Label>
            <Textarea
              id="item-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
              data-testid="itinerary-item-notes-input"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} data-testid="itinerary-item-cancel-button">
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending} data-testid="itinerary-item-save-button">
            {mutation.isPending ? "Adding…" : "Add to trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
