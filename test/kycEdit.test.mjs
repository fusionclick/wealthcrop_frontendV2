// QA 2.7 / 2.8 / 2.9 — "the PAN gets changed but Save shows 'could not save'".
//
// postApiWithToken returns the Laravel BODY (api.js:77 `return res?.data`), so status/message/
// pan_change_pending are top-level on the result. The save handler read `res.data` first —
// the serialized UserProfile payload, which has no `.status` — so EVERY save fell into the
// error branch ("Could not save"), and because the success branch never ran, the edit input
// kept showing the typed PAN. get and post helpers are opposite: get's payload is
// res.data.data, post's payload is res.data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/profile/KycDetails.jsx", "utf8");

test("the PAN save reads the post-helper body directly, not one level too deep", () => {
  // The save result is used for branching and messages at the TOP level of the body.
  assert.match(src, /const res = await postApiWithToken\(api\("\/kyc\/profile"\)/);
  assert.match(src, /if \(res\?\.status\) \{/, "branch on the body's status, not res.data.status");
  assert.match(src, /toastSuccess\(res\.message/);
  assert.match(src, /if \(res\.pan_change_pending\) loadPending\(\)/);

  // The bug was `const body = res?.data; if (body?.status)` — that must not come back.
  assert.doesNotMatch(src, /const body = res\?\.data/);
  assert.doesNotMatch(src, /res\?\.data\?\.status/);
});

test("the pending-banner read stays at res.data.data (it uses the GET helper)", () => {
  // loadPending uses getApiWithToken, which returns the response — so its payload really is
  // one level deeper. This must NOT be 'corrected' to match the post read above.
  assert.match(src, /getApiWithToken\(api\("\/kyc\/pan-change"\)\)/);
  assert.match(src, /const row = res\?\.data\?\.data/);
});

test("a rejected save shows the server's reason, not 'Could not save.'", () => {
  // QA 2.5 — toastError is a single slot keyed "app-error". Without `silent` the helper
  // toasted the real 422 ("City may only contain letters…") and the generic fallback below
  // overwrote it a tick later; without `throwOnError` the catch written for that 422 could
  // never run, because the helper swallowed the error and returned null.
  assert.match(src, /\{ silent: true, throwOnError: true \}/);
  assert.match(src, /err\?\.response\?\.data\?\.message/);

  // City and occupation are checked against the same table /profile/basic already uses, so
  // "Mumbai1" is refused by name before a request is made at all.
  assert.match(src, /import \{ validateField \} from "\.\.\/\.\.\/utils\/profileFields"/);
  assert.match(src, /validateField\(name, form\[name\]\)/);
});

test("the PAN lock warning follows the server, not pan_verified", () => {
  // approvePanChange clears pan_verified on purpose — consent is not verification — so an
  // account whose change was approved is still locked while that flag reads false.
  assert.match(src, /setServerLocked\(Boolean\(res\?\.data\?\.pan_locked\)\)/);
  assert.match(src, /const panLocked = panVerified \|\| serverLocked/);
  assert.match(src, /\{panLocked && editing &&/);
});
