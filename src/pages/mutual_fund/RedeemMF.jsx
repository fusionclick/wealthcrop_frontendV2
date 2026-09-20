import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeUrl, validateInvestorReady, laravelUrl, holdingMatchesScheme, fundBuyPath } from "../../utils/nodeApi";
import SxpSchedule, { useSxpSchedule } from "../../components/mutual_fund/SxpSchedule";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";
import { buildSxpIntent, sxpIntentError } from "../../utils/sxp";

export async function submitRedeemOrder({ investorData, holding, redeemAll, redeemAmount, acknowledged = [], queryClient }) {
  const err = validateInvestorReady(investorData);
  if (err) return { ok: false, message: err };
  if (!holding) return { ok: false, message: "Please select a fund to redeem." };
  if (!holding.folio) return { ok: false, message: "Folio is missing on this holding. Cannot redeem." };
  if (!redeemAll && (!redeemAmount || Number(redeemAmount) <= 0)) {
    return { ok: false, message: "Please enter a valid redemption amount." };
  }
  const invested = Number(holding.inv_amo || 0);
  if (!redeemAll && invested && Number(redeemAmount) > invested) {
    return { ok: false, message: "Redemption amount cannot exceed invested value." };
  }

  const ucc = investorData?.kyc?.ucc_code;
  const memRef = String(Math.floor(100000 + Math.random() * 900000));
  const payload = {
    data: {
      orders: [
        {
          type: "r",
          mem_ord_ref_id: memRef,
          investor: { ucc },
          member: "91010",
          scheme: holding.scheme_bse_code || holding.scheme_code || "",
          amount: redeemAll ? 0 : Number(redeemAmount),
          cur: "INR",
          is_units: false,
          all_units: redeemAll,
          min_redeem_flag: false,
          folio: holding.folio,
          is_fresh: false,
          phys_or_demat: "d",
          holder: [{ holder_rank: "1", email: investorData?.email || "" }],
          kyc_passed: true,
          dpc: true,
          email: investorData?.email || "",
        },
      ],
      acknowledged,
    },
  };

  try {
    const url = nodeUrl(import.meta.env.VITE_FUND_ORDER_PLACE || "/purchaseNewOrder");
    const res = await postApiWithToken(url, payload);
    if (res?.status === 200 || res?.status === true || res?.status === "success") {
      const orderId = res.data?.items?.[0]?.id;
      const memberRefId = res.data?.items?.[0]?.mem_ord_ref_id || memRef;
      if (orderId) {
        await postApiWithToken(laravelUrl(import.meta.env.VITE_SEND_FUND_ORDER_DETAILS), {
          bse_order_id: orderId,
          mem_ord_ref_id: memberRefId,
          scheme_name: holding.scheme_name,
          scheme_bse_code: holding.scheme_bse_code,
          inv_amo: redeemAll ? holding.inv_amo : Number(redeemAmount),
          folio: holding.folio,
          order_type: "redeem",
          scheme_category: holding.scheme_category,
        });
      }
      queryClient?.invalidateQueries({ queryKey: ["bsePortfolio"] });
      queryClient?.invalidateQueries({ queryKey: ["investedFunds"] });
      return { ok: true };
    }
    return { ok: false, message: res?.message || res?.error || "Redemption failed. Please try again." };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.message || err?.message || "Redemption failed. Please try again." };
  }
}

/**
 * Ticket 17 — the same withdrawal, registered as a schedule instead of placed once.
 *
 * Intent only: BSE's sxp_register payload is assembled server-side, which is also where the
 * folio's units are checked against BSE rather than against whatever this page last read.
 */
export async function registerSwp({ investorData, holding, amount, sched, acknowledged = [], queryClient }) {
  const err = validateInvestorReady(investorData);
  if (err) return { ok: false, message: err };
  const bad = sxpIntentError({ type: "swp", source: holding, amount, schedule: sched });
  if (bad) return { ok: false, message: bad };

  try {
    const res = await postApiWithToken(
      nodeUrl(import.meta.env.VITE_XSP_REGISTER || "/xspRegister"),
      buildSxpIntent({ type: "swp", source: holding, amount, schedule: sched, acknowledged })
    );
    if (res?.status === 200 || res?.status === true || res?.status === "success") {
      queryClient?.invalidateQueries({ queryKey: ["bsePortfolio"] });
      return { ok: true };
    }
    return { ok: false, message: res?.message || res?.error || "Could not register the SWP." };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.message || e?.message || "Could not register the SWP." };
  }
}

export function RedeemForm({ holding, locked, onCancel, onSuccess }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemAll, setRedeemAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Ticket 17: an SWP is this same withdrawal, repeated. The holding and its folio are
  // already picked above, so the only thing the investor adds is a schedule.
  const sched = useSxpSchedule("swp", holding);
  // Ticket 22: the notices are shown on both, but only the SWP is gated on them.
  //
  // useDisclaimers fails closed — if /disclaimers cannot be reached nothing can be ticked
  // and `ready` never becomes true. On a scheduled plan that is the right answer; on a
  // one-off redemption it would mean an outage locks the investor out of their own money,
  // so the exit is never blocked. The server draws the same line.
  const disc = useDisclaimers();

  const handleRedeem = async () => {
    setSubmitting(true);
    const result = sched.on
      ? await registerSwp({ investorData, holding, amount: redeemAmount, sched, acknowledged: disc.acked, queryClient })
      : await submitRedeemOrder({ investorData, holding, redeemAll, redeemAmount, acknowledged: disc.acked, queryClient });
    setSubmitting(false);
    if (!result.ok) {
      toastError(result.message);
      return;
    }
    toastSuccess(
      sched.on
        ? "SWP registered. You can stop it any time from Manage SWP."
        : "Redemption placed. You can invest more in this fund any time."
    );
    onSuccess?.();
  };

  if (!holding) return null;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-gray-200 dark:border-[var(--border-color)] bg-gray-50 dark:bg-[var(--white-5)]">
        <p className="font-medium text-gray-800 dark:text-[var(--text-primary)] text-sm">{holding.scheme_name || "—"}</p>
        <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mt-0.5">
          Invested: ₹{Number(holding.inv_amo || 0).toLocaleString("en-IN")}
          {holding.folio ? ` · Folio ${holding.folio}` : " · Folio missing"}
          {holding.units ? ` · ${holding.units} units` : ""}
        </p>
      </div>

      {/* "All units" and a schedule contradict each other — the first installment would
          empty the folio and leave the rest of the schedule with nothing to sell. */}
      {!sched.on && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={redeemAll}
            onChange={(e) => setRedeemAll(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">Redeem all units</span>
        </label>
      )}
      {(sched.on || !redeemAll) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
            {sched.on ? "Amount per installment (₹)" : "Redemption Amount (₹)"}
          </label>
          <input
            type="number"
            min="1"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
          />
        </div>
      )}

      <SxpSchedule {...sched} amount={redeemAmount} />

      <OrderDisclaimers {...disc} />

      <div className="flex gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleRedeem}
          disabled={submitting || (locked && !holding) || !sched.ready || (sched.on && !disc.ready)}
          className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
        >
          {submitting ? "Processing…" : sched.on ? "Start SWP" : "Redeem"}
        </button>
      </div>

      {/* Ek mutual fund holding par sirf do raste hain — aur nikal lo, ya aur daal do. */}
      <button
        type="button"
        onClick={() =>
          navigate(fundBuyPath(holding.scheme_isin, holding.scheme_bse_code || holding.scheme_code))
        }
        className="w-full py-3 rounded-lg border border-emerald-600 text-emerald-700 font-medium dark:text-emerald-400"
      >
        Invest more in this fund
      </button>
    </div>
  );
}

const RedeemMF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;
  const pre = location.state || {};

  const [selectedHolding, setSelectedHolding] = useState(null);

  const { data: portfolio, isLoading: loadingHoldings } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => ({
      list: Array.isArray(res?.data?.holdings) ? res.data.holdings : [],
      pending: Number(res?.data?.pending || 0),
    }),
    enabled: !!ucc,
  });
  const holdings = portfolio?.list || [];
  // Orders placed but not yet paid — they are not holdings, but "invest first" is a lie.
  const pendingOrders = portfolio?.pending || 0;

  useEffect(() => {
    if (!holdings.length) return;
    const match = holdings.find((h) =>
      holdingMatchesScheme(h, { isin: pre.isin, code: pre.code, schemeBse: pre.scheme_bse_code })
    );
    if (match) setSelectedHolding(match);
  }, [holdings, pre.isin, pre.code, pre.scheme_bse_code]);

  if (loadingHoldings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex items-center justify-center text-gray-400">
        Loading holdings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center items-start p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6 dark:border dark:border-[var(--border-color)]">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Redeem Mutual Fund</h1>
          <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">Select a holding with a folio to redeem.</p>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-[var(--text-secondary)]">
            {pendingOrders > 0 ? (
              <p>
                {pendingOrders === 1 ? "1 order is" : `${pendingOrders} orders are`} awaiting payment.
                Units are allotted only after payment, so there is nothing to redeem yet.
              </p>
            ) : (
              <p>No holdings found. Invest first to redeem.</p>
            )}
            <button
              onClick={() => navigate(pendingOrders > 0 ? "/user/mutual_fund/investments" : "/user/mutual_fund/explore")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              {pendingOrders > 0 ? "View Orders" : "Explore Funds"}
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2">Select Fund</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {holdings.map((h, idx) => (
                  <button
                    key={`${h.scheme_bse_code}-${h.folio}-${idx}`}
                    type="button"
                    onClick={() => setSelectedHolding(h)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedHolding === h ||
                      (selectedHolding &&
                        selectedHolding.folio === h.folio &&
                        selectedHolding.scheme_bse_code === h.scheme_bse_code)
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400"
                        : "border-gray-200 dark:border-[var(--border-color)]"
                    }`}
                  >
                    <p className="font-medium text-gray-800 dark:text-[var(--text-primary)] text-sm">{h.scheme_name || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mt-0.5">
                      Invested: ₹{Number(h.inv_amo || 0).toLocaleString()}
                      {h.folio ? ` · Folio ${h.folio}` : " · Folio missing"}
                      {h.units ? ` · ${h.units} units` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedHolding ? (
              <RedeemForm
                holding={selectedHolding}
                locked
                onCancel={() => navigate(-1)}
                onSuccess={() => navigate("/user/order/mutual-funds")}
              />
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RedeemMF;
