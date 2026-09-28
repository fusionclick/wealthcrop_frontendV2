import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

// SRS FR 6.1 / §12 (QA 6.2) — a price alert used to be stored for any free text the user
// typed. RunAlerts then got no price for it, skipped it on every run, and the investor was
// never told the alert could not be evaluated: it just sat "Watching" forever.
test("an alert target is checked against the exchange before the row is written", () => {
  const controller = read("../admin_php/app/Http/Controllers/Api/NotificationController.php");

  // The guard sits in storeAlert, ahead of the create — a row that cannot be evaluated
  // must never reach the table in the first place.
  const guard = controller.indexOf("stockIsListed($market, $data['target'])");
  assert.ok(guard > 0, "storeAlert must check the target is listed");
  assert.ok(guard < controller.indexOf("PriceAlert::create("), "the check must run before the insert");

  // Only a clear negative refuses. An unavailable scrip master answers nothing, and
  // reading that as "no such symbol" would refuse every real alert during an outage.
  assert.match(controller, /return \$market->stockListQuick\(1\) === \[\];/);
  assert.match(controller, /catch \(\\Throwable \$e\) \{\s*report\(\$e\);\s*return true;/);
});

test("the rejection the user sees is the server's own message, not a generic one", () => {
  const page = read("src/pages/Notifications.jsx");
  const api = read("src/api/api.js");

  // createAlert is deliberately not silent, so the shared wrapper toasts message from the
  // 422 body. A generic toast in the page's failure path would mask the real reason.
  assert.match(read("src/api/notifications.js"), /createAlert = \(payload\) => postApiWithToken\(url\("\/alerts"\), payload\)/);
  assert.match(api, /toastError\(error\.response\?\.data\?\.message \|\| error\.response\?\.data\?\.error \|\| "API Error"\)/);
  assert.doesNotMatch(page, /if \(res\?\.status\)[\s\S]*?\} else \{/);

  // The form keeps what was typed when the server refuses it, so the symbol can be fixed
  // rather than re-entered: BLANK is only restored on success.
  assert.match(page, /if \(res\?\.status\) \{\s*setForm\(BLANK\);/);
});
