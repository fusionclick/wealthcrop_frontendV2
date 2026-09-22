// XIRR — the money-weighted return of a set of dated cash flows.
//
// What was here before (`calcXirr` in nodeApi.js) was not XIRR at all: it divided total
// gain by total invested and called the result annualised. That answer ignores WHEN money
// went in, so ₹1L that doubled in six months and ₹1L that doubled in six years both read
// 100%. For a portfolio built out of monthly SIP instalments — which is the whole product
// — it is wrong by a factor of roughly two, always in the flattering direction.
//
// The convention below is the spreadsheet one (Excel's XIRR, and every CAS statement):
//   money leaving the investor  -> negative  (purchase, SIP instalment, switch-in)
//   money coming back           -> positive  (redemption, switch-out, IDCW payout)
//   what the units are worth today -> one final positive flow dated today.

const DAY = 86400000;
const YEAR = 365;

/** BSE sends dd-mm-yyyy on some endpoints and ISO on others; `new Date(s)` reads
 *  03-04-2026 as March in one browser and April in the next. Parse the shape. */
export const parseFlowDate = (v) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v || "").trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dmy = /^(\d{2})[-/](\d{2})[-/](\d{4})/.exec(s);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t) : null;
};

/** Net present value of `flows` at annual rate `r`, discounted in days from the first flow. */
const npv = (flows, r) => {
  const t0 = flows[0].date.getTime();
  let sum = 0;
  for (const f of flows) {
    const years = (f.date.getTime() - t0) / (DAY * YEAR);
    sum += f.amount / Math.pow(1 + r, years);
  }
  return sum;
};

/**
 * The rate at which these flows net to zero, as a percentage per annum, or null.
 *
 * ponytail: bisection, not Newton-Raphson. Newton is faster but diverges on the flow shape
 * this product produces most — many small negatives and one large positive — and a wrong
 * XIRR printed confidently is worse than none. A hundred halvings of [-99.99%, +1000%]
 * is exact to ~1e-27 and still runs in microseconds on a portfolio's worth of flows.
 *
 * null (never 0, never NaN) when the flows cannot produce a rate: fewer than two of them,
 * all one sign, or a root outside that bracket — a portfolio down more than 99.99% a year
 * or up more than tenfold. The caller shows "—", it does not print a made-up number.
 */
export const xirr = (flows = []) => {
  const rows = flows
    .filter((f) => f?.date instanceof Date && !Number.isNaN(f.date.getTime()) && Number.isFinite(f.amount) && f.amount !== 0)
    .sort((a, b) => a.date - b.date);
  if (rows.length < 2) return null;
  if (!rows.some((f) => f.amount < 0) || !rows.some((f) => f.amount > 0)) return null;
  // Every flow on one day: there is no time for a rate to act over.
  if (rows[rows.length - 1].date.getTime() === rows[0].date.getTime()) return null;

  let lo = -0.9999;
  let hi = 10;
  let fLo = npv(rows, lo);
  let fHi = npv(rows, hi);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(rows, mid);
    if (!Number.isFinite(fMid)) return null;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return ((lo + hi) / 2) * 100;
};

// BSE's trxn_type across order_list: purchases and switch-ins take money in, redemptions
// and switch-outs hand it back. Anything else (an IDCW payout row, a mandate registration)
// is left out rather than guessed at — a misclassified sign silently ruins the rate.
const OUTFLOW = /purchase|buy|sip|invest|switch[\s_-]*in|stp[\s_-]*in|additional/i;
const INFLOW = /redeem|redemption|sell|withdraw|swp|switch[\s_-]*out|stp[\s_-]*out|payout|dividend|idcw/i;

// Only orders BSE actually put through. A rejected purchase never left the bank account
// and a pending one has not yet; counting either invents a cash flow.
//
// ACCEPTED belongs in here. getClientPortfolio already treats it as a holding — its HELD
// set is ALLOTTED / ACCEPTED / PAID — so leaving it out meant the portfolio showed the
// units while XIRR refused the money that bought them, and an account whose orders are all
// ACCEPTED got a blank rate next to a populated holdings list. Both sides have to agree on
// what "settled" means.
// Exported because the capital-gains report matches lots off the same order rows: two
// definitions of "settled" would mean XIRR and the tax report counting different orders.
export const SETTLED = /allot|accept|success|complet|paid|executed?/i;

/**
 * BSE reports the transaction as a CODE, not a word.
 *
 * `order_list` sends `trxn_type: "p"` / `"r"` / `"sw"` — the same three this app sends when
 * it places an order (see order.js ALLOWED_TYPES). The word patterns above never matched a
 * bare letter, so every single flow scored 0 and was dropped: an account with a full order
 * history and a correct P&L still rendered XIRR as "—", because there were no cash flows
 * left to run a rate over.
 *
 * "sw" is deliberately absent. A switch moves money between schemes without any leaving the
 * portfolio, and the code alone does not say which leg this row is, so counting it either
 * way would invent a flow. Unclassified is the honest answer, and the word patterns still
 * catch "switch in"/"switch out" when BSE spells them out.
 */
const TRXN_CODE = new Map([
  ["p", -1], // purchase — money leaves the investor
  ["r", 1], // redemption — money comes back
]);

export const classifyFlow = (order) => {
  for (const raw of [order?.type, order?.trxn_type, order?.order_type]) {
    const code = String(raw ?? "").trim().toLowerCase();
    if (TRXN_CODE.has(code)) return TRXN_CODE.get(code);
  }
  const type = `${order?.type || ""} ${order?.trxn_type || ""} ${order?.order_type || ""}`;
  if (INFLOW.test(type)) return 1;
  if (OUTFLOW.test(type)) return -1;
  return 0;
};

/**
 * Turn `/orderHistory` rows into signed, dated cash flows and cap them with today's value.
 *
 * `currentValue` is what the units are worth right now — the final valuation the ticket
 * calls for. Pass 0 for a position fully redeemed; pass nothing and you get the flows
 * alone, which on their own will not produce a rate.
 */
export const flowsFromOrders = (orders = [], currentValue = null, asOf = new Date()) => {
  const flows = [];
  for (const o of orders) {
    if (!SETTLED.test(String(o?.status || ""))) continue;
    const sign = classifyFlow(o);
    if (!sign) continue;
    const date = parseFlowDate(o.date);
    const amount = Math.abs(Number(o.amount) || 0);
    if (!date || !amount) continue;
    flows.push({ date, amount: sign * amount, type: o.type || "", scheme: o.scheme_bse_code || "" });
  }
  if (currentValue != null && Number(currentValue) > 0) {
    flows.push({ date: asOf instanceof Date ? asOf : new Date(asOf), amount: Number(currentValue), type: "VALUATION" });
  }
  return flows;
};

/** Portfolio XIRR (ticket 15): every settled order on the account, capped by today's value. */
export const portfolioXirr = (orders = [], currentValue = null, asOf = new Date()) =>
  xirr(flowsFromOrders(orders, currentValue, asOf));

/**
 * SIP XIRR (ticket 14): the same engine, narrowed to one scheme's instalments.
 *
 * Narrowed by scheme rather than by SIP registration number, because BSE's order_list does
 * not carry the reg_no that getAllXsp does — so "this scheme's instalments" is the finest
 * cut the data supports. A second SIP into the same scheme folds into the same rate, which
 * is the honest answer here, not a wrong one.
 */
export const sipXirr = (orders = [], schemeCode, currentValue = null, asOf = new Date()) => {
  const want = String(schemeCode || "").trim().toUpperCase();
  if (!want) return null;
  const mine = orders.filter((o) => String(o?.scheme_bse_code || "").trim().toUpperCase() === want);
  return xirr(flowsFromOrders(mine, currentValue, asOf));
};
