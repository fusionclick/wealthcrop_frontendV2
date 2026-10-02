import React, { useState, useMemo } from "react";
import {
  FaChartLine,
  FaBullseye,
  FaClock,
  FaPercent,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { sipForGoal, sipSeries } from "../../utils/calculators";
import { MF_EXPLORE_PATH } from "../../utils/nodeApi";
import { inr } from "../../utils/calcSafe";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";

const SipCalculator = () => {
  const [goalAmount, setGoalAmount] = useState(1000000);
  const [years, setYears] = useState(10);
  const [cagr, setCagr] = useState(9);
  const [inflation, setInflation] = useState(3);
  // Audit #69 — the page only worked backwards (goal → monthly SIP). "sip" is the forward
  // question most people bring: what does this monthly amount grow to.
  const [mode, setMode] = useState("goal");
  const [monthly, setMonthly] = useState(10000);

  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();
  const handleRedirect = (url) => {
    navigate(url);
  };

  const result = useMemo(
    () => sipForGoal({ goal: goalAmount, years, cagr, inflation }),
    [goalAmount, years, cagr, inflation]
  );
  // The same model the chart has always drawn, so the bars and the headline agree.
  const growth = useMemo(() => sipSeries({ monthly, years, cagr }), [monthly, years, cagr]);
  const grown = growth.at(-1);
  const data =
    mode === "goal"
      ? result.series
      : growth.map((p) => ({ year: p.year, principal: p.invested, total: p.value }));
  const sliders =
    mode === "goal"
      ? [
          ["Goal Amount (₹)", goalAmount, setGoalAmount, 100000, 50000000, 50000],
          ["Time Horizon (Years)", years, setYears, 1, 40, 1],
          ["Expected CAGR (%)", cagr, setCagr, 1, 30, 0.5],
          ["Inflation Rate (%)", inflation, setInflation, 0, 15, 0.5],
        ]
      : [
          ["Monthly SIP (₹)", monthly, setMonthly, 500, 100000, 500],
          ["Time Horizon (Years)", years, setYears, 1, 40, 1],
          ["Expected CAGR (%)", cagr, setCagr, 1, 30, 0.5],
        ];

  // 🔶 FAQs Data
  const faqs = [
    {
      q: "What is SIP?",
      a: "SIP (Systematic Investment Plan) is a disciplined investment method to invest in mutual funds at regular intervals like monthly or weekly.",
    },
    {
      q: "Is SIP better than Lump Sum Investment?",
      a: "SIP is suitable for regular income earners and reduces market timing risk, whereas lump sum is preferred when you have large capital ready to invest.",
    },
    {
      q: "What is the minimum amount to start SIP?",
      a: "You can start SIP from as low as ₹100 per month depending on the mutual fund scheme.",
    },
    {
      q: "Is SIP safe?",
      a: "SIP invests in mutual funds which are market-linked. Risk reduces over long term due to rupee cost averaging.",
    },
    {
      q: "Can I pause or stop SIP anytime?",
      a: "Yes, SIP can be paused or stopped anytime without penalties.",
    },
    {
      q: "Are SIP returns guaranteed?",
      a: "No. SIP returns depend on market performance. However, long-term investments tend to give better returns historically.",
    },
  ];

  return (
 <div
  className="
    w-full pb-10
    bg-gradient-to-r from-blue-100 to-green-100
    dark:bg-gradient-to-r dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>

  {/* 🔷 HEADER */}
  <div className="text-center py-12 px-6">
    <h1 className="text-4xl font-extrabold text-blue-800 dark:text-gray-100 drop-shadow">
      SIP Calculator – Grow Your Wealth Smartly
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Use this SIP Calculator to see what a monthly SIP grows to, or the
      monthly investment a financial goal needs. Understand expected returns,
      invested amount, and long-term wealth creation through SIPs.
    </p>
  </div>

  {/* 🔷 MAIN BOX */}
  <div
    className="
      max-w-5xl mx-auto mt-6 p-8 grid md:grid-cols-2 gap-8
      bg-white dark:bg-[#020617]
      rounded-3xl shadow-lg dark:shadow-white/5
      border border-transparent dark:border-white/10
    "
  >
    {/* LEFT SIDE */}
    <div>
      <div className="inline-flex rounded-xl p-1 mb-4 bg-gray-100 dark:bg-white/10" role="tablist">
        {[
          ["goal", "I have a goal"],
          ["sip", "I have a monthly amount"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={
              mode === key
                ? "px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-blue-900 shadow dark:bg-[#020617] dark:text-white"
                : "px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-800 dark:text-gray-300 dark:hover:text-white"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 flex items-center gap-2 mb-4">
        <FaChartLine className="text-red-600" />
        {mode === "goal" ? "SIP Crorepati Goal Planner" : "SIP Growth Calculator"}
      </h2>

      <div
        className="
          rounded-2xl p-4 mb-6 space-y-2
          bg-gray-50 dark:bg-white/5
          text-blue-950 dark:text-gray-200
        "
      >
        {mode === "goal" ? (
          <p className="flex items-center gap-2">
            <FaBullseye className="text-red-600" /> Goal Amount:
            <strong>₹{inr(goalAmount)}</strong>
          </p>
        ) : (
          <p className="flex items-center gap-2">
            <FaBullseye className="text-red-600" /> Monthly SIP:
            <strong>₹{inr(monthly)}</strong>
          </p>
        )}
        <p className="flex items-center gap-2">
          <FaClock /> <strong>{years} Years</strong>
        </p>
        <p className="flex items-center gap-2">
          <FaPercent className="text-red-600" /> <strong>{cagr}%</strong>
        </p>
        {mode === "goal" && (
          <p className="flex items-center gap-2">
            <FaMoneyBillWave className="text-green-600" /> <strong>{inflation}%</strong>
          </p>
        )}
      </div>

      {/* Result */}
      {mode === "sip" ? (
        <div
          className="
            rounded-2xl p-4 mb-6
            bg-green-50 dark:bg-green-500/10
            border-l-4 border-green-500
            text-gray-800 dark:text-gray-200
          "
        >
          <p>
            Investing <strong>₹{inr(monthly)}</strong> every month for{" "}
            <strong>{years} years</strong> at {cagr}% a year:
          </p>
          <p>
            Future Value: <strong>₹{inr(grown.value)}</strong>
          </p>
          <p>
            Total Invested: <strong>₹{inr(grown.invested)}</strong>
          </p>
          <p>
            Estimated Earnings: <strong>₹{inr(grown.value - grown.invested)}</strong>
          </p>
        </div>
      ) : (
      <div
        className="
          rounded-2xl p-4 mb-6
          bg-green-50 dark:bg-green-500/10
          border-l-4 border-green-500
          text-gray-800 dark:text-gray-200
        "
      >
        <p>
          To reach <strong>₹{inr(result.futureValue)}</strong> in{" "}
          <strong>{years} years</strong>
          {inflation > 0 && (
            <>
              {" "}
              — that is ₹{inr(goalAmount)} of today&apos;s money at{" "}
              {inflation}% inflation
            </>
          )}
          ,
        </p>
        <p>
          Invest <strong>₹{inr(result.monthlySIP)}</strong> monthly.
        </p>
        <p>
          Total Invested:{" "}
          <strong>₹{inr(result.totalInvested)}</strong>
        </p>
        <p>
          Estimated Growth:{" "}
          <strong>₹{inr(result.estimatedGrowth)}</strong>
        </p>
      </div>
      )}

      <button
        onClick={() => handleRedirect(MF_EXPLORE_PATH)}
        className="
          bg-red-600 hover:bg-red-700
          dark:bg-red-500 dark:hover:bg-red-600
          text-white font-semibold py-2 px-6
          rounded-lg shadow-md transition
        "
      >
        💰 Invest Now
      </button>
    </div>

    {/* RIGHT SIDE */}
    <div className="space-y-4">
      {sliders.map(([label, value, setValue, min, max, step]) => (
        <div key={label}>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-blue-950 dark:text-gray-200">
              {label}
            </label>
            <span className="text-sm font-semibold text-blue-950 dark:text-gray-200">
              {inr(value)}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-blue-700 dark:accent-blue-400"
          />
        </div>
      ))}

      {/* Chart */}
      <div
        className="
          mt-4 p-4 rounded-2xl shadow-inner
          bg-gray-50 dark:bg-white/5
        "
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="year" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(val) => `₹${inr(val)}`}
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e5e7eb",
              }}
            />
            <Legend />
            {/* ponytail: pehle legend "principal, total, total" dikhati thi — Line usi
                dataKey ko dobara draw kar rahi thi jo Bar pehle se draw karta hai. */}
            <Bar dataKey="principal" name="Amount invested" fill="#3b82f6" />
            <Bar dataKey="total" name="Portfolio value" fill="#86efac" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  {/* 🔷 FAQ SECTION */}
  <div
    className="
      max-w-4xl mx-auto mt-10 p-6 rounded-2xl
      bg-white dark:bg-[#020617]
      shadow dark:shadow-white/5
      border border-transparent dark:border-white/10
    "
  >
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
      Frequently Asked Questions (SIP)
    </h2>

    {faqs.map((item, index) => (
      <div key={index} className="border-b dark:border-white/10 py-3">
        <button
          onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
          className="w-full flex justify-between text-left font-medium
                     text-gray-700 dark:text-gray-200"
        >
          {item.q}
          <span>{openFAQ === index ? "−" : "+"}</span>
        </button>

        {openFAQ === index && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{item.a}</p>
        )}
      </div>
    ))}
  </div>

  {/* 🔷 RELATED LINKS */}
  <div className="max-w-5xl mx-auto mt-10 p-6">
    <h2 className="text-xl font-bold text-blue-900 dark:text-gray-100 mb-4">
      Related Calculators
    </h2>

    <div className="flex gap-4 flex-wrap">
      {/* ponytail: rang static rakhe hain — Tailwind template-literal se bani class build mein
          generate hi nahi karta, is liye ye buttons live par be-rang aur be-amal thay. */}
      {[
        ["Retirement", "retirement-calculator", "bg-blue-500 hover:bg-blue-600"],
        ["Lumpsum", "lumpsum-calculator", "bg-green-500 hover:bg-green-600"],
        ["FD", "fd-calculator", "bg-purple-500 hover:bg-purple-600"],
        ["NPS", "nps-calculator", "bg-orange-500 hover:bg-orange-600"],
      ].map(([label, path, color]) => (
        <button
          key={path}
          onClick={() => handleRedirect(`/calculator/${path}`)}
          className={`${color} text-white px-4 py-2 rounded-lg shadow`}
        >
          {label} Calculator
        </button>
      ))}
    </div>
  </div>
</div>

  );
};

export default SipCalculator;
