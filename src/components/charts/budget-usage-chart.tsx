"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

type BudgetChartItem = {
  label: string;
  spent: number;
  limit: number;
};

export function BudgetUsageChart({ data }: { data: BudgetChartItem[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <CartesianGrid stroke="rgba(31,41,55,0.08)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Bar dataKey="limit" fill="rgba(31,41,55,0.10)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="spent" fill="#1098F7" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
