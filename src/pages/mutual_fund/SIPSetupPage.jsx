import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, validateInvestorReady, buildMandatePayload } from "../../utils/nodeApi";

const SIPSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fund = location.state?.fund || {};
  const { data: investorData } = useSelector((state) => state.investorData);

  const [amount, setAmount] = useState(fund.minSip || 500);
  const [frequency, setFrequency] = useState("m"); // m=monthly, w=weekly, q=quarterly
  const [sipDay, setSipDay] = useState(5);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);

  const generateSipRefId = () => `SIP${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const handleRegister = async () => {
    const minSip = fund.minSip || 500;
    const err = validateInvestorReady(investorData, minSip, amount);
    if (err) {
      toastError(err);
      return;
    }

    setLoading(true);
    const payload = {
      data: {
        sxp_type: "sip",
        mem_sxp_ref_id: generateSipRefId(),
        investor: { ucc: investorData?.kyc?.ucc_code },
        member: "91010",
        src_scheme: fund.scheme_bse_code || "",
        kyc_passed: true,
        dest_scheme: "",
        amount: Number(amount),
        cur: "INR",
        is_fresh: true,
        phys_or_demat: "d",
        start_date: startDate,
        end_date: endDate,
        freq: frequency,
        txn_date: Number(sipDay),
        email: investorData?.email || "",
        mobnum: investorData?.phone || "",
        holder: [{ holder_rank: "1", email: investorData?.email || "", mobnum: investorData?.phone || "" }],
        depository_acct: {
          depository: "C",
          dp_id: investorData?.kyc?.dp_id || "",
          client_id: investorData?.kyc?.client_id || "",
        },
        is_nomination_opted: false,
        nomination_auth_mode: 0,
      },
    };

    try {
      const url = nodeUrl(import.meta.env.VITE_XSP_REGISTER || "/xspRegister");
      const res = await postApiWithToken(url, payload);
      if (res) {
        toastSuccess("SIP registered successfully!");
        // Auto-register UPI mandate for SIP debits
        try {
          const mandateUrl = nodeUrl(import.meta.env.VITE_MANDATE_REGISTRATION || "/mandate_register/upi-autopay");
          await postApiWithToken(mandateUrl, buildMandatePayload(investorData?.kyc?.ucc_code, investorData, amount));
        } catch (_) { /* mandate optional */ }
        navigate("/mutual_fund/manage-sip");
      }
    } catch (err) {
      toastError(err?.message || "SIP registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center items-start p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6 dark:border dark:border-[var(--border-color)]">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Set Up SIP</h1>
          {fund.name && <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">{fund.name}</p>}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Monthly Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={fund.minSip || 500}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum: ₹{fund.minSip || 500}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            >
              <option value="m">Monthly</option>
              <option value="q">Quarterly</option>
              <option value="w">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">SIP Date</label>
            <select
              value={sipDay}
              onChange={(e) => setSipDay(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            >
              {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                <option key={d} value={d}>{d}th of every month</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 dark:bg-blue-500"
          >
            {loading ? "Registering…" : "Start SIP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SIPSetupPage;
