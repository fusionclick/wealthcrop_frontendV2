import React, { useState } from "react";
import { placeFnoOrder } from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

const parsePrice = (value) => Number(String(value ?? "").replace(/,/g, "")) || 0;

const FnoOrderPanel = ({ instrument, onClose }) => {
  const lotSize = Math.max(1, Number(instrument.lotSize) || 1);
  const ltp = parsePrice(instrument.price);
  const [side, setSide] = useState("BUY");
  const [lots, setLots] = useState(1);
  const [orderType, setOrderType] = useState("MARKET");
  const [product, setProduct] = useState("NRML");
  const [price, setPrice] = useState(ltp);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (lots < 1) {
      toastError("Enter lots");
      return;
    }
    if (orderType === "LIMIT" && !(price > 0)) {
      toastError("Enter limit price");
      return;
    }

    setSubmitting(true);
    try {
      const res = await placeFnoOrder({
        trade_symbol: instrument.tradeSymbol || instrument.name,
        segment: instrument.segment,
        side,
        quantity: lots,
        order_type: orderType,
        product,
        price: orderType === "MARKET" ? 0 : price,
        validity: "DAY",
      });
      if (res?.status === true) {
        toastSuccess(res.message || `${side} order placed on Kotak`);
        onClose?.();
      } else if (res?.needs_setup) {
        toastError(res.message || "Link Kotak MPIN + TOTP in Holdings first");
      } else {
        toastError(res?.message || `${side} order failed`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-bg)] p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
              {instrument.tradeSymbol || instrument.name}
            </h3>
            <p className="text-xs text-slate-500">
              {instrument.segment} · lot {lotSize} · LTP ₹{instrument.price}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 text-sm">
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["BUY", "SELL"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`rounded-lg py-2 text-sm font-semibold ${
                side === s
                  ? s === "BUY"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "border border-slate-300 dark:border-[var(--border-color)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="block text-sm">
          Lots
          <input
            type="number"
            min={1}
            value={lots}
            onChange={(e) => setLots(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[var(--app-bg)] dark:border-[var(--border-color)]"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="rounded-lg border px-3 py-2 dark:bg-[var(--app-bg)] dark:border-[var(--border-color)]"
          >
            <option value="MARKET">MARKET</option>
            <option value="LIMIT">LIMIT</option>
          </select>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="rounded-lg border px-3 py-2 dark:bg-[var(--app-bg)] dark:border-[var(--border-color)]"
          >
            <option value="NRML">NRML</option>
            <option value="MIS">MIS</option>
          </select>
        </div>

        {orderType === "LIMIT" && (
          <label className="block text-sm">
            Price
            <input
              type="number"
              min={0}
              step="0.05"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[var(--app-bg)] dark:border-[var(--border-color)]"
            />
          </label>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50 dark:bg-[var(--text-primary)] dark:text-black"
        >
          {submitting ? "Placing…" : `Place ${side}`}
        </button>
      </div>
    </div>
  );
};

export default FnoOrderPanel;
