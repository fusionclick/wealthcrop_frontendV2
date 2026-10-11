import test from "node:test";
import assert from "node:assert/strict";
import { externalTotals, navForDate, unitsFor } from "../src/utils/nodeApi.js";

const rows = [
  { units: 100, invested_amount: 1000, scheme_isin: "IN1" }, // NAV 12 → 1200
  { units: 50, invested_amount: 2000, scheme_isin: "IN2" },  // NAV nahi → 2000
];
const navOf = (r) => (r.scheme_isin === "IN1" ? 12 : null);

test("one missing NAV leaves the total valuation and returns unknown", () => {
  const t = externalTotals(rows, navOf);
  assert.equal(t.invested, 3000);
  assert.equal(t.current, null);
  assert.equal(t.pnl, null);
  assert.equal(t.pnlPct, null);
  assert.equal(t.priced, 1);
});

test("fully priced holdings still calculate their actual gain", () => {
  assert.deepEqual(externalTotals([rows[0]], navOf), { invested: 1000, current: 1200, pnl: 200, pnlPct: 20, priced: 1 });
});

test("empty list is flat, not NaN", () => {
  const t = externalTotals([], navOf);
  assert.deepEqual(t, { invested: 0, current: 0, pnl: 0, pnlPct: 0, priced: 0 });
});

test("units amount se nikalti hain, NAV ke bagair nahi", () => {
  // Screenshot wala case: 10000 rupees, NAV 11.04 -> 906 units, na ke 10.
  assert.equal(unitsFor(10000, 11.04), 905.7971);
  assert.equal(unitsFor(1000, 10), 100);
  assert.equal(unitsFor(10000, null), null);
  assert.equal(unitsFor("", 11.04), null);
  assert.equal(unitsFor(10000, 0), null);
});

test("purchase date par us din ya pichle published din ki NAV lagti hai", () => {
  const series = [
    { timestamp: Date.parse("2026-08-26T00:00:00Z") / 1000, nav: 940 },
    { timestamp: Date.parse("2026-08-27T00:00:00Z") / 1000, nav: 945 },
    { timestamp: Date.parse("2026-08-28T00:00:00Z") / 1000, nav: 950 },
  ];

  assert.equal(navForDate(series, "2026-08-27"), 945);
  assert.equal(navForDate(series, "2026-08-26"), 940);
  assert.equal(navForDate(series.slice(0, 2), "2026-08-28"), 945);
  assert.equal(navForDate(series, ""), null);
});
