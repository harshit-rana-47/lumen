"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Save } from "lucide-react";
import { createJournalEntry, useJournalList } from "@/hooks/useJournal";
import { useInsights } from "@/hooks/useInsights";
import { api } from "@/lib/api";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calculateStreak(entryDates: string[]) {
  const dates = new Set(entryDates);
  let streak = 0;
  const cursor = new Date();

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function TodayPage() {
  const { entries, reload } = useJournalList();
  const { activeInsights } = useInsights();
  const [journalText, setJournalText] = useState("");
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [anxiety, setAnxiety] = useState(4);
  const [notes, setNotes] = useState("");
  const [savingJournal, setSavingJournal] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.entryDate === todayKey()),
    [entries]
  );
  const streak = useMemo(() => calculateStreak(entries.map((entry) => entry.entryDate)), [entries]);
  const todayInsight = activeInsights[0] ?? null;

  async function handleQuickJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = journalText.trim();

    if (!body) {
      return;
    }

    setSavingJournal(true);
    setMessage(null);
    try {
      await createJournalEntry({
        title: "Today",
        body,
        type: "quick",
        moodScore: mood,
        energyScore: energy,
        entryDate: todayKey()
      });
      setJournalText("");
      setMessage("Journal saved.");
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save journal.");
    } finally {
      setSavingJournal(false);
    }
  }

  async function handleCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCheckIn(true);
    setMessage(null);

    try {
      await api.put("/daily-log", {
        date: todayKey(),
        mood,
        energy,
        anxiety,
        notes: notes.trim() || undefined
      });
      setMessage("Check-in saved.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save check-in.");
    } finally {
      setSavingCheckIn(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Today</h1>
              <p className="mt-1 text-sm text-slate-500">{todayEntries.length} entries today</p>
            </div>
            <Link
              href="/journal/new"
              className="inline-flex h-10 items-center gap-2 rounded border border-[hsl(var(--border))] px-3 text-sm text-slate-700 hover:bg-[hsl(var(--muted))]"
            >
              Open editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <form onSubmit={handleQuickJournal} className="space-y-4">
            <textarea
              value={journalText}
              onChange={(event) => setJournalText(event.target.value)}
              rows={8}
              className="w-full resize-none rounded border border-[hsl(var(--border))] p-3 text-sm leading-6 outline-none focus:border-[hsl(var(--primary))]"
              placeholder="Write what is on your mind."
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span>Mood {mood}</span>
                <span>Energy {energy}</span>
              </div>
              <button
                type="submit"
                disabled={savingJournal || !journalText.trim()}
                className="inline-flex h-10 items-center gap-2 rounded bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingJournal ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-[hsl(var(--muted))] text-[hsl(var(--primary))]">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">{streak}</p>
                <p className="text-sm text-slate-500">day streak</p>
              </div>
            </div>
          </section>

          <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
            <p className="text-sm font-semibold">Today&apos;s insight</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {todayInsight?.summary || "No insight queued for today yet."}
            </p>
          </section>
        </aside>
      </div>

      <form onSubmit={handleCheckIn} className="rounded border border-[hsl(var(--border))] bg-white p-5">
        <h2 className="text-base font-semibold">Daily check-in</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { label: "Mood", value: mood, setValue: setMood },
            { label: "Energy", value: energy, setValue: setEnergy },
            { label: "Anxiety", value: anxiety, setValue: setAnxiety }
          ].map((item) => (
            <label key={item.label} className="space-y-2 text-sm">
              <span className="flex justify-between font-medium">
                {item.label}
                <span>{item.value}</span>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={item.value}
                onChange={(event) => item.setValue(Number(event.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </label>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-4 w-full resize-none rounded border border-[hsl(var(--border))] p-3 text-sm leading-6"
          placeholder="Notes"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{message}</p>
          <button
            type="submit"
            disabled={savingCheckIn}
            className="h-10 rounded bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingCheckIn ? "Saving" : "Save check-in"}
          </button>
        </div>
      </form>
    </div>
  );
}
