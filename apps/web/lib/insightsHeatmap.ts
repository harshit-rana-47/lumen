import { localDateKey, shiftDateKey } from "./date";

export type MoodTrendPoint = {
  date: string;
  mood: number | null;
  energy: number | null;
  anxiety: number | null;
};

export type HeatmapCell = {
  date: string;
  value: number | null;
};

/** 35 local days ending on `today`, aligned to mood-trend `log_date` keys. */
export function buildHeatmap(
  points: MoodTrendPoint[],
  today: string = localDateKey()
): HeatmapCell[] {
  const byDate = new Map(points.map((point) => [point.date, point]));
  return Array.from({ length: 35 }, (_, index) => {
    const key = shiftDateKey(today, -(34 - index));
    const point = byDate.get(key);
    return {
      date: key,
      value: point?.energy ?? point?.mood ?? null
    };
  });
}
