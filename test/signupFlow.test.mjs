import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

test("signup card only collects details and hands off to /verify-otp", () => {
  const register = read("src/auth/Register.jsx");
  assert.match(register, /navigate\("\/verify-otp", \{ state: \{ form: formData \} \}\)/);
  // OTP boxes must not creep back into the signup card.
  assert.doesNotMatch(register, /otpRefs|setOtpSent|Verify OTP/);
});

test("otp screen verifies then continues to KYC, never straight to the dashboard", () => {
  const verify = read("src/auth/VerifyOtp.jsx");
  assert.match(verify, /navigate\("\/kyc", \{ replace: true \}\)/);
  assert.doesNotMatch(verify, /\/user\/stocks\/explore/);
  // Direct hits with no pending signup bounce back instead of rendering an empty form.
  assert.match(verify, /if \(!form\) return <Navigate to="\/signup" replace \/>/);
});

test("kyc completion drops the session and sends the user to sign in", () => {
  const kyc = read("src/components/kyc/KYC.jsx");
  assert.match(kyc, /dispatch\(logout\(\)\)/);
  assert.match(kyc, /navigate\("\/login", \{ replace: true \}\)/);
  assert.doesNotMatch(kyc, /toastSuccess\("UCC registered successfully!"\);\r?\n\s*navigate\("\/"\)/);
});

test("/verify-otp is routed", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/verify-otp" element=\{<VerifyOtp \/>\}/);
});

test("toasts come from react-hot-toast only", () => {
  assert.match(read("src/utils/notifyCustom.js"), /from "react-hot-toast"/);
  const app = read("src/App.jsx");
  assert.match(app, /<Toaster/);
  assert.doesNotMatch(app, /react-toastify/);
  assert.doesNotMatch(read("package.json"), /react-toastify/);
});
