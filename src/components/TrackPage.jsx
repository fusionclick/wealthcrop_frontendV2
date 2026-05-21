import React, { useState } from "react";
import track from "../assets/track/track.png";
import insights from "../assets/track/insights.svg";
import switchh from "../assets/track/switch.svg";
import trading from "../assets/track/trading.svg";
import Register from "../auth/Register";

export default function TrackPage() {
  const [showLogin, setShowLogin] = useState(true);

  const faqs = [
    { q: "What is Wealthcrop Track?", a: "Wealthcrop Track allows you to import and monitor all your mutual fund investments in one place with real-time insights." },
    { q: "Is tracking free?", a: "Yes. Tracking your investments on Wealthcrop is completely free and unlimited." },
    { q: "How does Wealthcrop fetch my portfolio?", a: "You can upload CAS statements or import automatically from supported platforms for secure portfolio syncing." },
    { q: "Is it safe to upload my CAS?", a: "Wealthcrop uses encrypted processing and does not store your password. All data remains private and secure." },
    { q: "Can I switch funds from the Track page?", a: "Yes. Once your portfolio is tracked, you can execute buy, sell, and switch actions easily." },
    { q: "Will I get insights on my investments?", a: "Yes. Wealthcrop provides performance analytics, risk insights, category comparison, and more." },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div
  className="
    min-h-screen
    bg-gradient-to-b from-[#E4F4FF] via-[#F7FCFF] to-[#DDF1FF]
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>

  {/* Login Popup */}
  {showLogin && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="
          bg-white dark:bg-[#020617]
          rounded-2xl shadow-xl dark:shadow-none
          w-[90%] max-w-xl p-6 relative max-h-[90vh] overflow-auto
          border dark:border-white/10
        "
      >
        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-3 right-3 text-xl font-bold text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          ✕
        </button>

        <Register />
      </div>
    </div>
  )}

  {/* Hero Section */}
  <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <h1 className="text-5xl font-extrabold text-[#0A3A60] dark:text-gray-100 leading-snug mb-4">
        Track Your Investments
      </h1>
      <p className="text-gray-700 dark:text-gray-400 text-lg mb-6">
        Import and manage all your mutual fund investments easily on Wealthcrop.
      </p>
      <button className="px-6 py-3 bg-sky-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-sky-700 dark:hover:bg-blue-400 shadow-md">
        Track Now
      </button>
    </div>

    <div className="flex justify-center">
      <img
        src={track}
        alt="Track Illustration"
        className="w-full max-w-md drop-shadow-xl dark:drop-shadow-none"
      />
    </div>
  </div>

  {/* Why Track Section */}
  <div className="bg-[#F2F9FF] dark:bg-[#020617] py-20">
    <h2 className="text-center text-3xl font-bold text-[#0A3A60] dark:text-gray-100 mb-12">
      Why track on Wealthcrop?
    </h2>

    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 px-6 text-center">
      {[
        ["Simple", "Manage all your mutual fund investments in one place.", trading],
        ["Insights", "Analyse your investments and stay up-to-date.", insights],
        ["Switch", "Easily switch funds based on performance and goals.", switchh],
      ].map(([title, desc, img], i) => (
        <div
          key={i}
          className="
            p-6 rounded-xl
            bg-white dark:bg-white/5
            shadow hover:shadow-lg dark:shadow-none
            transition border dark:border-white/10
          "
        >
          <img src={img} alt={title} className="w-32 h-32 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#0A3A60] dark:text-gray-100 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{desc}</p>
        </div>
      ))}
    </div>
  </div>

  {/* More Features Section */}
  <div className="py-20 bg-gradient-to-b from-white to-[#E6F5FF] dark:from-[#020617] dark:to-[#020617]">
    <h2 className="text-center text-3xl font-bold text-[#0A3A60] dark:text-gray-100 mb-8">
      More Features You’ll Love
    </h2>

    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-6">
      {[
        ["Realtime Updates", "Stay updated with NAV changes and market moves."],
        ["Smart Analytics", "Understand risk, returns, sectors and diversification."],
        ["100% Secure", "Your data stays encrypted and fully private."],
      ].map(([title, desc], i) => (
        <div
          key={i}
          className="
            p-6 bg-white dark:bg-white/5
            shadow rounded-xl hover:shadow-lg dark:shadow-none
            transition border dark:border-white/10
          "
        >
          <h3 className="text-xl font-semibold text-[#0A567F] dark:text-blue-400 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
        </div>
      ))}
    </div>
  </div>

  {/* FAQ Section */}
  <div className="max-w-4xl mx-auto px-6 py-20">
    <h2 className="text-3xl font-bold text-[#0A3A60] dark:text-gray-100 mb-8 text-center">
      Frequently Asked Questions
    </h2>

    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div
          key={i}
          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full text-left px-4 py-4 flex justify-between items-center font-medium text-[#0A3A60] dark:text-gray-200"
          >
            {f.q}
            <span className="text-xl">{openIndex === i ? "−" : "+"}</span>
          </button>

          {openIndex === i && (
            <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {f.a}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

  );
}
