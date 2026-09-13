"use client";

import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { invalidateApiAuthCache } from "./apiAuthCache";

function readBrowserSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""
  };
}

function createBrowserSupabase(): SupabaseClient {
  const { url, anonKey } = readBrowserSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in the monorepo root .env for local work, and in the Vercel project Environment Variables for Production and Preview builds."
    );
  }

  if (process.env.NODE_ENV === "production") {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production.");
    }
  }

  return createClient(url, anonKey);
}

let browserClient: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  browserClient ??= createBrowserSupabase();
  return browserClient;
}

/**
 * Lazy client so importing this module during `next build` prerender does not
 * throw before Next inlines NEXT_PUBLIC_* values.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getSupabase(), property, receiver);
    return typeof value === "function" ? value.bind(getSupabase()) : value;
  }
});

const ACCESS_COOKIE = "lumen-access-token";
const REFRESH_COOKIE = "lumen-refresh-token";

function cookieSecureFlag(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.protocol === "https:" ? "; Secure" : "";
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${cookieSecureFlag()}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecureFlag()}`;
}

export function syncSessionCookies(session: Session | null): void {
  invalidateApiAuthCache();

  if (typeof document === "undefined") {
    return;
  }

  if (!session) {
    deleteCookie(ACCESS_COOKIE);
    deleteCookie(REFRESH_COOKIE);
    return;
  }

  const expiresIn = Math.max(60, session.expires_in ?? 3600);
  writeCookie(ACCESS_COOKIE, session.access_token, expiresIn);
  writeCookie(REFRESH_COOKIE, session.refresh_token, 60 * 60 * 24 * 30);
}
