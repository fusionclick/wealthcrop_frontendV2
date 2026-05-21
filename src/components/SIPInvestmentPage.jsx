import React, { useState } from 'react';

export function SIPInvestmentPage() {
  const sipFaqs = [
    { q: 'What is SIP?', a: 'A SIP (Systematic Investment Plan) is a method of investing small fixed amounts at regular intervals into mutual funds. It promotes consistency and reduces the stress of timing the market.' },
    { q: 'Does SIP reduce risk?', a: 'Yes. Through rupee-cost averaging, SIP reduces the impact of market volatility by purchasing more units when prices are low and fewer when prices are high.' },
    { q: 'What is the minimum amount required?', a: 'Most mutual funds allow SIPs starting from ₹100 to ₹500 per month, making it affordable for all investors.' },
    { q: 'Can SIP outperform lump sum?', a: 'During volatile or sideways markets, SIP often performs better because investments are staggered, reducing timing risk.' },
    { q: 'Can I pause, skip, or stop SIP?', a: 'Yes. SIPs can be paused or stopped anytime without penalties. You can also modify the amount whenever needed.' },
    { q: 'Does SIP give tax benefits?', a: 'Only ELSS (Equity Linked Savings Scheme) SIPs provide Section 80C tax benefits up to ₹1.5 lakh per year with a 3-year lock-in period.' },
    { q: 'How long should I continue SIP?', a: 'For equity SIPs, a minimum horizon of 5–7 years is recommended for optimal compounding and reduced volatility.' },
    { q: 'Can I increase SIP amount later?', a: 'Yes. You can step-up your SIP annually or manually increase the amount anytime based on your income and goals.' }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="
  min-h-screen p-8
  bg-linear-to-b from-blue-50 via-white to-blue-100
  dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
">
  <div
    className="
      max-w-3xl mx-auto p-8 rounded-2xl shadow-xl border
      bg-white border-blue-200
      dark:bg-slate-900 dark:border-slate-700
    "
  >
    {/* Header */}
    <div className="flex items-start gap-6">
      <div
        className="
          w-20 h-20 rounded-xl flex items-center justify-center text-3xl shadow-lg
          bg-gradient-to-br from-blue-300 to-blue-500
          dark:from-blue-600 dark:to-blue-800
        "
      >
        📈
      </div>

      <div>
        <h2 className="
          text-4xl font-bold mb-3
          text-gray-900
          dark:text-slate-100
        ">
          SIP — Systematic Investment Plan
        </h2>

        <p className="
          leading-relaxed mb-6
          text-gray-600
          dark:text-slate-300
        ">
          SIP is one of the most effective and disciplined ways to build long-term wealth. 
          Instead of investing a large amount at once, you invest small amounts at regular intervals.
          This reduces market timing stress, manages risk, and leverages the power of compounding.
        </p>
      </div>
    </div>

    {/* Why SIP Works */}
    <div
      className="
        mt-6 rounded-xl p-5 border
        bg-blue-50 border-blue-100
        dark:bg-slate-800 dark:border-slate-700
      "
    >
      <h3 className="
        text-xl font-semibold mb-2
        text-blue-800
        dark:text-blue-300
      ">
        Why SIP Works?
      </h3>

      <ul className="
        space-y-2 leading-relaxed
        text-gray-700
        dark:text-slate-300
      ">
        <li>✔ Encourages consistent financial discipline.</li>
        <li>✔ Helps average out market ups and downs.</li>
        <li>✔ Suitable for beginners & experienced investors.</li>
        <li>✔ Ideal for long-term wealth creation & financial goals.</li>
        <li>✔ Can be automated — set once and continue worry-free.</li>
      </ul>
    </div>

    {/* How SIP Helps */}
    <div className="
      mt-6 leading-relaxed
      text-gray-700
      dark:text-slate-300
    ">
      <h3 className="
        text-xl font-semibold mb-2
        text-gray-900
        dark:text-slate-100
      ">
        How SIP Helps You Grow?
      </h3>

      <p className="mb-4">
        SIPs use the power of compounding, meaning your returns start generating their own returns 
        as time passes. Even small monthly investments grow into large wealth when continued for years.
      </p>

      <p className="mb-4">
        SIPs also reduce emotional investing. Instead of panicking during market dips or highs, 
        your fixed investments keep happening, capturing opportunities automatically.
      </p>

      <p className="mb-4">
        Most importantly, SIPs fit all types of financial goals — retirement, buying a house, 
        child education, vacations, or simply building wealth.
      </p>
    </div>

    {/* FAQ */}
    <h3 className="
      text-2xl font-bold mt-10 mb-4
      text-gray-900
      dark:text-slate-100
    ">
      Frequently Asked Questions
    </h3>

    <div className="space-y-3">
      {sipFaqs.map((f, i) => {
        const isOpen = openIndex === i;

        return (
          <div
            key={i}
            className="
              rounded-xl shadow-sm border
              bg-white border-gray-200
              dark:bg-slate-900 dark:border-slate-700
            "
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="
                w-full px-4 py-4 flex justify-between items-center font-medium text-left
                text-gray-900
                dark:text-slate-200
              "
            >
              {f.q}
              <span className="text-xl">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="
                px-4 pb-4 text-sm leading-relaxed
                text-gray-600
                dark:text-slate-400
              ">
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>

  );
}
