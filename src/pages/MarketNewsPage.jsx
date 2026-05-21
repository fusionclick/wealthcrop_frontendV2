import React, { useState, useMemo } from "react";

export default function MarketNewsPage() {
  const sampleNews = [
    {
      id: 1,
      title: "Markets Rally as Global Cues Turn Positive",
      excerpt:
        "Benchmark indices closed higher as global investors reacted positively to easing inflation numbers.",
      source: "Wealthcrop Research",
      category: "Equity",
      time: "2h ago",
      image:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&q=80",
    },
    {
      id: 2,
      title: "Debt Funds See Inflows as Rate Cycle Pauses",
      excerpt:
        "Short-term debt funds attract fresh inflows amid expectations of stabilizing interest rates.",
      source: "MarketDesk",
      category: "Debt",
      time: "5h ago",
      image:
        "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&q=80",
    },
    {
      id: 3,
      title: "Smallcap Stocks Outperform",
      excerpt:
        "Smallcaps surged ahead as liquidity and investor sentiment stayed strong in domestic markets.",
      source: "AlphaPlus",
      category: "Equity",
      time: "1d ago",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80",
    },
    {
      id: 4,
      title: "Gold Gains on Safe-Haven Demand",
      excerpt:
        "Uncertainty in global markets fuels safe-haven buying in international bullion markets.",
      source: "Commodities Today",
      category: "Commodities",
      time: "3d ago",
      image:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    },
  ];

  const categories = ["All", "Equity", "Debt", "Commodities", "ETF", "IPO"];
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return sampleNews.filter(
      (n) =>
        (activeCat === "All" || n.category === activeCat) &&
        (n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q))
    );
  }, [query, activeCat]);

  return (
    <div
  className="
    min-h-screen py-12
    bg-linear-to-b from-blue-50 via-white to-blue-50
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  <div className="max-w-6xl mx-auto px-6">

    {/* HERO SECTION */}
    <div
      className="
        rounded-3xl p-10 shadow-lg mb-10 border
        bg-linear-to-r from-blue-100 to-indigo-100 border-blue-200
        text-blue-900
        dark:from-[#020617] dark:to-[#020617] dark:border-white/10 dark:text-white
      "
    >
      <h1 className="text-4xl font-extrabold mb-2">
        Market News
      </h1>

      <p className="text-blue-700 text-lg dark:text-gray-400">
        Stay updated with fresh financial news curated by Wealthcrop analysts.
      </p>

      <div className="mt-6 flex gap-3">
        <input
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news..."
          className="
            px-4 py-3 rounded-xl w-full max-w-sm outline-none shadow-md border
            bg-white text-gray-700 border-gray-200
            dark:bg-[#020617] dark:text-white dark:border-white/10
          "
        />
      </div>
    </div>

    {/* CATEGORIES */}
    <div className="flex gap-3 flex-wrap mb-8">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCat(cat)}
          className={`
            px-4 py-2 rounded-full text-sm font-semibold transition
             ${activeCat === cat
    ? "bg-blue-600 text-white"
    : "bg-blue-100 text-blue-600"}
  ${activeCat === cat
    ? "dark:bg-blue-500 dark:text-white"
    : "dark:bg-white/10 dark:text-gray-300"}
          `}
        >
          {cat}
        </button>
      ))}
    </div>

    {/* NEWS FEED */}
    <div className="grid md:grid-cols-2 gap-8">
      {filtered.map((item) => (
        <div
          key={item.id}
          className="
            rounded-2xl p-5 transition shadow-lg hover:shadow-xl border
            bg-white border-blue-100
            dark:bg-[#020617] dark:border-white/10
          "
        >
          <img
            src={item.image}
            alt={item.title}
            className="rounded-xl mb-4 h-48 w-full object-cover"
          />

          <h3 className="text-xl font-bold text-blue-800 mb-2 dark:text-white">
            {item.title}
          </h3>

          <p className="text-gray-600 text-sm mb-3 dark:text-gray-400">
            {item.excerpt}
          </p>

          <div className="text-xs text-gray-500 flex justify-between dark:text-gray-500">
            <span>{item.source}</span>
            <span>{item.time}</span>
          </div>
        </div>
      ))}
    </div>

  </div>
</div>

  );
}
