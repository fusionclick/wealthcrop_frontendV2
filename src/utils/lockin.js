/**
 * QA 3.8 — the lock-in this app has always *displayed* was never once enforced. A three-year
 * ELSS bought last month took a redemption order without a word and left BSE to reject it.
 *
 * Pure and dependency-free on purpose: the dated lots come from taxlots.js and the scheme's
 * `lockIn` from /scheme-details, and neither belongs in here.
 *
 * The honest part is what this refuses to answer. `lockIn` arrives as `{ period, type, label }`
 * and `period` HAS NO FIXED UNIT — the unit is the sibling `type` string, normalised by the
 * backend to "year" / "month" / "day", except when BSE sent a unit it could not classify, in
 * which case `type` is that raw string (Backend/src/mf/scheme.js:238). `{period: 90, type:
 * "day"}` and `{period: 3, type: "year"}` are both real. A period whose unit we cannot read is
 * not a period we can measure, and guessing one would stamp "your money is locked" across a
 * plain liquid fund. BSE's `scheme_lockin_period` is empty on this host anyway — everything we
 * do see comes from the Kuvera years fallback — so "no lock-in data" is the normal answer here,
 * not the exception.
 */

// Singular is what the backend emits; the plural and the casing are tolerated because the raw
// BSE column ("Years") reaches `type` unchanged whenever it fails to classify.
const UNIT = /^(year|month|day)s?$/i;

const unitOf = (lockIn) => UNIT.exec(String(lockIn?.type || "").trim())?.[1].toLowerCase() || null;

/** A lock-in we can actually measure: a positive period AND a unit we recognise. */
const measurable = (lockIn) => Boolean(unitOf(lockIn)) && Number(lockIn?.period) > 0;

/** The day units bought on `bought` come free — free ON that day, not after it. */
export function unlockDate(bought, lockIn) {
  if (!measurable(lockIn) || !(bought instanceof Date) || Number.isNaN(bought.getTime())) return null;

  const period = Number(lockIn.period);
  const d = new Date(bought.getTime());
  // Calendar arithmetic, not period × 30 days: a three-year ELSS comes free on its anniversary,
  // and Kuvera's value is always a whole number of years (Backend/src/mf/kuvera.js:124).
  if (unitOf(lockIn) === "day") d.setDate(d.getDate() + Math.round(period));
  // ponytail: setMonth overflows 31 Jan + 1 month to 3 Mar, holding those units ~2 days past
  // the true anniversary. Clamp to the month end if anyone ever reports it.
  else d.setMonth(d.getMonth() + Math.round(unitOf(lockIn) === "year" ? period * 12 : period));
  return d;
}

/**
 * Split a holding's purchase lots into what may be redeemed today and what may not.
 *
 * Per lot, never per holding: an ELSS bought every month has its oldest installments free and
 * its newest locked, and "the whole holding is locked because the oldest lot is" would be both
 * wrong and the wrong way round.
 *
 * @param {object}  lockIn  the scheme's `{ period, type, label }`, or null
 * @param {Array}   lots    `[{ date: Date, units: number }]` — taxlots.js openLots for this folio
 * @param {Date}    today
 * @returns {{ status: string, lockedUnits: number, freeUnits: number, nextUnlock: Date|null }}
 *   "unknown"   — no positive lock-in we can measure. Never block, never warn: a false "your
 *                 money is locked" on a liquid fund is far worse than a missing guard.
 *   "unchecked" — a real lock-in, but no lots to check it against. Say so and allow: BSE rejects
 *                 a locked redemption itself, so this app must not be the thing that traps
 *                 someone's money on order history it could not read.
 *   "checked"   — lockedUnits / freeUnits / nextUnlock are real. Only this status may refuse.
 */
export function lockinSplit({ lockIn, lots = [], today = new Date() } = {}) {
  const none = { status: "unknown", lockedUnits: 0, freeUnits: 0, nextUnlock: null };
  if (!measurable(lockIn)) return none;

  const usable = lots.filter((l) => Number(l?.units) > 0);
  if (!usable.length) return { ...none, status: "unchecked" };

  let lockedUnits = 0;
  let freeUnits = 0;
  let nextUnlock = null;

  for (const lot of usable) {
    const units = Number(lot.units);
    const unlock = unlockDate(lot.date, lockIn);
    // An undated lot is a lot we cannot lock. Counting it as locked would be exactly the false
    // positive this function exists to avoid.
    if (!unlock || unlock <= today) {
      freeUnits += units;
      continue;
    }
    lockedUnits += units;
    if (!nextUnlock || unlock < nextUnlock) nextUnlock = unlock;
  }

  return { status: "checked", lockedUnits, freeUnits, nextUnlock };
}
