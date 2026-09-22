import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { postApi, postApiWithToken, getApiWithToken, deleteApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { nodeUrl, validateInvestorReady } from "../../utils/nodeApi";
import Combo, { fieldClass } from "../../components/ui/Combo";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";
import { buildSxpIntent } from "../../utils/sxp";
import { buildSpreadPlan, instalmentDates } from "../../utils/spread";

/**
 * SRS §4 "Spread" — dividing a lump sum into smaller, periodic investments across
 * multiple funds.
 *
 * Two shapes, because they are genuinely different instructions:
 *
 *   immediate — one purchase per fund, today. Each leg is paid for separately, which is
 *               what BSE's payment link is: per order.
 *   staggered — the real spread. The money already sits in one holding (a liquid fund is
 *               the usual choice) and an STP moves it out in instalments. BSE runs that
 *               schedule; this app never needs a nightly job, and could not run one
 *               anyway — placing an order needs the investor's own bearer token.
 *
 * The split is computed by the server. `buildSpreadPlan` here previews it so the investor
 * sees the allocation before committing; the amounts that reach BSE come back from
 * POST /spreads, never from this file.
 */

const holdingLabel = (h) => `${h.scheme_name || "Fund"}${h.folio ? ` · ${h.folio}` : ""}`;
// Same six-digit reference the single-fund invest page generates, per order.
const generateOrderRefId = () => String(Math.floor(100000 + Math.random() * 900000));
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FREQ = [
  { value: "m", label: "Monthly" },
  { value: "q", label: "Quarterly" },
  { value: "w", label: "Weekly" },
];

export default function SpreadInvest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;
  const disc = useDisclaimers();

  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [mode, setMode] = useState("staggered");
  const [instalments, setInstalments] = useState(12);
  const [frequency, setFrequency] = useState("m");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [srcText, setSrcText] = useState("");
  const [fundQuery, setFundQuery] = useState("");
  const [picked, setPicked] = useState([]); // [{ scheme_code, name, percent, min_amount }]
  const [submitting, setSubmitting] = useState(false);

  const staggered = mode === "staggered";

  // Same cache key the switch and redeem pages use — these holdings carry BSE's real folio,
  // which an STP cannot be registered without.
  const { data: holdings = [] } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => (Array.isArray(res?.data?.holdings) ? res.data.holdings : []),
    enabled: !!ucc,
  });

  const { data: allFunds = [] } = useQuery({
    queryKey: ["spreadFunds", fundQuery],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 50,
        search: fundQuery,
      }),
    select: (res) => res?.data?.lists || [],
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  const { data: spreads = [], refetch: refetchSpreads } = useQuery({
    queryKey: ["spreads"],
    queryFn: () => getApiWithToken(`${import.meta.env.VITE_URL}/spreads`),
    select: (res) => res?.data || [],
  });

  const source = holdings.find((h) => holdingLabel(h) === srcText);

  // An immediate spread is a one-off; keeping an instalment count on it would show a
  // schedule nothing runs.
  const effectiveInstalments = staggered ? Number(instalments) || 1 : 1;

  const { legs, errors } = useMemo(
    () =>
      buildSpreadPlan({
        total: Number(total),
        instalments: effectiveInstalments,
        funds: picked,
      }),
    [total, effectiveInstalments, picked]
  );

  const dates = useMemo(
    () => (staggered ? instalmentDates(startDate, effectiveInstalments, frequency) : [startDate]),
    [staggered, startDate, effectiveInstalments, frequency]
  );

  const addFund = (fund) => {
    if (!fund?.scheme_bse_code) return;
    if (picked.some((p) => p.scheme_code === fund.scheme_bse_code)) {
      toastError("That fund is already in the plan.");
      return;
    }
    // Split the remaining allocation evenly so the form starts valid rather than at 0%.
    const next = [
      ...picked,
      {
        scheme_code: fund.scheme_bse_code,
        name: fund.name,
        min_amount: Number(fund.minimum_purchase_amount || fund.min_amount || 0),
        percent: 0,
      },
    ];
    setPicked(evenSplit(next));
    setFundQuery("");
  };

  const removeFund = (code) => setPicked(evenSplit(picked.filter((p) => p.scheme_code !== code)));

  const setPercent = (code, value) =>
    setPicked(picked.map((p) => (p.scheme_code === code ? { ...p, percent: Number(value) } : p)));

  const submit = async () => {
    const ready = validateInvestorReady(investorData);
    if (ready) return toastError(ready);
    if (errors.length) return toastError(errors[0]);
    if (staggered && !source) return toastError("Choose the holding the money should transfer out of.");

    setSubmitting(true);
    try {
      // 1. The server computes and stores the split. Its amounts are the ones used below.
      const created = await postApiWithToken(`${import.meta.env.VITE_URL}/spreads`, {
        name: name || null,
        total_amount: Number(total),
        mode,
        instalments: effectiveInstalments,
        frequency,
        start_date: startDate,
        source_scheme: staggered ? source.scheme_bse_code : null,
        source_scheme_name: staggered ? source.scheme_name : null,
        funds: picked.map((p) => ({
          scheme_code: p.scheme_code,
          scheme_name: p.name,
          percent: p.percent,
          min_amount: p.min_amount,
        })),
      });

      const plan = created?.data;
      if (!plan?.id) throw new Error(created?.message || "Could not create the spread plan.");

      // 2. Place each leg. A leg that fails is recorded and the rest still go — one
      //    rejected fund should not cost the investor the whole plan.
      let placed = 0;
      for (const leg of plan.legs) {
        try {
          const res = staggered
            ? await postApiWithToken(
                nodeUrl(import.meta.env.VITE_XSP_REGISTER || "/xspRegister"),
                buildSxpIntent({
                  type: "stp",
                  source,
                  destCode: leg.scheme_code,
                  amount: leg.per_instalment,
                  schedule: {
                    freq: frequency,
                    day: Number(startDate.slice(8, 10)),
                    startDate,
                    endDate: dates[dates.length - 1],
                  },
                  acknowledged: disc.acked,
                })
              )
            : await postApiWithToken(
                nodeUrl(import.meta.env.VITE_FUND_ORDER_PLACE || "/purchaseNewOrder"),
                lumpsumPayload(leg, investorData, disc.acked)
              );

          const ok = res?.status === 200 || res?.status === true || res?.status === "success";
          const reference = res?.data?.items?.[0]?.id || res?.data?.id || null;

          await postApiWithToken(`${import.meta.env.VITE_URL}/spreads/${plan.id}/legs/${leg.id}`, {
            status: ok ? "placed" : "failed",
            reference: ok ? String(reference || "") : null,
            error: ok ? null : String(res?.message || res?.error || "Rejected").slice(0, 500),
          });
          if (ok) placed += 1;
        } catch (e) {
          await postApiWithToken(`${import.meta.env.VITE_URL}/spreads/${plan.id}/legs/${leg.id}`, {
            status: "failed",
            error: String(e?.response?.data?.message || e?.message || "Failed").slice(0, 500),
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["bsePortfolio"] });
      refetchSpreads();

      if (placed === plan.legs.length) {
        toastSuccess(
          staggered
            ? "Spread registered. BSE will run the transfers on schedule."
            : "Spread placed. Complete the payment for each order from Orders."
        );
        setPicked([]);
        setTotal("");
        if (!staggered) navigate("/user/order/mutual-funds");
      } else if (placed > 0) {
        toastError(`${placed} of ${plan.legs.length} legs went through. Open the plan below to see which failed.`);
      } else {
        toastError("No leg could be placed. Open the plan below for the reason on each.");
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e?.message || "Could not create the spread.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    try {
      const res = await deleteApiWithToken(`${import.meta.env.VITE_URL}/spreads/${id}`);
      toastSuccess(res?.message || "Spread cancelled.");
      refetchSpreads();
    } catch (e) {
      toastError(e?.message || "Could not cancel the spread.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-[var(--text-primary)]">Spread a lump sum</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            Split one amount across several funds — and, if you want, across several months
            instead of all at once.
          </p>
        </header>

        <section className="rounded-2xl bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Plan name (optional)</span>
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bonus deployment" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total amount</span>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={total}
                onChange={(e) => setTotal(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="500000"
              />
            </label>
          </div>

          {/* The two modes are different instructions, not a display preference — say what
              each one actually does before it is chosen. */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                value: "staggered",
                title: "Over time",
                body: "Transfer out of a fund you already hold, in instalments. BSE runs the schedule.",
              },
              {
                value: "immediate",
                title: "All at once",
                body: "One purchase per fund, today. Each order is paid for separately.",
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`text-left rounded-xl border p-3 transition ${
                  mode === opt.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-[var(--border-color)]"
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">{opt.title}</div>
                <div className="text-[11px] mt-1 text-gray-500 dark:text-[var(--text-secondary)]">{opt.body}</div>
              </button>
            ))}
          </div>

          {staggered && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Transfer out of</span>
                <Combo
                  id="spread-source"
                  value={srcText}
                  onChange={setSrcText}
                  options={holdings.map((h, i) => ({
                    key: `${h.scheme_bse_code}-${h.folio}-${i}`,
                    label: holdingLabel(h),
                  }))}
                  placeholder={holdings.length ? "Pick a holding" : "No holdings to transfer from"}
                />
                {!holdings.length && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    An instalment plan moves money out of units you already own. Buy into a
                    liquid fund first, then come back once it is allotted — or choose
                    “All at once” above.
                  </p>
                )}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Instalments</span>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={instalments}
                  onChange={(e) => setInstalments(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Frequency</span>
                <select className={fieldClass} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {FREQ.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">First instalment</span>
                <input type="date" className={fieldClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">Funds</h2>
            <span className="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
              Allocations must total 100%
            </span>
          </div>

          <Combo
            id="spread-add-fund"
            value={fundQuery}
            onChange={(v) => {
              setFundQuery(v);
              const hit = allFunds.find((f) => f.name === v);
              if (hit) addFund(hit);
            }}
            options={allFunds.map((f) => ({
              key: f.scheme_bse_code || f.scheme_isin,
              label: f.name,
            }))}
            placeholder="Search a fund to add"
          />

          {picked.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">No funds added yet.</p>
          ) : (
            <div className="space-y-2">
              {legs.map((leg) => (
                <div
                  key={leg.scheme_code}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-[var(--border-color)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-[var(--text-primary)]">{leg.name}</div>
                    <div className="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
                      {money(leg.amount)}
                      {effectiveInstalments > 1 && <> · {money(leg.perInstalment)} × {effectiveInstalments}</>}
                      {leg.min_amount > 0 && <> · min {money(leg.min_amount)}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      className="w-20 rounded-lg border border-gray-200 dark:border-[var(--border-color)] bg-transparent px-2 py-1 text-sm text-right dark:text-white"
                      inputMode="decimal"
                      value={leg.percent}
                      onChange={(e) => setPercent(leg.scheme_code, e.target.value.replace(/[^\d.]/g, ""))}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFund(leg.scheme_code)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {staggered && picked.length > 0 && errors.length === 0 && (
            <p className="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
              First transfer {dates[0]}, last {dates[dates.length - 1]}.
            </p>
          )}

          <OrderDisclaimers {...disc} />

          <button
            type="button"
            disabled={submitting || errors.length > 0 || !picked.length}
            onClick={submit}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Placing…" : staggered ? "Register the spread" : "Place the orders"}
          </button>
        </section>

        {spreads.length > 0 && (
          <section className="rounded-2xl bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">Your spread plans</h2>
            <div className="space-y-3">
              {spreads.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-200 dark:border-[var(--border-color)] p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)]">
                      {s.name || "Spread"} · {money(s.total_amount)}
                    </div>
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">{s.status}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
                    {s.legs.length} fund(s) · {s.placed} placed
                    {s.failed > 0 && <span className="text-red-500"> · {s.failed} failed</span>}
                    {s.instalments > 1 && <> · {s.instalments} instalments</>}
                  </div>
                  {s.legs.some((l) => l.error) && (
                    <ul className="mt-2 space-y-0.5 text-[11px] text-red-600 dark:text-red-400">
                      {s.legs.filter((l) => l.error).map((l) => (
                        <li key={l.id}>{l.scheme_name || l.scheme_code}: {l.error}</li>
                      ))}
                    </ul>
                  )}
                  {s.status !== "cancelled" && (
                    <button onClick={() => cancel(s.id)} className="mt-2 text-xs text-red-500 hover:underline">
                      Cancel plan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** Spread the allocation evenly, with the remainder on the first fund so it totals 100. */
function evenSplit(funds) {
  if (!funds.length) return funds;
  const each = Math.floor((100 / funds.length) * 100) / 100;
  return funds.map((f, i) => ({
    ...f,
    percent: i === 0 ? Math.round((100 - each * (funds.length - 1)) * 100) / 100 : each,
  }));
}

/** The same purchase payload the single-fund invest page sends, one leg at a time. */
function lumpsumPayload(leg, investorData, acknowledged) {
  return {
    data: {
      orders: [
        {
          type: "p",
          mem_ord_ref_id: generateOrderRefId(),
          investor: { ucc: investorData?.kyc?.ucc_code },
          member: "91010",
          scheme: leg.scheme_code,
          amount: Number(leg.per_instalment),
          cur: "INR",
          is_units: false,
          all_units: false,
          min_redeem_flag: false,
          folio: "",
          is_fresh: true,
          phys_or_demat: "d",
          holder: [{ holder_rank: "1", email: investorData?.email || "" }],
          kyc_passed: true,
          dpc: true,
          email: investorData?.email || "",
        },
      ],
      acknowledged,
    },
  };
}
