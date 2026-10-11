// Client 2026-10-09 — brokerage from the broker's ratecard, which operations keep in
// Admin → Brokerage (GET /brokerage-rates), instead of a rate typed into this file.
//
// A segment's row: percent of the order value and/or a flat fee per order, then a floor
// (min_rupees) and a cap (max_rupees). "₹20 or 0.03%, whichever is lower" is pct 0.03 with a
// ₹20 cap. With no published row the old estimate stands, so the ticket is never blank.
const FALLBACK = { pct_rate: 0.03, flat_rupees: null, min_rupees: null, max_rupees: 20 };

export function brokerageFor(rate, notional) {
  const r = rate || FALLBACK;
  const value = Math.max(0, Number(notional) || 0);
  let fee = (Number(r.pct_rate) || 0) * value / 100 + (Number(r.flat_rupees) || 0);
  if (Number(r.min_rupees) > 0) fee = Math.max(fee, Number(r.min_rupees));
  if (Number(r.max_rupees) > 0) fee = Math.min(fee, Number(r.max_rupees));
  return Math.round(fee * 100) / 100;
}

/** Which ratecard row an equity order uses. */
export const equitySegment = (product) => (String(product).toUpperCase() === "INTRADAY" ? "equity_intraday" : "equity_delivery");
