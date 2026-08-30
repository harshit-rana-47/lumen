"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 1) {
      setError("Enter your name.");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      syncSessionCookies(session);
      await restoreSession();
      router.replace("/today");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Create account</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Name
          <input
            className="mt-2 w-full rounded border border-[hsl(var(--border))] bg-white px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="w-full rounded bg-[hsl(var(--primary))] px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link className="font-medium text-[hsl(var(--primary))]" href="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
