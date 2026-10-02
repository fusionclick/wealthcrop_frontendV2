import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { FALLBACK_SIP_DAYS, monthGrid } from "../../utils/sipDates";

/**
 * Audit #13 — the SIP start date, picked from a month where only the days that can actually
 * be registered are pickable: in the future AND one of the dates this scheme accepts.
 *
 * It replaces a native <input type="date">, which can be given a minimum but cannot be told
 * "only the 1st, 10th and 20th" — so the investor could pick any day and only find out from a
 * red line under the field. Here such a day is greyed out and cannot be clicked.
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const label = (value) => {
  const [y, m, d] = String(value || "").split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}` : "Pick a date";
};

export default function SipCalendar({ id, value, onChange, days = FALLBACK_SIP_DAYS }) {
  const [open, setOpen] = useState(false);
  const monthOf = (v) => {
    const [y, m] = String(v || "").split("-").map(Number);
    const now = new Date();
    return y && m ? { y, m: m - 1 } : { y: now.getFullYear(), m: now.getMonth() };
  };
  const [view, setView] = useState(() => monthOf(value));
  // The SIP-date dropdown moves the start date too; open on whichever month it landed in.
  useEffect(() => setView(monthOf(value)), [value]);

  const now = new Date();
  const atThisMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const shift = (n) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-left text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
      >
        <span>{label(value)}</span>
        <CalendarDays size={16} className="shrink-0 text-slate-500 dark:text-[var(--text-secondary)]" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose the SIP start date"
          className="absolute z-30 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={atThisMonth}
              aria-label="Previous month"
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:bg-transparent dark:text-[var(--text-secondary)] dark:hover:bg-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-800 dark:text-[var(--text-primary)]">
              {MONTHS[view.m]} {view.y}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next month"
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 dark:bg-transparent dark:text-[var(--text-secondary)] dark:hover:bg-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((w) => (
              <span key={w} className="text-[10px] font-medium text-slate-400 dark:text-[var(--text-secondary)]">
                {w}
              </span>
            ))}
            {monthGrid(view.y, view.m, { days }).map((cell, i) =>
              cell ? (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!cell.allowed}
                  aria-pressed={cell.iso === value}
                  onClick={() => {
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-xs ${
                    cell.iso === value
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : cell.allowed
                      ? "text-slate-800 hover:bg-blue-50 dark:text-[var(--text-primary)] dark:hover:bg-white/10"
                      : "text-slate-300 cursor-not-allowed dark:text-white/20"
                  }`}
                >
                  {cell.day}
                </button>
              ) : (
                <span key={`blank-${i}`} />
              )
            )}
          </div>

          <p className="mt-2 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
            Greyed-out days are in the past or not a date this scheme runs a SIP on.
          </p>
        </div>
      )}
    </div>
  );
}
