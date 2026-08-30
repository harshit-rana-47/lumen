"use client";

type MoodSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function MoodSlider({ label, value, onChange }: MoodSliderProps) {
  return (
    <label className="block text-sm font-medium">
      <span className="flex items-center justify-between">
        {label}
        <span className="text-slate-500">{value}</span>
      </span>
      <input
        className="mt-2 w-full accent-[hsl(var(--primary))]"
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
