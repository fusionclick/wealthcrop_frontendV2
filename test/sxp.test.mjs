// Tickets 17 & 18 — SWP/STP intent, guard, and installment count.
// The money paths: amount × installments is what the investor sees, and the guards are the
// only thing between a bad intent and a BSE round trip. So they get checked directly.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSxpIntent, sxpIntentError, SXP_BUCKET } from "../src/utils/sxp.js";
import { installmentCount } from "../src/utils/sipDates.js";

const src = { scheme_bse_code: "119551", folio: "12345/78", scheme_isin: "INF204K01K15" };
const sched = { freq: "m", day: 5, startDate: "2026-10-05", endDate: "2027-10-05", installments: 12 };

test("installmentCount turns two dates into BSE's count, per frequency", () => {
  assert.equal(installmentCount("2026-10-05", "2027-10-05", "m"), 12);
  assert.equal(installmentCount("2026-10-05", "2027-10-05", "q"), 4);
  assert.equal(installmentCount("2026-10-05", "2027-10-05", "w"), 52);
  // End on/before start, or an unknown frequency, is not a schedule.
  assert.equal(installmentCount("2027-10-05", "2026-10-05", "m"), 0);
  assert.equal(installmentCount("2026-10-05", "2027-10-05", "x"), 0);
});

test("an STP reads STP-OUT, an SWP its own bucket", () => {
  assert.equal(SXP_BUCKET.swp, "swp");
  assert.equal(SXP_BUCKET.stp, "stpOut");
});

test("SWP intent carries no dest, STP carries one; amount is a number", () => {
  const swp = buildSxpIntent({ type: "swp", source: src, amount: "2000", schedule: sched });
  assert.equal(swp.data.sxp_type, "swp");
  assert.equal(swp.data.dest_scheme, undefined);
  assert.equal(swp.data.amount, 2000);
  assert.equal(swp.data.folio, "12345/78");

  const stp = buildSxpIntent({ type: "stp", source: src, destCode: "120503", amount: 2000, schedule: sched });
  assert.equal(stp.data.dest_scheme, "120503");
});

test("sxpIntentError blocks the things BSE would reject", () => {
  assert.equal(sxpIntentError({ type: "swp", source: src, amount: 2000, schedule: sched }), null);
  // No folio, no amount, invalid start day, no schedule.
  assert.match(sxpIntentError({ type: "swp", source: { ...src, folio: "" }, amount: 2000, schedule: sched }), /folio/i);
  assert.match(sxpIntentError({ type: "swp", source: src, amount: 0, schedule: sched }), /amount/i);
  assert.match(sxpIntentError({ type: "swp", source: src, amount: 2000, schedule: { ...sched, installments: 0 } }), /end date/i);
  assert.match(sxpIntentError({ type: "swp", source: src, amount: 2000, schedule: { ...sched, startDayInvalid: true } }), /date/i);
  // STP into the same fund it comes out of is a no-op BSE refuses.
  assert.match(sxpIntentError({ type: "stp", source: src, destCode: "119551", amount: 2000, schedule: sched }), /same/i);
  assert.match(sxpIntentError({ type: "stp", source: src, destCode: "", amount: 2000, schedule: sched }), /destination/i);
});

// QA 3.10 — the test plan asks for register, modify and cancel on manage-swp/manage-stp.
// BSE offers no modify for either, so "Change" registers the replacement and then retires
// the old registration. The ORDER matters: cancelling first risks ending up with no plan at
// all if the registration is the half that fails.
test("retireReplacedPlan reports both plans running rather than losing one", async () => {
  const { retireReplacedPlan } = await import("../src/utils/sxp.js");

  // Nothing to replace: a plain registration must not be told anything.
  assert.equal(await retireReplacedPlan({ type: "swp", regNo: null, cancelXsp: () => { throw new Error("must not be called"); } }), null);

  // Clean replacement: the caller's own success message stands.
  let asked = null;
  assert.equal(
    await retireReplacedPlan({ type: "swp", regNo: "R123", cancelXsp: (r) => { asked = r; return { status: true }; } }),
    null
  );
  assert.equal(asked, "R123", "the old registration number must be the one cancelled");

  // The dangerous case: the new plan is live and the old one would not die. The investor
  // has to be told, by name, that two are running — silence here means a double withdrawal.
  for (const failing of [() => null, () => Promise.reject(new Error("BSE down"))]) {
    const msg = await retireReplacedPlan({ type: "stp", regNo: "R9", cancelXsp: failing });
    assert.match(msg, /both are running/i);
    assert.match(msg, /STP/, "the message must name the plan type");
  }
});

test("manage-swp/stp can register and change, not only cancel", () => {
  const src = readFileSync("src/components/sip/ManageSxpPage.jsx", "utf8");
  // Register is no longer hidden behind the empty state.
  assert.match(src, /Start a \{what\}/);
  assert.doesNotMatch(src, /No \{what\} running\.[\s\S]{0,200}?Start a \{what\}/, "register must not be empty-state only");
  // Change hands the plan's own values to the start form, with its reg_no to retire.
  assert.match(src, /replaceRegNo: row\.reg_no \|\| row\.id/);
  assert.match(src, /Change \{what\}/);
  // Both start forms honour it.
  for (const f of ["src/pages/mutual_fund/RedeemMF.jsx", "src/pages/mutual_fund/SwitchMF.jsx"]) {
    assert.match(readFileSync(f, "utf8"), /retireReplacedPlan\(/, `${f} must retire the replaced plan`);
  }
});
