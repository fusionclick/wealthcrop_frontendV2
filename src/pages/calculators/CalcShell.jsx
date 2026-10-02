import { useState } from "react";
import { blank, clampNum, inr } from "../../utils/calcSafe";

/**
 * The input/result frame the three SRS planning tools share.
 *
 * ponytail: only these three use it. The other 18 calculators each carry their own copy
 * of this chrome plus an FAQ and a related-links rail; rewriting them onto this is a
 * refactor nobody asked for, so they are left alone.
 */
// Audit #69 — a value that was never computed prints as a dash; `v || 0` printed it as ₹0.
const money = (v) => {
  const text = inr(v, { fallback: null });
  return text === null ? "—" : `₹${text}`;
};

export default function CalcShell({ title, blurb, fields, values, onChange, results, note, children }) {
  // Audit #69 — absent is not zero. The models read a cleared field as 0, so clearing
  // "Monthly Living Expenses" printed "Fund required ₹0". Until every field has a value
  // there is no answer to show.
  const incomplete = fields.some((f) => blank(values[f.key]));
  return (
    <div className="min-h-screen bg-linear-to-r from-blue-100 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="py-8 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400 drop-shadow">{title}</h1>
        <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{blurb}</p>
      </div>

      <div className="flex justify-center items-center p-4">
        <div className="w-full max-w-4xl bg-white dark:bg-[#020617] rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 border border-gray-200 dark:border-white/10">
          <div className="p-8 bg-linear-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Enter your details</h2>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label htmlFor={f.key} className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {f.label}
                  </label>
                  {/* QA 5.1 — every field here was `min="0"` with no ceiling, and nothing
                      clamped the value. 27 nines in "Monthly Basic Salary" compounded into an
                      83-character rupee figure that ran straight out of the result card. The
                      19 calculators that passed the same test all bound their inputs (sliders
                      with a max, or clampNum) — these three, the only users of this shell,
                      were the ones that did not.

                      Clamped on blur, not on change: clamping each keystroke turns "1000"
                      into "100" while you are still typing it. */}
                  <input
                    id={f.key}
                    type="number"
                    min="0"
                    max={f.max}
                    placeholder={f.placeholder || ""}
                    value={values[f.key]}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    onBlur={(e) => {
                      if (f.max == null || e.target.value === "") return;
                      const bounded = clampNum(e.target.value, 0, f.max, 0);
                      if (String(bounded) !== e.target.value) onChange(f.key, bounded);
                    }}
                    className="w-full p-2 rounded-lg border border-blue-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  {f.hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-linear-to-br from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-800 text-white flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4">Result</h3>
            <dl className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2 dark:bg-[var(--card-bg)]">
              {/* A cap on the inputs cannot bound the OUTPUT: a legal rate compounded over a
                  legal number of years still runs to dozens of digits. So the cell has to hold
                  it — `min-w-0` + `break-all` makes a long figure wrap inside the card instead
                  of pushing the layout sideways. */}
              {results.map((r) => (
                <div key={r.label} className="flex justify-between gap-3">
                  <dt className="min-w-0">{r.label}</dt>
                  <dd className="font-semibold min-w-0 break-all text-right">{incomplete ? "—" : r.text ?? money(r.value)}</dd>
                </div>
              ))}
            </dl>
            {incomplete && <p className="mt-3 text-sm opacity-90">Fill in every field to see the result.</p>}
            {note && <p className="mt-6 text-sm opacity-90">{note}</p>}
          </div>
        </div>
      </div>
      {children}
      <div className="pb-10" />
    </div>
  );
}

/** Every one of these tools is a few numbers in, a few numbers out. */
export function useCalcState(initial) {
  const [values, setValues] = useState(initial);
  return [values, (k, v) => setValues((p) => ({ ...p, [k]: v }))];
}
