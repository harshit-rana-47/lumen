"use client";

import type { ChatMode } from "@/stores/chatStore";

const modes: Array<{ label: string; value: ChatMode }> = [
  { label: "Friend", value: "friend" },
  { label: "Coach", value: "coach" },
  { label: "Therapist", value: "therapist" },
  { label: "Mentor", value: "mentor" },
  { label: "Devil's Advocate", value: "devils_advocate" },
  { label: "Future Self", value: "future_self" }
];

type ModeSwitcherProps = {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
};

export function ModeSwitcher({ value, onChange, disabled = false }: ModeSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode.value)}
          className={`h-9 rounded-full border px-3 text-sm transition ${
            value === mode.value
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white"
              : "border-[hsl(var(--border))] bg-white text-slate-700 hover:bg-[hsl(var(--muted))]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
