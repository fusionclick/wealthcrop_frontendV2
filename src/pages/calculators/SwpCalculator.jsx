import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SwpCalculator = () => {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState("");
  const [expectedRate, setExpectedRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  //  Validation errors
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validateInputs = () => {
    const newErrors = {};

    if (!initialInvestment || initialInvestment <= 0) {
      newErrors.initialInvestment = "Enter a valid amount greater than 0.";
    }

    if (!monthlyWithdrawal || monthlyWithdrawal <= 0) {
      newErrors.monthlyWithdrawal = "Withdrawal must be greater than 0.";
    }

    if (Number(monthlyWithdrawal) > Number(initialInvestment)) {
      newErrors.monthlyWithdrawal = "Withdrawal cannot exceed investment.";
    }

    if (!expectedRate || expectedRate <= 0) {
      newErrors.expectedRate = "Enter a valid rate.";
    } else if (expectedRate > 40) {
      newErrors.expectedRate = "Rate cannot exceed 40%.";
    }

    if (!years || years <= 0) {
      newErrors.years = "Enter valid years.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // return true if no errors
  };

  const calculateSWP = () => {
    if (!validateInputs()) return;

    const P = Number(initialInvestment);
    const W = Number(monthlyWithdrawal);
    const r = Number(expectedRate) / 100 / 12;
    const n = Number(years) * 12;

    const futureValue = P * Math.pow(1 + r, n);
    const withdrawalsValue = W * ((Math.pow(1 + r, n) - 1) / r);
    const finalBalance = futureValue - withdrawalsValue;

    setResult({
      totalWithdrawn: (W * n).toFixed(0),
      finalBalance: finalBalance.toFixed(0),
    });
  };

  const faqs = [
    { q: "What is an SWP Calculator?", a: "An SWP calculator estimates how long your investments last when you withdraw fixed amounts monthly." },
    { q: "Is SWP good for retirees?", a: "Yes, SWP is ideal for retirement income as it provides steady monthly withdrawals while wealth continues to grow." },
    { q: "Does SWP affect compounding?", a: "Yes, withdrawals reduce the compounding base, but the remaining amount still compounds monthly." },
    { q: "What if withdrawal amount is too high?", a: "The fund may get exhausted earlier if withdrawals exceed your investment growth." },
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
    <h1 className="text-4xl font-extrabold text-teal-700 dark:text-teal-400 drop-shadow">
      SWP Calculator 💸
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Calculate monthly withdrawal sustainability and final investment balance.
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
      {/* LEFT SECTION */}
      <div
        className="
          p-8
          bg-linear-to-br from-teal-50 to-green-50
          dark:from-gray-800 dark:to-gray-900
        "
      >
        <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-400 mb-6">
          Enter Details
        </h2>

        <div className="space-y-4">
          {[
            {
              key: "initialInvestment",
              label: "Initial Investment (₹)",
              value: initialInvestment,
              setter: setInitialInvestment,
              placeholder: "Ex: 10,00,000",
            },
            {
              key: "monthlyWithdrawal",
              label: "Monthly Withdrawal (₹)",
              value: monthlyWithdrawal,
              setter: setMonthlyWithdrawal,
              placeholder: "Ex: 20,000",
            },
            {
              key: "expectedRate",
              label: "Expected Annual Return (%)",
              value: expectedRate,
              setter: setExpectedRate,
              placeholder: "Ex: 8",
            },
            {
              key: "years",
              label: "Duration (Years)",
              value: years,
              setter: setYears,
              placeholder: "Ex: 15",
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
                className={`
                  w-full p-2 rounded-lg outline-none
                  bg-white/80 dark:bg-gray-800 dark:text-white
                  border
                  ${
                    errors[item.key]
                      ? "border-red-400 focus:ring-2 focus:ring-red-400"
                      : "border-teal-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
                  }
                `}
              />

              {errors[item.key] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[item.key]}
                </p>
              )}
            </div>
          ))}

          <button
            onClick={calculateSWP}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-teal-600 hover:bg-teal-700
              dark:bg-teal-500 dark:hover:bg-teal-600
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT SECTION — SWP COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-emerald-500 to-green-500
          dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 SWP Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <p className="text-lg">
              <strong>Total Withdrawn:</strong> ₹
              {Number(result.totalWithdrawn).toLocaleString()}
            </p>

            <p className="text-lg mt-1">
              <strong>Final Balance:</strong> ₹
              {Number(result.finalBalance).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-95">
            Fill details and calculate to view summary.
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 SWP gives monthly income while keeping your investment working.
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
      FAQ — SWP
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
        onClick={() => navigate("/calculator/lumpsum-calculator")}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Lumpsum Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/sip-calculator")}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
      >
        SIP Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/retirement-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Retirement Calculator
      </button>
      <button
        onClick={() => navigate("/calculator/fd-calculator")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        FD Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

  );
};

export default SwpCalculator;
