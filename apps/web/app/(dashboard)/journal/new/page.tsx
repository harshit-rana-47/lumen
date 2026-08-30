import { JournalEditor } from "@/components/editor/JournalEditor";

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">New entry</h1>
        <p className="mt-1 text-sm text-slate-500">Autosaves every 10 seconds while you write.</p>
      </div>
      <JournalEditor />
    </div>
  );
}
