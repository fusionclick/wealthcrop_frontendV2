import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * QA 5.5 / 5.7 — the custom-Portfolios feature existed but could not be reached.
 *
 * Both findings are about wiring, not arithmetic, so these read the source: there is no
 * renderer here, and a test that mounted the dashboard would need BSE, AMFI and a KYC'd
 * investor in the store before it could tell you whether a prop is passed.
 */

const at = (p) => new URL(p, import.meta.url);
const read = (p) => fs.readFileSync(at(p), "utf8");
// Assertions must look at the code, not at the comment explaining it — otherwise a
// rationale mentioning the thing counts as the thing.
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

const EXTERNAL = "../src/pages/mutual_fund/ExternalMF.jsx";
const DASH = "../src/pages/mutual_fund/DashBoardMF.jsx";

test("external holdings can be filed into a portfolio — all three props reach HoldingSheet", () => {
  const src = readCode(EXTERNAL);
  const sheet = /<HoldingSheet([\s\S]*?)\/>/.exec(src);
  assert.ok(sheet, "ExternalMF no longer renders HoldingSheet");
  for (const prop of ["portfolios=", "currentPortfolioId=", "onAssignPortfolio="]) {
    assert.match(sheet[1], new RegExp(prop), `HoldingSheet is missing ${prop} — the assign select never renders`);
  }
  // Same hook as the investments tab, so a portfolio created on one shows on the other.
  assert.match(src, /import usePortfolios, \{ holdingKey \} from "\.\.\/\.\.\/hooks\/usePortfolios"/);
});

test("the external key is ext:<id>, never the bse: form", () => {
  const src = readCode(EXTERNAL);
  // holdingKey() defaults to "internal"; calling it without the source would write a
  // bse:| key for a holding BSE has never heard of, and the assignment would land on
  // nothing. Every call on this page names the source.
  const calls = [...src.matchAll(/holdingKey\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(calls.length > 0, "ExternalMF does not build a holding key at all");
  for (const args of calls) {
    assert.match(args, /,\s*"external"/, `holdingKey(${args}) omits the source — that writes a bse: key`);
  }

  // The form itself, and the server's own rule for it.
  assert.match(readCode("../src/hooks/usePortfolios.js"), /source === "external"\s*\?\s*`ext:\$\{holding\?\.id\}`/);
  assert.match(
    read("../../admin_php/app/Http/Controllers/Api/PortfolioController.php"),
    /ext:\\d\+/,
    "the server no longer accepts ext:<digits> — the key format moved"
  );
});

test("an account with no holdings still reaches Portfolios and Spread", () => {
  const src = readCode(DASH);
  const split = src.indexOf(") : (");
  assert.ok(split > 0, "the hasInvestments branch is gone — re-check this assertion");
  const empty = src.slice(src.indexOf("!hasInvestments ? ("), split);

  assert.match(empty, /No investments yet/, "wrong half of the branch");
  // The dead end: this half used to hold nothing but the illustration and Explore Funds,
  // so a CAS-only account could never create the portfolio its External tab needs.
  assert.match(empty, /\{actions\}/, "empty state has no Spread / Order history — dead end again");
  assert.match(empty, /\{portfolioBar\}/, "empty state has no portfolios bar — dead end again");

  // One definition rendered in both halves, not two copies that drift.
  assert.equal((src.match(/<PortfolioBar/g) || []).length, 1);
  assert.match(src, /navigate\("\/mutual_fund\/spread"\)/);
});

test("the investments tab is labelled for the investor, not for us", () => {
  const tabs = readCode("../src/components/MFDashboard.jsx");
  const tab = /\{\s*name:\s*"([^"]+)",\s*link:\s*"investments"\s*\}/.exec(tabs);
  assert.ok(tab, "the investments tab is gone from MFDashboard");
  assert.doesNotMatch(tab[1], /Internal/, "nobody looks for their own funds under 'Internal'");
  assert.equal(tab[1], "My Investments");
});
