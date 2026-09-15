import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { titleCase, fmtPct, fmtAge, fmtDate, displayIdentifier } from "../src/utils/schemeName.js";
import { RANGES, spanDays, toReturnSeries, bucketSeries } from "../src/components/chart/navSeries.js";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

test("ticket 1: scheme names render in Title Case, acronyms intact", () => {
  assert.equal(
    titleCase("HDFC BALANCED ADVANTAGE FUND REGULAR PLAN IDCW PAYOUT"),
    "HDFC Balanced Advantage Fund Regular Plan IDCW Payout"
  );
  assert.equal(
    titleCase("SBI ESG EXCLUSIONARY STRATEGY FUND REGULAR IDCW PAYOUT"),
    "SBI ESG Exclusionary Strategy Fund Regular IDCW Payout"
  );
  // AMC names that are words, not acronyms, must NOT stay shouted.
  assert.equal(titleCase("KOTAK FLEXICAP FUND"), "Kotak Flexicap Fund");
  assert.equal(titleCase("TATA SMALL CAP FUND"), "Tata Small Cap Fund");
  assert.equal(titleCase("ICICI PRUDENTIAL ELSS TAX SAVER"), "ICICI Prudential ELSS Tax Saver");
  // Short all-caps runs are acronyms in this domain.
  assert.equal(titleCase("LIC MF GOLD ETF"), "LIC MF Gold ETF");
  assert.equal(titleCase("JM FINANCIAL LARGE CAP"), "JM Financial Large Cap");
  // Joiners stay lower-case unless they open the name.
  assert.equal(titleCase("BANK OF INDIA FLEXI CAP"), "Bank of India Flexi Cap");
  // Separators keep both halves capitalised.
  assert.equal(titleCase("SMALL-CAP FUND"), "Small-Cap Fund");
  // Already mixed case came from somewhere that formatted it — do not re-case it.
  assert.equal(titleCase("Parag Parikh Flexi Cap Fund"), "Parag Parikh Flexi Cap Fund");
  // Empty / missing is empty, never "undefined".
  assert.equal(titleCase(null), "");
  assert.equal(titleCase(undefined), "");
});

test("ticket 1: the investor-facing identifier is the ISIN, never the BSE code", () => {
  assert.equal(displayIdentifier({ scheme_isin: "INF200K01198", scheme_bse_code: "007-DP" }), "INF200K01198");
  assert.equal(displayIdentifier({ scheme_bse_code: "007-DP" }), null, "a bare BSE code is not a display identifier");

  // The three places that used to print "Scheme code" now print the ISIN. The code itself
  // still exists in these files — it drives the buy/redeem/SIP links — so this asserts on
  // the LABEL, not on the variable.
  for (const file of [
    "../src/pages/mutual_fund/FundDetails.jsx",
    "../src/pages/mutual_fund/SIPSetupPage.jsx",
    "../src/components/mutual_fund/HoldingSheet.jsx",
  ]) {
    const code = readCode(file);
    assert.equal(/["'>]Scheme code/.test(code), false, `${file} still labels something "Scheme code"`);
    assert.ok(/ISIN/.test(code), `${file} should show the ISIN instead`);
  }
});

test("ticket 1: percentages say p.a. only when they are annualised", () => {
  assert.equal(fmtPct(12.3456), "12.35%");
  assert.equal(fmtPct(12.3456, { annualised: true }), "12.35% p.a.");
  assert.equal(fmtPct(5, { sign: true }), "+5.00%");
  assert.equal(fmtPct(-5, { sign: true }), "-5.00%");
  // Unknown is a dash, not 0.00%.
  assert.equal(fmtPct(null), "—");
  assert.equal(fmtPct(undefined), "—");
  assert.equal(fmtPct("abc"), "—");
  assert.equal(fmtPct(0), "0.00%", "a real zero is a fact and still prints");
});

test("fund age and dates degrade to null rather than 'Invalid Date'", () => {
  assert.equal(fmtAge(8.4), "8.4 years");
  assert.equal(fmtAge(0.5), "6 months");
  assert.equal(fmtAge(null), null);
  assert.equal(fmtDate("2013-05-24"), "24 May 2013");
  assert.equal(fmtDate("not-a-date"), null);
  assert.equal(fmtDate(null), null);
});

test("ticket 6: 10Y exists as a range, and is offered only when the history covers it", () => {
  assert.equal(RANGES["10Y"], 3650);
  // Ranges are ordered shortest to longest, which is what the auto-fallback relies on.
  const keys = Object.keys(RANGES);
  assert.deepEqual(keys, ["1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "10Y", "ALL"]);

  const day = 86400;
  const now = 1_780_000_000;
  const series = (days) =>
    Array.from({ length: days + 1 }, (_, i) => ({ timestamp: now - (days - i) * day, nav: 100 + i * 0.01 }));

  assert.equal(Math.round(spanDays(series(4000))), 4000);
  assert.equal(spanDays([]), 0);
  assert.equal(spanDays([{ timestamp: now, nav: 10 }]), 0, "one point is not a span");

  // The guard the chart uses: 10Y needs ~10 years of NAV.
  const usable = (s, r) => RANGES[r] === Infinity || spanDays(s) >= RANGES[r] * 0.9;
  assert.equal(usable(series(4000), "10Y"), true);
  assert.equal(usable(series(1500), "10Y"), false);
  assert.equal(usable(series(1500), "3Y"), true);
  assert.equal(usable(series(1500), "ALL"), true);
});

test("ticket 7: Absolute and CAGR are computed from the NAV series, not hardcoded", () => {
  const day = 86400;
  const now = 1_780_000_000;
  // Three years, compounding at exactly 10% a year.
  const series = Array.from({ length: 3 * 365 + 1 }, (_, i) => ({
    timestamp: now - (3 * 365 - i) * day,
    nav: 100 * Math.pow(1.1, i / 365),
  }));

  const abs = toReturnSeries(series, "absolute");
  assert.equal(abs[0].value, 0, "an absolute line starts at 0%");
  assert.ok(Math.abs(abs[abs.length - 1].value - 33.1) < 0.5, "3 years at 10% is ~33.1% absolute");

  const cagr = toReturnSeries(series, "cagr");
  assert.ok(Math.abs(cagr[cagr.length - 1].value - 10) < 0.2, "the same series is ~10% p.a.");
  // The first year is skipped: annualising a partial year is how 3% in a fortnight becomes
  // several hundred percent "p.a.".
  assert.ok(cagr.length < abs.length);
  assert.ok((cagr[0].timestamp - series[0].timestamp) / day >= 365);

  assert.deepEqual(toReturnSeries([], "absolute"), []);
  assert.deepEqual(toReturnSeries([{ timestamp: now, nav: 10 }], "absolute"), []);
  // A zero base cannot be rebased, and must not produce Infinity.
  assert.deepEqual(toReturnSeries([{ timestamp: now - day, nav: 0 }, { timestamp: now, nav: 5 }], "absolute"), []);
});

test("existing NAV bucketing is untouched by the new range", () => {
  const day = 86400;
  const now = 1_780_000_000;
  const series = Array.from({ length: 400 }, (_, i) => ({ timestamp: now - (399 - i) * day, nav: 100 + i }));
  assert.equal(bucketSeries(series, "1Y", "D").length > 300, true);
  assert.equal(bucketSeries(series, "1W", "D").length <= 8, true);
  assert.equal(bucketSeries(series, "1Y", "M").length <= 14, true);
});

test("ticket 9: the Mutual Fund combos rail and its API call are gone", () => {
  const code = readCode("../src/pages/mutual_fund/ExploreMF.jsx");
  assert.equal(/MF_COMBOS/.test(code), false, "the combos query is still there");
  assert.equal(/\/baskets`/.test(code), false, "Explore still fetches baskets");
  assert.equal(/getApiWithToken/.test(code), false, "the authenticated combos fetch is still imported");
  assert.equal(/combos/.test(code), false, "combos still referenced in code");
  // Baskets themselves were not part of the ticket and must still exist.
  assert.ok(fs.existsSync(new URL("../src/pages/basket/CreateBasket.jsx", import.meta.url)));
});

test("ticket 10: the compare route is registered above the dynamic fund route", () => {
  const app = read("../src/App.jsx");
  const compareAt = app.indexOf('path="/mutual_fund/compare"');
  const dynamicAt = app.indexOf('path="/mutual_fund/:isin/:code"');
  assert.ok(compareAt > 0, "/mutual_fund/compare is not routed");
  assert.ok(dynamicAt > 0, "the dynamic fund route disappeared");
  assert.ok(
    compareAt < dynamicAt,
    "/mutual_fund/compare must be declared before /:isin/:code, or 'compare' is matched as an ISIN"
  );
  // And Explore must actually link to it.
  assert.ok(/\/mutual_fund\/compare\?funds=/.test(read("../src/pages/mutual_fund/ExploreMF.jsx")));
});

test("ticket 11: Explore asks the server to filter and rank, not just this page", () => {
  const code = readCode("../src/pages/mutual_fund/ExploreMF.jsx");
  // The old sort ran over the 20 rows already fetched and had to say so in its own label.
  assert.equal(/sorted on this page/.test(code), false, "page-only sorting is still advertised");
  for (const key of ["risk", "txn", "minAge", "sort", "order"]) {
    assert.ok(new RegExp(`\\b${key}\\b`).test(code), `Explore never sends ${key} to the API`);
  }
  // Sort changes must reset paging, or page 7 of the old order is requested in the new one.
  assert.ok(/setPage\(0\);\s*setSort/.test(code), "changing the sort must reset to page 1");
});
