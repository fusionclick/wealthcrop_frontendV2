import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";
import { getApiWithToken, postApi, postApiWithToken } from "../../api/api";
import { apiErrorMessage, nodeUrl, validateInvestorReady } from "../../utils/nodeApi";
import { splitByPercent } from "../../utils/spread";
import { toastError } from "../../utils/notifyCustom";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";

/**
 * Audit #11 — "Invest in this basket".
 *
 * One acknowledgement, one amount split by the basket's own weights, one click: the server
 * (Node /basketCheckout) re-splits by the weights Laravel stores, refuses up front if any fund's
 * share is under its minimum, and otherwise places one purchase per fund through the same
 * /purchaseNewOrder gates as a single fund. The preview here is the same paisa-exact split, so
 * what the investor reads is what is sent — but it is only a preview.
 *
 * Lumpsum only: a basket SIP would be one SIP registration per fund, which nobody has asked
 * this checkout to do. Each fund's own page still starts a SIP.
 */
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const RESULT = {
  placed: { label: "Placed", tone: "text-emerald-700 dark:text-emerald-400" },
  held: { label: "Held for approval", tone: "text-amber-700 dark:text-amber-300" },
  refused: { label: "Refused", tone: "text-red-600 dark:text-red-400" },
  not_placed: { label: "Not placed", tone: "text-slate-500 dark:text-[var(--text-secondary)]" },
};

export default function Invest({ baskets }) {
  const { id } = useParams();
  const basket = Array.isArray(baskets) ? baskets.find((b) => String(b.id) === String(id)) : null;
  const { data: investor } = useSelector((state) => state.investorData);
  const disc = useDisclaimers();
  const [plan, setPlan] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mins, setMins] = useState({});
  const [amount, setAmount] = useState(5000);
  const [placing, setPlacing] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [paying, setPaying] = useState(false);

  // The basket's own codes and weights — what the server splits by.
  useEffect(() => {
    getApiWithToken(`${import.meta.env.VITE_URL}/baskets/${id}/checkout`)
      .then((res) => {
        const data = res?.data?.data;
        if (data?.legs) setPlan(data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [id]);

  // Each fund's minimum, from the same catalogue row the fund page reads (already raised to
  // the admin's house floor). Only to warn early; the server checks it again.
  useEffect(() => {
    if (!plan?.legs) return;
    let live = true;
    Promise.all(
      plan.legs.map((l) =>
        postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), { scheme_code: l.code })
          .then((res) => [l.code, Number(res?.data?.lists?.[0]?.minLumpsum) || 0])
          .catch(() => [l.code, 0])
      )
    ).then((pairs) => live && setMins(Object.fromEntries(pairs)));
    return () => {
      live = false;
    };
  }, [plan]);

  const legs = useMemo(() => {
    if (!plan?.legs) return [];
    const shares = splitByPercent(Number(amount) || 0, plan.legs.map((l) => Number(l.weight)));
    return plan.legs.map((l, i) => ({ ...l, amount: shares[i], min: mins[l.code] || 0 }));
  }, [plan, amount, mins]);
  const notFunds = legs.filter((l) => l.asset_type !== "mutual_fund");
  const short = legs.filter((l) => l.min > 0 && l.amount < l.min);

  const invest = async () => {
    const ready = validateInvestorReady(investor);
    if (ready) return toastError(ready);
    setPlacing(true);
    setOutcome(null);
    try {
      const res = await postApiWithToken(
        nodeUrl("/basketCheckout"),
        { data: { basket_id: Number(id), amount: Number(amount), acknowledged: disc.acked } },
        { silent: true, throwOnError: true }
      );
      setOutcome({ ok: true, ...res?.data });
    } catch (e) {
      // A refusal up front comes back with the reason on each fund: show those, not a toast.
      const body = e?.response?.data;
      if (body?.data?.legs) setOutcome({ ok: false, message: body.message, legs: body.data.legs });
      else toastError(apiErrorMessage(e, "The basket could not be invested."));
    } finally {
      setPlacing(false);
    }
  };

  const placedIds = (outcome?.legs || []).filter((l) => l.result === "placed").map((l) => l.order_id);
  // Every order placed here is paid for on BSE's page, all of them in one payment.
  const pay = async () => {
    setPaying(true);
    try {
      const res = await postApiWithToken(nodeUrl(import.meta.env.VITE_GET_PAYMENT_LINK || "/get-payment-link"), {
        data: { investor: { ucc: investor?.kyc?.ucc_code }, order_ids: placedIds, requested_method: "exch_pg_page", payment_mode: ["upi", "netbanking"], redirection_url: `${window.location.origin}/user/order/mutual-funds` },
      });
      const link = res?.response?.data?.exch_pg_page_link || res?.data?.exch_pg_page_link;
      if (link) window.location.assign(link);
      else toastError("BSE did not return a payment link. Pay for these orders from Orders.");
    } finally {
      setPaying(false);
    }
  };

  if (failed) return <div className="p-10 text-center text-slate-500 dark:text-[var(--text-secondary)]">This basket could not be loaded.</div>;
  if (!plan) return <div className="p-10 text-center text-slate-500 dark:text-[var(--text-secondary)]">Loading basket…</div>;

  return (
    <div className="min-h-screen p-6 bg-[#f3f7fb] dark:bg-[var(--app-bg)]">
      <div className="max-w-3xl mx-auto mb-4">
        <Link to={`/basket/${id}`} className="inline-flex items-center font-medium text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 transition shadow-lg">
          <FaArrowLeft className="mr-2" /> Back to Basket
        </Link>
        <h1 className="text-2xl font-bold mt-4 text-blue-950 dark:text-[var(--text-primary)]">{basket?.name || plan.name}</h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-[var(--card-bg)] rounded-xl p-6 shadow space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-slate-700 dark:text-[var(--text-secondary)]">Amount to invest (₹, lumpsum)</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setOutcome(null);
            }}
            className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--white-5)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
          />
        </label>

        <div>
          <h3 className="font-semibold mb-2 text-slate-800 dark:text-[var(--text-primary)]">How it is split</h3>
          <ul className="space-y-2">
            {legs.map((l) => (
              <li key={l.code} className="flex justify-between gap-3 text-sm border-b pb-1 dark:border-[var(--border-color)]">
                <span className="min-w-0 truncate text-slate-700 dark:text-[var(--text-primary)]">{l.name}</span>
                <span className={`shrink-0 ${l.min > 0 && l.amount < l.min ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-[var(--text-secondary)]"}`}>
                  {money(l.amount)} ({l.weight}%){l.min > 0 ? ` · min ${money(l.min)}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {short.length > 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {short.map((l) => l.name).join(", ")} would get less than {short.length === 1 ? "its" : "their"} minimum. Raise
              the amount — nothing is placed unless every fund can take its share.
            </p>
          )}
          {notFunds.length > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              This basket also holds stocks/ETFs, which basket checkout cannot buy. Buy those from their own pages.
            </p>
          )}
        </div>

        <OrderDisclaimers {...disc} schemes={legs} />

        <button
          type="button"
          onClick={invest}
          disabled={placing || !disc.ready || !(Number(amount) > 0) || short.length > 0 || notFunds.length > 0}
          className="w-full py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {placing ? "Placing one order per fund…" : "Invest in this basket"}
        </button>

        {outcome && (
          <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-2">
            {!outcome.ok && <p className="text-sm font-medium text-red-600 dark:text-red-400">{outcome.message}</p>}
            {outcome.ok && (
              <p className="text-sm font-medium text-slate-800 dark:text-[var(--text-primary)]">
                {outcome.placed} placed · {outcome.held} held for approval · {outcome.refused} refused
              </p>
            )}
            <ul className="space-y-1">
              {(outcome.legs || []).map((l) => (
                <li key={l.code} className="text-sm">
                  <span className="text-slate-700 dark:text-[var(--text-primary)]">{l.name}</span>{" "}
                  <span className="text-slate-500 dark:text-[var(--text-secondary)]">{money(l.amount)}</span>{" "}
                  <span className={`font-medium ${(RESULT[l.result] || RESULT.not_placed).tone}`}>— {(RESULT[l.result] || RESULT.not_placed).label}</span>
                  {l.order_id ? <span className="text-slate-500 dark:text-[var(--text-secondary)]"> · order {l.order_id}</span> : null}
                  {l.reason ? <span className="block text-xs text-slate-500 dark:text-[var(--text-secondary)]">{l.reason}</span> : null}
                </li>
              ))}
            </ul>
            {placedIds.length > 0 && (
              <button
                type="button"
                onClick={pay}
                disabled={paying}
                className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {paying ? "Opening payment…" : `Pay for ${placedIds.length} order${placedIds.length === 1 ? "" : "s"}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
