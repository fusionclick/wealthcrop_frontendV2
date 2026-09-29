import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { lockinSplit, unlockDate } from "../src/utils/lockin.js";

// The shape /scheme-details actually delivers: `period` with its unit in the sibling `type`.
// Kuvera's fallback — the only one that fires on this host — is always years.
const years = (n) => ({ period: n, type: "year", label: `${n} years` });
const lot = (iso, units) => ({ date: new Date(iso), units });

const TODAY = new Date("2026-09-28");

test("every lot still inside the period is locked, and none of it is redeemable", () => {
  const split = lockinSplit({ lockIn: years(3), lots: [lot("2025-04-10", 30)], today: TODAY });

  assert.equal(split.status, "checked");
  assert.equal(split.lockedUnits, 30);
  assert.equal(split.freeUnits, 0);
  assert.equal(split.nextUnlock.getFullYear(), 2028);
  assert.equal(split.nextUnlock.getMonth(), 3); // April — the anniversary, not +1095 days
  assert.equal(split.nextUnlock.getDate(), 10);
});

test("a lot past its anniversary is free, and the anniversary itself already counts as free", () => {
  const free = lockinSplit({ lockIn: years(3), lots: [lot("2020-01-01", 30)], today: TODAY });
  assert.equal(free.lockedUnits, 0);
  assert.equal(free.freeUnits, 30);
  assert.equal(free.nextUnlock, null);

  // SEBI's three years are redeemable ON the third anniversary, not the day after.
  const onTheDay = lockinSplit({ lockIn: years(3), lots: [lot("2023-09-28", 30)], today: TODAY });
  assert.equal(onTheDay.freeUnits, 30, "the unlock date is inclusive");
});

// The case that matters: nobody buys an ELSS once.
test("an ELSS bought monthly is locked per lot, not all-or-nothing", () => {
  const split = lockinSplit({
    lockIn: years(3),
    lots: [
      lot("2022-06-10", 5), // free
      lot("2023-06-10", 7), // free
      lot("2024-02-10", 6), // locked until Feb 2027 — the next tranche
      lot("2024-08-10", 6), // locked until Aug 2027
    ],
    today: TODAY,
  });

  assert.equal(split.lockedUnits, 12);
  assert.equal(split.freeUnits, 12);
  // The oldest lot being locked must not condemn the whole holding, and the newest lot being
  // free must not release it either.
  assert.equal(split.status, "checked");
  // "the date the next tranche unlocks" — the earliest locked lot, not the last.
  assert.equal(split.nextUnlock.getFullYear(), 2027);
  assert.equal(split.nextUnlock.getMonth(), 1); // February
});

test("an unknown lock-in never locks anything", () => {
  const lots = [lot("2026-09-01", 30)]; // bought weeks ago: locked under any real period

  for (const lockIn of [
    null,
    undefined,
    {},
    { period: 3 }, // a period with no unit at all
    { period: 3, type: null },
    // BSE's unit column reaches `type` raw when the backend cannot classify it. "3 somethings"
    // is not a duration, and guessing would freeze a liquid fund.
    { period: 3, type: "Fortnights" },
    { period: "", type: "year" },
  ]) {
    const split = lockinSplit({ lockIn, lots, today: TODAY });
    assert.equal(split.status, "unknown", `${JSON.stringify(lockIn)} must not be measured`);
    assert.equal(split.lockedUnits, 0);
    assert.equal(unlockDate(new Date("2026-09-01"), lockIn), null);
  }
});

test("a zero or negative lock-in never locks anything", () => {
  // Kuvera sends 0 for every fund without one (PPFAS Flexi Cap 0, Axis ELSS 3), so this is
  // the single most common value in the feed.
  for (const period of [0, -1, -3]) {
    const split = lockinSplit({ lockIn: { period, type: "year" }, lots: [lot("2026-09-01", 30)], today: TODAY });
    assert.equal(split.status, "unknown", `period ${period} is not a lock-in`);
    assert.equal(split.lockedUnits, 0);
  }
});

test("a known lock-in with no lots is reported unchecked, never as locked", () => {
  // /orderHistory unreachable, empty, or an account that moved in from another platform.
  for (const lots of [[], undefined, [{ date: new Date("2026-09-01"), units: 0 }]]) {
    const split = lockinSplit({ lockIn: years(3), lots, today: TODAY });
    assert.equal(split.status, "unchecked");
    assert.equal(split.lockedUnits, 0, "unprovable is not the same as locked");
    assert.equal(split.freeUnits, 0, "and it is not a free-unit allowance either");
  }

  // An undated lot cannot be locked, so it counts as free rather than vanishing from the total.
  const mixed = lockinSplit({ lockIn: years(3), lots: [{ date: null, units: 4 }, lot("2025-04-10", 6)], today: TODAY });
  assert.equal(mixed.freeUnits, 4);
  assert.equal(mixed.lockedUnits, 6);
});

test("months and days are honoured as months and days, not as the same number", () => {
  const bought = new Date("2026-06-10");
  assert.equal(unlockDate(bought, { period: 90, type: "day" }).getMonth(), 8); // September
  assert.equal(unlockDate(bought, { period: 90, type: "month" }).getFullYear(), 2033);
  // The whole reason `period` may not be read without `type`.
  assert.notDeepEqual(
    unlockDate(bought, { period: 90, type: "day" }),
    unlockDate(bought, { period: 90, type: "month" })
  );
});

test("RedeemMF refuses a locked redemption using the shared logic", () => {
  const src = fs.readFileSync(new URL("../src/pages/mutual_fund/RedeemMF.jsx", import.meta.url), "utf8");

  assert.match(src, /import \{ lockinSplit \} from "\.\.\/\.\.\/utils\/lockin"/, "the pure logic must not be duplicated");
  // Lots come from the existing tax-lot builder, and from openLots so past sales are excluded.
  assert.match(src, /matchLots\(orders, \{ method: "fifo" \}\)\.openLots/);
  // Only a measured lock-in may refuse.
  assert.match(src, /lock\.status !== "checked" \|\| lock\.lockedUnits <= 0\s*\?\s*null/);
  // "Redeem all units" is refused while anything is locked.
  assert.match(src, /"Redeem all units" is not possible until then/);
  assert.match(src, /estUnits > lock\.freeUnits/, "an amount over the free units must be refused");
  // The refusal reaches the investor, names the unlock date, and blocks the button.
  assert.match(src, /units are locked in/);
  assert.match(src, /fmtDate\(isoDay\(lock\.nextUnlock\)\)/);
  assert.match(src, /toastError\(refusal\)/);
  assert.match(src, /disabled=\{[\s\S]{0,300}?Boolean\(refusal\)/);
});

// QA 3.8 (re-report: "refuse ni hoa, order chala gaya") — /scheme-details returns no lock-in
// for most schemes on this host, so the guard fell through even for ELSS. RedeemMF now
// synthesises the statutory 3-year ELSS lock-in from the scheme CATEGORY, which the holding
// carries, so an ELSS bought within 3 years is refused without depending on the flaky field.
test("RedeemMF derives an ELSS lock-in from the category when scheme-details has none", () => {
  const src = fs.readFileSync("src/pages/mutual_fund/RedeemMF.jsx", "utf8");
  // The category fallback exists and only fires for ELSS.
  assert.match(src, /elss\[\s-\]\*linked\|tax\[\s-\]\*saver|elss.*equity.*tax.*saver/i);
  assert.match(src, /effectiveLockIn/);
  assert.match(src, /period: 3, type: "year"/);
  // And the guard + lots fetch key off the effective lock-in, not the raw one that is usually null.
  assert.match(src, /enabled: !!ucc && Boolean\(effectiveLockIn\)/);
  assert.match(src, /lockinSplit\(\{ lockIn: effectiveLockIn, lots \}\)/);
});

test("a synthesised 3-year ELSS lock refuses a recent purchase, per lot", () => {
  // This is the exact object RedeemMF builds for an ELSS holding with no scheme-details lock-in.
  const elss = { period: 3, type: "year", label: "3 years (ELSS)" };
  // Bought 5 months ago → still locked.
  const recent = lockinSplit({ lockIn: elss, lots: [lot("2026-04-20", 100)], today: TODAY });
  assert.equal(recent.status, "checked");
  assert.equal(recent.lockedUnits, 100);
  assert.equal(recent.freeUnits, 0);
  // Bought 4 years ago → free.
  const old = lockinSplit({ lockIn: elss, lots: [lot("2022-04-20", 100)], today: TODAY });
  assert.equal(old.lockedUnits, 0);
  assert.equal(old.freeUnits, 100);
});
