import React, { useState } from "react";

export default function SIPWealthLearning() {
  const [open, setOpen] = useState(null);

  const faqs = [
    { q: "What is SIP?", a: "SIP (Systematic Investment Plan) is a way to invest a fixed amount at regular intervals into mutual funds. It encourages discipline and uses rupee-cost averaging." },
    { q: "How much should I start with?", a: "You can start with as little as ₹100–₹500 per month. The key is consistency and increasing the SIP amount over time." },
    { q: "Can SIPs be paused?", a: "Yes — most platforms let you pause, stop, or modify SIPs without penalties." },
    { q: "SIP vs Lump Sum — which is better?", a: "SIP reduces timing risk and is ideal in volatile markets; lump sum can outperform if markets rise consistently after deployment." },
    { q: "How long should I continue SIP?", a: "For equity SIPs, a horizon of 5–10+ years is generally recommended to smooth out volatility and compound returns." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBFDFF] via-white to-[#F3FAFF] py-12">
      <div className="max-w-6xl mx-auto px-6">

        {/* HERO */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl p-10 shadow-lg border border-blue-100 mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">SIP & Wealth Creation</h1>
            <p className="text-blue-800 text-lg mb-6 leading-relaxed">
              Build long-term wealth using SIPs — a disciplined, low-friction approach. Learn strategies, examples, and how to optimise SIPs for your goals.
            </p>

            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl bg-white border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50">Explore SIP Strategies</button>
              <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Start SIP</button>
            </div>
          </div>

          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/wealth-growth-illustration-download-in-svg-png-gif-file-formats--investment-money-finance-pack-business-illustrations-4600428.png"
            alt="SIP Illustration"
            className="w-80"
          />
        </div>

        {/* WHY SIP */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Why SIP works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Rupee-Cost Averaging</h3>
              <p className="text-gray-700 text-sm">SIPs buy more units when price is low and fewer when price is high — lowering average cost over time.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Discipline & Automation</h3>
              <p className="text-gray-700 text-sm">Automatic monthly investments remove emotional decisions and market timing mistakes.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Compounding</h3>
              <p className="text-gray-700 text-sm">Returns earned start generating returns of their own — over years this effect becomes powerful.</p>
            </div>
          </div>
        </section>

        {/* SIP CALCULATOR EXAMPLE (placeholder) */}
        <section className="mb-12 bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">SIP Example & Calculator (Estimates)</h3>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-gray-700 mb-4">
                Example: Investing ₹5,000 per month for 10 years with an assumed annual return of 12% could grow substantially because of compounding.
              </p>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li><strong>Monthly SIP:</strong> ₹5,000</li>
                <li><strong>Duration:</strong> 10 years</li>
                <li><strong>Assumed annual return:</strong> 12%</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-gray-700">This section can be wired to a calculator component — show invested amount, estimated corpus and CAGR.</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-semibold text-blue-800">₹600k</div>
                  <div className="text-xs text-gray-600">Invested</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-800">₹1.9M</div>
                  <div className="text-xs text-gray-600">Estimated Corpus</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-800">12%</div>
                  <div className="text-xs text-gray-600">Assumed Return</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIP STRATEGIES */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Popular SIP Strategies</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Start Small & Increase</h4>
              <p className="text-gray-700 text-sm">Begin with a manageable amount and increase each year or on salary hikes.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Goal-based SIP</h4>
              <p className="text-gray-700 text-sm">Create SIPs for specific goals (house, child education, retirement) with appropriate horizons.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Flex SIP / Step-up SIP</h4>
              <p className="text-gray-700 text-sm">Use flexible SIPs that automatically increase amount at fixed intervals.</p>
            </div>
          </div>
        </section>

        {/* PORTFOLIO & ALLOCATION */}
        <section className="mb-12 bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border border-blue-100">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">How to Allocate SIPs</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <h4 className="text-lg font-semibold text-blue-800">Aggressive (high risk)</h4>
              <p className="text-gray-700 text-sm">80–100% equity, suitable for +10 years horizon.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <h4 className="text-lg font-semibold text-blue-800">Balanced</h4>
              <p className="text-gray-700 text-sm">50–70% equity, rest in debt — for 5–10 years horizon.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <h4 className="text-lg font-semibold text-blue-800">Conservative</h4>
              <p className="text-gray-700 text-sm">20–40% equity, rest in debt — for short to medium term.</p>
            </div>
          </div>
        </section>

        {/* PROS & CONS */}
        <section className="mb-12 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-xl font-bold text-blue-900 mb-3">Pros of SIP</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Disciplined investing</li>
              <li>Rupee-cost averaging</li>
              <li>Low initial amounts</li>
              <li>Compounding benefits</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-red-100 shadow-sm">
            <h3 className="text-xl font-bold text-red-700 mb-3">Cons of SIP</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>May underperform lump sum in strong bull runs</li>
              <li>Requires long-term patience</li>
              <li>Discipline required for consistent contributions</li>
            </ul>
          </div>
        </section>

        {/* ACTIONABLE TIPS */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-blue-900 mb-3">Actionable Tips</h3>
          <ol className="list-decimal pl-6 text-gray-700 space-y-3">
            <li>Start early — time in market beats timing the market.</li>
            <li>Automate SIPs via your bank or platform.</li>
            <li>Review portfolio annually and rebalance if required.</li>
            <li>Increase SIP amount with income growth.</li>
          </ol>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full text-left px-4 py-4 flex justify-between items-center font-medium text-gray-800"
                >
                  {f.q}
                  <span className="text-xl">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && (
                  <div className="px-4 pb-4 text-gray-700 text-sm">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
