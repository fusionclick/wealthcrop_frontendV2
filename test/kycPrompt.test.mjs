// Audit #44 — a dismissible KYC pop-up: once per session, for a signed-in investor whose KYC is
// incomplete, never on the onboarding routes or over the PIN modal.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldPromptKyc } from "../src/components/kyc/kycPromptRule.js";

const pending = { id: 7, kyc_status: "pending", kyc: { kyc_status: "pending" } };

test("an investor with incomplete KYC is prompted once per session", () => {
  assert.equal(shouldPromptKyc(pending, null), true);
  // Already shown to this account this session.
  assert.equal(shouldPromptKyc(pending, "7"), false);
  // A different account switched to in the same session gets its own.
  assert.equal(shouldPromptKyc({ ...pending, id: 8 }, "7"), true);
  // No KYC row at all is incomplete too.
  assert.equal(shouldPromptKyc({ id: 9, kyc_status: "pending", kyc: null }, null), true);
});

test("a verified investor, or investor-data still loading, is never prompted", () => {
  assert.equal(shouldPromptKyc(null, null), false);
  assert.equal(shouldPromptKyc({ id: 1, kyc: { kyc_status: "verified" } }, null), false);
  // users.kyc_status is what the weekly reminder reads; the two must not disagree.
  assert.equal(shouldPromptKyc({ id: 1, kyc_status: "approved", kyc: null }, null), false);
});

test("App mounts the prompt only when signed in, unlocked and off the onboarding routes", () => {
  const app = readFileSync("src/App.jsx", "utf8");
  assert.match(
    app,
    /\{token && !locked && !PIN_FREE_ROUTES\.some\(\(p\) => pathname\.startsWith\(p\)\) && <KycPrompt \/>\}/
  );
  // /kyc itself is an onboarding route — the prompt never covers the form it points to.
  assert.match(app, /const PIN_FREE_ROUTES = \[[^\]]*"\/kyc"/);

  const prompt = readFileSync("src/components/kyc/KycPrompt.jsx", "utf8");
  assert.match(prompt, /to="\/kyc"/);
  assert.match(prompt, /sessionStorage\.setItem\(PROMPT_SEEN_KEY/);
});
