// node src/components/chart/navSeries.test.mjs
import assert from "node:assert/strict";
import { bucketSeries } from "./navSeries.js";

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
