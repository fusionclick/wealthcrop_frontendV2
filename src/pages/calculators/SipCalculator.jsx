import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaBullseye,
  FaClock,
  FaPercent,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
  const [result, setResult] = useState({});
  const [data, setData] = useState([]);

  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();
  const handleRedirect = (url) => {
    navigate(url);
  };

  // 🔷 SIP Calculation Formula
  const calculateSIP = () => {
    const n = years * 12;
    const r = cagr / 100 / 12;
    const monthlySIP = (goalAmount * r) / (Math.pow(1 + r, n) - 1);

    let corpus = 0;
    let principal = 0;
    const yearlyData = [];
    for (let i = 1; i <= years; i++) {
      const months = i * 12;
      const val = monthlySIP * ((Math.pow(1 + r, months) - 1) / r);
      corpus = val;
      principal = monthlySIP * months;
      yearlyData.push({
        year: `Y${i}`,
        total: Math.round(corpus),
        principal: Math.round(principal),
      });
    }

    setData(yearlyData);

    setResult({
      monthlySIP: Math.round(monthlySIP),
      totalInvested: Math.round(monthlySIP * n),
      estimatedGrowth: Math.round(corpus - monthlySIP * n),
      futureValue: Math.round(corpus),
    });
  };

  useEffect(() => {
    calculateSIP();
  }, [goalAmount, years, cagr, inflation]);

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
      Use this SIP Calculator to estimate monthly investments required to
      reach your financial goal. Understand expected returns, invested
      amount, and long-term wealth creation through SIPs.
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
      <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 flex items-center gap-2 mb-4">
        <FaChartLine className="text-red-600" /> SIP Crorepati Goal Planner
      </h2>

      <div
        className="
          rounded-2xl p-4 mb-6 space-y-2
          bg-gray-50 dark:bg-white/5
          text-blue-950 dark:text-gray-200
        "
      >
        <p className="flex items-center gap-2">
          <FaBullseye className="text-red-600" /> Goal Amount:
          <strong>₹{goalAmount.toLocaleString()}</strong>
        </p>
        <p className="flex items-center gap-2">
          <FaClock /> <strong>{years} Years</strong>
        </p>
        <p className="flex items-center gap-2">
          <FaPercent className="text-red-600" /> <strong>{cagr}%</strong>
        </p>
        <p className="flex items-center gap-2">
          <FaMoneyBillWave className="text-green-600" /> <strong>{inflation}%</strong>
        </p>
      </div>

      {/* Result */}
      <div
        className="
          rounded-2xl p-4 mb-6
          bg-green-50 dark:bg-green-500/10
          border-l-4 border-green-500
          text-gray-800 dark:text-gray-200
        "
      >
        <p>
          To reach <strong>₹{result.futureValue?.toLocaleString()}</strong> in{" "}
          <strong>{years} years</strong>,
        </p>
        <p>
          Invest <strong>₹{result.monthlySIP?.toLocaleString()}</strong> monthly.
        </p>
        <p>
          Total Invested:{" "}
          <strong>₹{result.totalInvested?.toLocaleString()}</strong>
        </p>
        <p>
          Estimated Growth:{" "}
          <strong>₹{result.estimatedGrowth?.toLocaleString()}</strong>
        </p>
      </div>

      <button
        onClick={() => handleRedirect("/sip_cal")}
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
      {[
        ["Goal Amount (₹)", goalAmount, setGoalAmount],
        ["Time Horizon (Years)", years, setYears],
        ["Expected CAGR (%)", cagr, setCagr],
        ["Inflation Rate (%)", inflation, setInflation],
      ].map(([label], i) => (
        <div key={i}>
          <label className="text-sm font-medium text-blue-950 dark:text-gray-200">
            {label}
          </label>
          <input
            type="range"
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
              formatter={(val) => `₹${val.toLocaleString()}`}
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e5e7eb",
              }}
            />
            <Legend />
            <Bar dataKey="principal" fill="#3b82f6" />
            <Bar dataKey="total" fill="#86efac" />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
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
      {[
        ["Retirement", "blue"],
        ["Lumpsum", "green"],
        ["FD", "purple"],
        ["NPS", "orange"],
      ].map(([label, color], i) => (
        <button
          key={i}
          className={`
            bg-${color}-500 hover:bg-${color}-600
            text-white px-4 py-2 rounded-lg shadow
          `}
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
