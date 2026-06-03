import { useRef, useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { postApiWithToken } from "../api/api";

export default function SearchPopup({ onClose }) {
  const containerRef = useRef(null);

  const [filterTag, setFilterTag] = useState("All")
  const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const searchAssets = async (text) => {

    setQuery(text);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    const payload = {
        fields: filterTag,
        count_only: false,
        start: 0,
        length: 100,
        filter_param: {
          scheme_amc_name: "",
          scheme_category: "",
          scheme_sub_category: "",
          investment_mode: "",
          scheme_option: "",
          scheme_plan: "",
          scheme_isin: "",
          settlement_days: "",
          transaction_allowed: "",
        },
        search: {
          value: text,
        },
      },


    const url = `${import.meta.env.VITE_NODE_URL}/master-scheme-list`;
    try {
      const res = await postApiWithToken(url, payload);

      if (res?.status === 200 || res?.status === true) {
        console.log("search assests ", res);
        setResults(res?.data?.data || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    }

    // const matches = ASSETS[type]
    //   .filter((a) =>
    //     a.name.toLowerCase().includes(text.toLowerCase())
    //   )
    //   .slice(0, 4); // show max 4 results

    // setResults(matches);
  };

  return (
    <div
      className="
    fixed inset-0 flex items-center justify-center
    bg-black/40
    z-99999
    animate-fadeInn
   
  "
    >
      {/* Popup box */}
      <div
        ref={containerRef}
        className="
      bg-white shadow-lg overflow-y-auto 
      transition-all duration-300
      w-full h-full
      sm:w-[600px] sm:h-[75vh] sm:rounded-2xl
      sm:animate-slideUp
      dark:border
      border-(--border-color)
      dark:bg-[var(--card-bg)]
    "
      >
        {/* Top Row */}
        <div
          className="
        flex items-center gap-3 mb-5 sticky top-0
        bg-white py-3 px-5 border-b border-gray-100 z-10

        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
        >
          <button
            onClick={onClose}
            className="
          p-2 rounded-full hover:bg-gray-100 transition

          dark:hover:bg-[var(--gray-800)]
        "
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-[var(--text-primary)]" />
          </button>

          <div
            className="
          flex items-center flex-1
          border border-gray-200 rounded-full
          px-3 py-2 bg-gray-50

          dark:border-[var(--border-color)]
          dark:bg-[var(--gray-800)]
        "
          >
            <Search className="w-4 h-4 text-gray-400 dark:text-[var(--text-secondary)] mr-2" />
            <input
              type="text"
              placeholder="Search Wealthcrop..."
              value={query}
              onChange={(e) => searchAssets(e.target.value)}
              className="
            flex-1 bg-transparent outline-none text-sm
            text-gray-700

            dark:text-[var(--text-primary)]
          "
              autoFocus
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6 px-5">
          {["All", "Stocks", "MF", "ETF", "Growth", "IDCW", "Dividend"].map(
            (tag) => (
              <button
                onClick={() => setFilterTag(tag)}
                key={tag}
                className={`
            border border-gray-200 rounded-full
            px-4 py-1.5 text-sm text-gray-700
            hover:bg-green-50 hover:border-green-400 transition
            ${tag === filterTag ? "bg-green-50 border-green-400" : ""}
            dark:border-[var(--border-color)]
            dark:text-[var(--text-primary)]
            dark:hover:bg-[var(--gray-800)]
          `}
              >
                {tag}
              </button>
            ),
          )}
        </div>

        {/* Trending Searches */}
        <div className="px-5">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-[var(--text-secondary)] mb-2">
            Trending searches
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              "Vodafone Idea Ltd.",
              "Suzlon Energy Ltd.",
              "Reliance Power Ltd.",
              "SBI Gold Fund",
              "EPack Prefab Technologies Ltd.",
              "Banco Products (India) Ltd.",
            ].map((item) => (
              <button
                key={item}
                className="
              border border-gray-200 rounded-xl
              py-3 px-4 text-sm text-gray-700
              flex items-center gap-2
              hover:border-green-400 hover:bg-green-50 transition

              dark:border-[var(--border-color)]
              dark:text-[var(--text-primary)]
              dark:hover:bg-[var(--gray-800)]
            "
              >
                <Search className="w-4 h-4 text-gray-400 dark:text-[var(--text-secondary)]" />
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Try Searching For */}
        <div className="px-5 mb-10">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-[var(--text-secondary)] mb-2">
            Try searching for
          </h3>

          <div className="flex flex-col gap-3">
            {[
              "Stocks Under 100",
              "Large Cap stocks",
              "Mid Cap stocks",
              "Finance Stocks",
              "Nifty Next 50 Stocks",
              "Nifty 50 Stocks",
            ].map((query) => (
              <button
                key={query}
                className="
              flex items-center gap-2 text-sm
              text-gray-700 hover:text-green-600 transition

              dark:text-[var(--text-primary)]
            "
              >
                <Search className="w-4 h-4 text-gray-400 dark:text-[var(--text-secondary)]" />
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
