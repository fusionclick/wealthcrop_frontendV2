import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { postApi, postApiWithToken } from "../../api/api";
import { useSelector } from "react-redux";
import { clearToasts, toastError, toastSuccess } from "../../utils/notifyCustom";
import InvestLoader from "../../components/InvestLoader";
import PaymentPromptModal from "../../components/PaymentPromptModal";
import { apiErrorMessage, nodeUrl, laravelUrl, validateInvestorReady } from "../../utils/nodeApi";

const MutualFundInvestPage = ({ fundsList: fundsProp, setBuyModal }) => {
  const { isin, code } = useParams();
  const navigate = useNavigate();
  const { data: investor } = useSelector((state) => state.investorData);
  const [fundsList, setFundsList] = useState(fundsProp || null);
  const [amount, setAmount] = useState(fundsProp?.minLumpsum || 5000);
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    if (fundsProp?.scheme_bse_code) {
      setFundsList(fundsProp);
      return;
    }
    if (!isin && !code) return;
    postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
      isin,
      scheme_code: code,
    }).then((res) => {
      const item = res?.data?.lists?.[0];
      if (item) setFundsList(item);
    });
  }, [fundsProp, isin, code]);

  const schemeCode = fundsList?.scheme_bse_code || code;
  const name = fundsList?.name || "Mutual Fund";
  const nav = Number(fundsList?.nav || 0);
  const minLumpsum = Number(fundsList?.minLumpsum || 1000);
  const estimatedUnits = useMemo(() => (amount && nav > 0 ? amount / nav : 0), [amount, nav]);
  // BSE batata hai ke scheme demat mein rakhi ja sakti hai ya sirf physical mein. UCC
  // demat par bana hai, to physical-only scheme ka form bharwana bekaar hai — order
  // hamesha reject hoga. holding_modes na ho to raasta khula rehta hai.
  const dematBlocked = fundsList?.holding_modes?.demat === false;

  const generateOrderRefId = () => String(Math.floor(100000 + Math.random() * 900000));

  const pollOrderStatus = (orderId) => {
    const pollUrl = nodeUrl(import.meta.env.VITE_GET_ORDER || "/getOrder");
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const statusRes = await postApiWithToken(pollUrl, { data: { id: orderId } });
        const status = statusRes?.data?.items?.[0]?.status;
        if (status === "ALLOTTED") {
          clearInterval(interval);
          toastSuccess("Order allotted successfully!");
        } else if (status === "REJECTED" || status === "FAILED") {
          clearInterval(interval);
          toastError(`Order ${String(status).toLowerCase()}. Please try again.`);
        }
      } catch { /* polling */ }
      if (attempts >= 18) clearInterval(interval);
    }, 10000);
  };

  const sendOrderDetails = async (bse_order_id, mem_ord_ref_id, orderType = "purchase") => {
    const url = laravelUrl(import.meta.env.VITE_SEND_FUND_ORDER_DETAILS);
    try {
      await postApiWithToken(url, {
        bse_order_id,
        mem_ord_ref_id,
        scheme_name: name,
        scheme_bse_code: schemeCode,
        inv_amo: amount,
        ret_percentage: fundsList?.returns?.["1Y"] ?? 0,
        order_type: orderType,
        scheme_category: fundsList?.category,
      });
    } catch { /* persistence is best-effort */ }
  };

  const startPayment = async (orderId) => {
    setLinkLoading(true);
    const url = nodeUrl(import.meta.env.VITE_GET_PAYMENT_LINK || "/get-payment-link");
    try {
      const res = await postApiWithToken(url, {
        data: {
          investor: { ucc: investor?.kyc?.ucc_code },
          order_ids: [orderId],
          requested_method: "exch_pg_page",
          // ponytail: mandate tab tak nahi jab tak NACH/UPI-autopay register na ho —
          // warna BSE page par "Select Mandate → No data available" khali khara rehta hai.
          payment_mode: ["upi", "netbanking"],
          redirection_url: `${window.location.origin}/user/mutual_fund/investments`,
        },
      });
      const link = res?.response?.data?.exch_pg_page_link || res?.data?.exch_pg_page_link;
      if (link) setPaymentLink(link);
    } catch (error) {
      toastError(error?.message || "Could not create payment link");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleInvest = async () => {
    clearToasts();
    setOrderError("");
    const err = validateInvestorReady(investor, minLumpsum, amount, {
      risk: fundsList?.risk,
      category: fundsList?.category || fundsList?.subType,
    });
    if (err) {
      toastError(err);
      return;
    }
    if (!schemeCode) {
      toastError("Scheme code missing.");
      return;
    }

    setLoading(true);
    const memRef = generateOrderRefId();
    const payload = {
      data: {
        orders: [
          {
            type: "p",
            mem_ord_ref_id: memRef,
            investor: { ucc: investor?.kyc?.ucc_code },
            member: "91010",
            scheme: schemeCode,
            amount: Number(amount),
            cur: "INR",
            is_units: false,
            all_units: false,
            min_redeem_flag: false,
            folio: "",
            is_fresh: true,
            phys_or_demat: "d",
            holder: [{ holder_rank: "1", email: investor?.email || "", mobnum: investor?.phone || "" }],
            kyc_passed: true,
            dpc: true,
            email: investor?.email || "",
            mobnum: investor?.phone || "",
          },
        ],
      },
    };

    try {
      const res = await postApiWithToken(
        nodeUrl(import.meta.env.VITE_FUND_ORDER_PLACE || "/purchaseNewOrder"),
        payload,
        { silent: true, throwOnError: true }
      );
      if (res?.status === 200 || res?.status === true || res?.status === "success") {
        toastSuccess("Order placed successfully");
        const orderId = res.data?.items?.[0]?.id;
        const memberRefId = res.data?.items?.[0]?.mem_ord_ref_id || memRef;
        if (orderId) {
          sendOrderDetails(orderId, memberRefId, "purchase");
          startPayment(orderId);
          pollOrderStatus(orderId);
        }
        setShowPaymentPopup(true);
      } else {
        const message = res?.message || res?.error || "Order placement failed. Please try again.";
        setOrderError(message);
        toastError(message);
      }
    } catch (error) {
      const message = apiErrorMessage(error, "Order placement failed. Please try again.");
      setOrderError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InvestLoader />;
  if (!fundsList) {
    return <div className="p-8 text-center text-gray-500">Loading fund…</div>;
  }

  return (
    <div className="min-h-screen rounded-2xl bg-slate-100 dark:bg-[var(--app-bg)] flex justify-center px-4 py-6">
      <div className="w-full max-w-xl bg-white dark:bg-[var(--card-bg)] rounded-2xl border border-slate-200 dark:border-[var(--border-color)] p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Invest in Mutual Fund</h1>
          <p className="text-sm text-slate-500 mt-1">{name}</p>
          <p className="text-xs text-slate-400 mt-1">{fundsList.subType || fundsList.category}</p>
        </div>

        <div className="flex justify-between text-sm">
          <span>NAV</span>
          <span className="font-medium">{nav ? `₹${nav.toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Minimum lumpsum</span>
          <span className="font-medium">₹{minLumpsum.toLocaleString()}</span>
        </div>

        <label className="block text-sm">
          Amount (₹)
          <input
            type="number"
            min={minLumpsum}
            value={amount}
            onChange={(e) => {
              clearToasts();
              setOrderError("");
              setAmount(Number(e.target.value));
            }}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
          />
        </label>
        {nav > 0 && (
          <p className="text-xs text-slate-500">Est. units: {estimatedUnits.toFixed(3)}</p>
        )}
        {dematBlocked && (
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
            This scheme can only be held physically. Your BSE account is registered for
            demat, so it cannot be purchased here.
          </p>
        )}
        {orderError && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
            {orderError}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              clearToasts();
              setOrderError("");
              if (setBuyModal) setBuyModal(false);
              else navigate(-1);
            }}
            className="flex-1 py-3 rounded-lg border"
          >
            Cancel
          </button>
          <button
            onClick={handleInvest}
            disabled={dematBlocked}
            className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50"
          >
            Confirm & Invest
          </button>
        </div>
      </div>

      <PaymentPromptModal
        open={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        onSkip={() => {
          setShowPaymentPopup(false);
          navigate("/user/mutual_fund/investments");
        }}
        paymentLink={paymentLink}
        linkLoading={linkLoading}
      />
    </div>
  );
};

export default MutualFundInvestPage;
