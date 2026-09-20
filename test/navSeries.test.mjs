// bucketSeries: the NAV chart's range/interval bucketing.
//
// This lived at src/components/chart/navSeries.test.mjs, where `npm test` (which globs
// test/*.test.mjs) never ran it. Real coverage, silently not executing.
import test from "node:test";
import assert from "node:assert/strict";
import { annualise, bucketSeries } from "../src/components/chart/navSeries.js";

const DAY = 86400;
const now = Math.floor(Date.UTC(2026, 5, 30) / 1000);
// 800 consecutive days of NAV, rising 0.01/day
const series = Array.from({ length: 800 }, (_, i) => ({ timestamp: now - (799 - i) * DAY, nav: 10 + i * 0.01 }));

assert.deepEqual(bucketSeries([], "1Y", "D"), [], "empty in, empty out");
assert.equal(bucketSeries(series, "1M", "D").length, 31, "1M daily keeps 31 points");
assert.equal(bucketSeries(series, "ALL", "D").length, 800, "ALL keeps everything");
assert.equal(bucketSeries(series, "1Y", "D").length, 366, "1Y daily");

const weekly = bucketSeries(series, "1Y", "W");
assert.ok(weekly.length >= 52 && weekly.length <= 54, `1Y weekly ~52, got ${weekly.length}`);
const monthly = bucketSeries(series, "1Y", "M");
assert.ok(monthly.length >= 12 && monthly.length <= 13, `1Y monthly ~12, got ${monthly.length}`);

// buckets keep the LAST nav of each period and stay ordered
assert.equal(monthly[monthly.length - 1].nav, series[series.length - 1].nav, "last bucket is the latest NAV");
assert.ok(monthly.every((p, i) => i === 0 || p.timestamp > monthly[i - 1].timestamp), "monthly is ordered");
assert.ok(weekly.every((p, i) => i === 0 || p.nav > weekly[i - 1].nav), "weekly follows the rising series");

// junk rows dropped, too-short slices fall back instead of rendering one point
assert.equal(bucketSeries([{ nav: 5 }, { timestamp: now, nav: 0 }, ...series.slice(-3)], "1W", "D").length, 3);
assert.equal(bucketSeries(series.slice(-2), "1W", "D").length, 2);

console.log("navSeries bucketSeries: all assertions passed");

// --- explicit date filter -------------------------------------------------
const iso = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
const from = iso(series[700].timestamp);
const to = iso(series[750].timestamp);

const window = bucketSeries(series, "ALL", "D", { from, to });
assert.equal(window[0].timestamp, series[700].timestamp, "custom range starts on `from`");
assert.equal(window[window.length - 1].timestamp, series[750].timestamp, "custom range ends on `to`");
assert.equal(window.length, 51, "custom range is inclusive on both ends");

// one-sided windows
assert.equal(bucketSeries(series, "1W", "D", { from }).length, 100, "`from` only runs to the end");
assert.equal(bucketSeries(series, "1W", "D", { to }).length, 751, "`to` only runs from the start");

// A window with no NAV in it stays empty — no silent fallback to recent data.
assert.deepEqual(bucketSeries(series, "1Y", "D", { from: "1999-01-01", to: "1999-02-01" }), []);

// range still wins when no dates are picked
assert.equal(bucketSeries(series, "1M", "D", {}).length, 31, "empty span falls back to range");
assert.equal(bucketSeries(series, "1M", "D", null).length, 31, "null span falls back to range");

console.log("navSeries date filter: all assertions passed");

/**
 * QA: toggling Absolute/CAGR in Compare funds changed the table but left the "Since
 * <date>" column showing the cumulative figure, so a CAGR row read
 * "-4.00% p.a. · 7.43% p.a. · 7.20% p.a. · +155.56%" — three annual rates and one
 * twenty-year total, side by side, nothing marking which was which.
 */
test("annualise turns a cumulative return into the rate that compounds to it", () => {
  // +155.56% over the ~20.5 years since 03 Apr 2006 is about 4.7% a year, not 155%.
  const pa = annualise(155.56, 20.5);
  assert.ok(pa > 4.5 && pa < 4.8, `expected ~4.7% p.a., got ${pa}`);

  // Round-trips: compounding the answer back over the window returns the total.
  const back = (Math.pow(1 + pa / 100, 20.5) - 1) * 100;
  assert.ok(Math.abs(back - 155.56) < 0.01, `round-trip gave ${back}`);

  // One year of anything annualises to itself.
  assert.ok(Math.abs(annualise(-4, 1) - -4) < 1e-9);

  // A loss still annualises, and stays a loss.
  const loss = annualise(-50, 5);
  assert.ok(loss < 0 && loss > -20, `expected a modest annual loss, got ${loss}`);
});

test("annualise refuses the cases that would render NaN", () => {
  assert.equal(annualise(-100, 5), null, "a total wipeout has no annual rate");
  assert.equal(annualise(-150, 5), null, "nor does a figure below -100%");
  assert.equal(annualise(20, 0), null, "nor does a window of no length");
  assert.equal(annualise(null, 5), null);
});
