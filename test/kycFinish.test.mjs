// QA 1.2 — "verified and logged in automatically, no second login".
//
// The signup journey used to end by dropping the redux session and sending the investor to
// /login, so somebody who had just verified an OTP and filled in their entire KYC was asked
// to sign in again. SRS §2 says verifying the OTP logs you in. The session is kept now, and
// these pin that — including the toast, which went on telling people to sign in for a while
// after the logout itself was gone, which is arguably worse than the original bug: the app
// said one thing and did another.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/kyc/KYC.jsx", "utf8");

const finishKyc = (() => {
  const start = src.indexOf("const finishKyc = () => {");
  assert.notEqual(start, -1, "finishKyc has been renamed or removed");
  return src.slice(start, src.indexOf("};", start) + 2);
})();

test("finishing KYC keeps the session it was given", () => {
  assert.doesNotMatch(finishKyc, /logout/, "the signup journey must not end by logging the investor out");
  assert.doesNotMatch(finishKyc, /navigate\(["']\/login/, "and must not hand over to /login");
});

test("finishing KYC lands on the app, not the sign-in page", () => {
  assert.match(finishKyc, /navigate\("\/", \{ replace: true \}\)/);
  // pin_expiry is cleared so the PIN screen is the first thing met — that is where the PIN
  // gets set, and it is NOT a second login.
  assert.match(finishKyc, /removeItem\("pin_expiry"\)/);
});

test("nothing anywhere in the KYC journey logs the investor out", () => {
  assert.doesNotMatch(src, /dispatch\(logout\(\)\)/, "a logout has come back into the KYC flow");
});

test("no message still tells the investor to sign in again", () => {
  assert.doesNotMatch(
    src,
    /Please sign in to continue/,
    "the toast contradicts the behaviour: they are already signed in"
  );
});
