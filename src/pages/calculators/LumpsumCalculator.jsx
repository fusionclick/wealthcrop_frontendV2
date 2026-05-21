import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LumpsumCalculator = () => {
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState("");
  const [expectedRate, setExpectedRate] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateLumpsum = () => {
    if (!amount || !years || !expectedRate) return;

    const P = Number(amount);
    const r = Number(expectedRate) / 100;
    const t = Number(years);

    const maturity = P * Math.pow(1 + r, t);
    const wealthGained = maturity - P;

    setResult({
      invested: P.toFixed(0),
      maturity: maturity.toFixed(0),
      wealthGained: wealthGained.toFixed(0),
    });
  };

  const faqs = [
    {
      q: "What is a Lumpsum Calculator?",
      a: "It estimates the future value of a one-time investment based on expected return rate.",
    },
    {
      q: "Does a lumpsum grow with compounding?",
      a: "Yes, lumpsum investments compound annually or monthly depending on the fund.",
    },
    {
      q: "What is a good rate to assume?",
      a: "Equity mutual funds historically deliver 10–12% annually on long-term basis.",
    },
    {
      q: "Is lumpsum better than SIP?",
      a: "Lumpsum is ideal during market dips, while SIP is better for consistent long-term investing.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 bg-linear-to-r from-blue-100 to-green-100
    dark:from-gray-900 dark:to-gray-800
    ">
      
      {/* HEADER */}
      <div className="bg-linear-to-r from-blue-100 to-green-100 dark:from-gray-900 dark:to-gray-800 py-14 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-teal-400 drop-shadow">
          Lumpsum Investment Calculator 💼📈
        </h1>

        <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          Calculate the future value of a one-time investment based on expected
          annual return rate and investment duration.
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="flex justify-center items-center p-6">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 border border-gray-200 dark:border-white/10">
          
          {/* LEFT SIDE INPUTS */}
          <div className="p-8 bg-linear-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-6">
              Enter Investment Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
                  Investment Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 1,00,000"
                  className="w-full border border-indigo-200 dark:text-white p-2 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none
                  dark:bg-gray-800 dark:border-gray-600"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
                  Investment Duration (Years)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 10"
                  className="w-full border border-indigo-200 p-2 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none
                   dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 12"
                  className="w-full border border-indigo-200 p-2 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none 
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={expectedRate}
                  onChange={(e) => setExpectedRate(e.target.value)}
                />
              </div>

              <button
                onClick={calculateLumpsum}
                className="mt-2 w-full bg-teal-600  hover:bg-teal-700 text-white py-2 rounded-lg font-bold text-sm transition"
              >
                Calculate
              </button>
            </div>
          </div>

          {/* RIGHT SIDE RESULT */}
          <div className="p-8 bg-linear-to-br from-emerald-500 to-teal-400 dark:from-gray-800 dark:to-gray-800 text-white flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4">📊 Lumpsum Summary</h3>

            {result ? (
              <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-md">
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
              💡 Long-term investments (7+ years) give better compounding benefits.
            </div>
          </div>
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow bg-linear-to-r from-blue-200 to-green-100 dark:from-slate-700 dark:to-slate-800">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">FAQ — Lumpsum Investment</h2>

        {faqs.map((item, index) => (
          <div key={index} className="border-b py-3">
            <button
              onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              className="w-full flex justify-between items-center text-left text-gray-700 dark:text-slate-200 font-medium"
            >
              {item.q}
              <span>{openFAQ === index ? "−" : "+"}</span>
            </button>

            {openFAQ === index && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">{item.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* REDIRECT BUTTONS */}
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Related Calculators</h2>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => navigate("/calculator/retirement-calculator")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Retirement Calculator
          </button>

          <button
            onClick={() => navigate("/calculator/fd-calculator")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
          >
            FD Calculator
          </button>

          <button
            onClick={() => navigate("/calculator/nps-calculator")}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
          >
            NPS Calculator
          </button>

          <button
            onClick={() => navigate("/calculator/hra-calculator")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
          >
            HRA Calculator
          </button>
        </div>
      </div>

      <div className="pb-10"></div>
    </div>
  );
};

export default LumpsumCalculator;
