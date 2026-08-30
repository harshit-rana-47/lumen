"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { $createParagraphNode, $createTextNode, $getRoot, EditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { Save } from "lucide-react";
import { createJournalEntry, type JournalDraft, type JournalEntry, updateJournalEntry } from "@/hooks/useJournal";
import { EditorToolbar } from "./EditorToolbar";
import { MoodSlider } from "./MoodSlider";

const journalTypes = ["free", "guided", "gratitude", "dream", "travel", "learning", "relationship", "work", "health"];

type JournalEditorProps = {
  initialEntry?: JournalEntry;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function JournalEditor({ initialEntry }: JournalEditorProps) {
  const router = useRouter();
  const [entryId, setEntryId] = useState(initialEntry?.id ?? null);
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [body, setBody] = useState(initialEntry?.body ?? "");
  const [type, setType] = useState(initialEntry?.type ?? "free");
  const [moodScore, setMoodScore] = useState(initialEntry?.moodScore ?? 5);
  const [energyScore, setEnergyScore] = useState(initialEntry?.energyScore ?? 5);
  const [entryDate, setEntryDate] = useState(initialEntry?.entryDate ?? today());
  const [tags, setTags] = useState(tagsToString(initialEntry?.tags ?? []));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef<string>("");
  const initialBodyRef = useRef(initialEntry?.body ?? "");

  /**
   * Root cause of prior bug: initialConfig depended on `body`, so LexicalComposer
   * remounted/reinitialized as the user typed. Keep namespace + seed text stable.
   */
  const initialConfig = useMemo(
    () => ({
      namespace: `journal-${initialEntry?.id ?? "new"}`,
      onError(caught: Error) {
        console.error(caught);
      },
      editorState: () => {
        const seed = initialBodyRef.current;
        if (!seed) {
          return;
        }

        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(seed));
        root.append(paragraph);
      }
    }),
    [initialEntry?.id]
  );

  const wordCount = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);

  const draft = useMemo<JournalDraft>(() => {
    const nextDraft: JournalDraft = {
      body: body.trim() || " ",
      type,
      moodScore,
      energyScore,
      tags: parseTags(tags),
      entryDate
    };
    const nextTitle = title.trim();

    if (nextTitle) {
      nextDraft.title = nextTitle;
    }

    return nextDraft;
  }, [body, energyScore, entryDate, moodScore, tags, title, type]);

  const signature = JSON.stringify(draft);

  const save = useCallback(async () => {
    if (signature === lastSaved.current || !body.trim()) {
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      if (entryId) {
        await updateJournalEntry(entryId, draft);
      } else {
        const created = await createJournalEntry(draft);
        setEntryId(created.id);
        router.replace(`/journal/${created.id}`);
      }

      lastSaved.current = signature;
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Unable to save entry.");
    }
  }, [body, draft, entryId, router, signature]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void save();
    }, 10_000);

    return () => window.clearTimeout(timeout);
  }, [save]);

  function onEditorChange(editorState: EditorState) {
    editorState.read(() => {
      // Plain-text extraction for V1 storage/embeddings.
      // Rich Lexical JSON serialization is deferred until editor redesign.
      setBody($getRoot().getTextContent());
      setStatus("idle");
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 rounded border border-[hsl(var(--border))] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-2xl font-semibold outline-none"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setStatus("idle");
            }}
            placeholder="Untitled"
          />
          <button
            type="button"
            onClick={() => void save()}
            className="inline-flex h-9 items-center gap-2 rounded bg-[hsl(var(--primary))] px-3 text-sm font-medium text-white"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        <div className="mt-4">
          <LexicalComposer initialConfig={initialConfig}>
            <EditorToolbar />
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="min-h-[420px] resize-none rounded border border-[hsl(var(--border))] p-4 text-base leading-7 outline-none" />
              }
              placeholder={<div className="pointer-events-none -mt-[430px] px-4 py-4 text-slate-400">Start writing...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <OnChangePlugin onChange={onEditorChange} />
          </LexicalComposer>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>{wordCount} words</span>
          <span>
            {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : status === "error" ? "Save failed" : "Unsaved"}
          </span>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <aside className="space-y-4 rounded border border-[hsl(var(--border))] bg-white p-4 lg:sticky lg:top-20 lg:self-start">
        <label className="block text-sm font-medium">
          Type
          <select
            className="mt-2 h-10 w-full rounded border border-[hsl(var(--border))] bg-white px-3"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setStatus("idle");
            }}
          >
            {journalTypes.map((journalType) => (
              <option key={journalType} value={journalType}>
                {journalType}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Date
          <input
            className="mt-2 h-10 w-full rounded border border-[hsl(var(--border))] bg-white px-3"
            type="date"
            value={entryDate}
            onChange={(event) => {
              setEntryDate(event.target.value);
              setStatus("idle");
            }}
          />
        </label>
        <MoodSlider
          label="Mood"
          value={moodScore}
          onChange={(value) => {
            setMoodScore(value);
            setStatus("idle");
          }}
        />
        <MoodSlider
          label="Energy"
          value={energyScore}
          onChange={(value) => {
            setEnergyScore(value);
            setStatus("idle");
          }}
        />
        <label className="block text-sm font-medium">
          Tags
          <input
            className="mt-2 h-10 w-full rounded border border-[hsl(var(--border))] bg-white px-3"
            value={tags}
            onChange={(event) => {
              setTags(event.target.value);
              setStatus("idle");
            }}
            placeholder="reflection, work, family"
          />
        </label>
      </aside>
    </div>
  );
}
