// QA has filed this same bug four times — Advisor/Goals, Calculators (10.1), Community
// (11.1), Learning Centre — always as "the button doesn't exist after login, but it exists
// before login". One cause: MoreMenu holds these links and is rendered
// `{!token && <MoreMenu/>}`, gated `!token` internally too, so it is a logged-OUT menu.
//
// And there are TWO signed-in surfaces, because App renders
// `{(!token || isLg) && <OldHeader/>}` — below 1024px a logged-in investor has no header at
// all, only BottomHeader, whose Profile tab is the only way in. A link added to the desktop
// dropdown alone is still invisible to every mobile user.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCOUNT_LINKS } from "../src/utils/accountLinks.js";

const read = (p) => readFileSync(p, "utf8");

test("every investor section an investor owns is in the shared account list", () => {
  const paths = ACCOUNT_LINKS.map((l) => l.to);
  for (const p of [
    "/advisor",
    "/goals",
    "/reports",
    "/user/approvals",
    "/calculators",
    "/learning-centre",
    "/community",
  ]) {
    assert.ok(paths.includes(p), `${p} must be reachable from the account menu`);
  }
  // Every entry needs a label and an icon, or it renders as an invisible row.
  for (const l of ACCOUNT_LINKS) {
    assert.ok(l.label && l.Icon, `${l.to} is missing a label or icon`);
  }
  assert.equal(new Set(paths).size, paths.length, "a duplicated path renders the row twice");
});

test("both signed-in surfaces render the shared list, not their own copy", () => {
  for (const f of ["src/components/OldHeader.jsx", "src/pages/Profile.jsx"]) {
    const src = read(f);
    assert.match(src, /from "\.\.\/utils\/accountLinks"/, `${f} must import the shared list`);
    assert.match(src, /ACCOUNT_LINKS\.map\(/, `${f} must render it`);
    // A second inline copy is how these drifted apart in the first place.
    assert.doesNotMatch(src, /const ACCOUNT_LINKS = \[/, `${f} must not keep its own copy`);
  }
});

test("the logged-out mega-menu is still the logged-out one", () => {
  // Not a regression to fix — MoreMenu is correctly for visitors. This pins WHY the account
  // list has to exist separately, so nobody "simplifies" it back into MoreMenu.
  const more = read("src/components/hovercomp/MoreMenu.jsx");
  assert.match(more, /!token/, "MoreMenu is gated to signed-out visitors by design");
});
