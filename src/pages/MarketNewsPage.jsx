import React, { useEffect, useState } from "react";
import { ArrowRightLeft, Newspaper } from "lucide-react";
import { fetchFxRates } from "../api/marketApi";

// Audit #52 — market data and news.
//
// Exchange rates come from the market API (Yahoo quotes for USDINR=X and the other pairs,
// each checked to return a live price). News needs a licensed feed and an API key the client
// has not supplied, so that half still says it is not connected rather than inventing
// headlines — and the hero no longer claims analysts curate a feed that does not exist.

// India quotes the yen per 100 (the RBI reference rate does), so ₹0.61 reads as ₹60.89.
const PER = { JPY: 100 };

const fxRateLabel = (row) =>
  `₹${(Number(row.rate) * (PER[row.code] || 1)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;

export default function MarketNewsPage() {
  // null while loading, [] when the provider gave nothing — two different sentences.
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchFxRates()
      .then((r) => alive && setRates(Array.isArray(r?.data) ? r.data : []))
      .catch(() => alive && setRates([]));
    return () => {
      alive = false;
    };
  }, []);

  const asOf = rates?.find((r) => r.as_of)?.as_of;

  return (
    <div
  className="
    min-h-screen py-12
    bg-linear-to-b from-blue-50 via-white to-blue-50
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  <div className="max-w-6xl mx-auto px-6">

    {/* HERO SECTION */}
    <div
      className="
        rounded-3xl p-10 shadow-lg mb-10 border
        bg-linear-to-r from-blue-100 to-indigo-100 border-blue-200
        text-blue-900
        dark:from-[#020617] dark:to-[#020617] dark:border-white/10 dark:text-white
      "
    >
      <h1 className="text-4xl font-extrabold mb-2">
        Markets
      </h1>

      <p className="text-blue-700 text-lg dark:text-gray-400">
        Rupee exchange rates, and market news once a news feed is connected.
      </p>
    </div>

    {/* EXCHANGE RATES */}
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Exchange rates (INR)</h2>
      </div>

      {rates === null ? (
        <p className="text-sm text-slate-500 dark:text-gray-400">Loading rates…</p>
      ) : rates.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Exchange rates are unavailable right now. Try again in a minute.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-gray-400">
                  <th className="py-2 pr-4 font-medium">Currency</th>
                  <th className="py-2 pr-4 font-medium text-right">Rate</th>
                  <th className="py-2 font-medium text-right">1D change</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((row) => {
                  const pct = Number(row.pChange) || 0;
                  return (
                    <tr key={row.code} className="border-t border-slate-100 dark:border-white/10">
                      <td className="py-2.5 pr-4">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {PER[row.code] ? `${PER[row.code]} ${row.code}` : row.code}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 dark:text-gray-400">{row.name}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-slate-900 dark:text-white">
                        {fxRateLabel(row)}
                      </td>
                      <td
                        className={`py-2.5 text-right ${
                          pct > 0 ? "text-emerald-600 dark:text-emerald-400" : pct < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-gray-400"
                        }`}
                      >
                        {pct > 0 ? "+" : ""}
                        {pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 dark:text-gray-500">
            Indicative market rates from Yahoo Finance
            {asOf ? `, last quoted ${new Date(asOf).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}.
            A bank or card provider adds its own spread on top.
          </p>
        </>
      )}
    </section>

    {/* NEWS — BLOCKED until a news provider and key are supplied */}
    <div className="min-h-[30vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400">
          <Newspaper size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          Market news isn’t connected yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          We haven’t hooked up a news provider for this account. Headlines will
          appear here once the feed is live.
        </p>
      </div>
    </div>

  </div>
</div>

  );
}
