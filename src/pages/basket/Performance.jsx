import { useParams, Link } from "react-router-dom";
import Chart from "../../components/Chart";
import { useEffect, useState } from "react";
import { getApiWithToken } from "../../api/api";

export default function Performance() {
  const { id } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const url = `${import.meta.env.VITE_URL}/baskets/${id}`;
    getApiWithToken(url).then((res) => {
      setDetails(res?.data?.data ?? res?.data ?? null);
    }).catch(() => setDetails(null));
  }, [id]);

  if (!details) {
    return <div className="p-10 text-center">Loading performance...</div>;
  }

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
          <Chart data={details.navHistory || []} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {details.metrics && Object.entries(details.metrics).map(([key, val]) => (
            <div key={key} className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">{key}</p>
              <p className="text-lg font-semibold">{val}</p>
            </div>
          ))}
        </div>

        {/* Rolling returns */}
        {details.rolling && (
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold mb-3">Rolling Returns</h2>
            <div className="flex gap-6">
              {Object.entries(details.rolling).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="font-semibold">{v}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
