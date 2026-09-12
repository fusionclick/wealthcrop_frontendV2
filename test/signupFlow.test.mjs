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

test("the password rule accepts every password its own message describes", async () => {
  const { formSchema, resetPasswordSchema } = await import("../src/utils/FormSchema.js");
  const check = (password) => formSchema.safeParse({ username: "a", email: "a@b.com", password });

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
