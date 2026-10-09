import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass, MapPin, Sparkles, Wallet, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const PENDING_PROMPT_KEY = "Roamio:pending-prompt";

type FloatCard = {
  city: string;
  country: string;
  flag: string;
  dot: string;
  image: string;
  tilt: number;
  position: string;
  animation: string;
  delay: string;
};

const FLOAT_CARDS: FloatCard[] = [
  {
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    dot: "#E63946",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=360&q=70",
    tilt: -6,
    position: "left-[6%] top-[6%] w-[9rem] sm:w-40 lg:w-44",
    animation: "animate-float-slow",
    delay: "0s",
  },
  {
    city: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    dot: "#C73E62",
    image:
      "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=360&q=70",
    tilt: 5,
    position: "left-[2%] bottom-[6%] w-[9rem] sm:w-40 lg:w-44",
    animation: "animate-float",
    delay: "1.3s",
  },
  {
    city: "Istanbul",
    country: "Turkey",
    flag: "🇹🇷",
    dot: "#D93939",
    image:
      "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=360&q=70",
    tilt: -4,
    position: "right-[4%] top-[4%] w-[9rem] sm:w-40 lg:w-44",
    animation: "animate-float-fast",
    delay: "0.6s",
  },
  {
    city: "Delhi",
    country: "India",
    flag: "🇮🇳",
    dot: "#F97316",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=360&q=70",
    tilt: 6,
    position: "right-[2%] bottom-[8%] w-[9rem] sm:w-40 lg:w-44",
    animation: "animate-float-slow",
    delay: "2.1s",
  },
];

const SUGGESTIONS = [
  { icon: "✨", label: "Inspire me where to go", prompt: "Inspire me — surprise me with a destination for a 5-day trip under ₹1 lakh." },
  { icon: "🧭", label: "Plan a weekend escape", prompt: "Plan a weekend trip from Bangalore with beaches, good food and a chill vibe." },
  { icon: "🏖️", label: "Family hotels in Dubai", prompt: "Find family-friendly hotels in Dubai for a 5-day trip in December with 2 kids." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [value, setValue] = useState("");

  // A prompt entered before signing in is replayed once the session exists.
  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_PROMPT_KEY);
      navigate(`/plan?prompt=${encodeURIComponent(pending)}`);
    }
  }, [isAuthenticated, navigate]);

  const start = (prompt: string) => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return;
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_PROMPT_KEY, trimmed);
      navigate("/register");
      return;
    }
    navigate(`/plan?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* --- HERO --- */}
      <section className="relative mt-6 overflow-hidden rounded-[2.5rem] border border-sand-line bg-gradient-to-b from-[#F7F9F5] via-white to-[#EEF3EC] px-5 py-16 shadow-sm sm:px-10 sm:py-20 lg:py-24">
        {/* soft background bubbles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="animate-float absolute left-[18%] top-[20%] size-32 rounded-full bg-[#B4CED9]/35 blur-2xl" style={{ animationDelay: "0.4s" }} />
          <span className="animate-float-slow absolute right-[22%] top-[14%] size-24 rounded-full bg-[#7FAE93]/30 blur-2xl" style={{ animationDelay: "1.6s" }} />
          <span className="animate-float-fast absolute left-[40%] bottom-[8%] size-40 rounded-full bg-[#FDB97E]/25 blur-2xl" style={{ animationDelay: "0.9s" }} />
          <span className="animate-float absolute right-[12%] bottom-[20%] size-28 rounded-full bg-[#B4CED9]/35 blur-2xl" style={{ animationDelay: "2.3s" }} />
        </div>

        {/* floating destination cards */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {FLOAT_CARDS.map((card) => (
            <div
              key={card.city}
              className={`absolute ${card.position} ${card.animation}`}
              style={{ ["--tilt" as string]: `${card.tilt}deg`, animationDelay: card.delay }}
            >
              <div className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-sand-line">
                <img
                  src={card.image}
                  alt={card.city}
                  loading="lazy"
                  className="h-28 w-full rounded-xl object-cover"
                />
                <div className="mt-2 flex items-center justify-between px-1 pb-1">
                  <div>
                    <p className="font-display text-sm font-semibold leading-tight text-stone-800">{card.city}</p>
                    <p className="text-[11px] text-stone-500">{card.country}</p>
                  </div>
                  <span className="text-lg">{card.flag}</span>
                </div>
                <span
                  className="absolute -bottom-2 left-1/2 size-3 -translate-x-1/2 rounded-full ring-2 ring-white"
                  style={{ background: card.dot }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* centered content */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-stone-900 sm:text-5xl lg:text-6xl">
            Where will <span className="text-primary">Roamio</span> take you?
          </h1>
          <p className="mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
            Say the word — a city, a mood, a budget. Roamio chats with you to shape a plan that fits.
          </p>

          {/* prompt bar */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              start(value);
            }}
            className="group relative mt-8 w-full"
          >
            {/* animated pulse ring behind the input */}
            <span aria-hidden className="animate-pulse-ring pointer-events-none absolute inset-0 rounded-full bg-primary/15" />
            <div className="relative flex items-center gap-2 rounded-full border border-sand-line bg-white/90 px-5 py-3 shadow-lg backdrop-blur-xl transition-colors duration-200 focus-within:border-primary">
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Plan a 7-day trip to Thailand under ₹1.2 lakh…"
                className="flex-1 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none"
                data-testid="landing-prompt-input"
              />
              <button
                type="submit"
                disabled={value.trim().length < 3}
                aria-label="Start planning"
                data-testid="landing-prompt-submit"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          </form>

          {/* suggestion chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setValue(s.prompt);
                  start(s.prompt);
                }}
                data-testid={`landing-suggestion-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-sand-line bg-white/80 px-3 py-1.5 text-sm text-stone-700 shadow-sm transition-all duration-150 hover:border-primary hover:text-stone-900 active:scale-95"
              >
                <span className="transition-transform duration-200 group-hover:scale-110">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY Roamio (branching features) --- */}
      <section className="mt-24">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          A conversation, not a form.
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Describe your trip loosely. Roamio asks a few friendly questions, then hands you a plan with real places, real timings and a budget that always adds up.
        </p>

        <BranchingFeatures />
      </section>

      <section className="mt-16 rounded-3xl border border-sand-line bg-white p-6 shadow-sm sm:p-10">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            { step: "01", title: "Say the word", body: "A sentence is enough. Roamio parses destination, length, budget and the vibes you care about." },
            { step: "02", title: "Chat it out", body: "A few friendly follow-ups — travellers, dates, dealbreakers — until the picture is sharp." },
            { step: "03", title: "Get a real plan", body: "A structured day-by-day itinerary, editable in natural language and priced in real currency." },
          ].map((item) => (
            <div key={item.step}>
              <span className="font-mono text-sm text-primary">{item.step}</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-sand-line pt-8 text-sm text-stone-500">
        <p>
          Roamio is a discovery and planning platform. Checkout, payment, confirmation,
          cancellation and refunds are handled entirely by the third-party provider you are
          redirected to. Development provider data is labelled{" "}
          <span className="font-medium text-amber-700">Mock data</span>.
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------
// Branching features: a sticky Roamio hub, a trunk running down the page,
// and three feature "levels" that reveal (card rises + branch draws in)
// one at a time as the user scrolls them into view. Zigzag layout on lg.
// ---------------------------------------------------------------------

type Pillar = {
  key: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;      // Tailwind classes for the card icon tint
};

const BRANCH_PILLARS: Pillar[] = [
  {
    key: "chat",
    icon: <Compass className="size-5" />,
    title: "Chat your trip into existence",
    body: "Describe loosely. Roamio asks a few friendly questions, then returns a real day-by-day plan.",
    accent: "bg-primary/15 text-primary",
  },
  {
    key: "places",
    icon: <MapPin className="size-5" />,
    title: "Real places, honest timings",
    body: "Named venues, realistic hours, travel slots on city-change days — editable, not a wall of text.",
    accent: "bg-[#B4CED9]/40 text-accent",
  },
  {
    key: "budget",
    icon: <Wallet className="size-5" />,
    title: "A budget that always adds up",
    body: "The AI drafts; code does the math. Every total is computed, never guessed.",
    accent: "bg-[#FDB97E]/35 text-amber-700",
  },
];

// Zigzag the cards left/right/left so the branches alternate as you scroll.
const SIDE_FOR_INDEX: ("left" | "right")[] = ["left", "right", "left"];

/** IntersectionObserver hook. Once the element has been seen, stays revealed. */
function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function BranchingFeatures() {
  return (
    <div className="relative mt-14">
      <AnimatedTrunk />

      {/* sticky hub — pins while the user scrolls through the levels */}
      <div className="sticky top-20 z-30 flex justify-center pt-2">
        <div className="rounded-full bg-gradient-to-b from-background via-background to-background/40 px-6 pb-6">
          <div className="relative flex flex-col items-center">
            {/* outer orbit ring, rotating slowly */}
            <span
              aria-hidden
              className="animate-orbit absolute -inset-3 rounded-full border border-dashed border-primary/35"
            />
            {/* inner orbit ring, counter-rotating faster */}
            <span
              aria-hidden
              className="animate-orbit absolute -inset-1.5 rounded-full border border-primary/20"
              style={{ animationDirection: "reverse", animationDuration: "18s" }}
            />
            <span className="relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-background">
              <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/40" />
              <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/25" style={{ animationDelay: "1s" }} />
              <Zap className="relative size-8" />
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sand-line bg-white px-3 py-1 font-mono text-[11px] tracking-wider text-stone-600 shadow-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              RoamioAI · online
            </span>
          </div>
        </div>
      </div>

      {/* levels — each reveals as it scrolls into view */}
      <div className="relative mt-6 space-y-20 lg:space-y-32">
        {BRANCH_PILLARS.map((p, i) => (
          <Level key={p.key} pillar={p} index={i} side={SIDE_FOR_INDEX[i]} />
        ))}
      </div>
    </div>
  );
}

/** Vertical trunk running down the middle of the levels block — a static sage
 *  gradient line plus a continuously-flowing dashed overlay that reads as
 *  "signal" cascading from the hub toward each branch. Hidden on < lg. */
function AnimatedTrunk() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 2 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-1/2 top-24 hidden h-[calc(100%-6rem)] w-1 -translate-x-1/2 lg:block"
    >
      <defs>
        <linearGradient id="trunk-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
          <stop offset="70%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="1" y1="0" x2="1" y2="100" stroke="url(#trunk-grad)" strokeWidth="1" />
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="100"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="2 10"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="animate-dash-flow text-primary/70"
      />
    </svg>
  );
}

function Level({
  pillar,
  index,
  side,
}: {
  pillar: Pillar;
  index: number;
  side: "left" | "right";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const isLeft = side === "left";

  // Branch bezier in a 100×100 viewBox: trunk (x=50, top) → card inner edge.
  const targetX = isLeft ? 22 : 78;
  const pathD = `M 50 4 C 50 48, ${targetX} 48, ${targetX} 92`;
  const pathId = `branch-${pillar.key}`;
  const filterId = `glow-${pillar.key}`;

  return (
    <div
      ref={ref}
      data-testid={`landing-pillar-${pillar.key}`}
      className="relative lg:grid lg:min-h-[13rem] lg:grid-cols-2 lg:gap-10"
    >
      {/* branch SVG: glow filter, draw-in, flowing dashes, traveling spark, endpoint burst */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${pathId}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* junction node where the branch leaves the trunk */}
        <circle
          cx="50"
          cy="4"
          r="2.4"
          className="fill-primary"
          style={{
            opacity: inView ? 1 : 0.25,
            transition: "opacity 500ms ease",
          }}
        />
        {inView && (
          <circle
            cx="50"
            cy="4"
            r="2.4"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            style={{
              animation: "pulse-ring 2.6s cubic-bezier(0.4,0,0.6,1) infinite",
              transformOrigin: "50px 4px",
            }}
          />
        )}

        {/* backing blurred stroke — soft glow underneath the crisp line */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${pathId}-grad)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${filterId})`}
          style={{
            strokeDashoffset: inView ? 0 : 1,
            opacity: inView ? 0.55 : 0,
            transition:
              "stroke-dashoffset 1200ms cubic-bezier(0.65, 0, 0.35, 1) 100ms, opacity 600ms ease",
          }}
        />

        {/* crisp drawn stroke on top */}
        <path
          id={pathId}
          d={pathD}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="0.7"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDashoffset: inView ? 0 : 1,
            transition: "stroke-dashoffset 1200ms cubic-bezier(0.65, 0, 0.35, 1) 100ms",
          }}
        />

        {/* continuous dash flow — the "signal" running along the branch once drawn */}
        {inView && (
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeDasharray="1.4 9"
            vectorEffect="non-scaling-stroke"
            className="animate-dash-flow text-primary"
            style={{ opacity: 0.9, animationDelay: "1.3s" }}
          />
        )}

        {/* little paper airplane flying along the branch (rotates to follow the curve) */}
        {inView && (
          <>
            {/* vapor-trail dot trailing just behind the plane */}
            <g>
              <circle r="0.6" className="fill-primary/60" />
              <animateMotion
                dur="3s"
                begin="1.35s"
                repeatCount="indefinite"
                rotate="auto"
                keyPoints="0;1"
                keyTimes="0;1"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;0.6;0.6;0"
                keyTimes="0;0.2;0.85;1"
                dur="3s"
                begin="1.35s"
                repeatCount="indefinite"
              />
            </g>
            {/* the plane: a paper-airplane shape pointing +X, animateMotion with
                rotate="auto" tilts it along the tangent of the path */}
            <g>
              <path
                d="M 3 0 L -2.4 -1.6 L -0.8 0 L -2.4 1.6 Z"
                className="fill-primary"
                stroke="var(--color-primary)"
                strokeWidth="0.35"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* subtle fuselage highlight */}
              <path
                d="M 2.8 0 L -0.6 0"
                stroke="white"
                strokeWidth="0.25"
                strokeLinecap="round"
                opacity="0.55"
                vectorEffect="non-scaling-stroke"
              />
              <animateMotion
                dur="3s"
                begin="1.3s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
              {/* fade in at start of each lap, fade out before the teleport —
                  hides the hard reset so the loop feels continuous */}
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.88;1"
                dur="3s"
                begin="1.3s"
                repeatCount="indefinite"
              />
            </g>
          </>
        )}

        {/* endpoint burst at the card edge once the line has drawn */}
        <circle
          cx={targetX}
          cy="92"
          r="2.4"
          className="fill-primary"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "scale(1)" : "scale(0)",
            transformOrigin: `${targetX}px 92px`,
            transition:
              "opacity 400ms ease-out 1200ms, transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 1200ms",
          }}
        />
        {inView && (
          <circle
            cx={targetX}
            cy="92"
            r="2.4"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            style={{
              animation: "pulse-ring 2.6s cubic-bezier(0.4,0,0.6,1) 1.4s infinite",
              transformOrigin: `${targetX}px 92px`,
            }}
          />
        )}
      </svg>

      {/* card */}
      <div className={`relative z-10 ${isLeft ? "lg:col-start-1" : "lg:col-start-2"}`}>
        <div
          className="group relative overflow-hidden rounded-2xl border border-sand-line bg-white p-6 shadow-sm transition-shadow duration-200 hover:border-primary hover:shadow-xl"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(32px)",
            transitionProperty: "opacity, transform",
            transitionDuration: "700ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDelay: inView ? "900ms" : "0ms",
          }}
        >
          {/* soft corner glow fades in after the branch lands */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1/2 -right-1/2 size-full rounded-full bg-primary/10 blur-3xl"
            style={{
              opacity: inView ? 1 : 0,
              transition: "opacity 900ms ease 1300ms",
            }}
          />

          <div className="relative">
            <span className="label-mono text-stone-400">
              Level {String(index + 1).padStart(2, "0")}
            </span>
            {/* icon pops with a spring */}
            <span
              className={`mt-2 flex size-11 items-center justify-center rounded-xl ${pillar.accent}`}
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "scale(1) rotate(0deg)" : "scale(0.3) rotate(-20deg)",
                transition:
                  "opacity 500ms ease, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                transitionDelay: inView ? "1100ms" : "0ms",
              }}
            >
              {pillar.icon}
            </span>
            <h3 className="relative mt-4 inline-block pb-1 font-display text-xl font-semibold">
              {pillar.title}
              {/* animated underline draws in */}
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-[2px] rounded-full bg-primary/70"
                style={{
                  width: inView ? "100%" : "0%",
                  transition: "width 800ms cubic-bezier(0.65, 0, 0.35, 1)",
                  transitionDelay: inView ? "1500ms" : "0ms",
                }}
              />
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{pillar.body}</p>
          </div>

          {/* hover: glowing ring around the whole card */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-primary/25 transition-all duration-300 group-hover:ring-4"
          />
        </div>
      </div>
    </div>
  );
}
