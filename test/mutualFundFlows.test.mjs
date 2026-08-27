import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { apiErrorMessage, mapXspToSip, xspItems } from "../src/utils/nodeApi.js";

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
