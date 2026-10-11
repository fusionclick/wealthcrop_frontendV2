const istDay = (sec) => new Date(sec * 1000 + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Reconcile the latest candle with the header's quote session, even on a weekend.
export function quoteCandle(last, quote) {
  const price = Number(quote?.lastPrice);
  const time = Number(quote?.lastTradeTime);
  if (!last || !Number.isFinite(price) || price <= 0 || !Number.isFinite(time) || time <= 0) return null;
  const day = istDay(time);
  const lastDay = istDay(last.time);
  if (day < lastDay) return null;
  const sameSession = day === lastDay;
  const open = Number(quote.open) || (sameSession ? last.open : price);
  return {
    time: sameSession ? last.time : Date.parse(`${day}T09:15:00+05:30`) / 1000,
    open,
    high: Math.max(Number(quote.intraDayHighLow?.max) || (sameSession ? last.high : open), open, price),
    low: Math.min(Number(quote.intraDayHighLow?.min) || (sameSession ? last.low : open), open, price),
    close: price,
  };
}
