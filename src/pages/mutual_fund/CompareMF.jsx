import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { postApi } from "../../api/api";
import { nodeUrl, fundPath, MF_EXPLORE_PATH } from "../../utils/nodeApi";
import { titleCase, fmtPct, fmtDate, fmtAge } from "../../utils/schemeName";
import { annualise } from "../../components/chart/navSeries";
import FundBadges, { RiskBadge } from "../../components/FundBadges";
import PageLoader from "../../components/PageLoader";

/**
 * FUND COMPARISON
 *
 * Two funds cannot share a y-axis by NAV: a ₹15 NAV is not "cheaper" than a ₹1,700 one, they
 * are simply different unit sizes. So every fund is rebased to 100 at the start of the
 * window and the chart shows what ₹100 became — that is the only like-for-like reading.
 *
 * The window itself is the backend's doing: it starts at the LATEST inception among the
 * funds picked, because that is the only stretch all of them actually lived through, and it
 * names the fund that set that boundary so the chart's start date is explained rather than
 * mysterious.
 */

// Distinct at a glance, and distinguishable in the common forms of colour blindness.
const COLORS = ["#2563eb", "#059669", "#d97706", "#db2777"];

const RANGES = { "1Y": 365, "3Y": 1095, "5Y": 1825, "10Y": 3650, ALL: Infinity };

export default function CompareMF() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [range, setRange] = useState("ALL");
  const [mode, setMode] = useState("cagr");

  // "isin~code,isin~code" — both halves travel because either one alone can resolve a
  // scheme, and BSE's older rows are reachable only by code.
  const picks = useMemo(() => {
    return String(params.get("funds") || "")
      .split(",")
      .map((pair) => {
        const [isin, code] = pair.split("~");
        return { isin: (isin || "").trim(), scheme_code: (code || "").trim() };
      })
      .filter((p) => p.isin || p.scheme_code);
  }, [params]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["MF_COMPARE", picks],
    queryFn: () => postApi(nodeUrl("/scheme-compare"), { schemes: picks }),
    enabled: picks.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const funds = data?.data?.funds || [];
  const commonStart = data?.data?.commonStart || null;
  const limitedBy = data?.data?.limitedBy || null;

  // A range wider than the shared window would draw the shared window and call it 10Y.
  const fullSpan = useMemo(() => {
    const withData = funds.filter((f) => f.rebased?.length > 1);
    if (!withData.length) return 0;
    const first = Math.min(...withData.map((f) => f.rebased[0].timestamp));
    const last = Math.max(...withData.map((f) => f.rebased[f.rebased.length - 1].timestamp));
    return (last - first) / 86400;
  }, [funds]);

  const windowYears = fullSpan / 365;
  const annualised = mode === "cagr";

  /**
   * The toggle has two consumers with different validity, so they are separated here.
   *
   * The TABLE's CAGR is always available — those are each fund's own trailing 1Y/3Y/5Y
   * figures, computed by the backend, and none of them depends on what the chart is showing.
   *
   * The CHART's is not. A CAGR point needs a full year to have elapsed before it means
   * anything (annualising a fortnight is how 3% becomes "112% p.a."), so on a one-year range
   * every point but the last is dropped and the line becomes a dot. Two years is the first
   * window that leaves something worth drawing; below that the chart stays on growth-of-₹100
   * and the caption says so, rather than going blank or disabling a control the table still
   * needs.
   */
  const drawnDays = RANGES[range] === Infinity ? fullSpan : Math.min(fullSpan, RANGES[range]);
  const chartAnnualised = annualised && drawnDays / 365 >= 2;

  /**
   * Re-rebase for the chosen range.
   *
   * Slicing the already-rebased line would leave every fund starting at whatever it happened
   * to be worth on that date — three lines beginning at 143, 96 and 210, which is unreadable
   * and not what "last 3 years" means. Each fund is rebased again off its own NAV at the
   * start of the new window.
   *
   * The chart follows the Absolute/CAGR toggle, because it sits in this card's toolbar and a
   * control that changes nothing it is standing next to reads as a broken chart. Absolute is
   * the growth of ₹100; CAGR is that same growth annualised, and it drops the window's first
   * year for the reason above.
   */
  const { rows, series } = useMemo(() => {
    const days = RANGES[range];
    const withData = funds.filter((f) => f.rebased?.length > 1);
    if (!withData.length) return { rows: [], series: [] };

    const latest = Math.max(...withData.map((f) => f.rebased[f.rebased.length - 1].timestamp));
    const cut = days === Infinity ? -Infinity : latest - days * 86400;

    // Compute ann inside the memo so mode and fullSpan are explicit deps — avoids a stale
    // chartAnnualised if fullSpan resolved to 0 on an earlier render.
    const first = Math.min(...withData.map((f) => f.rebased[0].timestamp));
    const spanDays = (latest - first) / 86400;
    const drawnDays = days === Infinity ? spanDays : Math.min(spanDays, days);
    const ann = mode === "cagr" && drawnDays / 365 >= 2;

    const lines = withData.map((f, i) => {
      const win = f.rebased.filter((p) => p.timestamp >= cut);
      const base = win[0]?.nav;
      const t0 = win[0]?.timestamp;
      const points = [];
      if (base > 0) {
        for (const p of win) {
          const ratio = p.nav / base;
          if (!(ratio > 0)) continue;
          if (ann) {
            const years = (p.timestamp - t0) / (86400 * 365);
            if (years < 1) continue;
            points.push({ timestamp: p.timestamp, value: (Math.pow(ratio, 1 / years) - 1) * 100 });
          } else {
            points.push({ timestamp: p.timestamp, value: ratio * 100 });
          }
        }
      }
      return { key: `f${i}`, name: titleCase(f.name), color: COLORS[i % COLORS.length], points };
    });

    // Union of dates: NAV is published on business days and AMCs skip different holidays,
    // so an inner join would drop points. Recharts connects the gaps.
    const byTs = new Map();
    for (const line of lines) {
      for (const p of line.points) {
        const row = byTs.get(p.timestamp) || { timestamp: p.timestamp };
        row[line.key] = parseFloat(p.value.toFixed(2));
        byTs.set(p.timestamp, row);
      }
    }
    const merged = [...byTs.values()]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((r) => ({
        ...r,
        label: new Date(r.timestamp * 1000).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      }));
    return { rows: merged, series: lines.filter((l) => l.points.length > 1) };
  }, [funds, range, mode]);

  if (picks.length < 2) {
    return (
      <div className="w-full py-16 px-5 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Pick at least two funds to compare</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Tick the box beside any funds in Explore, then press Compare.
        </p>
        <button
          onClick={() => navigate(MF_EXPLORE_PATH)}
          className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;
  if (error) {
    return (
      <div className="w-full py-16 px-5 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Could not load the comparison</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">{String(error.message || error)}</p>
      </div>
    );
  }

  const retOf = (f, key) => {
    const set = annualised ? f.returns?.cagr : f.returns?.absolute;
    const v = set?.[key];
    return v == null ? "—" : fmtPct(v, { annualised });
  };

  /**
   * The "Since <date>" cell used to print the cumulative figure in BOTH modes, so picking
   * CAGR gave a row reading "-4.00% p.a. · 7.43% p.a. · 7.20% p.a. · +155.56%" — three
   * annualised numbers and one twenty-year total, side by side, with nothing saying which
   * was which. Whoever read across that row compared 155.56 against 7.43.
   *
   * A total of -100% or worse cannot be annualised (the root of a negative), so it stays
   * cumulative rather than rendering NaN.
   */
  const sinceOf = (f) => {
    const r = f.windowReturn;
    if (r == null) return "—";
    const pa = annualised ? annualise(r, windowYears) : null;
    return pa == null ? fmtPct(r, { sign: true }) : fmtPct(pa, { sign: true, annualised: true });
  };

  return (
    <div className="w-full py-6 px-5 md:px-10 lg:px-14 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Compare funds</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Every fund rebased to ₹100
            {commonStart ? ` on ${fmtDate(commonStart)}` : ""}
            {limitedBy ? ` — the window starts there because ${titleCase(limitedBy)} is the youngest of these.` : "."}
          </p>
        </div>
        <button
          onClick={() => navigate(MF_EXPLORE_PATH)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[var(--border-color)] text-sm"
        >
          Change selection
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.keys(RANGES).map((r) => {
            const ok = RANGES[r] === Infinity || fullSpan >= RANGES[r] * 0.9;
            return (
              <button
                key={r}
                type="button"
                disabled={!ok}
                onClick={() => setRange(r)}
                title={ok ? `Last ${r}` : `These funds share about ${(fullSpan / 365).toFixed(1)} years of history`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  !ok
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-[var(--white-5)] dark:text-[var(--text-secondary)]"
                    : range === r
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)]"
                }`}
              >
                {r}
              </button>
            );
          })}
          <div className="ml-auto inline-flex rounded-md overflow-hidden border border-slate-200 dark:border-[var(--border-color)]">
            {[["absolute", "Absolute"], ["cagr", "CAGR"]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                title={k === "cagr" ? "Annualised — p.a." : "Total change over the period"}
                onClick={() => setMode(k)}
                className={`px-2.5 py-1 text-xs font-medium transition ${
                  mode === k
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {series.length ? (
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="label" minTickGap={48} tick={{ fontSize: 11 }} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  width={56}
                  tickFormatter={(v) => (chartAnnualised ? `${v}%` : `₹${v}`)}
                />
                <Tooltip
                  formatter={(v, n) => [
                    chartAnnualised ? `${Number(v).toFixed(2)}% p.a.` : `₹${Number(v).toFixed(2)}`,
                    n,
                  ]}
                  labelFormatter={(l) => l}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 mt-2">
              {chartAnnualised
                ? `Annualised return since the start of this window — the first year is not drawn, because annualising a few months is noise · ${rows.length} points`
                : annualised
                ? `Growth of ₹100 invested at the start of this window · ${rows.length} points — CAGR needs at least two years in view, so the table is annualised and this chart is not`
                : `Growth of ₹100 invested at the start of this window · ${rows.length} points`}
            </p>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-slate-400">
            None of the selected funds has enough NAV history to chart.
          </div>
        )}
      </div>

      {/* Funds with no published NAV history do not break the comparison — they are named,
          with the reason, and still appear in the table below. */}
      {funds.some((f) => f.unavailable) && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          No NAV history published for{" "}
          {funds.filter((f) => f.unavailable).map((f) => titleCase(f.name)).join(", ")} — the rest of the
          comparison is unaffected.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-secondary)] bg-slate-50 dark:bg-[var(--white-5)]">
              <th className="py-3 px-4 font-semibold">Fund</th>
              <th className="py-3 px-4 font-semibold">Risk</th>
              <th className="py-3 px-4 font-semibold">1Y</th>
              <th className="py-3 px-4 font-semibold">3Y</th>
              <th className="py-3 px-4 font-semibold">5Y</th>
              <th className="py-3 px-4 font-semibold">Since {commonStart ? fmtDate(commonStart) : "start"}</th>
              <th className="py-3 px-4 font-semibold">Expense</th>
              <th className="py-3 px-4 font-semibold">Age</th>
              <th className="py-3 px-4 font-semibold">NAV</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((f, i) => (
              <tr key={`${f.scheme_isin}-${f.scheme_bse_code}`} className="border-t border-slate-200 dark:border-[var(--border-color)]">
                <td className="py-3 px-4 min-w-[240px]">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0">
                      <button
                        onClick={() => navigate(fundPath(f.scheme_isin, f.scheme_bse_code))}
                        className="text-left font-medium text-[var(--text-primary)] hover:underline"
                      >
                        {titleCase(f.name)}
                      </button>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">{f.scheme_isin || "—"}</p>
                      <FundBadges fund={f} className="mt-1.5" />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4"><RiskBadge risk={f.risk} /></td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{retOf(f, "1Y")}</td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{retOf(f, "3Y")}</td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{retOf(f, "5Y")}</td>
                <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{sinceOf(f)}</td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{f.expense ? `${f.expense}%` : "—"}</td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{fmtAge(f.ageYears) || "—"}</td>
                <td className="py-3 px-4 text-[var(--text-primary)]">{f.nav != null ? `₹${Number(f.nav).toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)]">
        1Y / 3Y / 5Y are each fund&apos;s own trailing returns over its full history. The
        &ldquo;Since&rdquo; column is the shared window drawn above, which is the only one where
        these funds can be compared like for like. Past performance does not indicate future returns.
      </p>
    </div>
  );
}
