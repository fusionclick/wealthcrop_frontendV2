import { useParams, Link } from "react-router-dom";
import FundCard from "../../components/FundCard";
import Chart from "../../components/Chart";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getApiWithToken } from "../../api/api";

const Skeleton = ({ className }) => (
  <div
    className={`
      animate-pulse
      bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300
      dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
      bg-[length:200%_100%]
      rounded
      ${className}
    `}
  />
);

export default function BasketDetails() {
  const { id } = useParams();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBasket = async () => {
      const url = `${import.meta.env.VITE_URL}/baskets/${id}`;
      setLoading(true);

      try {
        const res = await getApiWithToken(url);
        console.log("Basket details", res?.data);
        setDetails(res?.data?.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBasket();
  }, [id]);

  /*  SAFE GUARD (prevents crash) */
  if (loading || !details) {
    return (
      <div className="min-h-screen py-6 bg-[#f3f7fb] dark:bg-[var(--app-bg)]">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Header Skeleton */}
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />

          {/* NAV */}
          <Skeleton className="h-40 w-full rounded-xl" />

          {/* METRICS */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mx-auto mb-2" />
                <Skeleton className="h-5 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* PIE */}
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />

          {/* LIST */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}

          {/* CTA */}
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 bg-[#f3f7fb] dark:bg-[var(--app-bg)]">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto mb-4">
        <Link
          to="/baskets"
          className="
            flex items-center font-medium text-sm
            text-white bg-blue-500 hover:bg-blue-600
            rounded-lg px-4 py-2 transition
            shadow-lg hover:shadow-xl
          "
        >
          <FaArrowLeft className="mr-2" /> Back to Baskets
        </Link>

        <h1 className="text-2xl font-bold mt-2 text-slate-800 dark:text-[var(--text-primary)]">
          {details.name}
        </h1>

        <p className="text-sm mt-1 text-gray-600 dark:text-[var(--text-secondary)]">
          Expert curated mutual fund basket with auto diversification.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-5">
        {/* NAV PERFORMANCE */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-[var(--text-primary)]">
              NAV Performance
            </h2>

            <span className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              1Y Trend
            </span>
          </div>

          <div className="h-40">
            <Chart type="line" data={details.navHistory} />
          </div>
        </div>

        {/* METRICS */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
          <h2 className="font-semibold text-[15px] mb-3 text-slate-800 dark:text-[var(--text-primary)]">
            Key Metrics
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              ["Sharpe Ratio", details.metrics.sharpe],
              ["Expense Ratio", `${details.metrics.expenseRatio}%`],
              ["Std Deviation", details.metrics.stdDev],
            ].map(([label, value]) => (
              <div
                key={label}
                className="
                  p-2 rounded-lg
                  bg-[#f9fbff] border border-[#e5ecf3]
                  dark:bg-[var(--white-5)]
                  dark:border-[var(--border-color)]
                "
              >
                <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  {label}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ALLOCATION */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
          <h2 className="font-semibold text-[15px] mb-2 text-slate-800 dark:text-[var(--text-primary)]">
            Asset Allocation
          </h2>

          <div className="w-48 mx-auto">
            <Chart
              type="pie"
              data={[
                details.allocation.Equity ?? 0,
                details.allocation.Debt ?? 0,
                details.allocation.Commodity ?? 0,
              ]}
            />
          </div>

          <div className="flex justify-center gap-4 text-xs mt-3">
            <span>Equity: {details.allocation.Equity ?? 0}%</span>
            <span>Debt: {details.allocation.Debt ?? 0}%</span>
            <span>Commodity: {details.allocation.Commodity ?? 0}%</span>
          </div>
        </div>

        {/* FUNDS */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4 dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
          <h2 className="font-semibold text-[15px] mb-3 text-slate-800 dark:text-[var(--text-primary)]">
            Funds in This Basket
          </h2>

          {details.funds.map((cat, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <h3 className="font-medium text-sm">{cat.category}</h3>
              </div>

              <div className="bg-[#f9fbff] border border-[#e5ecf3] rounded-xl p-3 space-y-2 
              dark:bg-[var(--white-5)]
              dark:border-[var(--border-color)]">
                {cat.list.map((fund, index) => (
                  <FundCard key={index} fund={fund} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to={`/invest/${id}`}>
          <button className="w-full py-3 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition text-lg">
            Invest Now
          </button>
        </Link>
      </div>
    </div>
  );
}
