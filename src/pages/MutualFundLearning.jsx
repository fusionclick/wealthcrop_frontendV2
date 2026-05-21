import React from "react";

export default function MutualFundLearning() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 py-12">

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 mb-14">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-blue-200 flex flex-col md:flex-row items-center gap-10">
          
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-blue-900 mb-3">
              Mutual Funds – Complete Learning
            </h1>
            <p className="text-gray-700 text-lg mb-5">
              Understand fund categories, NAV, returns, risk, diversification, and how mutual funds 
              build long-term wealth. A complete beginner–to–expert guide.
            </p>
          </div>

          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/investment-plan-illustration-download-in-svg-png-gif-file-formats--growth-money-profit-pack-business-illustrations-3153131.png"
            className="w-72"
          />
        </div>
      </div>

      {/* Section 1 – What are Mutual Funds */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">What are Mutual Funds?</h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Mutual funds collect money from investors and invest in stocks, bonds, or other assets.  
          They are managed by experienced fund managers.  
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow-md border border-blue-100">
            <h3 className="text-xl font-bold text-blue-800 mb-2">Why are they popular?</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Low minimum investment</li>
              <li>Professional fund management</li>
              <li>Flexibility (SIP or lumpsum)</li>
              <li>Higher diversification</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-md border border-blue-100">
            <h3 className="text-xl font-bold text-blue-800 mb-2">Who should invest?</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>New investors</li>
              <li>Long-term wealth builders</li>
              <li>Goal-based savers</li>
              <li>Anyone wanting low effort investing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2 – Types */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold text-blue-900 mb-6">Types of Mutual Funds</h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Equity Funds",
              desc: "Invest in stocks; suitable for long-term growth.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/growth-investment-illustration-download-in-svg-png-gif-file-formats--chart-analytics-graph-pack-business-illustrations-3373028.png"
            },
            {
              title: "Debt Funds",
              desc: "Invest in bonds; suitable for stable returns.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/budget-planning-illustration-download-in-svg-png-gif-file-formats--money-finance-portfolio-pack-business-illustrations-8374518.png"
            },
            {
              title: "Hybrid Funds",
              desc: "Mix of equity & debt; balanced risk.",
              img: "https://cdni.iconscout.com/illustration/premium/thumb/financial-portfolio-illustration-download-in-svg-png-gif-file-formats--investment-money-finance-pack-business-illustrations-2948531.png"
            },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-md border border-blue-100 hover:shadow-xl transition">
              <img src={item.img} className="w-32 mx-auto mb-4"/>
              <h3 className="text-xl font-bold text-blue-800 text-center mb-2">{item.title}</h3>
              <p className="text-gray-700 text-center">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 – How to Select */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-blue-900 mb-6">How to Select the Right Mutual Fund?</h2>
        
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p><b>1. Define your goal:</b> Retirement, education, wealth building, etc.</p>
          <p><b>2. Decide investment horizon:</b> Short, medium, long-term.</p>
          <p><b>3. Understand risk category:</b> Low / moderate / high.</p>
          <p><b>4. Check fund ratings:</b> Past performance, benchmark comparison.</p>
          <p><b>5. Know the expense ratio:</b> Lower fees = better long-term returns.</p>
        </div>
      </div>

    </div>
  );
}
