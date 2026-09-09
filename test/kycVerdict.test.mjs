// node --test — the Review step's branching, tested where it lives.
import assert from "node:assert/strict";
import test from "node:test";
import { isKycVerified, verdictFrom, verdictFromUccStatus, reviewCopy, BSE_UNREACHABLE } from "../src/utils/kycVerdict.js";

test("verified covers every spelling the DB and validateInvestorReady accept", () => {
  for (const s of ["verified", "approved", "complete", "VERIFIED", "Approved"]) {
    assert.equal(isKycVerified(s), true, s);
  }
  for (const s of ["pending", "rejected", "", null, undefined, "unknown"]) {
    assert.equal(isKycVerified(s), false, String(s));
  }
});

test("verdictFrom carries BSE's answer; a null bse block means nothing was stored", () => {
  const ok = verdictFrom({ kyc_status: "verified", bse: { ucc_status: "APPROVED", reasons: [] } });
  assert.deepEqual(ok, { kyc_status: "verified", ucc_status: "APPROVED", reasons: [], error: "" });

  const unreachable = verdictFrom({ kyc_status: "pending", bse: null });
  assert.equal(unreachable.error, BSE_UNREACHABLE.error, "same copy as a thrown request");
  assert.deepEqual(unreachable.reasons, []);

  // Laravel answering without kyc_status must never read as verified.
  assert.equal(verdictFrom({}).kyc_status, "pending");
  assert.equal(verdictFrom(undefined).kyc_status, "pending");
  assert.deepEqual(verdictFrom({ bse: { reasons: "not-an-array" } }).reasons, []);
});

test("pending keeps the guidance and appends BSE's reason, never replaces it", () => {
  const c = reviewCopy({ kyc_status: "pending", reasons: ["KYC not found"] });
  assert.match(c.detail, /KYC not found/);
  assert.match(c.detail, /Check again in a moment/, "raw BSE phrase alone tells the user nothing");
  assert.equal(c.canRecheck, true);
  assert.equal(c.verified, false);
});

test("rejected is terminal — no Check again, and copy that says so", () => {
  const c = reviewCopy({ kyc_status: "rejected", reasons: [] });
  assert.equal(c.heading, "BSE could not verify your KYC");
  assert.equal(c.canRecheck, false, "re-asking BSE cannot change a rejection");
  assert.match(c.detail, /support/i);
  assert.doesNotMatch(c.detail, /Check again/);
});

test("verified hides the re-check and says the user can invest", () => {
  const c = reviewCopy({ kyc_status: "approved", reasons: [] });
  assert.equal(c.verified, true);
  assert.equal(c.canRecheck, false);
  assert.match(c.detail, /start investing/);
});

test("an unreachable BSE stays re-checkable and says the status is unchanged", () => {
  const c = reviewCopy(BSE_UNREACHABLE);
  assert.equal(c.canRecheck, true);
  assert.match(c.detail, /status is unchanged/);
});

test("while checking, the detail says only that", () => {
  assert.equal(reviewCopy({ kyc_status: "pending", reasons: ["x"] }, true).detail, "Checking with BSE…");
});

test("no verdict yet reads as pending, not verified", () => {
  const c = reviewCopy(null);
  assert.equal(c.verified, false);
  assert.equal(c.canRecheck, true);
});

test("add_ucc's own status is enough to show the verdict — no second round trip", () => {
  // On the BSE demo add_ucc answers APPROVED straight away, so the page must not sit on a
  // loader waiting for the get_ucc sync just to say the same thing.
  assert.deepEqual(verdictFromUccStatus("APPROVED"), {
    kyc_status: "verified", ucc_status: "APPROVED", reasons: [], error: "",
  });
  assert.equal(verdictFromUccStatus("approved").kyc_status, "verified", "case-insensitive");
  assert.equal(verdictFromUccStatus("PENDING_VERIFICATION").kyc_status, "pending");
  assert.equal(verdictFromUccStatus("REJECTED").kyc_status, "rejected");
});

test("an unfamiliar ucc_status yields nothing, so the server's sync decides", () => {
  for (const s of ["SOMETHING_NEW", "", null, undefined]) {
    assert.equal(verdictFromUccStatus(s), null, String(s));
  }
});

test("the KYC name is validated the way BSE validates it, and is actually saved", async () => {
  const { validateKycStep } = await import("../src/utils/FormSchema.js");
  const { KYC_DEMO } = await import("../src/utils/kycDemoData.js");
  const base = { ...KYC_DEMO[0] };
  const nameErr = (name) => validateKycStep(0, { ...base, name }).name;

  // The live rejection: a signup handle reached BSE as the holder name.
  assert.match(nameErr("Minhal128"), /letters only/i);
  assert.match(nameErr("A"), /required/i);
  for (const bad of ["Ravi_Kumar", "Ravi@Kumar", "Ravi 2nd", "123", " "]) {
    assert.ok(nameErr(bad), `${bad} should be rejected`);
  }
  // BSE accepts letters, spaces, "." and "'" — real names must still pass.
  for (const ok of ["Ramesh Kumar Sharma", "R. K. Sharma", "D'Souza", "Mary Anne"]) {
    assert.equal(nameErr(ok), undefined, `${ok} should be accepted`);
  }

});
