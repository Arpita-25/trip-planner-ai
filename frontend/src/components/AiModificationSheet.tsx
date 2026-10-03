import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiPost } from "@/lib/api";
import type { Trip, TripPlanResponse } from "@/lib/types";

const SUGGESTIONS = [
  "Give me one more beach day and remove the temple visit",
  "Reduce Bangkok by one day",
  "Move the island trip to day 4",
  "Make this cheaper without removing nightlife",
  "Replace one activity with something more adventurous",
];

export default function AiModificationSheet({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (message: string) =>
      apiPost<TripPlanResponse>(`/trips/${trip.id}/ai/modify`, { message }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      setLastMessage(data.message);
      setInstruction("");
      toast.success("Itinerary updated");
    },
    onError: (error) => {
      const detail =
        error instanceof ApiError ? String((error.body as { detail?: string })?.detail ?? "") : "";
      toast.error(detail || "We couldn't apply that change. Please try again.");
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" data-testid="ask-ai-adjust-button">
            <Sparkles className="size-4" /> Ask AI to adjust
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-md" data-testid="ai-modification-sheet">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Ask AI to adjust</SheetTitle>
          <SheetDescription>
            Describe the change in plain words. The AI rewrites your structured itinerary — dates,
            day numbers and budget are recalculated by code.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <Textarea
            rows={4}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="e.g. Add another beach day in Krabi and drop the museum"
            data-testid="ai-modify-input"
          />

          <div className="space-y-2">
            <span className="label-mono text-stone-500">Common adjustments</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInstruction(suggestion)}
                  className="rounded-full border border-sand-line bg-white px-3 py-1.5 text-left text-xs text-stone-600 transition-all duration-150 hover:border-terracotta hover:text-stone-900 active:scale-95"
                  data-testid={`ai-modify-suggestion-${index + 1}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {mutation.isPending && (
            <div
              className="animate-shimmer rounded-xl bg-[linear-gradient(90deg,#F5EFE6_0%,#FFFBF5_50%,#F5EFE6_100%)] bg-[length:400px_100%] p-4 text-sm text-stone-600"
              data-testid="ai-modify-pending"
            >
              Rewriting your itinerary…
            </div>
          )}

          {lastMessage && !mutation.isPending && (
            <div
              className="rounded-xl border border-sand-line bg-sand p-4 text-sm text-stone-700"
              data-testid="ai-modify-result-message"
            >
              {lastMessage}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            onClick={() => instruction.trim() && mutation.mutate(instruction.trim())}
            disabled={mutation.isPending || instruction.trim().length < 3}
            data-testid="ai-modify-submit-button"
          >
            {mutation.isPending ? "Applying…" : "Apply change"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
