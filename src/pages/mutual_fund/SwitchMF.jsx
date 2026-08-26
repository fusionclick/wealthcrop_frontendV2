import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, laravelUrl, validateInvestorReady } from "../../utils/nodeApi";
import Combo, { fieldClass } from "../../components/ui/Combo";

// Folio isi liye label mein hai — ek hi scheme kai folios mein ho sakti hai,
// aur switch hamesha ek folio se nikalta hai.
const holdingLabel = (h) => `${h.scheme_name || "Fund"}${h.folio ? ` · ${h.folio}` : ""}`;

const SwitchMF = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  const [srcText, setSrcText] = useState("");
  const [destText, setDestText] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [switchAll, setSwitchAll] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Same query key as RedeemMF — cache hit, aur in holdings par asli BSE folio hota hai.
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => (Array.isArray(res?.data?.holdings) ? res.data.holdings : []),
    enabled: !!ucc,
  });

  useEffect(() => {
    const t = setTimeout(() => setDestQuery(destText.trim()), 250);
    return () => clearTimeout(t);
  }, [destText]);

  // ponytail: destination BSE ke master se server-side filter hota hai — 28k schemes
  // browser mein nahi aa sakte. Page 50 par capped hai; match na mile to user thora
  // aur type kare. Client-side full list chahiye to backend ka FETCH_MAX barhana parega.
  const { data: destFunds = [] } = useQuery({
    queryKey: ["switchDest", destQuery],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 50,
        search: destQuery,
      }),
    select: (res) => res?.data?.lists || [],
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  const selectedSource = holdings.find((h) => holdingLabel(h) === srcText);
  const selectedDest = destFunds.find((f) => f.name === destText);

  const handleSwitch = async () => {
    const err = validateInvestorReady(investorData);
    if (err) return toastError(err);
    if (!selectedSource) return toastError("Pick a source fund from the list.");
    if (!selectedSource.folio) return toastError("Folio is missing on this holding. Cannot switch.");
    if (!selectedDest) return toastError("Pick a destination fund from the list.");
    const destCode = selectedDest.scheme_bse_code;
    if (destCode === (selectedSource.scheme_bse_code || selectedSource.scheme_code)) {
      return toastError("Source and destination fund cannot be the same.");
    }
    if (!switchAll && (!amount || Number(amount) <= 0)) return toastError("Enter a valid switch amount.");

    setSubmitting(true);
    const memRef = String(Math.floor(100000 + Math.random() * 900000));
    const payload = {
      data: {
        orders: [
          {
            type: "sw",
            mem_ord_ref_id: memRef,
            investor: { ucc },
            member: "91010",
            scheme: selectedSource.scheme_bse_code || selectedSource.scheme_code || "",
            dest_scheme: destCode,
            amount: switchAll ? 0 : Number(amount),
            cur: "INR",
            is_units: false,
            all_units: switchAll,
            min_redeem_flag: false,
            folio: selectedSource.folio,
            dest_folio: "",
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
        // Orders page Laravel se padhta hai — post-back ke bagair switch wahan dikhta hi nahi.
        const orderId = res.data?.items?.[0]?.id;
        if (orderId) {
          await postApiWithToken(laravelUrl(import.meta.env.VITE_SEND_FUND_ORDER_DETAILS), {
            bse_order_id: orderId,
            mem_ord_ref_id: res.data?.items?.[0]?.mem_ord_ref_id || memRef,
            scheme_name: selectedDest.name,
            scheme_bse_code: destCode,
            inv_amo: switchAll ? selectedSource.inv_amo : Number(amount),
            folio: selectedSource.folio,
            order_type: "switch",
            scheme_category: selectedDest.scheme_category || selectedSource.scheme_category,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["bsePortfolio"] });
        queryClient.invalidateQueries({ queryKey: ["investedFunds"] });
        toastSuccess("Switch order placed successfully!");
        navigate("/user/order/mutual-funds");
      } else {
        toastError(res?.message || res?.error || "Switch failed.");
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e?.message || "Switch failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold dark:text-[var(--text-primary)]">Switch Mutual Fund</h1>
          <p className="text-sm text-gray-500 mt-1">Move from one fund to another within your portfolio.</p>
        </div>

        {holdings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No holdings to switch. Invest first.</p>
        ) : (
          <>
            <Combo
              id="switch-source"
              label="From (source fund)"
              value={srcText}
              onChange={setSrcText}
              placeholder="Type to filter, or click for the full list"
              options={holdings.map((h, i) => ({
                key: `${h.scheme_bse_code}-${h.folio}-${i}`,
                label: holdingLabel(h),
                hint: `₹${Number(h.inv_amo || 0).toLocaleString("en-IN")}${h.units ? ` · ${h.units} units` : ""}`,
              }))}
            />

            <Combo
              id="switch-dest"
              label="To (destination fund)"
              value={destText}
              onChange={setDestText}
              placeholder="Type to search, or click for the full list"
              options={destFunds.map((f) => ({
                key: f.scheme_bse_code || f.scheme_isin,
                label: f.name,
                hint: f.scheme_bse_code,
              }))}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={switchAll} onChange={(e) => setSwitchAll(e.target.checked)} />
              <span className="text-sm">Switch all units</span>
            </label>

            {!switchAll && (
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-lg border">Cancel</button>
              <button
                onClick={handleSwitch}
                disabled={submitting}
                className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Processing…" : "Switch Fund"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SwitchMF;
