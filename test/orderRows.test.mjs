// QA 3.4 / 3.7 — the order tables said nothing about which way the money moved, and every
// failure was replaced by a generic sentence before anyone could read it.
import test from "node:test";
import assert from "node:assert";
import { isSell, orderErrorMessage, orderRefId, orderTypeLabel } from "../src/utils/nodeApi.js";

test("a redemption is never labelled as a purchase, in either spelling", () => {
  // Laravel stores "redeem"; BSE answers "R" or "Redemption". Both land in one list now.
  for (const t of ["r", "R", "redeem", "Redemption", "SWP", "switch-out"]) {
    assert.strictEqual(orderTypeLabel(t), t.toLowerCase() === "swp" ? "Redeem" : "Redeem", `${t} should read as a sell`);
    assert.strictEqual(isSell(t), true, `${t} should be a sell`);
  }
});

test("a purchase is a purchase and is never treated as a sell", () => {
  for (const t of ["p", "P", "purchase", "Purchase", "buy"]) {
    assert.strictEqual(orderTypeLabel(t), "Purchase");
    assert.strictEqual(isSell(t), false);
  }
});

test("SIP and Switch keep their own identity", () => {
  assert.strictEqual(orderTypeLabel("sip"), "SIP");
  assert.strictEqual(orderTypeLabel("XSIP"), "SIP");
  assert.strictEqual(orderTypeLabel("switch"), "Switch");
  assert.strictEqual(orderTypeLabel("STP"), "Switch");
  assert.strictEqual(isSell("sip"), false);
});

test("an unknown code is shown as it arrived, never guessed", () => {
  // Guessing here would be a lie about which way the money moved.
  assert.strictEqual(orderTypeLabel("ZZ9"), "ZZ9");
  assert.strictEqual(isSell("ZZ9"), false);
  assert.strictEqual(orderTypeLabel(""), "—");
  assert.strictEqual(orderTypeLabel(null), "—");
});

test("order refs do not collide across a burst of orders", () => {
  // The old six-digit random had 900,000 values shared across every order ever placed;
  // BSE needs mem_ord_ref_id unique per member forever, and answers a repeat with a flat
  // rejection that names no cause.
  const seen = new Set();
  for (let i = 0; i < 20000; i++) seen.add(orderRefId());
  assert.strictEqual(seen.size, 20000, "every reference in a tight loop must be distinct");
});

test("an order ref is numeric and short enough for BSE", () => {
  const ref = orderRefId();
  assert.match(ref, /^\d+$/, "BSE rejects a non-numeric reference");
  assert.ok(ref.length <= 20, `too long: ${ref.length}`);
});

test("the server's real reason survives, instead of the generic fallback", () => {
  // postApiWithToken returns the AXIOS RESPONSE, so the body is res.data. Reading
  // res.message is a level too high and is always undefined — which is why QA only ever
  // saw "Redemption failed. Please try again."
  const axiosShaped = { status: 400, data: { message: "Insufficient units in folio 12345" } };
  assert.strictEqual(orderErrorMessage(axiosShaped, "generic"), "Insufficient units in folio 12345");
});

test("BSE's per-order remark is surfaced when there is no top-level message", () => {
  const res = { data: { items: [{ remarks: "Scheme suspended for redemption" }] } };
  assert.strictEqual(orderErrorMessage(res, "generic"), "Scheme suspended for redemption");
});

test("the fallback still applies when the response really says nothing", () => {
  assert.strictEqual(orderErrorMessage({ data: {} }, "generic"), "generic");
  assert.strictEqual(orderErrorMessage(undefined, "generic"), "generic");
});
