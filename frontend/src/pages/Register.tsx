import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorDetail } from "@/hooks/useTrip";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTENTS = [
  { value: "Solo explorer", travelers: 1 },
  { value: "Couple getaway", travelers: 2 },
  { value: "Group trip", travelers: 4 },
];

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState(INTENTS[0].value);

  const signup = useMutation({
    mutationFn: () =>
      apiPost<User>("/auth/signup", { name: name.trim(), email: email.trim(), password }),
    onSuccess: () => {
      beginSession();
      // A prompt typed on the landing page replays automatically once the session exists.
      navigate(sessionStorage.getItem("Roamio:pending-prompt") ? "/" : "/trips");
    },
    onError: (error) => toast.error(errorDetail(error, "We couldn't create your account.")),
  });

  return (
    <AuthLayout
      title="Start planning"
      subtitle="Create a free account to save trips, itineraries and discoveries."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-terracotta hover:underline" data-testid="register-to-login-link">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !email.trim() || password.length < 6) {
            toast.error("Enter your name, email and a password of at least 6 characters");
            return;
          }
          signup.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="register-name">Name</Label>
          <Input
            id="register-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Asha Menon"
            data-testid="register-name-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            data-testid="register-email-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            data-testid="register-password-input"
          />
        </div>

        <div className="space-y-2">
          <Label>How do you travel?</Label>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntent(option.value)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-all duration-150 active:scale-95",
                  intent === option.value
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-sand-line bg-white text-stone-600 hover:border-terracotta",
                )}
                data-testid={`register-intent-${option.value.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {option.value}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={signup.isPending} data-testid="register-submit-button">
          {signup.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
