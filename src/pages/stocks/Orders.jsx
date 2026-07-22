import React, { useCallback, useEffect, useMemo, useState } from "react";
import { cancelStockOrder, fetchStockOrders } from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

const StatusIcon = ({ status }) => {
  if (status === "Executed") return <span className="text-emerald-600 text-lg font-bold">✓</span>;
  if (status === "Pending") return <span className="text-blue-600 text-lg font-bold">⏳</span>;
  if (status === "Rejected") return <span className="text-rose-600 text-lg font-bold">✖</span>;
  if (status === "Cancelled") return <span className="text-slate-500 text-lg font-bold">⊘</span>;
  return <span className="text-gray-600 text-lg font-bold">•</span>;
};

const statusColors = {
  Executed: "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400",
  Pending: "text-blue-700 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400",
  Rejected: "text-rose-700 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400",
  Cancelled: "text-slate-600 bg-slate-100 dark:bg-slate-500/20 dark:text-slate-300",
};

const Orders = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchStockOrders()
      .then((res) => setOrders(res?.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        o.symbol?.toLowerCase().includes(q) ||
        o.name?.toLowerCase().includes(q);
      const matchFilter = filter === "All" || o.status === filter;
      return matchSearch && matchFilter;
    });
  }, [orders, search, filter]);

  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    const res = await cancelStockOrder(orderId);
    setCancelling(null);
    if (res?.status) {
      toastSuccess(res.message || "Order cancelled");
      load();
      return;
    }
    if (res?.needs_setup) {
      toastError(res.message || "Link Kotak in Holdings first");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 flex justify-center bg-slate-100 dark:bg-[var(--app-bg)]">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-[var(--text-primary)]">
            Orders
          </h1>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[var(--border-color)] text-slate-700 dark:text-[var(--text-secondary)]"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center md:justify-between mt-4 w-full">
          <input
            type="text"
            placeholder="Search stock…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm w-full md:w-1/3 rounded-lg bg-white border border-slate-300 text-slate-700 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
          />

          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {["All", "Executed", "Pending", "Rejected", "Cancelled"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 md:px-4 py-2 rounded-lg text-sm border ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 dark:bg-[var(--card-bg)] dark:text-[var(--text-secondary)] dark:border-[var(--border-color)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading && orders.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] py-8 text-center">
              Loading orders…
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] py-8 text-center">
              No orders yet. Place a buy/sell from stock details.
            </p>
          )}

          {filtered.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center gap-3 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-semibold bg-slate-100 text-slate-800 dark:bg-[var(--gray-800)] dark:text-[var(--text-primary)]">
                  {String(o.symbol || "--").slice(0, 2)}
                </div>

                <div className="min-w-0">
                  <p className="text-base font-semibold dark:text-[var(--text-primary)]">
                    {o.symbol}{" "}
                    <span
                      className={`px-2 py-0.5 text-[11px] rounded-full ${
                        o.side === "BUY"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {o.side}
                    </span>
                  </p>

                  <p className="text-xs text-slate-600 mt-1 dark:text-[var(--text-secondary)]">
                    {o.qty} Qty • ₹{Number(o.price || 0).toFixed(2)} • {o.orderType}
                  </p>

                  <p className="text-[11px] text-slate-400 dark:text-[var(--text-secondary)]">
                    {o.placedAt || o.id}
                  </p>
                </div>
              </div>

              <div className="text-right min-w-[110px] shrink-0">
                <div className="flex justify-end items-center gap-1">
                  <StatusIcon status={o.status} />
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-medium ${statusColors[o.status] || ""}`}
                  >
                    {o.status}
                  </span>
                </div>

                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                  ₹{(Number(o.qty || 0) * Number(o.price || 0)).toFixed(2)}
                </p>

                {o.canCancel && (
                  <button
                    type="button"
                    disabled={cancelling === o.id}
                    onClick={() => handleCancel(o.id)}
                    className="mt-2 text-[11px] text-rose-600 hover:underline disabled:opacity-50"
                  >
                    {cancelling === o.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
