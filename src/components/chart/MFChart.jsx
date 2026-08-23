import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MFChart({ data, height = 320 }) {
  const rows = (Array.isArray(data) ? data : [])
    .filter((d) => d && d.nav != null && d.timestamp)
    .map((d) => ({
      t: d.timestamp,
      nav: Number(d.nav),
      label: new Date(d.timestamp * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    }));

  if (!rows.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400 border border-slate-200 rounded-xl">
        NAV chart unavailable
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-300 bg-white dark:border-[var(--border-color)] dark:bg-[var(--card-bg)]" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" minTickGap={48} tick={{ fontSize: 11 }} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={56} />
          <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, "NAV"]} />
          <Area type="monotone" dataKey="nav" stroke="#00b26a" fill="#00b26a33" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
