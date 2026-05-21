import React from "react";

export default function StockMarketLearning() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12">

      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-indigo-200 flex flex-col md:flex-row items-center gap-10">
          
          <div className="flex-1">
            <h1 className="text-5xl font-extrabold text-indigo-900 mb-4">
              Stock Market – Complete Guide
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              Learn how the stock market works, how companies get valued, how prices move, and 
              the strategies used by successful long-term investors.
            </p>
          </div>

          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/share-market-investment-illustration-download-in-svg-png-gif-file-formats--stock-trading-finance-pack-business-illustrations-7985477.png"
            className="w-80"
          />
        </div>
      </div>

      {/* SECTION 1 – What is Stock Market */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold text-indigo-900 mb-4">What is the Stock Market?</h2>

        <p className="text-gray-700 leading-relaxed mb-6">
          A marketplace where shares of publicly listed companies are bought and sold.  
          It represents ownership in companies and gives investors a chance to grow their wealth 
          as businesses grow.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-white shadow border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Why do stock prices move?</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Company performance</li>
              <li>Demand & supply</li>
              <li>Global events</li>
              <li>Investor sentiment</li>
              <li>Economic indicators</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Why should you invest?</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Beats inflation long-term</li>
              <li>High wealth creation potential</li>
              <li>Ownership in businesses</li>
              <li>Dividend income opportunities</li>
              <li>Better returns vs bank FDs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 2 – Market Components */}
      <div className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-indigo-900 mb-10">Key Components of the Stock Market</h2>

        <div className="grid md:grid-cols-3 gap-10">

          {[
            {
              title: "Stock Exchanges",
              desc: "NSE, BSE — platforms where buying and selling happen.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/stock-exchange-illustration-download-in-svg-png-gif-file-formats--market-finance-pack-business-illustrations-6630402.png"
            },
            {
              title: "Investors",
              desc: "Retail, institutional, FIIs — all participate in markets.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/user-insight-illustration-download-in-svg-png-gif-file-formats--profile-information-management-pack-communication-illustrations-4978043.png"
            },
            {
              title: "Companies",
              desc: "Businesses raise capital by issuing shares.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/company-growth-illustration-download-in-svg-png-gif-file-formats--chart-analytics-graph-pack-business-illustrations-7275157.png"
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl shadow-md border border-indigo-100 hover:shadow-xl transition"
            >
              <img src={item.img} className="w-32 mx-auto mb-4"/>
              <h3 className="text-xl font-bold text-indigo-800 text-center mb-2">{item.title}</h3>
              <p className="text-gray-700 text-center">{item.desc}</p>
            </div>
          ))}

        </div>
      </div>

      {/* SECTION 3 – How to Analyse Stocks */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">How to Analyse a Stock?</h2>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p><b>1. Fundamental Analysis:</b> Study revenue, profits, debt, business model, management quality.</p>
          <p><b>2. Technical Analysis:</b> Study charts, patterns, support & resistance, indicators.</p>
          <p><b>3. Compare with competitors:</b> Benchmark against industry peers.</p>
          <p><b>4. Understand valuation:</b> P/E ratio, P/B ratio, PEG ratio, cash flows.</p>
          <p><b>5. Risk evaluation:</b> Market risk, industry risk, financial risk.</p>
        </div>
      </div>

      {/* SECTION 4 – Beginner Tips */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Beginner Tips</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-semibold text-indigo-800 mb-3">Do’s</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Start early & stay consistent</li>
              <li>Invest for long term</li>
              <li>Diversify your portfolio</li>
              <li>Study companies before investing</li>
              <li>Have clear financial goals</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-semibold text-indigo-800 mb-3">Don’ts</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Don't follow random tips</li>
              <li>Don't panic during market dips</li>
              <li>Don't invest money needed urgently</li>
              <li>Avoid over-trading</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
