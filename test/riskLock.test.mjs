import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

// QA 8.7 — the profiler locked for 6 months on the server, and the browser only found out
// after nine answers and a Submit.
test("the profiler page reads the lock on mount, not from the submit 403", () => {
  const page = read("src/pages/riskProfile/RiskProfilingPage.jsx");
  assert.match(page, /useEffect\(/, "the page must ask on mount");
  assert.match(page, /getApiWithToken\(`\$\{import\.meta\.env\.VITE_URL\}\/risk\/profile`\)/);
  // Locked renders instead of the questionnaire, and still shows the profile and the date.
  assert.match(page, /if \(lock\.locked\)/);
  assert.match(page, /lock\.next_allowed_at/);
  assert.match(page, /lock\.current_profile/);
});

test("the read endpoint exists and reuses the service's own 6-month rule", () => {
  assert.match(
    read("../admin_php/routes/api.php"),
    /get\('risk\/profile', \[RiskProfileController::class, 'current'\]\)/
  );
  const controller = read("../admin_php/app/Http/Controllers/Api/RiskProfileController.php");
  assert.match(controller, /public function current\(\): JsonResponse/);
  assert.match(controller, /\$this->service->retakeStatus\(\$user->id\)/);

  // One copy of the rule: the query and the 6-month window are each written once, and
  // calculateAndStore reads the same helper the GET does.
  const service = read("../admin_php/app/Services/RiskProfileService.php");
  assert.equal(service.match(/where\('expires_at', '>', now\(\)\)/g).length, 1);
  assert.match(service, /\$status = \$this->retakeStatus\(\$userId\);/);
});

// Both entry buttons compared a date string against a millisecond number, so isReUpdate was
// always false: every investor was warned off, first-timers with "Invalid Date".
test("the string-vs-number guard is gone from both entry points", () => {
  for (const f of ["src/pages/Profile.jsx", "src/pages/profile/BasicDetails.jsx"]) {
    const src = read(f);
    assert.doesNotMatch(src, /updated_at < Date\.now\(\)/, `${f} still compares a string to a number`);
    assert.doesNotMatch(src, /isReUpdate/, `${f} still holds its own copy of the guard`);
    assert.match(src, /canRetakeRiskProfile\(userData\?\.risk_profile\)/, `${f} must use the shared guard`);
    // No button may skip the guard and jump straight to the profiler.
    assert.doesNotMatch(src, /onClick=\{\(\) => navigate\("\/risk"\)\}/, `${f} bypasses the guard`);
  }
});

test("the shared guard always lets a first-timer through and only blocks a live profile", async () => {
  const { canRetakeRiskProfile } = await import("../src/utils/riskLock.js");
  const iso = (ms) => new Date(Date.now() + ms).toISOString();
  const DAY = 86400000;

  assert.equal(canRetakeRiskProfile(undefined), true, "never profiled must never be blocked");
  assert.equal(canRetakeRiskProfile(null), true);
  assert.equal(canRetakeRiskProfile({}), true, "a row with no dates cannot lock anyone out");
  assert.equal(
    canRetakeRiskProfile({ next_allowed_at: iso(120 * DAY) }),
    false,
    "a retake date in the future is a lock"
  );
  assert.equal(canRetakeRiskProfile({ next_allowed_at: iso(-DAY) }), true, "past the date, allowed");
  assert.equal(
    canRetakeRiskProfile({ next_allowed_at: iso(120 * DAY), is_active: false }),
    true,
    "a deactivated profile does not lock — the server does not count it either"
  );
  // next_allowed_at missing on older rows; expires_at is set to the same instant.
  assert.equal(canRetakeRiskProfile({ expires_at: iso(120 * DAY) }), false);
  // An unreadable date must not lock anyone out — that is the bug being fixed.
  assert.equal(canRetakeRiskProfile({ next_allowed_at: "not a date" }), true);
});
