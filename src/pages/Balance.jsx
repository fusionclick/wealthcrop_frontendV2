import React from "react";
import setupImg from "../assets/setup.svg";
import { useNavigate } from "react-router-dom";

const Balance = () => {
  const navigate = useNavigate();

  // ponytail: no funding backend yet — no balances to show, so we show none.
  return (
    <div className="bg-white dark:bg-[var(--app-bg)] min-h-[400px] rounded-xl p-8 flex items-center justify-center">
      <div className="flex flex-col items-center text-center gap-5 px-6 py-10">
        <img
          src={setupImg}
          alt="Setup account"
          className="w-40 md:w-60 object-contain opacity-90"
        />
        <div>
          <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)] mb-2">
            Funds account not linked yet
          </h2>
          <p className="text-gray-600 dark:text-[var(--text-secondary)] text-sm md:text-base max-w-md">
            We can’t show a balance until your funds account is connected.
            <br /> Complete your KYC and link a broker account to get started.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/kyc")}
          className="bg-blue-950 hover:bg-blue-900 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          Complete KYC
        </button>
      </div>
    </div>
  );
};

export default Balance;
