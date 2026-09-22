import React, { useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * FR 4.1 — the filter across the top of the investments list.
 *
 * Deliberately not a dropdown: the counts are the point. An investor who has put three
 * folios in "Retirement" wants to see that it is three without opening anything, and
 * "Unassigned 4" is the only prompt that ever gets the rest of them filed.
 */

const TINT = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  pink: "bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
};

export default function PortfolioBar({ portfolios, counts, selected, onSelect, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const created = await onCreate(name);
    if (created) {
      setName("");
      setAdding(false);
      onSelect(created.id);
    }
  };

  // Nothing created yet and nothing to file: one quiet button, not an empty filter bar.
  if (!portfolios.length && !adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 dark:border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[var(--text-secondary)]"
      >
        <Plus size={13} /> Group these into portfolios
      </button>
    );
  }

  const pill = (key, label, count, tint) => (
    <button
      key={key}
      type="button"
      onClick={() => onSelect(key)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        selected === key ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-[var(--app-bg)]" : ""
      } ${tint}`}
    >
      {label}
      <span className="opacity-60">{count}</span>
    </button>
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {pill("all", "All", counts.all, TINT.slate)}

      {portfolios.map((p) => (
        <span key={p.id} className="relative inline-flex items-center">
          {pill(p.id, p.name, counts[p.id] || 0, TINT[p.colour] || TINT.slate)}
          {/* Only offered on the portfolio being looked at — a row of delete crosses is
              an accident waiting to happen. */}
          {selected === p.id && (
            <button
              type="button"
              title={`Delete ${p.name}`}
              onClick={() => onDelete(p.id)}
              className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-red-500"
            >
              <X size={13} />
            </button>
          )}
        </span>
      ))}

      {counts.unassigned > 0 && pill("unassigned", "Unassigned", counts.unassigned, TINT.slate)}

      {adding ? (
        <form onSubmit={submit} className="inline-flex items-center gap-1">
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !name && setAdding(false)}
            placeholder="Portfolio name"
            className="w-36 rounded-full border border-slate-300 dark:border-[var(--border-color)] bg-transparent px-3 py-1.5 text-xs dark:text-white"
          />
          <button type="submit" className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-white">
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 dark:border-[var(--border-color)] px-3 py-1.5 text-xs text-slate-500 dark:text-[var(--text-secondary)]"
        >
          <Plus size={13} /> New
        </button>
      )}
    </div>
  );
}
