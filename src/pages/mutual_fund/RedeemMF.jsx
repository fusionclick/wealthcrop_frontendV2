import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeUrl, validateInvestorReady, laravelUrl, holdingMatchesScheme, fundBuyPath, unitsFor, navLooksPlausible } from "../../utils/nodeApi";
import SxpSchedule, { useSxpSchedule } from "../../components/mutual_fund/SxpSchedule";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";
import { buildSxpIntent, sxpIntentError, retireReplacedPlan } from "../../utils/sxp";
import { matchLots, isoDay } from "../../utils/taxlots";
import { lockinSplit } from "../../utils/lockin";
import { fmtDate } from "../../utils/schemeName";

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

export function RedeemForm({ holding, locked, onCancel, onSuccess, replaceRegNo, prefillAmount }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const [redeemAmount, setRedeemAmount] = useState(prefillAmount ? String(prefillAmount) : "");
  const [redeemAll, setRedeemAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Ticket 17: an SWP is this same withdrawal, repeated. The holding and its folio are
  // already picked above, so the only thing the investor adds is a schedule.
  const sched = useSxpSchedule("swp", holding);
  // Ticket 22 / QA 3.7: the notices are gated on BOTH now, but only when they actually
  // arrived.
  //
  // useDisclaimers fails closed — a failed fetch sets `required` to [], so `ready` can
  // never become true. Gating a one-off redemption on `ready` outright would therefore
  // let a /disclaimers outage lock an investor out of their own money, which is why the
  // exit used to be ungated entirely. But that also meant the boxes could simply be
  // ignored on the normal path, which is what QA hit.
  //
  // So block on the tick only when there IS something to tick: a non-empty `required`
  // means the list loaded and the investor has to agree. `[]` (fetch failed, or nothing
  // is required) and `null` (still loading, or the request hung) never block the exit.
  const disc = useDisclaimers();
  const mustAck = Array.isArray(disc.required) && disc.required.length > 0 && !disc.ready;

  // QA 3.7 — "if I am redeeming 1000 Rs there is no mention how many units".
  //
  // The real figure is set by the NAV on the execution date, which nobody knows yet, so
  // this is an estimate against the latest NAV on the holding and is labelled as one.
  // Printing it as a promise would be worse than printing nothing.
  const navNow =
    Number(holding?.nav) > 0
      ? Number(holding.nav)
      : Number(holding?.units) > 0 && Number(holding?.current_value) > 0
      ? Number(holding.current_value) / Number(holding.units)
      : null;
  // A NAV five times away from the average cost is a stale or wrong-scheme figure; the
  // estimate is dropped rather than shown wrong.
  const navUsable = navNow !== null && navLooksPlausible(holding?.inv_amo, holding?.units, navNow);
  const estUnits = redeemAll ? Number(holding?.units) || null : unitsFor(redeemAmount, navUsable ? navNow : null);

  // QA 3.8 — the lock-in was displayed on the fund page and enforced nowhere, so a three-year
  // ELSS bought last month took the order and let BSE reject it.
  //
  // Both halves are read here rather than passed in, because this form is ALSO the sell modal
  // on FundDetails: guarding the shared form covers both entry points at once. The scheme key
  // is the one FundDetails already caches, so that path usually refetches nothing.
  const schemeIsin = holding?.scheme_isin || holding?.isin || "";
  const schemeCode = holding?.scheme_bse_code || holding?.scheme_code || "";
  const { data: lockIn = null } = useQuery({
    queryKey: ["FUND_FULL_DETAILS", schemeIsin, schemeCode],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), { isin: schemeIsin, scheme_code: schemeCode }),
    select: (res) => res?.data?.scheme_info?.lockIn || null,
    enabled: Boolean(schemeIsin || schemeCode),
    staleTime: 1000 * 60 * 2,
  });

  // A BSE holding carries no purchase date, so the lots have to be rebuilt from the order
  // history — and only when there is a lock-in to measure them against, which on this host is
  // the rare case.
  const ucc = investorData?.kyc?.ucc_code;
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc && Boolean(lockIn),
  });

  const lots = useMemo(() => {
    if (!lockIn || !orders.length) return [];
    // FIFO openLots, not raw purchases: lots an earlier redemption already sold are gone, and
    // counting them again would report units as locked that the investor no longer owns.
    return matchLots(orders, { method: "fifo" }).openLots.filter(
      (l) =>
        holdingMatchesScheme(holding, { code: l.scheme_bse_code, schemeBse: l.scheme_bse_code }) &&
        // ponytail: a lot with no folio is counted against this one. Two folios in the same
        // scheme would then over-count the free units — i.e. under-block, the safe direction.
        (!l.folio || !holding?.folio || String(l.folio) === String(holding.folio))
    );
  }, [orders, lockIn, holding]);

  const lock = useMemo(() => lockinSplit({ lockIn, lots }), [lockIn, lots]);
  const u4 = (n) => Number(Number(n).toFixed(4));
  const lockLine =
    lock.status === "checked" && lock.lockedUnits > 0
      ? `${u4(lock.lockedUnits)} of your ${u4(lock.lockedUnits + lock.freeUnits)} units are locked in` +
        (lock.nextUnlock ? ` until ${fmtDate(isoDay(lock.nextUnlock))}` : "") +
        (lock.freeUnits > 0 ? `. You can redeem up to ${u4(lock.freeUnits)} units today.` : ".")
      : null;

  // Only a positive, KNOWN lock-in measured against real lots may refuse. "unknown" (no
  // lock-in data — the normal answer on this host) and "unchecked" (a real lock-in but no
  // order history to check it against) both fall through to BSE, which rejects a locked
  // redemption itself. This app must not be the thing that traps someone's money on
  // incomplete local data.
  //
  // The SWP is deliberately left alone: its installments sell units on future dates that this
  // holding's lots may well be free by, so refusing the schedule today would be guesswork.
  const refusal =
    sched.on || lock.status !== "checked" || lock.lockedUnits <= 0
      ? null
      : redeemAll
      ? `${lockLine} "Redeem all units" is not possible until then.`
      : // No usable NAV means no unit estimate, so there is nothing to compare the amount
        // against — that is a missing check, not a licence to block.
        estUnits > 0 && estUnits > lock.freeUnits + 1e-6
        ? lockLine
        : null;

  const lockNotice =
    loadingOrders || sched.on
      ? null
      : refusal ||
        lockLine ||
        (lock.status === "unchecked"
          ? `This fund has a ${lockIn?.label} lock-in, but your order history could not be read, so we could not check which of your units are still locked. BSE will reject the order if they are.`
          : null);

  const handleRedeem = async () => {
    if (refusal) {
      toastError(refusal);
      return;
    }
    setSubmitting(true);
    const result = sched.on
      ? await registerSwp({ investorData, holding, amount: redeemAmount, sched, acknowledged: disc.acked, queryClient })
      : await submitRedeemOrder({ investorData, holding, redeemAll, redeemAmount, acknowledged: disc.acked, queryClient });
    setSubmitting(false);
    if (!result.ok) {
      toastError(result.message);
      return;
    }

    // Arrived here from "Change SWP": the replacement is live, so retire the old one.
    if (sched.on && replaceRegNo) {
      const problem = await retireReplacedPlan({
        type: "swp",
        regNo: replaceRegNo,
        cancelXsp: (regNo) =>
          postApiWithToken(nodeUrl(import.meta.env.VITE_CANCEL_XSP || "/cancelXsp"), {
            data: { reg_no: regNo, reason: "" },
          }),
      });
      if (problem) {
        toastError(problem);
        onSuccess?.();
        return;
      }
    }

    toastSuccess(
      sched.on
        ? replaceRegNo
          ? "SWP changed. The old plan has been cancelled."
          : "SWP registered. You can stop it any time from Manage SWP."
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
          {estUnits ? (
            <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mt-1">
              ≈ {estUnits} units at today's NAV of ₹{navNow.toLocaleString("en-IN", { maximumFractionDigits: 4 })}. The
              exact units are set by the NAV on the day the order executes.
            </p>
          ) : null}
        </div>
      )}

      {redeemAll && estUnits ? (
        <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
          All {estUnits} units in this folio will be redeemed.
        </p>
      ) : null}

      {/* QA 3.8 — said before the button is pressed, not only on refusal. */}
      {lockNotice ? <p className="text-xs text-amber-700 dark:text-amber-400">{lockNotice}</p> : null}

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
          disabled={submitting || (locked && !holding) || !sched.ready || mustAck || Boolean(refusal)}
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
                replaceRegNo={pre.replaceRegNo}
                prefillAmount={pre.prefillAmount}
                onCancel={() => navigate(-1)}
                onSuccess={() => navigate(pre.replaceRegNo ? "/mutual_fund/manage-swp" : "/user/order/mutual-funds")}
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
