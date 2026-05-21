import { useParams, Link } from "react-router-dom";
import Chart from "../../components/Chart";

export default function Performance({ basketDetails }) {
  const { id } = useParams();
  const details = basketDetails[id];

  return (
    <div className="min-h-screen bg-[#f3f7fb] p-6">

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4">
        <Link to={`/basket/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Basket
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          Performance Analysis
        </h1>

        <p className="text-gray-600 text-sm mt-1">
          Deep insights into long-term performance & risk metrics.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-5">

        {/* NAV Trend */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 text-[15px] mb-2">NAV Trend</h2>
          <div className="h-36">
            <Chart type="line" data={details.navHistory} />
          </div>
        </div>

        {/* Rolling Returns */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 text-[15px] mb-3">Rolling Returns</h2>

          <div className="grid grid-cols-3 gap-4 text-center">

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">1-Year Rolling</p>
              <p className="text-lg font-semibold text-green-600">
                {details.rolling?.rolling1Y || "9.8"}%
              </p>
            </div>

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">3-Year Rolling</p>
              <p className="text-lg font-semibold text-green-600">
                {details.rolling?.rolling3Y || "10.4"}%
              </p>
            </div>

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">5-Year Rolling</p>
              <p className="text-lg font-semibold text-green-600">
                {details.rolling?.rolling5Y || "11.1"}%
              </p>
            </div>

          </div>
        </div>

        {/* RISK METRICS */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 text-[15px] mb-3">Risk Metrics</h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">Sharpe Ratio</p>
              <p className="text-lg font-semibold text-slate-900">
                {details.metrics.sharpe}
              </p>
            </div>

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">Standard Deviation</p>
              <p className="text-lg font-semibold text-slate-900">
                {details.metrics.stdDev}
              </p>
            </div>

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">Max Drawdown</p>
              <p className="text-lg font-semibold text-red-500">
                {details.metrics.maxDrawdown || "-12.4%"}
              </p>
            </div>

            <div className="bg-[#f9fbff] border border-[#e0e7ef] p-3 rounded-lg">
              <p className="text-xs text-gray-500">Beta</p>
              <p className="text-lg font-semibold text-slate-900">
                {details.metrics.beta || "0.92"}
              </p>
            </div>

          </div>
        </div>

        {/* CATEGORY RETURN COMPARISON */}
        <div className="bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 text-[15px] mb-3">Category Comparison</h2>

          <p className="text-sm text-gray-600">
            Basket vs Category Average (illustration)
          </p>

          <div className="h-36 mt-3">
            <Chart
              type="line"
              data={[8, 9.5, 10.2, 11.5, 12.4]} // dummy category chart
            />
          </div>
        </div>

      </div>
    </div>
  );
}
