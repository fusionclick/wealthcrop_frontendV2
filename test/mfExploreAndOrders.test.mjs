import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");
// "this string must not come back" has to look at the code, not at the comment that
// explains why it went away — otherwise every such assertion fails on its own rationale.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

test("plan filter names the plans the way the scheme names do", () => {
  const explore = read("src/pages/mutual_fund/ExploreMF.jsx");
  // "Regular (business)" / "Direct (normal)" described nothing real — both are retail
  // plans, and the difference is the distributor commission in the expense ratio.
  assert.doesNotMatch(code("src/pages/mutual_fund/ExploreMF.jsx"), /\(business\)|\(normal\)/);
  assert.match(explore, /\["regular", "Regular plan"\]/);
  assert.match(explore, /\["direct", "Direct plan"\]/);
});

test("the fund list opens on physical holdings", () => {
  const explore = read("src/pages/mutual_fund/ExploreMF.jsx");
  assert.match(explore, /DEFAULT_FILTERS = \{ plan: "", sip: "", mode: "physical" \}/);
  assert.match(explore, /useState\(DEFAULT_FILTERS\)/);
  // "Held as" must open on the default, so Physical has to be the first option.
  assert.match(explore, /options: \[\["physical", "Physical"\]/);
  // The green "you narrowed this" styling compares against the default, not against
  // empty — otherwise Held as is green before anyone has touched it.
  assert.match(explore, /filters\[f\.key\] !== DEFAULT_FILTERS\[f\.key\]/);
  assert.doesNotMatch(explore, /Object\.values\(filters\)\.some\(Boolean\)/);
});

test("the investments page offers history, not three buttons that go backwards", () => {
  const dash = read("src/pages/mutual_fund/DashBoardMF.jsx");
  // Manage SIPs repeated the SIPs tab; portfolio-level Redeem/Switch opened an empty
  // picker for a fund the investor was already looking at.
  assert.doesNotMatch(code("src/pages/mutual_fund/DashBoardMF.jsx"), /Manage SIPs|manage-sip/);
  assert.match(dash, /navigate\("\/user\/mutual_fund\/orders"\)/);
  assert.match(dash, /Order history/);
});

test("redeem and switch stay reachable, on the fund they act on", () => {
  const dash = read("src/pages/mutual_fund/DashBoardMF.jsx");
  const sheet = read("src/components/mutual_fund/HoldingSheet.jsx");

  // Both carry the scheme so the target page opens filled in, never blank.
  assert.match(dash, /navigate\("\/mutual_fund\/switch", \{\s*state: \{/);
  assert.match(sheet, /navigate\("\/mutual_fund\/switch", \{/);
  assert.match(dash, /navigate\("\/mutual_fund\/redeem", \{/);
  assert.match(sheet, /navigate\("\/mutual_fund\/redeem", \{/);

  // Switch is internal-only: an externally bought holding has no BSE folio to switch out of.
  assert.match(sheet, /isInternal && \(/);
});

test("SwitchMF preselects the fund it was opened for", () => {
  const sw = read("src/pages/mutual_fund/SwitchMF.jsx");
  assert.match(sw, /useLocation/);
  // Holdings arrive after first render, so the preselect waits for them, and it never
  // overwrites a choice the investor has already made.
  assert.match(sw, /if \(srcText \|\| !holdings\.length\) return/);
  // Same scheme can sit in more than one folio; the folio disambiguates.
  assert.match(sw, /!pre\.folio \|\| String\(h\.folio \|\| ""\) === String\(pre\.folio\)/);
});

test("the orders page is routed and reachable from the tab bar", () => {
  assert.match(read("src/App.jsx"), /<Route path="orders" element=\{<OrdersMF \/>\} \/>/);
  assert.match(read("src/components/MFDashboard.jsx"), /\{ name: "Orders", link: "orders" \}/);
});

test("the orders page reads BSE dates by shape, never through new Date(string)", () => {
  const orders = read("src/pages/mutual_fund/OrdersMF.jsx");
  // BSE sends dd-mm-yyyy on some endpoints. `new Date("03-04-2026")` is March in one
  // browser and April in another, and an order date off by a month is worse than none.
  assert.match(orders, /const dmy = \/\^\(/, "dd-mm-yyyy is parsed by shape");
  assert.doesNotMatch(code("src/pages/mutual_fund/OrdersMF.jsx"), /new Date\(/);
  // Rejected orders are the reason this page exists; BSE's reason lives in `remarks`.
  assert.match(orders, /o\.remarks/);
});
