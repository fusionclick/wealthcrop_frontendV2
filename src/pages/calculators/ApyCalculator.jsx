import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ApyCalculator = () => {
  const navigate = useNavigate();

  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const validateInputs = () => {
    if (!monthlyContribution || !interestRate || !years) {
      alert("Please fill all fields.");
      return false;
    }
    if (monthlyContribution <= 0 || interestRate <= 0 || years <= 0) {
      alert("Values must be greater than zero.");
      return false;
    }
    return true;
  };

  const calculateAPY = () => {
    if (!validateInputs()) return;

    const P = Number(monthlyContribution);
    const r = Number(interestRate) / 100 / 12;
    const n = Number(years) * 12;

    // Compound interest with monthly contribution formula
    const maturity = P * ((Math.pow(1 + r, n) - 1) / r);
    const totalDeposit = P * n;
    const interestEarned = maturity - totalDeposit;

    setResult({
      maturity: maturity.toFixed(0),
      interestEarned: interestEarned.toFixed(0),
      totalDeposit: totalDeposit.toFixed(0),
    });
  };

  const faqs = [
    { q: "What is APY?", a: "APY stands for Atal Pension Yojana, a pension scheme by the Government of India." },
    { q: "How much pension will I get?", a: "You can receive a pension of ₹1,000 to ₹5,000 per month after age 60 depending on contribution." },
    { q: "Is APY guaranteed?", a: "Yes, pension is guaranteed by the Government of India." },
    { q: "Can I exit APY early?", a: "Exit is allowed only for exceptional cases such as death or terminal illness." },
    { q: "Is APY tax exempt?", a: "Contributions may qualify for deductions under section 80CCD." },
    { q: "What affects APY contribution?", a: "Your entry age and chosen pension amount determines your monthly contribution." },
    { q: "Who can open APY?", a: "Any Indian citizen aged 18-40 with a bank account." },
    { q: "Is APY helpful for yearly investment?", a: "Yes if you invest through APY it will help you in future. "},
    { q: "How much should i invest yearly?", a: "You should invest more than 20,000 yearly."}
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
    <h1 className="text-4xl font-extrabold text-blue-400 dark:text-cyan-400 drop-shadow-lg">
      APY Calculator 📅
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-lg text-gray-700 dark:text-gray-300">
      Estimate your Atal Pension Yojana maturity and benefits instantly.
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
      <div
        className="
          p-8
          bg-linear-to-br from-blue-50 to-cyan-100
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">
          Enter Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Monthly Contribution (₹)
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="Ex: 500"
              className="
                w-full p-2 rounded-lg outline-none
                border border-cyan-300
                bg-white/80
                focus:ring-2 focus:ring-cyan-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Ex: 8"
              className="
                w-full p-2 rounded-lg outline-none
                border border-cyan-300
                bg-white/80
                focus:ring-2 focus:ring-cyan-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Tenure (Years)
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="Ex: 20"
              className="
                w-full p-2 rounded-lg outline-none
                border border-cyan-300
                bg-white/80
                focus:ring-2 focus:ring-cyan-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
            />
          </div>

          <button
            onClick={calculateAPY}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-cyan-600 hover:bg-cyan-700
              dark:bg-cyan-600 dark:hover:bg-cyan-700
              text-white
            "
          >
            Calculate APY
          </button>
        </div>
      </div>

      {/* RIGHT RESULT — APY COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-blue-600 to-cyan-500
         dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 APY Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-lg">
              <strong>Maturity Amount:</strong> ₹
              {Number(result.maturity).toLocaleString()}
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
          <p className="opacity-95">
            Fill details to calculate APY.
          </p>
        )}

        <p className="mt-6 text-sm opacity-90">
          💡 APY ensures guaranteed pension for your retirement life.
        </p>
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
      FAQ — APY
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
        onClick={() => navigate("/calculator/emi-calculator")}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
      >
        EMI Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/swp-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        SWP Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/lumpsum-calculator")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Lumpsum Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/ppf-calculator")}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
      >
        PPF Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

  );
};

export default ApyCalculator;
