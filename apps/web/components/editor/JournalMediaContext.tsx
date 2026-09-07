"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { JournalMediaItem } from "@/hooks/useJournal";

type JournalMediaContextValue = {
  entryId: string | null;
  items: JournalMediaItem[];
  urlFor: (mediaId: string) => string | undefined;
  refresh: () => Promise<void>;
  editable: boolean;
};

const JournalMediaContext = createContext<JournalMediaContextValue>({
  entryId: null,
  items: [],
  urlFor: () => undefined,
  refresh: async () => undefined,
  editable: false
});

export function JournalMediaProvider({
  value,
  children
}: {
  value: JournalMediaContextValue;
  children: ReactNode;
}) {
  return <JournalMediaContext.Provider value={value}>{children}</JournalMediaContext.Provider>;
}

export function useJournalMedia(): JournalMediaContextValue {
  return useContext(JournalMediaContext);
}
