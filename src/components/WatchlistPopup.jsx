import React, { useEffect, useRef, useState } from "react";
import { Bookmark, Plus } from "lucide-react";
import { addToWatchlist, createWatchlist, loadWatchlists } from "../utils/watchlists";
import { toastSuccess } from "../utils/notifyCustom";

// Client 2026-10-09 — "Add <symbol> to" one of the investor's watchlists, or a new one.
// This used to list three hard-coded lists and console.log the choice.
const WatchlistPopup = ({ symbol, onClose }) => {
  const containerRef = useRef();
  const [lists, setLists] = useState(() => loadWatchlists());
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const addTo = (list) => {
    setLists(addToWatchlist(list.id, symbol));
    toastSuccess(`${symbol} added to ${list.name}`);
    onClose();
  };

  const create = () => {
    const { lists: next, created } = createWatchlist(name);
    setLists(next);
    if (created) addTo(created);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999] px-4">
      <div
        ref={containerRef}
        className="w-full max-w-xl p-6 rounded-2xl shadow-xl bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10 translate-y-[-30px]"
      >
        <h2 className="text-xl font-semibold mb-5 text-blue-950 dark:text-gray-100">Add {symbol} to</h2>

        <div className="space-y-3">
          {lists.map((item) => {
            const has = item.symbols.includes(String(symbol || "").toUpperCase());
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addTo(item)}
                disabled={has}
                className="w-full flex justify-between items-center p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 transition dark:bg-[var(--card-bg)] disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-blue-950 dark:text-gray-100">
                  <Bookmark size={16} className={has ? "fill-current" : ""} /> {item.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {has ? "Already added" : `${item.symbols.length} stock${item.symbols.length === 1 ? "" : "s"}`}
                </span>
              </button>
            );
          })}
        </div>

        {naming ? (
          <div className="mt-4 flex gap-2">
            <input
              autoFocus
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Watchlist name"
              className="flex-1 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
            <button type="button" onClick={create} disabled={!name.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
              Create &amp; add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
          >
            <Plus size={16} /> Create new watchlist
          </button>
        )}
      </div>
    </div>
  );
};

export default WatchlistPopup;
