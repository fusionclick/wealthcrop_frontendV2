import test from "node:test";
import assert from "node:assert/strict";
import * as valuation from "../src/utils/portfolioAnalytics.js";
const { fundValue, fundPortfolioValue } = valuation;
import { mergePortfolio, calcAbsoluteReturn } from "../src/utils/nodeApi.js";

test("missing or invalid NAV valuation stays unknown instead of becoming investment cost", () => {
  for (const current_value of [null, undefined, "", NaN, Infinity, -1]) {
    assert.equal(fundValue({ current_value, inv_amo: 18000, nav: 50.9 }), null);
  }
  assert.equal(fundValue({ current_value: 0, inv_amo: 18000 }), 0, "a real zero is not missing");
  assert.equal(fundValue({ current_value: "33827.39" }), 33827.39);
});

test("one unpriced holding makes the portfolio's valuation and return unavailable", () => {
  const funds = [{ inv_amo: 26000, current_value: 33827.39 }, { inv_amo: 18000, current_value: null }];
  assert.equal(fundPortfolioValue(funds), null);
  assert.equal(calcAbsoluteReturn(funds), null);
  assert.equal(fundPortfolioValue([funds[0]]), 33827.39);
  assert.equal(calcAbsoluteReturn([funds[0]]), "30.11");
});

test("two folios in one scheme sum valuations; one unpriced folio stays unknown", () => {
  const base = { scheme_bse_code: "ABC-GR", inv_amo: 1000, units: 10 };
  assert.equal(mergePortfolio([], [{ ...base, current_value: 1100 }, { ...base, current_value: 1200 }])[0].current_value, 2300);
  assert.equal(mergePortfolio([], [{ ...base, current_value: 1100 }, { ...base, current_value: null }])[0].current_value, null);
});
