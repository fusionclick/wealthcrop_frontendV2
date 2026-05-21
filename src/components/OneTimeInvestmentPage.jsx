import { useState } from "react";

export function OneTimeInvestmentPage() {
  const oneTimeFaqs = [
    { q: 'What is lump sum investment?', a: 'A lump sum investment means investing a large amount at once instead of spreading it over time. This gives immediate market exposure and potential for faster compounding.' },
    { q: 'When is lump sum better?', a: 'Lump sum works best when markets are undervalued or when you expect positive momentum over the next few years.' },
    { q: 'Is lump sum risky?', a: 'Yes. The biggest risk is investing before a market correction. If markets fall soon after your investment, short-term losses may occur.' },
    { q: 'How can I reduce the risk?', a: 'Instead of investing the whole amount at once, you can break it into 2–3 tranches or use a hybrid approach with partial SIP + partial lump sum.' },
    { q: 'Which mutual funds suit lump sum?', a: 'Large-cap, balanced advantage, and diversified equity funds are considered more stable for lump sum deployment. Mid & small caps carry higher volatility.' },
    { q: 'How does taxation work?', a: 'Tax depends on fund type and holding period. Equity funds have 15% tax for short-term (under 1 year) and 10% LTCG for long-term (above 1 year).' },
    { q: 'Can I shift from lump sum to SIP later?', a: 'Yes. You can start SIPs in new funds or use STP (Systematic Transfer Plan) to move money gradually from a debt fund to an equity fund.' },
    { q: 'Is lump sum good for short-term goals?', a: 'Only if your timeline is 1–3 years and you choose low-risk or debt-oriented funds. For equity, long-term is recommended.' }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
   <div
  className="
    min-h-screen p-8
    bg-linear-to-b from-rose-50 via-white to-red-50
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  <div
    className="
      max-w-3xl mx-auto p-8 rounded-2xl shadow-xl border
      bg-white border-rose-200
      dark:bg-slate-900 dark:border-slate-700
    "
  >
    {/* Header Section */}
    <div className="flex items-start gap-6">
      <div
        className="
          w-20 h-20 rounded-xl flex items-center justify-center text-3xl shadow-lg
          bg-gradient-to-br from-rose-200 to-rose-400
          dark:from-rose-600 dark:to-rose-800
        "
      >
        💰
      </div>

      <div>
        <h2
          className="
            text-4xl font-bold mb-3
            text-gray-900
            dark:text-slate-100
          "
        >
          One-Time (Lump Sum) Investment
        </h2>

        <p
          className="
            leading-relaxed mb-6
            text-gray-600
            dark:text-slate-300
          "
        >
          A one-time investment allows your entire amount to start compounding immediately. 
          It is ideal when markets are at attractive levels or when you have a clear financial 
          strategy and long-term vision.
        </p>
      </div>
    </div>

    {/* Why Consider Lump Sum */}
    <div
      className="
        mt-6 rounded-xl p-5 border
        bg-rose-50 border-rose-100
        dark:bg-slate-800 dark:border-slate-700
      "
    >
      <h3
        className="
          text-xl font-semibold mb-2
          text-rose-800
          dark:text-rose-300
        "
      >
        Why Consider Lump Sum?
      </h3>

      <ul
        className="
          space-y-2 leading-relaxed
          text-gray-700
          dark:text-slate-300
        "
      >
        <li>✔ Provides full market exposure instantly.</li>
        <li>✔ Faster compounding because entire capital is invested upfront.</li>
        <li>✔ Suitable for investors with a clear risk appetite.</li>
        <li>✔ Ideal for investing bonuses, inheritances, or windfalls.</li>
        <li>✔ Can outperform SIP when markets trend upward consistently.</li>
      </ul>
    </div>

    {/* How Lump Sum Helps */}
    <div
      className="
        mt-6 leading-relaxed
        text-gray-700
        dark:text-slate-300
      "
    >
      <h3
        className="
          text-xl font-semibold mb-2
          text-gray-900
          dark:text-slate-100
        "
      >
        How Lump Sum Helps You Grow?
      </h3>

      <p className="mb-4">
        By investing the entire amount at once, you give your capital more time to grow. 
        If markets rise steadily over the next few years, lump sum investments can deliver 
        significantly higher returns compared to staggered SIPs.
      </p>

      <p className="mb-4">
        However, timing risk exists. To balance risk and reward, many investors choose to 
        invest lump sum amounts into safer funds or use step-based deployment.
      </p>

      <p>
        Lump sum investing is best suited for medium to long-term goals, where the impact 
        of short-term volatility becomes minimal.
      </p>
    </div>

    {/* FAQ Section */}
    <h3
      className="
        text-2xl font-bold mt-10 mb-4
        text-gray-900
        dark:text-slate-100
      "
    >
      Frequently Asked Questions
    </h3>

    <div className="space-y-3">
      {oneTimeFaqs.map((f, i) => {
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
              <div
                className="
                  px-4 pb-4 text-sm leading-relaxed
                  text-gray-600
                  dark:text-slate-400
                "
              >
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
