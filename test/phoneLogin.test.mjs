// Audit #37 / #41 — the primary phone is verified by OTP (Profile) and can then sign in, by OTP
// or with the password. SMS delivery itself is NEXT PHASE; locally the server returns the code.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isMobile, loginIdentity, passwordLoginSchema, otpLoginSchema } from "../src/utils/FormSchema.js";

const read = (p) => readFileSync(p, "utf8");

test("the login box sends an email as email and a mobile as phone", () => {
  assert.deepEqual(loginIdentity(" qa.investor@example.com "), { email: "qa.investor@example.com" });
  assert.deepEqual(loginIdentity("98765 43210"), { phone: "9876543210" });
  assert.deepEqual(loginIdentity("+91-9876543210"), { phone: "+919876543210" });
  assert.equal(isMobile("12345"), false);
  assert.equal(isMobile("5876543210"), false, "Indian mobiles start 6-9");
});

test("both login schemas take an email or a mobile, and nothing else", () => {
  for (const schema of [passwordLoginSchema, otpLoginSchema]) {
    const extra = schema === passwordLoginSchema ? { password: "Passw0rd!" } : { otp: "" };
    assert.ok(schema.safeParse({ email: "a@b.co", ...extra }).success);
    assert.ok(schema.safeParse({ email: "9876543210", ...extra }).success);
    assert.equal(schema.safeParse({ email: "not-an-id", ...extra }).success, false);
  }
});

test("Login posts the identity loginIdentity picks, on all three calls", () => {
  const src = read("src/auth/Login.jsx");
  assert.match(src, /postApi\(url, \{ \.\.\.loginIdentity\(data\.email\), password: data\.password \}\)/);
  assert.match(src, /postApi\(url, loginIdentity\(data\.email\)\)/);
  assert.match(src, /postApi\(url, \{ \.\.\.loginIdentity\(data\.email\), otp: enteredOtp \}\)/);
  // type="email" would make the browser refuse a mobile number before zod ever sees it.
  assert.match(src, /Email or mobile number/);
  assert.doesNotMatch(src, /type="email"/);
});

test("Profile shows the mobile number with OTP verification on both layouts", () => {
  const src = read("src/pages/profile/BasicDetails.jsx");
  const marker = src.indexOf("{/* Less than lg view */}");
  assert.match(src.slice(0, marker), /<PrimaryPhone userData=\{userData\} refetch=\{refetch\} \/>/);
  assert.match(src.slice(marker), /<PrimaryPhone userData=\{userData\} refetch=\{refetch\} \/>/);

  const phone = read("src/pages/profile/PrimaryPhone.jsx");
  assert.match(phone, /api\("\/phone\/send-otp"\)/);
  assert.match(phone, /api\("\/phone\/verify-otp"\)/);
});
