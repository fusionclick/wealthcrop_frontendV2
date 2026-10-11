import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sipSeries, sipForGoal } from "../../utils/calculators";

// Client 2026-10-09 — "interactive features only, remove the piggy bank art": the hero is
// the live Goal & SIP calculator, and the illustration is gone. Both modes run on the same
// helpers as the calculator pages (utils/calculators), so the numbers agree everywhere.
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const Field = ({ label, value, onChange, min, max, step, suffix }) => (
  <label className="block">
    <span className="flex justify-between text-sm text-slate-600 dark:text-gray-300">
      {label}
      <span className="font-semibold text-blue-950 dark:text-gray-100">
        {suffix === "₹" ? inr(value) : `${value}${suffix}`}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full mt-1 accent-red-600"
      aria-label={label}
    />
  </label>
);

const HeroSection = () => {
  const [mode, setMode] = useState("sip"); // sip | goal
  const [monthly, setMonthly] = useState(10000);
  const [goal, setGoal] = useState(2500000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const sipProjection = sipSeries({ monthly, years, cagr: rate });
  const sipEnd = sipProjection[sipProjection.length - 1] || { invested: 0, value: 0 };
  const goalPlan = sipForGoal({ goal, years, cagr: rate });

  return (
    <section
      className="
        bg-linear-to-r
        from-gray-50 via-sky-50 to-gray-100
        dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
        text-blue-950 dark:text-gray-100
        py-16 px-6
      "
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Grow Your Wealth with{" "}
            <span className="text-red-600 dark:text-red-500">Wealthcrop</span>
          </h1>
          <p className="text-lg text-blue-900 dark:text-gray-300 mb-8">
            Invest in mutual funds through a simple distribution platform: Goal-based SIPs, Curated Mutual Fund Baskets and a
            Product Suitability Assessment before you buy.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="bg-red-600 dark:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-red-700 dark:hover:bg-red-600 transition"
            >
              Get Started
            </Link>
            <Link
              to="/user/mutual_fund/explore"
              className="border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 px-6 py-3 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition"
            >
              Explore Funds
            </Link>
            {/* About moved off the homepage to its own page (client 2026-10-09). */}
            <Link to="/about" className="px-2 py-3 text-blue-900 dark:text-gray-300 font-semibold hover:underline">
              Learn More
            </Link>
          </div>
        </div>

        {/* LIVE GOAL & SIP CALCULATOR */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-md p-6">
          <div className="flex gap-2 mb-5" role="tablist">
            {[
              ["sip", "SIP Calculator"],
              ["goal", "Goal Calculator"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mode === key ? "bg-blue-950 text-white dark:bg-blue-500" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "sip" ? (
              <Field label="Monthly SIP" value={monthly} onChange={setMonthly} min={500} max={200000} step={500} suffix="₹" />
            ) : (
              <Field label="Goal amount (today's value)" value={goal} onChange={setGoal} min={100000} max={50000000} step={100000} suffix="₹" />
            )}
            <Field label="Years" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" yrs" />
            <Field label="Expected return" value={rate} onChange={setRate} min={1} max={20} step={0.5} suffix="% p.a." />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {mode === "sip" ? (
              <>
                <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3">
                  <p className="text-xs text-slate-500 dark:text-gray-400">You invest</p>
                  <p className="text-lg font-semibold">{inr(sipEnd.invested)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Estimated value</p>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{inr(sipEnd.value)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Monthly SIP needed</p>
                  <p className="text-lg font-semibold">{inr(goalPlan.monthlySIP)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Total you invest</p>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{inr(goalPlan.totalInvested)}</p>
                </div>
              </>
            )}
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-gray-400">
            An illustration at a constant assumed return, not a promise of returns. Mutual fund investments are subject to market risks.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
