import React, { useState } from "react";
import setupImg from "../assets/setup.svg";
import walletImg from "../assets/wallet.svg"; // 🪙 add any wallet/money image here
import { useNavigate } from "react-router-dom";

const Balance = () => {
  const navigate = useNavigate();
  const [isAccountSetup, setIsAccountSetup] = useState(false);

  const balanceData = {
    available: 12500.75,
    marginUsed: 3500.0,
    totalFunds: 16000.75,
  };

  return (
    <div className="bg-white dark:bg-[var(--app-bg)] min-h-[400px] rounded-xl p-8 flex items-center justify-center">
      {isAccountSetup ? (
        //  After account setup — show balance in 2-column layout
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Image */}
          <div className="flex justify-center">
            <img
              src={walletImg}
              alt="Wallet"
              className="w-64 md:w-72 object-contain opacity-90"
            />
          </div>

          {/* Right Side - Balances */}
          <div>
            <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)] mb-6">
              Your Account Balance
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-[var(--white-10)] rounded-lg p-4 text-center">
                <p className="text-gray-500 dark:text-[var(--text-secondary)] text-sm">Available</p>
                <p className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">
                  ₹{balanceData.available.toLocaleString()}
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-[var(--white-10)] rounded-lg p-4 text-center">
                <p className="text-gray-500 dark:text-[var(--text-secondary)] text-sm">Margin Used</p>
                <p className="text-lg font-semibold text-orange-500 dark:text-orange-400 ">
                  ₹{balanceData.marginUsed.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-[var(--white-10)] rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)] ">Total Funds</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-500">
                  ₹{balanceData.totalFunds.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-left">
              <button
                onClick={() => navigate("/user/balance/inr")}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      ) : (
        //  Not setup yet
        <div className="flex flex-col items-center text-center gap-5 px-6 py-10">
          <img
            src={setupImg}
            alt="Setup account"
            className="w-40 md:w-60 object-contain opacity-90"
          />
          <div>
            <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)] mb-2">
              Action Needed
            </h2>
            <p className="text-gray-600 dark:text-[var(--text-secondary)] text-sm md:text-base">
              To start trading, please complete your account setup.
              <br /> Verify your KYC and link your bank account.
            </p>
          </div>
          <button
            onClick={() => setIsAccountSetup(true)}
            className="bg-blue-950 hover:bg-blue-900 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Setup Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Balance;
