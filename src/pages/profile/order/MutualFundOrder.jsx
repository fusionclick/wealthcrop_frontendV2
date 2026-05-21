import React, { useState } from "react";
import emptymutual from "../../../assets/emptymutual.svg";

const MutualFundOrder = () => {
  // 🔹 Dummy Mutual Fund Data
  const [funds, setFunds] = useState([
        // {
        //   id: 1,
        //   fundName: "Axis Bluechip Fund - Direct Growth",
        //   type: "Equity",
        //   nav: 52.45,
        //   units: 125.6,
        //   invested: 6500.0,
        //   date: "2025-11-10",
        //   status: "Completed",
        // },
        // {
        //   id: 2,
        //   fundName: "HDFC Short Term Debt Fund - Regular Plan",
        //   type: "Debt",
        //   nav: 19.72,
        //   units: 500.0,
        //   invested: 9850.0,
        //   date: "2025-11-09",
        //   status: "Pending",
        // },
        // {
        //   id: 3,
        //   fundName: "Parag Parikh Flexi Cap Fund - Direct Growth",
        //   type: "Equity",
        //   nav: 68.31,
        //   units: 150.0,
        //   invested: 10200.0,
        //   date: "2025-11-12",
        //   status: "Completed",
        // },
  ]);

  // 🔸 Uncomment to test empty state
  // const [funds, setFunds] = useState([]);

  return (
    <div
  className="
    bg-white min-h-[400px] rounded-xl shadow-sm p-6

    dark:bg-[var(--card-bg)]
  "
>
  {funds.length === 0 ? (
    // 🔹 Empty State
    <div
      className="
        flex flex-col items-center justify-center min-h-[350px]
        text-center px-6

        dark:bg-[var(--card-bg)]
      "
    >
      <img
        src={emptymutual}
        alt="No Mutual Funds"
        className="w-56 md:w-64 lg:w-80 mb-4 object-contain"
      />

      <h2
        className="
          text-2xl font-semibold
          text-blue-950
          dark:text-[var(--text-primary)]
        "
      >
        No Mutual Fund Orders
      </h2>

      <p
        className="
          text-gray-600 text-sm mt-2
          dark:text-[var(--text-secondary)]
        "
      >
        You haven’t invested in any mutual funds yet.
        <br />
        Start your SIP journey today and build your wealth.
      </p>

      <button
        className="
          mt-5 px-6 py-2 rounded-lg text-sm font-medium transition
          bg-emerald-600 hover:bg-emerald-700 text-white
        "
      >
        Explore Mutual Funds
      </button>
    </div>
  ) : (
    // 🔹 Table for Mutual Fund Orders
    <div className="overflow-x-auto">
      <h2
        className="
          text-xl font-semibold mb-4
          text-blue-950
          dark:text-[var(--text-primary)]
        "
      >
        Your Mutual Fund Orders
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
              "Fund Name",
              "Type",
              "NAV",
              "Units",
              "Investment (₹)",
              "Date",
              "Status",
            ].map((h) => (
              <th
                key={h}
                className="
                  px-4 py-2 font-medium text-left
                  text-gray-700
                  dark:text-[var(--text-secondary)]
                "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {funds.map((fund) => (
            <tr
              key={fund.id}
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
                {fund.fundName}
              </td>

              <td
                className={`px-4 py-2 font-medium ${
                  fund.type === "Equity"
                    ? "text-green-600 dark:text-emerald-400"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {fund.type}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                ₹{fund.nav.toFixed(2)}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {fund.units.toFixed(2)}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                ₹{fund.invested.toLocaleString()}
              </td>

              <td className="px-4 py-2 text-right text-gray-700 dark:text-[var(--text-secondary)]">
                {fund.date}
              </td>

              <td
                className={`px-4 py-2 text-right font-medium ${
                  fund.status === "Completed"
                    ? "text-green-600 dark:text-emerald-400"
                    : "text-yellow-600 dark:text-amber-400"
                }`}
              >
                {fund.status}
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

export default MutualFundOrder;
