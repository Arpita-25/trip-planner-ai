import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { errorDetail } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import type { AiMessageResponse, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_ASKS = [
  "What should I do tonight?",
  "Find a beach near my hotel",
  "Can you make this trip cheaper?",
  "Can you keep the trip under \u20B91 lakh?",
  "Replace one activity with something more adventurous",
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AssistantPanel({ trip }: { trip: Trip }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const ask = useMutation({
    mutationFn: (message: string) =>
      apiPost<AiMessageResponse>(`/trips/${trip.id}/ai/message`, { message }),
    onSuccess: (data) => setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]),
    onError: (error) => {
      const detail = errorDetail(error, "Our AI assistant is unavailable right now.");
      setMessages((prev) => [...prev, { role: "assistant", text: detail }]);
      toast.error(detail);
    },
  });

  const send = (message: string) => {
    const text = message.trim();
    if (text.length < 2 || ask.isPending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    ask.mutate(text);
  };

  return (
    <div className="space-y-6" data-testid="assistant-panel">
      <div>
        <h2 className="font-display text-3xl font-semibold">Trip copilot</h2>
        <p className="text-sm text-stone-600">
          Ask anything about this trip. The assistant reads your structured itinerary and the budget
          your backend calculated — it never invents numbers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Conversation</CardTitle>
          <CardDescription>
            For structural changes, use "Ask AI to adjust" on the Itinerary tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3" data-testid="assistant-messages">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-sand-line bg-sand p-5 text-sm text-stone-600">
                <Sparkles className="mb-2 size-4 text-terracotta" />
                Try "What should I do tonight?" or "Can you make this trip cheaper?"
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line",
                  message.role === "user"
                    ? "ml-auto bg-teal text-white"
                    : "border border-sand-line bg-white text-stone-700",
                )}
                data-testid={`assistant-message-${message.role}-${index}`}
              >
                {message.text}
              </div>
            ))}
            {ask.isPending && (
              <div
                className="animate-shimmer max-w-[85%] rounded-2xl bg-[linear-gradient(90deg,#F5EFE6_0%,#FFFBF5_50%,#F5EFE6_100%)] bg-[length:400px_100%] px-4 py-3 text-sm text-stone-500"
                data-testid="assistant-pending"
              >
                Thinking about your trip…
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_ASKS.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => send(item)}
                disabled={ask.isPending}
                className="rounded-full border border-sand-line bg-white px-3 py-1.5 text-xs text-stone-600 transition-all duration-150 hover:border-terracotta hover:text-stone-900 active:scale-95 disabled:opacity-50"
                data-testid={`assistant-quick-ask-${index + 1}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <Textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about your trip…"
              className="resize-none"
              data-testid="assistant-input"
            />
            <Button
              onClick={() => send(input)}
              disabled={ask.isPending || input.trim().length < 2}
              data-testid="assistant-send-button"
            >
              <Send className="size-4" /> Ask
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
