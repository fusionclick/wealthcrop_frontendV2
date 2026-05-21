import React, { useState } from "react";
import { Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { IndianRupee } from "lucide-react";
import { CandlestickChart, Bookmark } from "lucide-react";
import { Sparklines, SparklinesLine } from 'react-sparklines';
import TrendChart from "../../components/TrendChart";
import emptyWatchlist from "../../assets/watchlist/emptyWatchlist.svg"


const Watchlist = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWatchlist, setSelectedWatchlist] = useState(1); // default selected tab
  const [createWatchlist, setCreateWatchList] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  const [watchlistName, setWatchlistName] = useState("");

const handleCreateWatchlist = () => {
  console.log("Creating watchlist:", watchlistName);
  setCreateWatchList(false);
  setWatchlistName("");
};

  const watchList = [
    { name: "Canara Bank", trend: "up", price: "150.12", oneDvol: "1,92,54,808", trendData: [5, 8, 7, 10, 6, 9] },
    { name: "Indian Oil Corporation", trend: "up", price: "187.14", oneDvol: "47,64,467",trendData: [10, 12, 9, 14, 13, 15] },
    { name: "Eternal(Zomato)", trend: "up", price: "304.20", oneDvol: "68,77,503" },
    { name: "PNB", trend: "up", price: "150.12", oneDvol: "1,92,54,808" },
    { name: "BPCL", trend: "up", price: "150.12", oneDvol: "1,92,54,808" },
  ];

  const filteredList = watchList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    {
      watchList.length === 0 ? (
  <div
  className="
    mx-auto w-full min-h-[400px] p-6
    bg-white

    dark:bg-[var(--app-bg)]
  "
>
  <div
    className="
      p-6 min-h-[350px] max-w-4xl w-full
      flex flex-col sm:flex-row
      items-center justify-center gap-10 mx-auto

      dark:bg-[var(--card-bg)]
    "
  >
    <div>
      <img
        src={emptyWatchlist}
        alt="Empty state"
        className="w-xl object-contain"
      />
    </div>

    <div className="flex flex-col space-y-12 text-center sm:text-left">
      <h1
        className="
          text-2xl font-semibold
          text-blue-950

          dark:text-[var(--text-primary)]
        "
      >
        Not Watching any stocks
      </h1>

      <p
        className="
          text-sm text-gray-600

          dark:text-[var(--text-secondary)]
        "
      >
        Keep a watch and stay updated about stocks of your interest
      </p>

      <button
        className="
          mt-4 px-2 w-36 py-2 rounded-lg text-sm font-medium transition
          bg-emerald-500 hover:bg-emerald-700 text-white
          focus:outline-none

          dark:bg-emerald-600
          dark:hover:bg-emerald-700
        "
      >
        Explore all stocks
      </button>
    </div>
  </div>
</div>


      ):(
<div className="mx-auto w-full lg:w-[1200px] mt-5 bg-white border border-gray-300 rounded-lg dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">

  {/* Watchlist Tabs */}
<div className="flex flex-wrap items-center px-4 py-3 gap-4 border-b dark:border-[var(--border-color)]">
  {Array.from({ length: 5 }).map((_, index) => {
    const tab = index + 1;
    const isSelected = selectedWatchlist === tab;

    return (
      <span
        key={index}
        onClick={() => setSelectedWatchlist(tab)}
        className={`cursor-pointer pb-1 font-semibold text-sm ${
          isSelected
            ? "text-blue-900 border-b-2 border-blue-500 dark:text-[var(--text-primary)]"
            : "text-gray-500 dark:text-[var(--text-secondary)]"
        }`}
      >
        WL {tab}
      </span>
    );
  })}

  <button
    className="text-sm font-semibold text-emerald-500 dark:text-emerald-400"
    onClick={() => setCreateWatchList(true)}
  >
    + Watchlist
  </button>
</div>

  {/* Search Bar */}
<div className="px-4 py-4 w-full">
  <div className="relative">
    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search your watchlist"
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full px-10 py-2 rounded-lg border text-sm dark:bg-[var(--gray-800)]"
    />
  </div>
</div>


  {/* Table */}
  <div className="w-full overflow-x-auto hidden lg:block">
    <table className="w-full border-collapse">
      <thead>
        <tr
          className="
            text-left text-gray-500 border-b bg-gray-300

            dark:bg-[var(--gray-800)]
            dark:text-[var(--text-secondary)]
            dark:border-[var(--border-color)]
          "
        >
          <th className="py-2 px-3">Company ({filteredList.length})</th>
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
            className={`
              relative border-b
              hover:bg-gray-100

              dark:border-[var(--border-color)]
              dark:hover:bg-[var(--white-5)]
            `}
          >
            <td className="py-4 px-3">
              <NavLink
                className="
                  font-semibold hover:underline hover:text-emerald-500
                  dark:text-[var(--text-primary)]
                "
              >
                {item.name}
              </NavLink>
            </td>

            <td className="py-4 px-3">
              <TrendChart data={item.trendData} />
            </td>

            <td className="py-4 px-3 flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-gray-600 dark:text-[var(--text-secondary)]" />
              <span className="dark:text-[var(--text-primary)]">{item.price}</span>
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
                <div
                  className="
                    absolute right-28 top-1/2 -translate-y-1/2
                    flex items-center gap-2 z-40
                    bg-gray-100

                    dark:bg-[var(--gray-800)]
                  "
                >
                  <button
                    className="
                      p-1 rounded-lg border border-gray-300
                      hover:bg-blue-100

                      dark:border-[var(--border-color)]
                      dark:hover:bg-[var(--white-10)]
                    "
                  >
                    <CandlestickChart className="text-blue-900 dark:text-[var(--text-primary)]" size={24} />
                  </button>

                  <button className="w-8 h-8 rounded-lg bg-green-500 text-white">
                    B
                  </button>

                  <button className="w-8 h-8 rounded-lg bg-orange-600 text-white">
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

  {/* for mobile */}
<div className="block lg:hidden px-4 space-y-4 pb-6">
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
          <button className="w-8 h-8 rounded-lg bg-green-500 text-white">B</button>
          <button className="w-8 h-8 rounded-lg bg-orange-600 text-white">S</button>
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
            Math.random() > 0.5 ? "text-green-600" : "text-red-600"
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

      )
    }
   

    

   {createWatchlist && (
  <div
  className="
    fixed inset-0 flex justify-center items-center z-50
    bg-black/40 animate-fadeInn
  "
  onClick={() => setCreateWatchList(false)}
>
  <div
    className="
      w-[400px] p-6 rounded-lg shadow-lg
      bg-white

      dark:bg-[var(--card-bg)]
      dark:border dark:border-[var(--border-color)]
    "
    onClick={(e) => e.stopPropagation()}
  >
    {/* Heading */}
    <h2
      className="
        text-xl font-semibold mb-4
        text-gray-800

        dark:text-[var(--text-primary)]
      "
    >
      Create Watchlist
    </h2>

    {/* Input */}
    <input
      type="text"
      maxLength={20}
      placeholder="Enter watchlist name"
      value={watchlistName}
      onChange={(e) => setWatchlistName(e.target.value)}
      className="
        w-full px-3 py-2 rounded-md mb-2
        border border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500
        bg-white text-gray-700

        dark:bg-[var(--gray-800)]
        dark:border-[var(--border-color)]
        dark:text-[var(--text-primary)]
        dark:placeholder:text-[var(--text-secondary)]
      "
    />

    {/* Max letters info */}
    <p
      className="
        text-sm mb-4
        text-gray-500

        dark:text-[var(--text-secondary)]
      "
    >
      Max 20 characters
    </p>

    {/* Create Button */}
    <button
      onClick={handleCreateWatchlist}
      className="
        w-full py-2 rounded-md font-semibold
        bg-green-600 hover:bg-green-700 text-white

        dark:bg-emerald-600 dark:hover:bg-emerald-700
      "
    >
      Create
    </button>
  </div>
</div>

)}

    </>
  );
};

export default Watchlist;
