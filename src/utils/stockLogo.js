image.png/** NSE logos via FMP (Tickertape CDN returns 403). Falls back via onError in UI. */
export function stockLogoUrl(symbol) {
  const sym = String(symbol || "")
    .trim()
    .toUpperCase()
    .replace(/^NSE:/, "")
    .replace(/[^A-Z0-9&]/g, "");
  if (!sym) return "";
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(sym)}.NS.png`;
}
