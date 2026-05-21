import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import emptyDashboardImg from "../../assets/mutualFund/emptyDashboard.svg";
import { useNavigate } from "react-router-dom";

// --------------------------------------
//  DUMMY USER PORTFOLIO DATA (Replace later)
// --------------------------------------
const FUNDS = [
  {
    name: "Axis Bluechip Fund",
    amount: 15000,
    returns: 12.4,
    category: "Large Cap",
    sip: true,
  },
  {
    name: "ICICI Value Discovery Fund",
    amount: 9200,
    returns: 8.1,
    category: "Value",
    sip: false,
  },
  {
    name: "HDFC Midcap Opportunities",
    amount: 6100,
    returns: -2.4,
    category: "Mid Cap",
    sip: true,
  },
];


const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];

const DashBoardMF = () => {
  const hasInvestments = FUNDS.length > 0;
  const [sortBy, setSortBy] = useState("name");

  const navigate = useNavigate()

  // -----------------------------
  // Portfolio Calculations
  // -----------------------------
  const totalInvested = FUNDS.reduce((acc, f) => acc + f.amount, 0);
  const totalReturns = FUNDS.reduce(
    (acc, f) => acc + (f.amount * f.returns) / 100,
    0
  );
  const currentValue = totalInvested + totalReturns;
  const xirr = ((totalReturns / totalInvested) * 100).toFixed(2);
  const activeSipCount = FUNDS.filter((f) => f.sip).length;

  // -----------------------------
  // Asset Allocation (Pie Chart)
  // -----------------------------
  const allocation = useMemo(() => {
    const map = {};
    FUNDS.forEach((f) => {
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return Object.entries(map).map(([category, value]) => ({
      name: category,
      value,
    }));
  }, []);

  // -----------------------------
  // Sorting
  // -----------------------------
  const sortedFunds = useMemo(() => {
    return [...FUNDS].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "returns") return b.returns - a.returns;
      return 0;
    });
  }, [sortBy]);

  const handleExternal = () => alert("External Funds Imported!");

  // =====================================================================
  // UI START
  // =====================================================================
  return (
    <div className="p-4 min-h-screen bg-slate-50 dark:bg-[var(--app-bg)]">

      {/* ------------------------------------------------------ */}
      {/*  EMPTY DASHBOARD */}
      {/* ------------------------------------------------------ */}
      {!hasInvestments ? (
        <div className="flex flex-col items-center justify-center text-center mt-12">
          <img src={emptyDashboardImg} alt="Empty" className="w-64 h-64 mb-6" />

          <h2 className="text-blue-900 dark:text-[var(--text-primary)] font-semibold text-xl mb-2">
            Already invested somewhere?
          </h2>
          <p className="text-gray-500 text-[var(--text-secondary)] text-sm mb-6 max-w-xs">
            Manage & analyse all your Mutual Fund holdings on one dashboard
          </p>

          <button
            onClick={handleExternal}
            className="bg-teal-600 text-white text-[var(--text-primary)] font-medium py-2 px-5 rounded-md"
          >
            Import External Funds
          </button>
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------ */}
          {/* Portfolio Summary Cards */}
          {/* ------------------------------------------------------ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {/* Current Value */}
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">Current Value</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-[var(--text-prmary)]">
                ₹{currentValue.toLocaleString()}
              </p>
            </div>

            {/* Total Invested */}
            <div className="bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] p-4 rounded-xl border shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] ">Invested</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-[var(--text-prmary)]">
                ₹{totalInvested.toLocaleString()}
              </p>
            </div>

            {/* Profit/Loss */}
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border dark:border-[var(--border-color)] shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">Profit / Loss</p>
              <p
                className={`text-lg font-semibold ${
                  totalReturns >= 0 ? "text-emerald-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                }`}
              >
                {totalReturns >= 0 ? "+" : ""}
                ₹{totalReturns.toFixed(0)}
              </p>
            </div>

            {/* XIRR */}
            <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border dark:border-[var(--border-color)] shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">XIRR</p>
              <p
                className={`text-lg font-semibold ${
                  xirr >= 0 ? "text-emerald-600 dark:text-green-400" : "text-red-500"
                }`}
              >
                {xirr}%
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* Asset Allocation Pie Chart */}
          {/* ------------------------------------------------------ */}
          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] shadow-sm rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-[var(--text-prmary)]">
                Asset Allocation
              </p>
            </div>

            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {allocation.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* SIP Summary */}
          {/* ------------------------------------------------------ */}
          <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] shadow-sm rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-blue-900 dark:text-[var(--text-prmary)] mb-1">Active SIPs</p>
            <p className="text-gray-600 dark:text-[var(--text-secondary)] text-sm mb-2">
              You have{" "}
              <span className="font-bold text-teal-600 dark:text-teal-400">{activeSipCount}</span>{" "}
              active SIPs.
            </p>

            <button
              className="bg-blue-600 dark:bg-blue-400 text-white px-4 py-1.5 rounded-md text-xs"
              onClick={() => navigate("/mutual_fund/manage-sip")}
            >
              Manage SIPs
            </button>
          </div>

          {/* ------------------------------------------------------ */}
          {/* Fund List + Sorting */}
          {/* ------------------------------------------------------ */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-900 dark:text-[var(--text-prmary)]">Your Funds</p>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border bg-white dark:bg-blue-400 dark:border dark:border-[var(--border-color)] rounded-md p-1"
            >
              <option value="name">Sort by Name</option>
              <option value="amount">Sort by Invested</option>
              <option value="returns">Sort by Returns</option>
            </select>
          </div>

          <div className="space-y-3">
            {sortedFunds.map((fund, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg shadow-sm border border-gray-200 bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-blue-900 dark:text-[var(--text-prmary)]">{fund.name}</p>
                  <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
                    Invested: ₹{fund.amount.toLocaleString()}
                  </p>
                </div>

                <p
                  className={`font-semibold ${
                    fund.returns >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-rose -500"
                  }`}
                >
                  {fund.returns >= 0 ? "+" : ""}
                  {fund.returns}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashBoardMF;
