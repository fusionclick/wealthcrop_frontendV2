import { flowsFromOrders, xirr } from "./xirr.js";

/**
 * Audit #54 — portfolio views that span funds AND stocks, at market value.
 *
 * The dashboard's allocation used to bucket funds by category on the amount INVESTED and
 * left stocks out entirely, so a portfolio that was half equity shares read as all funds,
 * and a fund that had doubled weighed the same as the day it was bought.
 */

// Order matters: the narrow buckets are tested before the broad ones ("Gold ETF FoF" is gold,
// not "other"; "Liquid" is cash, not "debt").
const CASH = /liquid|overnight|money\s*market/i;
const GOLD = /gold|silver|precious/i;
const DEBT = /debt|duration|gilt|bond|credit|banking\s*(?:and|&)\s*psu|floater|income|conservative\s*hybrid|target\s*maturity|fixed\s*maturity/i;
const OTHER = /international|global|overseas|fund\s*of\s*funds|\bfof\b|multi\s*asset|balanced\s*advantage|dynamic\s*asset|arbitrage/i;
const EQUITY = /equity|elss|tax\s*saver|index|flexi|large|mid|small|multi\s*cap|value|focus|dividend\s*yield|contra|sector|thematic|aggressive\s*hybrid/i;

export const ALLOCATION_ORDER = ["Equity (stocks)", "Equity funds", "Debt", "Gold", "Cash", "Other"];

/** Which allocation bucket a fund falls in, from its category (and name, if that is all we have). */
export const fundBucket = (category = "", name = "") => {
  const text = `${category || ""} ${category ? "" : name || ""}`;
  if (CASH.test(text)) return "Cash";
  if (GOLD.test(text)) return "Gold";
  if (OTHER.test(text)) return "Other";
  if (DEBT.test(text)) return "Debt";
  if (EQUITY.test(text)) return "Equity funds";
  return "Other";
};

/** What a fund holding is worth now; one the feed could not price stays at cost, never 0. */
export const fundValue = (f) => Number(f?.current_value) || Number(f?.inv_amo) || 0;

export const stockValue = (s) => (Number(s?.qty) || 0) * (Number(s?.ltp) || 0);

/**
 * [{ name, value, pct }] in ALLOCATION_ORDER, empty buckets left out.
 * @param funds rows from mergePortfolio (scheme_category, current_value, inv_amo)
 * @param stocks rows from /portfolio/stocks/holdings (qty, ltp)
 */
export function allocationByMarketValue(funds = [], stocks = []) {
  const by = {};
  for (const f of funds) {
    const v = fundValue(f);
    if (v > 0) {
      const bucket = fundBucket(f.scheme_category || f.category, f.scheme_name);
      by[bucket] = (by[bucket] || 0) + v;
    }
  }
  for (const s of stocks) {
    const v = stockValue(s);
    if (v > 0) by["Equity (stocks)"] = (by["Equity (stocks)"] || 0) + v;
  }
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  return ALLOCATION_ORDER.filter((name) => by[name] > 0).map((name) => ({
    name,
    value: by[name],
    pct: total > 0 ? (by[name] / total) * 100 : 0,
  }));
}

/** The index close on the date, or the last one before it (a holiday, a weekend). */
const closeOn = (candles, date) => {
  const t = date.getTime() / 1000 + 86399; // any close stamped during that day counts
  let lo = 0;
  let hi = candles.length - 1;
  let hit = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time <= t) {
      hit = candles[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return hit?.close > 0 ? hit.close : null;
};

/**
 * Audit #54 — the portfolio against the Nifty 50 over the same period, the fair way: the
 * investor's own cash flows, on their own dates, put into the index instead. Each purchase
 * buys index units at that day's close, each redemption sells them, and what is left is valued
 * at the latest close. The XIRR of that is what the same money would have earned in the index
 * — comparable with the portfolio XIRR because the timing is identical.
 *
 * @param orders /orderHistory rows (the same ones portfolioXirr uses)
 * @param candles /market/chart/NIFTY rows: [{ time (unix s), close }], oldest first
 * @returns {{ xirr: number, from: Date, to: Date } | null} null when the history cannot say
 */
export function benchmarkXirr(orders = [], candles = []) {
  const rows = (candles || []).filter((c) => c?.close > 0 && Number.isFinite(c?.time)).sort((a, b) => a.time - b.time);
  const flows = flowsFromOrders(orders).sort((a, b) => a.date - b.date);
  if (!rows.length || !flows.length) return null;
  // The index history has to reach back to the first cash flow, or the comparison is not
  // over the same period.
  if (flows[0].date.getTime() / 1000 < rows[0].time - 7 * 86400) return null;

  let units = 0;
  for (const f of flows) {
    const close = closeOn(rows, f.date);
    if (!close) return null;
    units += -f.amount / close; // a purchase (negative flow) buys units, a redemption sells them
    if (units < -1e-9) return null; // sold more than was ever bought: not comparable
  }

  const last = rows[rows.length - 1];
  const to = new Date(last.time * 1000);
  const rate = xirr([...flows, { date: to, amount: units * last.close }]);
  return rate == null ? null : { xirr: rate, from: flows[0].date, to };
}
