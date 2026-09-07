"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import { invalidateApiAuthCache } from "./apiAuthCache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in the monorepo root .env (loaded via next.config.mjs)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
