import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import emptyDashboardImg from "../../assets/mutualFund/emptyDashboard.svg";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";
import { useSelector } from "react-redux";
import { laravelUrl, nodeUrl, mergePortfolio, calcXirr, fundBuyPath } from "../../utils/nodeApi";
import HoldingSheet from "../../components/mutual_fund/HoldingSheet";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const DashBoardMF = () => {
  const [sortBy, setSortBy] = useState("name");
  const [openHolding, setOpenHolding] = useState(null);
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  const { data: laravelOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["investedFunds"],
    queryFn: () => getApiWithToken(laravelUrl(import.meta.env.VITE_GET_FUNDLIST)),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });

  const { data: bseHoldings, isLoading: loadingBse } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () =>
      postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => res?.data?.holdings || [],
    enabled: !!ucc,
  });

  const funds = useMemo(
    () => mergePortfolio(laravelOrders || [], bseHoldings || []),
    [laravelOrders, bseHoldings]
  );

  const hasInvestments = funds.length > 0;
  const totalInvested = funds.reduce((acc, f) => acc + (Number(f.inv_amo) || 0), 0);
  const totalReturns = funds.reduce(
    (acc, f) => acc + ((Number(f.inv_amo) || 0) * (Number(f.ret_percentage) || 0)) / 100,
    0
  );
  const currentValue = totalInvested + totalReturns;
  const xirr = calcXirr(funds);
  const activeSipCount = funds.filter((f) => f.sip_status === "ACTIVE").length;

  const allocation = useMemo(() => {
    const map = {};
    funds.forEach((f) => {
      const cat = f.scheme_category || f.category || "Other";
      map[cat] = (map[cat] || 0) + (Number(f.inv_amo) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [funds]);

  const sortedFunds = useMemo(() => {
    return [...funds].sort((a, b) => {
      if (sortBy === "name") return (a.scheme_name || "").localeCompare(b.scheme_name || "");
      if (sortBy === "amount") return (Number(b.inv_amo) || 0) - (Number(a.inv_amo) || 0);
      if (sortBy === "returns") return (Number(b.ret_percentage) || 0) - (Number(a.ret_percentage) || 0);
      return 0;
    });
  }, [funds, sortBy]);

  const isLoading = loadingOrders || loadingBse;

  if (isLoading) return <FundDashboardSkeleton />;

  return (
    <div className="p-4 min-h-screen bg-slate-50 dark:bg-[var(--app-bg)]">
      {!hasInvestments ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <img src={emptyDashboardImg} alt="" className="w-64 mb-6" />
          <h2 className="text-xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">No investments yet</h2>
          <p className="text-gray-500 mt-2 text-sm">Start investing to see your portfolio here.</p>
          <button
            onClick={() => navigate("/user/mutual_fund/explore")}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm"
          >
            Explore Funds
          </button>
        </div>
      ) : (
        <>
          {/* Kotak Neo ka portfolio header: chaar alag boxes nahi — ek card jisme
              current value sabse bari, uske saamne total P&L, aur neeche hairline
              ke paar Invested / Returns / XIRR ki ek qatar. Ek hi baseline par
              padhne se compare karna aasaan hota hai. */}
          <div className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200 dark:border-[var(--border-color)] p-5 mb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-[var(--text-secondary)]">
                  Current value
                </p>
                <p className="text-3xl font-semibold mt-1 text-slate-900 dark:text-[var(--text-primary)]">
                  {money(currentValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-[var(--text-secondary)]">
                  Total P&amp;L
                </p>
                <p className={`text-lg font-semibold mt-1 ${totalReturns >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totalReturns >= 0 ? "+" : "−"}{money(Math.abs(totalReturns))}
                </p>
                {totalInvested > 0 && (
                  <p className={`text-xs ${totalReturns >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {totalReturns >= 0 ? "+" : "−"}
                    {Math.abs((totalReturns / totalInvested) * 100).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-[var(--border-color)]">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">Invested</p>
                <p className="text-sm font-semibold mt-0.5">{money(totalInvested)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">Active SIPs</p>
                <p className="text-sm font-semibold mt-0.5">{activeSipCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">XIRR (est.)</p>
                <p className="text-sm font-semibold mt-0.5">{xirr}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] rounded-lg p-4 mb-5">
            <p className="text-sm font-semibold mb-2">Asset Allocation</p>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${money(value)}`}
                  >
                    {allocation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {allocation.map((item, i) => (
                <span key={item.name} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  {item.name}: {money(item.value)}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio-level actions. Count ab summary card me hai, yahan dohrana
              bekaar tha. */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => navigate("/mutual_fund/manage-sip")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium">Manage SIPs</button>
            <button onClick={() => navigate("/mutual_fund/redeem")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-xs font-medium">Redeem</button>
            <button onClick={() => navigate("/mutual_fund/switch")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-xs font-medium">Switch</button>
          </div>

          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Your Funds</p>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs border border-slate-200 dark:border-[var(--border-color)] rounded-md p-1">
              <option value="name">Sort by Name</option>
              <option value="amount">Sort by Invested</option>
              <option value="returns">Sort by Returns</option>
            </select>
          </div>

          {/* Neo ka holdings list: har holding ek card nahi, ek row. Value dayen
              taraf ek hi axis par, P&L uske neeche — poori list ek nazar me scan
              hoti hai. Invest more / Redeem row ke andar hi rehte hain. */}
          <div className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] divide-y divide-slate-200 dark:divide-[var(--border-color)] overflow-hidden">
            {sortedFunds.map((fund, idx) => {
              const pct = Number(fund.ret_percentage);
              const up = !Number.isNaN(pct) && pct >= 0;
              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenHolding(fund)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenHolding(fund)}
                  className="px-4 py-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--white-5)] transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm leading-snug line-clamp-2 text-slate-900 dark:text-[var(--text-primary)]">
                      {fund.scheme_name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
                      {fund.scheme_category || "—"}
                    </p>
                    {/* Mutual fund par sirf do actions hote hain — Invest more aur Redeem. */}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="text-[11px] px-3 py-1 rounded-md border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(fundBuyPath(fund.scheme_isin, fund.scheme_bse_code));
                        }}
                      >
                        Invest more
                      </button>
                      <button
                        type="button"
                        className="text-[11px] px-3 py-1 rounded-md border border-red-600 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/mutual_fund/redeem", {
                            state: { scheme_bse_code: fund.scheme_bse_code, code: fund.scheme_bse_code },
                          });
                        }}
                      >
                        Redeem
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-[var(--text-primary)]">
                      {money(fund.inv_amo)}
                    </p>
                    <p className={`text-xs mt-0.5 ${up ? "text-emerald-600" : "text-red-500"}`}>
                      {fund.ret_percentage != null && !Number.isNaN(pct)
                        ? `${up ? "+" : ""}${pct}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <HoldingSheet
            holding={openHolding}
            source="internal"
            onClose={() => setOpenHolding(null)}
          />
        </>
      )}
    </div>
  );
};

export default DashBoardMF;
