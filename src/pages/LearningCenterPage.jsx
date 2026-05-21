import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LearningCenterPage() {
  const [open, setOpen] = useState(null);

  const navigate = useNavigate()

  const faqs = [
    { q: "Is this free?", a: "Yes, all Wealthcrop learning content is 100% free." },
    { q: "Do I need an account?", a: "No, you can access basic content without login." },
    { q: "Are video lessons available?", a: "Yes, we provide beginner to advanced investing videos." },
  ];

  return (
    <div
  className="
    min-h-screen py-12
    bg-linear-to-br from-[#EAF3FF] via-white to-[#F0F7FF]
    dark:bg-linear-to-br dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  <div className="max-w-7xl mx-auto px-6">

    {/* HERO SECTION */}
    <div
      className="
        rounded-3xl p-12 shadow-lg border mb-16
        bg-linear-to-r from-blue-100 via-indigo-100 to-blue-50 border-blue-200
        flex flex-col md:flex-row items-center gap-10
        dark:bg-linear-to-r dark:from-[#020617] dark:via-slate-900 dark:to-[#020617]
        dark:border-white/10
      "
    >
      {/* Hero Text */}
      <div className="flex-1">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 leading-tight dark:text-white">
          Wealthcrop Learning Centre
        </h1>

        <p className="text-blue-800 text-lg mb-6 leading-relaxed dark:text-gray-400">
          Master investing with easy courses, illustrations, guides, videos and tools.
          Learn at your own pace — beginner to expert.
        </p>

        <button
          className="
            px-7 py-3 rounded-xl font-semibold shadow transition
            bg-white border border-blue-400 text-blue-700 hover:bg-blue-50
            dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20
          "
        >
          Start Your Learning Journey →
        </button>
      </div>

      {/* Illustration */}
      <img
        src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-illustration-download-in-svg-png-gif-file-formats--knowledge-study-college-pack-education-illustrations-3215404.png"
        className="w-80 drop-shadow-xl"
      />
    </div>

    {/* TOPIC SECTION */}
    <h2 className="text-3xl font-bold text-gray-800 mb-8 dark:text-white">
      Explore Topics
    </h2>

    <div className="grid md:grid-cols-4 gap-6 mb-14">
      {[
        { title: "Mutual Funds", route:"/learning-centre/mutual_fund", img: "https://cdni.iconscout.com/illustration/premium/thumb/business-investment-illustration-download-in-svg-png-gif-file-formats--growth-share-profit-pack-money-finance-illustrations-3615378.png" },
        { title: "Stock Market", route:"/learning-centre/stock_market", img: "https://cdni.iconscout.com/illustration/premium/thumb/stock-market-analysis-illustration-download-in-svg-png-gif-file-formats--graph-chart-growth-pack-business-illustrations-6241023.png" },
        { title: "SIP & Wealth Building", route:"/learning-centre/sip_investment", img: "https://cdni.iconscout.com/illustration/premium/thumb/wealth-management-illustration-download-in-svg-png-gif-file-formats--invest-money-financial-adviser-pack-finance-illustrations-2602428.png" },
        { title: "Tax Planning", route:"/learning-centre/tax_planning", img: "https://cdni.iconscout.com/illustration/premium/thumb/tax-calculation-illustration-download-in-svg-png-gif-file-formats--payment-money-finance-pack-business-illustrations-3020813.png" }
      ].map((item, i) => (
        <div
          key={i}
          className="
            bg-white rounded-2xl cursor-pointer shadow-md border p-5 transition hover:shadow-xl
            border-blue-100
            dark:bg-[#020617] dark:border-white/10
          "
        >
          <img src={item.img} className="w-24 mx-auto mb-4" />
          <h3
            onClick={() => navigate(item.route)}
            className="text-lg font-semibold text-blue-800 text-center hover:underline dark:text-gray-200"
          >
            {item.title}
          </h3>
        </div>
      ))}
    </div>

    {/* LEARNING PATHS */}
    <h2 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
      Learning Paths
    </h2>

    <div className="grid md:grid-cols-3 gap-8 mb-16">
      {[
        { title: "Beginner Path", desc: "Learn basics of investing, SIP, compounding & more.", color: "blue" },
        { title: "Intermediate Path", desc: "Understand funds, risk, market behavior & diversification.", color: "purple" },
        { title: "Advanced Path", desc: "Valuations, stock analysis, strategies, portfolio design.", color: "red" }
      ].map((p, i) => (
        <div
          key={i}
          className="
            rounded-2xl p-6 shadow border
            bg-linear-to-br from-white/80 to-white
            dark:bg-linear-to-br dark:from-[#020617] dark:to-slate-900
            dark:border-white/10
          "
        >
          <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
            {p.title}
          </h3>
          <p className="text-gray-700 text-sm dark:text-gray-400">
            {p.desc}
          </p>
          <button
            className="
              mt-4 px-5 py-2 rounded-xl font-semibold transition
              bg-white border border-gray-300 hover:bg-gray-50
              dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20
            "
          >
            Explore →
          </button>
        </div>
      ))}
    </div>

    {/* FEATURED VIDEOS */}
    <h2 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
      Featured Video Lessons
    </h2>

    <div className="grid md:grid-cols-2 gap-10 mb-16">
      {[1, 2].map((v) => (
        <div
          key={v}
          className="
            rounded-2xl overflow-hidden shadow-md border
            bg-blue-50 border-blue-200
            dark:bg-[#020617] dark:border-white/10
          "
        >
          <div className="aspect-video bg-blue-200 flex items-center justify-center text-blue-800 text-xl dark:bg-slate-800 dark:text-gray-300">
            🎥 Video Lesson {v}
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold mb-2 text-blue-900 dark:text-white">
              Understanding Market Trends
            </h3>
            <p className="text-gray-600 text-sm mb-3 dark:text-gray-400">
              Learn how markets move, what affects stock prices and how to read charts.
            </p>
            <button
              className="
                px-5 py-2 rounded-xl transition
                bg-white border border-blue-300 hover:bg-blue-50
                dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20
              "
            >
              Watch Now
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* FEATURED ARTICLES */}
    <h2 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
      Popular Guides & Articles
    </h2>

    <div className="space-y-5 mb-16">
      {[
        "5 mistakes every beginner must avoid",
        "How to pick your first mutual fund",
        "How SIPs actually create long-term wealth",
        "Understanding market volatility",
        "Best ways to reduce investment risk"
      ].map((g, i) => (
        <div
          key={i}
          className="
            p-5 rounded-xl border shadow-sm transition hover:shadow-md
            bg-white border-blue-200
            dark:bg-[#020617] dark:border-white/10
          "
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-gray-200">
            {g}
          </h3>
        </div>
      ))}
    </div>

    {/* FAQ SECTION */}
    <div
      className="
        rounded-2xl p-6 shadow-md border
        bg-white border-blue-100
        dark:bg-[#020617] dark:border-white/10
      "
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-white">
        FAQs
      </h2>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="border rounded-xl dark:border-white/10"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left p-4 flex justify-between items-center font-medium dark:text-gray-200"
            >
              {f.q}
              <span>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <p className="px-4 pb-4 text-gray-600 text-sm dark:text-gray-400">
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>

  </div>
</div>

  );
}
