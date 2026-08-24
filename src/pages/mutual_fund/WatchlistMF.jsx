import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import emptyWatchlist from "../../assets/watchlist/emptyWatchlist.svg";
import { fundPath, loadMfWatchlist, toggleMfWatchlist } from "../../utils/nodeApi";

const WatchlistMF = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tick, setTick] = useState(0);
  const watchList = useMemo(() => {
    void tick;
    return loadMfWatchlist();
  }, [tick]);

  const filteredList = watchList.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (watchList.length === 0) {
    return (
      <div className="mx-auto w-full min-h-[400px] p-6 bg-[var(--app-bg)]">
        <div className="p-6 min-h-[350px] max-w-4xl w-full flex flex-col sm:flex-row items-center justify-center gap-10 mx-auto">
          <img src={emptyWatchlist} alt="" className="w-xl object-contain" />
          <div className="flex flex-col space-y-4 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Not watching any funds</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Save a fund from its details page to see it here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/user/mutual_fund/explore")}
              className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 w-40 py-2 rounded-lg text-sm font-medium"
            >
              Explore all funds
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto max-w-[1200px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg mt-5">
      <div className="px-5 py-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your watchlist"
            className="w-full px-10 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="divide-y divide-[var(--border-color)]">
        {filteredList.map((item) => (
          <div key={`${item.isin}-${item.code}`} className="flex items-center justify-between gap-3 px-5 py-4">
            <button
              type="button"
              className="text-left min-w-0"
              onClick={() => navigate(fundPath(item.isin, item.code))}
            >
              <p className="font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
              {item.nav != null ? (
                <p className="text-xs text-[var(--text-secondary)]">NAV ₹{Number(item.nav).toFixed(2)}</p>
              ) : null}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm"
                onClick={() => navigate(fundPath(item.isin, item.code))}
              >
                Buy
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm"
                onClick={() =>
                  navigate("/mutual_fund/redeem", {
                    state: { isin: item.isin, code: item.code, scheme_bse_code: item.code },
                  })
                }
              >
                Sell
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border text-sm"
                onClick={() => {
                  toggleMfWatchlist(item);
                  setTick((n) => n + 1);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistMF;
