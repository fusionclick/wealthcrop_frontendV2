import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";

const OrderEntryPage = () => {
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(125.5); // limit price
  const [orderType, setOrderType] = useState("LIMIT");
  const [product, setProduct] = useState("DELIVERY");
  const [validity, setValidity] = useState("DAY");

  const ltp = 124.8; // last traded price (dummy)
  const stockName = "INFY";
  const {name} = useParams();
  const change = +1.85;
  const changePct = +1.51;

  const notionalValue = useMemo(() => quantity * price, [quantity, price]);
  const brokerage = useMemo(() => Math.min(20, notionalValue * 0.0003), [notionalValue]);
  const taxes = useMemo(() => notionalValue * 0.0005, [notionalValue]);
  const totalCharges = useMemo(
    () => brokerage + taxes,
    [brokerage, taxes]
  );
  const totalPayable = useMemo(
    () => (side === "BUY" ? notionalValue + totalCharges : notionalValue - totalCharges),
    [side, notionalValue, totalCharges]
  );

  const handleQtyChange = (val) => {
    const n = Number(val);
    if (!Number.isNaN(n) && n >= 0) setQuantity(n);
  };

  const handlePriceChange = (val) => {
    const n = Number(val);
    if (!Number.isNaN(n) && n >= 0) setPrice(n);
  };

  const placeOrder = () => {
    // You can replace this with your actual order API call / socket event
    alert(
      `${side} order placed for ${quantity} shares of ${stockName} at ₹${price.toFixed(
        2
      )} (${orderType}, ${product}, ${validity})`
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[var(--app-bg)] flex justify-center px-4 py-6 rounded-2xl">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
  <div>
    <h1 className="
      text-xl font-semibold
      text-slate-900
      dark:text-[var(--text-primary)]
    ">
      Place Order
    </h1>

    <p className="
      text-xs mt-1
      text-slate-500
      dark:text-[var(--text-secondary)]
    ">
      Review all details carefully before placing your order.
    </p>
  </div>

  <div className="
    flex gap-2 text-xs
    text-slate-500
    dark:text-[var(--text-secondary)]
  ">
    <span>Orders</span>
    <span>/</span>
    <span className="
      text-slate-700 font-medium
      dark:text-[var(--text-primary)]
    ">
      New Order
    </span>
  </div>
</div>


        {/* Stock header card */}
     <div
  className="
    bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 p-4
    flex flex-wrap items-center justify-between gap-4

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  "
>
  <div>
    <div className="flex items-center gap-2">
      <span
        className="
          inline-flex h-8 w-8 items-center justify-center rounded-full
          bg-emerald-100 text-emerald-700 text-sm font-semibold

          dark:bg-emerald-500/20
          dark:text-emerald-400
        "
      >
        IN
      </span>

      <div>
        <p
          className="
            text-sm font-semibold
            text-slate-900
            dark:text-[var(--text-primary)]
          "
        >
          {name}
        </p>

        <p
          className="
            text-[11px]
            text-slate-500
            dark:text-[var(--text-secondary)]
          "
        >
          {name}
        </p>
      </div>
    </div>
  </div>

  <div className="flex items-end gap-6">
    <div>
      <p
        className="
          text-[11px] uppercase tracking-wide
          text-slate-500
          dark:text-[var(--text-secondary)]
        "
      >
        LTP
      </p>

      <p
        className="
          text-base font-semibold
          text-slate-900
          dark:text-[var(--text-primary)]
        "
      >
        ₹{ltp.toFixed(2)}
      </p>
    </div>

    <div className="text-right">
      <p
        className={`text-xs font-medium ${
          change >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)} ({changePct >= 0 ? "+" : ""}
        {changePct.toFixed(2)}%)
      </p>

      <p
        className="
          text-[11px] mt-0.5
          text-slate-500
          dark:text-[var(--text-secondary)]
        "
      >
        NSE • Cash • T+2
      </p>
    </div>
  </div>
</div>


        {/* Main content */}
        <div className="grid md:grid-cols-[1.5fr,1fr] gap-4 items-start">
          {/* Left: Order Form */}
          <div
  className="
    bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  "
>
  {/* Buy / Sell toggle */}
  <div className="flex gap-2 text-xs font-medium mb-2">
    <button
      onClick={() => setSide('BUY')}
      className={`flex-1 py-2 rounded-xl border text-center transition-all ${
        side === 'BUY'
          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
          : 'bg-emerald-50 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-400'
      }`}
    >
      BUY
    </button>

    <button
      onClick={() => setSide('SELL')}
      className={`flex-1 py-2 rounded-xl border text-center transition-all ${
        side === 'SELL'
          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
          : 'bg-rose-50 text-rose-700 border-transparent dark:bg-rose-500/15 dark:text-rose-400'
      }`}
    >
      SELL
    </button>
  </div>

  {/* Order type & Product */}
  <div className="grid grid-cols-2 gap-3 text-xs">
    <div>
      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
        Order type
      </p>

      <div className="flex gap-1 bg-slate-50 dark:bg-[var(--gray-800)] rounded-xl p-1">
        {['MARKET', 'LIMIT'].map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition ${
              orderType === type
                ? 'bg-slate-900 text-white dark:bg-[var(--white-10)]'
                : 'text-slate-600 dark:text-[var(--text-secondary)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
        Product
      </p>

      <div className="flex gap-1 bg-slate-50 dark:bg-[var(--gray-800)] rounded-xl p-1">
        {['DELIVERY', 'INTRADAY'].map((type) => (
          <button
            key={type}
            onClick={() => setProduct(type)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition ${
              product === type
                ? 'bg-slate-900 text-white dark:bg-[var(--white-10)]'
                : 'text-slate-600 dark:text-[var(--text-secondary)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* Quantity & Price */}
  <div className="grid grid-cols-2 gap-3 text-xs">
    <div>
      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
        Quantity
      </p>

      <div className="flex items-center rounded-xl border border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--gray-800)] px-2">
        <button className="px-2 py-2 text-lg leading-none text-slate-500 dark:text-[var(--text-secondary)]">
          -
        </button>

        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQtyChange(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-[var(--text-primary)] text-center outline-none py-2"
        />

        <button className="px-2 py-2 text-lg leading-none text-slate-500 dark:text-[var(--text-secondary)]">
          +
        </button>
      </div>

      <p className="mt-1 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
        Lot size: 1 • Total: {quantity} shares
      </p>
    </div>

    <div>
      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
        Price (₹) {orderType === 'MARKET' && '(market)'}
      </p>

      <div className="flex items-center rounded-xl border border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--gray-800)] px-3">
        <input
          type="number"
          value={price}
          onChange={(e) => handlePriceChange(e.target.value)}
          disabled={orderType === 'MARKET'}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-[var(--text-primary)] outline-none py-2"
        />
      </div>

      <p className="mt-1 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
        LTP: ₹{ltp.toFixed(2)}
      </p>
    </div>
  </div>

  {/* Footer */}
  <div className="pt-1 border-t border-slate-100 dark:border-[var(--border-color)] mt-2 flex items-center justify-between gap-3">
    <div className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
      <p>
        Notional value:{' '}
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          ₹{notionalValue.toFixed(2)}
        </span>
      </p>
      <p className="mt-0.5">
        Total charges:{' '}
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          ₹{totalCharges.toFixed(2)}
        </span>
      </p>
    </div>

    <button
      onClick={placeOrder}
      className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition ${
        side === 'BUY'
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
          : 'bg-rose-500 hover:bg-rose-600 text-white'
      }`}
    >
      {side === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
    </button>
  </div>
</div>


          {/* Right: Charges & Summary */}
          <div
  className="
    bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  "
>
  {/* Order summary */}
  <div>
    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2">
      Order summary
    </p>

    <div className="rounded-xl bg-slate-50 dark:bg-[var(--gray-800)] px-3 py-2 space-y-1">
      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Side
        </span>
        <span
          className={`font-medium ${
            side === "BUY" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {side}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Qty × Price
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          {quantity} × ₹{price.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Order type
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          {orderType}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Product
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          {product}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Validity
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          {validity}
        </span>
      </div>
    </div>
  </div>

  {/* Charges breakdown */}
  <div>
    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2">
      Charges (approx.)
    </p>

    <div
      className="
        rounded-xl border border-slate-100 px-3 py-2 space-y-1

        dark:border-[var(--border-color)]
        dark:bg-[var(--gray-800)]
      "
    >
      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Brokerage
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          ₹{brokerage.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
          Taxes & others
        </span>
        <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
          ₹{taxes.toFixed(2)}
        </span>
      </div>

      <div
        className="
          flex justify-between pt-1 border-t border-dashed border-slate-200 mt-1

          dark:border-[var(--border-color)]
        "
      >
        <span className="font-medium text-slate-700 dark:text-[var(--text-primary)]">
          Total charges
        </span>
        <span className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          ₹{totalCharges.toFixed(2)}
        </span>
      </div>
    </div>

    <p className="mt-1 text-[10px] text-slate-400 dark:text-[var(--text-secondary)]">
      Actual charges may vary slightly as per exchange and regulator rules.
    </p>
  </div>

  {/* Final amount */}
  <div
    className="
      rounded-2xl bg-slate-900 text-slate-50 px-4 py-3 space-y-1

      dark:bg-[var(--white-10)]
      dark:text-[var(--text-primary)]
    "
  >
    <div className="flex justify-between items-center">
      <span className="text-[11px] opacity-80">
        {side === "BUY" ? "Total payable" : "Net receivable"}
      </span>
      <span className="text-sm font-semibold">
        ₹{totalPayable.toFixed(2)}
      </span>
    </div>

    <p className="text-[10px] opacity-70">
      Includes product, order type and taxes estimation.
    </p>
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default OrderEntryPage;
