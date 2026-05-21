import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import PageLoader from "../../components/PageLoader";
import SmallLoader from "../../components/SmallLoader";

/* ---------------------------------------------
   DEMO FUND DATA FOR ALL COLLECTIONS
--------------------------------------------- */
const FUND_DATA_BY_CATEGORY = {
  "high_return": [
    {
      id: 1,
      name: "HDFC Silver ETF FoF Direct Growth",
      subType: "Commodities • Silver",
      logoText: "H",
      logoBg: "bg-red-100",
      rating: 4,
      risk: "High",
      returns: { "1Y": 91.51, "3Y": 37.41, "5Y": null },
    },
    {
      id: 2,
      name: "Axis Silver FoF Direct Growth",
      subType: "Commodities • Silver",
      logoText: "A",
      logoBg: "bg-pink-100",
      rating: 4,
      risk: "High",
      returns: { "1Y": 90.16, "3Y": 36.87, "5Y": null },
    },
    {
      id: 3,
      name: "Quant Small Cap Fund Direct Growth",
      subType: "Equity • Small Cap",
      logoText: "Q",
      logoBg: "bg-purple-100",
      rating: 5,
      risk: "High",
      returns: { "1Y": 42.8, "3Y": 34.1, "5Y": 27.5 },
    },
  ],

  "gold_funds": [
    {
      id: 4,
      name: "Nippon India Gold Savings Fund Direct",
      subType: "Commodities • Gold",
      logoText: "N",
      logoBg: "bg-yellow-200",
      rating: 4,
      risk: "Moderate",
      returns: { "1Y": 19.7, "3Y": 12.3, "5Y": 11.2 },
    },
    {
      id: 5,
      name: "Kotak Gold Fund Direct Growth",
      subType: "Commodities • Gold",
      logoText: "K",
      logoBg: "bg-amber-200",
      rating: 4,
      risk: "Moderate",
      returns: { "1Y": 18.9, "3Y": 11.8, "5Y": 10.5 },
    },
  ],

  "5_star_funds": [
    {
      id: 6,
      name: "Parag Parikh Flexi Cap Fund Direct",
      subType: "Equity • Flexi Cap",
      logoText: "P",
      logoBg: "bg-blue-100",
      rating: 5,
      risk: "Moderate",
      returns: { "1Y": 32.1, "3Y": 22.8, "5Y": 20.4 },
    },
    {
      id: 7,
      name: "Mirae Asset Emerging Bluechip Direct",
      subType: "Equity • Large & Mid Cap",
      logoText: "M",
      logoBg: "bg-indigo-100",
      rating: 5,
      risk: "Moderate",
      returns: { "1Y": 29.4, "3Y": 24.7, "5Y": 18.1 },
    },
  ],

  "large_cap": [
    {
      id: 8,
      name: "SBI Bluechip Fund Direct Growth",
      subType: "Equity • Large Cap",
      logoText: "S",
      logoBg: "bg-indigo-100",
      rating: 4,
      risk: "Low",
      returns: { "1Y": 16.2, "3Y": 14.1, "5Y": 12.8 },
    },
    {
      id: 9,
      name: "ICICI Prudential Bluechip Fund Direct",
      subType: "Equity • Large Cap",
      logoText: "I",
      logoBg: "bg-cyan-100",
      rating: 5,
      risk: "Low",
      returns: { "1Y": 18.4, "3Y": 15.8, "5Y": 13.9 },
    },
  ],

  "mid_cap": [
    {
      id: 10,
      name: "Kotak Emerging Equity Fund Direct",
      subType: "Equity • Mid Cap",
      logoText: "K",
      logoBg: "bg-green-100",
      rating: 4,
      risk: "Moderate",
      returns: { "1Y": 27.1, "3Y": 20.3, "5Y": 16.5 },
    },
    {
      id: 11,
      name: "Axis Midcap Fund Direct",
      subType: "Equity • Mid Cap",
      logoText: "A",
      logoBg: "bg-teal-100",
      rating: 4,
      risk: "High",
      returns: { "1Y": 24.8, "3Y": 18.7, "5Y": 15.1 },
    },
  ],

  "small_cap": [
    {
      id: 12,
      name: "Quant Small Cap Fund Direct",
      subType: "Equity • Small Cap",
      logoText: "Q",
      logoBg: "bg-red-200",
      rating: 5,
      risk: "High",
      returns: { "1Y": 42.8, "3Y": 34.1, "5Y": 27.5 },
    },
    {
      id: 13,
      name: "Axis Small Cap Fund Direct",
      subType: "Equity • Small Cap",
      logoText: "A",
      logoBg: "bg-pink-200",
      rating: 4,
      risk: "High",
      returns: { "1Y": 38.4, "3Y": 30.2, "5Y": 24.7 },
    },
  ],
};

/* ---------------------------------------------
   META
--------------------------------------------- */
/* ---------------------------------------------
   SUBTITLES FOR ALL COLLECTIONS
--------------------------------------------- */
const CATEGORY_META = {
  "high-return": { subtitle: "Funds with highest historical returns." },
  "gold-funds": { subtitle: "Funds investing in Gold ETFs and gold assets." },
  "5-star-funds": { subtitle: "Top-rated mutual funds with 5-star rating." },
  "large_cap": { subtitle: "Stable bluechip companies with lower risk." },
  "mid_cap": { subtitle: "Funds investing in fast-growing mid-sized companies." },
  "small_cap": { subtitle: "High-growth potential small cap companies." },
};

const SORT_OPTIONS = [
  { label: "Returns (High To Low)", key: "RET_DESC" },
  { label: "Returns (Low To High)", key: "RET_ASC" },
  { label: "Asset Size (High To Low)", key: "AUM_DESC" },
  { label: "Asset Size (Low To High)", key: "AUM_ASC" },
  { label: "Volatility (High To Low)", key: "VOL_DESC" },
  { label: "Volatility (Low To High)", key: "VOL_ASC" },
];

const FILTERS = {
  Category: ["Equity", "Debt", "Hybrid", "Commodities"],
  // "Sub Category": ["Silver", "Flexi Cap"],
  Risk: ["Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High"],
  AMC: ["HDFC", "Axis", "PPFAS"],
  Nature: ["Growth", "IDCW"],
};

const humanize = (slug = "") =>
  slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const Stars = ({ rating }) => (
  <span className="text-[11px] text-amber-500">
    {"★".repeat(rating)}
    <span className="text-slate-300">{"☆".repeat(5 - rating)}</span>
  </span>
);

/* ---------------------------------------------
   COMPONENT
--------------------------------------------- */
const FundCategorySection = () => {
  const { categorySlug } = useParams();
  const title = humanize(categorySlug);
  const subtitle = CATEGORY_META[categorySlug]?.subtitle || "";

  const baseFunds = FUND_DATA_BY_CATEGORY[categorySlug] || [];
  const periods = ["1Y", "3Y", "5Y"];

  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState(null);
  const [activeTab, setActiveTab] = useState("Category");
  const [activeCategory, setActiveCategory] = useState();
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);


  const navigate = useNavigate();
  const observer = useRef(null)

  const [fundsList, setFundsList] = useState([]);
  const [page, setPage] = useState(0);
  const limit = 10;

  const url = `${import.meta.env.VITE_NODE_URL}${import.meta.env.VITE_GET_ALL_FUNDS}`;

 const { data, isLoading, error, isFetching } = useQuery({
  queryKey: ["FUNDS", categorySlug, currentPage, limit],
  queryFn: () =>
    postApi(url, {
      category: categorySlug,
      start: (currentPage - 1) * limit,
      length: limit,
    }),
  // keepPreviousData: true,
  placeholderData: (prev) => prev
});

  useEffect(() => {
    console.log("All funds", data);
    if(data?.data?.lists?.length){
      setFundsList((prev) => [...prev, ...data?.data?.lists]);
    } else {
        setHasMore(false);
      }
  }, [data]);

  //  1. current page state

  //  2. config
  const itemsPerPage = 5;

  //  3. dummy data (replace with API later)
  const data2 = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

  //  4. total pages
  const totalPages = Math.ceil(data2.length / itemsPerPage);

  //  5. page change handler
  const onPageChange = (page) => {
    if (page < 1 || page > totalPages) return; // safety
    setCurrentPage(page);
  };

  //  6. slice data based on page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data2.slice(startIndex, startIndex + itemsPerPage);

  const [filters, setFilters] = useState({
    Category: [],
    // "Sub Category": [],
    Risk: [],
    AMC: [],
    Nature: [],
  });

  const filterCount = Object.values(filters).flat().length;

  const funds = useMemo(() => {
    let list = [...baseFunds];

    Object.entries(filters).forEach(([key, values]) => {
      if (!values.length) return;
      const map = key === "Sub Category" ? "subCategory" : key.toLowerCase();
      list = list.filter((f) => values.includes(f[map]));
    });

    switch (sort) {
      case "RET_DESC":
        list.sort((a, b) => (b.returns["1Y"] ?? 0) - (a.returns["1Y"] ?? 0));
        break;
      case "RET_ASC":
        list.sort((a, b) => (a.returns["1Y"] ?? 0) - (b.returns["1Y"] ?? 0));
        break;
      case "AUM_DESC":
        list.sort((a, b) => b.assetSize - a.assetSize);
        break;
      case "AUM_ASC":
        list.sort((a, b) => a.assetSize - b.assetSize);
        break;
      case "VOL_DESC":
        list.sort((a, b) => b.volatility - a.volatility);
        break;
      case "VOL_ASC":
        list.sort((a, b) => a.volatility - b.volatility);
        break;
      default:
        break;
    }

    return list;
  }, [baseFunds, filters, sort]);

  const slugify = (text = "") =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

      // ! for automatic set curret page when scroll
const containerRef = useRef(null);

const lastElementRef = useCallback(
  (node) => {
    if (!node || !hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log("NEXT PAGE");

          setCurrentPage((prev) => prev + 1);
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    );

    observer.current.observe(node);
  },
  [hasMore]
);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8 rounded-lg dark:bg-[var(--white-10)]">
      {/* TITLE */}
      <h2 className="text-xl font-semibold text-slate-900 dark:text-[var(--text-primary)]">
        {title}
      </h2>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-1">
          {subtitle}
        </p>
      )}

      {/* FILTER + SORT */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => setShowFilter(true)}
          className="
        flex items-center gap-2
        text-gray-700 dark:text-[var(--text-primary)]
        border border-gray-300 dark:border-[var(--border-color)]
        rounded-full px-4 py-2 text-sm font-medium
        bg-white dark:bg-[var(--card-bg)]
        hover:bg-slate-50 dark:hover:bg-[var(--white-5)]
        transition
      "
        >
          <SlidersHorizontal
            size={16}
            className="text-blue-500"
            strokeWidth={2.5}
          />
          Filters
          {filterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 rounded-full">
              {filterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowSort(true)}
          className="
        flex items-center gap-2
        border border-gray-300 dark:border-[var(--border-color)]
        text-gray-700 dark:text-[var(--text-primary)]
        rounded-full px-4 py-2 text-sm font-medium
        bg-white dark:bg-[var(--card-bg)]
        hover:bg-slate-50 dark:hover:bg-[var(--white-5)]
        transition
      "
        >
          Sort By
          <ChevronDown size={14} strokeWidth={2.5} className="text-blue-500" />
        </button>
      </div>

      {/* LIST */}
<div
  ref={containerRef}
  className="space-y-2 mt-4 h-[80vh] overflow-y-auto"
>
  {fundsList?.map((f) => (
    <div
      key={f.id}
      className="
        bg-white dark:bg-[var(--card-bg)]
        border border-gray-400 dark:border-[var(--border-color)]
        rounded-xl px-4 py-3
        flex flex-col sm:flex-row
        sm:justify-between
        gap-3 sm:gap-0
        hover:bg-slate-50 dark:hover:bg-[var(--white-5)]
        transition
      "
    >
      {/* LEFT */}
      <div className="flex gap-3 flex-1 min-w-0">
        <div
          className={`
            h-9 w-9 rounded-lg flex items-center justify-center font-bold
            ${f.logoBg}
            dark:bg-[var(--white-10)]
            dark:text-[var(--text-primary)]
            flex-shrink-0
          `}
        >
          {f.logoText}
        </div>

        <div className="min-w-0">
          <p
            onClick={() =>
              navigate(`/mutual_fund/${slugify(f.name)}`)
            }
            className="
              text-sm font-semibold cursor-pointer
              text-slate-900 dark:text-[var(--text-primary)]
              hover:underline
              break-words
            "
          >
            {f.name}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
            {f.subType}
          </p>

          <div className="mt-1 flex gap-2 text-[11px] flex-wrap">
            <Stars rating={f.rating} />

            <span
              className="
                bg-slate-100 dark:bg-[var(--white-10)]
                text-slate-600 dark:text-[var(--text-secondary)]
                px-2 rounded
              "
            >
              Risk : {f.risk}
            </span>
          </div>
        </div>
      </div>

      {/* RETURNS */}
      <div
        className="
          flex gap-4 sm:gap-6
          text-left sm:text-right
          flex-wrap sm:flex-nowrap
          w-full sm:w-auto justify-between px-4
        "
      >
        {periods.map((p) => (
          <div key={p} className="min-w-[60px]">
            <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
              {p}
            </p>

            {f.returns[p] == null ? (
              <p className="text-slate-400 dark:text-[var(--text-secondary)]">
                --
              </p>
            ) : (
              <p className="font-medium text-emerald-600 dark:text-[var(--chart-up)]">
                +{f.returns[p].toFixed(2)}%
              </p>
            )}
          </div>
        ))}
      </div>

      {/* BUY */}
      <button
        onClick={() =>
          navigate(
            `/mutual_fund/${slugify(f.name)}/purchase_fund`
          )
        }
        className="
          mt-2 sm:mt-0
          ml-0 sm:ml-6
          w-full sm:w-auto
          px-4 py-2 rounded-lg text-sm
          bg-blue-500 hover:bg-blue-600
          text-white
          shadow-sm transition
        "
      >
        Buy
      </button>
    </div>
  ))}

   {isFetching && (
    <div className="flex justify-center py-4">
      <SmallLoader />
    </div>
  )}

  {/* SENTINEL */}
  <div ref={lastElementRef} className="h-10" />
</div>

 

      {/* SORT MODAL */}
      {showSort && (
        <Modal title="Sort By" onClose={() => setShowSort(false)}>
          {SORT_OPTIONS.map((o) => (
            <Option
              key={o.key}
              label={o.label}
              active={sort === o.key}
              onClick={() => {
                setSort(o.key);
                setShowSort(false);
              }}
            />
          ))}
        </Modal>
      )}

      {/* FILTER MODAL */}
      {showFilter && (
        <Modal title="Filter" wide onClose={() => setShowFilter(false)}>
          <div className="flex h-80 border-t border-gray-400 dark:border-[var(--border-color)]">
            <div className="w-[50%] border-r border-gray-400 dark:border-[var(--border-color)]">
              {Object.keys(FILTERS).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  className={`
                w-full text-left px-4 py-3 text-md
                ${
                  activeTab === k
                    ? "bg-blue-50 dark:bg-sky-500/10 text-blue-500 dark:text-sky-400"
                    : "text-slate-700 dark:text-[var(--text-secondary)]"
                }
              `}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-auto">
              {FILTERS[activeTab].map((opt) => (
                <label
                  key={opt}
                  className="flex gap-2 text-sm text-slate-700 dark:text-[var(--text-secondary)]"
                >
                  <input
                    type="checkbox"
                    checked={filters[activeTab].includes(opt)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        [activeTab]: prev[activeTab].includes(opt)
                          ? prev[activeTab].filter((x) => x !== opt)
                          : [...prev[activeTab], opt],
                      }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() =>
                setFilters({
                  Category: [],
                  "Sub Category": [],
                  Risk: [],
                  AMC: [],
                  Nature: [],
                })
              }
              className="
            flex-1 border rounded-lg py-3 font-semibold
            border-blue-400 text-blue-600
            hover:bg-sky-100 dark:hover:bg-sky-500/10
          "
            >
              Clear
            </button>

            <button
              onClick={() => setShowFilter(false)}
              className="
            flex-1 bg-blue-600 hover:bg-blue-700
            text-white rounded-lg py-3 font-semibold
          "
            >
              Apply
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};;

export default FundCategorySection;

/* ---------------------------------------------
   SMALL COMPONENTS
--------------------------------------------- */
const Modal = ({ title, children, onClose, wide }) => (
  <div
  className="
    fixed inset-0 z-50
    bg-black/40 dark:bg-black/70
    flex items-center justify-center
  "
  onClick={onClose}
>
  <div
    className={`
      rounded-xl p-4
      ${wide ? "w-[800px]" : "w-[360px]"}
      
      bg-white dark:bg-[var(--card-bg)]
      text-slate-900 dark:text-[var(--text-primary)]
      border border-transparent dark:border-[var(--border-color)]
      shadow-xl
    `}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
        {title}
      </h3>

      <button
        onClick={onClose}
        className="
          cursor-pointer
          text-slate-500 hover:text-slate-700
          dark:text-[var(--text-secondary)]
          dark:hover:text-white
          transition
        "
      >
        <X size={18} />
      </button>
    </div>

    {children}
  </div>
</div>

);


const Option = ({ label, active, onClick }) => (
  <button
  onClick={onClick}
  className={`
    w-full text-left px-2 py-3 text-sm transition
    text-slate-700 dark:text-[var(--text-secondary)]
    
    ${active
      ? "font-semibold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-[var(--white-10)]"
      : "hover:bg-slate-100 dark:hover:bg-[var(--white-5)]"}
  `}
>
  {label}
</button>

);
