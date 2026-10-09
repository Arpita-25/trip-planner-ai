import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Compass, PlusCircle, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { errorDetail } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { ChatMessage, ChatResponse, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { icon: <Wand2 className="size-4" />, label: "Adjust the trip" },
  { icon: <PlusCircle className="size-4" />, label: "Add more options" },
];

export default function ChatPlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialPrompt = useMemo(() => searchParams.get("prompt")?.trim() ?? "", [searchParams]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [finalTrip, setFinalTrip] = useState<Trip | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seededRef = useRef(false);

  const chat = useMutation({
    mutationFn: ({ history, message }: { history: ChatMessage[]; message: string }) =>
      apiPost<ChatResponse>("/ai/chat", { history, message }),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.done && data.trip) {
        setFinalTrip(data.trip);
        void queryClient.invalidateQueries({ queryKey: ["trips"] });
      }
    },
    onError: (error) =>
      toast.error(errorDetail(error, "Roamio is quiet right now. Try again in a moment.")),
  });

  // Seed the conversation with the landing prompt (runs exactly once).
  useEffect(() => {
    if (seededRef.current || !initialPrompt) return;
    seededRef.current = true;
    setMessages([{ role: "user", content: initialPrompt }]);
    chat.mutate({ history: [], message: initialPrompt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // Keep the latest turn in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chat.isPending]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (text.length < 1 || chat.isPending || finalTrip) return;
    const next: ChatMessage = { role: "user", content: text };
    const history = messages;
    setMessages((prev) => [...prev, next]);
    setInput("");
    chat.mutate({ history, message: text });
  };

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Badge className="bg-primary px-3 py-1 text-primary-foreground">
          <Sparkles className="mr-1 size-3.5" /> Chatting with RoamioAI
        </Badge>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-stone-500 hover:text-stone-800"
          data-testid="chat-plan-close"
        >
          Close
        </button>
      </div>

      <div
        className="mt-6 flex-1 overflow-y-auto rounded-3xl border border-sand-line bg-white/95 p-5 shadow-sm sm:p-6"
        data-testid="chat-plan-thread"
      >
        {empty && (
          <p className="pt-8 text-center text-sm text-stone-500">Start by telling Roamio where you'd like to go.</p>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} content={msg.content} />
          ))}
          {chat.isPending && <TypingBubble />}
          {finalTrip && <TripSummaryCard trip={finalTrip} onOpen={() => navigate(`/trips/${finalTrip.id}`)} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => setInput(action.label)}
              disabled={!!finalTrip || chat.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-sand-line bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm transition-all duration-150 hover:border-primary hover:text-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid={`chat-plan-quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-sand-line bg-white px-5 py-3 shadow-lg focus-within:border-primary">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={finalTrip ? "Your trip is ready — open it to continue." : "The more you share the better I can help…"}
            disabled={!!finalTrip}
            className="flex-1 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed"
            data-testid="chat-plan-input"
          />
          <button
            type="submit"
            disabled={input.trim().length < 1 || chat.isPending || !!finalTrip}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            data-testid="chat-plan-submit"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div
      className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={`chat-plan-bubble-${role}`}
    >
      {!isUser && (
        <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Compass className="size-4" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm animate-rise",
          isUser
            ? "bg-primary/90 text-primary-foreground"
            : "bg-secondary text-stone-800",
        )}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Compass className="size-4" />
      </span>
      <div className="rounded-2xl bg-secondary px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1">
          <Dot delay="0s" />
          <Dot delay="0.15s" />
          <Dot delay="0.3s" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block size-1.5 animate-pulse rounded-full bg-primary"
      style={{ animationDelay: delay }}
    />
  );
}

function TripSummaryCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-white to-secondary p-5 shadow-sm animate-rise">
      <p className="label-mono text-primary">Here's the scoop</p>
      <h3 className="mt-1 font-display text-2xl font-semibold text-stone-900">{trip.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-700">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Dates</dt>
          <dd>{trip.start_date} → {trip.end_date}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Travellers</dt>
          <dd>{trip.travelers}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Budget</dt>
          <dd>{trip.currency} {Math.round(trip.budget_amount).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Destination</dt>
          <dd className="truncate">{trip.destination}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95"
        data-testid="chat-plan-open-trip"
      >
        Open my trip <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
