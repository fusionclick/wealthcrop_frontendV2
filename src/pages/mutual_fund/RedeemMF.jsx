import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeUrl, validateInvestorReady, laravelUrl, holdingMatchesScheme } from "../../utils/nodeApi";

export async function submitRedeemOrder({ investorData, holding, redeemAll, redeemAmount, queryClient }) {
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
          holder: [{ holder_rank: "1", email: investorData?.email || "", mobnum: investorData?.phone || "" }],
          kyc_passed: true,
          dpc: true,
          email: investorData?.email || "",
          mobnum: investorData?.phone || "",
        },
      ],
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

export function RedeemForm({ holding, locked, onCancel, onSuccess }) {
  const queryClient = useQueryClient();
  const { data: investorData } = useSelector((state) => state.investorData);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemAll, setRedeemAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRedeem = async () => {
    setSubmitting(true);
    const result = await submitRedeemOrder({
      investorData,
      holding,
      redeemAll,
      redeemAmount,
      queryClient,
    });
    setSubmitting(false);
    if (!result.ok) {
      toastError(result.message);
      return;
    }
    toastSuccess("Redemption order placed successfully!");
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

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={redeemAll}
          onChange={(e) => setRedeemAll(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">Redeem all units</span>
      </label>
      {!redeemAll && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
            Redemption Amount (₹)
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
          disabled={submitting || (locked && !holding)}
          className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
        >
          {submitting ? "Processing…" : "Redeem"}
        </button>
      </div>
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

  const { data: holdings = [], isLoading: loadingHoldings } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => (Array.isArray(res?.data?.holdings) ? res.data.holdings : []),
    enabled: !!ucc,
  });

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
            <p>No holdings found. Invest first to redeem.</p>
            <button
              onClick={() => navigate("/user/mutual_fund/explore")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Explore Funds
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
