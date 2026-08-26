import test from "node:test";
import assert from "node:assert/strict";
import { computeTax, compareRegimes, rentVsBuy } from "../src/utils/calculators.js";

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

test("rentVsBuy: rent har saal barhta hai", () => {
  const r = rentVsBuy({ price: 5000000, rent: 20000, years: 10, rentHike: 5 });
  assert.ok(r.lastRent > 20000);
});
