import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PpfCalculator = () => {
  const navigate = useNavigate();

  const [yearlyInvestment, setYearlyInvestment] = useState("");
  const [interestRate, setInterestRate] = useState(7.1); // default PPF rate
  const [years, setYears] = useState(15);

  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const validate = () => {
    if (!yearlyInvestment || !interestRate || !years) {
      alert("Please fill all fields!");
      return false;
    }
    return true;
  };

  const calculatePPF = () => {
    if (!validate()) return;

    let balance = 0;
    const r = interestRate / 100;

    for (let i = 1; i <= years; i++) {
      balance = (balance + Number(yearlyInvestment)) * (1 + r);
    }

    const totalDeposit = Number(yearlyInvestment) * years;
    const interestEarned = balance - totalDeposit;

    setResult({
      balance: balance.toFixed(0),
      totalDeposit: totalDeposit.toFixed(0),
      interestEarned: interestEarned.toFixed(0),
    });
  };

  const faqs = [
    { q: "What is PPF?", a: "PPF (Public Provident Fund) is a government-backed long-term savings scheme." },
    { q: "How long is PPF lock-in?", a: "PPF has a 15-year lock-in period." },
    { q: "Is PPF interest tax-free?", a: "Yes! PPF interest is fully tax-free under Section 80C." },
    { q: "Can I extend PPF?", a: "Yes, you can extend for 5-year blocks unlimited times." },
    { q: "Minimum yearly deposit?", a: "Minimum ₹500 per year." },
    { q: "Maximum yearly deposit?", a: "Maximum ₹1,50,000 per year." },
    { q: "Is premature withdrawal allowed?", a: "Partial withdrawal is allowed after 5 years." },
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
    <h1 className="text-4xl font-extrabold text-green-800 dark:text-green-400 drop-shadow">
      PPF Calculator 🧾
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg">
      Calculate your PPF maturity amount, interest earned and total deposit.
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
      {/* LEFT Inputs */}
      <div
        className="
          p-8
          bg-linear-to-br from-green-50 to-blue-50
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6">
          Enter Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-400">
              Yearly Deposit (₹)
            </label>
            <input
              type="number"
              value={yearlyInvestment}
              onChange={(e) => setYearlyInvestment(e.target.value)}
              placeholder="Ex: 50,000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-green-300
                bg-white/80
                focus:ring-2 focus:ring-green-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-400">
              Interest Rate (%)
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Ex: 7.1"
              className="
                w-full p-2 rounded-lg outline-none
                border border-green-300
                bg-white/80
                focus:ring-2 focus:ring-green-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-400">
              Time Period (Years)
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="Ex: 15"
              className="
                w-full p-2 rounded-lg outline-none
                border border-green-300
                bg-white/80
                focus:ring-2 focus:ring-green-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <button
            onClick={calculatePPF}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-green-600 hover:bg-green-700
              dark:bg-green-700 dark:hover:bg-green-800
              text-white
            "
          >
            Calculate PPF
          </button>
        </div>
      </div>

      {/* RIGHT RESULT — PPF COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-green-600 to-blue-600
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 PPF Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-lg">
              <strong>Maturity Amount:</strong> ₹
              {Number(result.balance).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Total Deposit:</strong> ₹
              {Number(result.totalDeposit).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Interest Earned:</strong> ₹
              {Number(result.interestEarned).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-95">Fill details to calculate PPF.</p>
        )}

        <p className="mt-6 text-sm opacity-90">
          💡 PPF is one of the safest tax-free long-term investments.
        </p>
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
      FAQ — PPF
    </h2>

    {faqs.map((item, index) => (
      <div key={index} className="border-b dark:border-slate-600 py-3">
        <button
          onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
          className="w-full flex justify-between text-gray-700 dark:text-slate-200 font-medium"
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
      <button onClick={() => navigate("/calculator/cagr-calculator")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
        CAGR Calculator
      </button>
      <button onClick={() => navigate("/calculator/nps-calculator")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow">
        NPS Calculator
      </button>
      <button onClick={() => navigate("/calculator/apy-calculator")} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow">
        APY Calculator
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

export default PpfCalculator;
