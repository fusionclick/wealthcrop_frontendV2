import React, { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { postApiWithToken } from "../../api/api";
import { fetchStockChart, fetchStockDetails } from "../../api/marketApi";
import { nodeUrl } from "../../utils/nodeApi";
import { benchmarkXirr, fundValue, stockValue } from "../../utils/portfolioAnalytics";

/**
 * Audit #54 / #62 — the portfolio-level views on My Investments:
 *   - asset allocation at MARKET value, stocks included (computed by the dashboard)
 *   - the portfolio XIRR against the Nifty 50 over the same cash flows
 *   - risk and return of the whole fund portfolio (Node /portfolio-metrics, scheme.js maths)
 *   - sector allocation across stocks and funds, where a source exists
 */

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (v, digits = 2) => (v == null || !Number.isFinite(Number(v)) ? "—" : `${Number(v) >= 0 ? "+" : "−"}${Math.abs(Number(v)).toFixed(digits)}%`);
const num = (v) => (v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toFixed(2));
const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

const card = "bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] rounded-lg p-4";
const muted = "text-[11px] text-slate-500 dark:text-[var(--text-secondary)]";

export default function PortfolioInsights({ allocation = [], funds = [], stocks = [], orders = [], xirr = null, scopeLabel = "" }) {
  // ---- Benchmark (Audit #54) ------------------------------------------------------------
  // The index series comes from the market API (/market/chart/NIFTY → Yahoo ^NSEI).
  const { data: nifty = [] } = useQuery({
    queryKey: ["niftyHistory10y"],
    queryFn: () => fetchStockChart("NIFTY", "10y", "1d"),
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const bench = useMemo(() => benchmarkXirr(orders, nifty), [orders, nifty]);

  // ---- Risk & return (Audit #62) -------------------------------------------------------
  const holdings = useMemo(
    () =>
      funds
        .filter((f) => Number(f.units) > 0)
        .map((f) => ({ isin: f.scheme_isin || "", scheme_code: f.scheme_bse_code || "", name: f.scheme_name, units: Number(f.units) })),
    [funds]
  );
  const { data: risk, isFetching: riskLoading } = useQuery({
    queryKey: ["portfolioMetrics", holdings],
    queryFn: () => postApiWithToken(nodeUrl("/portfolio-metrics"), { holdings }, { silent: true }),
    select: (res) => res?.data || null,
    enabled: holdings.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  // ---- Sectors: stocks from the market data, funds from their AMC disclosures -------------
  const stockDetails = useQueries({
    queries: stocks.map((s) => ({
      queryKey: ["stockSector", s.symbol],
      queryFn: () => fetchStockDetails(s.symbol),
      select: (res) => res?.data?.stats?.sector || null,
      staleTime: 6 * 60 * 60 * 1000,
      retry: false,
    })),
  });
  const sectors = useMemo(() => {
    const by = {};
    let covered = 0;
    stocks.forEach((s, i) => {
      const sector = stockDetails[i]?.data;
      const v = stockValue(s);
      if (sector && v > 0) {
        by[sector] = (by[sector] || 0) + v;
        covered += v;
      }
    });
    // Node reports fund sectors as a share of the funds that disclosed one; turn that back
    // into rupees using what those funds are worth.
    const fundTotal = funds.reduce((a, f) => a + fundValue(f), 0);
    const fundCovered = (fundTotal * (Number(risk?.sectors?.coveragePct) || 0)) / 100;
    for (const row of risk?.sectors?.rows || []) {
      by[row.name] = (by[row.name] || 0) + (fundCovered * row.pct) / 100;
    }
    covered += fundCovered;
    const total = fundTotal + stocks.reduce((a, s) => a + stockValue(s), 0);
    const rows = Object.entries(by)
      .map(([name, value]) => ({ name, value, pct: covered > 0 ? (value / covered) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    return { rows, coveredPct: total > 0 ? (covered / total) * 100 : 0 };
  }, [stocks, stockDetails, funds, risk]);

  const m = risk?.metrics;

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-5">
      {/* ASSET ALLOCATION — market value, stocks included */}
      <div className={card}>
        <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">Asset allocation{scopeLabel ? ` · ${scopeLabel}` : ""}</p>
        <p className={muted}>At market value — funds at the latest NAV, stocks at live prices.</p>
        {allocation.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-4">Nothing to allocate in this view.</p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={70} label={({ pct: p }) => `${p.toFixed(1)}%`}>
                    {allocation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {allocation.map((item, i) => (
                <span key={item.name} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  {item.name}: {money(item.value)} ({item.pct.toFixed(1)}%)
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BENCHMARK — same cash flows into the Nifty 50 */}
      <div className={card}>
        <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">Your funds vs Nifty 50</p>
        <p className={muted}>Your XIRR against the same purchases and redemptions, on the same dates, made in the Nifty 50.</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className={muted}>Your XIRR</p>
            <p className={`text-lg font-semibold ${xirr == null ? "text-slate-900 dark:text-[var(--text-primary)]" : xirr >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {xirr == null ? "—" : pct(xirr)}
            </p>
          </div>
          <div>
            <p className={muted}>Nifty 50</p>
            <p className={`text-lg font-semibold ${bench == null ? "text-slate-900 dark:text-[var(--text-primary)]" : bench.xirr >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {bench == null ? "—" : pct(bench.xirr)}
            </p>
          </div>
          <div>
            <p className={muted}>Difference</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">
              {xirr == null || bench == null ? "—" : `${xirr - bench.xirr >= 0 ? "+" : "−"}${Math.abs(xirr - bench.xirr).toFixed(2)} pts`}
            </p>
          </div>
        </div>
        <p className={`${muted} mt-3`}>
          {bench
            ? `${day(bench.from)} – ${day(bench.to)}. Nifty 50 price index (dividends not included), whole fund portfolio.`
            : "Shown once there are settled orders and the index history covers them."}
        </p>
      </div>

      {/* RISK & RETURN — Audit #62 */}
      <div className={card}>
        <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">Risk &amp; return{scopeLabel ? ` · ${scopeLabel}` : ""}</p>
        <p className={muted}>
          {m
            ? `What your current fund units would have done, ${day(m.from)} – ${day(m.to)} (${m.tradingDays} trading days). Stocks not included.`
            : "Measured from the daily value of your current fund units."}
        </p>
        {m ? (
          <>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                ["Annualised return", pct(m.annualisedReturn)],
                ["Volatility", m.volatility == null ? "—" : `${m.volatility.toFixed(2)}%`],
                ["Sharpe ratio", num(m.sharpe)],
                ["Max drawdown", m.maxDrawdown == null ? "—" : `${m.maxDrawdown.toFixed(2)}%`],
                ["VaR (95%, 1 day)", m.var95 == null ? "—" : `${m.var95.toFixed(2)}%`],
                [`Beta vs ${m.benchmark || "Nifty 50"}`, num(m.beta)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className={muted}>{label}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
            <p className={`${muted} mt-3`}>
              Sharpe uses a {m.riskFreeRate}% risk-free rate. VaR: the one-day loss exceeded on the worst 5% of days. Beta is
              measured against the Nifty 50 price index.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-4">
            {riskLoading ? "Measuring…" : risk?.reason || (holdings.length ? "Risk metrics are unavailable right now." : "No fund units in this view.")}
          </p>
        )}
        {risk?.skipped?.length > 0 && (
          <p className={`${muted} mt-2`}>
            Not included: {risk.skipped.map((s) => `${s.name} (${s.reason.toLowerCase()})`).join("; ")}.
          </p>
        )}
      </div>

      {/* SECTORS */}
      <div className={card}>
        <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">Sector allocation{scopeLabel ? ` · ${scopeLabel}` : ""}</p>
        {sectors.rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-4">
            No sector data yet: stocks show their sector once priced, and a fund once its monthly portfolio disclosure is
            available.
          </p>
        ) : (
          <>
            <div className="space-y-1.5 mt-3">
              {sectors.rows.slice(0, 8).map((row) => (
                <div key={row.name} className="flex items-center gap-2 text-xs">
                  <span className="w-36 truncate text-slate-600 dark:text-[var(--text-secondary)]" title={row.name}>
                    {row.name}
                  </span>
                  <div className="flex-1 h-2 rounded bg-slate-100 dark:bg-[var(--gray-800)] overflow-hidden">
                    <div className="h-2 bg-blue-500" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-slate-700 dark:text-[var(--text-primary)]">{row.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <p className={`${muted} mt-3`}>
              Covers {sectors.coveredPct.toFixed(0)}% of this view’s value; holdings without sector data are left out.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
