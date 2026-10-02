import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getApiWithToken, postApiWithToken } from "../../../api/api";
import { apiErrorMessage, laravelUrl, nodeUrl } from "../../../utils/nodeApi";
import { approvalRequest } from "../../../utils/approvals";
import { toastError, toastSuccess } from "../../../utils/notifyCustom";
import OrderDisclaimers, { useDisclaimers } from "../../../components/mutual_fund/OrderDisclaimers";

/**
 * Audit #49 — an approved transaction, placed with one click and the details it was held with.
 *
 * Approving never places anything (an order needs the investor, their acknowledgement and every
 * gate). What used to happen next was "go and type it all in again". The approval now keeps the
 * order's details (`intent`), so here the investor ticks the acknowledgement once and presses
 * "Place now": the same order goes through the same server path and gates, and spends exactly
 * this approval (`approval_id`), which then reads "Placed".
 */

const KIND = { purchase: "Lumpsum", sip: "SIP", stp: "STP", switch: "Switch" };
const STATE = {
  pending: "Awaiting approval",
  approved: "Approved — ready to place",
  used: "Placed",
  expired: "Approval lapsed — place it again to ask afresh",
  rejected: "Not approved",
};
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ApprovedOrders({ onPlaced }) {
  const queryClient = useQueryClient();
  const { data: investor } = useSelector((state) => state.investorData);
  const disc = useDisclaimers();
  const [placing, setPlacing] = useState(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["orderApprovals"],
    queryFn: () => getApiWithToken(`${import.meta.env.VITE_URL}/order-approvals`),
    // getApiWithToken hands back the axios response: rows are TWO levels down.
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });
  const ready = rows.filter((r) => r.state === "approved" && r.usable && r.intent);
  const recent = rows.filter((r) => !ready.includes(r)).slice(0, 4);
  if (!rows.length) return null;

  const place = async (approval) => {
    setPlacing(approval.id);
    const { path, body } = approvalRequest(approval, { acknowledged: disc.acked, investor });
    try {
      const res = await postApiWithToken(nodeUrl(path), body, { silent: true, throwOnError: true });
      if (res?.status !== "success") throw new Error(res?.message || "The order was not placed.");
      const item = res?.data?.items?.[0];
      if (item?.id && path === "/purchaseNewOrder") {
        await postApiWithToken(laravelUrl(import.meta.env.VITE_SEND_FUND_ORDER_DETAILS), {
          bse_order_id: item.id,
          mem_ord_ref_id: item.mem_ord_ref_id || body.data.orders[0].mem_ord_ref_id,
          scheme_name: approval.scheme_name || approval.scheme_code,
          scheme_bse_code: approval.kind === "switch" ? approval.intent.dest_scheme : approval.scheme_code,
          inv_amo: Number(approval.intent.amount) || Number(approval.amount),
          folio: approval.intent.folio || null,
          order_type: approval.kind === "switch" ? "switch" : "purchase",
        }, { silent: true });
      }
      toastSuccess(
        approval.kind === "purchase"
          ? "Order placed. Complete the payment from your orders."
          : `${KIND[approval.kind]} placed.`
      );
      queryClient.invalidateQueries({ queryKey: ["orderApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["mfOrderHistory"] });
      onPlaced?.();
    } catch (e) {
      toastError(apiErrorMessage(e, "The order was not placed."));
    } finally {
      setPlacing(null);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-950 dark:text-[var(--text-primary)]">Transactions held for approval</h3>
      {ready.length > 0 && (
        <>
          {ready.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-[var(--text-primary)] truncate">{r.scheme_name || r.scheme_code}</p>
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                  {KIND[r.kind] || r.kind} · {money(r.amount)} · {STATE.approved}
                  {r.expires_at ? ` · until ${new Date(r.expires_at).toLocaleString("en-IN")}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => place(r)}
                disabled={!disc.ready || placing !== null}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {placing === r.id ? "Placing…" : "Place now"}
              </button>
            </div>
          ))}
          {/* One acknowledgement covers the click, the same notices every checkout shows. */}
          <OrderDisclaimers {...disc} schemes={ready} />
        </>
      )}
      {recent.map((r) => (
        <p key={r.id} className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
          {r.scheme_name || r.scheme_code} · {KIND[r.kind] || r.kind} · {money(r.amount)} — {STATE[r.state] || r.state}
        </p>
      ))}
    </section>
  );
}
