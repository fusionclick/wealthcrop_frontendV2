/**
 * Audit #53 — what the stock page prints for each fact, and from which field.
 *
 * Three tiles used to print a different number from the one their label names: "EPS (TTM)"
 * showed NSE's sector P/E, "Book Value" showed the day's base price and "Avg Volume (3M)"
 * showed the number of shares issued. Each label is bound to its own field here, once, so
 * the binding can be tested rather than eyeballed. Anything the provider did not send is
 * "—", never 0.
 */
export const DASH = "—";

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

export const fmtNum = (v, digits = 2) =>
  num(v) === null ? DASH : num(v).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtRupee = (v, digits = 2) => (num(v) === null ? DASH : `₹${fmtNum(v, digits)}`);

/** Yahoo sends ratios as fractions: 0.0051 is 0.51%. */
export const fmtPct = (fraction) => (num(fraction) === null ? DASH : `${(num(fraction) * 100).toFixed(2)}%`);

/** Rupees to ₹ crore, the unit Indian statements are read in. */
export const fmtCrore = (v) =>
  num(v) === null ? DASH : `₹${(num(v) / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;

/** A price that is 0 was never quoted. */
export const fmtPrice = (v) => (num(v) > 0 ? fmtRupee(v) : DASH);

export const fmtVolume = (v) => {
  const x = num(v);
  if (!x) return DASH;
  if (x >= 1e7) return `${(x / 1e7).toFixed(2)} Cr`;
  if (x >= 1e5) return `${(x / 1e5).toFixed(2)} L`;
  return x.toLocaleString("en-IN");
};

// Yahoo reports debt/equity as a percentage: 36.65 means 0.37×.
const fmtDebtEquity = (v) => (num(v) === null ? DASH : (num(v) / 100).toFixed(2));

/** The Fundamentals grid. `details` is /market/stock-details, `fin` is /market/fundamentals. */
export function stockFundamentals(details, fin) {
  const s = details?.stats || {};
  const r = fin?.ratios || {};
  return [
    { label: "Market Cap", value: fmtCrore(s.market_cap) },
    { label: "P/E (TTM)", value: fmtNum(s.pe ?? r.pe_trailing) },
    { label: "EPS (TTM)", value: fmtRupee(s.eps ?? r.eps_trailing) },
    { label: "ROE", value: fmtPct(r.return_on_equity) },
    { label: "Debt/Equity", value: fmtDebtEquity(r.debt_to_equity) },
    { label: "Book Value", value: fmtRupee(s.book_value ?? r.book_value) },
    { label: "Dividend Yield", value: fmtPct(s.dividend_yield) },
    { label: "Beta", value: fmtNum(s.beta) },
  ];
}

/** 52-week range, or "—" when either end is unknown. */
export const weekRange = (details) => {
  const lo = num(details?.priceInfo?.weekHighLow?.min);
  const hi = num(details?.priceInfo?.weekHighLow?.max);
  return lo > 0 && hi > 0 ? `${fmtRupee(lo)} – ${fmtRupee(hi)}` : DASH;
};

export const RECOMMENDATION = {
  strong_buy: "Strong buy",
  buy: "Buy",
  hold: "Hold",
  underperform: "Underperform",
  sell: "Sell",
  strong_sell: "Strong sell",
};

/** Statement tables: line key -> label, in the order an annual report prints them. */
export const STATEMENT_LINES = {
  income_statement: [
    ["revenue", "Revenue"],
    ["gross_profit", "Gross profit"],
    ["operating", "Operating income"],
    ["pre_tax", "Profit before tax"],
    ["net_income", "Net income"],
  ],
  balance_sheet: [
    ["total_assets", "Total assets"],
    ["total_liabilities", "Total liabilities"],
    ["equity", "Shareholders' equity"],
    ["cash", "Cash & equivalents"],
    ["long_term_debt", "Long-term debt"],
  ],
  cash_flow: [
    ["operating", "Operating cash flow"],
    ["investing", "Investing cash flow"],
    ["financing", "Financing cash flow"],
    ["capex", "Capital expenditure"],
  ],
};

/** Key ratios: key -> [label, formatter]. */
export const RATIO_LINES = [
  ["pe_trailing", "P/E (trailing)", (v) => `${fmtNum(v)}×`],
  ["pe_forward", "P/E (forward)", (v) => `${fmtNum(v)}×`],
  ["price_to_book", "Price / book", (v) => `${fmtNum(v)}×`],
  ["eps_trailing", "EPS (trailing)", fmtRupee],
  ["book_value", "Book value / share", fmtRupee],
  ["profit_margin", "Net profit margin", fmtPct],
  ["operating_margin", "Operating margin", fmtPct],
  ["return_on_equity", "Return on equity", fmtPct],
  ["debt_to_equity", "Debt / equity", fmtDebtEquity],
  ["current_ratio", "Current ratio", (v) => fmtNum(v)],
  ["revenue_growth", "Revenue growth (YoY)", fmtPct],
  ["earnings_growth", "Earnings growth (YoY)", fmtPct],
];

/** "2026-03-31" -> "Mar 2026": the period end, which for most Indian companies is the FY end. */
export const periodLabel = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(iso || "") : d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};
