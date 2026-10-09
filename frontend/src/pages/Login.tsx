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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => apiPost<User>("/auth/login", { email: email.trim(), password }),
    onSuccess: () => {
      beginSession();
      navigate("/trips");
    },
    onError: (error) => toast.error(errorDetail(error, "Incorrect email or password")),
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your trips where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-terracotta hover:underline" data-testid="login-to-register-link">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim() || !password) {
            toast.error("Enter your email and password");
            return;
          }
          login.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            data-testid="login-email-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            data-testid="login-password-input"
          />
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending} data-testid="login-submit-button">
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-sand-line bg-sand p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-700">Demo account</p>
        <p className="mt-1 font-mono text-xs">demo@Roamio.app / Roamio123</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setEmail("demo@Roamio.app");
            setPassword("Roamio123");
          }}
          data-testid="login-fill-demo-button"
        >
          Fill demo credentials
        </Button>
      </div>
    </AuthLayout>
  );
}
