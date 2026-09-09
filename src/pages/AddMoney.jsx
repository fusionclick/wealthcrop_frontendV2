import React, { useState } from "react";
import { IndianRupee, Wallet, Info } from "lucide-react";
import moneyImg from "../assets/add_money.svg"; // 🟠 replace with your PNG

const AddMoney = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");

  const handleQuickAdd = (value) => {
    setAmount((prev) => (prev ? parseInt(prev) + value : value));
  };

  // ponytail: no payment gateway wired up yet, so there is nothing to submit to.

  return (
    <div
  className="
    min-h-[90vh] flex justify-center items-center p-4
    bg-gray-50
    dark:bg-[var(--app-bg)]
  "
>
  <div
    className="
      w-full max-w-5xl rounded-2xl shadow-lg border flex flex-col md:flex-row overflow-hidden
      bg-white border-gray-200

      dark:bg-[var(--card-bg)]
      dark:border-[var(--border-color)]
    "
  >
    {/* 🔸 Left Side Image */}
    <div
      className="
        w-full md:w-1/2 flex justify-center items-center p-10
        bg-green-50

        dark:bg-emerald-500/10
      "
    >
      <img
        src={moneyImg}
        alt="Add Money"
        className="w-64 md:w-80 object-contain"
      />
    </div>

    {/* 🔸 Right Side Form */}
    <div className="w-full md:w-1/2 p-6 md:p-10">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Wallet size={26} className="text-green-600 dark:text-emerald-400" />
          <h2
            className="
              text-2xl font-semibold
              text-gray-800
              dark:text-[var(--text-primary)]
            "
          >
            Add Money
          </h2>
        </div>

        <p
          className="
            text-sm
            text-gray-500
            dark:text-[var(--text-secondary)]
          "
        >
          Fund your account securely in seconds
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-5">
        <label
          className="
            block font-medium mb-2
            text-gray-700
            dark:text-[var(--text-secondary)]
          "
        >
          Enter Amount
        </label>

        <div className="relative">
          <IndianRupee
            size={18}
            className="
              absolute left-3 top-3
              text-gray-500
              dark:text-[var(--text-secondary)]
            "
          />

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="
              w-full rounded-lg pl-9 pr-3 py-2.5 text-lg outline-none transition
              border border-gray-300 bg-white text-gray-800
              focus:ring-2 focus:ring-green-600

              dark:border-[var(--border-color)]
              dark:bg-[var(--white-5)]
              dark:text-[var(--text-primary)]
              dark:focus:ring-emerald-500
            "
          />
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex justify-between mb-6">
        {[500, 1000, 5000].map((val) => (
          <button
            key={val}
            onClick={() => handleQuickAdd(val)}
            className="
              px-4 py-2 rounded-lg font-medium transition
              bg-green-100 text-green-800 hover:bg-green-200

              dark:bg-emerald-500/15
              dark:text-emerald-400
              dark:hover:bg-emerald-500/25
            "
          >
            + ₹{val}
          </button>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <label
          className="
            block font-medium mb-2
            text-gray-700
            dark:text-[var(--text-secondary)]
          "
        >
          Payment Method
        </label>

        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "UPI", color: "border-green-500 text-green-700" },
            { name: "NetBanking", color: "border-orange-400 text-orange-600" },
            { name: "Card", color: "border-green-400 text-green-600" },
            { name: "Wallet", color: "border-orange-400 text-orange-600" },
          ].map((m) => (
            <button
              key={m.name}
              onClick={() => setMethod(m.name)}
              className={`
                border-2 rounded-lg py-2 font-medium transition
                ${
                  method === m.name
                    ? `${m.color} bg-opacity-10`
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }

                dark:border-[var(--border-color)]
                dark:text-[var(--text-secondary)]
                dark:hover:border-[var(--text-primary)]
              `}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Proceed Button */}
      <button
        type="button"
        disabled
        className="
          w-full py-3 rounded-lg font-semibold transition
          bg-gray-300 text-gray-600 cursor-not-allowed

          dark:bg-[var(--white-10)]
          dark:text-[var(--text-secondary)]
        "
      >
        Proceed to Add ₹{amount || "0"}
      </button>

      {/* Info Section */}
      <div
        className="
          mt-6 rounded-lg p-3 text-sm flex items-start gap-2
          bg-amber-50 border border-amber-200 text-amber-800

          dark:bg-amber-500/10
          dark:border-amber-500/30
          dark:text-amber-400
        "
      >
        <Info size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Adding funds isn’t available yet — payments aren’t connected to this
          account. You’ll be able to top up once your funds account goes live.
        </p>
      </div>
    </div>
  </div>
</div>

  );
};

export default AddMoney;
