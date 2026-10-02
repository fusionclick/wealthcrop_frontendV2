// Phase 1, engineer A — fund discovery & catalogue (client demo points #1-#11).
// Source checks for the screens, plus the real route table run through React Router's own
// matcher, so "old links still work" is proven rather than assumed.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { matchRoutes } from "react-router";
import { fundPath, fundBuyPath, fundSipPath } from "../src/utils/nodeApi.js";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
// Comments explain why something went away; they must not satisfy "it is gone".
const code = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

test("#1 fund links carry the ISIN only, and every old link still routes", () => {
  const app = read("../src/App.jsx");
  const routes = [...app.matchAll(/path="(\/mutual_fund\/[^"]*)"/g)].map((m) => ({ path: m[1] }));
  const routeOf = (url) => matchRoutes(routes, url)?.[0]?.route.path;

  // New, ISIN-only links.
  assert.equal(fundPath("INF879O01027", "PP001ZG-GR"), "/mutual_fund/INF879O01027");
  assert.equal(routeOf(fundPath("INF879O01027", "PP001ZG-GR")), "/mutual_fund/:isin");
  assert.equal(routeOf(fundSipPath("INF879O01027", "PP001ZG-GR")), "/mutual_fund/:isin/sip");
  for (const url of [fundPath("INF879O01027", "PP001ZG-GR"), fundSipPath("INF879O01027", "PP001ZG-GR")]) {
    assert.ok(!url.includes("PP001ZG-GR"), `${url} still carries the BSE code`);
  }
  // The Invest page reads its scheme only from the URL, and one ISIN can carry both an IDCW
  // payout and a reinvestment code — so its link keeps the exact code (reported, not hidden).
  assert.equal(routeOf(fundBuyPath("INF879O01027", "PP001ZG-GR")), "/mutual_fund/:isin/:code/buy");

  // Bookmarks and notification links from before keep reaching the same pages.
  assert.equal(routeOf("/mutual_fund/INF879O01027/PP001ZG-GR"), "/mutual_fund/:isin/:code");
  assert.equal(routeOf("/mutual_fund/INF879O01027/PP001ZG-GR/buy"), "/mutual_fund/:isin/:code/buy");
  assert.equal(routeOf("/mutual_fund/INF879O01027/PP001ZG-GR/sip"), "/mutual_fund/:isin/:code/sip");

  // Literal pages are never swallowed by the new one-segment fund route.
  for (const page of ["compare", "redeem", "switch", "spread", "sip-setup", "manage-sip", "manage-swp", "manage-stp"]) {
    assert.equal(routeOf(`/mutual_fund/${page}`), `/mutual_fund/${page}`, `/mutual_fund/${page} is matched as an ISIN`);
  }
});

test("#1 a link remembers its exact code for the session (one ISIN can carry two options)", async () => {
  const { fundCodeFor } = await import("../src/utils/nodeApi.js");
  const store = new Map();
  globalThis.sessionStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  try {
    // BSE files SBI ESG's IDCW payout (SB007-DP) and reinvestment (007-DR) under one ISIN.
    assert.equal(fundPath("INF200K01206", "SB007-DP"), "/mutual_fund/INF200K01206");
    assert.equal(fundCodeFor("INF200K01206"), "SB007-DP");
    fundPath("INF200K01206", "007-DR");
    assert.equal(fundCodeFor("INF200K01206"), "007-DR", "the latest click wins");
    assert.equal(fundCodeFor("INF000NOTSEEN"), undefined);
  } finally {
    delete globalThis.sessionStorage;
  }
  // No storage at all (private mode, tests): links still build, the page resolves by ISIN.
  assert.equal(fundPath("INF1", "X"), "/mutual_fund/INF1");
  assert.equal(fundCodeFor("INF1"), undefined);
});

test("#1 the fund page works from the ISIN alone and canonicalises old addresses", () => {
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  assert.match(fd, /enabled: !!isin,/, "the details query still waits for a BSE code");
  assert.match(fd, /location\.state\?\.code/, "the code from Explore/Search/Compare is not picked up from router state");
  assert.match(fd, /fundCodeFor\(isin\)/, "the code of the link clicked this session is not used");
  assert.match(fd, /navigate\(canonical, \{ replace: true/, "an old /:isin/:code address is not rewritten to the ISIN");
  // An IDCW plan's address names its option: its ISIN is shared with the sibling option.
  assert.match(fd, /\?option=\$\{realOption\}/);
  assert.match(fd, /postApi\(detailsUrl, \{ isin, scheme_code: code, option \}\)/);
  // Explore, Search and Compare hand the exact code over without putting it in the URL.
  for (const file of ["../src/pages/mutual_fund/ExploreMF.jsx", "../src/components/SearchPopup.jsx", "../src/pages/mutual_fund/CompareMF.jsx"]) {
    assert.match(read(file), /state: \{ code/, `${file} drops the BSE code instead of passing it in state`);
  }
  // The comparison URL is ISIN-only too, with the codes in router state.
  assert.match(code("../src/pages/mutual_fund/ExploreMF.jsx"), /state: \{ codes: Object\.fromEntries/);
  assert.match(code("../src/pages/mutual_fund/CompareMF.jsx"), /code \|\| stateCodes\?\.\[key\]/);
});

test("#1 the ISIN is on Explore rows and Search results; fallback labels never print the code", () => {
  assert.match(read("../src/pages/mutual_fund/ExploreMF.jsx"), /\{fund\.scheme_isin\} · /);
  assert.match(read("../src/components/SearchPopup.jsx"), /\{asset\.scheme_isin\}/);
  const orders = code("../src/pages/mutual_fund/OrdersMF.jsx");
  assert.doesNotMatch(orders, /o\.scheme_name \|\| o\.scheme_bse_code/);
  assert.match(orders, /o\.scheme_isin \|\| "Unnamed scheme"/);
  assert.doesNotMatch(read("../src/pages/mutual_fund/ExternalMF.jsx"), /Linked:[^\n]*scheme_bse_code/);
});

test("#2 minimums are BSE's, the platform's (labelled), or N/A — never invented", () => {
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  for (const invented of ["?? 500", "?? 5000", "?? 1000"]) {
    assert.ok(!fd.includes(`base.minSip ${invented}`) && !fd.includes(`base.minLumpsum ${invented}`) && !fd.includes(`base.minRedeem ${invented}`), `an invented minimum (${invented}) is back`);
  }
  assert.match(fd, /\(platform minimum\)/);
  assert.match(fd, /amount == null \? "N\/A"/);
  // A scheme that does not take a SIP shows no SIP minimum.
  assert.match(fd, /"SIP not offered"/);
  // The second-investment line is the additional-purchase minimum, not the redemption one.
  assert.doesNotMatch(fd, /minRedeem \|\| fundsList\?\.minLumpsum/);
  assert.match(fd, /minText\(fundsList\?\.minAdditional, fundsList\?\.minSource\?\.additional\)/);
});

test("#3 core parameters stay on screen with N/A, and lock-in is shown in Compare", () => {
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  assert.doesNotMatch(fd, /\.filter\(\(\[, v\]\) => v\)/, "empty core-parameter tiles are still dropped");
  assert.match(fd, /\{value \|\| "N\/A"\}/);
  const cmp = code("../src/pages/mutual_fund/CompareMF.jsx");
  assert.match(cmp, />Lock-in</);
  assert.match(cmp, /f\.lockIn\?\.label \|\| "N\/A"/);
});

test("#4 an unknown risk level is 'Not rated', never drawn as Moderate; Search shows the badge", () => {
  const rm = code("../src/components/Riskometer.jsx");
  assert.doesNotMatch(rm, /risk \|\| "Moderate"/);
  assert.doesNotMatch(rm, /index === -1 \? 2/);
  assert.match(rm, /"Not rated"/);
  assert.match(code("../src/components/SearchPopup.jsx"), /<RiskBadge risk=\{asset\.risk\} \/>/);
});

test("#5 the fund page sends no one off-site except to SID / KIM / SAI", () => {
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  assert.doesNotMatch(fd, /View the factsheet/);
  assert.doesNotMatch(fd, /href=\{fundsList\.factsheetUrl\}/);
  assert.match(fd, /Holdings for this scheme have not been published here yet/);
  assert.match(fd, /href=\{fundsList\.documentsUrl\}/);
  assert.match(fd, /Scheme documents \(SID \/ KIM \/ SAI\)/);
  // Alpha / Beta say why they are missing.
  assert.match(fd, /ratios\?\.alphaBetaNa/);
});

test("#6 chart ranges longer than the history are hidden, not greyed out", () => {
  const chart = code("../src/components/chart/MFChart.jsx");
  assert.match(chart, /Object\.keys\(RANGES\)\s*\.filter\(fits\)/);
  assert.doesNotMatch(chart, /This fund has about/);
  const cmp = code("../src/pages/mutual_fund/CompareMF.jsx");
  assert.doesNotMatch(cmp, /These funds share about/);
});

test("#8 every rolling window is listed, the missing ones with the reason", () => {
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  assert.doesNotMatch(fd, /Object\.values\(fundsList\.rolling\)\.some\(Boolean\)/, "the card still vanishes on a young fund");
  assert.match(fd, /Needs \{years\} year/);
  assert.match(fd, /this fund started on \$\{started\}/);
});

test("#10 Compare shows each fund's age", () => {
  const ctrl = fs.readFileSync(new URL("../../Backend/src/controllers/StarMFController.js", import.meta.url), "utf8");
  const compare = ctrl.slice(ctrl.indexOf("compareSchemes = async"), ctrl.indexOf("compareSchemes = async") + 6000);
  assert.match(compare, /ageYears: extra\.ageYears \?\? null/);
  assert.match(compare, /ageYears: rest\.ageYears \?\? returns\.years \?\? null/);
});

test("#11 Explore: grouped filters, both sort directions, honest count, clear, and card actions", () => {
  const ex = code("../src/pages/mutual_fund/ExploreMF.jsx");
  for (const group of ["Category", "Risk", "Returns", "AUM", "Age", "Transaction"]) {
    assert.match(ex, new RegExp(`title: "${group}"`), `no ${group} filter group`);
  }
  for (const sort of ["aum:desc", "aum:asc", "nav:desc", "nav:asc"]) {
    assert.ok(ex.includes(`"${sort}"`), `sort ${sort} missing`);
  }
  // IDCW is its own control, no longer two options inside "Supports".
  assert.match(ex, /key: "idcw"/);
  assert.match(ex, /\[filters\.txn, filters\.idcw\]\.filter\(Boolean\)\.join\(","\)/);
  // Custom minimum fund size and minimum return, typed in.
  assert.match(ex, /key: "minAum"[^\n]*input: true/);
  assert.match(ex, /key: "minReturn"[^\n]*input: true/);
  // Category → sub-category from the catalogue's own facets.
  assert.match(ex, /data\?\.data\?\.facets/);
  assert.match(ex, /key: "schemeCategory"/);
  assert.match(ex, /key: "subCategory"/);
  // "0 schemes found", not "Loading catalogue…", when nothing matches.
  assert.doesNotMatch(ex, /funds\.length \? `\$\{total/);
  assert.match(ex, /schemes" \} found|"schemes"\} found/);
  assert.match(ex, /Clear filters/);
  // Same targets as the fund page's own buttons: its Invest Now modal, and the SIP setup page.
  assert.match(ex, /onClick=\{\(\) => invest\(fund\)\}/);
  assert.match(ex, /state: \{ code: f\.scheme_bse_code, buy: true \}/);
  assert.match(code("../src/pages/mutual_fund/FundDetails.jsx"), /useState\(\(\) => location\.state\?\.buy === true\)/);
  assert.match(ex, /fundSipPath\(f\.scheme_isin, f\.scheme_bse_code\)/);
  assert.match(ex, /<AddToBasket fund=\{fund\} \/>/);
  // Collections filter the list on the server instead of name-searching on another page.
  assert.match(ex, /setFilter\("category"/);
  assert.doesNotMatch(ex, /navigate\(`\/mutual_fund\/collections/);
});

test("#11 Search's MF/ETF/Growth/IDCW/Dividend tags reach the server as filters", () => {
  const popup = code("../src/components/SearchPopup.jsx");
  assert.doesNotMatch(popup, /fields: \[tag/);
  assert.match(popup, /txn: TAG_TXN\[tag\] \|\| ""/);
  assert.match(popup, /ETF: "etf", Growth: "growth", IDCW: "idcw_payout", Dividend: "idcw_reinvest"/);
});

test("Compliance #31: a Direct plan is labelled and never offered for purchase", async () => {
  // The predicate is the server's own (suitability: scheme.plan === "direct").
  const src = read("../src/components/FundBadges.jsx");
  assert.match(src, /export const DIRECT_NOT_OFFERED = "Direct plan — not offered by a distributor";/);
  assert.match(src, /String\(fund\?\.plan \|\| ""\)\.toLowerCase\(\) === "direct"/);

  // Explore opens on Regular plans and gives a Direct card the reason, not buy buttons.
  const ex = code("../src/pages/mutual_fund/ExploreMF.jsx");
  assert.match(ex, /plan: "regular",/);
  const card = ex.slice(ex.indexOf("isDirectPlan(fund) ?"), ex.indexOf("<AddToBasket fund={fund} />"));
  assert.match(card, /\{DIRECT_NOT_OFFERED\}/);
  assert.ok(card.indexOf("{DIRECT_NOT_OFFERED}") < card.indexOf("Invest Now"), "the Direct branch must come before the buy buttons");

  // The fund page: no Invest, SIP, calculator SIP or basket action on a Direct plan.
  const fd = code("../src/pages/mutual_fund/FundDetails.jsx");
  assert.match(fd, /const direct = isDirectPlan\(fundsList\);/);
  assert.match(fd, /\{direct \? \(\s*<p[^>]*>\s*\{DIRECT_NOT_OFFERED\}/);
  assert.equal((fd.match(/fundsList\?\.sip_allowed === true && !direct/g) || []).length, 2, "both SIP entry points must skip Direct plans");
  assert.match(fd, /fundsList\?\.name && !direct \? \(\s*<AddToBasket/);
  assert.match(fd, /\{!direct && \(\s*<button[\s\S]{0,200}setBuyModal\(true\)/);

  // Search says it before the fund is opened.
  assert.match(code("../src/components/SearchPopup.jsx"), /isDirectPlan\(asset\) && \(/);
});

test("#11 Add to basket: signed-out goes to login, signed-in creates a basket with the fund", () => {
  const btn = code("../src/components/AddToBasket.jsx");
  assert.match(btn, /if \(!token\) \{\s*navigate\("\/login"\)/);
  assert.match(btn, /laravelUrl\("\/baskets"\)/);
  assert.match(btn, /asset_type: "mutual_fund"/);
  assert.match(btn, /weight: 100/);
  assert.match(code("../src/pages/mutual_fund/FundDetails.jsx"), /<AddToBasket/);
});
