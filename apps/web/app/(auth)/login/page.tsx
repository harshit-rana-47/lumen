"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api } from "@/lib/api";
import { waitForApiReady } from "@/lib/apiReadiness";
import { APP_HOME } from "@/lib/nav";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import { useApiReady } from "@/hooks/useApiReady";
import { useAuthStore } from "@/stores/authStore";

type LoginResponse = {
  success: boolean;
  data: {
    session: {
      access_token: string;
      refresh_token: string;
    };
  };
};

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return APP_HOME;
  }
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const apiReady = useApiReady();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes("@") || password.length === 0) {
      setError("Enter a valid email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await waitForApiReady();
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password
      });
      const session = response.data.data.session;

      if (!session) {
        throw new Error("Login did not return a session.");
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (sessionError) {
        throw sessionError;
      }

      const {
        data: { session: browserSession }
      } = await supabase.auth.getSession();

      syncSessionCookies(browserSession);
      await restoreSession();
      router.replace(safeRedirectPath(searchParams.get("redirectTo")));
    } catch (caught) {
      const apiMessage =
        caught &&
        typeof caught === "object" &&
        "response" in caught &&
        (caught as { response?: { data?: { error?: unknown } } }).response?.data?.error;

      setError(
        typeof apiMessage === "string" && apiMessage.trim()
          ? apiMessage
          : caught instanceof Error
            ? caught.message
            : "Unable to log in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-2xl tracking-tight text-foreground">
        Lumen
      </Link>
      <p className="mt-8 lumen-overline text-primary/90">Welcome back</p>
      <h1 className="mt-3 font-display text-3xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-ink-muted">Sign in to continue writing in your journal.</p>
      {apiReady === "starting" ? (
        <p className="mt-6 text-sm text-ink-muted">Starting Lumen…</p>
      ) : null}
      {apiReady === "unreachable" ? (
        <p className="mt-6 text-sm text-danger">
          Can&apos;t reach the Lumen API. Make sure it is running, then try again.
        </p>
      ) : null}
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-ink-muted">
          Email
          <input
            className="mt-2 w-full rounded-lumen border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-shadow focus-visible:shadow-focus"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium text-ink-muted">
          Password
          <input
            className="mt-2 w-full rounded-lumen border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-shadow focus-visible:shadow-focus"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          className="w-full rounded-full bg-primary px-4 py-2.5 font-semibold text-primary-foreground outline-none transition-transform duration-micro active:scale-[0.99] focus-visible:shadow-focus disabled:opacity-60"
          type="submit"
          disabled={submitting || apiReady !== "ready"}
        >
          {submitting ? "Logging in…" : apiReady === "starting" ? "Waiting for Lumen…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        No account yet?{" "}
        <Link className="font-medium text-primary outline-none hover:underline focus-visible:shadow-focus" href="/register">
          Create one
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-sm text-foreground/60">
          Preparing sign-in…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
