// node --test src/utils/FormSchema.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateKycStep } from "./FormSchema.js";

const goodPersonal = {
  name: "Asha Kumar", pan: "ABCDE1234F", aadhar: "972205890456",
  dob: "1995-04-12", gender: "female", occupation: "employed",
  income: "50,000 - 1,00,000", addrss1: "Flat 12, Green Park Society",
  addrss2: "", city: "Mumbai", state: "", pin: "400001", mStatus: "", fName: "",
};

test("clean personal step passes", () => {
  assert.deepEqual(validateKycStep(0, goodPersonal), {});
});

test("every bad field reports at once, not just the first", () => {
  const e = validateKycStep(0, { ...goodPersonal, pan: "202222222", aadhar: "12", pin: "0", city: "" });
  assert.deepEqual(Object.keys(e).sort(), ["aadhar", "city", "pan", "pin"]);
});

test("date of birth rejects junk, future dates and minors", () => {
  const bad = (dob) => validateKycStep(0, { ...goodPersonal, dob }).dob;
  assert.ok(bad("202222222"), "junk rejected");
  assert.ok(bad("2999-01-01"), "future rejected");
  assert.ok(bad(new Date(Date.now() - 10 * 31557600000).toISOString().slice(0, 10)), "10 yr old rejected");
  assert.equal(bad("1995-04-12"), undefined);
});

test("bank step checks account and ifsc shape", () => {
  assert.deepEqual(validateKycStep(1, { accountNo: "123456789012", ifsc: "SBIN0001234" }), {});
  const e = validateKycStep(1, { accountNo: "12", ifsc: "sbin1" });
  assert.ok(e.accountNo && e.ifsc);
});

test("docs step needs both uploads", () => {
  assert.deepEqual(Object.keys(validateKycStep(2, {})).sort(), ["documentA", "documentP"]);
  assert.deepEqual(validateKycStep(2, { documentP: {}, documentA: {} }), {});
});

test("nominee percentage stays within 1-100", () => {
  const n = (p) => validateKycStep(3, { nomineeName: "Ravi K", nomineeRelation: "Brother", nomineePercentage: p });
  assert.deepEqual(n("50"), {});
  assert.ok(n("0").nomineePercentage);
  assert.ok(n("150").nomineePercentage);
  assert.ok(n("abc").nomineePercentage);
});
