import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { classifyFlow, flowsFromOrders, parseFlowDate, portfolioXirr, sipXirr, xirr } from "../src/utils/xirr.js";

const d = (s) => new Date(s);
const near = (actual, expected, tol = 0.05) =>
  assert.ok(
    actual != null && Math.abs(actual - expected) <= tol,
    `expected ~${expected}%, got ${actual == null ? "null" : `${actual}%`}`
  );

test("ticket 14/15: one year, +10% — the textbook case", () => {
  near(xirr([{ date: d("2025-01-01"), amount: -1000 }, { date: d("2026-01-01"), amount: 1100 }]), 10);
});

test("ticket 14/15: the same gain over half the time is roughly twice the rate", () => {
  const half = xirr([{ date: d("2025-01-01"), amount: -1000 }, { date: d("2025-07-02"), amount: 1100 }]);
  // ~21% — (1.1)^2 - 1. This is precisely what the old calcXirr could not see: it called
  // both of these 10%.
  near(half, 21, 0.6);
});

test("ticket 14/15: matches Excel's XIRR on its own documented example", () => {
  // The example from Microsoft's XIRR docs: -10000 on 2008-01-01, then five receipts.
  // Excel returns 0.373362535 (37.34%).
  const flows = [
    { date: d("2008-01-01"), amount: -10000 },
    { date: d("2008-03-01"), amount: 2750 },
    { date: d("2008-10-30"), amount: 4250 },
    { date: d("2009-02-15"), amount: 3250 },
    { date: d("2009-04-01"), amount: 2750 },
  ];
  near(xirr(flows), 37.34, 0.1);
});

test("ticket 14: a monthly SIP is money-weighted, not a simple gain over invested", () => {
  // 12 × ₹10,000 paid on the 1st of each month, worth ₹1,30,000 a year in. Simple gain is
  // 8.33% of ₹1,20,000; XIRR is far higher because the average rupee was only invested for
  // about half the year.
  const flows = [];
  for (let m = 0; m < 12; m++) flows.push({ date: new Date(2025, m, 1), amount: -10000 });
  flows.push({ date: new Date(2026, 0, 1), amount: 130000 });
  const rate = xirr(flows);
  assert.ok(rate > 14 && rate < 18, `SIP XIRR should be ~15-16%, got ${rate}`);
});

test("a loss comes back negative, not as a missing number", () => {
  const rate = xirr([{ date: d("2025-01-01"), amount: -1000 }, { date: d("2026-01-01"), amount: 800 }]);
  near(rate, -20);
});

test("flows that cannot produce a rate return null, never 0", () => {
  assert.equal(xirr([]), null);
  assert.equal(xirr([{ date: d("2025-01-01"), amount: -1000 }]), null, "one flow is not a rate");
  assert.equal(
    xirr([{ date: d("2025-01-01"), amount: -1000 }, { date: d("2026-01-01"), amount: -500 }]),
    null,
    "all outflows and no valuation is not a rate"
  );
  assert.equal(
    xirr([{ date: d("2025-01-01"), amount: -1000 }, { date: d("2025-01-01"), amount: 1100 }]),
    null,
    "same-day flows have no time for a rate to act over"
  );
});

test("BSE's two date formats both parse, and dd-mm is never read as mm-dd", () => {
  assert.equal(parseFlowDate("2026-04-03").getMonth(), 3, "ISO 2026-04-03 is April");
  assert.equal(parseFlowDate("03-04-2026").getMonth(), 3, "BSE dd-mm-yyyy 03-04-2026 is April");
  assert.equal(parseFlowDate("03/04/2026").getDate(), 3);
  assert.equal(parseFlowDate(""), null);
  assert.equal(parseFlowDate("not a date"), null);
});

test("purchases take money out, redemptions bring it back, the rest is left alone", () => {
  assert.equal(classifyFlow({ type: "Purchase" }), -1);
  assert.equal(classifyFlow({ type: "Additional Purchase" }), -1);
  assert.equal(classifyFlow({ type: "SIP" }), -1);
  assert.equal(classifyFlow({ type: "Switch-IN" }), -1);
  assert.equal(classifyFlow({ type: "Redemption" }), 1);
  assert.equal(classifyFlow({ type: "SWP" }), 1);
  assert.equal(classifyFlow({ type: "Switch-OUT" }), 1);
  assert.equal(classifyFlow({ type: "IDCW Payout" }), 1);
  assert.equal(classifyFlow({ type: "Mandate Registration" }), 0, "an unknown type must not be signed by guess");
});

const ORDERS = [
  { date: "01-01-2025", type: "Purchase", amount: 50000, status: "ALLOTTED", scheme_bse_code: "8130-GR" },
  { date: "01-07-2025", type: "Purchase", amount: 50000, status: "Allotted", scheme_bse_code: "9001-GR" },
  { date: "01-08-2025", type: "Redemption", amount: 20000, status: "COMPLETED", scheme_bse_code: "8130-GR" },
  { date: "05-08-2025", type: "Purchase", amount: 99999, status: "REJECTED", scheme_bse_code: "8130-GR" },
  { date: "06-08-2025", type: "Purchase", amount: 88888, status: "PENDING", scheme_bse_code: "8130-GR" },
];

test("ticket 15: only settled orders become cash flows", () => {
  const flows = flowsFromOrders(ORDERS, null);
  assert.equal(flows.length, 3, "the rejected and pending orders must not appear");
  assert.deepEqual(
    flows.map((f) => f.amount),
    [-50000, -50000, 20000]
  );
});

test("ticket 15: the current portfolio value is the final flow", () => {
  const asOf = d("2026-01-01");
  const flows = flowsFromOrders(ORDERS, 95000, asOf);
  const last = flows[flows.length - 1];
  assert.equal(last.amount, 95000);
  assert.equal(last.date.getTime(), asOf.getTime());
});

test("ticket 15: portfolio XIRR spans several schemes on their real dates", () => {
  const rate = portfolioXirr(ORDERS, 95000, d("2026-01-01"));
  assert.ok(rate != null, "a funded portfolio with a valuation must produce a rate");
  // Sanity, not a golden number: ₹1L in, ₹20k back out, ₹95k left after a year is a gain.
  assert.ok(rate > 0 && rate < 100, `implausible portfolio XIRR: ${rate}`);
});

test("ticket 14: SIP XIRR sees only its own scheme's instalments", () => {
  const asOf = d("2026-01-01");
  const mine = sipXirr(ORDERS, "8130-GR", 40000, asOf);
  const other = sipXirr(ORDERS, "9001-GR", 60000, asOf);
  assert.ok(mine != null && other != null);
  assert.notEqual(mine.toFixed(4), other.toFixed(4), "two schemes must not collapse to one rate");
  assert.equal(sipXirr(ORDERS, "DOES-NOT-EXIST", 1000, asOf), null);
  assert.equal(sipXirr(ORDERS, "", 1000, asOf), null);
});

test("no hardcoded XIRR anywhere, and the old fake is gone", () => {
  const dash = fs.readFileSync("src/pages/mutual_fund/DashBoardMF.jsx", "utf8");
  assert.match(dash, /portfolioXirr\(/);
  assert.doesNotMatch(dash, /calcXirr/, "the dateless estimate must not be back under the XIRR label");
  assert.doesNotMatch(dash, /XIRR \(est\.\)/);
  const api = fs.readFileSync("src/utils/nodeApi.js", "utf8");
  assert.doesNotMatch(api, /export const calcXirr/, "calcXirr was renamed to calcAbsoluteReturn");
});
