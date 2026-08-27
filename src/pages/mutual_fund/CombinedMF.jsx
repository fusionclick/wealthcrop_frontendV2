import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { laravelUrl, nodeUrl, mergePortfolio, combinePortfolio } from "../../utils/nodeApi";
import { useNavMap, liveNav } from "../../utils/navSocket";
import { ensureExternalNav } from "../../utils/externalNav";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const CombinedMF = () => {
  const navigate = useNavigate();
  const navs = useNavMap();
  const [sortBy, setSortBy] = useState("amount");
  const [filter, setFilter] = useState("all");
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  // ponytail: teeno queryKeys wahi hain jo Internal aur External pages use karte hain —
  // React Query cache hit deta hai, is page ke liye koi nayi request nahi jati.
  const { data: laravelOrders = [], isLoading: l1 } = useQuery({
    queryKey: ["investedFunds"],
    queryFn: () => getApiWithToken(laravelUrl(import.meta.env.VITE_GET_FUNDLIST)),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });

  const { data: bseHoldings = [], isLoading: l2 } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => res?.data?.holdings || [],
    enabled: !!ucc,
  });

  const { data: externalRows = [], isLoading: l3 } = useQuery({
    queryKey: ["externalMf"],
    queryFn: () => getApiWithToken(laravelUrl(import.meta.env.VITE_EXTERNAL_MF || "/portfolio/mf/external")),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });

  const qc = useQueryClient();

  // published NAV catalogue se backfill — formula AMC ki taraf calculate hoti hai
  useEffect(() => {
    let cancelled = false;
    const need = externalRows.filter((r) => !r.scheme_isin || !(Number(r.nav) > 0));
    if (!need.length) return undefined;
    (async () => {
      let patched = 0;
      for (const row of need) {
        if (cancelled) return;
        const res = await ensureExternalNav(row, navs);
        if (res.patched) patched += 1;
      }
      if (!cancelled && patched > 0) qc.invalidateQueries({ queryKey: ["externalMf"] });
    })();
    return () => {
      cancelled = true;
    };
  }, [externalRows, navs, qc]);

  const internal = useMemo(
    () => mergePortfolio(laravelOrders, bseHoldings),
    [laravelOrders, bseHoldings]
  );

  const combined = useMemo(
    () =>
      combinePortfolio(internal, externalRows, (row) =>
        liveNav({ scheme_isin: row.scheme_isin, scheme_bse_code: row.scheme_bse_code, nav: row.nav }, navs)
      ),
    [internal, externalRows, navs]
  );

  const shown = useMemo(() => {
    const list = filter === "all" ? combined.rows : combined.rows.filter((r) => r.sources.includes(filter));
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "returns") {
        const p = (r) => (r.invested ? ((r.current - r.invested) / r.invested) * 100 : 0);
        return p(b) - p(a);
      }
      return b.invested - a.invested;
    });
  }, [combined, filter, sortBy]);

  const allocation = useMemo(() => {
    const map = {};
    combined.rows.forEach((r) => {
      map[r.category] = (map[r.category] || 0) + r.invested;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [combined]);

  if (l1 || l2 || l3) return <FundDashboardSkeleton />;

  const { totals } = combined;

  return (
    <div className="p-4 min-h-screen bg-slate-50 dark:bg-[var(--app-bg)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">
          Combined Portfolio
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          WealthCrop se li hui aur bahar se li hui — dono holdings ek jagah. Ek hi fund
          dono taraf ho to wo ek line mein jurr jata hai.
        </p>
      </div>

      {!combined.rows.length ? (
        <div className="text-center py-16 border border-dashed rounded-xl dark:border-[var(--border-color)]">
          <p className="text-sm font-medium">Abhi koi holding nahi</p>
          <p className="text-xs text-slate-500 mt-1">
            Fund khareedo ya External Portfolio mein apni purani holdings add karo.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <button onClick={() => navigate("/user/mutual_fund/explore")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs">
              Explore Funds
            </button>
            <button onClick={() => navigate("/user/mutual_fund/external")} className="px-4 py-2 border rounded-lg text-xs dark:border-[var(--border-color)]">
              Add External
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card label="Current Value" value={money(totals.current)} />
            <Card label="Invested" value={money(totals.invested)} />
            <Card
              label="P&amp;L"
              value={`${totals.pnl >= 0 ? "+" : ""}${money(totals.pnl)}`}
              tone={totals.pnl >= 0 ? "text-emerald-600" : "text-red-500"}
            />
            <Card label="Returns" value={`${totals.pnlPct.toFixed(2)}%`} />
          </div>

          {/* Kis taraf se kitna — combined number ka breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Split title="Internal (WealthCrop)" t={combined.internal} tone="border-l-emerald-500" />
            <Split title="External (bahar se)" t={combined.external} tone="border-l-blue-500" />
          </div>

          {combined.unpriced > 0 && (
            <p className="text-[11px] text-amber-600 mb-4">
              {combined.unpriced} holding(s) ki NAV missing ya invested se match nahi karti — un ki
              current value invested ke barabar dikh rahi hai. Fund ko list se chun kar dobara add karo.
            </p>
          )}

          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold mb-2">Asset Allocation (dono milaa kar)</p>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {allocation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {allocation.map((a, i) => (
                <span key={a.name} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  {a.name}: {money(a.value)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex gap-1">
              {[
                // Counts button ke apne filter se — splits raw holdings ginte hain,
                // yahan rows chahiye, warna merge hone par number mel nahi khata.
                ["all", `All (${combined.rows.length})`],
                ["internal", `Internal (${combined.rows.filter((r) => r.sources.includes("internal")).length})`],
                ["external", `External (${combined.rows.filter((r) => r.sources.includes("external")).length})`],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`text-xs px-3 py-1 rounded-md border dark:border-[var(--border-color)] ${
                    filter === k ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-transparent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border rounded-md p-1 dark:bg-transparent dark:border-[var(--border-color)]"
            >
              <option value="amount">Sort by Invested</option>
              <option value="name">Sort by Name</option>
              <option value="returns">Sort by Returns</option>
            </select>
          </div>

          <div className="space-y-3">
            {shown.map((r) => {
              const pnl = r.current - r.invested;
              const pct = r.invested ? (pnl / r.invested) * 100 : 0;
              const merged = r.parts.length > 1;

              const body = (
                <>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {r.sources.map((s) => (
                        <SourceTag key={s} source={s} />
                      ))}
                      {!r.priced && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          {r.nav ? "Units/invested check karo" : "NAV fetch pending"}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500">{r.category}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {r.units ? `${r.units} units` : "—"}
                      {r.nav ? ` · NAV ₹${r.nav.toFixed(2)}` : " · NAV —"}
                      {r.folio ? ` · Folio ${r.folio}` : ""}
                      {merged && (
                        <span className="ml-1 text-blue-600 group-open:hidden">
                          · breakdown dekhne ke liye click karo
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{money(r.current)}</p>
                    <p className="text-[11px] text-slate-500">Invested {money(r.invested)}</p>
                    <p className={`text-xs ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {pnl >= 0 ? "+" : ""}
                      {money(pnl)} ({pct.toFixed(2)}%)
                    </p>
                    {r.sources.includes("internal") && r.scheme_bse_code && (
                      <button
                        type="button"
                        // preventDefault warna <summary> ke andar click row ko toggle kar deta hai
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate("/mutual_fund/redeem", {
                            state: { scheme_bse_code: r.scheme_bse_code, code: r.scheme_bse_code },
                          });
                        }}
                        className="mt-2 text-xs px-3 py-1 rounded-md bg-red-600 text-white"
                      >
                        Sell
                      </button>
                    )}
                  </div>
                </>
              );

              const shell =
                "p-4 rounded-lg border bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)]";

              // ponytail: expand/collapse native <details> se — koi state, koi library nahi.
              // Sirf merged rows khulti hain; single-source row ke andar dikhane ko kuch nahi.
              if (!merged) {
                return (
                  <div key={r.key} className={`${shell} flex justify-between gap-3`}>
                    {body}
                  </div>
                );
              }

              return (
                <details key={r.key} className={`${shell} group`}>
                  <summary className="flex justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    {body}
                  </summary>
                  <div className="mt-3 pt-3 border-t dark:border-[var(--border-color)] space-y-2">
                    {r.parts.map((p) => {
                      const ppnl = p.current - p.invested;
                      const ppct = p.invested ? (ppnl / p.invested) * 100 : 0;
                      return (
                        <div key={p.source} className="flex justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <SourceTag source={p.source} />
                            <span className="ml-2 text-[11px] text-gray-500">
                              {p.units ? `${p.units} units` : "—"}
                              {p.nav ? ` · NAV ₹${p.nav.toFixed(2)}` : ""}
                              {p.folio ? ` · Folio ${p.folio}` : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold">{money(p.current)}</span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Invested {money(p.invested)}
                            </span>
                            <span className={`ml-2 ${ppnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {ppnl >= 0 ? "+" : ""}
                              {money(ppnl)} ({ppct.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const SourceTag = ({ source }) => (
  <span
    className={`text-[10px] px-1.5 py-0.5 rounded ${
      source === "internal" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
    }`}
  >
    {source === "internal" ? "Internal" : "External"}
  </span>
);

const Card = ({ label, value, tone = "" }) => (
  <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

const Split = ({ title, t, tone }) => (
  <div className={`bg-white dark:bg-[var(--white-10)] p-3 rounded-xl border border-l-4 ${tone} dark:border-[var(--border-color)] dark:${tone}`}>
    <p className="text-[11px] text-slate-500">
      {title} · {t.count} holding{t.count === 1 ? "" : "s"}
    </p>
    <div className="flex justify-between text-sm mt-1">
      <span className="font-semibold">{money(t.current)}</span>
      <span className={t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}>
        {t.pnl >= 0 ? "+" : ""}
        {money(t.pnl)} ({t.pnlPct.toFixed(2)}%)
      </span>
    </div>
    <p className="text-[11px] text-slate-500">Invested {money(t.invested)}</p>
  </div>
);

export default CombinedMF;
