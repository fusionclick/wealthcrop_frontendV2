import test from "node:test";
import assert from "node:assert/strict";
import { sma, ema, rsi, bollinger, INDICATORS } from "../src/utils/indicators.js";

const bars = (closeList) => closeList.map((close, i) => ({ time: 1700000000 + i * 86400, close }));

test("SMA averages the window and starts where it is first defined", () => {
  const out = sma(bars([1, 2, 3, 4, 5]), 3);
  assert.equal(out.length, 3); // bars 3, 4, 5
  assert.equal(out[0].value, 2); // (1+2+3)/3
  assert.equal(out[2].value, 4); // (3+4+5)/3
});

test("SMA emits nothing before the window is full", () => {
  // A partial average on day 3 of a 20-day MA draws a line that looks like support.
  assert.deepEqual(sma(bars([1, 2, 3]), 20), []);
});

test("the rolling SMA sum does not drift over a long series", () => {
  const prices = Array.from({ length: 500 }, (_, i) => 100 + Math.sin(i / 7) * 10);
  const out = sma(bars(prices), 20);
  const last = out[out.length - 1].value;
  const expected = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  assert.ok(Math.abs(last - expected) < 1e-9, `drifted by ${Math.abs(last - expected)}`);
});

test("EMA is seeded with the SMA, not the first close", () => {
  const out = ema(bars([10, 20, 30, 40, 50]), 3);
  assert.equal(out[0].value, 20); // (10+20+30)/3
});

test("EMA tracks a constant series exactly", () => {
  const out = ema(bars(Array(50).fill(42)), 10);
  assert.ok(out.every((p) => Math.abs(p.value - 42) < 1e-9));
});

test("EMA reacts faster than SMA to a step change", () => {
  const prices = [...Array(30).fill(100), ...Array(10).fill(120)];
  const e = ema(bars(prices), 20).at(-1).value;
  const s = sma(bars(prices), 20).at(-1).value;
  assert.ok(e > s, `EMA ${e} should be above SMA ${s} after a step up`);
});

test("RSI is 100 when every bar rises", () => {
  const out = rsi(bars(Array.from({ length: 30 }, (_, i) => 100 + i)), 14);
  assert.ok(out.length > 0);
  assert.equal(out.at(-1).value, 100);
});

test("RSI is 0 when every bar falls", () => {
  const out = rsi(bars(Array.from({ length: 30 }, (_, i) => 100 - i)), 14);
  assert.equal(out.at(-1).value, 0);
});

test("RSI stays inside 0..100 on noisy data", () => {
  const prices = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i) * 12 + Math.cos(i / 3) * 5);
  for (const p of rsi(bars(prices), 14)) {
    assert.ok(p.value >= 0 && p.value <= 100, `RSI out of range: ${p.value}`);
  }
});

const WILDER = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42,
  45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28,
];

test("the first RSI value matches the arithmetic by hand", () => {
  // 14 changes over these 15 closes: gains total 3.34, losses total 1.40.
  //   avg gain 3.34/14 = 0.2385714,  avg loss 1.40/14 = 0.1
  //   RS = 2.3857143,  RSI = 100 − 100/(1 + RS) = 70.4641
  const out = rsi(bars(WILDER), 14);
  assert.ok(Math.abs(out[0].value - 70.4641) < 0.001, `expected 70.4641, got ${out[0].value}`);
});

test("subsequent values use Wilder smoothing, not a rolling simple average", () => {
  // From the second value on, the two methods diverge — and a rolling-average
  // implementation passes every other test in this file, so this is the one that catches it.
  const prices = [...WILDER, 46.0, 46.03, 46.41, 46.22, 45.64];
  const out = rsi(bars(prices), 14);

  const rollingSimple = (i) => {
    let g = 0;
    let l = 0;
    for (let k = i - 13; k <= i; k += 1) {
      const d = prices[k] - prices[k - 1];
      if (d >= 0) g += d;
      else l -= d;
    }
    g /= 14;
    l /= 14;
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
  };

  const last = out.at(-1).value;
  const naive = rollingSimple(prices.length - 1);

  assert.ok(Number.isFinite(last));
  assert.ok(
    Math.abs(last - naive) > 0.5,
    `Wilder (${last}) and the rolling average (${naive}) are too close for this test to prove anything`
  );
});

test("RSI needs one more bar than its period", () => {
  assert.deepEqual(rsi(bars(Array(14).fill(100)), 14), []);
  assert.equal(rsi(bars(Array(15).fill(100)), 14).length, 1);
});

test("a flat series has no gains and no losses, so RSI is neither 0 nor undefined", () => {
  const out = rsi(bars(Array(40).fill(100)), 14);
  // Both averages are zero: loss === 0 wins, giving 100. What matters is that it is a
  // number in range rather than NaN from 0/0.
  assert.ok(Number.isFinite(out.at(-1).value));
  assert.ok(out.at(-1).value >= 0 && out.at(-1).value <= 100);
});

test("Bollinger bands straddle the middle and collapse on a flat series", () => {
  const noisy = bollinger(bars([10, 12, 11, 13, 12, 14, 13, 15]), 4, 2);
  for (let i = 0; i < noisy.middle.length; i += 1) {
    assert.ok(noisy.upper[i].value > noisy.middle[i].value);
    assert.ok(noisy.lower[i].value < noisy.middle[i].value);
  }

  const flat = bollinger(bars(Array(20).fill(50)), 5, 2);
  assert.ok(flat.upper.every((p, i) => Math.abs(p.value - flat.lower[i].value) < 1e-9));
});

test("Bollinger uses population standard deviation", () => {
  // Window [1,2,3,4]: mean 2.5, population sd = sqrt(1.25) ≈ 1.1180 (sample would be 1.2910).
  const out = bollinger(bars([1, 2, 3, 4]), 4, 1);
  assert.ok(Math.abs(out.upper[0].value - (2.5 + Math.sqrt(1.25))) < 1e-9);
});

test("every offered indicator computes on a realistic series", () => {
  const prices = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 5) * 8);
  for (const ind of INDICATORS) {
    const out = ind.compute(bars(prices));
    assert.ok(Array.isArray(out) && out.length > 0, `${ind.key} produced nothing`);
    assert.ok(out.every((p) => Number.isFinite(p.value)), `${ind.key} produced a non-number`);
    // lightweight-charts refuses a series whose times are not strictly ascending.
    for (let i = 1; i < out.length; i += 1) {
      assert.ok(out[i].time > out[i - 1].time, `${ind.key} times are not ascending`);
    }
  }
});

test("indicators return empty rather than throwing on too little data", () => {
  for (const ind of INDICATORS) {
    assert.deepEqual(ind.compute(bars([100, 101])), []);
    assert.deepEqual(ind.compute([]), []);
  }
});
