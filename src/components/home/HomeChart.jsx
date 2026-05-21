import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { year: "2019", investment: 10, growth: 14 },
  { year: "2020", investment: 15, growth: 20 },
  { year: "2021", investment: 22, growth: 30 },
  { year: "2022", investment: 30, growth: 42 },
  { year: "2023", investment: 35, growth: 50 },
  { year: "2024", investment: 45, growth: 63 },
];

const HomeChart = () => {
  return (
  <div
  className="
   overflow-hidden
    bg-gray-50 text-blue-950
    dark:bg-[#020617] dark:text-gray-100
  "
>
  {/* 📊 Investment Growth Section */}
  <section
    className="
      py-20
      bg-white
      dark:bg-gradient-to-b dark:from-[#020617] dark:to-[#020617]
    "
  >
    <div className="max-w-6xl mx-auto px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: false }}
        className="text-3xl font-bold text-blue-950 dark:text-gray-100 mb-6"
      >
        See Your Wealth Grow Over Time
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto"
      >
        Visualize how your investments can grow year over year with
        consistent planning and expert guidance.
      </motion.p>

      {/* Chart Container */}
      <div
        className="
          rounded-2xl p-4
          bg-gray-50 dark:bg-white/5
          shadow-inner dark:shadow-white/5
        "
      >
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e5e7eb",
              }}
            />
            <Line
              type="monotone"
              dataKey="growth"
              stroke="#ef4444" // red-500
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="investment"
              stroke="#3b82f6" // blue-500
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </section>

  {/* 💬 Testimonials Section */}
  <section
    className="
      py-20
      bg-gray-100
      dark:bg-gradient-to-b dark:from-[#020617] dark:to-[#020617]
    "
  >
    <div className="max-w-6xl mx-auto px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-3xl font-bold text-blue-950 dark:text-gray-100 mb-10"
      >
        What Our Investors Say
      </motion.h2>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            name: "Rohit Sharma",
            feedback:
              "Wealthcrop made investing so simple! My SIPs are now automatic, and I can track everything live.",
          },
          {
            name: "Aditi Mehta",
            feedback:
              "The UI is amazing and the analytics are powerful. I doubled my savings in 2 years!",
          },
          {
            name: "Kunal Verma",
            feedback:
              "Great support team and a clean app. I feel confident managing all my mutual funds here.",
          },
        ].map((user, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: false }}
            className="
              p-8 rounded-2xl transition
              bg-white dark:bg-white/5
              shadow hover:shadow-xl dark:shadow-white/5
              border border-transparent dark:border-white/10
            "
          >
            <p className="text-gray-600 dark:text-gray-300 italic mb-4">
              “{user.feedback}”
            </p>
            <h4 className="font-semibold text-blue-950 dark:text-gray-100">
              {user.name}
            </h4>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
</div>

  );
};

export default HomeChart;
