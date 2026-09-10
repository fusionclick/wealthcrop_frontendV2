import React, { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RANGES, INTERVALS, bucketSeries, fmtLabel } from "./navSeries";

export default function MFChart({ series = [], height = 320, synthetic = false }) {
  const [range, setRange] = useState("1Y");
  const [interval, setInterval] = useState("D");
  // ponytail: native <input type="date"> — koi date-picker library nahi. min/max chart
  // ke apne data se aate hain, to koi aisi tareekh chuni hi nahi ja sakti jispar NAV nahi.
  const [span, setSpan] = useState({ from: "", to: "" });
  const custom = Boolean(span.from || span.to);

  const bounds = useMemo(() => {
    const rows = series.filter((d) => d?.timestamp && Number(d.nav) > 0);
    const iso = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
    return rows.length ? { min: iso(rows[0].timestamp), max: iso(rows[rows.length - 1].timestamp) } : {};
  }, [series]);

  const rows = useMemo(
    () =>
      bucketSeries(series, range, interval, custom ? span : null).map((d) => ({
        ...d,
        nav: Number(d.nav),
        label: fmtLabel(d.timestamp, interval),
      })),
    [series, range, interval, custom, span]
  );

  /**
   * Har interval is waqt kitne nuqte dega.
   *
   * Teenon buttons hamesha chalu rehte the, chahe range kitni hi chhoti ho. 1W par
   * Weekly do nuqte deta tha (ek seedhi tirchi lakeer, jiska koi matlab nahi) aur
   * Monthly ek — sirf ek tanha dot, na lakeer, aur change badge bhi gayab kyunke
   * ek nuqte se koi tabdeeli nikalti hi nahi. Interval ka chunav range par munhasir
   * hai, is liye faisla data se karo: jo interval do se kam nuqte de wo dena hi mat.
   * Yehi hisaab custom date range par bhi chalta hai, sirf preset ranges par nahi.
   */
  const pointsPerInterval = useMemo(() => {
    const out = {};
    for (const k of Object.keys(INTERVALS)) {
      out[k] = bucketSeries(series, range, k, custom ? span : null).length;
    }
    return out;
  }, [series, range, custom, span]);

  // Do nuqte sirf ek seedhi tirchi lakeer banate hain: wo shuru aur aakhir ke ilawa kuch
  // nahi batati (jo change badge pehle hi bata deta hai) aur ulta ye jhoot bolti hai ke
  // beech mein safar seedha tha. 1W par Weekly bilkul yehi karta tha — 6 asli daily NAV
  // ko 2 bucket mein daal kar. Shakl dikhane ke liye kam az kam teen nuqte chahiye.
  const MIN_POINTS = 3;

  // Agar data itna hi kam hai ke koi bhi interval teen nuqte na de (naya fund), to kisi
  // ko disable mat karo — jo mojood hai wahi dikha do.
  const anyUsable = Object.keys(INTERVALS).some((k) => (pointsPerInterval[k] ?? 0) >= MIN_POINTS);
  const usable = (k) => !anyUsable || (pointsPerInterval[k] ?? 0) >= MIN_POINTS;

  // Range badalne par agar mojooda interval be-matlab ho jaye to sabse baareek
  // chalne wale par khud aa jao — warna user ek tanha dot dekhta reh jata hai.
  useEffect(() => {
    if (usable(interval)) return;
    const next = Object.keys(INTERVALS).find(usable);
    if (next) setInterval(next);
  }, [pointsPerInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickRange = (r) => {
    setSpan({ from: "", to: "" });
    setRange(r);
  };

  const change = rows.length > 1 ? ((rows[rows.length - 1].nav - rows[0].nav) / rows[0].nav) * 100 : null;
  const up = (change ?? 0) >= 0;
  const stroke = up ? "#00b26a" : "#e5484d";

  const btn = (active, disabled = false) =>
    `px-2.5 py-1 rounded-md text-xs font-medium transition ${
      disabled
        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-[var(--white-5)] dark:text-[var(--text-secondary)]"
        : active
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)]"
    }`;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(RANGES).map((r) => (
            <button key={r} type="button" onClick={() => pickRange(r)} className={btn(!custom && range === r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {Object.entries(INTERVALS).map(([k, label]) => {
            const ok = usable(k);
            return (
              <button
                key={k}
                type="button"
                disabled={!ok}
                onClick={() => setInterval(k)}
                className={btn(interval === k, !ok)}
                title={
                  ok
                    ? label
                    : `${label} needs a longer range — this one has ${pointsPerInterval[k] ?? 0} ${
                        (pointsPerInterval[k] ?? 0) === 1 ? "point" : "points"
                      }`
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">Date range</span>
        <input
          type="date"
          aria-label="From date"
          value={span.from}
          min={bounds.min}
          max={span.to || bounds.max}
          onChange={(e) => setSpan((p) => ({ ...p, from: e.target.value }))}
          className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white dark:bg-[var(--white-5)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          aria-label="To date"
          value={span.to}
          min={span.from || bounds.min}
          max={bounds.max}
          onChange={(e) => setSpan((p) => ({ ...p, to: e.target.value }))}
          className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white dark:bg-[var(--white-5)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
        />
        {custom && (
          <button
            type="button"
            onClick={() => setSpan({ from: "", to: "" })}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {!rows.length ? (
        <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400 border border-slate-200 rounded-xl dark:border-[var(--border-color)]">
          {custom ? "No NAV published in this date range" : "NAV chart unavailable"}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-semibold text-slate-900 dark:text-[var(--text-primary)]">
              ₹{rows[rows.length - 1].nav.toFixed(2)}
            </span>
            {change != null && (
              <span className={`text-sm font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
                {up ? "+" : ""}
                {change.toFixed(2)}% · {custom ? `${span.from || bounds.min} → ${span.to || bounds.max}` : range}
              </span>
            )}
          </div>
          <div
            className="w-full rounded-xl border border-slate-300 bg-white dark:border-[var(--border-color)] dark:bg-[var(--card-bg)]"
            style={{ height }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="label" minTickGap={48} tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(v) => [`₹${Number(v).toFixed(4)}`, "NAV"]} labelFormatter={(l) => l} />
                <Area type="monotone" dataKey="nav" stroke={stroke} fill={`${stroke}22`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {synthetic
              ? "Indicative trend — NAV history unavailable for this scheme, projected from reported returns."
              : `${INTERVALS[interval]} NAV · ${rows.length} points`}
          </p>
        </>
      )}
    </div>
  );
}
