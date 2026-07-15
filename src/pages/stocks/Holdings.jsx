import React, { useCallback, useEffect, useState } from "react";
import empty from "../../assets/allorders.png";
import { NavLink, useNavigate } from "react-router-dom";
import { fetchHoldings, fetchKotakStatus, syncStockPortfolio } from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import KotakLinkForm from "../../components/stocks/KotakLinkForm";

const Holdings = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showKotakForm, setShowKotakForm] = useState(false);

  const load = useCallback((sync = false) => {
    setLoading(true);
    fetchHoldings(sync)
      .then((res) => setStocks(res?.data?.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => load(Boolean(res?.data?.trading_auth)))
      .catch(() => load());
  }, [load]);

  const handleSync = async () => {
    const res = await syncStockPortfolio();
    if (res?.status) {
      toastSuccess(res.message || "Portfolio synced");
      load(true);
      return;
    }
    if (res?.token_ok && !res?.trading_auth) {
      setShowKotakForm(true);
      return;
    }
    toastError(res?.message || "Sync failed");
  };

  const totalInvested = stocks.reduce((acc, s) => acc + s.avgPrice * s.qty, 0);
  const currentValue = stocks.reduce((acc, s) => acc + s.ltp * s.qty, 0);
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent =
    totalInvested === 0 ? 0 : (profitLoss / totalInvested) * 100;

  if (loading) {
    return (
      <div className="bg-white min-h-[400px] px-14 py-6 dark:bg-[var(--app-bg)] flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
          Loading holdings…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[400px] px-14 py-6 dark:bg-[var(--app-bg)]">
      {stocks.length === 0 ? (
        <div className="flex items-center justify-center min-h-[350px] bg-white dark:bg-[var(--app-bg)]">
          <div className="flex flex-col md:flex-row items-center gap-14 px-6 py-10">
            <img
              src={empty}
              alt="Empty state"
              className="w-48 md:w-56 lg:w-80 object-contain"
            />

            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <div>
                <p className="text-gray-600 text-sm font-medium dark:text-[var(--text-secondary)]">
                  Introducing
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold leading-snug text-blue-950 dark:text-[var(--text-primary)]">
                  Stocks
                </h2>
              </div>

              <p className="text-gray-600 text-sm md:text-base dark:text-[var(--text-secondary)]">
                Investing in stocks is now easier than ever.
                <br /> Start exploring and discover new opportunities.
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <NavLink
                  to="/user/stocks/explore"
                  className="px-5 py-2 rounded-lg text-sm font-medium transition bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Explore stocks
                </NavLink>
                <NavLink
                  to="/stockList/all-nse-stocks"
                  className="px-5 py-2 rounded-lg text-sm font-medium transition border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
                >
                  Browse all NSE stocks
                </NavLink>
                <button
                  type="button"
                  onClick={handleSync}
                  className="px-5 py-2 rounded-lg text-sm font-medium transition border border-teal-600 text-teal-700 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400"
                >
                  Import from Kotak
                </button>
              </div>
              <KotakLinkForm forceOpen={showKotakForm} onLinked={() => load(true)} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">
                Portfolio Summary
              </h2>
              <button
                type="button"
                onClick={handleSync}
                className="text-sm text-teal-700 hover:underline dark:text-teal-400"
              >
                Refresh from Kotak
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white border border-gray-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
                <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
                  Total Invested
                </p>
                <p className="text-blue-950 text-lg font-semibold mt-1 dark:text-[var(--text-primary)]">
                  ₹{totalInvested.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
                <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
                  Current Value
                </p>
                <p className="text-blue-950 text-lg font-semibold mt-1 dark:text-[var(--text-primary)]">
                  ₹{currentValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
                <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
                  P/L (Absolute + %)
                </p>
                <p
                  className={`text-lg font-semibold mt-1 ${
                    profitLoss >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {profitLoss >= 0 ? "+" : ""}₹{profitLoss.toFixed(2)}{" "}
                  <span className="text-sm">({profitLossPercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-950 dark:text-[var(--text-primary)]">
              Your Stock Portfolio ({stocks.length} holdings)
            </h2>

            <table className="min-w-full text-sm rounded-lg overflow-hidden border border-gray-200 dark:border-[var(--border-color)]">
              <thead className="bg-gray-100 dark:bg-[var(--gray-800)]">
                <tr>
                  {["Name", "Symbol", "Qty", "Avg Price", "LTP", "Change", "Order Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left font-medium text-gray-700 dark:text-[var(--text-secondary)]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.id ?? stock.symbol}
                    onClick={() => navigate(`/stocks/${stock.symbol}`)}
                    className="border-t transition hover:bg-gray-50 cursor-pointer dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]"
                  >
                    <td className="px-4 py-2 font-medium text-blue-950 dark:text-[var(--text-primary)]">
                      <NavLink
                        to={`/stocks/${stock.symbol}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {stock.name}
                      </NavLink>
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                      {stock.symbol}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                      {stock.qty}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                      ₹{stock.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                      ₹{stock.ltp.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        stock.ltp - stock.avgPrice >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {(((stock.ltp - stock.avgPrice) / stock.avgPrice) * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                      {stock.orderDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holdings;
