import { FaLandmark, FaCoins, FaChartLine, FaChartPie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import { useState } from "react";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath } from "../../utils/nodeApi";

const PAGE_SIZE = 20;
const collections = [
  { name: "Gold Funds", link: "/mutual_fund/collections/gold_funds", icon: <FaCoins size={32} className="text-yellow-500" /> },
  { name: "Large Cap", link: "/mutual_fund/collections/large_cap", icon: <FaChartPie size={32} className="text-indigo-600" /> },
  { name: "Mid Cap", link: "/mutual_fund/collections/mid_cap", icon: <FaChartLine size={32} className="text-cyan-600" /> },
  { name: "Small Cap", link: "/mutual_fund/collections/small_cap", icon: <FaChartPie size={32} className="text-pink-600" /> },
  { name: "High Return", link: "/mutual_fund/collections/high_return", icon: <FaChartLine size={32} className="text-green-600" /> },
  { name: "5 Star Funds", link: "/mutual_fund/collections/5_star_funds", icon: <FaLandmark size={32} className="text-blue-500" /> },
];

const ExploreMF = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["FUNDS", query, page],
    queryFn: () => postApi(url, { start: page * PAGE_SIZE, length: PAGE_SIZE, search: query }),
    placeholderData: (prev) => prev,
  });

  const funds = data?.data?.lists || [];
  const total = Number(data?.data?.total ?? data?.data?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const showFundPage = (isin, code) => {
    if (!isin || !code) return;
    navigate(fundPath(isin, code));
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  return (
    <div className="w-full py-6 px-5 md:px-10 lg:px-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">All Mutual Funds</h2>
          <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">
            {total ? `${total.toLocaleString()} schemes` : "Live BSE StarMF demo catalogue"}
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex gap-2 w-full md:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ISIN or scheme code"
            className="flex-1 md:w-80 border rounded-lg px-3 py-2 text-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
          />
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
            Search
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold mb-3">Collections</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 mb-8">
        {collections.map((item) => (
          <button
            key={item.link}
            onClick={() => navigate(item.link)}
            className="rounded-xl p-4 bg-gray-50 dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] hover:bg-gray-100 transition flex flex-col items-center"
          >
            <div className="w-12 h-12 flex items-center justify-center">{item.icon}</div>
            <p className="text-sm font-medium text-center mt-2">{item.name}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        FundListSkeleton()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {funds.map((fund) => (
            <button
              key={`${fund.scheme_isin}-${fund.scheme_bse_code}`}
              onClick={() => showFundPage(fund.scheme_isin, fund.scheme_bse_code)}
              className="text-left rounded-xl p-4 bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-[var(--border-color)] hover:shadow transition"
            >
              <div className="h-10 w-10 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold mb-3">
                {fund.logoText || "F"}
              </div>
              <p className="text-sm font-medium min-h-10">{fund.name || "—"}</p>
              <p className="text-xs text-gray-500 mt-1">{fund.subType || fund.category || "Mutual Fund"}</p>
              <div className="flex justify-between mt-4 text-sm">
                <span className="text-gray-700 dark:text-[var(--text-primary)]">
                  {fund.nav != null ? `NAV ₹${Number(fund.nav).toFixed(2)}` : "NAV —"}
                </span>
                <span className="text-gray-500">
                  {fund.minLumpsum ? `Min ₹${fund.minLumpsum}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !funds.length && (
        <p className="text-center text-gray-500 py-10">No funds matched this search.</p>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            disabled={page + 1 >= pageCount || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreMF;
