import React, { useCallback, useEffect, useState } from "react";
import emptyDashboardImg from "../../assets/stocks/stockEmptyDashboard.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { fetchKotakStatus, fetchPositions, syncStockPortfolio } from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import KotakLinkForm from "../../components/stocks/KotakLinkForm";

const Positions = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showKotakForm, setShowKotakForm] = useState(false);
  const navigate = useNavigate();

  const load = useCallback((sync = false) => {
    setLoading(true);
    fetchPositions(sync)
      .then((res) => setStocks(res?.data?.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => load(Boolean(res?.data?.trading_auth)))
      .catch(() => load());
  }, [load]);

  const handleImport = async () => {
    setSyncing(true);
    const res = await syncStockPortfolio();
    setSyncing(false);

    if (res?.status) {
      toastSuccess(res.message || "Positions imported");
      load(true);
      return;
    }

    if (res?.token_ok && !res?.trading_auth) {
      setShowKotakForm(true);
      return;
    }

    toastError(res?.message || "Import unavailable");
  };

  const hasStocks = stocks.length > 0;
  const totalInvested = stocks.reduce((sum, s) => sum + s.avgBuy * s.qty, 0);
  const totalCurrent = stocks.reduce((sum, s) => sum + s.current * s.qty, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPercent =
    totalInvested === 0 ? "0.00" : ((totalPnL / totalInvested) * 100).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[var(--app-bg)] px-3 py-4 lg:px-14 lg:py-5 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
          Loading positions…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[var(--app-bg)] px-3 py-4 lg:px-14 lg:py-5">
      {!hasStocks ? (
        <div className="flex flex-col items-center text-center mt-12 lg:mt-16">
          <img
            src={emptyDashboardImg}
            alt="Empty Portfolio"
            className="w-48 h-48 lg:w-64 lg:h-64 mb-6"
          />

          <h2 className="font-semibold text-lg lg:text-xl mb-2 text-blue-900 dark:text-[var(--text-primary)]">
            No Stocks Added Yet
          </h2>

          <p className="text-sm max-w-xs mb-4 text-gray-500 dark:text-[var(--text-secondary)]">
            Track all your stock positions here once you start investing.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={handleImport}
              disabled={syncing}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-5 py-2 rounded-md text-sm"
            >
              {syncing ? "Importing…" : "Import Positions"}
            </button>
              <NavLink
                to="/stockList/all-nse-stocks"
                className="border border-gray-300 text-gray-700 dark:text-[var(--text-secondary)] px-5 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Browse NSE stocks
              </NavLink>
          </div>
          <KotakLinkForm forceOpen={showKotakForm} onLinked={() => load(true)} />
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-5">
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 dark:bg-[var(--white-5)] dark:border-[var(--border-color)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-lg lg:text-xl font-semibold text-blue-900 dark:text-[var(--text-primary)]">
                Your Stock Positions ({stocks.length})
              </h2>
              <button
                type="button"
                onClick={handleImport}
                disabled={syncing}
                className="text-sm text-teal-700 hover:underline dark:text-teal-400 disabled:opacity-60"
              >
                {syncing ? "Refreshing…" : "Refresh positions"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  Total Invested
                </p>
                <p className="font-semibold text-teal-700">
                  ₹ {totalInvested.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  Current Value
                </p>
                <p className="font-semibold text-blue-900 dark:text-[var(--text-primary)]">
                  ₹ {totalCurrent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  Overall P&amp;L
                </p>
                <p
                  className={`font-semibold ${
                    totalPnL >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}₹ {totalPnL.toLocaleString()} (
                  {totalPnLPercent}%)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {stocks.map((s) => {
              const stockInvested = s.avgBuy * s.qty;
              const stockCurrent = s.current * s.qty;
              const pnl = stockCurrent - stockInvested;
              const pnlPercent =
                stockInvested === 0 ? "0.00" : ((pnl / stockInvested) * 100).toFixed(2);
              const sym = s.symbol || s.name;

              return (
                <div
                  key={sym}
                  role="button"
                  tabIndex={0}
                  onClick={() => sym && navigate(`/stocks/${sym}`)}
                  onKeyDown={(e) => e.key === "Enter" && sym && navigate(`/stocks/${sym}`)}
                  className="rounded-xl p-4 bg-white border border-gray-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)] cursor-pointer hover:border-teal-400 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <NavLink
                        to={`/stocks/${sym}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-blue-900 dark:text-[var(--text-primary)] hover:underline"
                      >
                        {s.name}
                      </NavLink>
                      {s.symbol && (
                        <p className="text-xs text-gray-400 dark:text-[var(--text-secondary)]">
                          {s.symbol}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                        Qty: {s.qty}
                      </p>
                    </div>

                    <div
                      className={`text-right font-semibold ${
                        pnl >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      <p>
                        {pnl >= 0 ? "+" : ""}₹ {pnl.toLocaleString()}
                      </p>
                      <p className="text-xs">
                        ({pnl >= 0 ? "+" : ""}
                        {pnlPercent}%)
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 dark:text-[var(--text-secondary)] flex justify-between">
                    <span>Buy @ ₹{s.avgBuy}</span>
                    <span>Current ₹{s.current}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
