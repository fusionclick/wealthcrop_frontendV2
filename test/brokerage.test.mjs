// Client 2026-10-09 — brokerage from the published ratecard.
import test from "node:test";
import assert from "node:assert/strict";
import { brokerageFor, equitySegment } from "../src/utils/brokerage.js";

test("with no ratecard the old estimate stands: 0.03% capped at ₹20", () => {
  assert.equal(brokerageFor(null, 10000), 3);
  assert.equal(brokerageFor(null, 1000000), 20);
});

test("a published row: percent plus flat fee, then floor and cap", () => {
  assert.equal(brokerageFor({ pct_rate: 0.1, flat_rupees: 0, min_rupees: 25, max_rupees: null }, 10000), 25, "floor");
  assert.equal(brokerageFor({ pct_rate: 0.1, min_rupees: 25 }, 100000), 100);
  assert.equal(brokerageFor({ pct_rate: null, flat_rupees: 15 }, 500000), 15, "flat fee only");
  assert.equal(brokerageFor({ pct_rate: 0.05, max_rupees: 20 }, 100000), 20, "cap");
});

test("intraday orders use the intraday row, everything else delivery", () => {
  assert.equal(equitySegment("INTRADAY"), "equity_intraday");
  assert.equal(equitySegment("DELIVERY"), "equity_delivery");
});
