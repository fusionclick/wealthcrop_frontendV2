import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EmiCalculator = () => {
  const navigate = useNavigate();

  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureYears, setTenureYears] = useState("");

  const [result, setResult] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const validateInputs = () => {
    if (!loanAmount || !interestRate || !tenureYears) {
      alert("Please fill all fields.");
      return false;
    }
    if (loanAmount <= 0 || interestRate <= 0 || tenureYears <= 0) {
      alert("Values must be greater than zero.");
      return false;
    }
    return true;
  };

  const calculateEMI = () => {
    if (!validateInputs()) return;

    const P = Number(loanAmount);
    const r = Number(interestRate) / 12 / 100;
    const n = Number(tenureYears) * 12;

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;

    setResult({
      emi: emi.toFixed(0),
      totalInterest: totalInterest.toFixed(0),
      totalPayable: totalPayable.toFixed(0),
    });
  };

  const faqs = [
    { q: "What is EMI?", a: "EMI stands for Equated Monthly Installment, a fixed monthly loan repayment." },
    { q: "Does EMI include interest?", a: "Yes, EMI includes both principal and interest components." },
    { q: "Can I reduce EMI?", a: "Yes, by increasing tenure or making prepayments." },
    { q: "Is EMI fixed?", a: "Most loans have fixed EMI, but some offer floating EMI options." },
    { q: "What affects EMI the most?", a: "Loan amount, interest rate, and tenure duration." },
    { q: "Does prepayment reduce EMI?", a: "Prepayment reduces the principal and may lower EMI or tenure." },
    { q: "Which loans use EMI?", a: "Home loans, car loans, personal loans, and education loans." },
    { q: "What happens if EMI is missed?", a: "Banks charge penalties and it may affect credit score." },
  ];

  return (
    <div className="
  min-h-screen 
  bg-linear-to-r from-blue-100 to-green-100
  dark:from-slate-900 dark:to-slate-800
">

  {/* HEADER */}
  <div className="py-14 px-6 text-center">
    <h1 className="
      text-4xl font-extrabold text-orange-700 drop-shadow
      dark:text-orange-400
    ">
      EMI Calculator 🧮
    </h1>
    <p className="
      max-w-3xl mx-auto mt-4 text-gray-700 text-lg
      dark:text-slate-300
    ">
      Calculate your monthly EMI, total interest and total payable amount easily.
    </p>
  </div>

  {/* MAIN CARD */}
  <div className="flex justify-center items-center p-6">
    <div className="
      w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden 
      grid md:grid-cols-2 border border-gray-200
      bg-white
      dark:bg-slate-900 dark:border-slate-700
    ">

      {/* LEFT INPUTS */}
      <div className="
        p-8 bg-linear-to-br from-orange-50 to-yellow-50
        dark:from-slate-800 dark:to-slate-900
      ">
        <h2 className="
          text-2xl font-bold text-orange-700 mb-6
          dark:text-orange-400
        ">
          Enter Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Loan Amount (₹)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="Ex: 10,00,000"
              className="
                w-full outline-none border border-orange-300 p-2 rounded-lg
                bg-white/80
                focus:ring-2 focus:ring-orange-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Ex: 9.5"
              className="
                w-full outline-none border border-orange-300 p-2 rounded-lg
                bg-white/80
                focus:ring-2 focus:ring-orange-500
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Tenure (Years)
            </label>
            <input
              type="number"
              value={tenureYears}
              onChange={(e) => setTenureYears(e.target.value)}
              placeholder="Ex: 20"
              className="
                w-full border border-orange-300 p-2 rounded-lg
                bg-white/80 focus:ring-2 focus:ring-orange-500 outline-none
                dark:bg-slate-800 dark:border-slate-600 dark:text-white
              "
            />
          </div>

          <button
            onClick={calculateEMI}
            className="
              mt-2 w-full bg-orange-600 hover:bg-orange-700 
              text-white py-2 rounded-lg font-bold text-sm transition
              dark:bg-orange-700 dark:hover:bg-orange-800
            "
          >
            Calculate EMI
          </button>
        </div>
      </div>

      {/* RIGHT RESULT */}
      <div className="
        p-8 bg-linear-to-br from-red-500 to-orange-500 
        dark:from-gray-800 dark:to-gray-800
        text-white flex flex-col justify-center
      ">
        <h3 className="text-xl font-bold mb-4">📊 EMI Summary</h3>

        {result ? (
          <div className="
            bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm
            dark:bg-black/30
          ">
            <p className="text-lg">
              <strong>Monthly EMI:</strong> ₹{Number(result.emi).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Total Interest:</strong> ₹{Number(result.totalInterest).toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Total Payable:</strong> ₹{Number(result.totalPayable).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-95">Fill details to calculate EMI.</p>
        )}

        <p className="mt-6 text-sm opacity-90">
          💡 EMI helps you plan your loan repayment smartly.
        </p>
      </div>
    </div>
  </div>

  {/* FAQ SECTION */}
  <div className="
    max-w-4xl mx-auto mt-10 p-6 rounded-2xl shadow
    bg-linear-to-r from-blue-200 to-green-100
    dark:from-slate-800 dark:to-slate-700
  ">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
      FAQ — EMI
    </h2>

    {faqs.map((item, index) => (
      <div key={index} className="border-b dark:border-slate-600 py-3">
        <button
          className="
            w-full flex justify-between items-center text-left 
            text-gray-700 font-medium
            dark:text-slate-200
          "
          onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
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
    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
      Related Calculators
    </h2>

    <div className="flex gap-4 flex-wrap">
      <button onClick={() => navigate("/calculator/sip-calculator")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
        SIP Calculator
      </button>
      <button onClick={() => navigate("/calculator/cagr-calculator")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow">
        CAGR Calculator
      </button>
      <button onClick={() => navigate("/calculator/fd-calculator")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow">
        FD Calculator
      </button>
      <button onClick={() => navigate("/calculator/swp-calculator")} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow">
        SWP Calculator
      </button>
    </div>
  </div>

  <div className="pb-10"></div>
</div>

  );
};

export default EmiCalculator;
