/**
 * FR 5.2 — "Interactive historical price charts should support zoom, scroll, technical
 * indicator overlays. Examples: moving averages, RSI."
 *
 * Pure functions over an OHLC series, so the maths can be tested without a chart. Every
 * one of them returns points only from the bar where the indicator is actually defined:
 * an SMA(20) has no value on day 3, and emitting a partial average there draws a line
 * that looks like real support and is not.
 */

const closes = (bars) => bars.map((b) => Number(b.close)).filter((n) => Number.isFinite(n));

/** Simple moving average. First value lands on bar `period - 1`. */
export function sma(bars, period = 20) {
  if (!Array.isArray(bars) || period < 1 || bars.length < period) return [];

  const out = [];
  let running = 0;

  for (let i = 0; i < bars.length; i += 1) {
    running += Number(bars[i].close) || 0;
    if (i >= period) running -= Number(bars[i - period].close) || 0;
    if (i >= period - 1) out.push({ time: bars[i].time, value: running / period });
  }

  return out;
}

/**
 * Exponential moving average, seeded with the SMA of the first `period` bars.
 *
 * Seeding with the first close instead is the common shortcut and it leaves the line
 * visibly wrong for the first few dozen bars on a volatile stock.
 */
export function ema(bars, period = 20) {
  if (!Array.isArray(bars) || period < 1 || bars.length < period) return [];

  const k = 2 / (period + 1);
  const first = bars.slice(0, period).reduce((s, b) => s + (Number(b.close) || 0), 0) / period;

  const out = [{ time: bars[period - 1].time, value: first }];
  let prev = first;

  for (let i = period; i < bars.length; i += 1) {
    prev = (Number(bars[i].close) || 0) * k + prev * (1 - k);
    out.push({ time: bars[i].time, value: prev });
  }

  return out;
}

/**
 * Relative Strength Index, Wilder's method.
 *
 * Wilder's smoothing (prev * (n-1) + current) / n, NOT a rolling simple average of the
 * last n gains. They are different indicators and only the first one is what every chart
 * package, and every trader reading this screen, calls "RSI 14".
 *
 * Returns values in 0..100. A period of all-gains gives exactly 100, all-losses 0.
 */
export function rsi(bars, period = 14) {
  if (!Array.isArray(bars) || bars.length < period + 1) return [];

  const price = closes(bars);
  if (price.length < period + 1) return [];

  let gain = 0;
  let loss = 0;

  // Seed: the plain average of the first `period` changes.
  for (let i = 1; i <= period; i += 1) {
    const change = price[i] - price[i - 1];
    if (change >= 0) gain += change;
    else loss -= change;
  }
  gain /= period;
  loss /= period;

  const value = () => (loss === 0 ? 100 : gain === 0 ? 0 : 100 - 100 / (1 + gain / loss));
  const out = [{ time: bars[period].time, value: value() }];

  for (let i = period + 1; i < price.length; i += 1) {
    const change = price[i] - price[i - 1];
    gain = (gain * (period - 1) + Math.max(change, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-change, 0)) / period;
    out.push({ time: bars[i].time, value: value() });
  }

  return out;
}

/**
 * Bollinger bands: an SMA with ±k population standard deviations around it.
 *
 * Population, not sample: the window IS the data, so dividing by n rather than n−1 is
 * what every charting package does and what the bands are defined as.
 */
export function bollinger(bars, period = 20, k = 2) {
  if (!Array.isArray(bars) || bars.length < period) return { upper: [], middle: [], lower: [] };

  const middle = sma(bars, period);
  const upper = [];
  const lower = [];

  for (let i = period - 1; i < bars.length; i += 1) {
    const window = bars.slice(i - period + 1, i + 1).map((b) => Number(b.close) || 0);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);

    upper.push({ time: bars[i].time, value: mean + k * sd });
    lower.push({ time: bars[i].time, value: mean - k * sd });
  }

  return { upper, middle, lower };
}

/**
 * The indicators offered on the chart.
 *
 * `pane: "price"` draws on the price scale; `pane: "lower"` gets its own scale, because an
 * oscillator bounded 0..100 plotted against a ₹2,400 share price is a flat line at the
 * bottom of the chart.
 */
export const INDICATORS = [
  { key: "sma20", label: "MA 20", pane: "price", colour: "#2563eb", compute: (b) => sma(b, 20) },
  { key: "sma50", label: "MA 50", pane: "price", colour: "#f59e0b", compute: (b) => sma(b, 50) },
  { key: "ema20", label: "EMA 20", pane: "price", colour: "#8b5cf6", compute: (b) => ema(b, 20) },
  { key: "rsi14", label: "RSI 14", pane: "lower", colour: "#db2777", compute: (b) => rsi(b, 14) },
];
