"use client";

import { JournalEditor } from "@/components/editor/JournalEditor";
import { useJournalWorkspace } from "@/components/journal/JournalWorkspace";

export default function NewJournalEntryPage() {
  const { reload } = useJournalWorkspace();

  return <JournalEditor onPersisted={() => void reload()} />;
}
