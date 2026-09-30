// QA — /profile/basic: KYC-filled values never showed, occupation appeared twice, and no field
// could actually be saved. These pin the parts that are pure logic plus the wiring that broke.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateField, fieldConfig, yearsSince } from "../src/utils/profileFields.js";

const TODAY = new Date("2026-09-30");

test("date of birth: 18+, not future, not absurd", () => {
  assert.equal(validateField("dob", "1990-05-10", TODAY), "");
  assert.match(validateField("dob", "2030-01-01", TODAY), /future/);
  assert.match(validateField("dob", "2015-01-01", TODAY), /18 years/);
  assert.match(validateField("dob", "1800-01-01", TODAY), /real date/);
  assert.match(validateField("dob", "not-a-date", TODAY), /valid date/);
  // Exactly 18 today is allowed; one day short is not.
  assert.equal(validateField("dob", "2008-09-30", TODAY), "");
  assert.match(validateField("dob", "2008-10-01", TODAY), /18 years/);
});

test("gender and marital status only accept the known values", () => {
  assert.equal(validateField("gender", "male", TODAY), "");
  assert.match(validateField("gender", "Male ", TODAY), /Choose male/); // trimmed but case-sensitive
  assert.match(validateField("gender", "banana", TODAY), /Choose male/);
  assert.equal(validateField("marital_status", "married", TODAY), "");
  assert.match(validateField("marital_status", "Marreid", TODAY), /Choose single/);
});

test("pincode is exactly six digits", () => {
  assert.equal(validateField("pincode", "400001", TODAY), "");
  assert.match(validateField("pincode", "40001", TODAY), /6 digits/);
  assert.match(validateField("pincode", "4000011", TODAY), /6 digits/);
  assert.match(validateField("pincode", "40000a", TODAY), /6 digits/);
});

test("income refuses negatives and non-numbers, accepts 0", () => {
  assert.equal(validateField("income", "0", TODAY), "");
  assert.equal(validateField("income", "500000", TODAY), "");
  assert.match(validateField("income", "-5", TODAY), /negative/);
  assert.match(validateField("income", "abc", TODAY), /number/);
});

test("email is stricter than type=email (john@gmail must fail)", () => {
  assert.equal(validateField("email", "john@gmail.com", TODAY), "");
  assert.match(validateField("email", "john@gmail", TODAY), /valid email/);
});

test("names reject digits and symbols", () => {
  assert.equal(validateField("fname", "Abdul Rahman", TODAY), "");
  assert.match(validateField("fname", "Abdul123", TODAY), /letters/);
  assert.equal(validateField("city", "Mumbai", TODAY), "");
  assert.match(validateField("city", "Mumbai1", TODAY), /letters/);
});

test("an empty value is always refused, whatever the field", () => {
  for (const f of ["dob", "gender", "pincode", "income", "email", "fname", "city"]) {
    assert.match(validateField(f, "   ", TODAY), /Enter a value/, f);
  }
});

test("fieldConfig never returns undefined", () => {
  // The old getFieldConfig fell off a switch and the modal threw on config.label.
  for (const t of ["dob", "gender", "pincode", "nope", "", undefined]) {
    const c = fieldConfig(t);
    assert.ok(c && typeof c.label === "string" && typeof c.button === "string", String(t));
  }
  assert.equal(fieldConfig("gender").inputType, "select");
  assert.equal(fieldConfig("dob").inputType, "date");
});

test("yearsSince counts the birthday itself", () => {
  assert.equal(yearsSince(new Date("2000-09-30"), TODAY), 26);
  assert.equal(yearsSince(new Date("2000-10-01"), TODAY), 25);
});

test("BasicDetails reads the profile relation, not userData, and drops the duplicate occupation", () => {
  const src = readFileSync("src/pages/profile/BasicDetails.jsx", "utf8");

  // dob/gender/income/address come off the profile relation now.
  assert.match(src, /const p = userData\?\.profile/);
  assert.doesNotMatch(src, /userData\?\.dob/, "dob was read off users, which has no dob column");

  // The hardcoded UCC is gone.
  assert.doesNotMatch(src, /1254789658/);
  assert.match(src, /userData\?\.kyc\?\.ucc_code/);

  // Occupation is rendered once — by KycDetails — not as a second dead row.
  assert.match(src, /<KycDetails/);
  assert.doesNotMatch(src, /label="Occupation"/);

  // Every row that should be editable has an edit handler.
  for (const t of ["dob", "gender", "maritalStatus", "income", "father'sName", "address_line1", "state", "pincode"]) {
    assert.ok(src.includes(`openEdit("${t}")`), `no edit wired for ${t}`);
  }

  // Every <EditModal .../> call site must pass the save handler AND prefill the current value.
  // The mobile copy used to omit handleChangeDetails, so Save called undefined and did nothing.
  const callSites = [...src.matchAll(/<EditModal\b[\s\S]*?\/>/g)].map((m) => m[0]);
  assert.equal(callSites.length, 2, "expected a desktop and a mobile EditModal");
  for (const [i, site] of callSites.entries()) {
    assert.match(site, /handleChangeDetails=\{handleChangeDetails\}/, `EditModal #${i + 1} cannot save`);
    assert.match(site, /initial=\{CURRENT_VALUE\[editType\]/, `EditModal #${i + 1} does not prefill`);
  }
});
