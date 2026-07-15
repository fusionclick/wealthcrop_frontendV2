import { CandlestickChart, IndianRupee, Search } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { fetchMarketMovers, fetchStockList } from "../../api/marketApi";

const formatTitle = (param = "") =>
  param
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const moverType = (slug) => {
  const t = slug.toLowerCase();
  if (t.includes("loser")) return "losers";
  if (t.includes("volume")) return "volume";
  return "gainers";
};

const formatVolume = (vol) => {
  const v = Number(vol) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

const StockList = () => {
  const { name } = useParams();
  const slug = name || "all-nse-stocks";
  const title = slug.includes("nse") ? "All NSE Stocks" : formatTitle(slug);

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const isMovers = slug.includes("mover") || slug.includes("gainer") || slug.includes("loser");

    if (isMovers) {
      fetchMarketMovers(moverType(slug))
        .then((r) =>
          setStocks(
            (r?.data ?? []).map((row) => ({
              name: row.name || row.company,
              symbol: row.indexName || row.company,
              price: parseFloat(String(row.price).replace(/[^\d.]/g, "")) || 0,
              percent: parseFloat(String(row.change).replace(/[^\d.-]/g, "")) || 0,
              volume: row.volume,
            }))
          )
        )
        .catch(() => setStocks([]))
        .finally(() => setLoading(false));
      return;
    }

    fetchStockList("NIFTY 500", 200)
      .then((r) => {
        let rows = (r?.data ?? []).map((s) => ({
          name: s.companyName || s.symbol,
          symbol: s.symbol,
          price: Number(s.lastPrice) || 0,
          percent: Number(s.pChange) || 0,
          rawVolume: Number(s.totalTradedVolume) || 0,
          volume: formatVolume(s.totalTradedVolume),
        }));
        if (slug.includes("most-bought") || slug.includes("volume")) {
          rows = [...rows].sort(
            (a, b) => (Number(b.rawVolume) || 0) - (Number(a.rawVolume) || 0)
          );
        } else if (slug.includes("gainer")) {
          rows = [...rows].sort((a, b) => b.percent - a.percent);
        } else if (slug.includes("loser")) {
          rows = [...rows].sort((a, b) => a.percent - b.percent);
        }
        setStocks(rows);
      })
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, [slug]);

  const filteredList = useMemo(
    () =>
      stocks.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [stocks, searchQuery]
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6 text-blue-900">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-blue-900 dark:text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">
            {loading ? "Loading…" : `${filteredList.length} stocks from Kotak NSE`}
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbol or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-10 py-2 rounded-lg border text-sm dark:bg-[var(--gray-800)] shadow-sm focus:outline-none focus:shadow-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-300 dark:bg-[var(--gray-800)] dark:text-[var(--text-secondary)] dark:border-[var(--border-color)]">
                <th className="py-2 px-3">Company</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Mkt price</th>
                <th className="py-2 px-3">1D change</th>
                <th className="py-2 px-3">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr
                  key={item.symbol}
                  onMouseEnter={() => setHoveredRow(item.symbol)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="relative border-b hover:bg-gray-100 dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]"
                >
                  <td className="py-4 px-3">
                    <NavLink
                      to={`/stocks/${item.symbol}`}
                      className="font-semibold hover:underline hover:text-blue-500 dark:text-[var(--text-primary)]"
                    >
                      {item.name}
                    </NavLink>
                  </td>
                  <td className="py-4 px-3 text-gray-600 dark:text-[var(--text-secondary)]">
                    {item.symbol}
                  </td>
                  <td className="py-4 px-3">
                    <span className="flex items-center gap-1 dark:text-[var(--text-primary)]">
                      <IndianRupee className="w-4 h-4 text-gray-600" />
                      {item.price ? item.price.toFixed(2) : "—"}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <p
                      className={`text-sm font-medium ${
                        item.percent >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.percent >= 0 ? "+" : ""}
                      {item.percent.toFixed(2)}%
                    </p>
                  </td>
                  <td className="py-4 px-3 relative dark:text-[var(--text-secondary)]">
                    {item.volume || "—"}
                    {hoveredRow === item.symbol && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-40 bg-gray-100 px-2 py-1 rounded-lg shadow dark:bg-[var(--gray-800)]">
                        <NavLink
                          to={`/stocks/${item.symbol}`}
                          className="p-1 rounded-lg border border-gray-300 hover:bg-blue-100 dark:border-[var(--border-color)]"
                        >
                          <CandlestickChart className="text-blue-900" size={20} />
                        </NavLink>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block lg:hidden space-y-4 pb-6">
          {filteredList.map((item) => (
            <NavLink
              key={item.symbol}
              to={`/stocks/${item.symbol}`}
              className="block rounded-xl border p-4 bg-white dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold dark:text-[var(--text-primary)]">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.symbol}</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    item.percent >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.percent >= 0 ? "+" : ""}
                  {item.percent.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <IndianRupee size={14} />
                  {item.price ? item.price.toFixed(2) : "—"}
                </span>
                <span className="text-xs text-gray-500">Vol: {item.volume || "—"}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockList;
