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
} from "recharts";
import { FiShare2 } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { PieChart, Pie, Cell } from "recharts";
import logo from "../assets/mutualFund/sbi.webp";
import { useParams } from "react-router-dom";
import CandleChart from "../components/chart/CandleChart";

export default function IndicesDetails() {
  const { name } = useParams();

  // ---------------- MOCK STOCK DATA ----------------
  const baseStock = {
    name: name,
    symbol: "NIFTY50",
    price: 22485.6,
    marketCap: "₹1,95,200 Cr",
    pe: 23.5,
    pb: 3.25,
    beta: 1.02,
    dividendYield: "1.27%",
    launched: "22 April 1996",
    baseValue: "1000",
    totalCompanies: 50,
  };

  // ---------------- TIME SERIES ----------------
  const timeseries = useMemo(() => {
    const arr = [];
    let base = 22000;
    for (let i = 29; i >= 0; i--) {
      base += Math.sin(i / 3) * 20 + (Math.random() - 0.5) * 50;
      arr.push({
        x: `D-${i}`,
        price: Math.round(base * 100) / 100,
      });
    }
    return arr;
  }, []);

  // ---------------- UI STATE ----------------
  const [livePrice, setLivePrice] = useState(baseStock.price);
  const [isTicking] = useState(true);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");

  useEffect(() => {
    if (!isTicking) return;
    const id = setInterval(() => {
      setLivePrice(
        (p) => Math.round((p + (Math.random() - 0.48) * 20) * 100) / 100
      );
    }, 1400);
    return () => clearInterval(id);
  }, [isTicking]);

  const pctChange =
    Math.round(((livePrice - baseStock.price) / baseStock.price) * 10000) / 100;

  const areaData = timeseries.map((d) => ({ name: d.x, price: d.price }));

  // ---------------- PERFORMANCE TABLE ----------------
  const companies = [
    {
      name: "Reliance Industries",
      weight: "10.45%",
      change: "+1.2%",
      mcap: "₹19,21,233 Cr",
      sector: "Refineries",
    },
    {
      name: "TCS",
      weight: "9.80%",
      change: "+0.8%",
      mcap: "₹14,88,950 Cr",
      sector: "It-Software",
    },
    {
      name: "HDFC Bank",
      weight: "8.10%",
      change: "-0.4%",
      mcap: "₹11,22,892 Cr",
      sector: "Bank",
    },
    {
      name: "ICICI Bank",
      weight: "7.35%",
      change: "+1.1%",
      mcap: "₹7,88,320 Cr",
      sector: "Bank",
    },
    {
      name: "Infosys",
      weight: "6.85%",
      change: "+0.9%",
      mcap: "₹6,48,233 Cr",
      sector: "It-Software",
    },
    {
      name: "Hindustan Unilever",
      weight: "4.90%",
      change: "-0.2%",
      mcap: "₹5,32,991 Cr",
      sector: "Industralist",
    },
    {
      name: "ITC",
      weight: "4.30%",
      change: "+1.4%",
      mcap: "₹4,51,002 Cr",
      sector: "Industralist",
    },
    {
      name: "L&T",
      weight: "4.00%",
      change: "+0.7%",
      mcap: "₹4,12,550 Cr",
      sector: "It-Software",
    },
    {
      name: "Bharti Airtel",
      weight: "3.85%",
      change: "+1.8%",
      mcap: "₹3,92,221 Cr",
      sector: "Telecom-Service",
    },
    {
      name: "SBI",
      weight: "3.60%",
      change: "-0.6%",
      mcap: "₹3,45,890 Cr",
      sector: "Bank",
    },
    {
      name: "Bajaj Finance",
      weight: "3.10%",
      change: "+0.3%",
      mcap: "₹3,22,441 Cr",
      sector: "Finance",
    },
    {
      name: "Kotak Bank",
      weight: "2.85%",
      change: "+0.5%",
      mcap: "₹3,12,002 Cr",
      sector: "Bank",
    },
    {
      name: "Wipro",
      weight: "2.35%",
      change: "-1.2%",
      mcap: "₹2,85,200 Cr",
      sector: "It-Software",
    },
    {
      name: "NTPC",
      weight: "2.10%",
      change: "+2.1%",
      mcap: "₹2,55,780 Cr",
      sector: "Energy",
    },
    {
      name: "Tata Steel",
      weight: "1.90%",
      change: "-0.8%",
      mcap: "₹2,12,340 Cr",
      sector: "Industralist",
    },
    {
      name: "Power Grid",
      weight: "1.75%",
      change: "+0.2%",
      mcap: "₹1,92,225 Cr",
      sector: "Energy",
    },
    {
      name: "JSW Steel",
      weight: "1.60%",
      change: "+1.1%",
      mcap: "₹1,85,002 Cr",
      sector: "Industralist",
    },
    {
      name: "Sun Pharma",
      weight: "1.50%",
      change: "-0.3%",
      mcap: "₹1,74,221 Cr",
      sector: "Pharmaceutical",
    },
    {
      name: "UltraTech Cement",
      weight: "1.40%",
      change: "+0.9%",
      mcap: "₹1,62,900 Cr",
      sector: "Industralist",
    },
    {
      name: "Tech Mahindra",
      weight: "1.35%",
      change: "+1.5%",
      mcap: "₹1,52,500 Cr",
      sector: "It-Software",
    },
    // 25 companies already; keeping as-is
  ];

  const perPage = 8;
  const paginated = companies.slice((page - 1) * perPage, page * perPage);

  // ---------------- SECTOR DATA (Pie Chart) ----------------
  const sectorData = [
    { name: "Financials", value: 33 },
    { name: "IT", value: 15 },
    { name: "Energy", value: 12 },
    { name: "FMCG", value: 10 },
    { name: "Pharma", value: 8 },
    { name: "Auto", value: 7 },
    { name: "Metals", value: 5 },
    { name: "Others", value: 10 },
  ];

  const colors = [
    "#0ea5e9",
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#8b5cf6",
    "#94a3b8",
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-[var(--app-bg)] dark:to-[var(--app-bg)] pt-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <header
          className="
    bg-white/70 backdrop-blur-sm border border-white/40
    rounded-2xl p-4 sm:p-6 shadow-md

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ================= LEFT ================= */}
            <div className="flex flex-col gap-4 flex-shrink-0">
              {/* Logo + Name */}
              <div className="flex items-center gap-4">
                <img
                  src={logo}
                  alt="logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow"
                />

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold capitalize text-slate-900 dark:text-[var(--text-primary)]">
                    {name}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
                    {baseStock.symbol}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[var(--text-primary)]">
                  ₹{livePrice.toFixed(2)}
                </h2>

                <span
                  className={`px-3 py-1 rounded-md text-sm font-semibold ${
                    pctChange >= 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-rose-500/20 dark:text-rose-400"
                  }`}
                >
                  {pctChange >= 0 ? "+" : ""}
                  {pctChange}%
                </span>
              </div>
            </div>

            {/* ================= MIDDLE (STATS) ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center flex-1">
              {[
                ["Prev Close", `₹${baseStock.prevClose}`],
                ["Open", `₹${baseStock.open}`],
                ["1D Range", `₹${baseStock.low} - ₹${baseStock.high}`],
                ["52W High", `₹${baseStock.week52High}`],
                ["52W Low", `₹${baseStock.week52Low}`],
                ["Volume", baseStock.volume],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="text-sm text-gray-600 dark:text-[var(--text-secondary)]"
                >
                  <p className="font-semibold">{label}</p>
                  <p className="text-slate-900 dark:text-[var(--text-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ================= RIGHT (ACTIONS) ================= */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {/* Buy / Sell */}
              <div className="grid grid-cols-2 gap-3">
                <button className="w-full px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                  Buy
                </button>
                <button className="w-full px-6 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700">
                  Sell
                </button>
              </div>

              {/* Share + Save */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="
            px-6 py-2 rounded-xl flex items-center justify-center gap-2
            bg-white border border-slate-200 hover:shadow
            dark:bg-[var(--white-5)]
            dark:border-[var(--border-color)]
            dark:text-[var(--text-primary)]
          "
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        `Check ${baseStock.name} price: ₹${livePrice}`
                      )}`
                    )
                  }
                >
                  <FiShare2 />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={() => setSaved(!saved)}
                  className={`px-6 py-2 rounded-xl flex items-center justify-center gap-2 ${
                    saved
                      ? "bg-emerald-600 text-white"
                      : `
                bg-white border border-slate-200
                dark:bg-[var(--white-5)]
                dark:border-[var(--border-color)]
                dark:text-[var(--text-primary)]
              `
                  }`}
                >
                  <AiOutlineStar />
                  <span className="hidden sm:inline">
                    {saved ? "Saved" : "Save"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* QUICK INDEX METRICS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "P/E Ratio", value: baseStock.pe },
            { label: "P/B Ratio", value: baseStock.pb },
            { label: "Dividend Yield", value: baseStock.dividendYield },
            { label: "Beta", value: baseStock.beta },
          ].map((m, i) => (
            <div
              key={i}
              className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/40 shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)] "
            >
              <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] ">
                {m.label}
              </p>
              <p className="text-lg font-semibold dark:text-[var(--text-primary)] ">
                {m.value}
              </p>
            </div>
          ))}
        </section>

        {/* SECTOR CHART */}
        <section className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl p-6 shadow-md dark:bg-[var(--white-10)] dark:border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-[var(--text-primary)] ">
            Sector Allocation
          </h2>
          <div className="flex justify-center">
            <PieChart width={260} height={260}>
              <Pie
                data={sectorData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={60}
              >
                {sectorData.map((_, index) => (
                  <Cell key={index} fill={colors[index]} />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            {sectorData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ background: colors[i] }}
                ></span>
                <p className="text-slate-700 dark:text-[var(--text-secondary)]">
                  {s.name}: {s.value}%
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CHART */}
        <section
          className="
    bg-white/70 backdrop-blur-sm border border-white/40
    rounded-2xl p-6 shadow-md

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
        >
          <h2
            className="
      text-lg font-semibold mb-4
      text-slate-900 dark:text-[var(--text-primary)]
    "
          >
            Price Chart
          </h2>

          <div className="flex items-center justify-between mb-4">
            {/* Timeframe selector intentionally commented (unchanged) */}

            <div
              className="
        text-sm
        text-slate-500 dark:text-[var(--text-secondary)]
      "
            >
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <CandleChart height={350} />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div
              className="
        bg-white shadow-sm rounded-xl p-3

        dark:bg-[var(--white-5)]
        dark:border dark:border-[var(--border-color)]
      "
            >
              <p
                className="
          text-xs
          text-slate-500 dark:text-[var(--text-secondary)]
        "
              >
                52 Week High
              </p>
              <p
                className="
          font-semibold
          text-slate-900 dark:text-[var(--text-primary)]
        "
              >
                ₹{22000 + 800}
              </p>
            </div>

            <div
              className="
        bg-white shadow-sm rounded-xl p-3

        dark:bg-[var(--white-5)]
        dark:border dark:border-[var(--border-color)]
      "
            >
              <p
                className="
          text-xs
          text-slate-500 dark:text-[var(--text-secondary)]
        "
              >
                52 Week Low
              </p>
              <p
                className="
          font-semibold
          text-slate-900 dark:text-[var(--text-primary)]
        "
              >
                ₹{22000 - 900}
              </p>
            </div>
          </div>
        </section>

        {/* INDEX OVERVIEW */}
        <section className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl p-6 shadow-md dark:bg-[var(--white-10)] dark:border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-[var(--text-primary)]  mb-3">
            Index Overview
          </h2>
          <p className="text-slate-700 dark:text-[var(--text-secondary)] text-sm leading-relaxed">
            {name} tracks the performance of 50 large-cap companies listed on
            the National Stock Exchange (NSE). It represents key sectors of the
            Indian economy including Financials, IT, FMCG, Energy, and more.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-[var(--text-secondary)] text-xs">
                Launched
              </p>
              <p className="font-medium dark:text-[var(--text-primary)] ">
                {baseStock.launched}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-[var(--text-secondary)] text-xs">
                Base Value
              </p>
              <p className="font-medium dark:text-[var(--text-primary)] ">
                {baseStock.baseValue}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-[var(--text-secondary)] text-xs">
                Companies
              </p>
              <p className="font-medium dark:text-[var(--text-primary)] ">
                {baseStock.totalCompanies}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-[var(--text-secondary)] text-xs">
                Methodology
              </p>
              <p className="font-medium dark:text-[var(--text-primary)] ">
                Free-Float Market Cap
              </p>
            </div>
          </div>
        </section>

        {/* PERFORMANCE TABLE */}
        <section
          className="
    bg-white/70 backdrop-blur-sm border border-white/40
    rounded-2xl p-4 sm:p-6 shadow-md
    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  "
        >
          <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-[var(--text-primary)]">
            Index Constituents
          </h2>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b text-left text-white bg-slate-500 dark:bg-[var(--gray-800)]">
                  <th className="py-2 w-[40%] pl-5">Company</th>
                  <th className="py-2 w-[15%]">Weight</th>
                  <th className="py-2 w-[15%]">Change</th>
                  <th className="py-2 w-[15%]">Market Cap</th>
                  <th className="py-2 w-[15%]">Sector</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((c, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-none text-slate-800 font-medium dark:text-[var(--text-primary)]"
                  >
                    <td className="py-3 truncate pl-5">{c.name}</td>
                    <td className="py-3">{c.weight}</td>
                    <td
                      className={`py-3 font-semibold ${
                        c.change.includes("+")
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-rose-400"
                      }`}
                    >
                      {c.change}
                    </td>
                    <td className="py-3">{c.mcap}</td>
                    <td className="py-3">{c.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE CARDS ================= */}
          <div className="md:hidden space-y-3">
            {paginated.map((c, idx) => (
              <div
                key={idx}
                className="
          rounded-xl border p-4
          bg-white dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
              >
                {/* Top */}
                <div className="flex justify-between items-start gap-3">
                  <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                    {c.name}
                  </p>

                  <span
                    className={`text-sm font-semibold ${
                      c.change.includes("+")
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-rose-400"
                    }`}
                  >
                    {c.change}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                      Weight
                    </p>
                    <p className="font-medium">{c.weight}</p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                      Market Cap
                    </p>
                    <p className="font-medium">{c.mcap}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                      Sector
                    </p>
                    <p className="font-medium">{c.sector}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            {Array.from({ length: Math.ceil(companies.length / perPage) }).map(
              (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-1 rounded-lg text-sm font-medium border transition ${
                    page === i + 1
                      ? "bg-slate-900 text-white dark:bg-[var(--text-primary)] dark:text-[var(--app-bg)]"
                      : "bg-white text-slate-700 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>
        </section>

        {/* more section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Historical Returns */}
          <div className="bg-linear-to-b from-white/80 to-slate-50 dark:from-[var(--white-10)] dark:to-[var(--white-10)] backdrop-blur-sm border border-white/30 dark:border-[var(--border-color)] rounded-2xl p-6 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 dark:text-[var(--text-primary)]  mb-4">
              Historical Returns
            </h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[
                { label: "1 Year", value: "14.2%" },
                { label: "3 Year", value: "32.5%" },
                { label: "5 Year", value: "68.1%" },
                { label: "10 Year", value: "145.6%" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:border dark:bg-[var(--white-10)] dark:border-[var(--border-color)] rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150"
                >
                  <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                    {r.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)] mt-1">
                    {r.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Movers */}
          <div className="bg-linear-to-b from-white/80 to-slate-50 dark:from-[var(--white-10)] dark:to-[var(--white-10)] dark:border-[var(--border-color)] backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 dark:text-[var(--text-primary)]  mb-4">
              Top Movers Today
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-[var(--border-color)]">
              {[
                { name: "Reliance Industries", change: "+1.2%" },
                { name: "TCS", change: "+0.8%" },
                { name: "ICICI Bank", change: "+1.1%" },
                { name: "Infosys", change: "+0.9%" },
                { name: "Bharti Airtel", change: "+1.8%" },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-md px-2 transition duration-150"
                >
                  <p className="text-slate-800 font-medium dark:text-[var(--text-primary)] ">
                    {c.name}
                  </p>
                  <p
                    className={`font-semibold ${
                      c.change.includes("+")
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {c.change}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-28" />
      </div>
    </div>
  );
}
