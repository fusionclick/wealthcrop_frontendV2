import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import CalcShell, { useCalcState } from "./CalcShell";
import { emergencyFund, parkingFunds } from "../../utils/calculators";
import { inr } from "../../utils/calcSafe";
import { fundBuyPath, nodeUrl } from "../../utils/nodeApi";

// Audit #68 — "suitable options" was one fixed sentence. These are real liquid and overnight
// funds from the live catalogue, best one-year return first.
const PARKING = [
  ["Liquid funds", "liquid"],
  ["Overnight funds", "overnight"],
];

const EmergencyFundCalculator = () => {
  const navigate = useNavigate();
  const [v, set] = useCalcState({ expenses: 40000, months: 6, current: 0, rate: 6, buildMonths: 12 });
  const r = useMemo(() => emergencyFund(v), [v]);

  const options = useQueries({
    queries: PARKING.map(([, search]) => ({
      queryKey: ["emergencyParking", search],
      // axios, not postApi: postApi toasts every failure, and a calculator should not shout
      // about a suggestion list nobody asked for. Without the list the page still has the
      // sentence in its note, which is the honest fallback.
      queryFn: () =>
        axios
          .post(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
            start: 0,
            length: 50,
            search,
            // The buy page refuses a scheme BSE says cannot be held in demat (dematBlocked);
            // the catalogue's "demat" mode is that same rule, so every Invest below can go through.
            mode: "demat",
            sort: "returns_1y",
            order: "desc",
          })
          .then((res) => parkingFunds(res?.data?.data?.lists)),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const settled = options.every((q) => !q.isLoading);
  const none = settled && options.every((q) => !q.data?.length);

  return (
    <CalcShell
      title="Emergency Fund Calculator"
      blurb="Work out how much you should keep aside for an emergency, how far along you already are, and what it takes each month to close the gap."
      values={v}
      onChange={set}
      fields={[
        { key: "expenses", label: "Monthly Living Expenses (₹)", placeholder: "40000", max: 1e8 },
        { key: "months", label: "Months to Cover", hint: "A common rule of thumb is 6 to 12", max: 120 },
        { key: "current", label: "Current Emergency Savings (₹)", placeholder: "0", max: 1e10 },
        { key: "buildMonths", label: "Months to Build the Fund", hint: "How long you give yourself to get there", max: 120 },
        { key: "rate", label: "Expected Return if Invested (% p.a.)", hint: "What a liquid or overnight fund pays — your deposits earn it while you build", max: 50 },
      ]}
      results={[
        { label: "Fund required", value: r.required },
        { label: "Still to save", value: r.shortfall },
        { label: "Save each month", value: r.monthlySaving },
        {
          label: "Income once parked",
          // `toLocaleString` on Infinity is the string "∞" — and the truthy check lets it
          // through. `inr` is the guard that returns a dash instead.
          text: r.annualIncomeIfInvested ? `₹${inr(r.annualIncomeIfInvested)}/yr` : "—",
        },
        {
          label: "Status",
          text: r.funded ? "Fully funded" : "Building",
        },
      ]}
      note="Where to keep it: liquid funds, overnight funds or a sweep-in deposit — reachable within a day and not exposed to the market. What you have saved and each month's deposit earn the expected return until the deadline, which is why the monthly figure times the months comes to a little less than what is still to save. The target itself is never reduced by the return: the full amount has to be there the month you need it."
    >
      <section className="max-w-4xl mx-auto px-4 mt-2">
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Where you could park it</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Liquid and overnight funds from our catalogue, highest one-year return first. Past
            returns do not promise future ones.
          </p>

          {none ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Live fund suggestions are not available right now. A liquid fund, an overnight fund
              or a sweep-in deposit with your bank are the usual places to keep this money.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {PARKING.map(([label], i) => {
                const q = options[i];
                return (
                  <div key={label}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</h3>
                    {q.isLoading ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading funds…</p>
                    ) : !q.data?.length ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">None available right now.</p>
                    ) : (
                      <ul className="space-y-2">
                        {q.data.map((f) => {
                          const oneYear = f.returns?.["1Y"];
                          return (
                            <li
                              key={`${f.scheme_isin}-${f.scheme_bse_code}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{f.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {f.plan} plan · Growth
                                  {/* Only a return the catalogue actually has — no figure, no claim. */}
                                  {Number.isFinite(oneYear) && ` · 1Y ${oneYear.toFixed(2)}%`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => navigate(fundBuyPath(f.scheme_isin, f.scheme_bse_code))}
                                className="shrink-0 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                              >
                                Invest
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </CalcShell>
  );
};

export default EmergencyFundCalculator;
