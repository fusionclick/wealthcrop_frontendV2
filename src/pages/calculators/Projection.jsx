import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr } from "../../utils/calcSafe";

const rupees = (v) => `₹${inr(v, { maximumFractionDigits: 0 })}`;
// Axis ticks in lakh / crore — a full rupee figure does not fit beside the chart.
const compact = (v) => {
  if (v >= 1e7) return `₹${inr(v / 1e7, { maximumFractionDigits: 1 })}Cr`;
  if (v >= 1e5) return `₹${inr(v / 1e5, { maximumFractionDigits: 1 })}L`;
  return rupees(v);
};

/**
 * Audit #66 / #67 — the year-by-year path of a retirement or education plan: the balance at
 * the end of each year of age, built up while saving and drawn down once the money is being
 * spent. One series, so no legend — the heading says what is plotted — and a dashed line marks
 * the switch. The table carries every number the chart shows, for anyone who cannot use the
 * hover readout.
 *
 * Colours ride on `currentColor` so the dark: classes pick them: the series from the Area's
 * own class, axes and grid from the wrapper's muted text colour.
 */
export default function Projection({ title, rows, switchAge, switchLabel, ageLabel, inLabel, outLabel, spendPhase }) {
  return (
    <section className="max-w-4xl mx-auto px-6 mt-2">
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Balance at the end of each year, by {ageLabel.toLowerCase()}.</p>

        <div className="mt-4 text-gray-500 dark:text-gray-400">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows} margin={{ top: 16, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.2} />
              <XAxis dataKey="age" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
              <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={compact} width={76} />
              <Tooltip
                formatter={(value) => [rupees(value), "Balance"]}
                labelFormatter={(age) => `${ageLabel} ${age}`}
                contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <ReferenceLine
                x={switchAge}
                stroke="currentColor"
                strokeDasharray="4 4"
                label={{ value: switchLabel, position: "insideTopRight", fill: "currentColor", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Balance"
                className="text-blue-600 dark:text-blue-500"
                stroke="currentColor"
                strokeWidth={2}
                fill="currentColor"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-blue-700 dark:text-blue-400">
            Year-by-year table
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                  <th className="py-2 pr-4 font-medium">{ageLabel}</th>
                  <th className="py-2 pr-4 font-medium">Stage</th>
                  <th className="py-2 pr-4 font-medium text-right">{inLabel}</th>
                  <th className="py-2 pr-4 font-medium text-right">{outLabel}</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {rows.map((r) => (
                  <tr key={r.age} className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-1.5 pr-4">{r.age}</td>
                    <td className="py-1.5 pr-4">{r.phase}</td>
                    {/* A column that does not apply to the stage reads as a dash, not ₹0. */}
                    <td className="py-1.5 pr-4 text-right">{r.phase === "Saving" ? rupees(r.paidIn) : "—"}</td>
                    <td className="py-1.5 pr-4 text-right">{r.phase === spendPhase ? rupees(r.paidOut) : "—"}</td>
                    <td className="py-1.5 text-right">{rupees(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}
