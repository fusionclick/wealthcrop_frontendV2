import React from "react";
import { Link } from "react-router-dom";
import {
  Calculator,
  PiggyBank,
  LineChart,
  TrendingUp,
  Wallet,
  BarChart3,
  Percent,
  Landmark,
  PieChart,
  ArrowRight,
  Banknote,
  HandCoins,
  IndianRupee,
  CreditCard,
  WalletMinimal
} from "lucide-react";

const calculators = [
  {
    name: "SIP Calculator",
    path: "/calculator/sip-calculator",
    icon: PiggyBank,
    bg: "from-pink-100 to-pink-200",
  },
  {
    name: "FD Calculator",
    path: "/calculator/fd-calculator",
    icon: Banknote,
    bg: "from-amber-100 to-yellow-200",
  },
  {
    name: "Retirement Calculator",
    path: "/calculator/retirement-calculator",
    icon: LineChart,
    bg: "from-purple-100 to-indigo-200",
  },
  {
    name: "NPS Calculator",
    path: "/calculator/nps-calculator",
    icon: Landmark,
    bg: "from-green-100 to-emerald-200",
  },
  {
    name: "Lumpsum Calculator",
    path: "/calculator/lumpsum-calculator",
    icon: Wallet,
    bg: "from-blue-100 to-blue-200",
  },
  {
    name: "CAGR Calculator",
    path: "/calculator/cagr-calculator",
    icon: TrendingUp,
    bg: "from-rose-100 to-red-200",
  },
  {
    name: "SWP Calculator",
    path: "/calculator/swp-calculator",
    icon: HandCoins,
    bg: "from-teal-100 to-cyan-200",
  },
  {
    name: "EMI Calculator",
    path: "/calculator/emi-calculator",
    icon: WalletMinimal,
    bg: "from-red-100 to-red-200",
  },
  {
    name: "PPF Calculator",
    path: "/calculator/ppf-calculator",
    icon: Percent,
    bg: "from-lime-100 to-green-200",
  },
  {
    name: "APY Calculator",
    path: "/calculator/apy-calculator",
    icon: BarChart3,
    bg: "from-violet-100 to-fuchsia-200",
  },
  {
    name: "Inflation Calculator",
    path: "/calculator/inflation-calculator",
    icon: PieChart,
    bg: "from-orange-100 to-orange-200",
  },
  {
    name: "HRA Calculator",
    path: "/calculator/hra-calculator",
    icon: Calculator,
    bg: "from-sky-100 to-blue-200",
  },
  {
    name: "Education cost Calculator",
    path: "/calculator/education-cost-calculator",
    icon: Wallet,
    bg: "from-teal-100 to-cyan-200",
  },
  {
    name: "ELSS Calculator",
    path: "/calculator/elss-calculator",
    icon: HandCoins,
    bg: "from-amber-100 to-yellow-200",
  },
  {
    name: "LTCG Calculator",
    path: "/calculator/ltcg-calculator",
    icon: Landmark,
    bg: "from-purple-100 to-indigo-200",
  },
  {
    name: "80C Tracker",
    path: "/calculator/eightyC-calculator",
    icon: BarChart3,
    bg: "from-green-100 to-emerald-200",
  },
  
];


const CalculatorsPage = () => {
  return (
    <div
  className="
    min-h-screen p-6
    bg-linear-to-br from-blue-50 to-indigo-100
    dark:from-slate-900 dark:to-slate-800
  "
>
  <div className="max-w-6xl mx-auto">

    {/* HEADER */}
    <div className="text-center mb-10">
      <h1 className="text-4xl font-extrabold text-blue-900 drop-shadow dark:text-blue-400">
        Financial Calculators
      </h1>
      <p className="text-blue-800 mt-3 text-sm font-medium max-w-2xl mx-auto dark:text-slate-300">
        WealthCrop provides more advanced calculators to help you make smarter
        and more accurate financial decisions. Choose a tool below and start
        planning your wealth journey today.
      </p>
    </div>

    {/* CALCULATOR GRID */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {calculators.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link
            key={idx}
            to={item.path}
            className="
              rounded-2xl overflow-hidden
              shadow-md hover:shadow-xl transition transform hover:-translate-y-1
              bg-white border border-gray-200
              dark:bg-slate-900 dark:border-slate-700
            "
          >
            <div
              className={`
                p-4 flex flex-col items-center
                bg-linear-to-br ${item.bg}
                dark:brightness-90
              `}
            >
              <Icon className="text-blue-900 dark:text-blue-300" size={28} />
            </div>

            <div className="p-4 flex flex-col items-center text-center">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-slate-200">
                {item.name}
              </h3>
              <ArrowRight
                className="text-blue-600 mt-2 dark:text-blue-400"
                size={18}
              />
            </div>
          </Link>
        );
      })}
    </div>

    {/* FOOT NOTE */}
    <div className="text-center text-xs text-blue-700 mt-10 font-medium dark:text-slate-400">
      These tools help estimate returns but do not provide guaranteed results.
    </div>
  </div>
</div>

  );
};

export default CalculatorsPage;
