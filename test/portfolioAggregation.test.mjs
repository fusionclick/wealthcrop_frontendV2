import test from "node:test";
import assert from "node:assert/strict";
import { mergePortfolio, mapXspToSip } from "../src/utils/nodeApi.js";
import { portfolioXirr, flowsFromOrders } from "../src/utils/xirr.js";

const bse = (code, amount, extra = {}) => ({
  scheme_bse_code: code,
  scheme_name: "HDFC Liquid Fund",
  inv_amo: amount,
  units: amount / 50,
  folio: "QA1000002",
  ...extra,
});

/**
 * QA: three purchases into HDFC Liquid (10k, 12k, 4k) showed as ₹12k invested. The merge
 * kept whichever single row had the largest amount instead of adding them up.
 */
test("three orders in one fund are summed, not picked from", () => {
  const merged = mergePortfolio([], [bse("HDLFDDN-DR", 10000), bse("HDLFDDN-DR", 12000), bse("HDLFDDN-DR", 4000)]);

  assert.equal(merged.length, 1, "one fund is one row, not three");
  assert.equal(merged[0].inv_amo, 26000);
  assert.equal(merged[0].folio, "QA1000002");
});

test("the two sources are chosen between, never added together", () => {
  // The same position, reported by Laravel's mirror and by BSE. Summing both would double it.
  const merged = mergePortfolio(
    [{ scheme_bse_code: "PP001ZG-GR", scheme_name: "PPFAS", inv_amo: 5000, folio: "QA-FOLIO-1" }],
    [{ scheme_bse_code: "PP001ZG-GR", scheme_name: "PPFAS", inv_amo: 5000, folio: "QA1000001", units: 80 }]
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].inv_amo, 5000, "BSE is the book of record, not BSE + the mirror");
  assert.equal(merged[0].folio, "QA1000001", "and its folio is the one Redeem can use");
});

test("a scheme only Laravel knows about still shows up", () => {
  const merged = mergePortfolio([{ scheme_bse_code: "X1-GR", scheme_name: "X", inv_amo: 900 }], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].inv_amo, 900);
});

/**
 * QA: order history listed everything as ACCEPTED and XIRR still read "—". getClientPortfolio
 * counts ACCEPTED as a holding, so XIRR refusing it meant the units were shown without the
 * money that bought them.
 */
test("ACCEPTED orders are cash flows, the same as ALLOTTED ones", () => {
  const orders = [
    { date: "2025-10-01", amount: 10000, type: "purchase", status: "ACCEPTED", scheme_bse_code: "A" },
    { date: "2026-04-01", amount: 12000, type: "purchase", status: "ACCEPTED", scheme_bse_code: "A" },
  ];

  assert.equal(flowsFromOrders(orders).length, 2, "both orders must survive the settled filter");

  const rate = portfolioXirr(orders, 24000, new Date("2026-09-19"));
  assert.notEqual(rate, null, "a rate, not a blank tile");
  assert.ok(Number.isFinite(rate));
});

test("a rejected order is still not a cash flow", () => {
  const orders = [
    { date: "2025-10-01", amount: 10000, type: "purchase", status: "ACCEPTED", scheme_bse_code: "A" },
    { date: "2026-01-01", amount: 3000, type: "purchase", status: "REJECTED", scheme_bse_code: "A" },
  ];
  assert.equal(flowsFromOrders(orders).length, 1);
});

/** QA: a successful top-up left no trace anywhere on the SIP card. */
test("a registered top-up reaches the SIP card", () => {
  const sip = mapXspToSip({ reg_no: "QASIP0001", amount: 5000, topup_amount: 500, topup_freq: "y" });
  assert.equal(sip.topupAmount, 500);
  assert.equal(sip.topupFrequency, "Yearly");
});

test("a SIP with no top-up says nothing rather than zero", () => {
  assert.equal(mapXspToSip({ reg_no: "QASIP0002", amount: 5000 }).topupAmount, null);
});
