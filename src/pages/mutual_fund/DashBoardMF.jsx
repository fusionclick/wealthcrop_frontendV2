import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import emptyDashboardImg from "../../assets/mutualFund/emptyDashboard.svg";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";
import { useSelector } from "react-redux";
import { laravelUrl, nodeUrl, mergePortfolio, calcXirr } from "../../utils/nodeApi";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];

const DashBoardMF = () => {
  const [sortBy, setSortBy] = useState("name");
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
              <p className="text-[11px] text-slate-500">Current Value</p>
              <p className="text-lg font-semibold">₹{currentValue.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
              <p className="text-[11px] text-slate-500">Invested</p>
              <p className="text-lg font-semibold">₹{totalInvested.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
              <p className="text-[11px] text-slate-500">P&amp;L</p>
              <p className={`text-lg font-semibold ${totalReturns >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {totalReturns >= 0 ? "+" : ""}₹{totalReturns.toFixed(0)}
              </p>
            </div>
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
              <p className="text-[11px] text-slate-500">Returns (XIRR est.)</p>
              <p className="text-lg font-semibold">{xirr}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold mb-2">Asset Allocation</p>
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

          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold mb-2">Active SIPs: {activeSipCount}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/mutual_fund/manage-sip")} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs">Manage SIPs</button>
              <button onClick={() => navigate("/mutual_fund/redeem")} className="bg-red-600 text-white px-4 py-1.5 rounded-md text-xs">Redeem</button>
              <button onClick={() => navigate("/mutual_fund/switch")} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs">Switch</button>
            </div>
          </div>

          <div className="flex justify-between mb-2">
            <p className="text-sm font-semibold">Your Funds</p>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs border rounded-md p-1">
              <option value="name">Sort by Name</option>
              <option value="amount">Sort by Invested</option>
              <option value="returns">Sort by Returns</option>
            </select>
          </div>

          <div className="space-y-3">
            {sortedFunds.map((fund, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] flex justify-between">
                <div>
                  <p className="font-medium text-sm">{fund.scheme_name}</p>
                  <p className="text-xs text-gray-500">{fund.scheme_category || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{Number(fund.inv_amo || 0).toLocaleString()}</p>
                  <p className={`text-xs ${Number(fund.ret_percentage) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {fund.ret_percentage != null ? `${fund.ret_percentage}%` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashBoardMF;
