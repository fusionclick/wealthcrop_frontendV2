import { CandlestickChart, IndianRupee, Search } from "lucide-react";
import React, { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import TrendChart from "../../components/TrendChart";

const formatTitle = (param = "") =>
  param
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const stocks = [
  {
    name: "Rolex Rings",
    symbol: "ROLEX",
    price: 161.2,
    change: 21.72,
    percent: 15.57,
    volume: "3,76,84,943",
  },
  {
    name: "OLA Electric Mobility",
    symbol: "OLA",
    price: 37.53,
    change: -1.69,
    percent: -4.31,
    volume: "9,46,79,164",
  },
  {
    name: "Groww",
    symbol: "GROWW",
    price: 214.05,
    change: 17.94,
    percent: 9.15,
    volume: "18,13,98,603",
  },
];



const StockList = () => {
  const { name } = useParams();
  const title = formatTitle(name);

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null)

  const watchList = [
    { name: "Canara Bank", trend: "up", price: "137.42", oneDvol: "1,92,54,808", trendData: [5, 8, 7, 10, 6, 9] },
    { name: "Indian Oil Corporation", trend: "up", price: "187.14", oneDvol: "47,64,467",trendData: [10, 12, 9, 14, 13, 15] },
    { name: "Eternal(Zomato)", trend: "up", price: "304.20", oneDvol: "68,77,503" },
    { name: "PNB", trend: "up", price: "150.12", oneDvol: "1,92,54,808" },
    { name: "BPCL", trend: "up", price: "180.12", oneDvol: "1,92,54,808" },
  ];

  const filteredList = watchList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
  <div className="max-w-6xl mx-auto px-4 py-6 text-blue-900">

    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-blue-900 dark:text-[var(--text-primary)]">
        {title}
      </h1>
    </div>

    {/* Search Bar */}
    <div className="mb-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search your watchlist"
          onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full px-10 py-2 rounded-lg border text-sm dark:bg-[var(--gray-800)] shadow-sm focus:outline-none focus:shadow-md"
        />
      </div>
    </div>

    {/* ================= DESKTOP TABLE ================= */}
    <div className="overflow-x-auto hidden lg:block">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b bg-gray-300 dark:bg-[var(--gray-800)] dark:text-[var(--text-secondary)] dark:border-[var(--border-color)]">
            <th className="py-2 px-3">Company</th>
            <th className="py-2 px-3">Trend</th>
            <th className="py-2 px-3">Mkt price</th>
            <th className="py-2 px-3">1D change</th>
            <th className="py-2 px-3">1D Volume</th>
          </tr>
        </thead>

        <tbody>
          {filteredList.map((item, index) => (
            <tr
              key={index}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              className="relative border-b hover:bg-gray-100 dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]"
            >
              <td className="py-4 px-3">
                <NavLink className="font-semibold hover:underline hover:text-blue-500 dark:text-[var(--text-primary)]">
                  {item.name}
                </NavLink>
              </td>

              <td className="py-4 px-3">
                <TrendChart data={item.trendData} />
              </td>

              <td className="py-4 px-3 flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-gray-600 dark:text-[var(--text-secondary)]" />
                <span className="dark:text-[var(--text-primary)]">
                  {item.price}
                </span>
              </td>

              <td className="py-4 px-3">
                <p
                  className={`text-sm font-medium ${
                    Math.random() > 0.5
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.random() > 0.5 ? "+" : "-"}
                  {(Math.random() * 2).toFixed(2)}%
                </p>
              </td>

              <td className="py-4 px-3 relative">
                {item.oneDvol}

                {/* Hover actions */}
                {hoveredRow === index && (
                  <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2 z-40 bg-gray-100 px-2 py-1 rounded-lg shadow dark:bg-[var(--gray-800)]">
                    <button className="p-1 rounded-lg border border-gray-300 hover:bg-blue-100 dark:border-[var(--border-color)] dark:hover:bg-[var(--white-10)]">
                      <CandlestickChart
                        className="text-blue-900 dark:text-[var(--text-primary)]"
                        size={20}
                      />
                    </button>

                    <button className="w-7 h-7 rounded-lg bg-green-500 text-white text-sm">
                      B
                    </button>

                    <button className="w-7 h-7 rounded-lg bg-orange-600 text-white text-sm">
                      S
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ================= MOBILE ================= */}
    <div className="block lg:hidden space-y-4 pb-6">
      {filteredList.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border p-4 bg-white dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]"
        >
          {/* Top row */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold dark:text-[var(--text-primary)]">
              {item.name}
            </h3>

            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-[var(--white-10)]">
                <CandlestickChart size={18} />
              </button>
              <button className="w-8 h-8 rounded-lg bg-green-500 text-white">
                B
              </button>
              <button className="w-8 h-8 rounded-lg bg-orange-600 text-white">
                S
              </button>
            </div>
          </div>

          {/* Price + change */}
          <div className="flex justify-between mt-3 text-sm">
            <span className="flex items-center gap-1">
              <IndianRupee size={14} />
              {item.price}
            </span>

            <span
              className={`font-medium ${
                Math.random() > 0.5
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(Math.random() > 0.5 ? "+" : "-") +
                (Math.random() * 2).toFixed(2)}
              %
            </span>
          </div>

          {/* Trend */}
          <div className="mt-3">
            <TrendChart data={item.trendData} />
          </div>

          {/* Volume */}
          <p className="mt-2 text-xs text-gray-500">
            1D Volume: {item.oneDvol}
          </p>
        </div>
      ))}
    </div>

  </div>
</div>
  );
};

export default StockList;