import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) =>
  fs
    .readFileSync(p, "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

// Every flow that BUYS. A redemption is deliberately absent: the server does not gate a
// sell, because gating one would trap an investor in a fund their profile no longer
// permits, and a checkbox the server ignores is worse than no checkbox.
const BUYING_FLOWS = [
  "src/pages/mutual_fund/MutualFundInvestPage.jsx",
  "src/pages/mutual_fund/SIPSetupPage.jsx",
  "src/pages/mutual_fund/SwitchMF.jsx",
];

test("ticket 22: every buying flow shows the disclaimers", () => {
  for (const file of BUYING_FLOWS) {
    const src = read(file);
    assert.match(src, /useDisclaimers\(\)/, `${file} does not load the disclaimers`);
    // Matched on the spread, not on the exact tag: §1.B added per-scheme document and
    // commission links as extra props, and pinning the literal one-line form made a screen
    // that shows MORE disclosure look like one that shows none.
    assert.match(src, /<OrderDisclaimers[\s\S]{0,200}\{\.\.\.disc\}/, `${file} does not render them`);
  }
});

test("ticket 22: the acknowledgement travels with the order", () => {
  for (const file of BUYING_FLOWS) {
    assert.match(read(file), /acknowledged: disc\.acked/, `${file} submits without the acknowledgement`);
  }
});

test("ticket 22: submit is blocked until the required boxes are ticked", () => {
  for (const file of BUYING_FLOWS) {
    assert.match(read(file), /disabled=\{[\s\S]{0,300}?!disc\.ready/, `${file} can submit unacknowledged`);
  }
});

// Rewritten 2026-09-28 (QA 3.7). This used to assert that a one-off redemption was NEVER
// gated on the disclaimers. The reason was sound — useDisclaimers fails closed, so a
// /disclaimers outage would have trapped an investor's own money behind boxes that could
// never be ticked — but the consequence was that on the normal path the boxes could simply
// be ignored, which is exactly what QA reported: "without checking any box of disclaimer I
// could still redeem".
//
// The gate now keys off whether there is anything to tick rather than off the order type:
// a non-empty `required` means the list loaded and must be acknowledged; `[]` (fetch
// failed, or nothing required) and `null` (loading, or a hung request) never block the exit.
// That satisfies QA on the normal path and keeps the outage escape hatch intact.
test("ticket 22 / QA 3.7: the disclaimer gate binds when the notices loaded, and never traps the exit", () => {
  const src = read("src/pages/mutual_fund/RedeemMF.jsx");
  assert.match(src, /useDisclaimers\(\)/, "the disclaimers must be read");
  assert.match(src, /<OrderDisclaimers \{\.\.\.disc\} \/>/, "they must be rendered");

  // The gate is a non-empty required list plus an incomplete acknowledgement — nothing else.
  assert.match(
    src,
    /const mustAck =\s*Array\.isArray\(disc\.required\) && disc\.required\.length > 0 && !disc\.ready/,
    "the gate must be conditional on the notices having actually arrived"
  );
  assert.match(src, /disabled=\{[\s\S]{0,300}?mustAck/, "the submit button must honour it");

  // The old unconditional forms must not come back: `!disc.ready` on its own re-introduces
  // the outage lockout, and `sched.on && !disc.ready` re-introduces the ignorable boxes.
  assert.doesNotMatch(
    src,
    /disabled=\{[\s\S]{0,300}?\|\| !disc\.ready/,
    "an unconditional !disc.ready traps the exit when /disclaimers is down"
  );
  assert.doesNotMatch(
    src,
    /disabled=\{[\s\S]{0,300}?sched\.on && !disc\.ready/,
    "gating only the SWP leaves the one-off redemption's boxes ignorable"
  );
});

// QA 3.7 — "if I am redeeming 1000 Rs there is no mention how many units".
test("a redemption says roughly how many units it will sell", () => {
  const src = read("src/pages/mutual_fund/RedeemMF.jsx");
  // Reuses the existing helpers rather than a second copy of the arithmetic.
  assert.match(src, /unitsFor\(redeemAmount, navUsable \? navNow : null\)/);
  assert.match(src, /navLooksPlausible\(/, "a stale or wrong-scheme NAV must suppress the estimate");
  assert.match(src, /units at today's NAV/, "the figure must be shown to the investor");
  // It is an estimate: allotment happens at the NAV on the execution date.
  assert.match(src, /exact units are set by the NAV on the day the order executes/);
});

test("the text and the required list come from the server, not the bundle", () => {
  const src = read("src/components/mutual_fund/OrderDisclaimers.jsx");
  assert.match(src, /nodeUrl\("\/disclaimers"\)/);
  // required starts null = "not loaded". `ready` must be false then, or the first render
  // would let an order through before the server has said what must be acknowledged.
  assert.match(src, /useState\(null\)/);
  assert.match(src, /Array\.isArray\(required\) && required\.length > 0 && required\.every/);
});

test("the shipped fallback text is never enough to submit on", () => {
  const src = read("src/components/mutual_fund/OrderDisclaimers.jsx");
  // FALLBACK fills `text` so the box is not empty while loading, but it must not fill
  // `required` — otherwise a failed /disclaimers call would self-approve.
  assert.doesNotMatch(src, /setRequired\(Object\.keys\(FALLBACK\)\)/);
  assert.match(src, /catch\(\(\) => live && setRequired\(\[\]\)\)/);
});
