import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import BasketCard from "../../components/BasketCard";
// import basket_dashboard from "../../assets/basket/basket_dashboard.png"
import basket_dashboard from "../../assets/basket/basket_dashboard.png"
import BasketCard from "./BasketCard";
import { getApiWithToken } from "../../api/api";

export default function BasketList({ baskets }) {

  console.log("Received baskets:", baskets);
  
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Equity", "Hybrid", "Debt", "Commodity"];
  // const allBaskets = [...baskets,...basket]

 let filtered = Array.isArray(baskets) ? [...baskets] : [];
  if (filter !== "All") {
    filtered = baskets.filter((b) => b.category === filter);
  }

  return (
    <div
      className="
    min-h-screen px-12 py-8
    bg-[#f3f7fb]
    dark:bg-[var(--app-bg)]
  "
    >
      {/*  LIGHT / DARK BANNER */}
      <div
        className="
      bg-linear-to-r from-[#e8f2ff] to-[#f4faff]
      rounded-2xl p-8 shadow-md border border-[#e0e7ef]
      flex items-center justify-between mb-10

      dark:from-[var(--white-10)] dark:to-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
      >
        <div className="max-w-lg">
          <h1
            className="
          text-3xl font-bold leading-tight
          text-blue-900 dark:text-[var(--text-primary)]
        "
          >
            Mutual Fund Baskets
          </h1>

          <p
            className="
          mt-2 text-[15px] leading-relaxed
          text-slate-600 dark:text-[var(--text-secondary)]
        "
          >
            Explore expert-curated investment baskets designed for stable and
            long-term wealth creation.
          </p>

          <Link to="/create-basket">
            <button
              className="
            mt-5 px-6 py-2.5 rounded-lg shadow transition
            bg-blue-500 text-white hover:bg-blue-600
          "
            >
              + Create Basket
            </button>
          </Link>
        </div>

        {/* ILLUSTRATION */}
        <img
          src={basket_dashboard}
          className="w-36 opacity-80 hidden sm:block"
          alt="Investment"
        />
      </div>

      {/* CATEGORY CHIPS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === cat
                ? "bg-blue-500 text-white border-blue-500"
                : `
              bg-white text-slate-700 border-[#d2dae3] hover:bg-blue-50
              dark:bg-[var(--white-5)]
              dark:text-[var(--text-primary)]
              dark:border-[var(--border-color)]
              dark:hover:bg-blue-500/15
            `
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div
          className="
        bg-white rounded-xl shadow-md border border-[#e0e7ef]
        p-10 text-center max-w-lg mx-auto

        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            className="w-24 mx-auto mb-4 opacity-80"
            alt="Empty"
          />

          <h2
            className="
          text-xl font-semibold
          text-slate-800 dark:text-[var(--text-primary)]
        "
          >
            No baskets found
          </h2>

          <p
            className="
          mt-1 text-sm
          text-gray-500 dark:text-[var(--text-secondary)]
        "
          >
            Start by creating your first custom basket.
          </p>

          <Link to="/create-basket">
            <button
              className="
            mt-5 px-6 py-3 rounded-xl shadow transition
            bg-blue-500 text-white hover:bg-blue-600
          "
            >
              + Create Basket
            </button>
          </Link>
        </div>
      )}

      {/* BASKET CARD GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((basket) => (
          <BasketCard key={basket.id} basket={basket} />
        ))}
      </div>
    </div>
  );
}
