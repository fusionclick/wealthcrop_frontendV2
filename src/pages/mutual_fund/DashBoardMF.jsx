import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import emptyDashboardImg from "../../assets/mutualFund/emptyDashboard.svg";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";
import { useSelector } from "react-redux";
import { laravelUrl, nodeUrl, mergePortfolio, fundBuyPath } from "../../utils/nodeApi";
import { portfolioXirr } from "../../utils/xirr";
import HoldingSheet from "../../components/mutual_fund/HoldingSheet";
import PortfolioBar from "../../components/mutual_fund/PortfolioBar";
import usePortfolios, { holdingKey } from "../../hooks/usePortfolios";
import { History, Split } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const DashBoardMF = () => {
  const [sortBy, setSortBy] = useState("name");
  // FR 4.1 — which portfolio the list is filtered to. "all" is every holding.
  const [portfolioFilter, setPortfolioFilter] = useState("all");
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

  // XIRR needs the dates money moved on, and the holdings list does not carry them — only
  // the order history does. It is the same call the Orders page makes, so react-query
  // serves it from cache when the investor has already been there.
  const { data: orders } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc,
  });

  const hasInvestments = funds.length > 0;
  const totalInvested = funds.reduce((acc, f) => acc + (Number(f.inv_amo) || 0), 0);

  // Prefer what the units are actually worth. getClientPortfolio now prices each folio off
  // the AMFI NAV store and sends `current_value`; a scheme it could not price sends null,
  // and that row falls back to its cost so it neither invents a gain nor disappears from
  // the total. Deriving everything from `ret_percentage` alone is what made the Returns
  // tile read a flat ₹0 and handed XIRR a "today's value" identical to the money paid in —
  // a confident 0% p.a. on every account.
  const currentValue = funds.reduce(
    (acc, f) => acc + (Number(f.current_value) || Number(f.inv_amo) || 0),
    0
  );
  const totalReturns = currentValue - totalInvested;
  // Every settled purchase and redemption on their real dates, capped by what the units are
  // worth today. null when the orders cannot produce a rate — a brand new account, or one
  // whose history BSE did not return — and the tile says so rather than printing a 0.
  const xirr = useMemo(() => portfolioXirr(orders || [], currentValue), [orders, currentValue]);
  const activeSipCount = funds.filter((f) => f.sip_status === "ACTIVE").length;

  const allocation = useMemo(() => {
    const map = {};
    funds.forEach((f) => {
      const cat = f.scheme_category || f.category || "Other";
      map[cat] = (map[cat] || 0) + (Number(f.inv_amo) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [funds]);

  // FR 4.1 — the investor's own groupings over the holdings already loaded above.
  const { portfolios, byHolding, create, remove, assign } = usePortfolios(Boolean(ucc));

  // Counts are over ALL funds, never the filtered list: a pill that only counted what is
  // currently on screen would read 0 for every portfolio except the one selected.
  const portfolioCounts = useMemo(() => {
    const counts = { all: funds.length, unassigned: 0 };
    for (const p of portfolios) counts[p.id] = 0;
    for (const f of funds) {
      const owner = byHolding.get(holdingKey(f));
      if (owner) counts[owner.id] = (counts[owner.id] || 0) + 1;
      else counts.unassigned += 1;
    }
    return counts;
  }, [funds, portfolios, byHolding]);

  const visibleFunds = useMemo(() => {
    if (portfolioFilter === "all") return funds;
    return funds.filter((f) => {
      const owner = byHolding.get(holdingKey(f));
      return portfolioFilter === "unassigned" ? !owner : owner?.id === portfolioFilter;
    });
  }, [funds, portfolioFilter, byHolding]);

  const sortedFunds = useMemo(() => {
    return [...visibleFunds].sort((a, b) => {
      if (sortBy === "name") return (a.scheme_name || "").localeCompare(b.scheme_name || "");
      if (sortBy === "amount") return (Number(b.inv_amo) || 0) - (Number(a.inv_amo) || 0);
      if (sortBy === "returns") return (Number(b.ret_percentage) || 0) - (Number(a.ret_percentage) || 0);
      return 0;
    });
  }, [visibleFunds, sortBy]);

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
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">XIRR</p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    xirr == null ? "" : xirr >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                  title={xirr == null ? "Not enough settled orders yet to work out a rate" : "Money-weighted return p.a., from your order dates"}
                >
                  {xirr == null ? "—" : `${xirr >= 0 ? "+" : "−"}${Math.abs(xirr).toFixed(2)}% p.a.`}
                </p>
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
              bekaar tha.

              Manage SIPs / Redeem / Switch all lived here and none of them belonged:
              Manage SIPs repeats the SIPs tab in the nav above, and Redeem and Switch act
              on ONE fund, so sending the investor to a blank picker when they are already
              looking at the list is a step backwards — both now sit on the fund's own row
              and in its detail sheet. The one thing this page had no route to at all was
              the order history, so that is what the button is. */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => navigate("/user/mutual_fund/orders")}
              className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-4 py-1.5 rounded-md text-xs font-medium"
            >
              <History size={14} /> Order history
            </button>
            {/* SRS §4 — Spread acts on a lump sum across the whole portfolio, not on one
                fund, so unlike Redeem and Switch it does belong at this level. */}
            <button
              onClick={() => navigate("/mutual_fund/spread")}
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-[var(--text-primary)] px-4 py-1.5 rounded-md text-xs font-medium"
            >
              <Split size={14} /> Spread a lump sum
            </button>
          </div>

          {/* FR 4.1 — filter the list to one portfolio. Holdings are filed from a
              fund's own detail sheet, which is where the folio is already in hand. */}
          <PortfolioBar
            portfolios={portfolios}
            counts={portfolioCounts}
            selected={portfolioFilter}
            onSelect={setPortfolioFilter}
            onCreate={create}
            onDelete={async (id) => {
              if (await remove(id)) setPortfolioFilter("all");
            }}
          />

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
                    {/* Invest more, Redeem and Switch — all three act on THIS fund, which
                        is why the portfolio-level Redeem/Switch buttons above were dropped:
                        they opened an empty picker for a fund the investor had already
                        chosen. Each carries the scheme and folio, so the target page opens
                        filled in. */}
                    <div className="mt-2 flex flex-wrap gap-2">
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
                      <button
                        type="button"
                        className="text-[11px] px-3 py-1 rounded-md border border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/mutual_fund/switch", {
                            state: {
                              scheme_bse_code: fund.scheme_bse_code,
                              // A second way to find the same fund. A row merged in from
                              // Laravel can spell its scheme code differently to BSE's
                              // holdings, and then the code alone matches nothing there.
                              isin: fund.scheme_isin || fund.isin || "",
                              scheme_name: fund.scheme_name,
                              folio: fund.folio,
                            },
                          });
                        }}
                      >
                        Switch
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
            portfolios={portfolios}
            currentPortfolioId={openHolding ? byHolding.get(holdingKey(openHolding))?.id ?? null : null}
            onAssignPortfolio={(id) => assign(id, holdingKey(openHolding))}
          />
        </>
      )}
    </div>
  );
};

export default DashBoardMF;
