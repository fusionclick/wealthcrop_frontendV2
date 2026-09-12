import React from "react";
import { BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-[var(--app-bg)] p-6">
      <div className="flex flex-col items-center justify-center text-center">
  <div
    className="
      bg-blue-100 text-blue-600 p-4 rounded-full mb-4
      dark:bg-blue-500/15 dark:text-blue-400
    "
  >
    <BarChart3 size={40} />
  </div>

  <h2
    className="
      text-2xl font-semibold mb-2
      text-blue-950
      dark:text-[var(--text-primary)]
    "
  >
    No Reports Available
  </h2>

  <p
    className="
      text-gray-600 text-sm md:text-base mb-5 max-w-md
      dark:text-[var(--text-secondary)]
    "
  >
    You haven’t generated any reports yet. Once you start investing,
    detailed performance insights will appear here.
  </p>

  <button
    onClick={() => navigate("/user/stocks/explore")}
    className="
      bg-blue-600 hover:bg-blue-700 text-white
      dark:bg-blue-500 dark:hover:bg-blue-600
      px-5 py-2 rounded-lg text-sm font-medium transition
    "
  >
    Explore Investments
  </button>
</div>
    </div>
  );
};

export default Reports;
