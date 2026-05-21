import React, { useState } from "react";
import empty from "../../assets/allorders.png";
import { NavLink } from "react-router-dom";

const Holdings = () => {
  // Dummy data
  const [stocks, setStocks] = useState([
    {
      id: 1,
      name: "Reliance Industries",
      symbol: "RELIANCE",
      qty: 10,
      avgPrice: 2485.5,
      ltp: 2502.3,
      orderDate: "2025-11-10",
    },
    {
      id: 2,
      name: "Tata Consultancy Services",
      symbol: "TCS",
      qty: 5,
      avgPrice: 3710.0,
      ltp: 3695.5,
      orderDate: "2025-11-11",
    },
    {
      id: 3,
      name: "HDFC Bank",
      symbol: "HDFCBANK",
      qty: 8,
      avgPrice: 1530.2,
      ltp: 1555.1,
      orderDate: "2025-11-12",
    },
  ]);

  // Uncomment for empty state
  // const [stocks, setStocks] = useState([]);

  // -------------------------
  // 📌 Portfolio Calculations
  // -------------------------

  const totalInvested = stocks.reduce(
    (acc, s) => acc + s.avgPrice * s.qty,
    0
  );

  const currentValue = stocks.reduce(
    (acc, s) => acc + s.ltp * s.qty,
    0
  );

  const profitLoss = currentValue - totalInvested;

  const profitLossPercent =
    totalInvested === 0
      ? 0
      : (profitLoss / totalInvested) * 100;

  return (
   <div
  className="
    bg-white min-h-[400px] px-14 py-6

    dark:bg-[var(--app-bg)]
  "
>
  {stocks.length === 0 ? (
    // ---------------------- EMPTY STATE ----------------------
    <div
      className="
        flex items-center justify-center min-h-[350px] bg-white

        dark:bg-[var(--app-bg)]
      "
    >
      <div className="flex flex-col md:flex-row items-center gap-14 px-6 py-10">
        <img
          src={empty}
          alt="Empty state"
          className="w-48 md:w-56 lg:w-80 object-contain"
        />

        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
          <div>
            <p
              className="
                text-gray-600 text-sm font-medium

                dark:text-[var(--text-secondary)]
              "
            >
              Introducing
            </p>

            <h2
              className="
                text-2xl md:text-3xl font-semibold leading-snug
                text-blue-950

                dark:text-[var(--text-primary)]
              "
            >
              Stocks
            </h2>
          </div>

          <p
            className="
              text-gray-600 text-sm md:text-base

              dark:text-[var(--text-secondary)]
            "
          >
            Investing in stocks is now easier than ever.
            <br /> Start exploring and discover new opportunities.
          </p>

          <NavLink
            to="/"
            className="
              mt-4 px-5 py-2 rounded-lg text-sm font-medium transition
              bg-emerald-600 hover:bg-emerald-700 text-white
            "
          >
            Try it out
          </NavLink>
        </div>
      </div>
    </div>
  ) : (
    // ---------------------- HOLDINGS LIST ----------------------
    <div>
      {/* ********** SUMMARY CARD ********** */}
      <div
        className="
          mb-6 p-4 rounded-xl
          bg-gray-50 border border-gray-200

          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        <h2
          className="
            text-lg font-semibold mb-3
            text-blue-950

            dark:text-[var(--text-primary)]
          "
        >
          Portfolio Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Invested */}
          <div
            className="
              p-3 rounded-lg bg-white border border-gray-200

              dark:bg-[var(--card-bg)]
              dark:border-[var(--border-color)]
            "
          >
            <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
              Total Invested
            </p>
            <p className="text-blue-950 text-lg font-semibold mt-1 dark:text-[var(--text-primary)]">
              ₹{totalInvested.toFixed(2)}
            </p>
          </div>

          {/* Current Value */}
          <div
            className="
              p-3 rounded-lg bg-white border border-gray-200

              dark:bg-[var(--card-bg)]
              dark:border-[var(--border-color)]
            "
          >
            <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
              Current Value
            </p>
            <p className="text-blue-950 text-lg font-semibold mt-1 dark:text-[var(--text-primary)]">
              ₹{currentValue.toFixed(2)}
            </p>
          </div>

          {/* Profit/Loss */}
          <div
            className="
              p-3 rounded-lg bg-white border border-gray-200

              dark:bg-[var(--card-bg)]
              dark:border-[var(--border-color)]
            "
          >
            <p className="text-gray-600 text-xs font-medium dark:text-[var(--text-secondary)]">
              P/L (Absolute + %)
            </p>

            <p
              className={`text-lg font-semibold mt-1 ${
                profitLoss >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {profitLoss >= 0 ? "+" : ""}
              ₹{profitLoss.toFixed(2)}{" "}
              <span className="text-sm">
                ({profitLossPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ********** STOCK TABLE ********** */}
      <div className="overflow-x-auto">
        <h2
          className="
            text-xl font-semibold mb-4
            text-blue-950

            dark:text-[var(--text-primary)]
          "
        >
          Your Stock Portfolio
        </h2>

        <table
          className="
            min-w-full text-sm rounded-lg overflow-hidden
            border border-gray-200

            dark:border-[var(--border-color)]
          "
        >
          <thead
            className="
              bg-gray-100

              dark:bg-[var(--gray-800)]
            "
          >
            <tr>
              {[
                "Name",
                "Symbol",
                "Qty",
                "Avg Price",
                "LTP",
                "Change",
                "Order Date",
              ].map((h) => (
                <th
                  key={h}
                  className="
                    px-4 py-2 text-left font-medium
                    text-gray-700

                    dark:text-[var(--text-secondary)]
                  "
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.id}
                className="
                  border-t transition hover:bg-gray-50

                  dark:border-[var(--border-color)]
                  dark:hover:bg-[var(--white-5)]
                "
              >
                <td className="px-4 py-2 font-medium text-blue-950 dark:text-[var(--text-primary)]">
                  <NavLink to="/">{stock.name}</NavLink>
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
                    stock.ltp - stock.avgPrice >= 0
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {(
                    ((stock.ltp - stock.avgPrice) / stock.avgPrice) *
                    100
                  ).toFixed(2)}
                  %
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
