import React, { useEffect, useState } from "react";
import emptymutual from "../../../assets/emptymutual.svg";
import { getApiWithToken } from "../../../api/api";
import { useNavigate } from "react-router-dom";

const MutualFundOrder = () => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_GET_FUNDLIST}`;
        const res = await getApiWithToken(url);
        const items = res?.data?.data;
        if (Array.isArray(items)) setFunds(items);
      } catch (_) {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[var(--card-bg)] min-h-[400px] rounded-xl shadow-sm p-6 flex items-center justify-center text-gray-400">
        Loading orders…
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[400px] rounded-xl shadow-sm p-6 dark:bg-[var(--card-bg)]">
      {funds.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] text-center px-6 dark:bg-[var(--card-bg)]">
          <img src={emptymutual} alt="No Mutual Funds" className="w-56 md:w-64 lg:w-80 mb-4 object-contain" />
          <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">No Mutual Fund Orders</h2>
          <p className="text-gray-600 text-sm mt-2 dark:text-[var(--text-secondary)]">
            You haven't invested in any mutual funds yet.
            <br />
            Start your SIP journey today and build your wealth.
          </p>
          <button
            onClick={() => navigate("/user/mutual_fund/explore")}
            className="mt-5 px-6 py-2 rounded-lg text-sm font-medium transition bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Explore Mutual Funds
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-blue-950 dark:text-[var(--text-primary)]">
            Your Mutual Fund Orders
          </h2>
          <table className="min-w-full text-sm rounded-lg overflow-hidden border border-gray-200 dark:border-[var(--border-color)]">
            <thead className="bg-gray-100 dark:bg-[var(--white-5)]">
              <tr>
                {["Fund Name", "Invested (₹)", "Returns (%)", "Order Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium text-left text-gray-700 dark:text-[var(--text-secondary)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funds.map((fund, idx) => (
                <tr key={idx} className="border-t transition hover:bg-gray-50 dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]">
                  <td className="px-4 py-2 font-medium whitespace-nowrap text-blue-950 dark:text-[var(--text-primary)]">
                    {fund.scheme_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                    ₹{Number(fund.inv_amo || 0).toLocaleString()}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${Number(fund.ret_percentage) >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {fund.ret_percentage != null ? `${fund.ret_percentage}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                    {fund.created_at ? new Date(fund.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${fund.status === "Completed" || fund.status === "ALLOTTED" ? "text-green-600 dark:text-emerald-400" : "text-yellow-600 dark:text-amber-400"}`}>
                    {fund.status || "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MutualFundOrder;
