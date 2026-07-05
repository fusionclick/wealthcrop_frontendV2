import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, validateInvestorReady, laravelUrl } from "../../utils/nodeApi";

const RedeemMF = () => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);

  const [holdings, setHoldings] = useState([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemAll, setRedeemAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const url = laravelUrl(import.meta.env.VITE_GET_FUNDLIST);
        const res = await getApiWithToken(url);
        const items = res?.data?.data;
        if (Array.isArray(items)) setHoldings(items);
      } catch (_) {
        /* silent */
      } finally {
        setLoadingHoldings(false);
      }
    };
    fetchHoldings();
  }, []);

  const generateOrderRefId = () => String(Math.floor(100000 + Math.random() * 900000));

  const handleRedeem = async () => {
    const err = validateInvestorReady(investorData);
    if (err) {
      toastError(err);
      return;
    }
    if (!selectedHolding) {
      toastError("Please select a fund to redeem.");
      return;
    }
    if (!redeemAll && (!redeemAmount || Number(redeemAmount) <= 0)) {
      toastError("Please enter a valid redemption amount.");
      return;
    }

    setSubmitting(true);
    const payload = {
      data: {
        orders: [
          {
            type: "r",
            mem_ord_ref_id: generateOrderRefId(),
            investor: { ucc: investorData?.kyc?.ucc_code },
            member: "91010",
            scheme: selectedHolding.scheme_bse_code || selectedHolding.scheme_code || "",
            amount: redeemAll ? 0 : Number(redeemAmount),
            cur: "INR",
            is_units: false,
            all_units: redeemAll,
            min_redeem_flag: false,
            folio: selectedHolding.folio || "",
            is_fresh: false,
            phys_or_demat: "d",
            holder: [{ holder_rank: "1", email: investorData?.email || "", mobnum: investorData?.phone || "" }],
            kyc_passed: true,
            depository_acct: {
              depository: "C",
              dp_id: investorData?.kyc?.dp_id || "",
              client_id: investorData?.kyc?.client_id || "",
            },
            dpc: true,
            is_nomination_opted: false,
            nomination_auth_mode: "",
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
        toastSuccess("Redemption order placed successfully!");
        navigate("/user/order/mutual-funds");
      } else {
        toastError(res?.message || "Redemption failed. Please try again.");
      }
    } catch (err) {
      toastError(err?.message || "Redemption failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">Select a fund from your portfolio to redeem.</p>
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
                    key={idx}
                    onClick={() => setSelectedHolding(h)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedHolding === h
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400"
                        : "border-gray-200 dark:border-[var(--border-color)]"
                    }`}
                  >
                    <p className="font-medium text-gray-800 dark:text-[var(--text-primary)] text-sm">{h.scheme_name || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mt-0.5">Invested: ₹{Number(h.inv_amo || 0).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedHolding && (
              <div className="space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Redemption Amount (₹)</label>
                    <input
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={submitting || !selectedHolding}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Processing…" : "Redeem"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RedeemMF;
