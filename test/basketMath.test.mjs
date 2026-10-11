// Client 2026-10-09 — DIY basket builder rules.
import test from "node:test";
import assert from "node:assert/strict";
import { basketMinimum, basketProblem, weightTotal } from "../src/utils/basketMath.js";

test("the basket minimum is the largest min ÷ weight, not the largest min", () => {
  // ₹5,000 at 20% needs ₹25,000; ₹1,000 at 80% needs ₹1,250. The client's "highest minimum"
  // rule would say ₹5,000 — and that fund's ₹1,000 share would then be refused.
  const legs = [
    { min: 5000, weight: 20 },
    { min: 1000, weight: 80 },
  ];
  assert.equal(basketMinimum(legs), 25000);
});

test("a third of the basket rounds the minimum up to a whole rupee", () => {
  assert.equal(basketMinimum([{ min: 500, weight: 33.33 }, { min: 500, weight: 66.67 }]), 1501);
});

test("unknown minimums do not invent one", () => {
  assert.equal(basketMinimum([{ min: 0, weight: 50 }, { weight: 50 }]), 0);
});

test("2 to 5 schemes, every weight above zero, totalling exactly 100", () => {
  assert.match(basketProblem([{ weight: 100 }]), /at least 2/);
  assert.match(basketProblem(Array.from({ length: 6 }, () => ({ weight: 100 / 6 }))), /at most 5/);
  assert.match(basketProblem([{ weight: 0 }, { weight: 100 }]), /above 0%/);
  assert.match(basketProblem([{ weight: 60 }, { weight: 30 }]), /90%/);
  assert.equal(basketProblem([{ weight: 33.33 }, { weight: 33.33 }, { weight: 33.34 }]), null);
  assert.equal(weightTotal([{ weight: 33.33 }, { weight: 33.33 }, { weight: 33.34 }]), 100);
});
