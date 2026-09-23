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

test("ticket 22: the SWP is gated, the one-off redemption is not", () => {
  // The original rule here was "RedeemMF must not know about disclaimers at all", to stop
  // anyone gating a sell and locking an investor in. That reason survives, but it is about
  // the EXIT, not the page: ticket 22 names the SWP, and RedeemMF hosts both.
  //
  // So the notices are shown, and the gate applies only while the schedule is on.
  // useDisclaimers fails closed, so gating the one-off redemption too would mean a
  // /disclaimers outage traps the investor's money — which is the harm the old assertion
  // was really protecting against.
  const src = read("src/pages/mutual_fund/RedeemMF.jsx");
  assert.match(src, /useDisclaimers\(\)/, "the SWP must show the disclaimers");
  assert.match(src, /<OrderDisclaimers \{\.\.\.disc\} \/>/, "they must be rendered");
  assert.match(
    src,
    /disabled=\{[\s\S]{0,300}?sched\.on && !disc\.ready/,
    "the SWP must be gated on the acknowledgement"
  );
  assert.doesNotMatch(
    src,
    /disabled=\{[\s\S]{0,300}?\|\| !disc\.ready/,
    "a one-off redemption must never be blocked by the disclaimer gate — it is the exit"
  );
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
