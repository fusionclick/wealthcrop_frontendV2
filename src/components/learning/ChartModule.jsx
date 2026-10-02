import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { sipSeries } from "../../utils/calculators";

const KEYS = ["monthly", "years", "rate"];
const LABELS = { monthly: "Monthly SIP (₹)", years: "Years invested", rate: "Assumed return (% a year)" };

const inLakh = (n) => `₹${(n / 100000).toFixed(1)}L`;
const inRupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const shown = (key, v) => (key === "monthly" ? inRupees(v) : key === "rate" ? `${v}%` : `${v}`);

/**
 * Audit #76 — the "interactive chart" module: a SIP growth explorer the learner moves.
 *
 * The slider ranges and starting values are the module's own JSON (Admin → Learning checks
 * them); the curve is the same sipSeries the home page chart and the goal planner draw, so
 * the three can never tell the learner different numbers.
 */
export default function ChartModule({ module }) {
  const sliders = module?.sliders || {};
  const [values, setValues] = useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, Number(sliders[k]?.value) || 0]))
  );

  const data = useMemo(
    () => sipSeries({ monthly: values.monthly, years: values.years, cagr: values.rate }),
    [values]
  );
  const last = data[data.length - 1] || { invested: 0, value: 0 };

  return (
    <div className="mt-3 space-y-4">
      {module?.body && (
        <p className="text-sm text-slate-700 dark:text-[#cbd5e1] leading-relaxed">{module.body}</p>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {KEYS.map((k) => (
          <label key={k} className="block text-xs text-slate-600 dark:text-[#94a3b8]">
            {sliders[k]?.label || LABELS[k]}
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{shown(k, values[k])}</span>
            <input
              type="range"
              min={sliders[k]?.min}
              max={sliders[k]?.max}
              step={sliders[k]?.step}
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: Number(e.target.value) }))}
              className="w-full accent-blue-600"
            />
          </label>
        ))}
      </div>

      <p className="text-sm text-slate-700 dark:text-[#cbd5e1]">
        You put in <strong>{inRupees(last.invested)}</strong>; at a steady {values.rate}% a year it
        would be worth about <strong>{inRupees(last.value)}</strong> after {values.years} years.
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="year" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={inLakh} width={64} />
            <Tooltip
              formatter={(value, name) => [inRupees(value), name]}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e5e7eb",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="value" name="Worth" stroke="#10b981" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="invested" name="Put in" stroke="#3b82f6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {module?.caption && (
        <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">{module.caption}</p>
      )}
    </div>
  );
}
