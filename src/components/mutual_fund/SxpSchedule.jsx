import { useEffect, useMemo, useState } from "react";
import { postApi } from "../../api/api";
import { nodeUrl } from "../../utils/nodeApi";
import {
  allowedDays,
  FALLBACK_SIP_DAYS,
  installmentCount,
  iso,
  nextOccurrence,
  ordinal,
  smartDefaultDay,
} from "../../utils/sipDates";
import { SXP_BUCKET, SXP_LABEL } from "../../utils/sxp";

/**
 * The "repeat this" half of a withdrawal or a transfer — tickets 17 and 18.
 *
 * Same shape as useDisclaimers/OrderDisclaimers next door: a hook holding the state and a
 * component rendering it, so RedeemMF and SwitchMF each gain a schedule without either of
 * them learning how BSE's date rules work.
 *
 * The rules themselves are the SIP page's, unchanged: BSE ties start_date's day-of-month to
 * txn_date (msgid 3809) and publishes the days it accepts per frequency, per scheme. What
 * differs is only which rulebook to read — an SWP's own, or the source scheme's STP-OUT.
 */
export function useSxpSchedule(type, source) {
  const [on, setOn] = useState(false);
  const [details, setDetails] = useState(null);
  const isin = source?.scheme_isin || "";
  const code = source?.scheme_bse_code || source?.scheme_code || "";

  // Only once the investor asks to repeat it. A one-off redemption should not pay for a
  // /scheme-details round trip it never reads.
  useEffect(() => {
    if (!on || (!isin && !code)) return;
    let live = true;
    postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), {
      isin,
      scheme_code: code,
    })
      .then((res) => live && setDetails(res?.data?.scheme_info || null))
      .catch(() => live && setDetails(null));
    return () => {
      live = false;
    };
  }, [on, isin, code]);

  const txn = details?.transactions?.[SXP_BUCKET[type]] || null;

  const [freq, setFreq] = useState("m");
  const days = useMemo(() => allowedDays(txn, freq), [txn, freq]);
  const [day, setDay] = useState(() => smartDefaultDay(FALLBACK_SIP_DAYS));
  const [startDate, setStartDate] = useState(() => nextOccurrence(smartDefaultDay(FALLBACK_SIP_DAYS)));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(nextOccurrence(smartDefaultDay(FALLBACK_SIP_DAYS)));
    d.setFullYear(d.getFullYear() + 1);
    return iso(d);
  });

  // Once the scheme's real dates arrive, re-pick — but only if the day in hand is not one
  // the scheme accepts, so an investor who already chose a valid date keeps it.
  useEffect(() => {
    if (days.includes(day)) return;
    const next = smartDefaultDay(days);
    setDay(next);
    setStartDate(nextOccurrence(next));
  }, [days, day]);

  // One control drives the other, both ways, so the pair can never be sent out of step.
  const pickDay = (d) => {
    setDay(d);
    setStartDate(nextOccurrence(d));
  };
  const pickStart = (value) => {
    setStartDate(value);
    const d = Number(String(value).slice(8, 10));
    if (d >= 1 && d <= 28) setDay(d);
  };

  const installments = useMemo(
    () => installmentCount(startDate, endDate, freq),
    [startDate, endDate, freq]
  );
  // A native date input cannot be told "only the 7th and the 21st", so a typed-in day that
  // the scheme does not accept is caught here and blocks submit.
  const startDayInvalid = !days.includes(Number(String(startDate).slice(8, 10)));

  return {
    type,
    on,
    setOn,
    txn,
    freq,
    setFreq,
    day,
    pickDay,
    startDate,
    pickStart,
    endDate,
    setEndDate,
    days,
    installments,
    startDayInvalid,
    // BSE's own minimum for this instruction on this scheme, when it published one.
    minAmount: Number(txn?.minAmount) || 0,
    ready: !on || (installments > 0 && !startDayInvalid),
  };
}

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const field =
  "w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]";

export default function SxpSchedule({
  type,
  on,
  setOn,
  txn,
  freq,
  setFreq,
  day,
  pickDay,
  startDate,
  pickStart,
  endDate,
  setEndDate,
  days,
  installments,
  startDayInvalid,
  minAmount,
  amount,
}) {
  const what = SXP_LABEL[type];
  const verb = type === "swp" ? "withdrawal" : "transfer";
  // `allowed` is BSE's word, and null means it never said — only a flat false is a refusal.
  const refused = on && txn && txn.allowed === false;

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-1 w-4 h-4" />
        <span className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
          Repeat this {verb} on a schedule ({what})
          <span className="block text-[11px] text-slate-400">
            {type === "swp"
              ? "A fixed amount leaves this fund on the same date every period."
              : "A fixed amount moves into the destination fund on the same date every period."}
          </span>
        </span>
      </label>

      {refused && (
        <p className="text-xs text-red-500">
          BSE does not accept a {what} on this scheme. The one-off {verb} above still works.
        </p>
      )}

      {on && !refused && (
        <div className="space-y-4 rounded-lg border border-slate-200 dark:border-[var(--border-color)] p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
                Frequency
              </label>
              <select value={freq} onChange={(e) => setFreq(e.target.value)} className={field}>
                <option value="m">Monthly</option>
                <option value="q">Quarterly</option>
                <option value="w">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
                {what} date
              </label>
              <select value={day} onChange={(e) => pickDay(Number(e.target.value))} className={field}>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {ordinal(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                min={iso(new Date(Date.now() + 86400000))}
                onChange={(e) => pickStart(e.target.value)}
                className={field}
              />
              {startDayInvalid && (
                <p className="text-xs text-red-500 mt-1">
                  {Number(String(startDate).slice(8, 10)) > 28
                    ? "Pick a day from the 1st to the 28th — not every month has a 29th."
                    : `This scheme only runs a ${what} on the ${days.map(ordinal).join(", ")}.`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">
                End date
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
            Changing the {what} date moves the start date to the next {ordinal(day)} — BSE requires them to match.
          </p>

          {installments > 0 && (
            <div className="rounded-lg bg-slate-50 dark:bg-[var(--white-5)] p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[var(--text-secondary)]">Installments</span>
                <span className="font-medium text-slate-900 dark:text-[var(--text-primary)]">{installments}</span>
              </div>
              {Number(amount) > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                    Total {type === "swp" ? "withdrawn" : "transferred"} if it runs in full
                  </span>
                  <span className="font-medium text-slate-900 dark:text-[var(--text-primary)]">
                    {money(Number(amount) * installments)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2">
                Each installment only goes through while the folio still holds enough units. You can stop a {what} any
                time.
              </p>
            </div>
          )}

          {minAmount > 0 && (
            <p className={`text-xs ${amount && Number(amount) < minAmount ? "text-red-500" : "text-slate-400"}`}>
              Minimum {what} for this scheme: {money(minAmount)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
