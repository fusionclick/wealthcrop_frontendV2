import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  apiErrorMessage,
  fundBuyPath,
  fundPath,
  mapXspToSip,
  MF_EXPLORE_PATH,
  xspItems,
} from "../src/utils/nodeApi.js";

test("reads the documented BSE SIP list response", () => {
  const response = { status: "success", data: { lists: [{ reg_no: "SIP-1" }] } };
  assert.deepEqual(xspItems(response), [{ reg_no: "SIP-1" }]);
});

test("maps BSE SIP fields used by the live response", () => {
  const sip = mapXspToSip({
    reg_no: "SIP-1",
    src_scheme: "8130-GR",
    amount: 2500,
    freq: "m",
    status: "reg",
    next_due_date: "2026-09-05",
    total_amt_paid: 5000,
  });

  assert.equal(sip.schemeName, "8130-GR");
  assert.equal(sip.status, "REG");
  assert.equal(sip.nextInstallment, "2026-09-05");
  assert.equal(sip.investedSoFar, 5000);
});

test("turns auth proxy reasons into actionable messages", () => {
  assert.match(
    apiErrorMessage({ response: { data: { reason: "token_rejected", message: "Unauthorized" } } }),
    /sign in again/i
  );
  assert.match(
    apiErrorMessage({ response: { data: { reason: "upstream_unreachable", message: "Unauthorized" } } }),
    /try again/i
  );
});

test("logo and root route open the landing page without clearing the session", () => {
  const header = fs.readFileSync(new URL("../src/components/OldHeader.jsx", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(header, /<Link to="\/"/);
  assert.match(app, /path="\/"\s+element=\{<Home\s*\/>\}/s);
});

// A React Router dynamic segment never matches an empty string, so `/mutual_fund//X/buy`
// fell through to the catch-all 404. Portfolio rows carry only the BSE code (BSE
// order_list sends no ISIN), which is exactly the case that used to break.
test("fund URLs never emit an empty dynamic segment", () => {
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  // Turn the declared routes into matchers so the assertion proves the real route table.
  const toRe = (p) => new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}$`);
  assert.match(app, /path="\/mutual_fund\/:isin\/:code\/buy"/);
  assert.match(app, /path="\/mutual_fund\/:isin\/:code"/);
  const buyRoute = toRe("/mutual_fund/:isin/:code/buy");
  const detailRoute = toRe("/mutual_fund/:isin/:code");

  // Code only — the combined-portfolio "Invest more" row.
  assert.equal(fundBuyPath("", "PPCH-GR"), "/mutual_fund/PPCH-GR/PPCH-GR/buy");
  assert.match(fundBuyPath("", "PPCH-GR"), buyRoute);
  assert.match(fundPath("", "PPCH-GR"), detailRoute);

  // ISIN only.
  assert.match(fundBuyPath("INF879O01019", ""), buyRoute);
  assert.match(fundPath("INF879O01019", ""), detailRoute);

  // Both present — unchanged behaviour.
  assert.equal(fundPath("INF879O01019", "PPCH-GR"), "/mutual_fund/INF879O01019/PPCH-GR");
  assert.match(fundBuyPath("INF879O01019", "PPCH-GR"), buyRoute);

  // Neither — send the investor somewhere real, not to a 404.
  assert.equal(fundPath("", ""), MF_EXPLORE_PATH);
  assert.equal(fundBuyPath("", ""), MF_EXPLORE_PATH);
  assert.match(app, /path="explore" element=\{<ExploreMF \/>\}/);
});

test("no mutual-fund chart renders invented data", () => {
  const fd = fs.readFileSync("src/pages/mutual_fund/FundDetails.jsx", "utf8");

  // Holdings, the equity/cash donut and the sector donut all came from a backend helper
  // that returned constants — the same seven sector weights for every equity scheme in
  // the catalogue, and holdings literally named "Financial basket". The backend returns
  // [] now, so each section must be guarded or the page shows a heading over nothing.
  for (const key of ["holdings", "assetSplit", "sectors"]) {
    assert.ok(
      fd.includes(`(fundsList?.${key} || []).length ? (`),
      `${key} section must hide itself when empty`
    );
  }

  // Alpha was (return - 0.12) against an invented benchmark, Beta was volatility / 0.16,
  // and Top 5 / Top 20 summed the fabricated holdings. None may come back as a tile.
  for (const gone of ["ratios?.alpha", "ratios?.beta", "ratios?.top5", "ratios?.top20"]) {
    assert.equal(fd.includes(gone), false, `${gone} is not measurable — it must stay out`);
  }

  // What replaced them is computed from the published NAV series.
  for (const real of ["ratios?.volatility", "ratios?.sharpe", "ratios?.sortino", "ratios?.maxDrawdown"]) {
    assert.ok(fd.includes(real), `${real} missing`);
  }
  // A Sharpe ratio is meaningless without the rate it is measured against.
  assert.match(fd, /ratios\?\.riskFreeRate/);
  // Only measured metrics become tiles, and no tiles means no empty panel.
  assert.match(fd, /\.filter\(\(m\) => m\.value != null\)/);
  assert.match(fd, /\{fundamentals\.length \? \(/);

  // The NAV chart is the one chart with a real source; it must stay wired to the series
  // the backend fetches, not to a locally generated one.
  assert.match(fd, /series=\{details\?\.data\?\.chartData \|\| \[\]\}/);
  assert.match(fd, /synthetic=\{!!details\?\.data\?\.synthetic\}/);
});

test("portfolio pies aggregate real holdings, not fixtures", () => {
  // These two charts were always real: they bucket the investor's own rows by category.
  // The assertion pins that they read from the merged portfolio rather than a constant.
  for (const file of ["src/pages/mutual_fund/DashBoardMF.jsx", "src/pages/mutual_fund/CombinedMF.jsx"]) {
    const src = fs.readFileSync(file, "utf8");
    assert.match(src, /const allocation = useMemo\(/, `${file}: allocation must be derived`);
    assert.match(src, /(funds\.forEach|combined\.rows\.forEach)/, `${file}: from real rows`);
    assert.doesNotMatch(src, /allocation = \[\s*\{/, `${file}: no hardcoded allocation`);
  }
});

test("a SIP can be set up for a specific fund, and survives a refresh", async () => {
  const { fundSipPath, MF_EXPLORE_PATH } = await import("../src/utils/nodeApi.js");
  const app = fs.readFileSync("src/App.jsx", "utf8");
  const fd = fs.readFileSync("src/pages/mutual_fund/FundDetails.jsx", "utf8");
  const sip = fs.readFileSync("src/pages/mutual_fund/SIPSetupPage.jsx", "utf8");

  // The scheme must be in the URL. Router state alone dies on reload, which is why the
  // page previously lost the fund and posted an empty src_scheme to BSE.
  assert.match(app, /path="\/mutual_fund\/:isin\/:code\/sip"/);
  const sipRoute = new RegExp(`^${"/mutual_fund/:isin/:code/sip".replace(/:[^/]+/g, "[^/]+")}$`);
  assert.match(fundSipPath("INF200K01214", "007G"), sipRoute);
  assert.match(fundSipPath("", "007G"), sipRoute, "code only still resolves");
  assert.match(fundSipPath("INF200K01214", ""), sipRoute, "ISIN only still resolves");
  assert.equal(fundSipPath("", ""), MF_EXPLORE_PATH, "no fund, nowhere to set up a SIP");

  // Two entry points on the fund page, both gated on BSE saying the scheme takes a SIP.
  assert.equal((fd.match(/fundSipPath\(/g) || []).length, 2, "Start SIP button + calculator");
  assert.equal((fd.match(/fundsList\?\.sip_allowed === true/g) || []).length, 2);
  assert.match(fd, /Start SIP/);
  assert.match(fd, /Start this SIP/);

  // The page falls back to fetching the scheme when it was not handed one.
  assert.match(sip, /const \{ isin, code \} = useParams\(\)/);
  assert.match(sip, /scheme_code: code/);
  // And it cannot submit an amount below the fund's own minimum.
  assert.match(sip, /Number\(amount\) < minSip/);
  assert.match(sip, /!installments/);
  // Intent only — the BSE payload is the server's job now. Match assignments, not the
  // word: the comment explaining the old bug legitimately mentions src_scheme.
  assert.doesNotMatch(sip, /member:\s*"91010"/);
  assert.doesNotMatch(sip, /src_scheme:/);
  assert.doesNotMatch(sip, /investor:\s*\{\s*ucc/);
  assert.match(sip, /scheme: fund\.scheme_bse_code/);
});

test("SIP date and start date can never be sent out of step", () => {
  // The live 502: SIP date "5th of every month" with a start date of the 10th. BSE ties
  // the two together (invalid_txn_date, msgid 3809) and there is no minimum notice
  // period, so the fix is to keep them in step rather than to push the start date out.
  const sip = fs.readFileSync("src/pages/mutual_fund/SIPSetupPage.jsx", "utf8");
  assert.match(sip, /const nextOccurrence = \(day, from = new Date\(\)\) =>/);
  // Both directions: picking a SIP day moves the start date, and vice versa.
  assert.match(sip, /const pickSipDay = \(day\) => \{[\s\S]*?setStartDate\(nextOccurrence\(day\)\)/);
  assert.match(sip, /const pickStartDate = \(value\) => \{[\s\S]*?setSipDay\(day\)/);
  // Neither control may still write its own state directly, or they drift apart again.
  assert.doesNotMatch(sip, /onChange=\{\(e\) => setSipDay\(/);
  assert.doesNotMatch(sip, /onChange=\{\(e\) => setStartDate\(/);
  // A 29th-31st start has no monthly equivalent and BSE's SIP dates stop at 28.
  assert.match(sip, /startDayTooLate/);
  assert.match(sip, /disabled=\{[^}]*startDayTooLate\}/);
});
