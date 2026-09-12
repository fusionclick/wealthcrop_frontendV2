// bucketSeries: the NAV chart's range/interval bucketing.
//
// This lived at src/components/chart/navSeries.test.mjs, where `npm test` (which globs
// test/*.test.mjs) never ran it. Real coverage, silently not executing.
import assert from "node:assert/strict";
import { bucketSeries } from "../src/components/chart/navSeries.js";

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
