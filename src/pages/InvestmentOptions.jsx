import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaCoins,
  FaExchangeAlt,
  FaCalculator,
  FaBookmark,
  FaLock,
  FaChartPie,
  FaChartBar,   // ✅ Replace invalid icon with this
} from "react-icons/fa";


const InvestmentOptions = () => {
  const navigate = useNavigate();

  const quickCalcs = [
    { name: "SIP", path: "/calculator/sip-calculator" },
    { name: "SWP", path: "/calculator/swp-calculator" },
    { name: "FD", path: "/calculator/fd-calculator" },
    { name: "Lumpsum", path: "/calculator/lumpsum-calculator" },
  ];

  const moreCalcs = [
    { name: "Retirement", path: "/calculator/retirement-calculator" },
    { name: "EMI", path: "/calculator/emi-calculator" },
    { name: "NPS", path: "/calculator/nps-calculator" },
    { name: "CAGR", path: "/calculator/cagr-calculator" },
  ];

  const faqs = [
    {
      q: "What is the safest way to start investing?",
      a: "Begin with diversified mutual funds or large cap stocks through SIPs.",
    },
    {
      q: "Can I start investing with small amounts?",
      a: "Yes, SIPs allow investing from as low as ₹100 per month.",
    },
    {
      q: "Are stocks risky?",
      a: "Short-term risk is high, but long-term disciplined investing reduces risk.",
    },
    {
      q: "Should beginners invest in F&O?",
      a: "No. F&O is highly leveraged and meant for advanced traders only.",
    },
    {
      q: "What is the best investment for long-term?",
      a: "Equity mutual funds or index funds for long-term wealth creation.",
    },
    {
      q: "Is mutual fund SIP safe?",
      a: "SIP reduces market volatility impact but still carries market risk.",
    },
    {
      q: "What is the difference between SIP and SWP?",
      a: "SIP invests regularly; SWP withdraws a fixed amount monthly.",
    },
    {
      q: "How to reduce tax using investments?",
      a: "Invest in ELSS funds, NPS, PPF, or tax-saving FDs under Section 80C.",
    },
    {
      q: "Can I invest in stocks without a Demat account?",
      a: "No, a Demat account is mandatory for buying stocks.",
    },
    {
      q: "Is F&O better than stock investing?",
      a: "No. F&O is for experienced traders; stocks/MF suit long-term investors.",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* HEADER SECTION */}
      <h1 className="text-3xl font-bold text-blue-950 mb-2">
        Start Your Investment Journey
      </h1>
      <p className="text-gray-600 mb-8">
        Explore various investment choices and use smart tools to plan your financial future.
      </p>

      {/* INVESTMENT CATEGORY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* STOCKS */}
        <div onClick={() => navigate("/user/stocks/explore")} className="p-6 bg-linear-to-br from-blue-100 to-blue-50 rounded-2xl shadow-md border border-white hover:shadow-lg transition cursor-pointer">
          <FaChartLine className="text-3xl text-blue-600 mb-3" />
          <h3 className="text-xl font-semibold text-slate-800">Stocks</h3>
          <p className="text-gray-600 mt-1 text-sm">
            Invest in market-leading companies and grow wealth.
          </p>
        </div>

        {/* MUTUAL FUNDS */}
        <div onClick={() => navigate("/user/mutual_fund/explore")} className="p-6 bg-linear-to-br from-green-100 to-green-50 rounded-2xl shadow-md border border-white hover:shadow-lg transition cursor-pointer">
          <FaCoins className="text-3xl text-green-600 mb-3" />
          <h3 className="text-xl font-semibold text-slate-800">Mutual Funds</h3>
          <p className="text-gray-600 mt-1 text-sm">
            Diversified growth for long-term financial goals.
          </p>
        </div>

        {/* F&O */}
        <div onClick={() => navigate("/user/f&o")} className="p-6 bg-linear-to-br from-orange-100 to-orange-50 rounded-2xl shadow-md border border-white hover:shadow-lg transition cursor-pointer">
          <FaExchangeAlt className="text-3xl text-orange-600 mb-3" />
          <h3 className="text-xl font-semibold text-slate-800">F&O</h3>
          <p className="text-gray-600 mt-1 text-sm">
            High-leverage trading for experienced investors.
          </p>
        </div>
      </div>

      {/* BENEFITS SECTION */}
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Why Invest With Us?</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <FaBookmark className="text-xl text-blue-600 mb-2" />
          <h4 className="font-semibold text-slate-700 mb-1">Handpicked Investment Ideas</h4>
          <p className="text-sm text-gray-500">Curated funds and stocks based on performance & reliability.</p>
        </div>

        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <FaLock className="text-xl text-green-600 mb-2" />
          <h4 className="font-semibold text-slate-700 mb-1">Secure & Trusted</h4>
          <p className="text-sm text-gray-500">Industry-leading security and data protection standards.</p>
        </div>

        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <FaChartBar className="text-xl text-orange-600 mb-2" />
          <h4 className="font-semibold text-slate-700 mb-1">Smart Growth Tools</h4>
          <p className="text-sm text-gray-500">Use calculators and insights to plan smarter.</p>
        </div>
      </div>

      {/* CALCULATOR SECTION */}
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Investment Calculators</h2>

      {/* QUICK calculators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {quickCalcs.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-200 shadow-sm p-3 rounded-xl text-sm hover:bg-gray-100 transition font-medium"
          >
            {item.name} Calculator
          </button>
        ))}
      </div>

      {/* MORE calculators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {moreCalcs.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-200 shadow-sm p-3 rounded-xl text-sm hover:bg-gray-100 transition font-medium"
          >
            {item.name} Calculator
          </button>
        ))}
      </div>

      {/* All Calculators Button */}
      <button
        onClick={() => navigate("/calculators")}
        className="mt-2 px-6 py-3 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 font-medium flex items-center gap-2"
      >
        <FaCalculator /> View All Calculators
      </button>

      {/* FAQ SECTION */}
      <h2 className="text-2xl font-bold text-slate-800 mt-14 mb-4">
        Frequently Asked Questions
      </h2>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="p-4 bg-white rounded-xl shadow border">
            <p className="font-semibold text-slate-800">{f.q}</p>
            <p className="text-gray-600 mt-1 text-sm">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentOptions;
