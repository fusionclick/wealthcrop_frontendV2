import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NPSCalculator = () => {
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateNPS = () => {
    if (!monthlyContribution || !expectedReturn || !years) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = years * 12;

    // NPS returns based on SIP formula
    const maturity =
      (monthlyContribution *
        (Math.pow(1 + monthlyRate, totalMonths) - 1) *
        (1 + monthlyRate)) /
      monthlyRate;

    const invested = monthlyContribution * totalMonths;
    const wealthGained = maturity - invested;

    setResult({
      invested: invested.toFixed(0),
      maturity: maturity.toFixed(0),
      wealthGained: wealthGained.toFixed(0),
    });
  };

  const faqs = [
    {
      q: "What is an NPS Calculator?",
      a: "An NPS calculator helps estimate your total maturity amount and pension wealth at retirement based on monthly contributions.",
    },
    {
      q: "What return rate should I use?",
      a: "NPS Tier 1 schemes typically give 9%–12% annual returns depending on asset allocation.",
    },
    {
      q: "Is NPS tax-free?",
      a: "40% of the maturity amount is tax-free, 40% goes into compulsory annuity, and 20% is taxable.",
    },
    {
      q: "Can I increase my contribution later?",
      a: "Yes, you can change or increase your monthly/annual NPS contribution anytime.",
    },
  ];

  return (
    <div
  className="
    min-h-screen
    bg-linear-to-r from-blue-100 to-green-100
    dark:from-gray-900 dark:to-gray-800
  "
>
  {/* HEADER */}
  <div className="py-14 px-6 text-center">
    <h1 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 drop-shadow">
      NPS Calculator 🏦🔥
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Estimate your National Pension Scheme wealth at retirement based on
      monthly contributions and long-term compounding.
    </p>
  </div>

  {/* CALCULATOR CARD */}
  <div className="flex justify-center items-center p-2">
    <div
      className="
        w-full max-w-4xl
        bg-white dark:bg-gray-900
        rounded-3xl shadow-xl overflow-hidden
        grid md:grid-cols-2
        border border-gray-200 dark:border-white/10
      "
    >
      {/* LEFT PANEL */}
      <div
        className="
          p-8
          bg-linear-to-br from-red-50 to-white
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-indigo-500 dark:text-indigo-400 mb-6">
          Enter Your Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
              Monthly Contribution (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 2000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-red-200
                bg-white/80
                focus:ring-2 focus:ring-red-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
              Expected Return Rate (%)
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              className="
                w-full p-2 rounded-lg outline-none
                border border-red-200
                bg-white/80
                focus:ring-2 focus:ring-red-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
              Number of Years
            </label>
            <input
              type="number"
              placeholder="Ex: 30"
              className="
                w-full p-2 rounded-lg outline-none
                border border-red-200
                bg-white/80
                focus:ring-2 focus:ring-red-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <button
            onClick={calculateNPS}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-indigo-500 hover:bg-indigo-600
              dark:bg-indigo-500 dark:hover:bg-indigo-600
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT PANEL RESULT — NPS COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-indigo-500 to-blue-400
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 NPS Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <p className="text-lg">
              <strong>Total Invested:</strong> ₹
              {Number(result.invested).toLocaleString()}
            </p>

            <p className="text-lg mt-1">
              <strong>Maturity Amount:</strong> ₹
              {Number(result.maturity).toLocaleString()}
            </p>

            <p className="text-lg mt-1">
              <strong>Wealth Gained:</strong> ₹
              {Number(result.wealthGained).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-90">
            Enter details and click calculate to view results.
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 Calculation assumes monthly compounding (standard NPS Tier 1).
        </div>
      </div>
    </div>
  </div>

  {/* FAQ SECTION */}
  <div
    className="
      max-w-4xl mx-auto mt-10 p-6 rounded-2xl shadow
      bg-linear-to-r from-blue-200 to-green-100
      dark:from-slate-700 dark:to-slate-800
    "
  >
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
      Frequently Asked Questions
    </h2>

    {faqs.map((item, index) => (
      <div key={index} className="border-b dark:border-slate-600 py-3">
        <button
          onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
          className="w-full flex justify-between items-center text-left text-gray-700 dark:text-slate-200 font-medium"
        >
          {item.q}
          <span>{openFAQ === index ? "−" : "+"}</span>
        </button>

        {openFAQ === index && (
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            {item.a}
          </p>
        )}
      </div>
    ))}
  </div>

  {/* RELATED CALCULATORS */}
  <div className="max-w-4xl mx-auto mt-10 p-6">
    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
      Related Calculators
    </h2>

    <div className="flex gap-4 flex-wrap">
      <button
        onClick={() => navigate("/calculator/sip-calculator")}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
      >
        SIP Calculator
      </button>

      <button
        onClick={() => navigate("/calculator/fd-calculator")}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
      >
        FD Calculator
      </button>

      <button
        onClick={() => navigate("/calculator/retirement-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Retirement Calculator
      </button>

      <button
        onClick={() => navigate("/calculator/hra-calculator")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        HRA Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

  );
};

export default NPSCalculator;
