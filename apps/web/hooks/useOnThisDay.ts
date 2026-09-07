"use client";

import { useEffect, useMemo, useState } from "react";
import { anniversaryKey } from "@/lib/date";
import { getEntriesForDate, type JournalEntrySummary } from "@/hooks/useJournal";
import type { JournalActivity } from "@/lib/activity";

export type Anniversary = {
  date: string;
  yearsAgo: number;
  entries: JournalEntrySummary[];
};

/** Only years already covered by the activity window can be detected. */
const MAX_YEARS_BACK = 3;

/**
 * Finds the most recent past year in which the user wrote on today's date.
 *
 * The activity data already says which days have entries, so the entry lookup
 * only ever fires when a real anniversary exists — never speculatively.
 */
export function useOnThisDay(activity: JournalActivity | null, today: string | null) {
  const [anniversary, setAnniversary] = useState<Anniversary | null>(null);

  const match = useMemo(() => {
    if (!activity || !today) {
      return null;
    }

    const active = new Set(activity.days.map((day) => day.date));

    for (let yearsAgo = 1; yearsAgo <= MAX_YEARS_BACK; yearsAgo += 1) {
      const date = anniversaryKey(today, yearsAgo);

      if (date < activity.from) {
        break;
      }

      if (active.has(date)) {
        return { date, yearsAgo };
      }
    }

    return null;
  }, [activity, today]);

  useEffect(() => {
    if (!match) {
      setAnniversary(null);
      return;
    }

    let cancelled = false;

    void getEntriesForDate(match.date)
      .then((entries) => {
        if (!cancelled && entries.length > 0) {
          setAnniversary({ ...match, entries });
        }
      })
      .catch(() => {
        // A missing memory is not worth surfacing as an error on Today.
        if (!cancelled) {
          setAnniversary(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [match]);

  return anniversary;
}
