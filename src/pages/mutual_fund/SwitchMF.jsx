import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiWithToken, postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, laravelUrl, validateInvestorReady } from "../../utils/nodeApi";

const SwitchMF = () => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);

  const [holdings, setHoldings] = useState([]);
  const [destFunds, setDestFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);
  const [destScheme, setDestScheme] = useState("");
  const [switchAll, setSwitchAll] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const ucc = investorData?.kyc?.ucc_code;
        const [ordersRes, fundsRes] = await Promise.all([
          getApiWithToken(laravelUrl(import.meta.env.VITE_GET_FUNDLIST)),
          postApi(nodeUrl("/master-scheme-list"), { start: 0, length: 50 }),
        ]);
        const items = ordersRes?.data?.data;
        if (Array.isArray(items)) setHoldings(items);
        const lists = fundsRes?.data?.lists || [];
        setDestFunds(lists);
      } catch (_) {
        /* empty */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [investorData?.kyc?.ucc_code]);

  const generateOrderRefId = () => String(Math.floor(100000 + Math.random() * 900000));

  const handleSwitch = async () => {
    const err = validateInvestorReady(investorData);
    if (err) {
      toastError(err);
      return;
    }
    if (!selectedSource || !destScheme) {
      toastError("Select source fund and destination fund.");
      return;
    }
    if (!switchAll && (!amount || Number(amount) <= 0)) {
      toastError("Enter a valid switch amount.");
      return;
    }

    setSubmitting(true);
    const payload = {
      data: {
        orders: [
          {
            type: "sw",
            mem_ord_ref_id: generateOrderRefId(),
            investor: { ucc: investorData?.kyc?.ucc_code },
            member: "91010",
            scheme: selectedSource.scheme_bse_code || selectedSource.scheme_code || "",
            dest_scheme: destScheme,
            amount: switchAll ? 0 : Number(amount),
            cur: "INR",
            is_units: false,
            all_units: switchAll,
            min_redeem_flag: false,
            folio: selectedSource.folio || "",
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
        toastSuccess("Switch order placed successfully!");
        navigate("/user/order/mutual-funds");
      } else {
        toastError(res?.message || "Switch failed.");
      }
    } catch (e) {
      toastError(e?.message || "Switch failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
            <div>
              <label className="block text-sm font-medium mb-2">From (source fund)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
                value={selectedSource?.scheme_name || ""}
                onChange={(e) => setSelectedSource(holdings.find((h) => h.scheme_name === e.target.value))}
              >
                <option value="">Select fund</option>
                {holdings.map((h, i) => (
                  <option key={i} value={h.scheme_name}>{h.scheme_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To (destination fund)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
                value={destScheme}
                onChange={(e) => setDestScheme(e.target.value)}
              >
                <option value="">Select destination</option>
                {destFunds.map((f) => (
                  <option key={f.scheme_bse_code || f.isin} value={f.scheme_bse_code}>{f.name}</option>
                ))}
              </select>
            </div>

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
                className="w-full border rounded-lg px-3 py-2"
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
