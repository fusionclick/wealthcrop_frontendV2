import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RetirementCalculator = () => {
  const [currentAge, setCurrentAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("");
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [inflationRate, setInflationRate] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateRetirement = () => {
    if (!currentAge || !retirementAge || !monthlyExpense || !inflationRate)
      return;

    const yearsToRetire = retirementAge - currentAge;
    const inflation = inflationRate / 100;

    // Future Monthly Expense after inflation
    const futureExpense =
      monthlyExpense * Math.pow(1 + inflation, yearsToRetire);

    // Retirement Corpus needed (Assume 30 years post retirement life, 6% return)
    const postReturnRate = 0.06;
    const corpus =
      (futureExpense * 12 * (1 - Math.pow(1 / (1 + postReturnRate), 30))) /
      postReturnRate;

    setResult({
      futureExpense: futureExpense.toFixed(0),
      corpus: corpus.toFixed(0),
    });
  };

  const faqs = [
    {
      q: "What is a Retirement Calculator?",
      a: "A retirement calculator estimates how much money you need to save to continue your lifestyle after retirement.",
    },
    {
      q: "Why is inflation important in retirement planning?",
      a: "Inflation increases expenses every year; hence, future costs will be much higher than today.",
    },
    {
      q: "How long should retirement corpus last?",
      a: "Typically 25–30 years post-retirement life should be planned depending on life expectancy.",
    },
    {
      q: "Does retirement corpus include pension?",
      a: "Yes, corpus includes total value of savings, schemes, pension, investments, etc.",
    },
  ];

  return (
    <div
  className="
    min-h-screen
    bg-linear-to-r from-blue-100 to-green-100
    dark:from-[var(--gray-900)] dark:to-[var(--gray-800)]
  "
>
  {/* HEADER */}
  <div
    className="
      bg-linear-to-r from-blue-100 to-green-100
      dark:from-[var(--gray-900)] dark:to-[var(--gray-800)]
      py-14 px-6 text-center
    "
  >
    <h1 className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 drop-shadow">
      Retirement Calculator 🧓💰
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Plan your dream retirement by calculating how much money you need to
      save. Account your lifestyle expenses and inflation to get future
      financial needs.
    </p>
  </div>

  {/* MAIN CARD */}
  <div className="flex justify-center items-center p-6">
    <div
      className="
        w-full max-w-4xl
        bg-white dark:bg-gray-900
        rounded-3xl shadow-xl overflow-hidden
        grid md:grid-cols-2
        border border-gray-200 dark:border-white/10
      "
    >
      {/* LEFT SIDE INPUTS */}
      <div
        className="
          p-8
          bg-linear-to-br from-blue-50 to-white
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-6">
          Enter Your Details
        </h2>

        <div className="space-y-4">
          {[
            {
              label: "Current Age (Years)",
              value: currentAge,
              setter: setCurrentAge,
              placeholder: "Ex: 25",
            },
            {
              label: "Retirement Age (Years)",
              value: retirementAge,
              setter: setRetirementAge,
              placeholder: "Ex: 60",
            },
            {
              label: "Monthly Expense Today (₹)",
              value: monthlyExpense,
              setter: setMonthlyExpense,
              placeholder: "Ex: 20000",
            },
            {
              label: "Expected Inflation Rate (%)",
              value: inflationRate,
              setter: setInflationRate,
              placeholder: "Ex: 6",
            },
          ].map((item, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                {item.label}
              </label>

              <input
                type="number"
                placeholder={item.placeholder}
                value={item.value}
                onChange={(e) => item.setter(e.target.value)}
                className="
                  w-full p-2 rounded-lg outline-none
                  border border-purple-200
                  bg-white/80
                  focus:ring-2 focus:ring-purple-400
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                "
              />
            </div>
          ))}

          <button
            onClick={calculateRetirement}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-purple-600 hover:bg-purple-700
              dark:bg-purple-500 dark:hover:bg-purple-600
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT SIDE RESULT — RETIREMENT COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-purple-600 to-indigo-600
         dark:from-[var(--gray-800)] dark:to-[var(--gray-800)]
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 Retirement Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <p className="text-lg">
              <strong>Monthly Expense at Retirement:</strong> ₹
              {Number(result.futureExpense).toLocaleString()}
            </p>
            <p className="text-lg mt-1">
              <strong>Retirement Corpus Required:</strong> ₹
              {Number(result.corpus).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-90">
            Enter details and click calculate to view results.
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 Calculation assumes 6% post-retirement return for 30 years.
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

  {/* REDIRECT BUTTONS */}
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

  <div className="pb-10" />
</div>

  );
};

export default RetirementCalculator;
