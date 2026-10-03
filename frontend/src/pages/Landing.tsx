import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, Martini, Plane, Route, Sparkles, UtensilsCrossed, Wallet } from "lucide-react";
import { toast } from "sonner";

import NaturalLanguageInput from "@/components/NaturalLanguageInput";
import PlanningOverlay from "@/components/PlanningOverlay";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { errorDetail } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { TripPlanResponse } from "@/lib/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHx0aGFpbGFuZCUyMGJlYWNoJTIwdHJvcGljYWx8ZW58MHx8fHwxNzg2MTIyMjQ4fDA&ixlib=rb-4.1.0&q=85";

const PENDING_PROMPT_KEY = "voyage:pending-prompt";

const PILLARS = [
  { icon: <Route className="size-5" />, title: "Structured itineraries", body: "Day-by-day plans with real timings, places and per-person costs — editable, not a wall of text." },
  { icon: <Plane className="size-5" />, title: "Flight discovery", body: "Normalised options from every provider: airline, stops, duration, price. You book on their site." },
  { icon: <BedDouble className="size-5" />, title: "Explainable stays", body: "Match scores you can audit: budget fit, pool, beach distance, nightlife proximity." },
  { icon: <UtensilsCrossed className="size-5" />, title: "Food & nightlife", body: "Restaurants, street food, beach clubs and night markets, addable to any day in one tap." },
  { icon: <Martini className="size-5" />, title: "Activities & places", body: "Island hopping, water sports, viewpoints and neighbourhoods for each city on your route." },
  { icon: <Wallet className="size-5" />, title: "Honest budget", body: "Every total is computed by code from your saved items — the AI never does the arithmetic." },
];

export default function Landing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const plan = useMutation({
    mutationFn: (prompt: string) => apiPost<TripPlanResponse>("/ai/trips", { prompt }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(data.message);
      navigate(`/trips/${data.trip.id}`);
    },
    onError: (error) =>
      toast.error(
        errorDetail(error, "Our AI planner is unavailable right now. You can still build a trip manually."),
      ),
  });

  // A prompt entered before signing in is replayed once the session exists.
  useEffect(() => {
    if (!isAuthenticated || plan.isPending) return;
    const pending = sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_PROMPT_KEY);
      plan.mutate(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = (prompt: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_PROMPT_KEY, prompt);
      toast.info("Create a free account and we'll plan this trip straight away.");
      navigate("/register");
      return;
    }
    plan.mutate(prompt);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
      {plan.isPending && <PlanningOverlay prompt={plan.variables} />}
      <section className="relative mt-6 grid items-center gap-10 overflow-hidden rounded-3xl border border-sand-line bg-[#FAF7F2] px-5 py-12 shadow-sm sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-16">
        <div className="relative z-10 max-w-xl">
          <Badge variant="outline" className="border-sand-line bg-white">
            <Sparkles className="size-3.5 text-terracotta" /> AI travel operating system
          </Badge>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
            Plan your next trip
            <span className="block text-terracotta">in one sentence.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-stone-600 sm:text-lg">
            Describe where you want to go, how long you have and what you love. VoyageAI turns it
            into a structured, editable trip — itinerary, flights, stays, food, nightlife and a
            budget that always adds up.
          </p>

          <div className="mt-8">
            <NaturalLanguageInput
              onSubmit={handleSubmit}
              pending={plan.isPending || (isLoading && Boolean(sessionStorage.getItem(PENDING_PROMPT_KEY)))}
            />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="animate-drift relative overflow-hidden rounded-3xl border border-sand-line shadow-xl">
            <img src={HERO_IMAGE} alt="Longtail boats on a Thai beach" className="h-[30rem] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(28,25,23,0.85)_100%)] p-6">
              <p className="label-mono text-stone-300">Example trip</p>
              <p className="font-display text-2xl font-semibold text-white">7 Days in Thailand</p>
              <p className="mt-1 text-sm text-stone-200">Phuket · 2d   •   Krabi · 2d   •   Bangkok · 3d</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Beaches 95%", "Nightlife 90%", "Food 75%"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/25 bg-white/15 px-3 py-1 font-mono text-xs text-white backdrop-blur"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          One trip. Every decision in one place.
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Flights, stays, food, nightlife and activities all attach to the same trip — so your plan
          and your budget never drift apart.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-sand-line bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              data-testid={`landing-pillar-${pillar.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-sand text-teal">
                {pillar.icon}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-sand-line bg-white p-6 shadow-sm sm:p-10">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            { step: "01", title: "Describe it", body: "One sentence. The AI extracts destination, dates, budget and weighted interests." },
            { step: "02", title: "Get a real plan", body: "A structured multi-city itinerary you can edit, reorder or adjust conversationally." },
            { step: "03", title: "Discover & book", body: "Compare flights and stays, add food and nightlife, then book on the provider's site." },
          ].map((item) => (
            <div key={item.step}>
              <span className="font-mono text-sm text-terracotta">{item.step}</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-sand-line pt-8 text-sm text-stone-500">
        <p>
          VoyageAI is a discovery and planning platform. Checkout, payment, confirmation,
          cancellation and refunds are handled entirely by the third-party provider you are
          redirected to. Development provider data is labelled{" "}
          <span className="font-medium text-amber-700">Mock data</span>.
        </p>
      </footer>
    </div>
  );
}
