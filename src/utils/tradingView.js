/** NSE symbol for TradingView, e.g. "hdfcbank" → "NSE:HDFCBANK" */
export function normalizeTvSymbol(input) {
  if (!input) return "";
  const raw = String(input).trim().toUpperCase();
  if (raw.includes(":")) return raw;
  const sym = raw.replace(/[^A-Z0-9&]/g, "");
  return sym ? `NSE:${sym}` : "";
}

/** Same URL pattern as tradingview.com/chart/?symbol=NSE%3AHDFCBANK */
export function tradingViewChartUrl(symbol) {
  const sym = normalizeTvSymbol(symbol);
  if (!sym) return "https://www.tradingview.com/chart/";
  const params = new URLSearchParams({
    symbol: sym,
    utm_source: "wealthcrop",
    utm_medium: "widget",
    utm_campaign: "chart",
    utm_term: sym,
  });
  return `https://www.tradingview.com/chart/?${params.toString()}`;
}
