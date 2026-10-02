import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import emptymutual from "../../../assets/emptymutual.svg";
import { getApiWithToken, postApiWithToken } from "../../../api/api";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage, isSell, laravelUrl, nodeUrl, orderTypeLabel, orderTypeTone, withLiveOrderStatus } from "../../../utils/nodeApi";
import { toastError, toastSuccess } from "../../../utils/notifyCustom";
import ApprovedOrders from "./ApprovedOrders";

/**
 * Audit #49 — one state model for an order, whichever word the row carries: the platform's
 * (pending / paid / completed / rejected / cancelled, kept in step by the #48 sync) or BSE's
 * own (ALLOTTED, REJECTED…) when the live overlay has newer news.
 */
export const orderState = (status) => {
  const s = String(status || "").toLowerCase();
  if (/allot|complet|success|settled/.test(s)) return { label: "Completed", tone: "text-green-600 dark:text-emerald-400", final: true };
  if (/reject|fail/.test(s)) return { label: "Rejected", tone: "text-red-600 dark:text-red-400", final: true };
  if (/cancel/.test(s)) return { label: "Cancelled", tone: "text-slate-500 dark:text-[var(--text-secondary)]", final: true };
  if (s === "paid") return { label: "Paid", tone: "text-yellow-600 dark:text-amber-400", final: false };
  return { label: "Pending", tone: "text-yellow-600 dark:text-amber-400", final: false };
};

/**
 * QA 3.4 — this table showed every order as "Pending" forever.
 *
 * The rows come from the Laravel table, where BseOrderController writes `status: 'pending'`
 * at placement and only the payment callback ever writes again — so an order BSE allotted
 * or rejected still reads pending here. There is no BSE→DB sync job, and adding one would
 * mean a second copy of the truth to keep correct.
 *
 * So the stored rows are overlaid with BSE's own order history instead, under the SAME
 * react-query key the MF order-history page uses: if the investor has already been there
 * the statuses come out of cache and cost nothing.
 */
const MutualFundOrder = () => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  const queryClient = useQueryClient();
  const { data: liveOrders = [] } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc,
  });

  // Re-read after a cancel or a "Place now", so the table shows what Laravel now holds.
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const url = laravelUrl(import.meta.env.VITE_GET_FUNDLIST);
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
  }, [reloadKey]);

  // BSE unreachable leaves `liveOrders` empty, and then the stored status stands rather
  // than every row blanking out.
  const rows = withLiveOrderStatus(funds, liveOrders);

  // Audit #49 — a lumpsum purchase BSE has not settled can be cancelled. The server checks it
  // is this investor's, a purchase and not final, then BSE decides; a cancel it accepts is
  // recorded as Cancelled (and the investor notified) by the server, not by this page.
  const [cancelling, setCancelling] = useState(null);
  const cancelOrder = async (fund) => {
    if (!window.confirm(`Cancel this ₹${Number(fund.inv_amo || 0).toLocaleString("en-IN")} order? BSE decides whether it can still be cancelled.`)) return;
    setCancelling(fund.bse_order_id);
    try {
      const res = await postApiWithToken(nodeUrl("/cancelPurchaseOrder"), { data: { id: fund.bse_order_id } }, { silent: true, throwOnError: true });
      if (res?.status !== "success") throw new Error(res?.message || "BSE did not cancel the order.");
      toastSuccess("Order cancelled.");
      setReloadKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["mfOrderHistory"] });
    } catch (e) {
      toastError(apiErrorMessage(e, "BSE did not cancel the order."));
    } finally {
      setCancelling(null);
    }
  };
  const cancellable = (fund) => String(fund.order_type || "").toLowerCase() === "purchase" && !orderState(fund.status).final;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[var(--card-bg)] min-h-[400px] rounded-xl shadow-sm p-6 flex items-center justify-center text-gray-400">
        Loading orders…
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[400px] rounded-xl shadow-sm p-6 dark:bg-[var(--card-bg)]">
      <ApprovedOrders onPlaced={() => setReloadKey((k) => k + 1)} />
      {rows.length === 0 ? (
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
                {/* QA 3.7 — there was no Type column and the amount column said "Invested"
                    on every row, so a redemption read as money going IN. A sell shown as a
                    buy is the one mistake this table must not make. */}
                {["Fund Name", "Type", "Amount (₹)", "Returns (%)", "Order Date", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium text-left text-gray-700 dark:text-[var(--text-secondary)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((fund, idx) => (
                <tr key={idx} className="border-t transition hover:bg-gray-50 dark:bg-[var(--white-5)] dark:border-[var(--border-color)] dark:hover:bg-[var(--white-5)]">
                  <td className="px-4 py-2 font-medium whitespace-nowrap text-blue-950 dark:text-[var(--text-primary)]">
                    {fund.scheme_name || "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${orderTypeTone(fund.order_type)}`}>
                      {orderTypeLabel(fund.order_type)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                    {isSell(fund.order_type) ? "−" : ""}₹{Number(fund.inv_amo || 0).toLocaleString()}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${Number(fund.ret_percentage) >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {fund.ret_percentage != null ? `${fund.ret_percentage}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                    {fund.created_at ? new Date(fund.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${orderState(fund.status).tone}`}>
                    {orderState(fund.status).label}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {cancellable(fund) ? (
                      <button
                        type="button"
                        onClick={() => cancelOrder(fund)}
                        disabled={cancelling === fund.bse_order_id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        {cancelling === fund.bse_order_id ? "Cancelling…" : "Cancel"}
                      </button>
                    ) : null}
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
