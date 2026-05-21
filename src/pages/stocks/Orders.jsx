import React, { useEffect, useState } from "react";

// Icons for status
const StatusIcon = ({ status }) => {
  if (status === "Executed") return <span className="text-emerald-600 text-lg font-bold">✓</span>;
  if (status === "Pending") return <span className="text-blue-600 text-lg font-bold">⏳</span>;
  if (status === "Rejected") return <span className="text-rose-600 text-lg font-bold">✖</span>;
  return <span className="text-gray-600 text-lg font-bold">•</span>;
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState("Equity");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // This stores only the items currently displayed
  const [visibleOrders, setVisibleOrders] = useState([]);

  // -----------------------------------------------------------
  // STATIC DATA (this is used now)
  // -----------------------------------------------------------
  const ALL_ORDERS = Array.from({ length: 50 }).map((_, i) => ({
    id: i + 1,
    symbol: ["INFY", "TCS", "HDFCBANK", "RELIANCE", "SBIN"][i % 5],
    name: ["Infosys", "TCS", "HDFC Bank", "Reliance", "SBI"][i % 5],
    side: i % 2 === 0 ? "BUY" : "SELL",
    status: ["Executed", "Pending", "Rejected"][i % 3],
    qty: [10, 5, 12, 20][i % 4],
    price: [1520.5, 3675.2, 1621.0, 2420][i % 4],
    orderType: ["LIMIT", "MARKET"][i % 2],
    placedAt: `0${(i % 9) + 1} Jan, ${(i % 12) + 9}:${(i % 50) + 10} AM`,
  }));

  // -----------------------------------------------------------
  //  Filter + Search Logic (Core Fix)
  // -----------------------------------------------------------
  const getFilteredOrders = () => {
    return ALL_ORDERS.filter((o) => {
      const matchSearch =
        o.symbol.toLowerCase().includes(search.toLowerCase()) ||
        o.name.toLowerCase().includes(search.toLowerCase());

      const matchFilter = filter === "All" || o.status === filter;

      return matchSearch && matchFilter;
    });
  };

  // Load page 1 when component loads
  useEffect(() => {
    const filtered = getFilteredOrders();
    setVisibleOrders(filtered.slice(0, 10));
    setPage(2);
  }, []);

  // Reload list whenever search/filter changes
  useEffect(() => {
    const filtered = getFilteredOrders();
    setVisibleOrders(filtered.slice(0, 10));
    setPage(2);
  }, [search, filter]);

  // -----------------------------------------------------------
  // Load More (pagination)
  // -----------------------------------------------------------
  const loadMore = () => {
    const filtered = getFilteredOrders();
    const start = (page - 1) * 10;
    const more = filtered.slice(start, start + 10);

    setVisibleOrders((prev) => [...prev, ...more]);
    setPage((p) => p + 1);
  };

  // -----------------------------------------------------------
  // SIMULATED LIVE STATUS UPDATE
  // -----------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleOrders((prev) =>
        prev.map((o) =>
          o.status === "Pending" && Math.random() > 0.7
            ? { ...o, status: "Executed" }
            : o
        )
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------------------------------------
  // BACKEND VERSION (commented out, use later)
  // -----------------------------------------------------------

  /*
  // Fetch initial orders from backend
  useEffect(() => {
    fetch("/api/orders?page=1")
      .then((res) => res.json())
      .then((data) => {
        setVisibleOrders(data.orders);
        setPage(2);
      });
  }, []);

  // Pagination for backend
  const loadMore = () => {
    fetch(`/api/orders?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setVisibleOrders((prev) => [...prev, ...data.orders]);
        setPage(page + 1);
      });
  };

  // Live updates using socket.io
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("orderStatusUpdate", (updatedOrder) => {
      setVisibleOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    return () => socket.disconnect();
  }, []);
  */

  // UI Color map
  const statusColors = {
    Executed: "text-emerald-700 bg-emerald-100",
    Pending: "text-blue-700 bg-blue-100",
    Rejected: "text-rose-700 bg-rose-100",
  };

  return (
    <div
  className="
    min-h-screen px-4 py-6 flex justify-center
    bg-slate-100

    dark:bg-[var(--app-bg)]
  "
>
  <div className="w-full max-w-5xl">
    <h1
      className="
        text-xl font-semibold
        text-slate-900

        dark:text-[var(--text-primary)]
      "
    >
      Orders
    </h1>

    {/* Tabs */}
    <div
      className="
        flex gap-3 mt-3 text-sm pb-2
        border-b border-slate-300

        dark:border-[var(--border-color)]
      "
    >
      {["Equity", "F&O", "GTT", "Others"].map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`pb-1 ${
            activeTab === t
              ? "text-blue-600 border-b-2 border-blue-600 font-medium"
              : "text-slate-500 dark:text-[var(--text-secondary)]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Search + Filters */}
    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center md:justify-between mt-4 w-full">
      <input
        type="text"
        placeholder="Search stock…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          px-3 py-2 text-sm w-full md:w-1/3 rounded-lg
          bg-white border border-slate-300 text-slate-700

          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
        "
      />

      <div className="flex gap-2 mt-2 md:mt-0">
        {["All", "Executed", "Pending", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 md:px-4 py-2 rounded-lg text-sm border ${
              filter === f
                ? "bg-blue-600 text-white"
                : `
                  bg-white text-slate-700
                  dark:bg-[var(--card-bg)]
                  dark:text-[var(--text-secondary)]
                  dark:border-[var(--border-color)]
                `
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>

    {/* Orders List */}
    <div className="mt-4 space-y-3">
      {visibleOrders.map((o) => (
        <div
          key={o.id}
          className="
            bg-white border border-slate-200 rounded-xl p-4 shadow-sm
            flex justify-between items-center

            dark:bg-[var(--card-bg)]
            dark:border-[var(--border-color)]
          "
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            <div
              className="
                h-10 w-10 rounded-full flex items-center justify-center font-semibold
                bg-slate-100 text-slate-800

                dark:bg-[var(--gray-800)]
                dark:text-[var(--text-primary)]
              "
            >
              {o.symbol.slice(0, 2)}
            </div>

            <div>
              <p
                className="
                  text-base font-semibold
                  dark:text-[var(--text-primary)]
                "
              >
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

              <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                {o.name}
              </p>

              <p className="text-xs text-slate-600 mt-1 dark:text-[var(--text-secondary)]">
                {o.qty} Qty • ₹{o.price.toFixed(2)} • {o.orderType}
              </p>

              <p className="text-[11px] text-slate-400 dark:text-[var(--text-secondary)]">
                {o.placedAt}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="text-right min-w-[110px]">
            <div className="flex justify-end items-center gap-1">
              <StatusIcon status={o.status} />
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-medium ${statusColors[o.status]}`}
              >
                {o.status}
              </span>
            </div>

            <p
              className="
                mt-2 text-base font-semibold
                text-slate-900

                dark:text-[var(--text-primary)]
              "
            >
              ₹{(o.qty * o.price).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Load More */}
    {visibleOrders.length < getFilteredOrders().length && (
      <div className="flex justify-center mt-4">
        <button
          onClick={loadMore}
          className="
            px-5 py-2 rounded-lg
            bg-slate-900 text-white

            dark:bg-[var(--gray-800)]
          "
        >
          Load More
        </button>
      </div>
    )}
  </div>
</div>

  );
};

export default Orders;
