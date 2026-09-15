// The SIP date rules, kept out of the page so they can be checked directly.
//
// BSE requires start_date's day-of-month to equal txn_date — anything else is
// `invalid_txn_date` (msgid 3809), which is exactly what the form used to send: SIP date
// "5th" alongside a start date of the 10th. Everything here exists to keep the two in step
// and inside the set of days the scheme itself accepts.

// Only used until the scheme's own dates arrive, and when BSE did not publish any for the
// chosen frequency. BSE's SIP dates never go past 28 — not every month has a 29th.
export const FALLBACK_SIP_DAYS = [1, 5, 10, 15, 20, 25, 28];

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const ordinal = (d) =>
  `${d}${d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th"}`;

/**
 * Next occurrence of `day` strictly after `from`, so the first installment is never dated
 * in the past. There is no minimum notice period — verified that a start one day out
 * registers fine — so the nearest valid date is the right answer.
 */
export const nextOccurrence = (day, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), day);
  if (d <= from) d.setMonth(d.getMonth() + 1);
  return iso(d);
};

/**
 * The days this scheme actually accepts for the chosen frequency.
 *
 * BSE publishes them per frequency inside systematic[] (scheme_sxp_frequency_values), and
 * the Node backend hands the whole rulebook over on /scheme-details. Offering the same
 * seven days on every fund is how an order reaches BSE and comes back `invalid_txn_date`.
 * BSE's own frequency names are Daily/Weekly/Monthly/Quarterly, so the first letter maps
 * cleanly onto the d/w/m/q this form already speaks.
 *
 * A frequency BSE closed for registration is skipped, and so is any day past the 28th.
 */
export const allowedDays = (sipTxn, freq) => {
  const row = (sipTxn?.frequencies || []).find(
    (f) => String(f.frequency || "").trim().toLowerCase().startsWith(freq) && f.registrationAllowed !== false
  );
  const days = [...new Set((row?.dates || []).map(Number))]
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 28)
    .sort((a, b) => a - b);
  return days.length ? days : FALLBACK_SIP_DAYS;
};

/**
 * The default SIP date: whichever allowed day comes round soonest.
 *
 * ponytail: nearest-upcoming is the whole rule. BSE enforces no notice period, so there is
 * nothing to pad for. If the business later wants a lead time for the NACH mandate, pass a
 * later `from` — every caller already goes through this function.
 */
export const smartDefaultDay = (days = FALLBACK_SIP_DAYS, from = new Date()) => {
  const list = days.length ? days : FALLBACK_SIP_DAYS;
  return list.reduce((best, d) =>
    Date.parse(nextOccurrence(d, from)) < Date.parse(nextOccurrence(best, from)) ? d : best
  );
};
