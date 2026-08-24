import { FaLandmark, FaCoins, FaChartLine, FaChartPie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import { useState } from "react";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath } from "../../utils/nodeApi";
import AmcMark from "../../components/AmcMark";
import { navLabel, navDate, useNavMap } from "../../utils/navSocket";

const PAGE_SIZE = 20;
const collections = [
  { name: "Gold Funds", slug: "gold_funds", icon: <FaCoins size={28} className="text-amber-500" /> },
  { name: "Large Cap", slug: "large_cap", icon: <FaChartPie size={28} className="text-indigo-500" /> },
  { name: "Mid Cap", slug: "mid_cap", icon: <FaChartLine size={28} className="text-cyan-500" /> },
  { name: "Small Cap", slug: "small_cap", icon: <FaChartPie size={28} className="text-pink-500" /> },
  { name: "High Return", slug: "high_return", icon: <FaChartLine size={28} className="text-emerald-500" /> },
  { name: "5 Star Funds", slug: "5_star_funds", icon: <FaLandmark size={28} className="text-sky-500" /> },
];

const ExploreMF = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const navs = useNavMap();
  const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["FUNDS", query, page],
    queryFn: () =>
      postApi(url, {
        start: page * PAGE_SIZE,
        length: PAGE_SIZE,
        search: query,
      }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  const funds = data?.data?.lists || [];
  const total = Number(data?.data?.total ?? data?.data?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  return (
    <div className="w-full py-6 px-5 md:px-10 lg:px-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">All Mutual Funds</h2>
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
            {total ? `${total.toLocaleString()} funds with live NAV` : "Loading catalogue…"}
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex gap-2 w-full md:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ISIN or scheme code"
            className="flex-1 md:w-80 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
          />
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium">
            Search
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold mb-3">Collections</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 mb-8">
        {collections.map((item) => (
            <button
              key={item.slug}
              onClick={() => navigate(`/mutual_fund/collections/${item.slug}`)}
              className="rounded-2xl p-4 flex flex-col items-center gap-2 border bg-slate-50 border-transparent hover:bg-white hover:shadow-sm hover:border-slate-200 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)] transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">{item.icon}</div>
              <p className="text-sm font-medium text-center leading-tight">{item.name}</p>
            </button>
        ))}
      </div>

      {isLoading ? (
        FundListSkeleton()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {funds.map((fund) => (
            <button
              key={`${fund.scheme_isin || fund.scheme_isin}-${fund.scheme_bse_code || fund.scheme_bse_code}`}
              onClick={() =>
                navigate(fundPath(fund.scheme_isin || fund.scheme_isin, fund.scheme_bse_code || fund.scheme_bse_code))
              }
              className="text-left rounded-2xl p-4 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-slate-300 transition"
            >
              <AmcMark name={fund.name} />
              <p className="text-sm font-semibold mt-3 line-clamp-2 min-h-10 text-slate-900 dark:text-[var(--text-primary)]">
                {fund.name || "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{fund.subType || fund.category || "Mutual Fund"}</p>
              <div className="flex justify-between items-center mt-4 text-sm">
                <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
                  {navLabel(fund, navs)}
                </span>
                <span className="text-xs text-slate-500">
                  {fund.minLumpsum ? `Min ₹${fund.minLumpsum}` : navDate(fund, navs) || ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !funds.length && (
        <p className="text-center text-gray-500 py-10">No funds matched this collection.</p>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            disabled={page + 1 >= pageCount || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreMF;
