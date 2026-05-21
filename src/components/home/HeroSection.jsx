import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import invest from "../../assets/invest.svg";
import { MdOutlinePlayCircle } from "react-icons/md";

const HeroSection = () => {
  return (
   <section
  className="
    bg-linear-to-r 
    from-gray-50 via-sky-50 to-gray-100 
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
    text-blue-950 dark:text-gray-100
    py-20 px-6
  "
>
  {/* --- Top Hero Text --- */}
  <div className="text-center mb-16">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
      Grow Your Wealth with{" "}
      <span className="text-red-600 dark:text-red-500">
        Wealthcrop
      </span>
    </h1>

    <p className="text-lg text-blue-900 dark:text-gray-300 max-w-2xl mx-auto mb-8">
      Invest confidently with India’s most user-friendly mutual fund and
      wealth management platform.
    </p>

    <div className="flex justify-center gap-4">
      <Link
        to="/signup"
        className="
          bg-red-600 dark:bg-red-500 
          text-white font-semibold px-6 py-3 rounded-lg shadow
          hover:bg-red-700 dark:hover:bg-red-600 
          transition
        "
      >
        Get Started
      </Link>

      <Link
        to="/mutual-funds"
        className="
          border border-red-600 dark:border-red-500
          text-red-600 dark:text-red-400
          px-6 py-3 rounded-lg
          hover:bg-red-600 hover:text-white
          dark:hover:bg-red-500
          transition
        "
      >
        Explore Funds
      </Link>
    </div>
  </div>

  {/* --- About Section --- */}
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10">
    {/* Left Section */}
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.3 }}
      className="space-y-5"
    >
      <h2 className="text-3xl font-bold text-blue-950 dark:text-gray-100">
        What We Provide?
      </h2>

      <p className="text-lg text-blue-900 dark:text-gray-300 leading-relaxed">
        Wealthcrop helps you build financial freedom with curated mutual
        funds, smart insights, and expert-backed investment plans — designed
        for growth and security.
      </p>

      <ul className="text-left text-blue-900 dark:text-gray-300 space-y-2 list-disc list-inside">
        <li>Real-time performance tracking</li>
        <li>Top-performing SIP recommendations</li>
        <li>Secure, SEBI-registered platform</li>
        <li>24×7 investor support</li>
      </ul>

      <div className="flex gap-5 flex-wrap">
        <Link
          to="/about"
          className="
            inline-block 
            bg-blue-950 dark:bg-blue-600
            text-white font-semibold px-8 py-3 rounded-lg shadow
            hover:bg-blue-900 dark:hover:bg-blue-500
            transition
          "
        >
          Learn More
        </Link>

        <a
          href="https://www.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-2 
            bg-red-500 dark:bg-red-500
            hover:bg-red-600 dark:hover:bg-red-600
            text-white px-4 py-2 rounded-lg
            transition
          "
        >
          <MdOutlinePlayCircle size={24} />
          Watch Video
        </a>
      </div>
    </motion.div>

    {/* Right Section */}
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.3 }}
      className="flex justify-center"
    >
      <img
        src={invest}
        alt="Investment growth illustration"
        className="
          w-96 md:w-96 rounded-2xl shadow-md
          hover:scale-105 transition-transform duration-500
          dark:shadow-white/5
        "
      />
    </motion.div>
  </div>
</section>

  );
};

export default HeroSection;
