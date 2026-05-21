import React, { useState } from "react";
import empty from "../../../assets/allorders.png";

const FutureandOptions = () => {
  // 🔹 Dummy F&O data
  const [contracts, setContracts] = useState([
    {
      id: 1,
      name: "NIFTY 20NOV25 20000 CE",
      type: "Call",
      strikePrice: 20000,
      expiryDate: "2025-11-20",
      lotSize: 50,
      ltp: 152.35,
      change: "+1.42%",
      orderDate: "2025-11-12",
    },
    {
      id: 2,
      name: "BANKNIFTY 27NOV25 47000 PE",
      type: "Put",
      strikePrice: 47000,
      expiryDate: "2025-11-27",
      lotSize: 25,
      ltp: 320.75,
      change: "-0.86%",
      orderDate: "2025-11-11",
    },
    {
      id: 3,
      name: "RELIANCE FUT 28NOV25",
      type: "Future",
      strikePrice: 0,
      expiryDate: "2025-11-28",
      lotSize: 250,
      ltp: 2502.6,
      change: "+0.54%",
      orderDate: "2025-11-13",
    },
  ]);

  // 🔸 Uncomment to test empty state
  // const [contracts, setContracts] = useState([]);

  return (
    <div
  className="
    bg-white min-h-[400px] rounded-xl shadow-sm p-6

    dark:bg-[var(--card-bg)]
  "
>
  {contracts.length === 0 ? (
    // 🔹 Empty State
    <div
      className="
        flex items-center justify-center min-h-[350px]
        bg-white

        dark:bg-[var(--card-bg)]
      "
    >
      <div className="flex flex-col md:flex-row items-center gap-14 px-6 py-10">
        <div>
          <img
            src={empty}
            alt="Empty state"
            className="w-48 md:w-56 lg:w-80 object-contain"
          />
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
          <div>
            <p
              className="
                text-gray-600 text-sm font-medium
                dark:text-[var(--text-secondary)]
              "
            >
              Introducing
            </p>

            <h2
              className="
                text-2xl md:text-3xl font-semibold leading-snug
                text-blue-950
                dark:text-[var(--text-primary)]
              "
            >
              Futures & Options
            </h2>
          </div>

          <p
            className="
              text-gray-600 text-sm md:text-base
              dark:text-[var(--text-secondary)]
            "
          >
            Start trading in F&O and explore advanced derivatives
            opportunities with ease.
          </p>

          <button
            className="
              mt-4 px-5 py-2 rounded-lg text-sm font-medium transition
              bg-emerald-600 hover:bg-emerald-700 text-white
            "
          >
            Try it out
          </button>
        </div>
      </div>
    </div>
  ) : (
    // 🔹 F&O Table
    <div className="overflow-x-auto">
      <h2
        className="
          text-xl font-semibold mb-4
          text-blue-950
          dark:text-[var(--text-primary)]
        "
      >
        Your Futures & Options Positions
      </h2>

      <table
        className="
          min-w-full text-sm rounded-lg overflow-hidden
          border border-gray-200

          dark:border-[var(--border-color)]
        "
      >
        <thead
          className="
            bg-gray-100

            dark:bg-[var(--white-5)]
          "
        >
          <tr>
            {[
              "Contract",
              "Type",
              "Strike Price",
              "Expiry Date",
              "Lot Size",
              "LTP",
              "Change",
              "Order Date",
            ].map((h) => (
              <th
                key={h}
                className="
                  px-4 py-2 font-medium
                  text-gray-700
                  dark:text-[var(--text-secondary)]
                  text-left
                "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {contracts.map((item) => (
            <tr
              key={item.id}
              className="
                border-t transition
                hover:bg-gray-50

                dark:border-[var(--border-color)]
                dark:hover:bg-[var(--white-5)]
              "
            >
              <td
                className="
                  px-4 py-2 font-medium whitespace-nowrap
                  text-blue-950
                  dark:text-[var(--text-primary)]
                "
              >
                {item.name}
              </td>

              <td
                className={`px-4 py-2 text-sm font-medium ${
                  item.type === "Call"
                    ? "text-green-600 dark:text-emerald-400"
                    : item.type === "Put"
                    ? "text-red-500 dark:text-rose-400"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {item.type}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {item.strikePrice > 0 ? `₹${item.strikePrice}` : "—"}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {item.expiryDate}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {item.lotSize}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                ₹{item.ltp.toFixed(2)}
              </td>

              <td
                className={`px-4 py-2 text-right font-medium ${
                  item.change.startsWith("+")
                    ? "text-green-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-rose-400"
                }`}
              >
                {item.change}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {item.orderDate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

  );
};

export default FutureandOptions;
