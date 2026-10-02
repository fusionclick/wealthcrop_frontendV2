// Audit #40 — the secondary email is "usable for account retrieval", and both it and the KYC
// details editor have to exist on a phone, not only in the desktop layout.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("the phone layout of /profile/basic renders the secondary email and KYC details", () => {
  const src = read("src/pages/profile/BasicDetails.jsx");
  const mobile = src.slice(src.indexOf("{/* Less than lg view */}"));
  assert.ok(mobile.length < src.length, "the mobile layout marker moved — update this test");

  // Before #40 both appeared once, above the marker, inside `hidden lg:block`.
  assert.match(mobile, /<SecondaryEmail userData=\{userData\} refetch=\{refetch\} \/>/);
  assert.match(mobile, /<KycDetails userData=\{userData\} refetch=\{refetch\} \/>/);
});

test("Forgot Password says a verified secondary email works, and shows the local link", () => {
  const src = read("src/components/ForgotPassword.jsx");
  assert.match(src, /secondary email you have verified/);
  // Production never sends dev_reset_links; locally it replaces the inbox.
  assert.match(src, /setDevLinks\(res\?\.dev_reset_links \|\| \[\]\)/);
  assert.match(src, /Local dev only/);
});

test("the reset form names the account the link resets", () => {
  // One link per account can reach a shared family mailbox.
  const src = read("src/pages/ResetPassword.jsx");
  assert.match(src, /Enter a new password for \{email \?/);
});
