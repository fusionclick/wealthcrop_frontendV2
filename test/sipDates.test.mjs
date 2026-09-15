import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { allowedDays, FALLBACK_SIP_DAYS, nextOccurrence, ordinal, smartDefaultDay } from "../src/utils/sipDates.js";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

// One BSE systematic[] block as /scheme-details hands it over: SIP is open monthly on four
// dates and quarterly on two, and BSE returns them unsorted.
const SIP_TXN = {
  allowed: true,
  minAmount: 1000,
  frequencies: [
    { frequency: "Monthly", dates: [15, 1, 25, 7], registrationAllowed: true, minAmount: 1000 },
    { frequency: "Quarterly", dates: [10, 20], registrationAllowed: true, minAmount: 3000 },
    { frequency: "Weekly", dates: [1, 2, 3, 4, 5], registrationAllowed: false, minAmount: 500 },
  ],
};

test("ticket 13: the dates offered are the scheme's own, sorted", () => {
  assert.deepEqual(allowedDays(SIP_TXN, "m"), [1, 7, 15, 25]);
  assert.deepEqual(allowedDays(SIP_TXN, "q"), [10, 20]);
});

test("ticket 13: a frequency BSE closed for registration is not offered", () => {
  // Weekly has dates, but registrationAllowed is false — falling through to the generic
  // list is right: we do not put a closed frequency's dates on the form.
  assert.deepEqual(allowedDays(SIP_TXN, "w"), FALLBACK_SIP_DAYS);
});

test("ticket 13: no scheme data means the generic BSE days, never an empty picker", () => {
  assert.deepEqual(allowedDays(null, "m"), FALLBACK_SIP_DAYS);
  assert.deepEqual(allowedDays({ frequencies: [] }, "m"), FALLBACK_SIP_DAYS);
  assert.deepEqual(allowedDays({ frequencies: [{ frequency: "Monthly", dates: [] }] }, "m"), FALLBACK_SIP_DAYS);
});

test("ticket 13: days past the 28th are dropped — not every month has a 29th", () => {
  const txn = { frequencies: [{ frequency: "Monthly", dates: [5, 29, 31, 0, "12"] }] };
  assert.deepEqual(allowedDays(txn, "m"), [5, 12]);
});

test("ticket 13: the default date is the allowed day that comes round soonest", () => {
  const days = [1, 7, 15, 25];
  // Mid-month: the 15th is next.
  assert.equal(smartDefaultDay(days, new Date(2026, 8, 10)), 15);
  // On the 15th itself: today does not count, so the 25th is next.
  assert.equal(smartDefaultDay(days, new Date(2026, 8, 15)), 25);
  // After the last one: it wraps to the 1st of next month, which is still the soonest.
  assert.equal(smartDefaultDay(days, new Date(2026, 8, 27)), 1);
});

test("ticket 13: the default start date is never in the past", () => {
  const from = new Date(2026, 8, 27);
  for (const day of [1, 7, 15, 25, 28]) {
    assert.ok(Date.parse(nextOccurrence(day, from)) > from.getTime(), `day ${day} landed in the past`);
  }
});

test("BSE's rule holds: start_date's day-of-month equals the SIP date", () => {
  const from = new Date(2026, 8, 10);
  for (const day of [1, 7, 15, 25, 28]) {
    assert.equal(Number(nextOccurrence(day, from).slice(8, 10)), day);
  }
});

test("ordinals read as English, including the teens", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 28].map(ordinal), [
    "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "28th",
  ]);
});

test("ticket 12: the SIP page header is one line of scheme name + live NAV", () => {
  const src = readCode("../src/pages/mutual_fund/SIPSetupPage.jsx");
  assert.match(src, /titleCase\(fund\.name\)/, "the scheme name is not title-cased in the header");
  assert.match(src, /current_nav/, "NAV is not taken from the live /scheme-details value");
  assert.doesNotMatch(src, /Scheme code/, "the internal BSE scheme code is still labelled on the page");
  assert.doesNotMatch(src, /Number\(fund\.minSip\) \|\| 500/, "the hardcoded 500 minimum is back");
});

test("ticket 13: submit is blocked on a date the scheme does not accept", () => {
  const src = readCode("../src/pages/mutual_fund/SIPSetupPage.jsx");
  assert.match(src, /startDayInvalid = !sipDays\.includes\(startDay\)/);
  assert.match(src, /disabled=\{[^}]*startDayInvalid/);
});
