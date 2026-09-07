"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase, syncSessionCookies } from "@/lib/supabase";

export function hasApiSession(session: Session | null | undefined): boolean {
  return Boolean(session?.access_token);
}

type AuthState = {
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

let authListenerStarted = false;

function sessionToState(session: Session | null): Pick<AuthState, "initialized" | "loading" | "session" | "user"> {
  if (session) {
    return {
      initialized: true,
      loading: false,
      session,
      user: session.user ?? null
    };
  }

  return {
    initialized: true,
    loading: false,
    session: null,
    user: null
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  loading: false,
  session: null,
  user: null,
  restoreSession: async () => {
    set({ loading: true });

    const {
      data: { session }
    } = await supabase.auth.getSession();

    syncSessionCookies(session);
    set(sessionToState(session));

    if (!authListenerStarted) {
      authListenerStarted = true;
      supabase.auth.onAuthStateChange((event, nextSession) => {
        const current = useAuthStore.getState().session;
        if (event === "INITIAL_SESSION" && hasApiSession(current) && !hasApiSession(nextSession)) {
          return;
        }
        syncSessionCookies(nextSession);
        set(sessionToState(nextSession));
      });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    syncSessionCookies(null);
    set(sessionToState(null));
  }
}));

export function useHasApiSession(): boolean {
  return useAuthStore((state) => state.initialized && hasApiSession(state.session));
}
