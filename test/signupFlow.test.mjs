import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

test("signup card only collects details and hands off to /verify-otp", () => {
  const register = read("src/auth/Register.jsx");
  // The dev-only OTP passthrough rides along in navigate state; local mail gets dropped
  // by temp-mail domains, so the verify screen shows the code in dev builds.
  assert.match(register, /navigate\("\/verify-otp", \{ state: \{ form: formData, otp: res\?\.otp \} \}\)/);
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

// Rewritten 2026-09-27. This used to assert the opposite — that finishing KYC dropped the
// session and bounced to /login. SRS §2 (QA 1.2) says verifying the OTP logs the investor in
// with no second login, and QA hit exactly that: sign up, verify, fill in the whole of KYC,
// then be asked to log in again. The assertion now pins the corrected contract.
test("kyc completion keeps the session and lands on the dashboard", () => {
  const kyc = read("src/components/kyc/KYC.jsx");
  assert.doesNotMatch(kyc, /dispatch\(logout\(\)\)/);
  assert.doesNotMatch(kyc, /navigate\("\/login", \{ replace: true \}\)/);
  assert.match(kyc, /navigate\("\/", \{ replace: true \}\)/);
  // The PIN screen is still the first thing after onboarding, so the expiry must be cleared.
  assert.match(kyc, /localStorage\.removeItem\("pin_expiry"\)/);
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

test("the password rule accepts every password its own message describes", async () => {
  const { formSchema, resetPasswordSchema } = await import("../src/utils/FormSchema.js");
  // phone is part of the signup schema since 2026-09-27 (SRS §2 / QA 1.1); it is fixed
  // here so this test keeps measuring the password rule and nothing else.
  const check = (password) =>
    formSchema.safeParse({ username: "a", email: "a@b.com", phone: "9876543210", password });

  // Reported from the live signup form: this satisfies the printed rule in every respect
  // and was still rejected, because "." was not one of the six symbols the regex counted
  // as special AND the regex also whitelisted which characters a password may contain.
  assert.equal(check("Johndoe1234.").success, true, "a full stop is a special character");
  for (const p of ["Johndoe1234!.", "Str0ng-Pass", "A1b#cdef", "Passw0rd_x", "Aa1 space!"]) {
    assert.equal(check(p).success, true, `${p} should be accepted`);
  }
  // Nothing may be forbidden — a rule that bans characters only shrinks the search space.
  assert.equal(check("Aa1£€¥§±").success, true, "non-ASCII symbols are still symbols");

  // The four requirements still hold, and each says which one failed.
  const fails = {
    "Johndoe1234": /special character/,   // no symbol
    "johndoe1234.": /uppercase/,
    "JOHNDOE1234.": /lowercase/,
    "Johndoedoe.": /number/,
    "Aa1!": /at least 8/,
  };
  for (const [p, re] of Object.entries(fails)) {
    const r = check(p);
    assert.equal(r.success, false, `${p} should be rejected`);
    assert.match(r.error.issues[0].message, re, `wrong message for ${p}`);
  }

  // Laravel validates 'password' => 'required|min:8' on register/login/reset. A 6- or
  // 7-character password used to pass here and come back a 422 contradicting the screen.
  assert.equal(check("Aa1!aaa").success, false, "7 chars must not reach the server");
  assert.equal(check("Aa1!aaaa").success, true, "8 chars is the server's floor");

  // Reset uses the same rule rather than its own stale copy of the regex.
  assert.equal(resetPasswordSchema.safeParse({ newPassword: "Johndoe1234." }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ newPassword: "short1!" }).success, false);

  // The old whitelist-and-six-symbols regex must not come back anywhere.
  assert.doesNotMatch(read("src/utils/FormSchema.js"), /\[A-Za-z\d@\$!%\*\?&\]\{6,\}/);
});

// SRS §2 (QA 1.1) — the signup form did not ask for a phone number at all, and the server
// accepted a registration without one.
test("signup collects a phone number, on both sides of the wire", async () => {
  const { formSchema } = await import("../src/utils/FormSchema.js");
  const signup = (phone) =>
    formSchema.safeParse({ username: "a", email: "a@b.com", phone, password: "Johndoe1234." });

  assert.equal(signup("9876543210").success, true);
  assert.equal(signup("").success, false, "phone is required");
  assert.equal(signup("98765").success, false, "10 digits or nothing");
  assert.equal(signup("1234567890").success, false, "Indian mobiles start 6-9");
  assert.equal(signup("98765432101").success, false, "11 digits is not a mobile number");

  // The field has to be on the card, and the value has to reach the server — Register
  // posts the whole form object, so the input's name is the contract.
  assert.match(read("src/auth/Register.jsx"), /\{\.\.\.register\("phone"\)\}/);
  const auth = read("../admin_php/app/Http/Controllers/Api/AuthController.php");
  assert.match(auth, /'phone'\s*=>\s*'required\|digits:10\|unique:users,phone'/);
  // Recorded, never asserted: there is no SMS gateway, so it must not claim verified.
  assert.match(auth, /'is_phone_verified'\s*=>\s*false/);
});

// SRS §15.2 (QA 2.6) — /kyc and the other investor-data routes had no route-level gate,
// so a logged-out visitor got the page and only the API refused.
test("investor-data routes are gated at the route, not just by the API", () => {
  const app = read("src/App.jsx");
  assert.match(app, /const guard = \(element\) => \(token \? element : <Navigate to="\/login" replace \/>\)/);
  for (const path of ["/kyc", "/portfolio", "/goals", "/reports", "/advisor", "/user/approvals", "/risk"]) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    assert.match(app, new RegExp(esc(`path="${path}" element={guard(`)), `${path} must be guarded`);
  }
});

// SRS §3 (QA 2.7/2.8) — the PAN-change approval pipeline existed on the server and had no
// way in: the only screen posting to kyc/profile was the one-time onboarding form.
test("profile can edit PAN, city and occupation after KYC", () => {
  const kycDetails = read("src/pages/profile/KycDetails.jsx");
  assert.match(kycDetails, /postApiWithToken\(api\("\/kyc\/profile"\)/);
  assert.match(kycDetails, /pan_change_pending/);
  assert.match(read("src/pages/profile/BasicDetails.jsx"), /<KycDetails userData=\{userData\} refetch=\{refetch\} \/>/);

  // A partial save must not blank the fields it did not send - saveProfile used to read
  // every column off the request, so posting three fields nulled dob/aadhaar/address.
  const kycController = read("../admin_php/app/Http/Controllers/Api/KycController.php");
  assert.match(kycController, /if \(\$request->has\(\$field\)\) \{/);
  assert.doesNotMatch(kycController, /'aadhaar_number' => \$request->aadhaar_number,/);
});
