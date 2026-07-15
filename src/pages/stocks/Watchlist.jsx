import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { IndianRupee } from "lucide-react";
import { CandlestickChart, Bookmark } from "lucide-react";
import emptyWatchlist from "../../assets/watchlist/emptyWatchlist.svg";
import { fetchStockList } from "../../api/marketApi";

const WATCHLIST_KEY = "wealthcrop_watchlist";

const Watchlist = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWatchlist, setSelectedWatchlist] = useState(1);
  const [createWatchlist, setCreateWatchList] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [watchlistName, setWatchlistName] = useState("");
  const [watchList, setWatchList] = useState([]);

  useEffect(() => {
    const symbols = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
    if (!symbols.length) {
      setWatchList([]);
      return;
    }

    fetchStockList("NIFTY 500")
      .then((res) => {
        const map = new Map((res?.data ?? []).map((s) => [s.symbol, s]));
        setWatchList(
          symbols
            .map((sym) => {
              const row = map.get(sym);
              if (!row) return null;
              return {
                symbol: row.symbol,
                name: row.companyName || row.symbol,
                price: row.lastPrice,
                oneDvol: row.totalTradedVolume ?? row.volume ?? 0,
                pChange: row.pChange,
              };
            })
            .filter(Boolean)
        );
      })
      .catch(() => setWatchList([]));
  }, []);

  const handleCreateWatchlist = () => {
    setCreateWatchList(false);
    setWatchlistName("");
  };

  const filteredList = watchList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showStockPage = (symbol) => navigate(`/stocks/${symbol}`);

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
        Add stocks from Explore to start tracking live prices.
      </p>
    </div>
  </div>
</div>
      ) : (
        <div className="min-h-screen bg-[var(--app-bg)] px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-4 relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search watchlist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-10 py-2 rounded-lg border text-sm dark:bg-[var(--gray-800)]"
              />
            </div>

            <div className="space-y-2">
              {filteredList.map((item, index) => (
                <div
                  key={item.symbol}
                  onClick={() => showStockPage(item.symbol)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border dark:border-[var(--border-color)] cursor-pointer hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold dark:text-[var(--text-primary)]">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.symbol} • NSE</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{item.price}</p>
                    <p className={item.pChange >= 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                      {item.pChange >= 0 ? "+" : ""}{item.pChange}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
    </>
  );
};

export default Watchlist;
