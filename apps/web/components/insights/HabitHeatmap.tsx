"use client";

type HeatmapCell = {
  date: string;
  value: number | null;
};

type HabitHeatmapProps = {
  cells: HeatmapCell[];
};

function cellClass(value: number | null): string {
  if (value === null) {
    return "bg-slate-100";
  }
  if (value >= 8) {
    return "bg-emerald-700";
  }
  if (value >= 6) {
    return "bg-emerald-500";
  }
  if (value >= 4) {
    return "bg-emerald-300";
  }
  return "bg-slate-200";
}

export function HabitHeatmap({ cells }: HabitHeatmapProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {cells.map((cell) => (
        <div key={cell.date} className="space-y-1">
          <div
            title={`${cell.date}${cell.value === null ? "" : ` · ${cell.value}/10`}`}
            className={`aspect-square rounded-sm ${cellClass(cell.value)}`}
          />
          <span className="block truncate text-[10px] leading-none text-slate-400">{cell.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
