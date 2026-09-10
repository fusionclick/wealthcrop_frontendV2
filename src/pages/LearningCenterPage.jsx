import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Pehle har illustration ek bahar wale stock-illustration CDN se hotlink hoti thi, aur wo saare URL ab 404
// dete hain — is liye page par tooti hui image ke placeholder nazar aate the. Ab repo ke
// apne SVG bundle hote hain: dobara kabhi na tootein, aur kisi bahar wali service par
// bharosa na karna pare.
import learnHero from "../assets/invest.svg";
import fundImg from "../assets/menu/fundMenu.svg";
import stockImg from "../assets/menu/stockMenu.svg";
import sipImg from "../assets/top investment/topinvest.svg";
import taxImg from "../assets/track/insights.svg";

const TOPICS = [
  { title: "Mutual Funds", route: "/learning-centre/mutual_fund", img: fundImg },
  { title: "Stock Market", route: "/learning-centre/stock_market", img: stockImg },
  { title: "SIP & Wealth Building", route: "/learning-centre/sip_investment", img: sipImg },
  { title: "Tax Planning", route: "/learning-centre/tax_planning", img: taxImg },
];

// Teeno "Explore →" button bina onClick ke thay. Har path ko us topic par bhej rahe hain
// jo uski apni description bayan karti hai.
const PATHS = [
  { title: "Beginner Path", desc: "Learn basics of investing, SIP, compounding & more.", route: "/learning-centre/sip_investment" },
  { title: "Intermediate Path", desc: "Understand funds, risk, market behavior & diversification.", route: "/learning-centre/mutual_fund" },
  { title: "Advanced Path", desc: "Valuations, stock analysis, strategies, portfolio design.", route: "/learning-centre/stock_market" },
];

export default function LearningCenterPage() {
  const [open, setOpen] = useState(null);

  const navigate = useNavigate()

  const faqs = [
    { q: "Is this free?", a: "Yes, all Wealthcrop learning content is 100% free." },
    { q: "Do I need an account?", a: "No, you can access basic content without login." },
    // Pehla jawab "haan, videos mojood hain" tha — magar video section sirf do khali
    // grey box thay jin par "Watch Now" ka koi onClick nahi tha. Section hata diya, is
    // liye jawab bhi sach kar diya.
    { q: "Are video lessons available?", a: "Not yet — the guides below are written lessons. Video courses are on the way." },
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
          onClick={() => navigate(TOPICS[0].route)}
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
        src={learnHero}
        alt="Wealthcrop Learning Centre"
        className="w-80 drop-shadow-xl"
      />
    </div>

    {/* TOPIC SECTION */}
    <h2 className="text-3xl font-bold text-gray-800 mb-8 dark:text-white">
      Explore Topics
    </h2>

    {/* Card poora `cursor-pointer` tha magar onClick sirf <h3> par — yaani card ya
        illustration par click karne se kuch nahi hota tha, sirf theek text par hota tha.
        Handler card par utha diya. */}
    <div className="grid md:grid-cols-4 gap-6 mb-14">
      {TOPICS.map((item) => (
        <div
          key={item.route}
          onClick={() => navigate(item.route)}
          className="
            bg-white rounded-2xl cursor-pointer shadow-md border p-5 transition hover:shadow-xl
            border-blue-100
            dark:bg-[#020617] dark:border-white/10
          "
        >
          <img src={item.img} alt="" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 text-center hover:underline dark:text-gray-200">
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
      {PATHS.map((p) => (
        <div
          key={p.route}
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
            onClick={() => navigate(p.route)}
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

    {/* "Featured Video Lessons" aur "Popular Guides & Articles" yahan se hata diye gaye.
        Videos do khali grey box thay jin ka "Watch Now" kahin nahi jata tha, aur paanch
        article ki sirf sarkhiyan thin — na koi article page, na koi click. Jab asli
        content aa jaye tab wapas aa sakte hain; tab tak jo dikh raha hai wo chalta bhi hai. */}

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
