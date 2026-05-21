import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TaxPlanningLearning() {
  const [open, setOpen] = useState(null);

  const faqs = [
    { q: "What is ELSS?", a: "ELSS (Equity Linked Savings Scheme) is a mutual fund category that offers tax deductions under Section 80C with a 3-year lock-in." },
    { q: "What can I claim under 80C?", a: "Section 80C allows deductions up to ₹1.5 lakh for selected investments like PPF, ELSS, EPF, life insurance premiums, etc." },
    { q: "Are capital gains taxable?", a: "Yes — taxation depends on asset type and holding period. For equity mutual funds, LTCG above ₹1 lakh is taxed at 10% without indexation." },
    { q: "How to plan taxes on investments?", a: "Use a mix of tax-saving instruments, utilize exemptions, and choose tax-efficient funds. Plan across years to maximize deductions." },
  ];

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-white to-[#E8F2FF] py-12">
      <div className="max-w-6xl mx-auto px-6">

        {/* HERO */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl p-10 shadow-lg border border-blue-200 mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">
              Tax Planning & Smart Investing
            </h1>
            <p className="text-blue-800 text-lg mb-6">
              Reduce your tax liability legally while building wealth. Learn about ELSS, 80C, capital gains tax, and tax-efficient investment strategies.
            </p>

            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl bg-white border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition">
                Explore Tax Saving
              </button>
              <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                Start Saving
              </button>
            </div>
          </div>

          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/tax-saving-illustration-download-in-svg-png-gif-file-formats--money-finance-tax-pack-business-illustrations-3020811.png"
            alt="Tax Illustration"
            className="w-72"
          />
        </div>

        {/* SECTION – Basics */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Tax Basics for Investors</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Understand what portions of your investments are taxable and how holding periods impact tax rates.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Equity Funds</h4>
              <p className="text-gray-700 text-sm">
                Short term (&lt;=12 months): taxed as per slab rates.<br />
                Long term (&gt;12 months): LTCG above ₹1 lakh taxed at 10%.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Debt Funds</h4>
              <p className="text-gray-700 text-sm">
                Short term: taxed as per slab rates.<br />
                Long term (&gt;36 months): taxed at 20% with indexation.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-blue-100 shadow-sm">
              <h4 className="font-semibold text-blue-800 mb-2">ELSS</h4>
              <p className="text-gray-700 text-sm">
                Eligible under 80C, 3-year lock-in, treated as equity for taxation.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION – Strategies */}
        <section className="mb-12 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Tax Efficient Investing Strategies
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Use ELSS for 80C</h4>
              <p className="text-gray-700 text-sm mb-4">
                ELSS provides market-linked growth + tax saving. Best for long-term wealth creation.
              </p>

              <h4 className="font-semibold text-gray-800 mb-2">Stagger Capital Gains</h4>
              <p className="text-gray-700 text-sm">
                Spread gains across financial years to reduce overall taxable amount.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Tax Harvesting</h4>
              <p className="text-gray-700 text-sm mb-4">
                Offset taxable gains by booking losses strategically.
              </p>

              <h4 className="font-semibold text-gray-800 mb-2">Choose Tax-efficient Funds</h4>
              <p className="text-gray-700 text-sm">
                Index funds & ETFs often have lower turnover → lower tax burden.
              </p>
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Tools & Calculators</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm text-center cursor-pointer">
              <div className="text-lg font-semibold text-blue-800 mb-2"
              onClick={()=>(navigate("/calculator/elss-calculator"))}
              >ELSS Planner</div>
              <div className="text-sm text-gray-700">Calculate tax savings & returns from ELSS investments.</div>
            </div>

            <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm text-center cursor-pointer">
              <div className="text-lg font-semibold text-blue-800 mb-2"
              onClick={()=>(navigate("/calculator/ltcg-calculator"))}
              >LTCG Calculator</div>
              <div className="text-sm text-gray-700">Estimate capital gains tax on equity & debt funds.</div>
            </div>

            <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm text-center cursor-pointer">
              <div className="text-lg font-semibold text-blue-800 mb-2"
              onClick={()=>(navigate("/calculator/eightyC-calculator"))}
              >80C Tracker</div>
              <div className="text-sm text-gray-700">Track your 80C investments and remaining limit.</div>
            </div>
          </div>
        </section>

        {/* PROS / CAUTIONS */}
        <section className="mb-12 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <h4 className="font-semibold text-blue-800 mb-2">Benefits</h4>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Reduce taxable income legally</li>
              <li>Earn market-linked returns</li>
              <li>Diversified investment options</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-red-100 shadow-sm">
            <h4 className="font-semibold text-red-700 mb-2">Cautions</h4>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>ELSS has a 3-year lock-in period</li>
              <li>Don't invest only to save tax</li>
              <li>Plan liquidity before investing</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Frequently Asked Questions</h3>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full text-left px-4 py-4 flex justify-between items-center font-medium"
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
