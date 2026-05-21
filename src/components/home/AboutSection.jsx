import React from "react";
import { motion } from "framer-motion";

const AboutSection = () => {
  const stats = [
    { label: "5000+", text: "Happy Investors" },
    { label: "₹200 Cr+", text: "Assets Managed" },
    { label: "24/7", text: "Portfolio Tracking" },
    { label: "99.9%", text: "Secure Transactions" },
  ];

  return (
    <section
  className="
    py-20 px-6 text-center overflow-hidden
    bg-linear-to-b from-gray-50 to-sky-50
    dark:from-[#020617] dark:to-[#020617]
  "
>
  {/* Heading */}
  <motion.h2
    initial={{ opacity: 0, y: -40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: false }}
    className="text-4xl font-bold text-blue-950 dark:text-gray-100 mb-4"
  >
    About <span className="text-red-600 dark:text-red-500">Wealthcrop</span>
  </motion.h2>

  <motion.p
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false }}
    className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12"
  >
    At Wealthcrop, we aim to revolutionize how people invest.
    From beginners to experienced investors, our platform empowers you with
    tools, analytics, and expert insights to grow your wealth confidently.
  </motion.p>

  {/* Stats Section */}
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false }}
    className="mt-8 flex flex-wrap justify-center gap-8"
  >
    {stats.map((item, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.05 }}
        className="
          w-64 p-6 rounded-xl
          bg-white dark:bg-[#020617]
          shadow-md dark:shadow-white/5
          border-t-4 border-red-600
          border border-transparent dark:border-white/10
        "
      >
        <h3 className="text-3xl font-bold text-blue-950 dark:text-gray-100">
          {item.label}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {item.text}
        </p>
      </motion.div>
    ))}
  </motion.div>

  {/* Extra Info Section */}
  <div className="mt-20 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto text-left">
    {/* Mission */}
    <motion.div
      initial={{ opacity: 0, x: -80 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false }}
      className="
        p-6 rounded-xl
        bg-white dark:bg-[#020617]
        shadow-md dark:shadow-white/5
        border-l-4 border-sky-600
        border border-transparent dark:border-white/10
        hover:scale-105 hover:shadow-2xl transition
      "
    >
      <h4 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
        Our Mission
      </h4>
      <p className="text-gray-600 dark:text-gray-400">
        To simplify wealth creation by making investment opportunities
        accessible, transparent, and easy to understand for every individual.
      </p>
    </motion.div>

    {/* Vision */}
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false }}
      className="
        p-6 rounded-xl
        bg-white dark:bg-[#020617]
        shadow-md dark:shadow-white/5
        border-l-4 border-red-600
        border border-transparent dark:border-white/10
        hover:scale-105 hover:shadow-2xl transition
      "
    >
      <h4 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
        Our Vision
      </h4>
      <p className="text-gray-600 dark:text-gray-400">
        To become India’s most trusted investment companion, helping people
        achieve financial freedom through smarter and safer investing.
      </p>
    </motion.div>

    {/* Differentiator */}
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false }}
      className="
        p-6 rounded-xl
        bg-white dark:bg-[#020617]
        shadow-md dark:shadow-white/5
        border-l-4 border-yellow-400
        border border-transparent dark:border-white/10
        hover:scale-105 hover:shadow-2xl transition
      "
    >
      <h4 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
        What Makes Us Different
      </h4>
      <p className="text-gray-600 dark:text-gray-400">
        Wealthcrop blends technology with financial expertise to provide
        real-time insights, minimal fees, and seamless user experience.
      </p>
    </motion.div>
  </div>
</section>

  );
};

export default AboutSection;
