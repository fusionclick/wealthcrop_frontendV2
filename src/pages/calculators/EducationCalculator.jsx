import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { blank, inr } from "../../utils/calcSafe";
import { educationPlan } from "../../utils/calculators";
import { useCalcState } from "./CalcShell";
import Projection from "./Projection";

// Audit #67 — the spec's inputs. "Years Left" is now the gap between the child's age and the
// age the course starts, and the lump "current cost" is a yearly fee times the course length,
// because a four-year course is paid over four years at four different prices. 0% inflation
// and 0% return stay legitimate answers (QA 10.3); the zero-safe maths lives in educationPlan.
const FIELDS = [
  { key: "childAge", label: "Child's Current Age (Years)", placeholder: "Ex: 5" },
  { key: "startAge", label: "Age When Higher Education Starts", placeholder: "Ex: 18" },
  { key: "annualCost", label: "Annual Cost in Today's Money (₹)", placeholder: "Ex: 500000" },
  { key: "courseYears", label: "Course Duration (Years)", placeholder: "Ex: 4" },
  { key: "inflation", label: "Education Inflation Rate (%)", placeholder: "Ex: 10" },
  { key: "expectedReturn", label: "Expected Return on Investment (%)", placeholder: "Ex: 12" },
  { key: "currentSavings", label: "Current Savings for Education (₹)", placeholder: "Ex: 200000" },
];

const EducationCalculator = () => {
  const [v, set] = useCalcState({
    childAge: "",
    startAge: "18",
    annualCost: "",
    courseYears: "4",
    inflation: "10",
    expectedReturn: "12",
    currentSavings: "0",
  });
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  // Absent is not zero: no answer until every field has a value, and never a stale one.
  const plan = useMemo(() => (FIELDS.some((f) => blank(v[f.key])) ? null : educationPlan(v)), [v]);
  const ready = plan && !plan.error;

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
                className="
                  w-full p-2 rounded-lg outline-none
                  border border-gray-300
                  focus:ring-2 focus:ring-indigo-400
                  bg-white
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                "
                value={v[item.key]}
                onChange={(e) => set(item.key, e.target.value)}
              />
            </div>
          ))}
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

        {ready ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2 break-words">
            <p className="text-lg">
              <strong>Total Needed by Age {plan.startAge}:</strong> ₹{inr(plan.totalNeeded)}
            </p>
            <p className="text-lg">
              <strong>Monthly Savings (SIP) Required:</strong> ₹{inr(plan.monthlySIP)}
            </p>
            <p className="text-lg">
              <strong>Your Current Savings Will Grow To:</strong> ₹{inr(plan.savingsAtStart)}
            </p>
            <p className="text-lg">
              <strong>First Year&apos;s Fee Then:</strong> ₹{inr(plan.firstYearFee)}
            </p>
            <p className="text-sm opacity-90">
              {plan.yearsToStart} years to save.
              {plan.monthlySIP === 0 && " Your savings already cover it — no SIP needed."}
            </p>
          </div>
        ) : (
          <p className="opacity-80">
            {plan?.error || "Fill in every field to see your education plan."}
          </p>
        )}

        <div className="mt-6 text-sm opacity-80">
          💡 Each year&apos;s fee is inflated to the year it is paid. Once the course starts, the money
          is assumed to sit somewhere safe and is drawn as fees fall due, so it is not counted as
          still earning the market return.
        </div>
      </div>
    </div>
  </div>

  {ready && (
    <Projection
      title="Your education fund projection"
      rows={plan.projection}
      switchAge={plan.startAge}
      switchLabel="Course starts"
      ageLabel="Child's age"
      inLabel="SIP paid in"
      outLabel="Fees paid"
      spendPhase="Studying"
    />
  )}

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
