import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import empty from "../../../assets/allorders.png";
import { fetchFnoOrders } from "../../../api/portfolioApi";

// ponytail: dummy contracts hata diye — same Kotak F&O order book as OrdersFO
const FutureandOptions = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchFnoOrders()
      .then((res) => setOrders(res?.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bg-white min-h-[400px] rounded-xl shadow-sm p-6 dark:bg-[var(--card-bg)]">
      {loading && orders.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">Loading F&amp;O orders…</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="flex flex-col md:flex-row items-center gap-14 px-6 py-10">
            <img src={empty} alt="" className="w-48 md:w-56 lg:w-80 object-contain" />
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">
                Futures &amp; Options
              </h2>
              <p className="text-gray-600 text-sm md:text-base dark:text-[var(--text-secondary)]">
                F&amp;O trading activated. Explore pe contract choose karke order lagao.
              </p>
              <Link
                to="/user/future_and_options/explore"
                className="mt-4 px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Trade F&amp;O
              </Link>
            </div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-blue-950 dark:text-[var(--text-primary)]">
            Your Futures &amp; Options Orders
          </h2>
          <table className="min-w-full text-sm rounded-lg overflow-hidden border border-gray-200 dark:border-[var(--border-color)]">
            <thead className="bg-gray-100 dark:bg-[var(--white-5)]">
              <tr>
                {["Symbol", "Side", "Qty", "Price", "Status", "Time"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 font-medium text-gray-700 dark:text-[var(--text-secondary)] text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-gray-50 dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]"
                >
                  <td className="px-4 py-2 font-medium text-blue-950 dark:text-[var(--text-primary)]">
                    {order.symbol}
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      order.side === "BUY" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {order.side}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                    {order.qty}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                    ₹{order.price}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                    {order.status}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
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

export default FutureandOptions;
