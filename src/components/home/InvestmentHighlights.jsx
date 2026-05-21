import React from "react";
import { motion } from "framer-motion";

const InvestmentHighlights = () => {
  const investmentTerms = [
    "Mutual Funds",
    "SIP Plans",
    "Government Bonds",
    "Stock Market",
    "Fixed Deposits",
    "ETFs",
    "Retirement Plans",
    "Wealth Management",
    "Tax Saving Funds",
    "Commodities",
  ];

  return (
   <section
  className="
    bg-linear-to-r 
    from-sky-50 via-gray-50 to-sky-100
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
    py-16 px-6 text-center overflow-hidden
  "
>
  {/* Title */}
  <motion.h2
    initial={{ opacity: 0, y: -30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: false }}
    className="text-3xl font-bold text-blue-950 dark:text-gray-100 mb-8"
  >
    Explore Diverse Investment Options
  </motion.h2>

  {/* Marquee Row */}
  <div
    className="
      overflow-hidden w-full sm:w-[80vw] mx-auto mb-8
      bg-linear-to-r from-blue-50 to-blue-100
      dark:from-[#020617] dark:to-[#020617]
      py-4 px-6 rounded-xl
      shadow-inner dark:shadow-white/5
      border border-transparent dark:border-white/10
    "
  >
    <motion.div
      animate={{ x: "-100%" }}
      transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
      className="flex gap-10 whitespace-nowrap text-lg font-semibold"
    >
      {investmentTerms.map((term, i) => (
        <span
          key={i}
          className="
            px-6 py-3 rounded-full shadow
            bg-white dark:bg-[#020617]
            text-blue-700 dark:text-blue-400
            font-semibold
            hover:bg-blue-100 dark:hover:bg-white/5
            transition
          "
        >
          {term}
        </span>
      ))}
    </motion.div>
  </div>

  {/* Description */}
  <motion.p
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false }}
    className="mt-12 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
  >
    Stay informed and diversify your portfolio with India’s leading
    investment categories. Explore a range of products curated for your
    growth — from secure government bonds to high-return SIPs.
  </motion.p>
</section>

  );
};

export default InvestmentHighlights;
