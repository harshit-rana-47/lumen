import { deleteJournalEntry } from "@/hooks/useJournal";
import { archiveReflectSessionForEntry } from "@/hooks/useReflectChat";

/** Same side effects as deleting from the reader or editor. */
export async function removeJournalPage(id: string): Promise<void> {
  await archiveReflectSessionForEntry(id).catch(() => undefined);
  await deleteJournalEntry(id);
}
