import test from "node:test";
import assert from "node:assert/strict";
import { liveNav, navDate } from "../src/utils/navSocket.js";

test("dated statement NAV is historical until a current feed supplies a price", () => {
  const fund = { scheme_isin: "IN1", nav: 44.21, nav_source: "statement", nav_date: "2025-03-31" };
  assert.equal(liveNav(fund, {}), null);
  assert.equal(liveNav(fund, { IN1: { nav: 50, date: "2026-10-09" } }), 50);
  assert.equal(navDate(fund, { IN1: { nav: 50, date: "2026-10-09" } }), "2026-10-09");
  assert.equal(liveNav({ ...fund, nav_source: "catalogue" }, {}), 44.21);
});
