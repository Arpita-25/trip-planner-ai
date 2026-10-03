import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { BudgetBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

const TINTS: Record<string, string> = {
  flights: "bg-terracotta",
  stays: "bg-teal",
  food: "bg-amber-500",
  nightlife: "bg-violet-500",
  activities: "bg-emerald-600",
  places: "bg-sky-600",
  shopping: "bg-lime-600",
  transport: "bg-stone-500",
};

interface Props {
  budget?: BudgetBreakdown;
  travelers: number;
  loading?: boolean;
}

/** Pure presentation — every figure here is computed by backend/lib/budget.py. */
export default function BudgetCalculator({ budget, travelers, loading }: Props) {
  if (!budget) {
    return (
      <Card data-testid="budget-breakdown-card">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Estimated trip cost</CardTitle>
          <CardDescription>
            {loading ? "Calculating your budget…" : "Budget appears once your trip loads."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-xl bg-sand" />
        </CardContent>
      </Card>
    );
  }

  const lines = budget.lines.filter((line) => line.amount > 0);
  const maxAmount = Math.max(1, ...lines.map((line) => line.amount));

  return (
    <Card data-testid="budget-breakdown-card">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Estimated trip cost</CardTitle>
        <CardDescription>
          Calculated from your saved flights, stays and every itinerary item — never estimated by AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {lines.length === 0 && (
            <p className="text-sm text-stone-500" data-testid="budget-empty-state">
              Nothing costed yet. Generate an itinerary or save a flight to see the breakdown.
            </p>
          )}
          {lines.map((line) => (
            <div key={line.category} data-testid={`budget-line-${line.category}`}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-stone-700">{line.label}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatMoney(line.amount, budget.currency)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", TINTS[line.category] ?? "bg-stone-400")}
                  style={{ width: `${Math.max(3, (line.amount / maxAmount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl bg-sand p-5">
          <Row label="Estimated total" value={formatMoney(budget.total, budget.currency)} strong testId="budget-total" />
          <Row label="Your budget" value={formatMoney(budget.budget, budget.currency)} testId="budget-limit" />
          <div className="h-px bg-sand-line" />
          <Row
            label={budget.over_budget ? "Over budget by" : "Remaining"}
            value={formatMoney(Math.abs(budget.remaining), budget.currency)}
            strong
            tone={budget.over_budget ? "bad" : "good"}
            testId="budget-remaining"
          />
          <Row
            label={`Per traveller (${travelers})`}
            value={formatMoney(budget.per_traveler, budget.currency)}
            testId="budget-per-traveller"
          />
          <div className="pt-2">
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700",
                  budget.over_budget ? "bg-red-500" : "bg-teal",
                )}
                style={{ width: `${Math.min(100, Math.max(2, budget.utilisation_percent))}%` }}
              />
            </div>
            <p className="label-mono mt-2 text-stone-500" data-testid="budget-utilisation">
              {budget.utilisation_percent}% of budget planned
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
  testId,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "good" | "bad";
  testId: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4" data-testid={testId}>
      <span className={cn("text-sm text-stone-600", strong && "font-medium text-stone-800")}>{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          strong ? "text-lg font-semibold" : "text-sm",
          tone === "good" && "text-emerald-700",
          tone === "bad" && "text-red-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}
