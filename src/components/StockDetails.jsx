import React, { useEffect, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { MdOutlineInfo } from "react-icons/md";
import { useParams } from "react-router-dom";
import StockLiveChart from "./charts/StockLiveChart";
import OrderEntryPage from "../pages/stocks/OrderEntryPage";
import { fetchStockDetails } from "../api/marketApi";
import { stockLogoUrl } from "../utils/stockLogo";
import { normalizeTvSymbol, tradingViewChartUrl } from "../utils/tradingView";

const StockDetails = () => {
  const { name } = useParams();
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;

    let cancelled = false;

    const load = () => {
      fetchStockDetails(name)
        .then((res) => {
          if (!cancelled && res?.data) {
            setStockDetails(res.data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [name]);

  // ponytail: financials removed until real source exists

  const livePrice = stockDetails?.priceInfo?.lastPrice ?? 0;
  const pctChange = stockDetails?.priceInfo?.pChange ?? 0;
  const marketCapDisplay =
    stockDetails?.securityInfo?.issuedSize && livePrice
      ? (
          (stockDetails.securityInfo.issuedSize * livePrice) /
          1e7
        ).toFixed(2) + " Cr"
      : "—";

  const chartSymbol = normalizeTvSymbol(
    stockDetails?.info?.symbol || name
  ) || undefined;
  // Yahoo chart uses bare NSE ticker (RELIANCE), not NSE:RELIANCE
  const yahooSymbol = (stockDetails?.info?.symbol || name || "")
    .toString()
    .replace(/^NSE:/i, "")
    .replace(/[^A-Za-z0-9&]/g, "")
    .toUpperCase();

  const tradedVolume = stockDetails?.priceInfo?.totalTradedVolume;

  const fundamentals = stockDetails
    ? [
        { label: "Market Cap", value: marketCapDisplay },
        { label: "P/E (TTM)", value: stockDetails?.metadata?.pdSymbolPe ?? "—" },
        { label: "EPS (TTM)", value: stockDetails?.metadata?.pdSectorPe ?? "—" },
        { label: "ROE", value: "—" },
        { label: "Debt/Equity", value: "—" },
        { label: "Book Value", value: stockDetails?.priceInfo?.basePrice ?? "—" },
        { label: "Dividend Yield", value: "—" },
        { label: "Beta", value: "—" },
      ]
    : [];

  //! Definitons
  const fundamentalsDefinitions = {
  "Market Cap":
    "Market Capitalization represents the total value of a company's outstanding shares. It indicates the company’s overall size in the stock market.",

  "P/E (TTM)":
    "Price-to-Earnings (Trailing Twelve Months) shows how much investors are willing to pay per rupee of earnings over the last 12 months.",

  "EPS (TTM)":
    "Earnings Per Share (TTM) represents the company’s profit allocated per outstanding share over the last 12 months.",

  "ROE":
    "Return on Equity measures how effectively a company generates profit from shareholders' equity. Higher ROE indicates better profitability.",

  "Debt/Equity":
    "Debt-to-Equity ratio compares a company’s total debt to its shareholder equity. Lower D/E indicates lower financial risk.",

  "Book Value":
    "Book Value represents the net value of a company's assets per share after liabilities are deducted.",

  "Dividend Yield":
    "Dividend Yield shows how much a company pays in dividends relative to its share price. A higher yield indicates better cash returns.",

  "Beta":
    "Beta measures the volatility of a stock compared to the overall market. A beta above 1 means higher volatility; below 1 means lower volatility.",
};
const [activeInfo, setActiveInfo] = useState(null); 

  const depth = stockDetails?.marketDepth?.depth;
  const bids = depth?.buy?.filter((b) => b.price).slice(0, 5) ?? [];
  const asks = depth?.sell?.filter((a) => a.price).slice(0, 5) ?? [];
  const maxQty = Math.max(
    ...bids.map((b) => Number(b.quantity) || 0),
    ...asks.map((a) => Number(a.quantity) || 0),
    1
  );
  const [saved, setSaved] = useState(false);

  const [buySellModal, setBuySellModal] = useState({ open: false, type: "buy" });

  const openBuy = () => setBuySellModal({ open: true, type: "buy" });
  const openSell = () => setBuySellModal({ open: true, type: "sell" });
  const closeModal = () => setBuySellModal({ open: false, type: "buy" });
  const shareWhatsApp = () => {
    const company = stockDetails?.info?.companyName ?? name;
    const symbol = stockDetails?.info?.symbol ?? name;
    const msg = `Check ${company} (${symbol}) price ₹${livePrice} (${pctChange}%).`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

const logoSrc = stockLogoUrl(stockDetails?.info?.symbol ?? name);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white py-10 px-4 dark:from-[var(--app-bg)] dark:to-[var(--app-bg)] ">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
       <header className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

  {/* LEFT SECTION */}
  <div
  className="
    col-span-2
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl md:p-6 p-4 shadow-md

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
>
  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

    {/* LOGO + NAME */}
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <img
  src={logoSrc}
  alt="logo"
  className="w-16 h-16 rounded-xl object-contain bg-white"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      stockDetails?.info?.symbol ?? name ?? "?"
    )}&background=e2e8f0&color=0f172a&size=128`;
  }}
/>

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 capitalize break-words whitespace-normal dark:text-[var(--text-primary)]">
          {stockDetails?.info?.companyName}
        </h1>

        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
            {stockDetails?.info?.symbol}
          </span>
          <span className="px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
            {stockDetails?.industryInfo?.industry}
          </span>
        </div>
      </div>
    </div>

    {/* ACTION BTNS */}
    <div className="flex md:flex-row md:items-center items-start gap-3">

      <button
        onClick={() => setSaved(!saved)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition
          ${
            saved
              ? "bg-emerald-600 text-white"
              : `
                bg-white border border-slate-200 text-slate-700
                dark:bg-[var(--gray-800)]
                dark:border-[var(--border-color)]
                dark:text-[var(--text-secondary)]
              `
          }`}
      >
        <AiOutlineStar />
        <span className="hidden md:inline">
          {saved ? "Saved" : "Save"}
        </span>
      </button>

      <button
        onClick={shareWhatsApp}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white border border-slate-200 text-slate-700 hover:shadow

          dark:bg-[var(--gray-800)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-secondary)]
        "
      >
        <FiShare2 />
        <span className="hidden md:inline">Share</span>
      </button>

    </div>
  </div>

  {/* PRICE + BUY/SELL */}
  <div className="mt-5 flex flex-wrap items-center gap-6 justify-between">
    <div>
      <div className="flex items-end gap-3">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-[var(--text-primary)]">
          {/* ₹{livePrice.toFixed(2)} */}
          ₹{Number(livePrice || 0).toFixed(2)}
        </h2>

        <div
          className={`px-3 py-1 rounded-md text-sm font-semibold
            ${
              Number(pctChange || 0) >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
        >
          {Number(pctChange || 0) >= 0 ? "+" : ""}
          {Number(pctChange || 0).toFixed(2)}%
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-1 dark:text-[var(--text-secondary)]">
        As of {new Date().toLocaleString()}
      </p>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={openBuy}
        className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700"
      >
        Buy
      </button>

      <button
        onClick={openSell}
        className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700"
      >
        Sell
      </button>

      <div className="text-right text-sm text-slate-500 dark:text-[var(--text-secondary)]">
        <div>
          Vol:
          <span className="text-slate-900 font-medium dark:text-[var(--text-primary)]">
            {" "}
            {tradedVolume ? Number(tradedVolume).toLocaleString("en-IN") : "—"}
          </span>
        </div>
        <div>
          Mkt Cap:
          <span className="text-slate-900 font-medium dark:text-[var(--text-primary)]">
            {" "}
            {marketCapDisplay}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>


  {/* RIGHT MINI SECTION */}
  <aside
  className="
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl p-4 shadow-md h-full

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
>
  <div className="flex flex-col gap-4">

    {/* P/E Ratio */}
    <div
      className="
        bg-linear-to-r from-sky-50 to-white
        p-3 rounded-lg
        dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      "
    >
      <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
        P/E Ratio
      </p>
      <p className="text-lg font-semibold dark:text-[var(--text-primary)]">
        {stockDetails?.metadata?.pdSymbolPe}
      </p>
    </div>

    {/* 52W Range */}
    <div
      className="
        bg-linear-to-r from-rose-50 to-white
        p-3 rounded-lg
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      "
    >
      <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
        52W Range
      </p>
      <p className="text-sm font-semibold dark:text-[var(--text-primary)]">
        ₹{stockDetails?.priceInfo?.weekHighLow?.min} - ₹{stockDetails?.priceInfo?.weekHighLow?.max}
      </p>
    </div>

    {/* Analyst Rating */}
    <div
      className="
        bg-linear-to-r from-amber-50 to-white
        p-3 rounded-lg
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      "
    >
      <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
        Analyst Rating
      </p>

      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
          —
        </div>

        <div className="text-sm text-slate-700 dark:text-[var(--text-secondary)]">
          Live market data
        </div>
      </div>
    </div>

  </div>
</aside>


</header>


        {/* CHART + QUICK METRICS */}
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT SIDE — Chart Section */}
      <div className="lg:col-span-2 bg-white/60  backdrop-blur-sm border border-white/40 rounded-2xl p-2 lg:p-6 shadow-md
      dark:bg-(--white-10)
      ">
        
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold text-slate-700 dark:text-[var(--text-primary)]">
            {chartSymbol || yahooSymbol}
          </span>
          {chartSymbol && (
            <a
              href={tradingViewChartUrl(chartSymbol)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Open on TradingView ↗
            </a>
          )}
        </div>
        <StockLiveChart key={yahooSymbol} symbol={yahooSymbol} height={320} />

        {/* BELOW CHART: keep your Day High / Day Low cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
  <div
    className="
      p-3 rounded-xl shadow-sm
      bg-green-50
      dark:border
      dark:bg-[var(--gray-800)] border-(--border-color)
    "
  >
    <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
      Day High
    </p>
    <p className="font-semibold dark:text-[var(--text-primary)]">
      ₹{stockDetails?.priceInfo?.intraDayHighLow?.max}
    </p>
  </div>

  <div
    className="
      p-3 rounded-xl shadow-sm
      bg-orange-50
      dark:border
      dark:bg-[var(--gray-800)] border-(--border-color)
    "
  >
    <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
      Day Low
    </p>
    <p className="font-semibold dark:text-[var(--text-primary)]">
      ₹{stockDetails?.priceInfo?.intraDayHighLow?.min}
    </p>
  </div>
</div>

      </div>

      {/* RIGHT SIDE — KEEP YOUR STATS */}
      <aside
  className="
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl p-4 shadow-md space-y-4

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
>
  {/* Avg Volume */}
  <div
    className="
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-sky-50 to-white
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    "
  >
    <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
      Avg Volume (3M)
    </p>
    <p className="font-semibold dark:text-[var(--text-primary)]">
      {stockDetails?.securityInfo?.issuedSize
        ? Math.round(stockDetails.securityInfo.issuedSize / 1e6 * 10) / 10 + "M"
        : "—"}
    </p>
  </div>

  {/* Beta */}
  <div
    className="
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-rose-50 to-white
 dark:border
        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    "
  >
    <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
      Beta
    </p>
    <p className="font-semibold dark:text-[var(--text-primary)]">—</p>
  </div>

  {/* Dividend Yield */}
  <div
    className="
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-amber-50 to-white
 dark:border
        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    "
  >
    <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
      Dividend Yield
    </p>
    <p className="font-semibold dark:text-[var(--text-primary)]">—</p>
  </div>
</aside>


    </section>


        {/* FUNDAMENTALS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <aside
    className="
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-4 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
  >
    <h4 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)] mb-3">
      Fundamentals
    </h4>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fundamentals.map((item, index) => (
        <div
          key={index}
          onClick={() => setActiveInfo(activeInfo === index ? null : index)}
          className="
            relative p-3 rounded-md shadow-sm cursor-pointer
            bg-white border border-gray-100

            dark:bg-[var(--white-5)]
            dark:border-[var(--border-color)]
          "
        >
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              {item.label}
            </p>
            <span className="text-gray-500 text-xs">
              <MdOutlineInfo />
            </span>
          </div>

          <p className="font-semibold mt-1 dark:text-[var(--text-primary)]">
            {item.value}
          </p>

          {activeInfo === index && (
            <div
              className="
                absolute top-14 left-0 w-56 p-3 rounded-lg shadow-md z-50
                bg-white border border-gray-200 text-xs text-gray-700

                dark:bg-[var(--gray-900)]
                dark:border-[var(--border-color)]
                dark:text-[var(--text-secondary)]
              "
            >
              {fundamentalsDefinitions[item.label]}
            </div>
          )}
        </div>
      ))}
    </div>
  </aside>
</section>


        {/* MARKET DEPTH */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* MARKET DEPTH */}
  <div
    className="
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-6 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
  >
    <h3 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)] mb-4">
      Market Depth
    </h3>

    {bids.length === 0 && asks.length === 0 ? (
      <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
        {loading ? "Loading depth…" : "Market depth available when Kotak API is connected."}
      </p>
    ) : (
    <>
    <div className="w-full">
      <div className="flex justify-between text-md font-medium text-slate-600 dark:text-[var(--text-secondary)]">
        <span>Buy order quantity</span>
        <span>Sell order quantity</span>
      </div>

      <div className="flex w-full h-2 rounded-full overflow-hidden mt-2 bg-slate-200 dark:bg-[var(--gray-800)]">
        <div className="bg-emerald-500" style={{ width: "33%" }} />
        <div className="bg-red-500" style={{ width: "67%" }} />
      </div>

      <div className="flex justify-between mt-1 text-sm font-medium">
        <span className="text-emerald-600">33%</span>
        <span className="text-red-500">67%</span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-6 divide-x dark:divide-[var(--border-color)]">
      {/* BIDS */}
      <div className="pr-4">
        <div className="grid grid-cols-2 text-sm mb-2 text-slate-600 dark:text-[var(--text-secondary)]">
          <span className="font-medium">Bid Price</span>
          <span className="text-right font-medium">Qty</span>
        </div>

        {bids.map((b, i) => (
          <div key={i} className="grid grid-cols-2 items-center text-sm mb-2 relative">
            <span className="dark:text-[var(--text-primary)]">
              {Number(b.price).toLocaleString()}
            </span>

            <div className="relative text-right">
              <span className="text-emerald-600 font-medium relative z-10">
                {Number(b.quantity).toLocaleString()}
              </span>
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-emerald-100 dark:bg-emerald-500/20 rounded"
                style={{ width: `${(Number(b.quantity) / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]">
          <span>Bid Total</span>
          <span>{bids.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0).toLocaleString()}</span>
        </div>
      </div>

      {/* ASKS */}
      <div className="pl-4">
        <div className="grid grid-cols-2 text-sm mb-2 text-slate-600 dark:text-[var(--text-secondary)]">
          <span className="font-medium">Ask Price</span>
          <span className="text-right font-medium">Qty</span>
        </div>

        {asks.map((a, i) => (
          <div key={i} className="grid grid-cols-2 items-center text-sm mb-2 relative">
            <span className="dark:text-[var(--text-primary)]">
              {Number(a.price).toLocaleString()}
            </span>

            <div className="relative text-right">
              <span className="text-red-500 font-medium relative z-10">
                {Number(a.quantity).toLocaleString()}
              </span>
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-red-100 dark:bg-red-500/20 rounded"
                style={{ width: `${(Number(a.quantity) / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]">
          <span>Ask Total</span>
          <span>{asks.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    </>
    )}
  </div>
</section>


        {/* ABOUT & FOOTER */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* ABOUT */}
  <div
    className="
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-6 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
  >
    <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-[var(--text-primary)]">
      About {stockDetails?.info?.companyName ?? name}
    </h3>

    <p className="text-sm leading-relaxed text-slate-700 dark:text-[var(--text-secondary)]">
      {stockDetails?.industryInfo?.industry
        ? `${stockDetails.info?.companyName} operates in the ${stockDetails.industryInfo.industry} sector on NSE.`
        : loading
          ? "Loading company info…"
          : "Company details will appear when market data is available."}
    </p>

    <div className="mt-6 grid grid-cols-2 gap-4">
      <div
        className="
          p-4 rounded-md shadow-sm
          bg-white

          dark:bg-[var(--gray-800)]
        "
      >
        <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
          Parent Organisation
        </p>
        <p className="font-semibold dark:text-[var(--text-primary)]">
          {stockDetails?.info?.companyName ?? "—"}
        </p>
      </div>

      <div
        className="
          p-4 rounded-md shadow-sm
          bg-white

          dark:bg-[var(--gray-800)]
        "
      >
        <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
          Headquarters
        </p>
        <p className="font-semibold dark:text-[var(--text-primary)]">India</p>
      </div>
    </div>
  </div>

  {/* QUICK LINKS */}
  <aside
    className="
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-4 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
  >
    <h4 className="text-lg font-semibold mb-3 dark:text-[var(--text-primary)]">
      Quick Links
    </h4>

    <ul className="flex flex-col gap-2">
      <li>
        <a
          className="
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          "
          href="#"
        >
          Quarterly results
        </a>
      </li>

      <li>
        <a
          className="
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          "
          href="#"
        >
          Shareholding pattern
        </a>
      </li>

      <li>
        <a
          className="
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          "
          href="#"
        >
          Corporate announcements
        </a>
      </li>
    </ul>
  </aside>

</section>


        {/* sticky quick order */}
        {/* <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(900px,95%)] z-50">
  <div
    className="
      bg-white/80 backdrop-blur-md
      border border-white/30
      rounded-3xl p-4 shadow-lg
      flex items-center justify-between gap-4

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
  >
    <div className="flex items-center gap-6">
      <div className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
        Quick Order
      </div>

      <div className="text-lg font-semibold dark:text-[var(--text-primary)]">
        ₹{livePrice.toFixed(2)}
      </div>

      <div
        className={`px-2 py-1 rounded text-sm ${
          pctChange >= 0
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        }`}
      >
        {pctChange >= 0 ? "+" : ""}
        {pctChange}%
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={openBuy}
        className="px-6 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
      >
        Buy
      </button>

      <button
        onClick={openSell}
        className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700"
      >
        Sell
      </button>
    </div>
  </div>
</div> */}


        <div className="h-28" />
      </div>

      {/* BUY / SELL modal */}
{buySellModal.open && (
  <div
  className="
    fixed inset-0 z-50 flex items-center justify-center p-4
    bg-black/40
  "
  onClick={closeModal}
>
  <div
    className="
      w-full max-w-2xl h-[90vh]
      rounded-2xl shadow-xl overflow-y-auto p-6 relative

      bg-white
      dark:bg-[var(--card-bg)]
      dark:border
      dark:border-[var(--border-color)]
    "
    onClick={(e) => e.stopPropagation()}
  >
    {/* Close button */}
    <button
      onClick={closeModal}
      className="
        absolute top-5 right-9 text-3xl transition cursor-pointer

        text-slate-400 hover:text-slate-700
        dark:text-[var(--text-secondary)]
        dark:hover:text-[var(--text-primary)]
      "
    >
      ×
    </button>

    {/* Your content */}
    <OrderEntryPage
      symbol={yahooSymbol || name}
      initialSide={buySellModal.type === "sell" ? "SELL" : "BUY"}
      ltp={livePrice}
      changePct={pctChange}
      change={(livePrice * pctChange) / 100}
      onSuccess={closeModal}
    />
  </div>
</div>

)}

    </div>
  );
}
 export default StockDetails