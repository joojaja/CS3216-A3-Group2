"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeAuthDestination } from "@/lib/auth-navigation";
import { createClient } from "@/lib/supabase/client";

// Frontend-only development credentials. Used only when Supabase env vars
// are absent; has no effect once Supabase is configured.
const DEV_EMAIL = "test@gmail.com";
const DEV_PASSWORD = "testtest";
const DEV_COOKIE = "dev_auth";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    searchParams.get("confirmation") === "retry"
      ? "That confirmation link could not be verified. Try signing in if you have already confirmed your email, or request a new link by creating your account again."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (loading) return;
    setLoading(true);

    try {
      if (!supabaseConfigured) {
        if (process.env.NODE_ENV !== "development")
          throw new Error(
            "Account access is temporarily unavailable. Please try again later.",
          );
        if (email === DEV_EMAIL && password === DEV_PASSWORD) {
          document.cookie = `${DEV_COOKIE}=1; path=/; max-age=86400; samesite=lax`;
          router.push(safeAuthDestination(searchParams.get("next")));
          router.refresh();
          return;
        }
        throw new Error(
          `Supabase is not configured. Use the dev login ${DEV_EMAIL} / ${DEV_PASSWORD}.`,
        );
      }

      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          // Confirmation is disabled, so the account is already signed in
          router.push(safeAuthDestination(searchParams.get("next")));
          router.refresh();
        } else {
          setNotice(
            "Check your email for a confirmation link, then return here to sign in. If you already have an account, sign in instead.",
          );
          setMode("signin");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(safeAuthDestination(searchParams.get("next")));
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Check your Supabase configuration.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="auth-form w-full max-w-sm space-y-3.5"
    >
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="auth-intro">
        Your clothes and preferences stay private to your account.
      </p>
      {!supabaseConfigured && (
        <p role="status" className="onboarding-notice">
          {process.env.NODE_ENV === "development"
            ? "Local preview only. Use test@gmail.com and testtest to explore. Saving needs a service connection."
            : "Account access is temporarily unavailable."}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-ok">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cobalt py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-50"
      >
        {loading
          ? "Working..."
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        disabled={loading}
        className="w-full text-center text-sm text-mute hover:text-ink"
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
