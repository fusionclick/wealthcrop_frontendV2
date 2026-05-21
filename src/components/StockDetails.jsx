// StockDetailsPremiumFull.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { FiShare2 } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { MdOutlineInfo } from "react-icons/md";
import logo from "../assets/mutualFund/sbi.webp"
import { useParams } from "react-router-dom";
import CandleChart from "./chart/CandleChart";
import {
  data_1D,
  data_1W,
  data_1M,
  data_3M,
  data_6M,
  data_1Y,
  data_3Y,
  data_5Y,
  data_All,
} from "./chart/chartData";
import OrderEntryPage from "../pages/stocks/OrderEntryPage";
import socket from "../utils/socket";

/**
 * NOTE: use your uploaded image path here (developer provided).
 * The image is available at:
 * /mnt/data/489847be-2715-4255-af96-6c64dad8bb92.png
 */

const StockDetails = () => {
  // ---------------- MOCK STOCK DATA ----------------
  const {name} = useParams()
  
  const baseStock = {
    name: "AetherTech Solutions Ltd.",
    symbol: "AETHER",
    price: 1489.6,
    marketCap: "₹1,95,200 Cr",
    pe: 28.3,
    volume: 5_820_321,
    week52High: 1750,
    week52Low: 820,
    beta: 1.12,
    dividendYield: "0.95%",
    description:
      "AetherTech Solutions is a technology & cloud solutions provider focused on enterprise digital transformation, AI services and edge computing platforms.",
    rating: 4.4,
  };

  // timeseries (30 points) - mock
  const timeseries = useMemo(() => {
    const arr = [];
    let base = 1420;
    for (let i = 29; i >= 0; i--) {
      base += (Math.sin(i / 3) * 5 + (Math.random() - 0.5) * 10);
      arr.push({
        x: `D-${i}`,
        price: Math.round(base * 100) / 100,
      });
    }
    return arr;
  }, []);

  const [stockDetails, setStockDetails] = useState()


 useEffect(() => {
   setStockDetails(null); 
   
  if (!name) return; 

  const fetchStockDetails = () => {
    socket.emit("get_details", { symbol: name });
  };

  const handleStockDetails = (data) => {
    console.log("Stock Details", data);
    setStockDetails(data);
  };

  socket.on("stock_details", handleStockDetails);

  fetchStockDetails(); // initial call

  const interval = setInterval(fetchStockDetails, 1000);

  return () => {
    clearInterval(interval);
    socket.off("stock_details", handleStockDetails); //  correct cleanup
  };
}, [name]); //  VERY IMPORTANT

  // Financials: quarterly and yearly (mock)
  const financialsQuarterly = {
    revenue: [
      { name: "Q2'24", value: 7372 },
      { name: "Q3'24", value: 8187 },
      { name: "Q4'24", value: 8770 },
      { name: "Q1'25", value: 9422 },
    ],
    profit: [
      { name: "Q2'24", value: 1220 },
      { name: "Q3'24", value: 1490 },
      { name: "Q4'24", value: 1580 },
      { name: "Q1'25", value: 1710 },
    ],
  };

  const financialsYearly = {
    revenue: [
      { name: "2021", value: 15000 },
      { name: "2022", value: 25000 },
      { name: "2023", value: 28500 },
      { name: "2024", value: 31200 },
    ],
    profit: [
      { name: "2021", value: 2500 },
      { name: "2022", value: 4500 },
      { name: "2023", value: 5200 },
      { name: "2024", value: 5800 },
    ],
  };

  // Fundamentals (mock)
  const fundamentals = [
    { label: "Market Cap", value: baseStock.marketCap },
    { label: "P/E (TTM)", value: baseStock.pe },
    { label: "EPS (TTM)", value: "₹52.8" },
    { label: "ROE", value: "15.6%" },
    { label: "Debt/Equity", value: "0.38" },
    { label: "Book Value", value: "₹780" },
    { label: "Dividend Yield", value: baseStock.dividendYield },
    { label: "Beta", value: baseStock.beta },
  ];

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

  // Market Depth (mock)
  const bids = [
    { price: 1489.3, qty: 2 },
    { price: 1489.2, qty: 58 },
    { price: 1489.1, qty: 50 },
    { price: 1489.0, qty: 4 },
    { price: 1488.9, qty: 161 },
  ];
  const asks = [
    { price: 1489.4, qty: 44 },
    { price: 1489.5, qty: 105 },
    { price: 1489.6, qty: 59 },
    { price: 1489.7, qty: 31 },
    { price: 1489.8, qty: 251 },
  ];

  // Peers
  const peers = [
    { company: "CloudNova", price: 980, change: 0.8, mcap: "₹82,300 Cr" },
    { company: "HyperEdge", price: 2245, change: -0.6, mcap: "₹1,12,480 Cr" },
    { company: baseStock.name, price: baseStock.price, change: 1.42, mcap: baseStock.marketCap },
  ];

  // News
  const news = [
    { title: "AetherTech announces strategic AI chip partnership", src: "BusinessTech", time: "2h ago" },
    { title: "Q1 results beat estimates: Revenue +18%", src: "MarketWatch", time: "1d ago" },
    { title: "New data center to expand capacity in South India", src: "InfraDaily", time: "3d ago" },
  ];

  // ---------------- UI state ----------------
  const [livePrice, setLivePrice] = useState(baseStock.price);
  const [isTicking, setIsTicking] = useState(true);
  const [saved, setSaved] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [finTab, setFinTab] = useState("revenue");
  const [finPeriod, setFinPeriod] = useState("quarterly");
  const [buySellModal, setBuySellModal] = useState({ open: false, type: "buy" });
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState("Market");

  // animate live price a little
  useEffect(() => {
    if (!isTicking) return;
    const id = setInterval(() => {
      setLivePrice((p) => Math.round((p + (Math.random() - 0.48) * 2) * 100) / 100);
    }, 1400);
    return () => clearInterval(id);
  }, [isTicking]);

  const pctChange = Math.round(((livePrice - baseStock.price) / baseStock.price) * 10000) / 100;

  // handlers
  const openBuy = () => setBuySellModal({ open: true, type: "buy" });
  const openSell = () => setBuySellModal({ open: true, type: "sell" });
  const closeModal = () => setBuySellModal({ open: false, type: "buy" });
  const placeOrder = () => {
    alert(`${buySellModal.type.toUpperCase()} order placed: ${qty} shares (${orderType}) — total ₹${(livePrice * qty).toFixed(2)}`);
    closeModal();
  };
  const shareWhatsApp = () => {
    const msg = `Check ${baseStock.name} (${baseStock.symbol}) price ₹${livePrice} (${pctChange}%).`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // prepare chart data
  const areaData = timeseries.map((d) => ({ name: d.x, price: d.price }));
  const finData = finPeriod === "quarterly" ? financialsQuarterly[finTab] : financialsYearly[finTab];

  // market-depth scaling
  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));

    //! one day high and low
  const latest = data_1D[data_1D.length - 1];
  const dayHigh = latest.high;
  const dayLow = latest.low;

const getDomainFromName = (name) => {
  return name
    ?.toLowerCase()
    .replace(/limited|ltd|inc|corp/g, "")
    .replace(/[^a-z]/g, "") + ".com";
};

const getLogoUrl = (stockDetails) => {
  const domain = getDomainFromName(stockDetails?.info?.companyName);
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
};

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
  src={getLogoUrl(stockDetails)}
  alt="logo"
  className="w-16 h-16 rounded-xl"
  onError={(e) => {
    e.target.src = "/default-stock.png";
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
          ₹{stockDetails?.priceInfo?.lastPrice?.toFixed(2)}
        </h2>

        <div
          className={`px-3 py-1 rounded-md text-sm font-semibold
            ${
              stockDetails?.priceInfo?.pChange >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
        >
          {stockDetails?.priceInfo?.pChange >= 0 ? "+" : ""}
          {stockDetails?.priceInfo?.pChange?.toFixed(2)}%
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
            {stockDetails?.securityInfo?.issuedSize}
          </span>
        </div>
        <div>
          Mkt Cap:
          <span className="text-slate-900 font-medium dark:text-[var(--text-primary)]">
            {" "}
{
  stockDetails?.securityInfo?.issuedSize &&
  stockDetails?.priceInfo?.basePrice
    ? (
        (stockDetails.securityInfo.issuedSize *
          stockDetails.priceInfo.basePrice) / 1e7
      ).toFixed(2) + " Cr"
    : "N/A"
}
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
          {baseStock.rating}
        </div>

        <div className="text-sm text-slate-700 dark:text-[var(--text-secondary)]">
          Strong Buy
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
        
        <CandleChart height={320} />

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
      {Math.round(baseStock.volume / 1e6 * 10) / 10}M
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
    <p className="font-semibold dark:text-[var(--text-primary)]">
      {baseStock.beta}
    </p>
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
    <p className="font-semibold dark:text-[var(--text-primary)]">
      {baseStock.dividendYield}
    </p>
  </div>
</aside>


    </section>


        {/* FINANCIALS (quarterly/yearly) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* FINANCIALS */}
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
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">
        Financials
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFinPeriod("quarterly")}
            className={`px-3 py-1 rounded-md ${
              finPeriod === "quarterly"
                ? "bg-blue-950 text-white"
                : "bg-white border border-slate-200 dark:bg-[var(--gray-800)] dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
            }`}
          >
            Quarterly
          </button>

          <button
            onClick={() => setFinPeriod("yearly")}
            className={`px-3 py-1 rounded-md ${
              finPeriod === "yearly"
                ? "bg-blue-950 text-white"
                : "bg-white border border-slate-200 dark:bg-[var(--gray-800)] dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
            }`}
          >
            Yearly
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFinTab("revenue")}
            className={`px-3 py-1 rounded-md ${
              finTab === "revenue"
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-200 dark:bg-[var(--gray-800)] dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
            }`}
          >
            Revenue
          </button>

          <button
            onClick={() => setFinTab("profit")}
            className={`px-3 py-1 rounded-md ${
              finTab === "profit"
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-200 dark:bg-[var(--gray-800)] dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
            }`}
          >
            Profit
          </button>
        </div>
      </div>
    </div>

    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={finData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <ReTooltip />
          <Bar dataKey="value" fill="#06b6d4" barSize={18}>
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 12, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-6 grid grid-cols-3 gap-4">
      {[
        ["Net Profit (TTM)", "₹3,820 Cr"],
        ["EBITDA Margin", "24.7%"],
        ["Operating Cashflow", "₹5,200 Cr"],
      ].map(([label, value], i) => (
        <div
          key={i}
          className="
            p-4 rounded-xl shadow-sm
            bg-white

            dark:bg-[var(--white-5)]
            dark:border dark:border-[var(--border-color)]
          "
        >
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
            {label}
          </p>
          <p className="font-semibold dark:text-[var(--text-primary)]">
            {value}
          </p>
        </div>
      ))}
    </div>
  </div>

  {/* FUNDAMENTALS */}
  <aside
    className="
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

    <div className="grid grid-cols-2 gap-3">
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

    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-[var(--text-secondary)]">
      <span className="text-gray-500"><MdOutlineInfo /></span>
      <span>Click any metric to view its definition</span>
    </div>
  </aside>
</section>


        {/* MARKET DEPTH + PEERS + NEWS */}
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
              {b.price.toLocaleString()}
            </span>

            <div className="relative text-right">
              <span className="text-emerald-600 font-medium relative z-10">
                {b.qty.toLocaleString()}
              </span>
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-emerald-100 dark:bg-emerald-500/20 rounded"
                style={{ width: `${(b.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]">
          <span>Bid Total</span>
          <span>{bids.reduce((acc, c) => acc + c.qty, 0).toLocaleString()}</span>
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
              {a.price.toLocaleString()}
            </span>

            <div className="relative text-right">
              <span className="text-red-500 font-medium relative z-10">
                {a.qty.toLocaleString()}
              </span>
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-red-100 dark:bg-red-500/20 rounded"
                style={{ width: `${(a.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]">
          <span>Ask Total</span>
          <span>{asks.reduce((acc, c) => acc + c.qty, 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>

  {/* PEERS & NEWS */}
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
      Peers
    </h4>

    <div className="space-y-2">
      {peers.map((p, i) => (
        <div
          key={i}
          className="
            flex justify-between items-center p-2 rounded-md transition
            hover:bg-white

            dark:hover:bg-[var(--gray-800)]
          "
        >
          <div>
            <div className="font-medium dark:text-[var(--text-primary)]">
              {p.company}
            </div>
            <div className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              {p.mcap}
            </div>
          </div>

          <div className="text-right">
            <div className="font-semibold dark:text-[var(--text-primary)]">
              ₹{p.price}
            </div>
            <div className={`text-sm ${p.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {p.change >= 0 ? "+" : ""}
              {p.change}%
            </div>
          </div>
        </div>
      ))}
    </div>

    <hr className="my-4 border-slate-200 dark:border-[var(--border-color)]" />

    <h4 className="text-lg font-semibold mb-3 dark:text-[var(--text-primary)]">
      Latest News
    </h4>

    <ul className="space-y-3">
      {news.map((n, i) => (
        <li
          key={i}
          className="
            p-3 rounded-lg transition flex justify-between items-start
            hover:bg-white

            dark:hover:bg-[var(--gray-800)]
          "
        >
          <div>
            <div className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
              {n.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-1">
              {n.src} • {n.time}
            </div>
          </div>
          <button className="text-slate-500 dark:text-[var(--text-secondary)] text-sm">
            Read
          </button>
        </li>
      ))}
    </ul>
  </aside>
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
      About {baseStock.name}
    </h3>

    <p className="text-sm leading-relaxed text-slate-700 dark:text-[var(--text-secondary)]">
      {baseStock.description}
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
          Aether Group
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
        <p className="font-semibold dark:text-[var(--text-primary)]">
          Bengaluru, India
        </p>
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
    <OrderEntryPage />
  </div>
</div>

)}

    </div>
  );
}
 export default StockDetails