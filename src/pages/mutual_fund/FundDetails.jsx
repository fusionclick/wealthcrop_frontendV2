import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";
import { MF_DATA } from "../../components/chart/mfNavData";
import { FiShare2 } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { MdOutlineInfo } from "react-icons/md";
import { useParams } from "react-router-dom";
import DonutChart from "../../components/DonutChart";
import logo from "../../assets/mutualFund/sbi.webp"
import MFChart from "../../components/chart/MFChart";
import MutualFundInvestPage from "./MutualFundInvestPage";
import Riskometer from "../../components/Riskometer";
import { postApi } from "../../api/api";
import { useQuery } from "@tanstack/react-query";
import PageLoader from "../../components/PageLoader";
import FundDetailsPageSkeleton from "../../components/ui/skeleton/main/FundDetailsPageSkeleton";
import { nodeUrl } from "../../utils/nodeApi";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const FundDetails = () => {
  const { isin } = useParams();
  const { code } = useParams();
  const [hideChart, setHideChart] = useState(false);

  const fund = {
    name: "SBI Gold Direct Plan Growth",
    category: "Gold",
    risk: "Very High Risk",
    rating:"4.4",
    nav: 37.67,
    fundSize: "₹8,456 Cr",
    expense: "0.35%",
    minSip: 500,
    minLumpsum: 1000,
    annualRates: { 1: 0.10, 3: 0.27, 5: 0.18 },
    holdings: [{ name: "SBI Gold ETF", sector: "Bank", instrument: "Mutual Fund", asset: 100.18 }],
  };

  const [mode, setMode] = useState("sip");
  const [sipAmt, setSipAmt] = useState(5000);
  const [lumpAmt, setLumpAmt] = useState(10000);
  const [duration, setDuration] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverIndex2, setHoverIndex2] = useState(null);
  const [saved, setSaved] = useState(false);
  
   const [fundsList, setFundsList] = useState([])
    const [page, setPage] = useState(0)
    const limit = 10;
  
    const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");
    const detailsUrl = nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details");
  
  const { data: details, isLoading } = useQuery({
    queryKey: ["FUND_FULL_DETAILS", isin, code],
    queryFn: async () => 
        postApi(url, {isin: isin }),
    enabled: !!isin && !!code,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });


    const { data: chartData, isLoading: loading2 } = useQuery({
    queryKey: ["CHART_DETAILS", isin, code],
    queryFn: async () => 
        postApi(detailsUrl, { isin: isin, scheme_code: code }),
    enabled: !!isin && !!code,
    // staleTime: 1000 * 60 * 2, // 2 min
  });

  // const { data: details, isLoading } = useQuery({
  //   queryKey: ["FUND_FULL_DETAILS", isin, code],
  //   queryFn: async () => {
  //     const [res1, res2] = await Promise.all([
  //       postApi(url, { source: "demo", scheme_isin: isin }),
  //       postApi(url2, { source: "demo", bse_scheme_code: code }),
  //     ]);

  //     return {
  //       details: res1,
  //       meta: res2,
  //     };
  //   },
  //   enabled: !!isin && !!code,
  //   staleTime: 1000 * 60 * 2, // 2 min
  // });
  
    useEffect(() => {
      console.log("Fund Details", details);
      console.log("Chart Details", chartData);
      // console.log("Fund Details2", details2);
      // const mergedLists = [
      //   ...(details?.details?.data?.lists || []),
      //   ...(details?.meta?.data?.lists || []),
      // ];

      setFundsList(details?.data?.lists?.[0] || []);

    }, [details,chartData]);
    
  function futureValueSIP(P, annualR, years) {
    const i = annualR / 12;
    const n = years * 12;
    if (i === 0) return P * n;
    return P * (Math.pow(1 + i, n) - 1) / i;
  }

  function futureValueLumpsum(PV, annualR, years) {
    return PV * Math.pow(1 + annualR, years);
  }

  function percentGain(fv, invested) {
    if (invested === 0) return 0;
    return ((fv - invested) / invested) * 100;
  }

  const annualR_for_duration = fund.annualRates[duration] ?? fund.annualRates[3];

  const totalSIPInvested = sipAmt * 12 * duration;
  const sipFV = Math.round(futureValueSIP(sipAmt, annualR_for_duration, duration));
  const sipGainPct = percentGain(sipFV, totalSIPInvested);

  const lumpResults = [1, 3, 5].map((yr) => {
    const r = fund.annualRates[yr] ?? fund.annualRates[3];
    const invested = lumpAmt;
    const fv = Math.round(futureValueLumpsum(lumpAmt, r, yr));
    const gainPct = percentGain(fv, invested);
    return { yr, invested, fv, gainPct, r };
  });

  const selectedLumpRate = fund.annualRates[duration] ?? fund.annualRates[3];
  const lumpFV_selected = Math.round(futureValueLumpsum(lumpAmt, selectedLumpRate, duration));
  const lumpGainPct_selected = percentGain(lumpFV_selected, lumpAmt);
  

  const data = [
    { label: "Technology", value: 35.5, color: "#15B7E6" },
    { label: "Industrials", value: 18.5, color: "#3F61FF" },
    { label: "Others", value: 5.9, color: "#FFB44C" },
    { label: "Healthcare", value: 4.2, color: "#C45A8C" },
    { label: "Financial", value: 3.0, color: "#FF5C73" },
    { label: "Real Estate ", value: 2.3, color: "#B8C4FF" },
    { label: "Materials", value: 2.2, color: "#FFE863" },
  ];

  const data2 = [
    { label: "Commodities", value: 98.6, color: "#C5F7B1" },
    { label: "Cash", value: 1.4, color: "#15B7E6" },
  ];

  const timeseries = useMemo(() => {
    const arr = [];
    let base = 1420;
    for (let i = 29; i >= 0; i--) {
      base += Math.sin(i / 3) * 5 + (Math.random() - 0.5) * 10;
      arr.push({ x: `D-${i}`, price: Math.round(base * 100) / 100 });
    }
    return arr;
  }, []);
  const areaData = timeseries.map((d) => ({ name: d.x, price: d.price }));

  const baseStock = {
    name: "AetherTech Solutions Ltd.",
    symbol: "AETHER",
    price: 1489.6,
    week52High: 1750,
    week52Low: 820,
  };

   const shareWhatsApp = () => {
    const msg = `Check ${baseStock.name } (${baseStock.symbol}) price ₹${livePrice} (${pctChange}%).`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const [livePrice, setLivePrice] = useState(baseStock.price);
  const [buyModal, setBuyModal] = useState(false)
  const pctChange = Math.round(((livePrice - baseStock.price) / baseStock.price) * 10000) / 100;
   const openBuy = () => setBuyModal(true);

  const closeModal = () => setBuyModal(false);



//   const fundamentals = [
//   { label: "Top 5", value: "45%" },
//   { label: "Top 20", value: "87%" },
//   { label: "P/E Ratio", value: "66.22" },
//   { label: "P/B Ratio", value: "9.00" },

//   { label: "Alpha", value: "4.56" },
//   { label: "Beta", value: "0.92" },
//   { label: "Sharpe", value: "1.10" },
//   { label: "Sortino", value: "1.37" },
// ];

const ratios = fundsList?.advancedRatios;

const fundamentals = [
  { label: "Top 5", value: ratios?.top5 },
  { label: "Top 20", value: ratios?.top20 },
  { label: "P/E Ratio", value: ratios?.peRatio },
  { label: "P/B Ratio", value: ratios?.pbRatio },
  { label: "Alpha", value: ratios?.alpha },
  { label: "Beta", value: ratios?.beta },
  { label: "Sharpe", value: ratios?.sharpe },
  { label: "Sortino", value: ratios?.sortino },
];

const advancedDefinitions = {
  "Top 5": "Represents the combined portfolio weight or contribution of the top 5 holdings. Higher concentration indicates more exposure to a small group of assets.",
  "Top 20": "Indicates the cumulative weight or contribution of the top 20 assets. Shows how diversified the broader portfolio allocation is.",
  "P/E Ratio": "Price-to-Earnings Ratio shows how much investors are willing to pay for each unit of earnings. A higher P/E may indicate growth expectations.",
  "P/B Ratio": "Price-to-Book Ratio compares a company's market price to its book value. A lower P/B can indicate undervaluation or financial stability.",
  "Alpha": "Alpha measures the excess return generated by an investment relative to its benchmark. Positive alpha means outperformance.",
  "Beta": "Beta measures a stock’s volatility relative to the market. A beta above 1 indicates higher volatility; below 1 indicates more stability.",
  "Sharpe": "Sharpe Ratio evaluates risk-adjusted returns by comparing excess returns to volatility. Higher Sharpe indicates better risk-adjusted performance.",
  "Sortino": "Sortino Ratio measures risk-adjusted returns but only considers downside volatility. It is more accurate for evaluating downside risk.",
};

const [activeInfo, setActiveInfo] = useState(null); 

  if (isLoading) return <FundDetailsPageSkeleton />;  

  return (

    <div className="w-full bg-gray-50 dark:bg-[var(--app-bg)] text-[#1A1A1A] py-10 px-5 lg:px-24 space-y-10">
      {/* HEADER */}
 <header className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"> 

  {/* LEFT MAIN SECTION */}
  <div className="
  col-span-2
  bg-[var(--white-10)]
  backdrop-blur-sm
  dark:border border-[var(--border-color)]
  rounded-2xl p-6 shadow-md
">

  {/* TOP: Logo + Title + Save/Share */}
  <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">

    {/* LOGO + TITLE */}
    <div className="flex items-start gap-4 flex-1 min-w-0">
      <img
        src={logo}
        alt="logo"
        className="w-16 h-16 rounded-xl object-cover shadow"
      />

      <div className="flex-1 min-w-0">

        {/* FUND NAME */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] capitalize break-words whitespace-normal">
          {fundsList?.name}
        </h1>

        {/* CATEGORY + RISK */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <span className="text-sm text-[var(--text-secondary)]">
            {fund.category}
          </span>

          <span className="
            px-2 py-1 rounded-full text-xs
            bg-amber-500/10 text-amber-400
            border border-amber-500/20
          ">
            {fundsList?.risk}
          </span>
        </div>

        {/* SAVE + SHARE (SMALL) */}
        <div className="flex md:hidden gap-3 mt-3">
          <button
            onClick={() => setSaved(!saved)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition
              ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--white-5)] border border-[var(--border-color)] text-[var(--text-secondary)]"
              }`}
          >
            <AiOutlineStar />
          </button>

          <button
            onClick={shareWhatsApp}
            className="
              flex items-center gap-2 px-3 py-2 rounded-xl
              bg-[var(--white-5)]
              border border-[var(--border-color)]
              text-[var(--text-secondary)]
              hover:bg-[var(--white-10)]
            "
          >
            <FiShare2 />
          </button>
        </div>

      </div>
    </div>

    {/* SAVE + SHARE (MD+) */}
    <div className="hidden md:flex md:items-center gap-3">
      <button
        onClick={() => setSaved(!saved)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition
          ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-[var(--white-5)] border border-[var(--border-color)] text-[var(--text-secondary)]"
          }`}
      >
        <AiOutlineStar />
        <span>{saved ? "Saved" : "Save"}</span>
      </button>

      <button
        onClick={shareWhatsApp}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-[var(--white-5)]
          border border-[var(--border-color)]
          text-[var(--text-secondary)]
          hover:bg-[var(--white-10)]
        "
      >
        <FiShare2 />
        <span>Share</span>
      </button>
    </div>

  </div>

  {/* MIDDLE: Performance + Invest */}
  <div className="mt-5 flex flex-wrap items-center gap-6 justify-between">

    {/* PERFORMANCE */}
    <div>
      <div className="flex items-end gap-3">
        <h2 className="text-4xl font-extrabold text-emerald-500">
          {fundsList?.returns?.["3Y"]}%
          <span className="text-[var(--text-secondary)] text-sm font-medium ml-1">
            3Y annualized
          </span>
        </h2>

        <div
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            pctChange >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          +0.11%
          <span className="text-[var(--text-secondary)] text-sm font-medium ml-1">
            1D
          </span>
        </div>
      </div>
    </div>

    {/* INVEST */}
    <div className="flex gap-3 items-center flex-wrap">
      <button
        onClick={openBuy}
        className="
          px-5 py-2 rounded-xl
          bg-emerald-600 hover:bg-emerald-700
          text-white font-semibold shadow
        "
      >
        Invest Now
      </button>

      <div className="text-right text-sm text-[var(--text-secondary)]">
        <div>
          Nav:
          <span className="text-[var(--text-primary)] font-medium ml-1">
            {fundsList?.nav}
          </span>
        </div>
        <div>
          Fund size:
          <span className="text-[var(--text-primary)] font-medium ml-1">
            {fundsList?.fundSize}
          </span>
        </div>
      </div>
    </div>

  </div>
</div>


  {/* RIGHT MINI PANEL */}
 <aside
  className="
    bg-[var(--white-10)]
    backdrop-blur-sm
    dark:border border-[var(--border-color)]
    rounded-2xl p-4 shadow-md
    h-full mt-4 lg:mt-0
  "
>
  <div className="flex flex-col gap-4">

    {/* Expense Ratio */}
    <div className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-secondary)]">
        Expense Ratio
      </p>
      <p className="text-lg font-semibold text-[var(--text-primary)]">
        {fundsList?.expense ?? "--"}
      </p>
    </div>

    {/* 52W Range */}
    <div className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-secondary)]">
        52W Range
      </p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        ₹{fundsList?.week52Low ?? "--"} - ₹{fundsList?.week52High ?? "--"}
      </p>
    </div>

    {/* Analyst Rating */}
    <div className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-secondary)]">
        Analyst Rating
      </p>

      <div className="flex items-center gap-2">
        <div className="
          w-10 h-10 rounded-full
          bg-emerald-500 text-white
          flex items-center justify-center font-bold
        ">
          {fundsList?.rating}
        </div>

        <div className="text-sm text-[var(--text-primary)]">
          Strong Buy
        </div>
      </div>
    </div>

  </div>
</aside>


</header>


      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
  className="
    lg:col-span-2
    bg-white dark:bg-[var(--card-bg)]
    dark:border
    border-[var(--border-color)]
    rounded-2xl shadow-lg
    p-6
  "
>
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3 flex-wrap">
      <span
        className="
          text-sm
          text-gray-500
          dark:text-[var(--text-secondary)]
        "
      >
        Timeframe:
      </span>

      {["30D", "3M", "6M", "1Y", "3Y", "5Y", "10Y", "ALL"].map((tf) => (
        <button
          key={tf}
          onClick={() => setSelectedTimeframe(tf)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            selectedTimeframe === tf
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)]"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>

    <div
      className="
        text-sm
        text-gray-500
        dark:text-[var(--text-secondary)]
      "
    >
      Updated: {new Date().toLocaleTimeString()}
    </div>
  </div>

  <MFChart data={chartData?.data?.chartData
[selectedTimeframe]} height={320} />

  <div className="mt-4 grid grid-cols-2 gap-3">
    <div
      className="
        p-4 rounded-xl shadow-sm text-center
        bg-green-50 dark:bg-emerald-500/15
      "
    >
      <p
        className="
          text-xs
          text-gray-500 dark:text-[var(--text-secondary)]
        "
      >
        1-Year Return
      </p>
      <p
        className="
          font-semibold
          text-gray-900 dark:text-emerald-400
        "
      >
        12.5%
      </p>
    </div>

    <div
      className="
        p-4 rounded-xl shadow-sm text-center
        bg-orange-50 dark:bg-orange-500/15
      "
    >
      <p
        className="
          text-xs
          text-gray-500 dark:text-[var(--text-secondary)]
        "
      >
        Min. SIP
      </p>
      <p
        className="
          font-semibold
          text-gray-900 dark:text-[var(--text-primary)]
        "
      >
        ₹{fundsList?.minSip}
      </p>
    </div>
  </div>
</div>


        <aside className="bg-white/60 dark:bg-[var(--white-10)] backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-md dark:border border-[var(--border-color)]">
          <h4 className="text-lg font-semibold text-slate-900 mb-3 dark:text-[var(--text-primary)] ">
            Advanced Ratios
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {fundamentals.map((item, index) => (
              <div
                key={index}
                className="relative p-3 bg-white dark:bg-[var(--white-10)]  rounded-md shadow-sm border border-gray-100 dark:border dark:border-[var(--border-color)] cursor-pointer"
                onClick={() =>
                  setActiveInfo(activeInfo === index ? null : index)
                }
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">{item.label}</p>
                  <span className="text-gray-500 dark:text-[var(--text-secondary)] text-xs">
                    <MdOutlineInfo />
                  </span>
                </div>

                <p className="font-semibold mt-1 dark:text-[var(--text-primary)]">{item.value}</p>

                {activeInfo === index && (
                  <div className="absolute top-14 left-0 w-56 p-3 bg-white border border-gray-200 rounded-lg shadow-md text-xs text-gray-700 z-50">
                    {advancedDefinitions[item.label]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <span className="text-gray-500">
              <MdOutlineInfo />
            </span>
            <span>Click any metric to view its definition</span>
          </div>
        </aside>
      </div>

      {/* Return Calculator */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Return Calculator */}
        <div className="bg-white dark:bg-[var(--white-10)] dark:border border-[var(--border-color)] shadow-lg rounded-2xl p-6 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold dark:text-[var(--text-primary)]">Return Calculator</h2>
            {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition">
        Invest in Fund
      </button> */}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode("sip")}
              className={`px-4 py-2 rounded-full border font-medium ${
                mode === "sip"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              Monthly SIP
            </button>

            <button
              onClick={() => setMode("lumpsum")}
              className={`px-4 py-2 rounded-full border font-medium ${
                mode === "lumpsum"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              One-Time
            </button>
          </div>

          {mode === "sip" && (
            <div>
              <p className="font-semibold text-lg mb-2 dark:text-[var(--text-primary)]">
                ₹{sipAmt.toLocaleString()} per month
              </p>
              <input
                type="range"
                min={fund.minSip}
                max={50000}
                step={500}
                value={sipAmt}
                onChange={(e) => setSipAmt(Number(e.target.value))}
                className="w-full mb-4 "
              />

              <p className="text-gray-600 mb-2 dark:text-[var(--text-primary)]">
                Duration: {duration} year{duration > 1 ? "s" : ""}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mb-4"
              />

              <div className="mt-4 border-t pt-4 text-sm dark:text-[var(--text-secondary)]">
                <p>Total investment of ₹{totalSIPInvested.toLocaleString()}</p>
                <p className="font-semibold mt-2">
                  Would have become{" "}
                  <span className="text-green-600">
                    ₹{sipFV.toLocaleString()} ({sipGainPct.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          )}

          {mode === "lumpsum" && (
            <div>
              <p className="font-semibold text-lg mb-2 dark:text-[var(--text-primary)]">
                ₹{lumpAmt.toLocaleString()}
              </p>
              <input
                type="range"
                min={fund.minLumpsum}
                max={200000}
                step={500}
                value={lumpAmt}
                onChange={(e) => setLumpAmt(Number(e.target.value))}
                className="w-full mb-4"
              />

              <p className="text-gray-600 mb-2 dark:text-[var(--text-primary)]">
                Duration: {duration} year{duration > 1 ? "s" : ""}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mb-4"
              />

              <div className="mt-4 border-t pt-4 text-sm dark:text-[var(--text-secondary)]">
                <p>Investment of ₹{lumpAmt.toLocaleString()}</p>
                <p className="font-semibold mt-2">
                  Would have become{" "}
                  <span className="text-green-600">
                    ₹{lumpFV_selected.toLocaleString()} (
                    {lumpGainPct_selected.toFixed(2)}%)
                  </span>
                </p>

                {/* <div className="mt-4">
            <p className="text-gray-600 mb-2 font-medium">Breakdown</p>
            {lumpResults.map((res) => (
              <div key={res.yr} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <div>
                  <div className="font-medium">{res.yr} year{res.yr > 1 ? "s" : ""}</div>
                  <div className="text-gray-500">Annual rate: {(res.r * 100).toFixed(2)}%</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{res.fv.toLocaleString()}</div>
                  <div className="text-green-600">{res.gainPct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div> */}
              </div>
            </div>
          )}
        </div>

        {/* Minimum Investments */}
        <div className="bg-white dark:bg-[var(--white-10)] dark:border border-[var(--border-color)] shadow-lg rounded-2xl p-6 flex-1 h-80">
          <h2 className="text-2xl font-semibold mb-6 dark:text-[var(--text-primary)]">
            Minimum Investment Amounts
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">Min. for 1st investment</span>
              <span className="font-semibold dark:text-[var(--text-primary)]">₹5,000</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">
                Min. for 2nd investment onwards
              </span>
              <span className="font-semibold dark:text-[var(--text-primary)]">₹1,000</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">Min. for SIP</span>
              <span className="font-semibold dark:text-[var(--text-primary)]">₹{fundsList?.minSip}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Holdings */}
     <div
  className="
    bg-[var(--white-10)]
    border border-[var(--border-color)]
    shadow-lg rounded-2xl p-6 max-w-4xl
  "
>
  <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">
    Holdings
  </h2>

  <div className="overflow-x-auto">
    <table className="w-full border-collapse">

      {/* TABLE HEADER */}
      <thead>
        <tr
          className="
            text-left
            bg-[var(--white-5)]
            border-b border-[var(--border-color)]
          "
        >
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
            Name
          </th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] hidden lg:table-cell">
            Sector
          </th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] hidden lg:table-cell">
            Instrument
          </th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
            Assets
          </th>
        </tr>
      </thead>

      {/* TABLE BODY */}
      <tbody>
        {fundsList?.holdings?.map((h, i) => (
          <tr
            key={i}
            className="
              border-b border-[var(--border-color)]
              hover:bg-[var(--white-5)]
              transition
            "
          >
            <td className="py-3 px-4 text-[var(--text-primary)]">
              {h.name}
            </td>

            <td className="py-3 px-4 text-[var(--text-secondary)] hidden lg:table-cell">
              {h.sector}
            </td>

            <td className="py-3 px-4 text-[var(--text-secondary)] hidden lg:table-cell">
              {h.instrument}
            </td>

            <td className="py-3 px-4 text-[var(--text-secondary)]">
              {h.asset}%
            </td>
          </tr>
        ))}
      </tbody>

    </table>
  </div>
</div>


      {/* Holdings Analysis - Donut Charts */}
      <div className="lg:flex gap-12 items-start mt-10 hidden">

  {/* Equity / Debt / Cash Split */}
  <div className="space-y-3 w-1/2">

    <h2 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">
      Holding Analysis
    </h2>

    <p className="mb-3 text-[var(--text-secondary)]">
      Equity / Debt / Cash Split
    </p>

    {data2.map((item, index) => {
      const isActive = index === hoverIndex;

      return (
        <div
          key={index}
          className={`flex items-center gap-3 cursor-pointer transition-opacity duration-300
            ${
              hoverIndex === null || isActive
                ? "opacity-100"
                : "opacity-30"
            }`}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Color dot */}
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: item.color }}
          />

          {/* Label */}
          <span
            className={`text-[var(--text-primary)] ${
              isActive ? "font-semibold" : ""
            }`}
          >
            {item.label}
          </span>

          {/* Percentage */}
          <span className="text-[var(--text-secondary)]">
            {item.value}%
          </span>
        </div>
      );
    })}
  </div>

  {/* Donut Chart */}
  <div className="w-1/2">
    <DonutChart
      data={data2}
      hoverIndex={hoverIndex}
      setHoverIndex={setHoverIndex}
    />
  </div>

</div>


      {/* Equity Sector Donut */}
      <div className="lg:flex gap-12 items-start mt-10 hidden">

  {/* Equity Sector Allocation */}
  <div className="space-y-3 w-1/2">

    <h2 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">
      Equity Sector Allocation
    </h2>

    {data.map((item, index) => {
      const isActive = index === hoverIndex2;

      return (
        <div
          key={index}
          className={`flex items-center gap-3 cursor-pointer transition-opacity duration-300
            ${
              hoverIndex2 === null || isActive
                ? "opacity-100"
                : "opacity-30"
            }`}
          onMouseEnter={() => setHoverIndex2(index)}
          onMouseLeave={() => setHoverIndex2(null)}
        >
          {/* Color Dot */}
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: item.color }}
          />

          {/* Label */}
          <span
            className={`text-[var(--text-primary)] ${
              isActive ? "font-semibold" : ""
            }`}
          >
            {item.label}
          </span>

          {/* Percentage */}
          <span className="text-[var(--text-secondary)]">
            {item.value}%
          </span>
        </div>
      );
    })}
  </div>

  {/* Donut Chart */}
  <div className="w-1/2">
    <DonutChart
      data={data}
      hoverIndex={hoverIndex2}
      setHoverIndex={setHoverIndex2}
    />
  </div>

</div>


      {/* Returns & Rankings */}
      <div
  className="
    bg-[var(--white-10)]
    backdrop-blur-lg
    shadow-xl
    rounded-3xl
    p-6
    max-w-4xl
    mt-10
    overflow-x-auto
    border border-[var(--border-color)]
  "
>
  <h2 className="text-2xl font-bold mb-5 text-[var(--text-primary)] flex items-center gap-2">
    📊 Returns & Rankings
  </h2>

  <table className="min-w-full table-auto border-collapse text-sm sm:text-base">

    {/* ===== HEADER ===== */}
    <thead>
      <tr
        className="
          border-y border-[var(--border-color)]
          bg-[var(--white-5)]
        "
      >
        <th
          colSpan={1}
          className="py-3 px-4 font-semibold text-left text-[var(--text-secondary)]"
        >
          Category:{" "}
          <span className="text-sky-400 font-bold">
            Commodities Gold
          </span>
        </th>

        <th className="py-3 px-4 font-semibold text-left text-emerald-400">
          Annualised Returns
        </th>

        <th className="py-3 px-4 font-semibold text-left text-[var(--text-secondary)]">
          Absolute Returns
        </th>
      </tr>

      <tr
        className="
          text-xs sm:text-sm
          bg-[var(--white-5)]
          border-b border-[var(--border-color)]
        "
      >
        <th className="py-2 px-4"></th>
        <th className="py-2 px-4 text-[var(--text-secondary)]">1Y</th>
        <th className="py-2 px-4 text-[var(--text-secondary)]">3Y</th>
        <th className="py-2 px-4 text-[var(--text-secondary)]">5Y</th>
        <th className="py-2 px-4 text-[var(--text-secondary)]">All</th>
      </tr>
    </thead>

    {/* ===== BODY ===== */}
    <tbody>

      {/* Fund Returns */}
      <tr className="hover:bg-[var(--white-5)] transition">
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
          Fund returns
        </td>
        <td className="py-3 px-4 font-semibold text-emerald-400">60.3%</td>
        <td className="py-3 px-4 font-semibold text-sky-400">30.7%</td>
        <td className="py-3 px-4 font-semibold text-indigo-400">18.0%</td>
        <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">
          10.1%
        </td>
      </tr>

      {/* Category Average */}
      <tr
        className="
          hover:bg-[var(--white-5)]
          transition
          border-y border-[var(--border-color)]
        "
      >
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
          Category average
        </td>
        <td className="py-3 px-4 text-emerald-400">60.2%</td>
        <td className="py-3 px-4 text-sky-400">30.3%</td>
        <td className="py-3 px-4 text-indigo-400">17.9%</td>
        <td className="py-3 px-4 text-[var(--text-secondary)]">NA</td>
      </tr>

      {/* Rank */}
      <tr className="hover:bg-[var(--white-5)] transition">
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
          Rank within category
        </td>

        <td className="py-3 px-4">
          <span className="
            bg-emerald-500/15
            text-emerald-400
            px-3 py-1 rounded-full font-bold
          ">
            7
          </span>
        </td>

        <td className="py-3 px-4">
          <span className="
            bg-sky-500/15
            text-sky-400
            px-3 py-1 rounded-full font-bold
          ">
            4
          </span>
        </td>

        <td className="py-3 px-4">
          <span className="
            bg-indigo-500/15
            text-indigo-400
            px-3 py-1 rounded-full font-bold
          ">
            3
          </span>
        </td>

        <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">
          NA
        </td>
      </tr>

    </tbody>
  </table>
</div>


      {/* Expense Ratio, Exit Load & Tax */}
     <div
  className="
    bg-[var(--white-10)]
    shadow-md
    rounded-2xl
    p-6
    max-w-3xl
    mt-10
    border border-[var(--border-color)]
    space-y-5
  "
>
  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
    Expense Ratio, Exit Load & Tax
  </h2>

  {/* Expense Ratio */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Expense Ratio
    </p>
    <p className="text-[var(--text-primary)] mt-1">
      0.10%
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      Inclusive of GST
    </p>
  </div>

  {/* Exit Load */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Exit Load
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      Exit load of 1% if redeemed within 15 days.
    </p>
  </div>

  {/* Stamp Duty */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Stamp Duty
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      0.005% (from July 1st, 2020)
    </p>
  </div>

  {/* Tax Implication */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Tax Implication
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">
      If you redeem within two years, returns are taxed as per your Income
      Tax slab. If you redeem after two years, returns exceeding ₹1.25
      lakh in a financial year are taxed at 12.5%.
    </p>
  </div>
</div>

<Riskometer risk = {fundsList?.risk} />



          {
            buyModal && (
             <div
  onClick={closeModal}
  className="
   fixed inset-0 z-50 
flex items-start lg:items-center justify-center
bg-black/50
pt-5 p-4
  "
>
  <div
    onClick={(e) => e.stopPropagation()}
    className="
      w-full max-w-2xl h-[86vh] lg:h-[90vh]
      bg-white
      dark:bg-[var(--card-bg)]
      backdrop-blur-lg
      rounded-2xl
      shadow-2xl
      overflow-y-auto
      p-6
      relative
      dark:border border-[var(--border-color)]
    "
  >
    {/* Close button */}
    <button
      onClick={closeModal}
      className="
        absolute top-5 right-6
        text-3xl
        text-[var(--text-secondary)]
        hover:text-[var(--text-primary)]
        transition
        cursor-pointer
      "
      aria-label="Close modal"
    >
      ×
    </button>

              <MutualFundInvestPage fundsList={fundsList} setBuyModal={setBuyModal}  />
  </div>
</div>

            )
          }


    </div>
  );
};

export default FundDetails;
