import React, { useState } from "react";
import emptySip from "../../assets/mutualFund/sipEmpty2.svg";

/* ---------------- SAMPLE STATIC SIP DATA ---------------- */
const SIP_DATA = [
  {
    id: 1,
    name: "Parag Parikh Flexi Cap Fund Direct Growth",
    category: "Equity • Flexi Cap",
    amount: 2000,
    nextInstallment: "10 Jan 2026",
    invested: 84000,
    current: 101200,
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Axis Bluechip Fund Direct Growth",
    category: "Equity • Large Cap",
    amount: 3000,
    nextInstallment: "05 Jan 2026",
    invested: 108000,
    current: 122500,
    status: "ACTIVE",
  },
];
/* -------------------------------------------------------- */


const SIPs = () => {
  // TO TEST EMPTY PAGE → change []  
  const [sips] = useState(SIP_DATA);

  return (
    <div
  className="
    w-full max-w-5xl mx-auto px-4 py-10
    bg-transparent
    text-slate-900
    dark:text-[var(--text-primary)]
  "
>
  {/* ==== EMPTY SIP VIEW ==== */}
  {sips.length === 0 ? (
    <div className="min-h-[400px] flex flex-col justify-center items-center space-y-5">
      <img src={emptySip} className="w-72 opacity-90" />

      <h1 className="text-2xl font-semibold dark:text-[var(--text-primary)]">
        No active SIPs
      </h1>

      <p className="text-slate-500 dark:text-[var(--text-secondary)] text-sm">
        When you start an SIP, it will appear here.
      </p>
    </div>
  ) : (
    <>
      {/* ==== HEADER ==== */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold dark:text-[var(--text-primary)]">
          Your SIPs
        </h1>

        <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
          Tracking all your ongoing SIP investments
        </p>
      </div>

      {/* ==== SIP LIST ==== */}
      <div className="space-y-4">
        {sips.map((sip) => {
          const pnl = sip.current - sip.invested;
          const pnlPercent = (pnl / sip.invested) * 100;

          return (
            <div
              key={sip.id}
              className="
                rounded-xl p-5 flex flex-col gap-4 md:flex-row md:justify-between md:items-center
                bg-white border border-slate-200 shadow-sm
                dark:bg-[var(--card-bg)]
                dark:border-[var(--border-color)]
              "
            >
              {/* LEFT SIDE */}
              <div className="flex-1">
                <p className="font-semibold text-sm dark:text-[var(--text-primary)]">
                  {sip.name}
                </p>

                <p className="text-[12px] text-slate-500 dark:text-[var(--text-secondary)]">
                  {sip.category}
                </p>

                <div className="flex items-center gap-2 mt-2 text-[11px]">
                  <span
                    className="
                      px-2 py-0.5 rounded-full
                      bg-emerald-100 text-emerald-700
                      dark:bg-emerald-500/15 dark:text-emerald-400
                    "
                  >
                    {sip.status}
                  </span>

                  <span
                    className="
                      px-2 py-0.5 rounded-full
                      bg-slate-100 text-slate-600
                      dark:bg-[var(--soft-bg)] dark:text-[var(--text-secondary)]
                    "
                  >
                    Monthly • ₹{sip.amount}
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE NUMBERS */}
              <div className="flex gap-6 text-right md:text-left md:gap-12 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                    Next installment
                  </p>
                  <p className="font-medium dark:text-[var(--text-primary)]">
                    {sip.nextInstallment}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                    Invested
                  </p>
                  <p className="font-medium dark:text-[var(--text-primary)]">
                    ₹{sip.invested.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                    Current value
                  </p>
                  <p className="font-medium dark:text-[var(--text-primary)]">
                    ₹{sip.current.toLocaleString()}
                  </p>

                  <p
                    className={`text-[11px] font-medium mt-0.5 ${
                      pnl >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {pnl >= 0 ? "+" : "-"}₹
                    {Math.abs(pnl).toLocaleString()} (
                    {pnlPercent >= 0 ? "+" : ""}
                    {pnlPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</div>

  );
};

export default SIPs;
