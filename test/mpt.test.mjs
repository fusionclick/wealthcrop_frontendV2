import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ASSUMPTIONS,
  covarianceMatrix,
  portfolioVariance,
  projectToSimplex,
  optimise,
  efficientFrontier,
  optimiseAroundGlidePath,
  roundToHundred,
  LAMBDA,
} from "../src/utils/mpt.js";

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const KEYS = DEFAULT_ASSUMPTIONS.keys;

test("the covariance matrix is symmetric with variances on the diagonal", () => {
  const cov = covarianceMatrix();
  for (let i = 0; i < KEYS.length; i += 1) {
    assert.ok(Math.abs(cov[i][i] - DEFAULT_ASSUMPTIONS.sigma[KEYS[i]] ** 2) < 1e-12);
    for (let j = 0; j < KEYS.length; j += 1) {
      assert.ok(Math.abs(cov[i][j] - cov[j][i]) < 1e-12);
    }
  }
});

test("projection lands on the simplex and inside the bounds", () => {
  const w = projectToSimplex([2, -1, 0.5, 0.9], [0, 0, 0, 0], [1, 1, 1, 1]);
  assert.ok(Math.abs(sum(w) - 1) < 1e-9);
  assert.ok(w.every((x) => x >= -1e-9 && x <= 1 + 1e-9));
});

test("projection respects a floor, rather than re-normalising past it", () => {
  // Naive clamp-then-divide would push the 0.3 floor back down to ~0.23.
  const w = projectToSimplex([0.1, 0.1, 0.1, 0.1], [0.3, 0, 0, 0], [1, 1, 1, 1]);
  assert.ok(Math.abs(sum(w) - 1) < 1e-9);
  assert.ok(w[0] >= 0.3 - 1e-9, `floor not respected: ${w[0]}`);
});

test("bounds that cannot reach 100% are reported, not fudged", () => {
  assert.equal(projectToSimplex([0.5, 0.5], [0.6, 0.6], [1, 1]), null);
  assert.equal(projectToSimplex([0.5, 0.5], [0, 0], [0.2, 0.2]), null);
});

test("an optimised portfolio is long-only and fully invested", () => {
  const p = optimise({ lambda: 5 });
  const w = KEYS.map((k) => p.weights[k]);
  assert.ok(Math.abs(sum(w) - 1) < 1e-6);
  assert.ok(w.every((x) => x >= -1e-9));
});

test("more risk aversion means less equity", () => {
  const bold = optimise({ lambda: 1 }).weights.equity;
  const middling = optimise({ lambda: 5 }).weights.equity;
  const timid = optimise({ lambda: 30 }).weights.equity;
  assert.ok(bold > middling, `${bold} should exceed ${middling}`);
  assert.ok(middling > timid, `${middling} should exceed ${timid}`);
});

test("a very high risk aversion approaches the minimum-variance portfolio", () => {
  const cov = covarianceMatrix();
  const p = optimise({ lambda: 500 });
  const w = KEYS.map((k) => p.weights[k]);
  const v = portfolioVariance(w, cov);

  // Nothing else we try may have lower variance, within tolerance.
  const candidates = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0.25, 0.25, 0.25, 0.25],
    [0, 0.5, 0, 0.5],
  ];
  for (const c of candidates) {
    assert.ok(v <= portfolioVariance(c, cov) + 1e-6, `found a lower-variance portfolio than the optimiser's`);
  }
});

test("the optimiser beats the equal-weight portfolio on its own utility", () => {
  const lambda = 5;
  const cov = covarianceMatrix();
  const p = optimise({ lambda });

  const equal = [0.25, 0.25, 0.25, 0.25];
  const equalRet = KEYS.reduce((s, k, i) => s + equal[i] * DEFAULT_ASSUMPTIONS.mu[k], 0);
  const equalUtility = equalRet - (lambda / 2) * portfolioVariance(equal, cov);

  assert.ok(p.utility >= equalUtility - 1e-9, `${p.utility} should be at least ${equalUtility}`);
});

test("a dominated asset gets no money", () => {
  // Same volatility as equity, lower return, perfectly correlated: nothing can justify it.
  const assumptions = {
    keys: ["equity", "dud", "cash"],
    mu: { equity: 0.12, dud: 0.05, cash: 0.06 },
    sigma: { equity: 0.18, dud: 0.18, cash: 0.01 },
    correlation: { "equity:dud": 1, "equity:cash": 0, "dud:cash": 0 },
  };
  const p = optimise({ lambda: 3, assumptions });
  assert.ok(p.weights.dud < 0.01, `dominated asset got ${p.weights.dud}`);
});

test("box bounds are honoured exactly", () => {
  const p = optimise({ lambda: 1, bounds: { equity: [0, 0.3], cash: [0.1, 1] } });
  assert.ok(p.weights.equity <= 0.3 + 1e-6, `equity ${p.weights.equity} broke its ceiling`);
  assert.ok(p.weights.cash >= 0.1 - 1e-6, `cash ${p.weights.cash} broke its floor`);
});

test("the frontier rises: more volatility buys more return", () => {
  const curve = efficientFrontier({ points: 10 });
  assert.ok(curve.length >= 5);
  for (let i = 1; i < curve.length; i += 1) {
    assert.ok(
      curve[i].ret >= curve[i - 1].ret - 1e-6,
      `return fell from ${curve[i - 1].ret} to ${curve[i].ret} as volatility rose`
    );
  }
});

test("the optimiser stays inside the glide path's band", () => {
  const glide = { equity: 60, debt: 30, gold: 5, cash: 5 };
  const r = optimiseAroundGlidePath(glide, "Moderate", { slack: 10 });

  assert.ok(r, "no solution inside the band");
  assert.equal(sum(Object.values(r.weights)), 100);
  for (const k of KEYS) {
    assert.ok(
      Math.abs(r.weights[k] - glide[k]) <= 10 + 1,
      `${k} moved ${r.weights[k] - glide[k]} points, outside the 10-point band`
    );
  }
});

test("a conservative investor is not optimised into an aggressive portfolio", () => {
  const glide = { equity: 20, debt: 65, gold: 10, cash: 5 };
  const r = optimiseAroundGlidePath(glide, "Conservative", { slack: 10 });
  // The whole point of combining the two: MPT cannot override suitability.
  assert.ok(r.weights.equity <= 30, `equity reached ${r.weights.equity}% for a conservative investor`);
});

test("risk aversion ordering is conservative > moderate > aggressive", () => {
  assert.ok(LAMBDA.Conservative > LAMBDA.Moderate);
  assert.ok(LAMBDA.Moderate > LAMBDA.Aggressive);
});

test("an aggressive investor ends with more equity than a conservative one", () => {
  const a = optimiseAroundGlidePath({ equity: 85, debt: 5, gold: 5, cash: 5 }, "Aggressive", { slack: 10 });
  const c = optimiseAroundGlidePath({ equity: 20, debt: 65, gold: 10, cash: 5 }, "Conservative", { slack: 10 });
  assert.ok(a.weights.equity > c.weights.equity);
});

test("rounding to whole percentages still totals 100", () => {
  assert.equal(sum(roundToHundred([33.33, 33.33, 33.34])), 100);
  assert.equal(sum(roundToHundred([0.4, 0.3, 99.3])), 100);
  assert.equal(sum(roundToHundred([25, 25, 25, 25])), 100);
});

test("the Sharpe ratio is positive for any sane allocation", () => {
  const r = optimiseAroundGlidePath({ equity: 60, debt: 30, gold: 5, cash: 5 }, "Moderate");
  assert.ok(r.sharpe > 0, `sharpe was ${r.sharpe}`);
});

test("the same inputs always give the same answer", () => {
  const a = optimiseAroundGlidePath({ equity: 60, debt: 30, gold: 5, cash: 5 }, "Moderate");
  const b = optimiseAroundGlidePath({ equity: 60, debt: 30, gold: 5, cash: 5 }, "Moderate");
  assert.deepEqual(a.weights, b.weights);
});
