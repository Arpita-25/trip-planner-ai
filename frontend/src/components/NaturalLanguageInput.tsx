import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLES = [
  "Plan me a 7-day Thailand trip. I want beaches, beach hopping and nightlife. I care less about temples and museums. My budget is \u20B91.2 lakh.",
  "5 days in Tokyo & Kyoto for street food, anime spots and quiet tea houses with a \u20B92.5 lakh budget",
  "Weekend trip from Bangalore to Goa under \u20B920,000 with beach shacks and live music",
];

interface Props {
  onSubmit: (prompt: string) => void;
  pending?: boolean;
  compact?: boolean;
}

export default function NaturalLanguageInput({ onSubmit, pending = false, compact = false }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const prompt = value.trim();
    if (prompt.length < 3 || pending) return;
    onSubmit(prompt);
  };

  return (
    <div className="w-full" data-testid="natural-language-input">
      <div className="rounded-2xl border-2 border-sand-line bg-white/95 p-3 shadow-xl backdrop-blur-xl transition-colors duration-300 focus-within:border-terracotta sm:p-4">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
          }}
          rows={compact ? 2 : 3}
          placeholder="Describe your trip — where, how long, what you love, and your budget…"
          className="min-h-0 resize-none border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0 md:text-base"
          data-testid="plan-trip-prompt-input"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-2">
          <p className="label-mono text-stone-400">AI reads intent · code does the math</p>
          <Button
            onClick={submit}
            disabled={pending || value.trim().length < 3}
            className="group"
            data-testid="generate-trip-button"
          >
            {pending ? (
              <>
                <Sparkles className="size-4 animate-pulse" /> Planning your trip…
              </>
            ) : (
              <>
                <Wand2 className="size-4 transition-transform duration-200 group-hover:-rotate-12" />
                Plan my trip
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="label-mono text-stone-500">Try one of these</span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example, index) => (
            <button
              key={example}
              type="button"
              onClick={() => setValue(example)}
              className="max-w-full truncate rounded-full border border-sand-line bg-white px-3.5 py-2 text-left text-sm text-stone-600 transition-all duration-150 hover:border-terracotta hover:text-stone-900 active:scale-95"
              data-testid={`example-prompt-${index + 1}`}
            >
              {example.length > 74 ? `${example.slice(0, 74)}…` : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
