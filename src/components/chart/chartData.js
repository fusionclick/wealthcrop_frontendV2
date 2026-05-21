// Generate random but realistic candle data
function generateCandles(startTimestamp, count, intervalDays = 1) {
  const candles = [];
  let lastClose = 150 + Math.random() * 20; // base price

  for (let i = 0; i < count; i++) {
    const timestamp = startTimestamp + i * intervalDays * 24 * 60 * 60 * 1000;

    const open = lastClose;
    const high = open + Math.random() * 5;
    const low = open - Math.random() * 5;
    const close = low + Math.random() * (high - low);

    lastClose = close;

    candles.push({
      timestamp,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(500000 + Math.random() * 1500000),
    });
  }

  return candles;
}

// TODAY as reference
const NOW = Date.now();

// 1 Day → 100 candles (intraday or daily)
export const data_1D = generateCandles(NOW - 100 * 86400000, 100, 1);

// 1 Week → 10 candles
export const data_1W = generateCandles(NOW - 100 * 86400000, 100, 1);

// 1 Month → 30 candles
export const data_1M = generateCandles(NOW - 90 * 86400000, 90, 1);

// 3 Month → 90 candles
export const data_3M = generateCandles(NOW - 90 * 86400000, 90, 1);

// 6 Month → 180 candles
export const data_6M = generateCandles(NOW - 180 * 86400000, 180, 1);

// 1 Year → 365 candles
export const data_1Y = generateCandles(NOW - 365 * 86400000, 365, 1);

// 3 Year → monthly candles (36 candles)
export const data_3Y = generateCandles(NOW - 260 * 30 * 86400000, 260, 30);

// 5 Year → monthly candles (60 candles)
export const data_5Y = generateCandles(NOW - 60 * 30 * 86400000, 60, 30);

// 10 Year → 15-day candles (~240 candles)
export const data_10Y = generateCandles(NOW - 240 * 15 * 86400000, 240, 15);

// All → combine everything
export const data_All = [
  ...data_10Y,
  ...data_5Y,
  ...data_3Y,
  ...data_1Y,
  ...data_6M,
  ...data_3M,
  ...data_1M,
  ...data_1W,
  ...data_1D,
];
