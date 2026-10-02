import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { blank, inr } from "../../utils/calcSafe";
import { retirementPlan } from "../../utils/calculators";
import { useCalcState } from "./CalcShell";
import Projection from "./Projection";

// Audit #66 — the spec's inputs: current age, retirement age, monthly expenses, the return
// before AND after retirement, and current savings. Inflation stays, and life expectancy
// replaces the 30-year retirement the old page assumed without saying so.
const FIELDS = [
  { key: "currentAge", label: "Current Age (Years)", placeholder: "Ex: 30" },
  { key: "retirementAge", label: "Retirement Age (Years)", placeholder: "Ex: 60" },
  { key: "lifeExpectancy", label: "Life Expectancy (Years)", placeholder: "Ex: 85", hint: "How long the money has to last" },
  { key: "monthlyExpense", label: "Monthly Expenses Today (₹)", placeholder: "Ex: 40000" },
  { key: "inflation", label: "Expected Inflation Rate (%)", placeholder: "Ex: 6" },
  { key: "preReturn", label: "Expected Return Before Retirement (% p.a.)", placeholder: "Ex: 12" },
  { key: "postReturn", label: "Expected Return After Retirement (% p.a.)", placeholder: "Ex: 7" },
  { key: "currentSavings", label: "Current Retirement Savings (₹)", placeholder: "Ex: 500000" },
];

const RetirementCalculator = () => {
  const [v, set] = useCalcState({
    currentAge: "",
    retirementAge: "",
    lifeExpectancy: "85",
    monthlyExpense: "",
    inflation: "6",
    preReturn: "12",
    postReturn: "7",
    currentSavings: "0",
  });
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  // Absent is not zero: until every field has a value there is no plan to show. Live, so the
  // answer can never be left over from inputs that have since changed.
  const plan = useMemo(() => (FIELDS.some((f) => blank(v[f.key])) ? null : retirementPlan(v)), [v]);
  const ready = plan && !plan.error;

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
          {FIELDS.map((item) => (
            <div key={item.key}>
              <label htmlFor={item.key} className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                {item.label}
              </label>

              <input
                id={item.key}
                type="number"
                min="0"
                placeholder={item.placeholder}
                value={v[item.key]}
                onChange={(e) => set(item.key, e.target.value)}
                className="
                  w-full p-2 rounded-lg outline-none
                  border border-purple-200
                  bg-white/80
                  focus:ring-2 focus:ring-purple-400
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                "
              />
              {item.hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.hint}</p>}
            </div>
          ))}
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

        {ready ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2 break-words">
            <p className="text-lg">
              <strong>Total Corpus Needed at Age {plan.retirementAge}:</strong> ₹{inr(plan.corpus)}
            </p>
            <p className="text-lg">
              <strong>Monthly SIP Required:</strong> ₹{inr(plan.monthlySIP)}
            </p>
            <p className="text-lg">
              <strong>Your Current Savings Will Grow To:</strong> ₹{inr(plan.savingsAtRetirement)}
            </p>
            <p className="text-lg">
              <strong>Monthly Expense at Retirement:</strong> ₹{inr(plan.expenseAtRetirement)}
            </p>
            <p className="text-sm opacity-90">
              {plan.yearsToRetire} years to save, then {plan.yearsRetired} years of retirement to fund.
              {plan.monthlySIP === 0 && " Your savings already cover it — no SIP needed."}
            </p>
          </div>
        ) : (
          <p className="opacity-90">
            {plan?.error || "Fill in every field to see your retirement plan."}
          </p>
        )}

        <div className="mt-8 text-sm opacity-90">
          💡 Savings and the SIP compound monthly at the return before retirement. After it, each
          year&apos;s expenses are withdrawn at the start of the year and keep rising with inflation,
          while the rest earns the return after retirement — so the corpus lasts to your life
          expectancy.
        </div>
      </div>
    </div>
  </div>

  {ready && (
    <Projection
      title="Your retirement projection"
      rows={plan.projection}
      switchAge={plan.retirementAge}
      switchLabel="Retirement"
      ageLabel="Age"
      inLabel="SIP paid in"
      outLabel="Withdrawn"
      spendPhase="Retired"
    />
  )}

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
