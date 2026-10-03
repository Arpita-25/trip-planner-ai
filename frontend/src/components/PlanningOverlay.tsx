import { useEffect, useState } from "react";
import { Compass } from "lucide-react";

const STAGES = [
  "Reading your request…",
  "Extracting destination, dates and budget…",
  "Weighting your interests…",
  "Choosing cities and splitting your days…",
  "Drafting each day hour by hour…",
  "Costing it up and saving your trip…",
];

/** Full-screen progress for the one genuinely slow call in the app (AI trip planning). */
export default function PlanningOverlay({ prompt }: { prompt?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF7F2]/95 px-5 backdrop-blur-sm"
      data-testid="planning-overlay"
    >
      <div className="w-full max-w-lg rounded-3xl border border-sand-line bg-white p-8 shadow-xl">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-terracotta text-white">
          <Compass className="size-6 animate-spin [animation-duration:3s]" />
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold">Planning your trip</h2>
        {prompt && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-500 italic">"{prompt}"</p>
        )}

        <ul className="mt-6 space-y-2.5">
          {STAGES.map((text, index) => (
            <li
              key={text}
              className={
                index <= stage
                  ? "flex items-center gap-2.5 text-sm text-stone-800"
                  : "flex items-center gap-2.5 text-sm text-stone-400"
              }
            >
              <span
                className={
                  index < stage
                    ? "size-2 rounded-full bg-emerald-500"
                    : index === stage
                      ? "size-2 animate-pulse rounded-full bg-terracotta"
                      : "size-2 rounded-full bg-sand-line"
                }
              />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-terracotta transition-[width] duration-1000"
            style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
          />
        </div>
        <p className="label-mono mt-3 text-stone-400">
          This takes up to a minute — we only do it once per trip
        </p>
      </div>
    </div>
  );
}
