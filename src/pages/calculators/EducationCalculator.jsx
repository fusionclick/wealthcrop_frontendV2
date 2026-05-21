import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EducationCalculator = () => {
  const [currentCost, setCurrentCost] = useState("");
  const [yearsLeft, setYearsLeft] = useState("");
  const [inflationRate, setInflationRate] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("12");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateEducationGoal = () => {
    if (!currentCost || !yearsLeft || !inflationRate || !expectedReturn) return;

    const costNow = Number(currentCost);
    const years = Number(yearsLeft);
    const infl = Number(inflationRate) / 100;
    const ret = Number(expectedReturn) / 100;

    // Future cost of education
    const futureCost = costNow * Math.pow(1 + infl, years);

    // Monthly SIP required to reach futureCost
    const monthlyRate = ret / 12;
    const months = years * 12;

    let sip = 0;
    if (monthlyRate > 0) {
      sip = (futureCost * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      sip = futureCost / months;
    }

    setResult({
      futureCost: futureCost.toFixed(0),
      monthlySIP: sip.toFixed(0),
    });
  };

  const faqs = [
    {
      q: "Why is education inflation higher?",
      a: "Education costs usually increase faster than general inflation, often 8–12% per year.",
    },
    {
      q: "What does expected return mean?",
      a: "It is the annual return you expect from your investments like mutual funds or equities.",
    },
    {
      q: "Should I invest via SIP?",
      a: "SIP helps you spread investments over time and benefit from rupee cost averaging.",
    },
    {
      q: "Is this calculator exact?",
      a: "It provides an estimate based on the numbers you enter and assumed constant rates.",
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
  <div
    className="
      py-14 px-6 text-center
      bg-linear-to-r from-blue-100 to-green-100
      dark:from-gray-900 dark:to-gray-800
    "
  >
    <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 drop-shadow">
      Education Cost Calculator 🎓📚
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Estimate future education expenses and the monthly SIP needed to reach
      your goal in time.
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
      {/* LEFT INPUTS */}
      <div className="p-8 bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Enter Your Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Current Education Cost (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 10,00,000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-indigo-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={currentCost}
              onChange={(e) => setCurrentCost(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Years Left
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-indigo-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={yearsLeft}
              onChange={(e) => setYearsLeft(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Education Inflation Rate (%)
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-indigo-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Expected Return on Investment (%)
            </label>
            <input
              type="number"
              placeholder="Ex: 12"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-indigo-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
          </div>

          <button
            onClick={calculateEducationGoal}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-indigo-600 hover:bg-indigo-700
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT RESULT — EDUCATION COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-indigo-600 to-sky-700
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 Education Goal Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2">
            <p className="text-lg">
              <strong>Future Education Cost:</strong> ₹
              {Number(result.futureCost).toLocaleString()}
            </p>
            <p className="text-lg">
              <strong>Required Monthly SIP:</strong> ₹
              {Number(result.monthlySIP).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-80">
            Enter details and click calculate to view your goal.
          </p>
        )}

        <div className="mt-6 text-sm opacity-80">
          💡 Assumes constant inflation and returns for the full period.
        </div>
      </div>
    </div>
  </div>

  {/* FAQ */}
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

  {/* RELATED */}
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
        onClick={() => navigate("/calculator/inflation-calculator")}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Inflation Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/retirement-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Retirement Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/nps-calculator")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        NPS Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

  );
};

export default EducationCalculator;
