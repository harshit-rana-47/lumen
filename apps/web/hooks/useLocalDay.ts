"use client";

import { useEffect, useState } from "react";
import { localDateKey } from "@/lib/date";

export type LocalDay = {
  /** `YYYY-MM-DD` in the viewer's timezone, or null until mounted. */
  today: string | null;
  /** Local hour 0-23, or null until mounted. */
  hour: number | null;
};

/**
 * Resolves the viewer's local day *after* mount.
 *
 * Reading the clock during render would let the server prerender bake in its own
 * timezone and hour, which either hydrates a wrong greeting or logs a mismatch.
 * Consumers should treat `null` as "not known yet" and render a neutral state.
 */
export function useLocalDay(): LocalDay {
  const [day, setDay] = useState<LocalDay>({ today: null, hour: null });

  useEffect(() => {
    const now = new Date();
    setDay({ today: localDateKey(now), hour: now.getHours() });
  }, []);

  return day;
}
