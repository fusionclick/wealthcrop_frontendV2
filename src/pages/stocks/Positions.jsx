import React from "react";
import emptyDashboardImg from "../../assets/stocks/stockEmptyDashboard.svg";

const Positions = () => {
  //  Replace with API data later
  const hasStocks = true;

  const stocks = [
    {
      name: "Tata Motors",
      qty: 10,
      avgBuy: 600,
      current: 720,
    },
    {
      name: "HDFC Bank",
      qty: 5,
      avgBuy: 1520,
      current: 1480,
    },
    {
      name: "Infosys",
      qty: 8,
      avgBuy: 1320,
      current: 1410,
    },
  ];

  // 👉 Calculate totals
  const totalInvested = stocks.reduce(
    (sum, s) => sum + s.avgBuy * s.qty,
    0
  );

  const totalCurrent = stocks.reduce(
    (sum, s) => sum + s.current * s.qty,
    0
  );

  const totalPnL = totalCurrent - totalInvested;

  const totalPnLPercent =
    ((totalPnL / totalInvested) * 100).toFixed(2);

  return (
 <div
  className="
    min-h-screen
    bg-slate-100
    dark:bg-[var(--app-bg)]
    px-3 py-4
    lg:px-14 lg:py-5
  "
>
  {/* ❌ EMPTY STATE */}
  {!hasStocks ? (
    <div className="flex flex-col items-center text-center mt-12 lg:mt-16">
      <img
        src={emptyDashboardImg}
        alt="Empty Portfolio"
        className="w-48 h-48 lg:w-64 lg:h-64 mb-6"
      />

      <h2
        className="
          font-semibold text-lg lg:text-xl mb-2
          text-blue-900
          dark:text-[var(--text-primary)]
        "
      >
        No Stocks Added Yet
      </h2>

      <p
        className="
          text-sm max-w-xs mb-4
          text-gray-500
          dark:text-[var(--text-secondary)]
        "
      >
        Track all your stock positions here once you start investing.
      </p>

      <button className="bg-teal-600 text-white px-5 py-2 rounded-md text-sm">
        Import Positions
      </button>
    </div>
  ) : (
    /* 📌 STOCK POSITIONS SECTION */
    <div className="space-y-4 lg:space-y-5">
      {/* HEADER SUMMARY */}
      <div
        className="
          p-4 rounded-xl
          bg-teal-50 border border-teal-100
          dark:bg-[var(--white-5)]
          dark:border-[var(--border-color)]
        "
      >
        <h2
          className="
            text-lg lg:text-xl font-semibold mb-3
            text-blue-900
            dark:text-[var(--text-primary)]
          "
        >
          Your Stock Positions
        </h2>

        {/* SUMMARY GRID */}
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
              {totalPnL >= 0 ? "+" : ""}
              ₹ {totalPnL.toLocaleString()} ({totalPnLPercent}%)
            </p>
          </div>
        </div>
      </div>

      {/* STOCK LIST */}
      <div className="space-y-3">
        {stocks.map((s, i) => {
          const stockInvested = s.avgBuy * s.qty;
          const stockCurrent = s.current * s.qty;
          const pnl = stockCurrent - stockInvested;
          const pnlPercent = ((pnl / stockInvested) * 100).toFixed(2);

          return (
            <div
              key={i}
              className="
                rounded-xl p-4
                bg-white border border-gray-200
                dark:bg-[var(--card-bg)]
                dark:border-[var(--border-color)]
              "
            >
              {/* TOP ROW */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-900 dark:text-[var(--text-primary)]">
                    {s.name}
                  </p>
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

              {/* PRICE INFO */}
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
