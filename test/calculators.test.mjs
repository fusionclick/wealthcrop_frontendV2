import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeTax, compareRegimes, fdMaturity, rentVsBuy, sipSeries } from "../src/utils/calculators.js";

test("new regime: 12.75L tak salaried ka tax zero", () => {
  // 12,75,000 − 75,000 std = 12,00,000 taxable → 60,000 slab tax → 87A rebate 60,000
  assert.equal(computeTax({ gross: 1275000, regime: "new" }).total, 0);
  assert.equal(computeTax({ gross: 1000000, regime: "new" }).total, 0);
});

test("new regime: 20L par 1,92,400", () => {
  const r = computeTax({ gross: 2000000, regime: "new" });
  assert.equal(r.taxable, 1925000);
  assert.equal(r.slab, 185000);
  assert.equal(r.total, 192400);
});

test("marginal relief: rebate limit ke thora upar tax extra income se zyada na ho", () => {
  // taxable 12,10,000 → slab tax 61,500, lekin relief 10,000 par cap karta hai
  const r = computeTax({ gross: 1285000, regime: "new" });
  assert.equal(r.taxable, 1210000);
  assert.equal(r.slab, 10000);
  assert.equal(r.total, 10400); // + 4% cess
});

test("old regime: 10L salary, 1.5L 80C → 75,400", () => {
  const r = computeTax({ gross: 1000000, regime: "old", deductions: 150000 });
  assert.equal(r.taxable, 800000);
  assert.equal(r.total, 75400);
});

test("old regime deductions new regime par lagu nahi hoti", () => {
  const withDed = computeTax({ gross: 2000000, regime: "new", deductions: 500000 });
  const without = computeTax({ gross: 2000000, regime: "new" });
  assert.equal(withDed.total, without.total);
});

test("surcharge 50L ke upar lagta hai", () => {
  assert.equal(computeTax({ gross: 4900000, regime: "new" }).surcharge, 0);
  assert.ok(computeTax({ gross: 6000000, regime: "new" }).surcharge > 0);
});

test("compareRegimes sasta regime chunta hai", () => {
  // Bina deductions ke new regime hamesha sasta
  assert.equal(compareRegimes({ gross: 1500000 }).better, "new");
  // Bhaari deductions par old jeet sakta hai
  const heavy = compareRegimes({ gross: 1500000, deductions: 500000 });
  assert.equal(heavy.saving, Math.abs(heavy.new.total - heavy.old.total));
});

test("tax kabhi manfi nahi, aur 0 income par 0", () => {
  const r = computeTax({ gross: 0 });
  assert.equal(r.total, 0);
  assert.equal(r.effectiveRate, 0);
});

test("rentVsBuy: sasta kiraya + strong market par kiraya jeetta hai", () => {
  // 1Cr ghar, sirf 15k kiraya: bacha hua paisa 12% par invest ho kar ghar se aage nikal jata hai.
  const r = rentVsBuy({ price: 10000000, rent: 15000, years: 20 });
  assert.equal(r.better, "rent");
  assert.ok(r.emi > 0 && r.homeValue > 10000000);
});

test("rentVsBuy: mehanga kiraya + tez appreciation par ghar behtar", () => {
  const r = rentVsBuy({ price: 10000000, rent: 70000, years: 20, appreciation: 10, invReturn: 8 });
  assert.equal(r.better, "buy");
});

test("rentVsBuy: mehanga ghar + strong market returns par kiraya behtar", () => {
  const r = rentVsBuy({ price: 10000000, rent: 60000, years: 20, appreciation: 3, invReturn: 14 });
  assert.equal(r.better, "rent");
  assert.equal(r.gap, Math.abs(r.homeValue - r.rentCorpus));
});

// Audit #69 — the FD page compounded once a year only; Indian banks compound quarterly.
test("FD: compounds quarterly by default, which pays more than yearly at the same rate", () => {
  const quarterly = fdMaturity({ amount: 100000, rate: 7, years: 5 });
  assert.equal(Math.round(quarterly.maturity), Math.round(100000 * 1.0175 ** 20));
  assert.equal(Math.round(quarterly.interest), Math.round(quarterly.maturity - 100000));
  // Yearly is exactly the page's old formula.
  assert.equal(fdMaturity({ amount: 100000, rate: 7, years: 5, perYear: 1 }).maturity, 100000 * 1.07 ** 5);
  const [yearly, half, quart, monthly] = [1, 2, 4, 12].map(
    (perYear) => fdMaturity({ amount: 100000, rate: 7, years: 5, perYear }).maturity
  );
  assert.ok(yearly < half && half < quart && quart < monthly, "more often compounds to more");
  // The <select> hands over a string.
  assert.equal(fdMaturity({ amount: 100000, rate: 7, years: 5, perYear: "12" }).maturity, monthly);
});

test("FD: 0% gives back the principal, and a twelve-digit tenure stays finite", () => {
  const flat = fdMaturity({ amount: 50000, rate: 0, years: 3, perYear: 4 });
  assert.equal(flat.maturity, 50000);
  assert.equal(flat.interest, 0, "0% is a real answer: no interest");
  const big = 999999999999;
  const r = fdMaturity({ amount: big, rate: big, years: big, perYear: 12 });
  assert.ok(Number.isFinite(r.maturity) && Number.isFinite(r.interest));
});

// Audit #69 — the SIP calculator only answered "what SIP does my goal need". The forward
// question — what does this SIP grow to — is the one most people bring.
test("SIP calculator answers both ways round, with a toggle between them", () => {
  const src = readFileSync("src/pages/calculators/SipCalculator.jsx", "utf8");
  assert.match(src, /sipForGoal\(/, "goal → monthly SIP is still there");
  assert.match(src, /sipSeries\(\{ monthly, years, cagr \}\)/, "monthly SIP → future value runs the same model as the chart");
  assert.match(src, /onClick=\{\(\) => setMode\(key\)\}/, "a toggle switches between them");
  for (const label of ["Future Value", "Total Invested", "Estimated Earnings"]) {
    assert.ok(src.includes(label), `forward mode must show ${label}`);
  }
  // The forward numbers are sipSeries' last point: 10k a month, 12%, 10 years.
  const last = sipSeries({ monthly: 10000, years: 10, cagr: 12 }).at(-1);
  assert.equal(last.value, 2300387);
  assert.equal(last.invested, 1200000);
});

test("rentVsBuy: rent har saal barhta hai", () => {
  const r = rentVsBuy({ price: 5000000, rent: 20000, years: 10, rentHike: 5 });
  assert.ok(r.lastRent > 20000);
});

// QA 10.3 re-report — "NOT FIXED GETS CRASH UI BREAKS".
//
// The output guards were already in place; the crash was upstream of them. Every horizon here
// bounds a loop and each clamped only a FLOOR, so years = 999999999 ran the loop a billion
// times and the tab died before anything could be rendered. These assert the loops are now
// bounded (by timing them) and that the results stay finite at both extremes.
test("a huge horizon returns immediately instead of freezing the tab", () => {
  const HUGE = 999999999;

  const t0 = Date.now();
  const series = sipSeries({ monthly: 5000, years: HUGE, cagr: 12 });
  const elapsed = Date.now() - t0;

  // A billion iterations cannot finish in a second; a clamped one finishes in milliseconds.
  assert.ok(elapsed < 1000, `sipSeries took ${elapsed}ms — the loop is still unbounded`);
  // Clamped to a century, so the series is bounded and every point is a real number.
  assert.ok(series.length <= 100, `got ${series.length} points`);
  assert.ok(series.every((p) => Number.isFinite(p.value) && Number.isFinite(p.invested)));
});

test("zero everywhere produces real numbers, not NaN", () => {
  const series = sipSeries({ monthly: 0, years: 0, cagr: 0 });
  assert.ok(series.every((p) => Number.isFinite(p.value) && Number.isFinite(p.invested)));
  // 0% growth over n deposits is worth exactly what went in — the limit, not a division by zero.
  const flat = sipSeries({ monthly: 1000, years: 2, cagr: 0 });
  assert.equal(flat.at(-1).value, flat.at(-1).invested);
});

test("a huge horizon never yields Infinity or NaN from any exported model", async () => {
  const mod = await import("../src/utils/calculators.js");
  const HUGE = 1e9;

  const finiteDeep = (v, path = "") => {
    if (typeof v === "number") {
      assert.ok(Number.isFinite(v), `${path} is ${v}`);
      return;
    }
    if (Array.isArray(v)) return v.forEach((x, i) => finiteDeep(x, `${path}[${i}]`));
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) finiteDeep(x, `${path}.${k}`);
    }
  };

  // Feed every model the same hostile shape: huge where a horizon goes, 0 where a rate goes.
  const hostile = {
    monthly: HUGE, years: HUGE, cagr: 0, rate: 0, months: HUGE, expenses: HUGE,
    buildMonths: HUGE, amount: HUGE, lumpsum: HUGE, target: HUGE, current: HUGE,
    salary: HUGE, basic: HUGE, hra: HUGE, rentPaid: HUGE, income: HUGE, deductions: 0,
    employeePct: 0, employerPct: 0, rent: HUGE, down: HUGE, price: HUGE, loan: HUGE,
    tenure: HUGE, invReturn: 0, rentHike: 0, monthlyMaint: 0, principal: HUGE, years_: HUGE,
  };

  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn !== "function") continue;
    let out;
    const t0 = Date.now();
    try {
      out = fn(hostile);
    } catch {
      continue; // a model that refuses a nonsense shape outright is fine
    }
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 1000, `${name} took ${elapsed}ms — unbounded loop`);
    finiteDeep(out, name);
  }
});
