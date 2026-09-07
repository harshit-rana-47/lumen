"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase, syncSessionCookies } from "@/lib/supabase";

type AuthState = {
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

let authListenerStarted = false;

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
    set({
      initialized: true,
      loading: false,
      session,
      user: session?.user ?? null
    });

    if (!authListenerStarted) {
      authListenerStarted = true;
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        syncSessionCookies(nextSession);
        set({
          initialized: true,
          session: nextSession,
          user: nextSession?.user ?? null
        });
      });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    syncSessionCookies(null);
    set({
      session: null,
      user: null
    });
  }
}));

export function useHasApiSession(): boolean {
  return useAuthStore((state) => Boolean(state.session));
}
