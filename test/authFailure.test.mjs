// QA 14.12 — "toast shown but user didn't get directed to login page, he remained logged in but
// everything became non-accessible, so isn't it better user directed to login page with clean
// message". Yes. Every helper in api.js used to just toast and return null, so a deactivated or
// erased account kept its token and clicked around an app of empty shells forever.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/api/api.js", "utf8");

test("a dead session is ended in one shared interceptor, not per call site", () => {
  assert.match(src, /interceptors\.response\.use/);
  // Registered on BOTH clients: get helpers use the `api` instance, post helpers use bare axios.
  assert.match(src, /for \(const client of \[api, axios\]\)/);
  assert.match(src, /onAuthFailure/);
});

test("it clears the stored session and replaces the history entry", () => {
  assert.match(src, /localStorage\.removeItem\("token"\)/);
  assert.match(src, /localStorage\.removeItem\("currentAccount"\)/);
  // replace(), not assign()/href — the dead page must not come back with Back.
  assert.match(src, /window\.location\.replace\("\/login"\)/);
  assert.doesNotMatch(src, /window\.location\.href\s*=\s*"\/login"/);
});

test("it only fires for an authenticated request that the server says is finished", () => {
  // A 401 from the login form is a wrong password, not a dead session; redirecting on it would
  // put the user in a loop.
  assert.match(src, /status === 401 && sentToken/);
  assert.match(src, /config\?\.headers\?\.Authorization/);
  // And only for the messages that actually mean "this session is over".
  assert.match(src, /deactivated\|session \(invalid\|revoked\)\|unauthenticated/);
});

test("it cannot fire twice for a burst of parallel failed requests", () => {
  // A dashboard fires many requests at once; all of them 401 together.
  assert.match(src, /let ending = false/);
  assert.match(src, /if \(ending\) return/);
});

test("the SESSION_GONE pattern matches the server's real messages and not a password error", () => {
  const pattern = src.match(/const SESSION_GONE = (\/.*\/[a-z]*);/)[1];
  const re = new Function(`return ${pattern}`)();

  // Straight from VerifyJwtFingerprint and the deactivation check.
  assert.ok(re.test("This account has been deactivated. Please contact support."));
  assert.ok(re.test("Session invalid — please login again"));
  assert.ok(re.test("Session revoked — please login again"));

  // Must NOT match an ordinary credential failure.
  assert.ok(!re.test("Invalid credentials"));
  assert.ok(!re.test("Invalid OTP"));
  assert.ok(!re.test("These credentials do not match our records."));
});

// QA 7.1 — an erased investor was shown "User not authenticated". With the token removed, every
// request still in flight failed too and toasted into the single error slot, replacing the real
// reason; then the reload to /login wiped the toast, so the login screen said nothing at all.
test("the reason a session ended is held on screen and shown again on /login", () => {
  assert.match(src, /holdError\(message\)/);
  assert.match(src, /sessionStorage\.setItem\(END_REASON, message\)/);

  const toasts = readFileSync("src/utils/notifyCustom.js", "utf8");
  assert.match(toasts, /held \? undefined : toast\.error/);

  const login = readFileSync("src/auth/Login.jsx", "utf8");
  assert.match(login, /useState\(takeSessionEndReason\)/);
  assert.match(login, /role="alert"[\s\S]{0,300}\{endedReason\}/);
});
