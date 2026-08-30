"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
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

export default function LoginPage() {
  const router = useRouter();
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
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Log in</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-2 w-full rounded border border-[hsl(var(--border))] bg-white px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-2 w-full rounded border border-[hsl(var(--border))] bg-white px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="w-full rounded bg-[hsl(var(--primary))] px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        No account yet?{" "}
        <Link className="font-medium text-[hsl(var(--primary))]" href="/register">
          Register
        </Link>
      </p>
    </main>
  );
}
