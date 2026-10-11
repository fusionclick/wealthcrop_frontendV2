import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import emptyWatchlist from "../../assets/watchlist/emptyWatchlist.svg";
import { fetchStockList } from "../../api/marketApi";
import { createWatchlist, deleteWatchlist, loadWatchlists, removeFromWatchlist } from "../../utils/watchlists";

// Client 2026-10-09 — several named watchlists, each with the columns a trader scans:
// LTP, change, open, day high / low and volume. Prices come from the same NIFTY 500 list the
// single watchlist used; a symbol it does not cover shows "—" rather than vanishing.
const num = (v, dp = 2) => (Number(v) > 0 ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: dp }) : "—");

const Watchlist = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState(() => loadWatchlists());
  const [activeId, setActiveId] = useState(() => loadWatchlists()[0]?.id || null);
  const [quotes, setQuotes] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchStockList("NIFTY 500")
      .then((res) => setQuotes(new Map((res?.data ?? []).map((s) => [s.symbol, s]))))
      .catch(() => setQuotes(new Map()));
  }, []);

  const active = lists.find((l) => l.id === activeId) || lists[0] || null;
  const rows = useMemo(
    () =>
      (active?.symbols || [])
        .map((sym) => ({ sym, q: quotes.get(sym) || {} }))
        .filter(({ sym, q }) => `${sym} ${q.companyName || ""}`.toLowerCase().includes(searchQuery.toLowerCase())),
    [active, quotes, searchQuery]
  );

  const create = () => {
    const { lists: next, created } = createWatchlist(name);
    setLists(next);
    if (created) setActiveId(created.id);
    setNaming(false);
    setName("");
  };

  const removeList = (id) => {
    const next = deleteWatchlist(id);
    setLists(next);
    setActiveId(next[0]?.id || null);
  };

  const th = "px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-[var(--text-secondary)] whitespace-nowrap";
  const td = "px-3 py-2 text-sm text-gray-900 dark:text-[var(--text-primary)] whitespace-nowrap";

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* One tab per list, plus "new". */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveId(l.id)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                l.id === active?.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)] hover:bg-blue-50 dark:hover:bg-[var(--white-5)]"
              }`}
            >
              {l.name} <span className="opacity-70">({l.symbols.length})</span>
            </button>
          ))}
          {naming ? (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Watchlist name"
                className="rounded-full border border-gray-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--white-5)] px-3 py-1.5 text-sm text-gray-900 dark:text-[var(--text-primary)]"
              />
              <button type="button" onClick={create} disabled={!name.trim()} className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm disabled:opacity-50">
                Create
              </button>
              <button type="button" onClick={() => setNaming(false)} aria-label="Cancel" className="p-1 text-gray-500 dark:text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setNaming(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[var(--white-5)]"
            >
              <Plus size={16} /> New watchlist
            </button>
          )}
          {active && lists.length > 1 && (
            <button
              type="button"
              onClick={() => removeList(active.id)}
              className="ml-auto flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              <Trash2 size={14} /> Delete “{active.name}”
            </button>
          )}
        </div>

        {!active || active.symbols.length === 0 ? (
          <div className="p-6 min-h-[350px] flex flex-col sm:flex-row items-center justify-center gap-10 bg-white dark:bg-[var(--card-bg)] rounded-xl">
            <img src={emptyWatchlist} alt="Empty state" className="w-64 object-contain" />
            <div className="text-center sm:text-left space-y-3">
              <h1 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">Not watching any stocks here</h1>
              <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">Bookmark a stock on Explore and choose this list.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${active.name}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-10 py-2 rounded-lg border text-sm bg-white dark:bg-[var(--gray-800)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)]">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 dark:border-[var(--border-color)]">
                  <tr>
                    <th className={th}>Stock</th>
                    <th className={`${th} text-right`}>LTP (₹)</th>
                    <th className={`${th} text-right`}>Change</th>
                    <th className={`${th} text-right`}>Open</th>
                    <th className={`${th} text-right`}>Day High</th>
                    <th className={`${th} text-right`}>Day Low</th>
                    <th className={`${th} text-right`}>Volume</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[var(--border-color)]">
                  {rows.map(({ sym, q }) => {
                    const priced = Number(q.lastPrice) > 0;
                    const ch = Number(q.pChange) || 0;
                    return (
                      <tr key={sym} onClick={() => navigate(`/stocks/${sym}`)} className="cursor-pointer hover:bg-gray-50 dark:bg-transparent dark:hover:bg-[var(--white-5)]">
                        <td className={td}>
                          <p className="font-semibold">{q.companyName || sym}</p>
                          <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">{sym} • NSE</p>
                        </td>
                        <td className={`${td} text-right font-semibold`}>{num(q.lastPrice)}</td>
                        {/* Audit #52 — an unpriced row reads "—", never "₹0 +0%". */}
                        <td className={`${td} text-right ${!priced ? "" : ch >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {priced ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` : "—"}
                        </td>
                        <td className={`${td} text-right`}>{num(q.open)}</td>
                        <td className={`${td} text-right`}>{num(q.dayHigh)}</td>
                        <td className={`${td} text-right`}>{num(q.dayLow)}</td>
                        <td className={`${td} text-right`}>{num(q.totalTradedVolume, 0)}</td>
                        <td className={td}>
                          <button
                            type="button"
                            aria-label={`Remove ${sym}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLists(removeFromWatchlist(active.id, sym));
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:text-[var(--text-secondary)]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
