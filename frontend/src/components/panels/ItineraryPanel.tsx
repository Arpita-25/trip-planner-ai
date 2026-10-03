import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import AddToItineraryDialog from "@/components/AddToItineraryDialog";
import AiModificationSheet from "@/components/AiModificationSheet";
import ItineraryDayView from "@/components/ItineraryDayView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { errorDetail } from "@/hooks/useTrip";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Trip, TripPlanResponse } from "@/lib/types";

export default function ItineraryPanel({ trip }: { trip: Trip }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
    void queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const regenerate = useMutation({
    mutationFn: () => apiPost<TripPlanResponse>(`/trips/${trip.id}/ai/plan`),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message);
    },
    onError: (error) =>
      toast.error(errorDetail(error, "Our AI planner is unavailable right now. Please retry.")),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => apiDelete<Trip>(`/trips/${trip.id}/itinerary/items/${itemId}`),
    onSuccess: () => {
      invalidate();
      toast.success("Removed from your itinerary");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't remove that item.")),
  });

  const moveItem = useMutation({
    mutationFn: ({ itemId, dayNumber }: { itemId: string; dayNumber: number }) =>
      apiPut<Trip>(`/trips/${trip.id}/itinerary/items/${itemId}`, { day_number: dayNumber }),
    onSuccess: () => {
      invalidate();
      toast.success("Moved");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't move that item.")),
  });

  return (
    <div className="space-y-6" data-testid="itinerary-panel">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-semibold">Your itinerary</h2>
          <p className="text-sm text-stone-600">
            {trip.itinerary.length} days planned
            {trip.itinerary_source === "fallback" && " · built from our destination guide"}
          </p>
        </div>
        <AiModificationSheet trip={trip} />
        <AddToItineraryDialog
          trip={trip}
          testId="itinerary-add-activity-button"
          trigger={
            <Button variant="outline">
              <Plus className="size-4" /> Add activity
            </Button>
          }
        />
        <Button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          data-testid="itinerary-regenerate-button"
        >
          <RefreshCw className={regenerate.isPending ? "size-4 animate-spin" : "size-4"} />
          {regenerate.isPending ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>

      {regenerate.isPending && (
        <div
          className="animate-shimmer rounded-2xl bg-[linear-gradient(90deg,#F5EFE6_0%,#FFFBF5_50%,#F5EFE6_100%)] bg-[length:400px_100%] p-6 text-sm text-stone-600"
          data-testid="itinerary-regenerating"
        >
          Rebuilding your day-by-day plan…
        </div>
      )}

      {trip.itinerary.length === 0 ? (
        <Card data-testid="itinerary-empty-state">
          <CardHeader>
            <CardTitle className="font-display text-2xl">No itinerary yet</CardTitle>
            <CardDescription>
              Generate a day-by-day plan from your destination, dates and interests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
              Generate my itinerary
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {trip.itinerary.map((day) => (
            <ItineraryDayView
              key={day.id}
              day={day}
              trip={trip}
              onRemoveItem={(itemId) => removeItem.mutate(itemId)}
              onMoveItem={(itemId, dayNumber) => moveItem.mutate({ itemId, dayNumber })}
              pendingItemId={
                removeItem.isPending ? removeItem.variables : moveItem.isPending ? moveItem.variables?.itemId : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
