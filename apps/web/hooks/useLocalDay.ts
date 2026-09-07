"use client";

import { useSyncExternalStore } from "react";
import { localDateKey } from "@/lib/date";

export type LocalDay = {
  /** `YYYY-MM-DD` in the viewer's timezone, or null until the client clock is available. */
  today: string | null;
  /** Local hour 0-23, or null until the client clock is available. */
  hour: number | null;
};

let snapshot: LocalDay = { today: null, hour: null };

function readClientDay(): LocalDay {
  const now = new Date();
  const today = localDateKey(now);
  const hour = now.getHours();
  if (snapshot.today === today && snapshot.hour === hour) {
    return snapshot;
  }
  snapshot = { today, hour };
  return snapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  const id = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(id);
}

function getServerSnapshot(): LocalDay {
  return { today: null, hour: null };
}

/**
 * Viewer's local civil day without waiting an extra effect tick after mount.
 * Server snapshot stays null so the timezone is never baked in at prerender.
 */
export function useLocalDay(): LocalDay {
  return useSyncExternalStore(subscribe, readClientDay, getServerSnapshot);
}
