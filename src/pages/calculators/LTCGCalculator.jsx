import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LTCGCalculator = () => {
  const navigate = useNavigate();

  const [type, setType] = useState("equity");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [units, setUnits] = useState("");
  const [holding, setHolding] = useState("");

  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const validate = () => {
    if (!buy || !sell || !units || !holding) {
      alert("Please fill all fields.");
      return false;
    }
    if (buy <= 0 || sell <= 0 || units <= 0 || holding <= 0) {
      alert("Values must be greater than zero.");
      return false;
    }
    return true;
  };

  const calculateLTCG = () => {
    if (!validate()) return;

    const P = Number(buy);
    const S = Number(sell);
    const U = Number(units);
    const months = Number(holding);

    const gain = (S - P) * U;
    let tax = 0;
    let category = "";

    if (type === "equity") {
      if (months > 12) {
        category = "Long Term (LTCG)";
        tax = Math.max(0, gain - 100000) * 0.10;
      } else {
        category = "Short Term (STCG)";
        tax = gain * 0.15;
      }
    } else {
      if (months > 36) {
        category = "Long Term (LTCG)";
        tax = gain * 0.20; // simplified
      } else {
        category = "Short Term (STCG)";
        tax = gain * 0.30;
      }
    }

    setResult({
      gain: gain.toFixed(0),
      tax: tax.toFixed(0),
      category,
    });
  };

  const faqs = [
    { q: "What is LTCG?", a: "LTCG means Long Term Capital Gains, applicable if investment is held for long-term period." },
    { q: "Is LTCG always taxed?", a: "Equity LTCG is taxed only above ₹1 lakh. Debt LTCG is taxed at 20%." },
    { q: "What about STCG?", a: "Short-term equity gains are taxed at 15%." },
    { q: "Is LTCG applicable on mutual funds?", a: "Yes, equity mutual funds follow the same rules as equity shares." },
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
    <h1 className="text-4xl font-extrabold text-purple-700 drop-shadow dark:text-purple-400">
      LTCG Calculator 📊
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-gray-700 text-lg dark:text-slate-300">
      Calculate capital gains tax for equity & debt investments.
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
          p-8 bg-linear-to-br from-purple-50 to-indigo-100
          dark:from-slate-800 dark:to-slate-900
        "
      >
        <h2 className="text-2xl font-bold text-purple-700 mb-6 dark:text-purple-400">
          Enter Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Investment Type
            </label>
            <select
              className="
                w-full p-2 rounded-lg border outline-none
                border-purple-300 bg-white
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="equity">Equity / Equity MF</option>
              <option value="debt">Debt Mutual Fund</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Buy Price (₹)
            </label>
            <input
              type="number"
              value={buy}
              onChange={(e) => setBuy(e.target.value)}
              placeholder="Ex: 250.50"
              className="
                w-full border p-2 rounded-lg outline-none
                border-purple-300 bg-white/80
                focus:ring-2 focus:ring-purple-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Sell Price (₹)
            </label>
            <input
              type="number"
              value={sell}
              onChange={(e) => setSell(e.target.value)}
              placeholder="Ex: 320.75"
              className="
                w-full border p-2 rounded-lg outline-none
                border-purple-300 bg-white/80
                focus:ring-2 focus:ring-purple-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Units
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="Ex: 100"
              className="
                w-full border p-2 rounded-lg outline-none
                border-purple-300 bg-white/80
                focus:ring-2 focus:ring-purple-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Holding Period (Months)
            </label>
            <input
              type="number"
              value={holding}
              onChange={(e) => setHolding(e.target.value)}
              placeholder="Ex: 18"
              className="
                w-full border p-2 rounded-lg outline-none
                border-purple-300 bg-white/80
                focus:ring-2 focus:ring-purple-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <button
            onClick={calculateLTCG}
            className="
              mt-2 w-full bg-purple-600 hover:bg-purple-700
              text-white py-2 rounded-lg font-bold
              dark:bg-purple-800 dark:hover:bg-purple-900
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT RESULT */}
      <div
        className="
          p-8 bg-linear-to-br from-purple-500 to-indigo-500
          text-white flex flex-col justify-center
          dark:from-gray-800 dark:to-gray-800
        "
      >
        <h3 className="text-xl font-bold mb-4">📈 Capital Gain Summary</h3>

        {result ? (
          <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-lg">
              <strong>Gain:</strong> ₹{Number(result.gain).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Tax Category:</strong> {result.category}
            </p>
            <p className="text-lg mt-2">
              <strong>Tax Payable:</strong> ₹{Number(result.tax).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-95">
            Enter details to calculate capital gains.
          </p>
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
      FAQ — LTCG
    </h2>

    {faqs.map((f, i) => (
      <div key={i} className="border-b py-3 dark:border-slate-600">
        <button
          onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
          className="
            w-full flex justify-between items-center text-left
            text-gray-700 font-medium
            dark:text-slate-200
          "
        >
          {f.q}
          <span>{openFAQ === i ? "−" : "+"}</span>
        </button>

        {openFAQ === i && (
          <p className="mt-2 text-gray-700 dark:text-slate-300">
            {f.a}
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

export default LTCGCalculator;
