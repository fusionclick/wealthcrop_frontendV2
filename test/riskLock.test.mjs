import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

// Audit #23 / #70 — DELIBERATE REQUIREMENT CHANGE. These tests used to prove the profiler was
// LOCKED for 6 months (QA 8.7: shown up front instead of after a 403). The client's demo
// script retakes the questionnaire on the spot — "Questionnaire dobara bharo, profile
// recalculate" — so a retake is allowed at any time, every attempt is kept, and the 6-month
// date became a "review due" reminder. The lock assertions were replaced, not weakened.

test("the profiler page has no lock: it shows the current profile, its review date and the history", () => {
  const page = read("src/pages/riskProfile/RiskProfilingPage.jsx");
  assert.match(page, /getApiWithToken\(`\$\{import\.meta\.env\.VITE_URL\}\/risk\/profile`\)/);
  assert.doesNotMatch(page, /lock\.locked/, "the lock screen is gone");
  assert.doesNotMatch(page, /Retake allowed from/);
  // Review due is a reminder next to a working Retake button.
  assert.match(page, /overview\.review_due/);
  assert.match(page, /onClick=\{\(\) => setStarted\(true\)\}/);
  // The previous result and its date, before the retake and on the result screen.
  assert.match(page, /previous\.profile/);
  assert.match(page, /before\.profiled_at/);
  assert.match(page, /history\.map/);
});

test("the read endpoint reports the overview and the POST no longer refuses a retake", () => {
  assert.match(
    read("../admin_php/routes/api.php"),
    /get\('risk\/profile', \[RiskProfileController::class, 'current'\]\)/
  );
  const controller = read("../admin_php/app/Http/Controllers/Api/RiskProfileController.php");
  assert.match(controller, /public function current\(\): JsonResponse/);
  assert.match(controller, /\$this->service->overview\(/);
  assert.doesNotMatch(controller, /,\s*403\)/, "no retake is refused any more");

  const service = read("../admin_php/app/Services/RiskProfileService.php");
  assert.doesNotMatch(service, /where\('expires_at', '>', now\(\)\)/, "the 6-month lock query is gone");
  assert.doesNotMatch(service, /retakeStatus/);
  // History, not overwrite: older attempts are deactivated, never deleted.
  assert.match(service, /UserRiskProfile::where\('user_id', \$userId\)->update\(\['is_active' => false\]\)/);
  assert.doesNotMatch(service, /->delete\(\)/);
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

test("the shared guard lets every investor retake, whatever the dates say", async () => {
  const { canRetakeRiskProfile } = await import("../src/utils/riskLock.js");
  const iso = (ms) => new Date(Date.now() + ms).toISOString();
  const DAY = 86400000;

  assert.equal(canRetakeRiskProfile(undefined), true, "never profiled");
  assert.equal(canRetakeRiskProfile({ next_allowed_at: iso(120 * DAY) }), true, "inside the old 6-month window");
  assert.equal(canRetakeRiskProfile({ expires_at: iso(120 * DAY), is_active: true }), true);
});

// Audit #56 — the profile questions the spec names, sent with each attempt and validated.
test("the profile questions match what the server validates, and are sent with the nine answers", () => {
  const questions = read("src/pages/riskProfile/riskQuestions.js");
  const request = read("../admin_php/app/Http/Requests/RiskProfileRequest.php");

  // Every option code the page offers is one the server accepts, field by field.
  const block = request.match(/PROFILE_OPTIONS = \[([\s\S]*?)\];/)[1];
  const server = Object.fromEntries(
    [...block.matchAll(/'(\w+)'\s*=>\s*\[([^\]]*)\]/g)].map((m) => [m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])])
  );
  for (const key of ["annual_income", "employment_type", "total_assets", "total_liabilities", "investment_experience", "primary_goal"]) {
    const section = questions.split(`key: "${key}"`)[1].split("key:")[0];
    const offered = [...section.matchAll(/\["([^"]+)",/g)].map((m) => m[1]);
    assert.deepEqual(offered, server[key], `${key}: page and server disagree`);
  }
  assert.match(request, /'age' => \['required', 'integer', 'between:18,100'\]/);

  // The page sends them alongside the nine — and only the nine are scored server-side.
  const page = read("src/pages/riskProfile/RiskProfilingPage.jsx");
  assert.match(page, /ABOUT_KEYS\.map\(\(k\) => \[k, about\[k\]\]\)/);
  assert.match(page, /they do not change your risk score/);
});
