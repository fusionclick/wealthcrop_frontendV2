import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { calculateDistribution } from "../../utils/distribution";
import basketDetailsData from "../../data/basketDetails";
import { FaArrowLeft } from 'react-icons/fa'; 

export default function Invest({ baskets }) {
  const { id } = useParams();
  const basket = baskets[id];
  const details = basketDetailsData[id];

  const [mode, setMode] = useState("sip"); // sip | lumpsum
  const [amount, setAmount] = useState(1000);
  const [sipDate, setSipDate] = useState(5);

  const distribution = calculateDistribution(amount, details.funds);

  return (
   <div
  className="
    min-h-screen p-6
    bg-[#f3f7fb]
    dark:bg-[var(--app-bg)]
  "
>
  {/* Header */}
  <div className="max-w-3xl mx-auto mb-4">
    <Link
      to={`/basket/${id}`}
      className="
        flex items-center font-medium text-sm
        text-white bg-blue-500 hover:bg-blue-600
        rounded-lg px-4 py-2 transition shadow-lg hover:shadow-xl
      "
    >
      <FaArrowLeft className="mr-2" /> Back to Basket
    </Link>

    <h1
      className="
        text-2xl font-bold mt-2
        text-slate-800
        dark:text-[var(--text-primary)]
      "
    >
      Invest in {basket.name}
    </h1>

    <p
      className="
        text-sm mt-1
        text-gray-600
        dark:text-[var(--text-secondary)]
      "
    >
      Choose SIP or one-time investment and see instant allocation.
    </p>
  </div>

  <div className="max-w-3xl mx-auto space-y-5">

    {/* ===================== */}
    {/* SECTION 1 — MODE */}
    {/* ===================== */}
    <div
      className="
        bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4
        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
    >
      <h2
        className="
          font-semibold text-[15px] mb-3
          text-slate-800
          dark:text-[var(--text-primary)]
        "
      >
        Investment Type
      </h2>

      <div className="flex gap-2">
        {["sip", "lumpsum"].map((t) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === t
                ? "bg-blue-500 text-white"
                : `
                    bg-[#f9fbff] text-slate-700 border border-[#e0e7ef]
                    dark:bg-[var(--white-5)]
                    dark:text-[var(--text-secondary)]
                    dark:border-[var(--border-color)]
                  `
            }`}
          >
            {t === "sip" ? "Monthly SIP" : "One-time"}
          </button>
        ))}
      </div>
    </div>

    {/* ===================== */}
    {/* SECTION 2 — AMOUNT */}
    {/* ===================== */}
    <div
      className="
        bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4
        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
    >
      <h2
        className="
          font-semibold text-[15px] mb-3
          text-slate-800
          dark:text-[var(--text-primary)]
        "
      >
        {mode === "sip" ? "Monthly SIP Amount" : "Investment Amount"}
      </h2>

      <input
        type="number"
        className="
          w-full rounded-xl p-3 text-lg font-semibold
          border border-[#d4dbe5]
          bg-[#f9fbff] text-slate-800
          focus:ring-2 focus:ring-blue-200

          dark:bg-[var(--white-5)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
        "
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <div className="flex gap-2 mt-3">
        {[500, 1000, 2000].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(amount + v)}
            className="
              px-4 py-1.5 text-sm rounded-full
              bg-blue-100 text-blue-700 hover:bg-blue-200

              dark:bg-blue-500/15
              dark:text-blue-400
            "
          >
            +{v}
          </button>
        ))}
      </div>

      {mode === "sip" && (
        <p
          className="
            text-xs mt-2
            text-gray-500
            dark:text-[var(--text-secondary)]
          "
        >
          Minimum SIP: ₹500
        </p>
      )}
    </div>

    {/* ===================== */}
    {/* SIP DATE */}
    {/* ===================== */}
    {mode === "sip" && (
      <div
        className="
          bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        <h2
          className="
            font-semibold text-[15px] mb-3
            text-slate-800
            dark:text-[var(--text-primary)]
          "
        >
          SIP Date
        </h2>

        <div className="flex gap-2 flex-wrap">
          {[1, 5, 10, 15, 20, 25].map((d) => (
            <button
              key={d}
              onClick={() => setSipDate(d)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                sipDate === d
                  ? "bg-blue-500 text-white border-blue-500"
                  : `
                      bg-[#f9fbff] text-slate-700 border-[#e0e7ef]
                      dark:bg-[var(--white-5)]
                      dark:text-[var(--text-secondary)]
                      dark:border-[var(--border-color)]
                    `
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <p
          className="
            text-xs mt-2
            text-gray-500
            dark:text-[var(--text-secondary)]
          "
        >
          Amount will be debited every month on {sipDate}th
        </p>
      </div>
    )}

    {/* ===================== */}
    {/* DISTRIBUTION */}
    {/* ===================== */}
    <div
      className="
        bg-white border border-[#e0e7ef] rounded-xl shadow-sm p-4
        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
    >
      <h2
        className="
          font-semibold text-[15px] mb-3
          text-slate-800
          dark:text-[var(--text-primary)]
        "
      >
        Fund Allocation
      </h2>

      <div className="space-y-2">
        {distribution.map((d, i) => (
          <div
            key={i}
            className="
              flex justify-between items-center px-3 py-2 text-sm rounded-lg
              bg-[#f9fbff] border border-[#e5ecf3]

              dark:bg-[var(--white-5)]
              dark:border-[var(--border-color)]
            "
          >
            <span className="text-slate-700 dark:text-[var(--text-secondary)]">
              {d.name}
            </span>

            <span className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
              ₹{d.amount}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* ===================== */}
    {/* CTA */}
    {/* ===================== */}
    <button
      className="
        w-full py-3 text-lg font-semibold rounded-xl shadow transition
        bg-blue-500 text-white hover:bg-blue-600
      "
    >
      {mode === "sip" ? "Start SIP" : "Proceed to Pay"}
    </button>
  </div>
</div>

  );
}
