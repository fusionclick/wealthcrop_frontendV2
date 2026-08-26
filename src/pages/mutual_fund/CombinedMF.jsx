import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { laravelUrl, nodeUrl, mergePortfolio, combinePortfolio } from "../../utils/nodeApi";
import { useNavMap, liveNav } from "../../utils/navSocket";
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
              {combined.unpriced} holding(s) ki NAV nahi mili — un ki current value invested ke
              barabar dikh rahi hai. Fund ko list se chun kar dobara add karo.
            </p>
          )}

          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold mb-2">Asset Allocation (dono milaa kar)</p>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={80} label>
                    {allocation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
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
              return (
                <div
                  key={r.key}
                  className="p-4 rounded-lg border bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] flex justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {r.sources.map((s) => (
                        <span
                          key={s}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            s === "internal"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {s === "internal" ? "Internal" : "External"}
                        </span>
                      ))}
                      <span className="text-[11px] text-gray-500">{r.category}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {r.units ? `${r.units} units` : "—"}
                      {r.nav ? ` · NAV ₹${r.nav.toFixed(2)}` : ""}
                      {r.folio ? ` · Folio ${r.folio}` : ""}
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
                        onClick={() =>
                          navigate("/mutual_fund/redeem", {
                            state: { scheme_bse_code: r.scheme_bse_code, code: r.scheme_bse_code },
                          })
                        }
                        className="mt-2 text-xs px-3 py-1 rounded-md bg-red-600 text-white"
                      >
                        Sell
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

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
