"use client";

import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

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
