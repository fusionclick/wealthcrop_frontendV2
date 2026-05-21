import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import cagrImg from "../../assets/calculators/cagr.png"; // change path

const CagrCalculator = () => {
  const [initialValue, setInitialValue] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateCAGR = () => {
    if (!initialValue || !finalValue || !years) return;

    const cagr =
      (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;

    setResult({
      cagr: cagr.toFixed(2),
    });
  };

  const faqs = [
    {
      q: "What is CAGR?",
      a: "CAGR (Compound Annual Growth Rate) represents the annual growth rate of an investment over a period of time.",
    },
    {
      q: "Why is CAGR important?",
      a: "CAGR shows the true return on investment by smoothing out market volatility.",
    },
    {
      q: "Is CAGR better than simple return?",
      a: "Yes, CAGR gives a more accurate picture for multi-year investments.",
    },
    {
      q: "Can CAGR be negative?",
      a: "Yes, if the investment value has decreased over time.",
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
      bg-linear-to-r from-blue-100 to-green-100
      dark:from-gray-900 dark:to-gray-800
      py-14 px-6 text-center
    "
  >
    <h1 className="text-4xl font-extrabold text-pink-700 dark:text-pink-400 drop-shadow">
      CAGR Calculator 📈
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Calculate your investment&apos;s year-on-year growth using the Compound
      Annual Growth Rate formula.
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
          bg-linear-to-br from-pink-50 to-white
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-pink-700 dark:text-pink-400 mb-6">
          Enter Investment Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Initial Value (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 100000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-pink-200
                bg-white/80
                focus:ring-2 focus:ring-pink-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Final Value (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 150000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-pink-200
                bg-white/80
                focus:ring-2 focus:ring-pink-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Number of Years
            </label>
            <input
              type="number"
              placeholder="Ex: 5"
              className="
                w-full p-2 rounded-lg outline-none
                border border-pink-200
                bg-white/80
                focus:ring-2 focus:ring-pink-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <button
            onClick={calculateCAGR}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-pink-600 hover:bg-pink-700
              dark:bg-pink-500 dark:hover:bg-pink-600
              text-white
            "
          >
            Calculate CAGR
          </button>
        </div>
      </div>

      {/* RIGHT SIDE RESULT — CAGR COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-pink-600 to-yellow-600
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 CAGR Result</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <p className="text-lg">
              <strong>Your CAGR is:</strong> {result.cagr}%
            </p>
          </div>
        ) : (
          <p className="opacity-90">
            Enter details and click calculate to view results.
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 CAGR shows the smoothed annual growth rate of your investment.
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
        onClick={() => navigate("/calculator/retirement-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Retirement Calculator
      </button>

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

export default CagrCalculator;
