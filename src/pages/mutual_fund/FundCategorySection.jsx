import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath } from "../../utils/nodeApi";
import AmcMark from "../../components/AmcMark";
import { collectionSearch, collectionSlug } from "../../utils/mfCollections";

const PAGE_SIZE = 20;

const FundCategorySection = () => {
  const params = useParams();
  const categorySlug = params.categorySlug || params.slug || Object.values(params)[0];
  const navigate = useNavigate();
  const category = collectionSlug(categorySlug);
  const search = collectionSearch(categorySlug);
  const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");

  const { data, isLoading } = useQuery({
    queryKey: ["FUNDS", category, search],
    queryFn: () =>
      postApi(url, {
        start: 0,
        length: PAGE_SIZE,
        category,
        search,
      }),
  });

  const funds = data?.data?.lists || [];
  const title = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{funds.length ? `${funds.length} schemes` : "BSE StarMF collection"}</p>

      {isLoading ? (
        <div className="mt-6">
          {FundListSkeleton()}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {funds.map((fund) => (
            <button
              key={`${fund.scheme_isin || fund.scheme_isin}-${fund.scheme_bse_code || fund.scheme_bse_code}`}
              onClick={() =>
                navigate(fundPath(fund.scheme_isin || fund.scheme_isin, fund.scheme_bse_code || fund.scheme_bse_code))
              }
              className="text-left rounded-2xl p-4 bg-white border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <AmcMark name={fund.name} />
              <p className="text-sm font-semibold mt-3 line-clamp-2 min-h-10">{fund.name || "—"}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{fund.subType || fund.category || "Mutual Fund"}</p>
              <p className="text-sm font-medium mt-4">
                {fund.nav != null ? `NAV ₹${Number(fund.nav).toFixed(2)}` : "NAV —"}
              </p>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !funds.length && (
        <p className="text-center text-slate-500 py-16">No funds in this collection yet.</p>
      )}
    </div>
  );
};

export default FundCategorySection;
