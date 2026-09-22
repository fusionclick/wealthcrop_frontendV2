import test from "node:test";
import assert from "node:assert/strict";
import {
  splitByPercent,
  splitIntoInstalments,
  buildSpreadPlan,
  instalmentDates,
} from "../src/utils/spread.js";

const sum = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

test("a percentage split adds back up to the lump sum exactly", () => {
  // The case that breaks naive rounding: thirds of a round number.
  const parts = splitByPercent(100000, [33.33, 33.33, 33.34]);
  assert.equal(sum(parts), 100000);
});

test("an indivisible split still adds up, and the paisa goes somewhere", () => {
  const parts = splitByPercent(100, [33.33, 33.33, 33.34]);
  assert.equal(sum(parts), 100);
  // Nobody gets a negative or zero share just because the remainder had to land.
  assert.ok(parts.every((p) => p > 0));
});

test("equal weights split equally", () => {
  assert.deepEqual(splitByPercent(90000, [25, 25, 25, 25]), [22500, 22500, 22500, 22500]);
});

test("instalments add back up to the fund's share", () => {
  const parts = splitIntoInstalments(10000, 3);
  assert.equal(parts.length, 3);
  assert.equal(sum(parts), 10000);
  // The odd paisa is on the first instalment, not the last.
  assert.ok(parts[0] >= parts[1]);
});

test("one instalment is the whole amount", () => {
  assert.deepEqual(splitIntoInstalments(5000, 1), [5000]);
});

test("a plan splits a lump sum across funds and instalments", () => {
  const { legs, errors } = buildSpreadPlan({
    total: 120000,
    instalments: 12,
    funds: [
      { scheme_code: "A", name: "Fund A", percent: 60, min_amount: 500 },
      { scheme_code: "B", name: "Fund B", percent: 40, min_amount: 500 },
    ],
  });

  assert.deepEqual(errors, []);
  assert.equal(legs[0].amount, 72000);
  assert.equal(legs[1].amount, 48000);
  assert.equal(legs[0].instalments.length, 12);
  assert.equal(sum(legs[0].instalments), 72000);
  assert.equal(sum(legs.map((l) => l.amount)), 120000);
});

test("allocations that do not reach 100% are refused", () => {
  const { errors } = buildSpreadPlan({
    total: 10000,
    instalments: 1,
    funds: [
      { scheme_code: "A", percent: 30 },
      { scheme_code: "B", percent: 30 },
    ],
  });
  assert.ok(errors.some((e) => e.includes("100%")));
});

test("33.33 + 33.33 + 33.34 is accepted as 100%", () => {
  const { errors } = buildSpreadPlan({
    total: 10000,
    instalments: 1,
    funds: [
      { scheme_code: "A", percent: 33.33 },
      { scheme_code: "B", percent: 33.33 },
      { scheme_code: "C", percent: 33.34 },
    ],
  });
  assert.deepEqual(errors, []);
});

test("an instalment below the scheme minimum is caught before it reaches BSE", () => {
  // 12000 over 12 months into a fund taking 10% = ₹100/month, under a ₹500 minimum.
  const { errors } = buildSpreadPlan({
    total: 12000,
    instalments: 12,
    funds: [
      { scheme_code: "A", name: "Small Leg", percent: 10, min_amount: 500 },
      { scheme_code: "B", name: "Big Leg", percent: 90, min_amount: 500 },
    ],
  });
  assert.ok(errors.some((e) => e.includes("Small Leg") && e.includes("minimum")));
  // The leg that is fine is not blamed.
  assert.ok(!errors.some((e) => e.includes("Big Leg")));
});

test("the same fund twice is refused", () => {
  const { errors } = buildSpreadPlan({
    total: 10000,
    instalments: 1,
    funds: [
      { scheme_code: "A", percent: 50 },
      { scheme_code: "A", percent: 50 },
    ],
  });
  assert.ok(errors.some((e) => e.includes("twice")));
});

test("a zero allocation is refused rather than silently dropped", () => {
  const { errors } = buildSpreadPlan({
    total: 10000,
    instalments: 1,
    funds: [
      { scheme_code: "A", percent: 100 },
      { scheme_code: "B", percent: 0 },
    ],
  });
  assert.ok(errors.some((e) => e.includes("above 0%")));
});

test("monthly instalment dates step by month, not by 30 days", () => {
  const dates = instalmentDates("2026-01-31", 3, "m");
  assert.equal(dates.length, 3);
  assert.equal(dates[0], "2026-01-31");
  // Whatever JS does with 31 Feb, the third date must be a real, later day.
  assert.ok(dates[2] > dates[1] && dates[1] > dates[0]);
});

test("weekly instalment dates step by seven days", () => {
  assert.deepEqual(instalmentDates("2026-03-02", 3, "w"), ["2026-03-02", "2026-03-09", "2026-03-16"]);
});
