import { useState } from "react";

/**
 * The input/result frame the three SRS planning tools share.
 *
 * ponytail: only these three use it. The other 18 calculators each carry their own copy
 * of this chrome plus an FAQ and a related-links rail; rewriting them onto this is a
 * refactor nobody asked for, so they are left alone.
 */
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function CalcShell({ title, blurb, fields, values, onChange, results, note }) {
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
                  <input
                    id={f.key}
                    type="number"
                    min="0"
                    placeholder={f.placeholder || ""}
                    value={values[f.key]}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className="w-full p-2 rounded-lg border border-blue-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  {f.hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-linear-to-br from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-800 text-white flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4">Result</h3>
            <dl className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2">
              {results.map((r) => (
                <div key={r.label} className="flex justify-between gap-3">
                  <dt>{r.label}</dt>
                  <dd className="font-semibold">{r.text ?? money(r.value)}</dd>
                </div>
              ))}
            </dl>
            {note && <p className="mt-6 text-sm opacity-90">{note}</p>}
          </div>
        </div>
      </div>
      <div className="pb-10" />
    </div>
  );
}

/** Every one of these tools is a few numbers in, a few numbers out. */
export function useCalcState(initial) {
  const [values, setValues] = useState(initial);
  return [values, (k, v) => setValues((p) => ({ ...p, [k]: v }))];
}
