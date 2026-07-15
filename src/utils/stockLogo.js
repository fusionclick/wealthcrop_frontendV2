/** Free NSE logo CDN (tickertape). Falls back via onError in UI. */
export function stockLogoUrl(symbol) {
  const sym = String(symbol || "")
    .trim()
    .toUpperCase()
    .replace(/^NSE:/, "");
  if (!sym) return "/default-stock.png";
  return `https://assets.tickertape.in/stock-logos/${encodeURIComponent(sym)}.png`;
}
