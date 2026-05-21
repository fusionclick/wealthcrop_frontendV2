import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EightyCTracker = () => {
  const navigate = useNavigate();

  const [inputs, setInputs] = useState({
    elss: "",
    pf: "",
    ppf: "",
    insurance: "",
    nps: "",
    tuition: "",
  });

  const [result, setResult] = useState(null);
  const [faq, setFAQ] = useState(null);

  const handleChange = (key, value) => {
    setInputs({ ...inputs, [key]: value });
  };

  const calculate = () => {
    const total =
      Number(inputs.elss || 0) +
      Number(inputs.pf || 0) +
      Number(inputs.ppf || 0) +
      Number(inputs.insurance || 0) +
      Number(inputs.nps || 0) +
      Number(inputs.tuition || 0);

    const maxLimit = 150000;
    const remaining = Math.max(0, maxLimit - total);

    setResult({
      total,
      remaining,
    });
  };

  const faqs = [
    { q: "What is 80C limit?", a: "You can claim up to ₹1,50,000 per financial year under Section 80C." },
    { q: "Does ELSS qualify?", a: "Yes, ELSS mutual funds qualify under 80C." },
    { q: "Does NPS qualify?", a: "Only tier-1 contributions qualify under 80C and 80CCD." },
    { q: "Can I claim both PPF and EPF?", a: "Yes, both are eligible but total still must be within ₹1,50,000 limit." },
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
    <h1 className="text-4xl font-extrabold text-green-700 drop-shadow dark:text-green-400">
      80C Tracker 🟢
    </h1>
    <p className="max-w-3xl mx-auto mt-4 text-gray-700 text-lg dark:text-slate-300">
      Track your tax-saving investments and remaining limit under Section 80C.
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
      {/* LEFT */}
      <div
        className="
          p-8 bg-linear-to-br from-green-50 to-teal-50
          dark:from-slate-800 dark:to-slate-900
        "
      >
        <h2 className="text-2xl font-bold text-green-700 mb-6 dark:text-green-400">
          Enter Your 80C Investments
        </h2>

        <div className="space-y-3">
          {[
            ["ELSS", "elss", "Ex: 50000"],
            ["EPF / PF", "pf", "Ex: 60000"],
            ["PPF", "ppf", "Ex: 50000"],
            ["Life Insurance Premium", "insurance", "Ex: 12000"],
            ["NPS", "nps", "Ex: 20000"],
            ["Tuition Fees", "tuition", "Ex: 30000"],
          ].map(([label, key, ph]) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {label}
              </label>
              <input
                type="number"
                value={inputs[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={ph}
                className="
                  w-full border p-2 rounded-lg outline-none
                  border-green-300 bg-white/80
                  focus:ring-2 focus:ring-green-500
                  dark:bg-slate-800 dark:border-slate-600 dark:text-white
                "
              />
            </div>
          ))}

          <button
            onClick={calculate}
            className="
              mt-2 w-full bg-green-600 hover:bg-green-700
              text-white py-2 rounded-lg font-bold
              dark:bg-green-800 dark:hover:bg-green-900
            "
          >
            Calculate
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="
          p-8 bg-linear-to-br from-green-500 to-teal-500
          text-white flex flex-col justify-center
          dark:from-gray-800 dark:to-gray-800
        "
      >
        <h3 className="text-xl font-bold mb-4">📘 80C Summary</h3>

        {result ? (
          <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-lg">
              <strong>Total 80C Used:</strong>{" "}
              ₹{result.total.toLocaleString()}
            </p>
            <p className="text-lg mt-2">
              <strong>Remaining Limit:</strong>{" "}
              ₹{result.remaining.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="opacity-95">
            Enter details to check 80C usage.
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
      FAQ — 80C
    </h2>

    {faqs.map((f, i) => (
      <div key={i} className="border-b py-3 dark:border-slate-600">
        <button
          onClick={() => setFAQ(faq === i ? null : i)}
          className="
            w-full flex justify-between items-center text-left
            text-gray-700 font-medium
            dark:text-slate-200
          "
        >
          {f.q}
          <span>{faq === i ? "−" : "+"}</span>
        </button>

        {faq === i && (
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

export default EightyCTracker;
