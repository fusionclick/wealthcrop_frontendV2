/**
 * SRS §4 "Spread" — dividing a lump sum into smaller, periodic investments across
 * multiple funds.
 *
 * Two things have to come out exactly right, and both are the kind of thing that looks
 * fine until someone adds up the statement:
 *
 *   1. The per-fund amounts must sum to the lump sum to the paisa. Rounding each share
 *      independently loses or invents money — 100000 split 33/33/34 rounds to 99999.99
 *      and the last instalment gets short-paid.
 *   2. The per-instalment amounts must sum to that fund's share, same reason.
 *
 * Both are solved the same way: round every part down to the paisa, then hand the whole
 * remainder to one part. Largest-remainder, so the adjustment lands where it is least
 * visible in percentage terms.
 */

/** Money is paise. Work in integers and the arithmetic stops drifting. */
const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const toRupees = (paise) => paise / 100;

/**
 * Split `total` into the given percentage weights, exactly.
 *
 * @param {number} total   lump sum in rupees
 * @param {number[]} pcts  percentages, expected to sum to 100
 * @returns {number[]} rupee amounts summing exactly to `total`
 */
export function splitByPercent(total, pcts) {
  const totalPaise = toPaise(total);
  if (!pcts.length || totalPaise <= 0) return pcts.map(() => 0);

  const exact = pcts.map((p) => (totalPaise * Number(p)) / 100);
  const floored = exact.map(Math.floor);
  let remainder = totalPaise - floored.reduce((a, b) => a + b, 0);

  // Largest fractional part first — the standard way to hand out indivisible units
  // without any one share being systematically favoured.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; remainder > 0 && k < order.length; k += 1, remainder -= 1) {
    floored[order[k].i] += 1;
  }

  return floored.map(toRupees);
}

/**
 * Split one fund's share into `count` instalments, exactly.
 *
 * The remainder goes on the FIRST instalment rather than the last: an investor who stops
 * a spread half way should have put in slightly more than plan, not slightly less, and
 * the first one is the only instalment they have certainly seen.
 */
export function splitIntoInstalments(amount, count) {
  const paise = toPaise(amount);
  const n = Math.max(1, Math.floor(count));
  if (paise <= 0) return Array.from({ length: n }, () => 0);

  const base = Math.floor(paise / n);
  const out = Array.from({ length: n }, () => toRupees(base));
  out[0] = toRupees(base + (paise - base * n));
  return out;
}

/**
 * Build the full plan: what goes into each fund, and what each instalment is worth.
 *
 * Returns `{ legs, errors }` rather than throwing, because the form shows every problem
 * at once instead of making the investor discover them one submit at a time.
 *
 * @param {object} p
 * @param {number} p.total       lump sum
 * @param {number} p.instalments how many times to invest (1 = all at once)
 * @param {Array}  p.funds       [{ scheme_code, name, percent, min_amount }]
 */
export function buildSpreadPlan({ total, instalments = 1, funds = [] }) {
  const errors = [];
  const amount = Number(total) || 0;
  const n = Math.max(1, Math.floor(Number(instalments) || 1));

  if (amount <= 0) errors.push("Enter the amount you want to spread.");
  if (!funds.length) errors.push("Add at least one fund.");

  const pctSum = funds.reduce((s, f) => s + (Number(f.percent) || 0), 0);
  // Compared in paise-equivalent units so 33.33 + 33.33 + 33.34 is accepted and
  // 33.3 + 33.3 + 33.3 is not.
  if (funds.length && Math.round(pctSum * 100) !== 10000) {
    errors.push(`Allocations must add up to 100% — they currently add up to ${pctSum.toFixed(2)}%.`);
  }
  if (funds.some((f) => (Number(f.percent) || 0) <= 0)) {
    errors.push("Every fund needs an allocation above 0%.");
  }
  if (new Set(funds.map((f) => f.scheme_code)).size !== funds.length) {
    errors.push("The same fund is listed twice.");
  }

  const shares = splitByPercent(amount, funds.map((f) => f.percent));

  const legs = funds.map((f, i) => {
    const instalmentAmounts = splitIntoInstalments(shares[i], n);
    return {
      ...f,
      amount: shares[i],
      instalments: instalmentAmounts,
      // The instalment is what actually reaches BSE, so it is the figure the scheme
      // minimum applies to — not the fund's total share.
      perInstalment: instalmentAmounts[instalmentAmounts.length - 1],
    };
  });

  legs.forEach((leg) => {
    const min = Number(leg.min_amount) || 0;
    if (min > 0 && leg.perInstalment > 0 && leg.perInstalment < min) {
      errors.push(
        `${leg.name || leg.scheme_code}: each instalment would be ₹${leg.perInstalment.toFixed(2)}, ` +
          `below the fund's ₹${min.toFixed(2)} minimum. Raise the amount, its allocation, or use fewer instalments.`
      );
    }
  });

  return { legs, errors };
}

/**
 * Instalment dates. BSE takes a start date and a frequency and runs the schedule itself,
 * so this exists only to show the investor when the money will move.
 */
export function instalmentDates(startDate, count, freq = "m") {
  const step = { w: 7, m: 1, q: 3 }[freq] ?? 1;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    if (freq === "w") d.setDate(d.getDate() + step * i);
    else d.setMonth(d.getMonth() + step * i);
    return d.toISOString().slice(0, 10);
  });
}
