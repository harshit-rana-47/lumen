"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api } from "@/lib/api";
import { APP_HOME } from "@/lib/nav";
import { supabase, syncSessionCookies } from "@/lib/supabase";
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
      setError(caught instanceof Error ? caught.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <Link href="/" className="font-display text-2xl tracking-tight text-foreground">
        Lumen
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Log in</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-border bg-[hsl(var(--surface))] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-border bg-[hsl(var(--surface))] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-foreground/70">
        No account yet?{" "}
        <Link className="font-medium text-primary" href="/register">
          Register
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
