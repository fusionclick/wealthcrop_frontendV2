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
    assert.match(src, /<OrderDisclaimers \{\.\.\.disc\} \/>/, `${file} does not render them`);
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

test("ticket 22: a redemption is not gated", () => {
  // Not an oversight — asserted so nobody "fixes" it later and locks an investor in.
  assert.doesNotMatch(read("src/pages/mutual_fund/RedeemMF.jsx"), /useDisclaimers/);
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
