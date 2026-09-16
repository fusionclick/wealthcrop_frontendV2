// Tickets 17 & 18 — SWP/STP intent, guard, and installment count.
// The money paths: amount × installments is what the investor sees, and the guards are the
// only thing between a bad intent and a BSE round trip. So they get checked directly.
import test from "node:test";
import assert from "node:assert/strict";
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
