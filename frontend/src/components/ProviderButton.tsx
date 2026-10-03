import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Booking, payment and confirmation always happen on the provider's own site. */
export function ProviderButton({
  url,
  label = "View & book",
  testId,
  variant = "default",
}: {
  url: string;
  label?: string;
  testId: string;
  variant?: "default" | "outline";
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(buttonVariants({ variant, size: "sm" }), "shrink-0")}
      data-testid={testId}
    >
      {label} <ExternalLink className="size-3.5" />
    </a>
  );
}

export function ProviderTag({
  provider,
  mode,
  testId,
}: {
  provider: string;
  mode: "mock" | "real";
  testId?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" data-testid={testId}>
      <span className="label-mono text-stone-400">{provider}</span>
      <Badge
        variant={mode === "mock" ? "outline" : "secondary"}
        className={cn(
          "label-mono px-1.5 py-0",
          mode === "mock" && "border-amber-300 bg-amber-50 text-amber-800",
        )}
      >
        {mode === "mock" ? "Mock data" : "Live"}
      </Badge>
    </span>
  );
}
