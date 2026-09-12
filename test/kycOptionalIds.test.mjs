import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

// A valid Personal step with nothing optional supplied.
const personal = {
  name: "Ravi Kumar",
  dob: "1995-04-12",
  gender: "male",
  occupation: "employed",
  income: "100000",
  addrss1: "Flat 12, Green Park Society",
  city: "Pune",
  pin: "411001",
};

test("PAN and Aadhaar are optional on the KYC form", async () => {
  const { validateKycStep } = await import("../src/utils/FormSchema.js");

  assert.deepEqual(validateKycStep(0, { ...personal, pan: "", aadhar: "" }), {});
  assert.deepEqual(validateKycStep(0, personal), {}, "absent, not just empty");
  // Every other required field still is required.
  assert.ok(validateKycStep(0, { ...personal, pin: "" }).pin, "pincode is still required");
});

test("a PAN or Aadhaar that IS typed still has to be the right shape", async () => {
  const { validateKycStep } = await import("../src/utils/FormSchema.js");

  assert.match(validateKycStep(0, { ...personal, pan: "ABCDE123" }).pan, /ABCDE1234F/);
  assert.match(validateKycStep(0, { ...personal, aadhar: "1234" }).aadhar, /12 digits/);
  assert.deepEqual(validateKycStep(0, { ...personal, pan: "ABCPE1234F", aadhar: "123456789012" }), {});
  // 4th letter is the holder type — only P (individual) can hold a retail folio, and BSE
  // only says so at add_ucc, eleven screens later.
  assert.match(validateKycStep(0, { ...personal, pan: "ABCCE1234F" }).pan, /personal PAN/);
});

test("the Documents step can be passed with no uploads", async () => {
  const { validateKycStep } = await import("../src/utils/FormSchema.js");

  assert.deepEqual(validateKycStep(2, {}), {});
  assert.deepEqual(validateKycStep(2, { documentP: null, documentA: null }), {});
});

test("the Docs step no longer POSTs a file field that does not exist", () => {
  const kyc = read("src/components/kyc/KYC.jsx");
  // stepApiConfig[2] used to send `{type:"aadhaar", file: data.document}` — kycData has
  // documentA/documentP, never `document`. Unreachable while both uploads were mandatory
  // (the step auto-advanced); now Continue is the normal path.
  assert.doesNotMatch(kyc, /file: data\.document\b/);
  // A step with no API must still report success, not `true` (which has no .status).
  assert.match(kyc, /if \(!config\) return \{ status: true \}/);
});

test("PAN is still demanded before the BSE submit", () => {
  const kyc = read("src/components/kyc/KYC.jsx");
  // Optional on the form, required at add_ucc — with a route back to the Personal step.
  // "person.*" is what FIELD_STEP maps to step 0, so the Edit button lands correctly.
  assert.match(kyc, /PAN is required to register your account with BSE/);
  assert.match(kyc, /"person\.pan"/);
  assert.match(kyc, /Only an individual PAN can open this account/);
  // The server-side half of this guard lives in Backend/test/uccPan.test.js — the two
  // repos deploy separately, so neither test suite may reach across.
});

test("autofill needs no API key for pincode, IFSC or PAN shape", async () => {
  const { bankFromIfsc, readPan, panNameMismatch } = await import("../src/utils/kycAutofill.js");

  assert.equal(bankFromIfsc("SBIN0001234"), "State Bank of India");
  assert.equal(readPan("ABCPE1234F").holderType, "Individual");
  assert.match(panNameMismatch("ABCPE1234F", "Ravi Kumar"), /surname starting with "E"/);

  // Every bank name the map produces has to exist in the dropdown it fills, or the value
  // is unselectable and Laravel stores a bank_name nothing else recognises.
  const { banks } = await import("../src/utils/bank.js");
  const known = new Set(banks.map((b) => b.name));
  const ifscMap = read("src/utils/kycAutofill.js").match(/^  [A-Z]{4}: "(.+)",$/gm) || [];
  assert.ok(ifscMap.length >= 30, "IFSC table should not have silently shrunk");
  for (const line of ifscMap) {
    const name = line.match(/"(.+)"/)[1];
    assert.ok(known.has(name), `${name} is autofilled but not in utils/bank.js`);
  }
});
