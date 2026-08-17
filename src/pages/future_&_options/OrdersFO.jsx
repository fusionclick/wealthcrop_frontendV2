import React, { useCallback, useEffect, useState } from "react";
import { fetchFnoOrders } from "../../api/portfolioApi";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Executed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

const typeStyles = {
  BUY: "text-green-600 dark:text-green-400",
  SELL: "text-red-600 dark:text-red-400",
};

const OrdersFO = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchFnoOrders()
      .then((res) => setOrders(res?.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          F&O Orders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track all your Futures & Options orders
        </p>
      </div>

      {loading && orders.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Loading Kotak F&amp;O orders…</p>
      )}
      {!loading && orders.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No Kotak F&amp;O orders found.</p>
      )}

      {/* DESKTOP TABLE */}
      {orders.length > 0 && <div className="hidden md:block">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-white/5">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-slate-200 dark:border-white/10
                             hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {order.symbol}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${typeStyles[order.side]}`}>
                    {order.side}
                  </td>
                  <td className="px-4 py-3">{order.qty}</td>
                  <td className="px-4 py-3">₹{order.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {order.placedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* MOBILE VIEW */}
      {orders.length > 0 && <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-slate-200 dark:border-white/10
                       bg-white dark:bg-[#020617] p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {order.symbol}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold
                ${statusStyles[order.status]}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${typeStyles[order.side]}`}>
                {order.side}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {order.placedAt}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-slate-700 dark:text-slate-300">
              <div>
                Qty: <span className="font-medium">{order.qty}</span>
              </div>
              <div>
                Price: <span className="font-medium">₹{order.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
};

export default OrdersFO;
