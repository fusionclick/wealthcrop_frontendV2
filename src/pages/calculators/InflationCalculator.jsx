import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const InflationCalculator = () => {
  const [currentPrice, setCurrentPrice] = useState("");
  const [inflationRate, setInflationRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateInflation = () => {
    if (!currentPrice || !inflationRate || !years) return;

    const inflation = inflationRate / 100;
    const futureValue = currentPrice * Math.pow(1 + inflation, years);

    setResult({
      futurePrice: futureValue.toFixed(0),
    });
  };

  const faqs = [
    {
      q: "What is an Inflation Calculator?",
      a: "It helps estimate how much a product or service will cost in the future because of inflation.",
    },
    {
      q: "Why should I calculate inflation?",
      a: "Inflation reduces purchasing power, so knowing future prices helps in budgeting and financial planning.",
    },
    {
      q: "What inflation rate should I use?",
      a: "For India, the long-term average inflation is around 5–6%.",
    },
    {
      q: "Does inflation affect long-term goals?",
      a: "Yes, inflation significantly impacts goals like retirement, education, and housing.",
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
    <h1 className="text-4xl font-extrabold text-orange-600 dark:text-orange-400 drop-shadow">
      Inflation Calculator 📈💸
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Estimate the future cost of goods and services based on inflation.
      Understand how rising prices impact your savings and purchasing power.
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
      {/* LEFT INPUT SECTION */}
      <div
        className="
          p-8
          bg-linear-to-br from-yellow-50 to-white
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-6">
          Enter Your Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Current Price (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 1000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-orange-200
                bg-white/80
                focus:ring-2 focus:ring-orange-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              placeholder="Ex: 6"
              className="
                w-full p-2 rounded-lg outline-none
                border border-orange-200
                bg-white/80
                focus:ring-2 focus:ring-orange-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Years After
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              className="
                w-full p-2 rounded-lg outline-none
                border border-orange-200
                bg-white/80
                focus:ring-2 focus:ring-orange-400
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <button
            onClick={calculateInflation}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-orange-600 hover:bg-orange-700
              dark:bg-orange-700 dark:hover:bg-orange-800
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT RESULT SECTION — INFLATION COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-orange-600 to-red-600
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 Inflation Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <p className="text-lg">
              <strong>Future Price:</strong> ₹
              {Number(result.futurePrice).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-90">
            Enter details and click calculate to view results.
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 Inflation compounds yearly and increases future prices.
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

export default InflationCalculator;
