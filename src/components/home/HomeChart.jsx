import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { sipForGoal } from "../../utils/calculators";

// Client 2026-10-09 — "Smart Goal & SIP Wealth Planner: multi-preset life goals with an
// inflation toggle". A preset fills the goal and horizon; the inflation toggle grows today's
// cost to the year it is needed (sipForGoal does that maths, as on the calculator pages).
// The chart is the SIP that reaches the goal: what goes in, and what it compounds to.
const PRESETS = [
  { key: "retirement", label: "Retirement", goal: 20000000, years: 25 },
  { key: "education", label: "Child's education", goal: 2500000, years: 15 },
  { key: "home", label: "Home", goal: 5000000, years: 10 },
  { key: "car", label: "Car", goal: 1000000, years: 5 },
  { key: "travel", label: "Travel", goal: 300000, years: 3 },
  { key: "wealth", label: "Wealth creation", goal: 10000000, years: 20 },
];
const CAGR = 12;
const INFLATION = 6;

const inLakh = (n) => `₹${(n / 100000).toFixed(1)}L`;
const inRupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const HomeChart = () => {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [inflation, setInflation] = useState(true);
  const plan = sipForGoal({ goal: preset.goal, years: preset.years, cagr: CAGR, inflation: inflation ? INFLATION : 0 });
  const chartData = plan.series.map((p) => ({ year: p.year, value: p.total, invested: p.principal }));

  return (
    <section className="py-16 px-6 bg-white dark:bg-[#020617] text-blue-950 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Smart Goal &amp; SIP Wealth Planner</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Pick a life goal and see the monthly SIP that reaches it at {CAGR}% a year — an illustration, not a promise of returns.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={p.key === preset.key}
              onClick={() => setPreset(p)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                p.key === preset.key
                  ? "bg-blue-950 text-white border-blue-950 dark:bg-blue-500 dark:border-blue-500"
                  : "border-slate-300 text-slate-700 dark:border-white/10 dark:text-gray-300 hover:border-blue-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-xs text-slate-500 dark:text-gray-400">Goal today, in {preset.years} years</p>
              <p className="text-lg font-semibold">{inRupees(preset.goal)}</p>
            </div>
            <label className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 p-4 text-sm cursor-pointer">
              <span>Adjust for {INFLATION}% inflation</span>
              <input type="checkbox" checked={inflation} onChange={(e) => setInflation(e.target.checked)} className="h-4 w-4 accent-red-600" />
            </label>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-xs text-slate-500 dark:text-gray-400">Amount needed then</p>
              <p className="text-lg font-semibold">{inRupees(plan.target)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4">
              <p className="text-xs text-slate-500 dark:text-gray-400">Monthly SIP</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{inRupees(plan.monthlySIP)}</p>
            </div>
            <Link to="/goals" className="block text-center rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5">
              Plan this goal
            </Link>
          </div>

          <div className="rounded-2xl p-4 bg-gray-50 dark:bg-white/5">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                {/* dataKey ke baghair recharts row ka index dikhata hai — is liye x-axis par
                    saal ki jagah 0,1,2… chhap raha tha. */}
                <XAxis dataKey="year" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={inLakh} width={70} />
                <Tooltip
                  formatter={(value, name) => [inRupees(value), name]}
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" name="Portfolio value" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="invested" name="Amount invested" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeChart;
