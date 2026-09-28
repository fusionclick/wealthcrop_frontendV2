// QA 14.11 — "Admin refuses the request with a note → the investor sees the note and CAN
// REQUEST AGAIN". The note showed; the second request was impossible.
//
// The server never had that restriction: PrivacyController::requestErasure blocks only on a
// request that is still `pending()`, and there is no unique constraint on the table. The
// block was purely a rendering accident — "refused" was a rung in the same if/else chain as
// the button, so the chain terminated on the note and the button below was unreachable.
// erasureStatus always returns the LATEST row, so that refusal was permanent.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/profile/DataRights.jsx", "utf8");

test("a refused erasure is a banner, not the end of the chain", () => {
  // Rendered on its own, so whatever follows still renders.
  assert.match(src, /\{request\?\.status === "refused" && \(/);
  assert.match(src, /You can ask again below\./);

  // It must NOT be a branch of the conditional that owns the button.
  assert.doesNotMatch(
    src,
    /\) : request\?\.status === "refused" \? \(/,
    "as an else-if rung it swallows the Request erasure button again"
  );
});

test("the button is reachable after a refusal, and not after completion", () => {
  // The remaining chain gates on pending / completed / confirming only.
  assert.match(src, /\{pending \? \([\s\S]*?\) : request\?\.status === "completed" \? \(/);
  // Erased data cannot be erased twice, and that account is deactivated anyway.
  assert.match(src, /Your data has been erased/);
  assert.match(src, /Request erasure\s*<\/button>/);
});
