// node --test — demo kit validity, plus the few KYC.jsx wiring facts a unit test cannot
// reach (which helper the page calls, what it no longer does). The verdict branching
// itself is tested directly in kycVerdict.test.mjs, not by grepping this file.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { KYC_DEMO } from "../src/utils/kycDemoData.js";
import { validateKycStep } from "../src/utils/FormSchema.js";

const kyc = readFileSync("src/components/kyc/KYC.jsx", "utf8");

test("demo kit passes the step schemas it fills (Personal, Bank, Nominee)", () => {
  for (const step of [0, 1, 3]) {
    assert.deepEqual(validateKycStep(step, { ...KYC_DEMO[step] }), {}, `step ${step}`);
  }
  assert.equal(KYC_DEMO[2], undefined, "docs step is file uploads — nothing to fill");
});

test("UCC registration carries the investor bearer, and the 2-minute poll is gone", () => {
  // Root cause of the 401: a bare axios.post reached Node's requireInvestor with no token.
  assert.doesNotMatch(kyc, /axios\.post\(uccUrl/);
  assert.doesNotMatch(kyc, /import axios from "axios"/);
  assert.match(kyc, /postApiWithToken\(uccUrl, payload/);
  // The verdict comes from Laravel's bse-status sync; polling getparticularucc only stalled the pending path.
  assert.doesNotMatch(kyc, /getparticularucc/);
});

test("the page never decides 'verified' itself — it asks the shared helper", () => {
  assert.match(kyc, /import \{[^}]*isKycVerified[^}]*reviewCopy[^}]*\} from "\.\.\/\.\.\/utils\/kycVerdict"/);
  assert.doesNotMatch(kyc, /kyc_status === "verified"/, "no second definition of verified in the page");
  assert.match(kyc, /const \{ heading, detail, verified, canRecheck \} = reviewCopy\(verdict, checking\)/);
});

test("a UCC that Laravel never stored is retried, not left orphaned", () => {
  // Otherwise bse-status answers 422 forever and a reload registers a second UCC on the same PAN.
  assert.match(kyc, /pendingUcc\.current = \{ ucc: clientCode, dp_id, client_id \}/);
  assert.match(kyc, /if \(pendingUcc\.current\) \{/);
  assert.match(kyc, /pendingUcc\.current = null;/);
});

test("KYC never auto-registers a mandate", () => {
  // This used to assert the opposite — that a mandate WAS registered once BSE verified the
  // UCC. The gate was right; the payload was not. mandateCreation() posted a hardcoded
  // fixture (someone else's VPA, a fixed 15000, a distributor ARN that is not ours) against
  // a real investor's UCC. A mandate is a payment authorisation, so it belongs to SIP setup
  // with the investor's own VPA, not to an automatic side effect of finishing KYC.
  assert.doesNotMatch(kyc, /^\s*mandateCreation\(/m, "no live call site may remain");
});

test("demo fill button is guarded by a literal import.meta.env.DEV expression", () => {
  assert.match(kyc, /\(import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_KYC_DEMO_FILL === "1"\) && KYC_DEMO\[step\]/);
  assert.match(kyc, /Fill BSE demo data/);
  assert.match(kyc, /import \{ KYC_DEMO \} from "\.\.\/\.\.\/utils\/kycDemoData"/);
});

test("the review step never ends on a spinner", () => {
  // "Your KYC is being submitted" used to spin forever when add_ucc failed: the catch only
  // fired a toast and isUccCreated stayed false.
  assert.match(kyc, /setUccError\(/, "the failure is captured, not just toasted");
  // the catch clears the loading state too, not only the success path
  assert.equal((kyc.match(/setIsUccCreated\(true\)/g) || []).length, 3, "success, catch, and the resume path");
  assert.match(kyc, /We could not submit your KYC/);
  assert.match(kyc, /Try again/);
  assert.match(kyc, /uccRequested\.current = false;/, "retry re-arms the one-shot guard");
});

test("BSE's answer from add_ucc is shown immediately", () => {
  assert.match(kyc, /const immediate = verdictFromUccStatus\(res\?\.data\?\.status\)/);
  assert.match(kyc, /if \(immediate\) setBseVerdict\(immediate\)/);
});
