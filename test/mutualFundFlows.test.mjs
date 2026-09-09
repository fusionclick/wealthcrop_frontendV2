import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  apiErrorMessage,
  fundBuyPath,
  fundPath,
  mapXspToSip,
  MF_EXPLORE_PATH,
  xspItems,
} from "../src/utils/nodeApi.js";

test("reads the documented BSE SIP list response", () => {
  const response = { status: "success", data: { lists: [{ reg_no: "SIP-1" }] } };
  assert.deepEqual(xspItems(response), [{ reg_no: "SIP-1" }]);
});

test("maps BSE SIP fields used by the live response", () => {
  const sip = mapXspToSip({
    reg_no: "SIP-1",
    src_scheme: "8130-GR",
    amount: 2500,
    freq: "m",
    status: "reg",
    next_due_date: "2026-09-05",
    total_amt_paid: 5000,
  });

  assert.equal(sip.schemeName, "8130-GR");
  assert.equal(sip.status, "REG");
  assert.equal(sip.nextInstallment, "2026-09-05");
  assert.equal(sip.investedSoFar, 5000);
});

test("turns auth proxy reasons into actionable messages", () => {
  assert.match(
    apiErrorMessage({ response: { data: { reason: "token_rejected", message: "Unauthorized" } } }),
    /sign in again/i
  );
  assert.match(
    apiErrorMessage({ response: { data: { reason: "upstream_unreachable", message: "Unauthorized" } } }),
    /try again/i
  );
});

test("logo and root route open the landing page without clearing the session", () => {
  const header = fs.readFileSync(new URL("../src/components/OldHeader.jsx", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(header, /<Link to="\/"/);
  assert.match(app, /path="\/"\s+element=\{<Home\s*\/>\}/s);
});

// A React Router dynamic segment never matches an empty string, so `/mutual_fund//X/buy`
// fell through to the catch-all 404. Portfolio rows carry only the BSE code (BSE
// order_list sends no ISIN), which is exactly the case that used to break.
test("fund URLs never emit an empty dynamic segment", () => {
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  // Turn the declared routes into matchers so the assertion proves the real route table.
  const toRe = (p) => new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}$`);
  assert.match(app, /path="\/mutual_fund\/:isin\/:code\/buy"/);
  assert.match(app, /path="\/mutual_fund\/:isin\/:code"/);
  const buyRoute = toRe("/mutual_fund/:isin/:code/buy");
  const detailRoute = toRe("/mutual_fund/:isin/:code");

  // Code only — the combined-portfolio "Invest more" row.
  assert.equal(fundBuyPath("", "PPCH-GR"), "/mutual_fund/PPCH-GR/PPCH-GR/buy");
  assert.match(fundBuyPath("", "PPCH-GR"), buyRoute);
  assert.match(fundPath("", "PPCH-GR"), detailRoute);

  // ISIN only.
  assert.match(fundBuyPath("INF879O01019", ""), buyRoute);
  assert.match(fundPath("INF879O01019", ""), detailRoute);

  // Both present — unchanged behaviour.
  assert.equal(fundPath("INF879O01019", "PPCH-GR"), "/mutual_fund/INF879O01019/PPCH-GR");
  assert.match(fundBuyPath("INF879O01019", "PPCH-GR"), buyRoute);

  // Neither — send the investor somewhere real, not to a 404.
  assert.equal(fundPath("", ""), MF_EXPLORE_PATH);
  assert.equal(fundBuyPath("", ""), MF_EXPLORE_PATH);
  assert.match(app, /path="explore" element=\{<ExploreMF \/>\}/);
});
