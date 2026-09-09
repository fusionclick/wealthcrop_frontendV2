import React, { useCallback, useEffect, useState } from "react";
import empty from "../../../assets/allorders.png";
import { NavLink } from "react-router-dom";
import { fetchStockOrders } from "../../../api/portfolioApi";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchStockOrders()
      .then((res) => setStocks(res?.data?.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
   <div
  className="
    bg-white min-h-[400px] p-6

    dark:bg-[var(--card-bg)]
  "
>
  {loading && stocks.length === 0 ? (
    <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] py-8 text-center">
      Loading orders…
    </p>
  ) : stocks.length === 0 ? (
    // 🔹 Empty State
    <div
      className="
        flex items-center justify-center min-h-[350px]
        bg-white

        dark:bg-[var(--card-bg)]
      "
    >
      <div className="flex flex-col md:flex-row items-center gap-14 px-6 py-10">
        <div>
          <img
            src={empty}
            alt="Empty state"
            className="w-48 md:w-56 lg:w-80 object-contain"
          />
        </div>

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
    // 🔹 Order List
    <div className="overflow-x-auto">
      <h2
        className="
          text-xl font-semibold mb-4
          text-blue-950
          dark:text-[var(--text-primary)]
        "
      >
        Your Stock Orders
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

            dark:bg-[var(--white-5)]
          "
        >
          <tr>
            {[
              "Symbol",
              "Side",
              "Qty",
              "Price",
              "Type",
              "Status",
              "Placed At",
            ].map((h) => (
              <th
                key={h}
                className="
                  px-4 py-2 font-medium
                  text-gray-700
                  dark:text-[var(--text-secondary)]
                  text-left
                "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {stocks.map((order) => (
            <tr
              key={order.id}
              className="
                border-t transition
                hover:bg-gray-50

                dark:border-[var(--border-color)]
                dark:hover:bg-[var(--white-5)]
              "
            >
              <td
                className="
                  px-4 py-2 font-medium whitespace-nowrap
                  text-blue-950
                  dark:text-[var(--text-primary)]
                "
              >
                {order.symbol}
              </td>

              <td
                className={`px-4 py-2 font-medium ${
                  order.side === "BUY"
                    ? "text-green-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-rose-400"
                }`}
              >
                {order.side}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {order.qty}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                ₹{Number(order.price || 0).toFixed(2)}
              </td>

              <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                {order.orderType}
              </td>

              <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                {order.status}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {order.placedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

  );
};

export default Stocks;
