import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HraCalculator = () => {
  const [basicSalary, setBasicSalary] = useState("");
  const [hraReceived, setHraReceived] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [cityType, setCityType] = useState("non-metro");
  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const navigate = useNavigate();

  const calculateHRA = () => {
    if (!basicSalary || !hraReceived || !rentPaid) return;

    const basic = Number(basicSalary);
    const hra = Number(hraReceived);
    const rent = Number(rentPaid);
    const isMetro = cityType === "metro";

    const actualHRA = hra;
    const rentMinus10 = Math.max(rent - 0.1 * basic, 0);
    const basicPercent = (isMetro ? 0.5 : 0.4) * basic;

    const hraExemptMonthly = Math.min(actualHRA, rentMinus10, basicPercent);
    const hraTaxableMonthly = Math.max(actualHRA - hraExemptMonthly, 0);

    setResult({
      hraExemptMonthly: hraExemptMonthly.toFixed(0),
      hraTaxableMonthly: hraTaxableMonthly.toFixed(0),
      hraExemptYearly: (hraExemptMonthly * 12).toFixed(0),
      hraTaxableYearly: (hraTaxableMonthly * 12).toFixed(0),
    });
  };

  const faqs = [
    { q: "What is HRA (House Rent Allowance)?", a: "HRA is a salary component paid for bearing rent expenses." },
    { q: "How is HRA exemption calculated?", a: "Least of: HRA received, Rent paid - 10% of basic, and 50% (metro) / 40% (non-metro) of basic salary." },
    { q: "Who can claim HRA?", a: "Salaried employees living in rented accommodation." },
    { q: "Which cities are metro?", a: "Delhi, Mumbai, Kolkata, Chennai." },
  ];

  return (
  <div
  className="
    min-h-screen
    bg-linear-to-r from-blue-100 to-green-100
    dark:from-gray-900 dark:to-gray-800
  "
>
  {/* ⭐ HEADER */}
  <div
    className="
      py-14 px-6 text-center
      bg-linear-to-r from-blue-100 to-green-100
      dark:from-gray-900 dark:to-gray-800
    "
  >
    <h1 className="text-4xl font-extrabold text-cyan-700 dark:text-cyan-400 drop-shadow">
      HRA Calculator 🏠💼
    </h1>

    <p className="max-w-3xl mx-auto mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Calculate how much HRA is exempt and taxable based on your salary,
      rent payments, and city type.
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
          {/* Basic Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Basic Salary (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 40,000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-cyan-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
            />
          </div>

          {/* HRA Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              HRA Received (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 15,000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-cyan-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={hraReceived}
              onChange={(e) => setHraReceived(e.target.value)}
            />
          </div>

          {/* Rent Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Rent Paid (₹)
            </label>
            <input
              type="number"
              placeholder="Ex: 12,000"
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-cyan-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={rentPaid}
              onChange={(e) => setRentPaid(e.target.value)}
            />
          </div>

          {/* City Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              City Type
            </label>
            <select
              className="
                w-full p-2 rounded-lg outline-none
                border border-gray-300
                focus:ring-2 focus:ring-cyan-400
                bg-white
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
              "
              value={cityType}
              onChange={(e) => setCityType(e.target.value)}
            >
              <option value="metro">Metro</option>
              <option value="non-metro">Non-Metro</option>
            </select>
          </div>

          <button
            onClick={calculateHRA}
            className="
              mt-2 w-full py-2 rounded-lg font-bold text-sm transition
              bg-cyan-600 hover:bg-cyan-700
              text-white
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* ⭐ RIGHT RESULT SECTION — HRA COLOR */}
      <div
        className="
          p-8
          bg-linear-to-br from-cyan-600 to-blue-700
        dark:from-gray-800 dark:to-gray-800
          text-white flex flex-col justify-center
        "
      >
        <h3 className="text-xl font-bold mb-4">📊 HRA Summary</h3>

        {result ? (
          <div className="bg-white/20 dark:bg-black/30 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2">
            <p className="text-lg">
              <strong>Exempt HRA:</strong> ₹
              {Number(result.hraExemptMonthly).toLocaleString()}
            </p>
            <p className="text-lg">
              <strong>Taxable HRA:</strong> ₹
              {Number(result.hraTaxableMonthly).toLocaleString()}
            </p>

            <p className="text-sm mt-3">
              <strong>Exempt (Yearly):</strong> ₹
              {Number(result.hraExemptYearly).toLocaleString()}
            </p>
            <p className="text-sm">
              <strong>Taxable (Yearly):</strong> ₹
              {Number(result.hraTaxableYearly).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-80">Enter details and click calculate.</p>
        )}

        <div className="mt-6 text-sm opacity-80">
          💡 HRA exemption = least of the 3 rule values.
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
        onClick={() => navigate("/calculator/inflation-calculator")}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Inflation Calculator
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
        onClick={() => navigate("/calculator/retirement-calculator")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Retirement Calculator
      </button>
    </div>
  </div>

  <div className="pb-10" />
</div>

);

};

export default HraCalculator;
