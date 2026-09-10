import { useRef, useEffect, useState } from "react";
import { Search, ArrowLeft, Bookmark } from "lucide-react";
import { postApi } from "../api/api";
import { searchStocks } from "../api/marketApi";
import { useNavigate } from "react-router-dom";
import { nodeUrl, fundPath, loadMfWatchlist, toggleMfWatchlist } from "../utils/nodeApi";
import { toastSuccess } from "../utils/notifyCustom";

const savedKeysNow = () => new Set(loadMfWatchlist().map((f) => `${f.isin}|${f.code}`));

export default function SearchPopup({ onClose }) {
  const containerRef = useRef(null);

  const [filterTag, setFilterTag] = useState("All")
  const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [stockResults, setStockResults] = useState([]);
    const [loading, setLoading] = useState(false)
    const [savedKeys, setSavedKeys] = useState(savedKeysNow)

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

  // ponytail: tag argument is liye ke tag badalte hi dobara search chalani hoti hai aur
  // usi render mein `filterTag` abhi purana hota hai.
  const searchAssets = async (text, tag = filterTag) => {

    setLoading(true)

    setQuery(text);

    if (text.length < 2) {
      setResults([]);
      setStockResults([]);
      setLoading(false);
      return;
    }

    const searchStocksNow =
      tag === "All" || tag === "Stocks"
        ? searchStocks(text)
            .then((r) => setStockResults(r?.data ?? []))
            .catch(() => setStockResults([]))
        : Promise.resolve().then(() => setStockResults([]));

    if (tag === "Stocks") {
      await searchStocksNow;
      setResults([]);
      setLoading(false);
      return;
    }

    await searchStocksNow;

    const payload = {
      data:{
        fields: [tag?.toUpperCase()],
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
      }
      };


    const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");
    try {
      const res = await postApi(url, payload);

      if (res?.status === 200 || res?.status === true || res?.status === "success") {
        setResults(res?.data?.lists || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally{
      setLoading(false)
    }

    // const matches = ASSETS[type]
    //   .filter((a) =>
    //     a.name.toLowerCase().includes(text.toLowerCase())
    //   )
    //   .slice(0, 4); // show max 4 results

    // setResults(matches);
  };

    const navigate = useNavigate()

 const showFundPage = (isin,code) => {
  // const cleanName = fundName.replace(/\s+/g, "");
  onClose();
  navigate(fundPath(isin, code));
};

  // ponytail: pehle yahan `toggleBookmark` call hota tha jo kahin define hi nahi tha —
  // har bookmark click ReferenceError deta tha. Watchlist ka helper pehle se maujood hai.
  const toggleSaved = (asset) => {
    const isin = asset?.scheme_isin || "";
    const code = asset?.scheme_bse_code || "";
    const nowSaved = toggleMfWatchlist({ isin, code, name: asset?.name || "Fund" });
    setSavedKeys(savedKeysNow());
    toastSuccess(nowSaved ? "Saved to watchlist" : "Removed from watchlist");
  };

  return (
  <div
  className="
    fixed inset-0 flex items-center justify-center
    bg-black/40 z-[99999] animate-fadeInn
  "
>
  <div
    ref={containerRef}
    className="
      bg-white shadow-lg
      w-full h-full
      sm:w-[600px] sm:h-[75vh]
      sm:rounded-2xl
      overflow-hidden
      transition-all duration-300
      sm:animate-slideUp
      flex flex-col
      dark:bg-[var(--card-bg)]
      dark:border dark:border-[var(--border-color)]
    "
  >
    {/* HEADER */}
    <div
      className="
        sticky top-0 z-20
        bg-white border-b border-gray-100
        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
        relative
      "
    >
      {/* SEARCH ROW */}
      <div className="flex items-center gap-3 py-3 px-5">
        <button
          onClick={onClose}
          className="
            p-2 rounded-full
            hover:bg-gray-100
            dark:hover:bg-[var(--gray-800)]
          "
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-[var(--text-primary)]" />
        </button>

        <div
          className="
            flex items-center flex-1
            border border-gray-200
            rounded-full
            px-3 py-2
            bg-gray-50

            dark:border-[var(--border-color)]
            dark:bg-[var(--gray-800)]
          "
        >
          <Search className="w-4 h-4 mr-2 text-gray-400" />

          <input
            autoFocus
            value={query}
            onChange={(e) => searchAssets(e.target.value)}
            placeholder="Search Wealthcrop..."
            className="
              flex-1 bg-transparent outline-none
              text-sm

              dark:text-[var(--text-primary)]
            "
          />
        </div>
      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {[
          "All",
          "Stocks",
          "MF",
          "ETF",
          "Growth",
          "IDCW",
          "Dividend",
        ].map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setFilterTag(tag);
              if (query.length >= 2) searchAssets(query, tag);
            }}
            className={`
              px-4 py-1.5
              rounded-full
              text-sm
              border
              transition

              ${
                tag === filterTag
                  ? "bg-green-50 border-green-500 text-green-600 dark:bg-[var(--gray-800)]"
                  : "border-gray-200 hover:bg-green-50"
              }

              dark:border-[var(--border-color)]
              dark:text-[var(--text-primary)]
              dark:hover:bg-[var(--gray-800)]
            `}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* LOADING BAR */}
      {loading && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden">
          <div className="loading-bar" />
        </div>
      )}
    </div>

    {/* CONTENT */}
    <div className="flex-1 overflow-hidden">
      {stockResults.length > 0 && (
        <div className="border-b border-gray-100 dark:border-[var(--border-color)]">
          <h3 className="px-5 pt-4 pb-2 text-xs font-semibold text-gray-500">Stocks</h3>
          {stockResults.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => {
                onClose();
                navigate(`/stocks/${stock.symbol}`);
              }}
              className="px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--gray-800)] flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-medium dark:text-[var(--text-primary)]">
                  {stock.companyName}
                </div>
                <div className="text-xs text-gray-500">{stock.symbol} · NSE</div>
              </div>
              {stock.lastPrice > 0 && (
                <div className="text-sm font-semibold dark:text-[var(--text-primary)]">
                  ₹{stock.lastPrice}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {results.length > 0 ? (
        <div className="h-full overflow-y-auto">
          {results.map((asset) => (
            <div
              key={`${asset.scheme_isin || ""}-${asset.scheme_bse_code || asset.name}`}
              onClick={() => showFundPage(asset?.scheme_isin, asset?.scheme_bse_code)}
              className="
                px-5 py-4
                border-b border-gray-100
                cursor-pointer

                flex items-center justify-between

                hover:bg-gray-50 text-gray-700

                dark:border-[var(--border-color)]
                dark:hover:bg-[var(--gray-800)]
              "
            >
              <div>
                <div className=" text-sm dark:text-[var(--text-primary)]">
                  {asset.name}
                </div>

                {asset.type && (
                  <div className="text-xs text-gray-500">
                    {asset.type}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaved(asset);
                }}
                className="
                  p-2 rounded-full
                  hover:bg-gray-100

                  dark:hover:bg-[var(--gray-700)]
                "
              >
                <Bookmark
                  className={
                    savedKeys.has(`${asset.scheme_isin || ""}|${asset.scheme_bse_code || ""}`)
                      ? "w-5 h-5 text-green-600 fill-green-600"
                      : "w-5 h-5 text-gray-500"
                  }
                />
              </button>
            </div>
          ))}
        </div>
      ) : stockResults.length === 0 ? (
        <div className="h-full overflow-y-auto">
          {/* TRENDING */}
          <div className="px-5 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 mb-3">
              Trending searches
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* ponytail: pehle poore legal naam ("Vodafone Idea Ltd.") thay jin par backend
                  ka substring match fail hota hai — ye wahi naam hain jo waqai hit karte hain. */}
              {[
                "Vodafone",
                "Suzlon",
                "Reliance Power",
                "Tata Motors",
                "HDFC Bank",
                "SBI Gold",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => searchAssets(item)}
                  className="
                    border border-gray-200
                    rounded-xl
                    p-3 text-gray-700

                    text-left text-sm

                    flex items-center gap-2

                    hover:bg-green-50 transition

                    dark:border-[var(--border-color)]
                    dark:text-[var(--text-primary)]
                    dark:hover:bg-[var(--gray-800)]
                  "
                >
                  <Search className="w-4 h-4" />
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* TRY SEARCHING */}
          <div className="px-5 pb-8">
            <h3 className="text-xs font-semibold text-gray-500 mb-3">
              Try searching for
            </h3>

            <div className="space-y-3">
              {/* ponytail: pehle yahan "Stocks Under 100" jaisi screener-lines thin jo search
                  se match hi nahi karti — ab wohi terms jin par catalogue waqai jawab deta hai. */}
              {[
                "Large Cap",
                "Small Cap",
                "Flexi Cap",
                "Index Fund",
                "ELSS",
                "Liquid Fund",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => searchAssets(item)}
                  className="
                    flex items-center gap-2
                    text-sm text-gray-700

                    hover:text-green-600
                  "
                >
                  <Search className="w-4 h-4" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </div>
</div>
  );
}
