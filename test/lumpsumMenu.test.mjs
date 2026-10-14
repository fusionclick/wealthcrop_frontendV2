// Audit #45 — signed in, the Mutual Funds menu had My Investments / External / Combined and no
// way to start a lump-sum investment; the "One-Time Investment" item lives in the logged-out
// mega menu and opens a static explainer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the signed-in Mutual Funds dropdown has Invest: Lumpsum, leading to the fund list", () => {
  const src = readFileSync("src/components/hovercomp/MutualFundsMenu.jsx", "utf8");
  // The signed-in panel body is SignedInMfSections, shared with the phone Funds tab (QA 8.2).
  const signedIn = src.slice(src.indexOf("export function SignedInMfSections"), src.indexOf("const MutualFundsMenu ="));
  assert.match(src, /\{openMenu && token && \([\s\S]*<SignedInMfSections \/>[\s\S]*MEGA MENU/);

  assert.match(signedIn, /title="Invest: Lumpsum"/);
  assert.match(signedIn, /navigate\(MF_EXPLORE_PATH\)/);
  // The shared constant, not a second copy of the path.
  assert.match(src, /import \{ MF_EXPLORE_PATH \} from "\.\.\/\.\.\/utils\/nodeApi"/);
});

test("QA 8.2 — the phone Funds tab renders the same signed-in panel, not a second list", () => {
  const dash = readFileSync("src/components/MFDashboard.jsx", "utf8");
  assert.match(dash, /import \{ SignedInMfSections \} from "\.\/hovercomp\/MutualFundsMenu"/);
  assert.match(dash, /<SignedInMfSections \/>/);
  assert.doesNotMatch(dash, /MOBILE_MF_LINKS/);
});
