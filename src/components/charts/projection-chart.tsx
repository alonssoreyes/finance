"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMonthLabel } from "@/lib/format";

type ProjectionPoint = {
  month: string;
  income: number;
  committed: number;
  net: number;
};

export function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#335C4B" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#335C4B" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="committed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B78C56" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#B78C56" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(31,41,55,0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(value) => formatMonthLabel(value)}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid rgba(31,41,55,0.08)",
              background: "rgba(251,248,242,0.95)",
              boxShadow: "0 18px 36px rgba(28,25,23,0.10)"
            }}
          />
          <Area dataKey="income" stroke="#335C4B" fill="url(#income)" strokeWidth={2} />
          <Area dataKey="committed" stroke="#B78C56" fill="url(#committed)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
