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
  // Was 3 — success, catch, resume. The 4th is the `stop()` helper, which now covers the
  // pre-flight guards (short address, malformed pincode, missing bank account). Those
  // three used to `return` after a toast alone, so the spinner ran forever with no error
  // shown and no way out. Raising the count records a new cleared path, not a weaker test.
  assert.equal((kyc.match(/setIsUccCreated\(true\)/g) || []).length, 4, "success, catch, resume, and the pre-flight guards");
  assert.match(kyc, /const stop = \(field, message, fix\) =>/, "guards fail like a BSE rejection");
  assert.match(kyc, /We could not submit your KYC/);
  assert.match(kyc, /Try again/);
  assert.match(kyc, /uccRequested\.current = false;/, "retry re-arms the one-shot guard");
});

test("a rejected field can actually be corrected", () => {
  // The live dead end: BSE rejected the pincode, and the only buttons were "Try again",
  // which resends identical data and fails identically, and "Continue to sign in". So KYC
  // could never complete and no mutual fund could be bought.
  assert.match(kyc, /const FIELD_STEP = \[/, "fields map to the step that owns them");
  // Assert the mapping, not the literal source: pull the step-0 pattern out and run BSE's
  // real field names through it. "person.first_name" is what alpha_special arrives with,
  // and it does NOT match the word "personal" — it only reached step 0 by falling through
  // to the default, which would have been wrong for a bank or nominee field.
  const step0 = kyc.match(/\[(\/\^\([^/]+\)\\b\/i), 0, "Personal details"\]/);
  assert.ok(step0, "step 0 pattern not found");
  const re = new RegExp(step0[1].slice(1, step0[1].lastIndexOf("/")), "i");
  for (const f of ["person.first_name", "address.pincode", "address.line1", "profile.dob"]) {
    assert.ok(re.test(f), `${f} must route to Personal details`);
  }
  for (const f of ["bank.account_number", "nominee.name"]) {
    assert.equal(re.test(f), false, `${f} must not route to Personal details`);
  }
  assert.match(kyc, /Edit \{target\[2\]\.toLowerCase\(\)\}/, "primary action goes back to that step");
  assert.match(kyc, /onEdit=\{\(target\) =>/);

  // BSE names the same problem once per address block; showing it twice is noise.
  assert.match(kyc, /const seen = new Set\(\)/);
  assert.match(kyc, /if \(seen\.has\(key\)\) return false/);
  // Its own fix hint is shown rather than dropped.
  assert.match(kyc, /\{e\.fix &&/);

  // The reason a correction would otherwise appear to do nothing: userData was fetched
  // once and never refreshed, so the UCC payload kept reading the OLD pincode.
  assert.match(kyc, /await refetch\(\);/, "fresh profile after each step submit");
  assert.equal((kyc.match(/await refetch\(\);/g) || []).length, 2, "step submit and retry");
});

test("BSE's answer from add_ucc is shown immediately", () => {
  // Was verdictFromUccStatus(res.data.status). add_ucc's own reply does not reliably carry
  // the UCC's status, so the page fell back to Laravel's separate bse-status sync — and
  // when that did not answer, the investor sat on "awaiting BSE verification" with nothing
  // useful to click. The server now looks the UCC up at BSE and returns the verdict as
  // `kyc`; verdictFromAddUcc prefers it and still falls back to the old field.
  assert.match(kyc, /const immediate = verdictFromAddUcc\(res\?\.data\)/);
  assert.match(kyc, /if \(immediate\) setBseVerdict\(immediate\)/);
});

test("the typed legal name actually reaches the server", () => {
  // The form has always shown "Full Name (as per PAN)", but the step-0 payload had
  // `// name: data.name` commented out, so the value was discarded and the UCC payload
  // fell back to the signup username — which BSE rejected as alpha_special.
  assert.match(kyc, /getPayload: \(data\) => \(\{[\s\S]{0,600}?\n\s*name: data\.name,/);
  assert.doesNotMatch(kyc, /^\s*\/\/\s*name: data\.name,\s*$/m, "must not be commented out again");
  // And it is checked before the last step, where it used to be a dead end.
  assert.match(kyc, /\/\^\[A-Za-z\]\[A-Za-z \.'\]\*\$\/\.test\(holderName\)/);
  assert.match(kyc, /"person\.first_name"/, "the guard names the field the UI routes on");
});
