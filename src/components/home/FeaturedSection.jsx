import React from "react";
import {
  FaChartLine,
  FaShieldAlt,
  FaPiggyBank,
  FaClock,
  FaUserTie,
  FaGlobeAsia,
} from "react-icons/fa";
import { motion } from "framer-motion";

const features = [
  {
    icon: <FaChartLine className="text-3xl text-red-600" />,
    title: "Smart Fund Insights",
    text: "Access AI-driven analysis for better investment decisions.",
  },
  {
    icon: <FaShieldAlt className="text-3xl text-blue-950" />,
    title: "Secure & Trusted",
    text: "Bank-grade security and transparent operations.",
  },
  {
    icon: <FaPiggyBank className="text-3xl text-red-600" />,
    title: "Goal-based Investing",
    text: "Plan your future with personalized investment strategies.",
  },
  {
    icon: <FaClock className="text-3xl text-blue-950" />,
    title: "Real-time Performance",
    text: "Track your investments live with instant market updates.",
  },
  {
    icon: <FaUserTie className="text-3xl text-red-600" />,
    title: "Expert Advisory",
    text: "Get insights from certified financial experts whenever you need them.",
  },
  {
    icon: <FaGlobeAsia className="text-3xl text-blue-950" />,
    title: "Global Access",
    text: "Invest across top-performing global mutual funds and ETFs with ease.",
  },
];

const FeaturedSection = () => {
  return (
    <section
  className="
    py-20 px-6
    bg-linear-to-r from-blue-50 via-white to-sky-50
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  {/* --- Section Heading --- */}
  <motion.h2
    initial={{ opacity: 0, y: -40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false, amount: 0.3 }}
    className="text-4xl font-bold text-center text-blue-950 dark:text-gray-100 mb-12"
  >
    Why Choose <span className="text-red-600 dark:text-red-500">Wealthcrop?</span>
  </motion.h2>

  {/* --- Feature Cards --- */}
  <div className="flex flex-wrap justify-center gap-10">
    {features.map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.2, duration: 0.6 }}
        viewport={{ once: false, amount: 0.2 }}
        whileHover={{ scale: 1.05 }}
        className="
          w-72 p-8 text-center rounded-2xl
          bg-white dark:bg-[#020617]
          shadow-lg dark:shadow-white/5
          hover:shadow-2xl transition-all duration-300
          border-t-4 border-blue-950
          border border-transparent dark:border-white/10
        "
      >
        <div className="flex justify-center mb-4">
          {item.icon}
        </div>

        <h3 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
          {item.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {item.text}
        </p>
      </motion.div>
    ))}
  </div>
</section>

  );
};

export default FeaturedSection;
