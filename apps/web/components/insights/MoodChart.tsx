"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MoodTrendPoint } from "@/hooks/useInsights";

type MoodChartProps = {
  data: MoodTrendPoint[];
};

export function MoodChart({ data }: MoodChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} minTickGap={24} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={28} />
          <Tooltip
            contentStyle={{
              border: "1px solid #CBD5E1",
              borderRadius: 6,
              boxShadow: "0 10px 20px rgb(15 23 42 / 0.08)"
            }}
          />
          <Line type="monotone" dataKey="mood" stroke="#0F766E" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="energy" stroke="#2563EB" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="anxiety" stroke="#D97706" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
