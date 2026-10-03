import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api";
import type { BudgetBreakdown, Trip, TripSummary } from "@/lib/types";

export function errorDetail(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown })?.detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return fallback;
}

export function useTrips() {
  return useQuery<TripSummary[]>({
    queryKey: ["trips"],
    queryFn: () => apiGet<TripSummary[]>("/trips"),
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery<Trip>({
    queryKey: ["trip", tripId],
    queryFn: () => apiGet<Trip>(`/trips/${tripId}`),
    enabled: Boolean(tripId),
  });
}

export function useTripBudget(tripId: string | undefined) {
  return useQuery<BudgetBreakdown>({
    queryKey: ["trip", tripId, "budget"],
    queryFn: () => apiGet<BudgetBreakdown>(`/trips/${tripId}/budget`),
    enabled: Boolean(tripId),
  });
}

type Kind = "flights" | "stays" | "explore";

/** Save/remove a provider option on the trip, then refresh the trip + its budget. */
export function useSavedOption(tripId: string, kind: Kind) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    void queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const save = useMutation({
    mutationFn: (option: unknown) => apiPost<Trip>(`/trips/${tripId}/${kind}`, option),
    onSuccess: () => {
      invalidate();
      toast.success("Saved to your trip");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't save that. Please try again.")),
  });

  const remove = useMutation({
    mutationFn: (optionId: string) => apiDelete<Trip>(`/trips/${tripId}/${kind}/${optionId}`),
    onSuccess: () => {
      invalidate();
      toast.success("Removed from your trip");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't remove that. Please try again.")),
  });

  return { save, remove, pending: save.isPending || remove.isPending };
}
