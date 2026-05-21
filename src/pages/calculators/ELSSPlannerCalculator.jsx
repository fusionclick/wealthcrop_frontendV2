import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ELSSPlannerCalculator = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [returnRate, setReturnRate] = useState("");
  const [years, setYears] = useState("");

  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const validate = () => {
    if (!amount || !returnRate || !years) {
      alert("Please fill all fields.");
      return false;
    }
    if (amount <= 0 || returnRate <= 0 || years <= 0) {
      alert("Values must be greater than zero.");
      return false;
    }
    return true;
  };

  const calculateELSS = () => {
    if (!validate()) return;

    const P = Number(amount);
    const r = Number(returnRate) / 100;
    const t = Number(years);

    const estimatedValue = P * Math.pow(1 + r, t);
    const taxSaved = Math.min(P, 150000);

    setResult({
      estimatedValue: estimatedValue.toFixed(0),
      taxSaved: taxSaved.toLocaleString(),
      totalInvested: P.toLocaleString(),
    });
  };

  const faqs = [
    { q: "What is ELSS?", a: "ELSS is a tax-saving mutual fund under Section 80C with a 3-year lock-in." },
    { q: "How much tax can I save?", a: "You can save up to ₹1.5 lakh under Section 80C." },
    { q: "Is ELSS risky?", a: "Yes, it invests in equity markets, so returns may vary." },
    { q: "Minimum period to invest?", a: "3 years lock-in. But 5–7 years recommended for best results." }
  ];

  return (
    <div
  className="
    min-h-screen 
    bg-linear-to-r from-blue-100 to-green-100
    dark:from-slate-900 dark:to-slate-800
  "
>
  {/* HEADER */}
  <div className="py-14 px-6 text-center">
    <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow dark:text-blue-400">
      ELSS Planner 📘
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 text-lg dark:text-slate-300">
      Calculate estimated maturity value and tax saved under Section 80C.
    </p>
  </div>

  {/* MAIN CARD */}
  <div className="flex justify-center items-center p-6">
    <div
      className="
        w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden
        grid md:grid-cols-2 border
        bg-white border-gray-200
        dark:bg-slate-900 dark:border-slate-700
      "
    >
      {/* LEFT INPUTS */}
      <div
        className="
          p-8 bg-linear-to-br from-blue-50 to-cyan-50
          dark:from-slate-800 dark:to-slate-900
        "
      >
        <h2 className="text-2xl font-bold text-blue-700 mb-6 dark:text-blue-400">
          Enter Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Investment Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 50,000"
              className="
                w-full border p-2 rounded-lg outline-none
                border-blue-300 bg-white/80
                focus:ring-2 focus:ring-blue-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Expected Return (%)
            </label>
            <input
              type="number"
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
              placeholder="Ex: 12"
              className="
                w-full border p-2 rounded-lg outline-none
                border-blue-300 bg-white/80
                focus:ring-2 focus:ring-blue-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Years
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="Ex: 5"
              className="
                w-full border p-2 rounded-lg outline-none
                border-blue-300 bg-white/80
                focus:ring-2 focus:ring-blue-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <button
            onClick={calculateELSS}
            className="
              mt-2 w-full bg-blue-600 hover:bg-blue-700
              text-white py-2 rounded-lg font-bold transition
              dark:bg-blue-800 dark:hover:bg-blue-900
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT RESULT */}
      <div
        className="
          p-8 bg-linear-to-br from-blue-500 to-cyan-500
          text-white flex flex-col justify-center
          dark:from-gray-800 dark:to-gray-800
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 ELSS Summary</h3>

        {result ? (
          <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-lg">
              <strong>Estimated Value:</strong>{" "}
              ₹{Number(result.estimatedValue).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Tax Saved (80C):</strong> ₹{result.taxSaved}
            </p>
            <p className="text-lg mt-2">
              <strong>Total Invested:</strong> ₹{result.totalInvested}
            </p>
          </div>
        ) : (
          <p className="opacity-95">Enter details to calculate ELSS.</p>
        )}
      </div>
    </div>
  </div>

  {/* FAQ */}
  <div
    className="
      max-w-4xl mx-auto mt-10 p-6 rounded-2xl shadow
      bg-linear-to-r from-blue-200 to-green-100
      dark:from-slate-800 dark:to-slate-700
    "
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">
      FAQ — ELSS
    </h2>

    {faqs.map((item, index) => (
      <div key={index} className="border-b py-3 dark:border-slate-600">
        <button
          onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
          className="
            w-full flex justify-between items-center text-left
            text-gray-700 font-medium
            dark:text-slate-200
          "
        >
          {item.q}
          <span>{openFAQ === index ? "−" : "+"}</span>
        </button>

        {openFAQ === index && (
          <p className="mt-2 text-gray-700 dark:text-slate-300">
            {item.a}
          </p>
        )}
      </div>
    ))}
  </div>

  {/* RELATED CALCULATORS */}
  <div className="max-w-4xl mx-auto mt-10 p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-white">
      Related Calculators
    </h2>

    <div className="flex gap-4 flex-wrap">
      <button onClick={() => navigate("/calculator/emi-calculator")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
        EMI Calculator
      </button>
      <button onClick={() => navigate("/calculator/sip-calculator")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow">
        SIP Calculator
      </button>
      <button onClick={() => navigate("/calculator/cagr-calculator")} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow">
        CAGR Calculator
      </button>
      <button onClick={() => navigate("/calculator/fd-calculator")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow">
        FD Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

  );
};

export default ELSSPlannerCalculator;
